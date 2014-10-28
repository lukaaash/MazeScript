/// <reference path="../N4/N4.ts" />

var gl = WebGLRenderingContext;

class Sprites {

    material: N4.Material;
    atlas: N4.Atlas;
    players: Array<Array<N4.Tile>>;

    constructor() {
        this.material = new N4.Material({
            texture: new N4.Texture('/resources/sprites2.png'),
            vertexShader: new N4.Shader('/resources/sprite.vsh', gl.VERTEX_SHADER),
            fragmentShader: new N4.Shader('/resources/sprite.fsh', gl.FRAGMENT_SHADER),
            blending: true,
            transparent: true
        });

        this.atlas = new N4.Atlas(512, 256, this.material);
        var width = 32;
        var height = 32;

        this.players = [];

        for (var p = 0; p < 8; p++) {
            var tiles = [];
            this.players.push(tiles);
            for (var d = 0; d < 4; d++) {
                for (var n = 0; n < 3; n++) {
                    var x = (((p % 4)|0) * 3 + n) * width;
                    var y = (((p / 4)|0) * 4 + d) * height;
                    tiles.push(new N4.Tile(this.atlas, x, y, width, height));
                }
            }
        }
    }

    render(x: number, y: number, player: number, direction: number, step: number) {

        var tile = this.players[player][direction * 3 + step];

        this.atlas._render(tile._tile, x, y, 0, 1);
    }
} 