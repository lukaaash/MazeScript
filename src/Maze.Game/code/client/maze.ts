﻿/// <reference path="../N4/N4.ts" />
/// <reference path="../common/maze.ts" />

var gl = WebGLRenderingContext;

var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

class Maze2 extends Maze {
    map: Array<number>;
    material: N4.Material;
    atlas: N4.Atlas;
    tiles: Array<N4.Tile>;
    layer: N4.Layer;

    constructor(width: number, height: number) {
        super(width, height);

        this.map = [
            24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
            17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17,
            23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
            16, 20, 16, 20, 16, 20, 16, 20, 16, 20, 16, 20, 16, 20, 16, 20,
            21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
            14, 14, 18, 18, 14, 14, 18, 18, 14, 14, 18, 18, 14, 14, 18, 18,
            22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
            15, 47, 48, 19, 15, 47, 48, 19, 15, 47, 48, 19, 15, 47, 48, 19,
            3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
            2, 2, 2, 2, 6, 6, 6, 6, 2, 2, 2, 2, 6, 6, 6, 6,
            9, 39, 9, 39, 46, 13, 46, 13, 9, 39, 9, 39, 46, 13, 46, 13,
            0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4,
            7, 7, 38, 38, 7, 7, 38, 38, 45, 45, 11, 11, 45, 45, 11, 11,
            1, 1, 1, 1, 40, 40, 40, 40, 41, 41, 41, 41, 5, 5, 5, 5,
            8, 34, 33, 29, 27, 35, 32, 28, 26, 31, 37, 30, 43, 42, 44, 12,
        ];

        this.material = new N4.Material({
            texture: new N4.Texture('/resources/walls.png'),
            overlay: new N4.Texture('/resources/wall128.png'),
            vertexShader: new N4.Shader('/resources/walls.vsh', gl.VERTEX_SHADER),
            fragmentShader: new N4.Shader('/resources/walls.fsh', gl.FRAGMENT_SHADER),
            blending: false,
            transparent: false
        });

        this.atlas = new N4.Atlas(256, 256, this.material);

        this.tiles = [];
        for (var i = 0; i < 49; i++) {
            var x = 4 + ((i % 7) | 0) * (32 + 4);
            var y = 4 + ((i / 7) | 0) * (32 + 4);
            this.tiles.push(new N4.Tile(this.atlas, x, y, 32, 32));
        }

        this.layer = new N4.Layer(width, height, this.atlas);
    }

    render() {
        this.layer.render();
    }

    onchange(x: number, y: number) {
        for (var j = -1; j <= 1; j++) {
            for (var i = -1; i <= 1; i++) {
                this.update(x + i, y + j);
            }
        }
    }

    private update(x: number, y: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return;

        var b0 = this._get(x - 1, y - 1);
        var b1 = this._get(x, y - 1);
        var b2 = this._get(x + 1, y - 1);
        var b3 = this._get(x - 1, y);
        var b4 = this._get(x, y);
        var b5 = this._get(x + 1, y);
        var b6 = this._get(x - 1, y + 1);
        var b7 = this._get(x, y + 1);
        var b8 = this._get(x + 1, y + 1);

        var code;
        if (b4 == 0) {
            code = 36;
        } else {
            code = (b1 << 4) + (b3 << 5) + (b5 << 6) + (b7 << 7) + (b0 << 0) + (b2 << 1) + (b6 << 2) + (b8 << 3);
            code = this.map[code];
        }

        var offset = y * this.width + x;
        if (this.codes[offset] == code)
            return;

        this.codes[offset] = code;
        if (code == 36)
            this.layer.setTile(x, y, null);
        else
            this.layer.setTile(x, y, this.tiles[code]);
    }
}


