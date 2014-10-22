/// <reference path="common.ts" />
/// <reference path="game.ts" />
/// <reference path="shader.ts" />
/// <reference path="texture.ts" />
/// <reference path="buffer.ts" />

module N4 {

    var SPRITE_BUFFER_CAPACITY = 2048;
    var SPRITE_VERTEX_BYTE_LENGTH = 6 * 4 + 4 * 2;
    var SPRITE_VERTEX_UINT16_LENGTH = SPRITE_VERTEX_BYTE_LENGTH / 2;
    var SPRITE_VERTEX_FLOAT32_LENGTH = SPRITE_VERTEX_BYTE_LENGTH / 4;


    export class Tile {
        _atlas: Atlas;
        _id: number;
        _tile: Float32Array;

        constructor(atlas: Atlas, x: number, y: number, width: number, height: number, pivotX?: number, pivotY?: number) {
            this._atlas = atlas;
            this._id = atlas._tiles.length;

            var xres = atlas.width;
            var yres = atlas.height;

            var left = 0;
            var right = width;
            var top = 0;
            var bottom = height;

            if (typeof pivotX !== 'undefined') {
                left -= pivotX;
                right -= pivotX;
            }

            if (typeof pivotY !== 'undefined') {
                top -= pivotY;
                bottom -= pivotY;
            }

            var tleft = x / xres;
            var tright = (x + width) / xres;
            var ttop = y / yres;
            var tbottom = (y + height) / yres;

            // float32 x;
            // float32 y;
            // float32 tx;
            // float32 ty;
            this._tile = new Float32Array([
                left, top,
                tleft, ttop,

                left, bottom,
                tleft, tbottom,

                right, top,
                tright, ttop,

                right, bottom,
                tright, tbottom,
            ]);

            atlas._tiles.push(this);
        }
    }

    export class Atlas {
        width: number;
        height: number;
        material: Material;

        _tiles: Array<Tile>;

        _buffer: Buffer;
        _source: ArrayBuffer;
        _sourceFloat32: Float32Array;
        _sourceUint16: Uint16Array;
        _sourceOffset: number;

        static _triangles: Buffer;

        constructor(width: number, height: number, material: Material) {
            var gl = material.GL;

            this.width = width;
            this.height = height;
            this.material = material;

            this._tiles = [];

            this._buffer = new Buffer(gl.ARRAY_BUFFER, SPRITE_VERTEX_BYTE_LENGTH * SPRITE_BUFFER_CAPACITY, true);
            this._source = new ArrayBuffer(SPRITE_VERTEX_BYTE_LENGTH * SPRITE_BUFFER_CAPACITY);
            this._sourceFloat32 = new Float32Array(this._source);
            this._sourceUint16 = new Uint16Array(this._source);
            this._sourceOffset = 0;

            if (typeof Atlas._triangles === 'undefined') {
                var triangles = new Uint16Array(3 * SPRITE_BUFFER_CAPACITY / 4);

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

                Atlas._triangles = new Buffer(gl.ELEMENT_ARRAY_BUFFER, triangles.byteLength, false);
                gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, triangles);
            }
        }

        _render(template: Float32Array, x: number, y: number, rotation: number, scale: number) {

            var offsetFloat32 = this._sourceOffset * SPRITE_VERTEX_FLOAT32_LENGTH;
            var offsetUint16 = this._sourceOffset * SPRITE_VERTEX_UINT16_LENGTH + 14;
            var offsetTemplate = 0;

            // float32 px; 4
            // float32 py; 4
            // float32 x; 4
            // float32 y; 4
            // float32 tx; 4
            // float32 ty; 4
            // float32 rot; 4
            // uint16 scale; 2
            // uint16 alpha; 2

            for (var i = 0; i < 4; i++) {

                this._sourceFloat32[offsetFloat32 + 0] = x;
                this._sourceFloat32[offsetFloat32 + 1] = y;
                this._sourceFloat32[offsetFloat32 + 2] = template[offsetTemplate++];
                this._sourceFloat32[offsetFloat32 + 3] = template[offsetTemplate++];
                this._sourceFloat32[offsetFloat32 + 4] = template[offsetTemplate++];
                this._sourceFloat32[offsetFloat32 + 5] = template[offsetTemplate++];
                this._sourceFloat32[offsetFloat32 + 6] = rotation;
                this._sourceUint16[offsetUint16 + 0] = scale * 256.0;
                this._sourceUint16[offsetUint16 + 1] = 256.0;

                offsetFloat32 += SPRITE_VERTEX_FLOAT32_LENGTH;
                offsetUint16 += SPRITE_VERTEX_UINT16_LENGTH;
                this._sourceOffset++;
            }

            if (this._sourceOffset >= SPRITE_BUFFER_CAPACITY)
                this._flush();
        }

        _flush() {
            var gl = this.material.GL;
            this.material.use();

            gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer._buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Uint8Array(this._source, 0, this._sourceOffset * SPRITE_VERTEX_BYTE_LENGTH));

            gl.enableVertexAttribArray(LOC_POSITION);
            gl.vertexAttribPointer(LOC_POSITION, 4, gl.FLOAT, false, SPRITE_VERTEX_BYTE_LENGTH, 0);

            gl.enableVertexAttribArray(LOC_TEXTURE_COORDS);
            gl.vertexAttribPointer(LOC_TEXTURE_COORDS, 3, gl.FLOAT, false, SPRITE_VERTEX_BYTE_LENGTH, 16);

            gl.enableVertexAttribArray(LOC_SPRITE_PARAMS);
            gl.vertexAttribPointer(LOC_SPRITE_PARAMS, 2, gl.UNSIGNED_SHORT, false, SPRITE_VERTEX_BYTE_LENGTH, 28);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Atlas._triangles._buffer);
            gl.drawElements(gl.TRIANGLES, 3 * this._sourceOffset / 2, gl.UNSIGNED_SHORT, 0);

            this._sourceOffset = 0;
        }

    }

    class Sprite {

        private _atlas: Atlas;
        private _template: Float32Array;

        x: number;
        y: number;
        rotation: number;
        scale: number;

        constructor(template: Tile) {
            this._atlas = template._atlas;
            this._template = template._tile;
            this.x = 0;
            this.y = 0;
            this.rotation = 0;
            this.scale = 1.0;
        }

        render() {
            this._atlas._render(this._template, this.x, this.y, this.rotation, this.scale);
        }

    }
}
