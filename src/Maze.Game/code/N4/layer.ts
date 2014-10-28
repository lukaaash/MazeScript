/// <reference path="common.ts" />
/// <reference path="game.ts" />
/// <reference path="buffer.ts" />
/// <reference path="shader.ts" />
/// <reference path="material.ts" />
/// <reference path="texture.ts" />
/// <reference path="atlas.ts" />

module N4 {
    var VBO_TILE_SIZE = 4 * 4;
    var VBO_TILE_BYTESIZE = VBO_TILE_SIZE * 4;
    var VBO_MAX_CAPACITY = 16 * 16;
    var VBO_INITIAL_CAPACITY = VBO_MAX_CAPACITY / 8;
    var EMPTY = 0xFFFF;

    class LayerBlock {

        //TODO: add offline mode (only allocate VBO if needed)
        //TODO: add support for empty VBO (that are only allocated when enlarged)
        //TODO: remove the VBO if empty

        // a 16x16 grid of tiles - loword stores tile index, hiword stores VBO index
        _tiles: Int32Array; // VBO_MAX_CAPACITY
        _map: Array<number>; // array of integers - maps tiles in _vbo back to their offset in _tile

        _vbo: Buffer;
        _buffer: Float32Array;
        _capacity: number;

        _offsetX: number;
        _offsetY: number;
        _tileWidth: number;
        _tileHeight: number;

        constructor(offsetX: number, offsetY: number, tileWidth: number, tileHeight: number) {
            this._offsetX = offsetX * 16 * tileWidth;
            this._offsetY = offsetY * 16 * tileHeight;
            this._tileWidth = tileWidth;
            this._tileHeight = tileHeight;

            this._tiles = new Int32Array(VBO_MAX_CAPACITY);
            for (var i = 0; i < this._tiles.length; i++) {
                this._tiles[i] = EMPTY;
            }
            this._map = [];

            this._vbo = new Buffer(gl.ARRAY_BUFFER, VBO_TILE_BYTESIZE * VBO_INITIAL_CAPACITY, false);
            this._buffer = new Float32Array(VBO_MAX_CAPACITY * VBO_TILE_BYTESIZE);
            this._capacity = VBO_INITIAL_CAPACITY;
        }

        setBufferTile(offset: number, x: number, y: number, tile: Tile) {
            x *= this._tileWidth;
            y *= this._tileHeight;
            offset *= VBO_TILE_SIZE;
            this._buffer.set(tile._tile, offset);

            for (var i = 0; i < 4; i++) {
                this._buffer[offset++] += x + this._offsetX;
                this._buffer[offset++] += y + this._offsetY;
                offset += 2;
            }

            /*
        
            var tw = 32;
            var th = 32;
            x *= tw;
            y *= th;

            var s = 0;
            var t = 0;
            var w = 16;
            var h = 16;

            this._buffer.set([
                x, y, s, t,
                x + tw, y, s + w, t,
                x, y + th, s, t + h,
                x + tw, y + th, s + w, t + h,
            ], offset * VBO_TILE_SIZE);
            */
        }

        getTileId(x: number, y: number) {
            if ((x & ~0xF) != 0 || (y & ~0xF) != 0)
                return EMPTY;

            return this._tiles[(y << 4) + x] & 0xFFFF;
        }

        setTile(x: number, y: number, tile: Tile) {

            if ((x & ~0xF) != 0 || (y & ~0xF) != 0)
                return;

            var tileId;
            if (tile == null)
                tileId = EMPTY;
            else
                tileId = tile._id;

            if (tileId < 0 || tileId > 0x7FFF)
                tileId = EMPTY;

            var n = (y << 4) + x;
            var current = this._tiles[n] & 0xFFFF;

            if (current == tileId)
                return;

            var currentOffset = this._tiles[n] >> 16;

            if (current == EMPTY) {
                // add a tile

                var offset = this._map.length;
                var capacity = this._capacity;
                if (offset == capacity) {
                    // enlarge and recreate VBO if full

                    var newCapacity = capacity * 2;
                    this._vbo.resize(VBO_TILE_BYTESIZE * newCapacity);
                    this._capacity = newCapacity;

                    this.setBufferTile(offset, x, y, tile);
                    this._vbo.update(0, this._buffer.subarray(0, (offset + 1) * VBO_TILE_SIZE));

                } else {
                    // add a tile

                    this.setBufferTile(offset, x, y, tile);
                    var pos = offset * VBO_TILE_SIZE;
                    this._vbo.update(pos * 4, this._buffer.subarray(pos, pos + VBO_TILE_SIZE));
                }

                this._map.push(n);
                this._tiles[n] = (offset << 16) + tileId;
            } else {
                if (tileId == EMPTY) {
                    // remove a tile
                    // (move the last tile to its position; unless actually removing the last tile)

                    var b = this._map.pop();
                    if (n != b) {
                        tileId = this._tiles[b] & 0xFFFF;
                        this._tiles[b] = (currentOffset << 16) + tileId;

                        var offset = this._map.length * VBO_TILE_SIZE;
                        var pos = currentOffset * VBO_TILE_SIZE;

                        this._buffer.set(this._buffer.subarray(offset, offset + VBO_TILE_SIZE), pos);
                        this._vbo.update(pos * 4, this._buffer.subarray(pos, pos + VBO_TILE_SIZE));
                        this._map[currentOffset] = b;
                    }
                    this._tiles[n] = EMPTY;
                } else {
                    // change a tile

                    this.setBufferTile(currentOffset, x, y, tile);
                    var pos = currentOffset * VBO_TILE_SIZE;
                    this._vbo.update(pos * 4, this._buffer.subarray(pos, pos + VBO_TILE_SIZE));
                    this._tiles[n] = (currentOffset << 16) + tileId;
                }
            }
        }
    }


    export class Layer {
        width: number;
        height: number;
        atlas: Atlas;
        material: Material;

        private _blocks: Array<LayerBlock>;
        private _blocksWidth: number;
        private _blocksHeight: number;

        private static _triangles: Buffer;

        constructor(width: number, height: number, atlas: Atlas) {

            this.atlas = atlas;
            this.material = atlas.material;

            this.width = width;
            this.height = height;
            this._blocksWidth = (width + 15) >> 4;
            this._blocksHeight = (height + 15) >> 4;

            this._blocks = new Array<LayerBlock>(this._blocksWidth * this._blocksHeight);

            Layer.initTriangles();
        }

        private static initTriangles() {
            if (typeof Layer._triangles !== 'undefined')
                return;

            var triangles = new Uint16Array(6 * VBO_MAX_CAPACITY);

            var vertex = 0;
            for (var i = 0; i < triangles.length; i += 6) {
                triangles[i + 0] = vertex + 0;
                triangles[i + 1] = vertex + 1;
                triangles[i + 2] = vertex + 2;

                triangles[i + 3] = vertex + 2;
                triangles[i + 4] = vertex + 1;
                triangles[i + 5] = vertex + 3;

                vertex += 4;
            }

            Layer._triangles = new Buffer(gl.ELEMENT_ARRAY_BUFFER, triangles.byteLength, false);
            Layer._triangles.update(0, triangles);
        }

        getTile(x: number, y: number) {
            if (x < 0 || y < 0 || x >= this.width || x >= this.height)
                return null;

            var index = (y >> 4) * this._blocksWidth + (x >> 4);
            var block = this._blocks[index];
            if (typeof block === 'undefined')
                return null;

            var tileId = block.getTileId(x & 0xF, y & 0xF);
            if (tileId == EMPTY)
                return null;

            return this.atlas._tiles[tileId];
        }

        setTile(x: number, y: number, tile: Tile) {
            if (x < 0 || y < 0 || x >= this.width || y >= this.height)
                throw "Position [" + x + "," + y + "] is outside the layer";

            var xb = x >> 4;
            var yb = y >> 4;

            var index = yb * this._blocksWidth + xb;
            var block = this._blocks[index];
            if (typeof block === 'undefined') {
                block = new LayerBlock(xb, yb, 32, 32);
                this._blocks[index] = block;
            }

            block.setTile(x & 0xF, y & 0xF, tile);
        }

        render() {

            var gl = this.material.GL;
            this.material.use();

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Layer._triangles._buffer);

            var index = 0;
            for (var y = 0; y < this._blocksHeight; y++) {
                for (var x = 0; x < this._blocksWidth; x++) {
                    var block = this._blocks[index];
                    index++;

                    if (typeof block === 'undefined')
                        continue;

                    var count = block._map.length;
                    if (count == 0)
                        continue;

                    gl.bindBuffer(gl.ARRAY_BUFFER, block._vbo._buffer);

                    gl.enableVertexAttribArray(LOC_POSITION);
                    gl.vertexAttribPointer(LOC_POSITION, 2, gl.FLOAT, false, 16, 0);

                    gl.enableVertexAttribArray(LOC_TEXTURE_COORDS);
                    gl.vertexAttribPointer(LOC_TEXTURE_COORDS, 2, gl.FLOAT, false, 16, 8);

                    gl.disableVertexAttribArray(LOC_SPRITE_PARAMS);

                    gl.drawElements(gl.TRIANGLES, 6 * count, gl.UNSIGNED_SHORT, 0);
                }
            }


        }

    }
}
