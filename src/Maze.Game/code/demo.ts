/// <reference path="N4.ts" />

var gl = WebGLRenderingContext;

var DOWN = 0;
var LEFT = 1;
var RIGHT = 2;
var UP = 3;

var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

var KEYLEFT = 37;
var KEYUP = 38;
var KEYRIGHT = 39;
var KEYDOWN = 40;

class Maze {
    width: number;
    height: number;
    walls: Array<number>;
    codes: Array<number>;

    map: Array<number>;

    material: N4.Material;
    atlas: N4.Atlas;
    tiles: Array<N4.Tile>;
    layer: N4.Layer;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.walls = new Array<number>(width * height);
        this.codes = new Array<number>(width * height);
        for (var i = 0; i < width * height; i++) {
            this.walls[i] = 0;
            this.codes[i] = 36;
        }

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
            texture: new N4.Texture('walls.png'),
            overlay: new N4.Texture('wall128.png'),
            vertexShader: new N4.Shader('walls.vsh', gl.VERTEX_SHADER),
            fragmentShader: new N4.Shader('walls.fsh', gl.FRAGMENT_SHADER),
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

    add(x: number, y: number) {
        this.change(x, y, 1);
    }

    remove(x: number, y: number) {
        this.change(x, y, 0);
    }

    toggle(x: number, y: number) {
        this.change(x, y, null);
    }

    change(x: number, y: number, w: number) {
        x |= 0;
        y |= 0;
        w &= 1;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return;

        var offset = y * this.width + x;
        var v = this.walls[offset];
        if (w == v)
            return;

        if (w == null)
            w = 1 - v;

        this.walls[offset] = w;
        //console.log(v, w);

        for (var j = -1; j <= 1; j++) {
            for (var i = -1; i <= 1; i++) {
                this._update(x + i, y + j);
            }
        }
    }

    _get(x: number, y: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return 1;

        var offset = y * this.width + x;
        var v = this.walls[offset];
        return (v == 0) ? 0 : 1;
    }

    _update(x: number, y: number) {
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

class Sprites {

    material: N4.Material;
    atlas: N4.Atlas;
    players: Array<Array<N4.Tile>>;

    constructor() {
        this.material = new N4.Material({
            texture: new N4.Texture('sprites.png'),
            vertexShader: new N4.Shader('sprite.vsh', gl.VERTEX_SHADER),
            fragmentShader: new N4.Shader('sprite.fsh', gl.FRAGMENT_SHADER),
            blending: true,
            transparent: true
        });

        this.atlas = new N4.Atlas(256, 256, this.material);
        var width = 32;
        var height = 32;

        this.players = [];

        for (var p = 0; p < 4; p++) {
            var tiles = [];
            this.players.push(tiles);
            for (var d = 0; d < 4; d++) {
                for (var n = 0; n < 3; n++) {
                    var x = ((p & 1) * 3 + n) * width;
                    var y = ((p >> 1) * 4 + d) * height;
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


class Player {
    sprites: Sprites;
    sprite: number;

    moving: boolean;
    direction: number;

    x: number;
    y: number;
    t: number;

    nextX: number;
    nextY: number;
    nextT: number;
    deltaT: number;

    onReached: Function;

    constructor(sprites: Sprites, sprite: number, x: number, y: number) {
        this.sprites = sprites;
        this.sprite = sprite;

        this.moving = false;
        this.direction = 0;
        this.x = x;
        this.y = y;
    }

    look(direction: number) {
        if (!this.moving)
            this.direction = direction;
    }

    go(x: number, y: number, t: number, duration: number) {
        this.t = t;
        this.nextX = x;
        this.nextY = y;
        this.nextT = t + duration;
        this.deltaT = duration;
        this.moving = true;

        if (x < this.x)
            this.direction = LEFT;
        else if (x > this.x)
            this.direction = RIGHT;
        else if (y < this.y)
            this.direction = UP;
        else
            this.direction = DOWN;
    }

    render(t: number) {

        if (this.moving && t >= this.nextT) {
            this.moving = false;
            this.x = this.nextX;
            this.y = this.nextY;
            this.t = this.nextT;
            if (typeof this.onReached === 'function') {
                this.onReached(this.t);
            }
        }

        if (!this.moving) {
            this.sprites.render(this.x, this.y, this.sprite, this.direction, 1);
            return;
        }

        

        var et = (t - this.t) / this.deltaT;
        var rt = (this.nextT - t) / this.deltaT;

        var x = this.x * rt + this.nextX * et;
        var y = this.y * rt + this.nextY * et;

        var step = (((t * 16) | 0) % 4);
        if (step == 3)
            step = 1;

        this.sprites.render(x, y, this.sprite, this.direction, step);
    }

}

class Level {

    maze: Maze;
    sprites: Sprites;

    players: Array<Player>;
    player: Player;

    drawMode: number;
    drawOn: boolean;

    keys: Array<boolean>;
    arrowCurrent: number;
    arrowPrevious: number;

    time: number;

    constructor() {
        this.maze = new Maze(64, 32);
        this.sprites = new Sprites();

        this.drawMode = 1;
        this.drawOn = false;

        game.on('render', e => this.onRender(e));
        game.on('resize', e => this.onResize(e));
        game.on('mousedown', e => this.onMouseDown(e));
        game.on('mouseup', e => this.onMouseUp(e));
        game.on('mousemove', e => this.onMouseMove(e));
        game.on('keydown', e => this.onKeyDown(e));
        game.on('keyup', e => this.onKeyUp(e));
        game.on('keypress', e => this.onKeyPress(e));
        game.on('mousewheel', e => this.onMouseWheel(e));

        this.player = new Player(this.sprites, 0, 8 * TILE_WIDTH, 8 * TILE_HEIGHT);
        this.player.onReached = () => this.movePlayer();


        this.players = [this.player];

        this.keys = new Array(256);
        this.arrowCurrent = -1;
        this.arrowPrevious = -1;
    }

    onRender(e) {
        /*
            if (!ready)
                return;
        */

        var time = e.time;

        this.time = time;


        this.players.forEach(player => {
            player.render(time);
        });

        this.sprites.atlas._flush();

        this.maze.render();
    }

    onResize(e) {
        console.log("Resize to " + e.width + "x" + e.height + " (scale " + e.scale + ")");

        game.setViewport(0, 0, e.width, e.height, 1);
    }

    onMouseDown(e) {
        if (e.button == 0) {
            this.drawOn = true;
            this.onMouseMove(e);
        }

    }

    onMouseUp(e) {
        if (e.button == 0) {
            this.drawOn = false;
        }
    }

    onMouseWheel(e) {
        this.drawMode = (this.drawMode + e.deltaY | 0) & 1;
    }

    onMouseMove(e) {
        if (this.drawOn) {
            var x = (e.x / TILE_WIDTH) | 0;
            var y = (e.y / TILE_HEIGHT) | 0;

            if (this.drawMode == 1) {
                var player = this.player;
                var px = (player.x / TILE_WIDTH) | 0;
                var py = (player.y / TILE_HEIGHT) | 0;
                //console.log(px, " ", py, " ", x, " ", y);
                if (x == px && y == py)
                    return;
                if (player.moving) {
                    var pnx = (player.nextX / TILE_WIDTH) | 0;
                    var pny = (player.nextY / TILE_HEIGHT) | 0;
                    if (x == pnx && y == pny)
                        return;
                }
            }

            this.maze.change(x, y, this.drawMode);
        }
    }

    movePlayer() {
        var player = this.player;

        if (this.arrowCurrent < 0) {
            player.look(0);
            return;
        }

        var x = (player.x / TILE_WIDTH) | 0;
        var y = (player.y / TILE_HEIGHT) | 0;
        var nx = x;
        var ny = y;

        var move = false;
        var ac = this.arrowCurrent;
        var ap = this.arrowPrevious;
        var m = ac;
        for (var i = 0; i < 2; i++) {
            if (m == LEFT && this.maze._get(x - 1, y) == 0) {
                nx--; move = true; break;
            }

            if (m == RIGHT && this.maze._get(x + 1, y) == 0) {
                nx++; move = true; break;
            }

            if (m == UP && this.maze._get(x, y - 1) == 0) {
                ny--; move = true; break;
            }

            if (m == DOWN && this.maze._get(x, y + 1) == 0) {
                ny++; move = true; break;
            }

            m = ap;
        }

        //console.log('move = ', move, ' m = ', m);

        if (move) {
            player.go(nx * TILE_WIDTH, ny * TILE_HEIGHT, this.time, 0.2);
        } else if (ac >= 0) {
            player.look(ac);
        }
    }

    keyToArrow(code) {
        switch (code) {
            case KEYLEFT:
                return LEFT;
            case KEYRIGHT:
                return RIGHT;
            case KEYUP:
                return UP;
            case KEYDOWN:
                return DOWN;
            default:
                return -1;
        }
    }

    onKeyDown(e) {
        var code = e['code'];
        if (code < 256)
            this.keys[code] = true;

        var arrow = this.keyToArrow(code);

        if (arrow >= 0 && arrow != this.arrowCurrent) {

            this.arrowPrevious = this.arrowCurrent;
            this.arrowCurrent = arrow;

            // pridat frontu, aby to reagovalo i kdyz se to nestihne (pokud prave jde)

            if (!this.player.moving) {
                this.movePlayer();
            }

            console.log(this.arrowCurrent, ' ', this.arrowPrevious);
        }
    }

    onKeyUp(e) {
        var code = e['code'];
        if (code < 256)
            this.keys[code] = false;

        var arrow = this.keyToArrow(code);
        if (arrow >= 0) {
            if (this.arrowPrevious == arrow)
                this.arrowPrevious = -1;

            if (this.arrowCurrent == arrow)
                this.arrowCurrent = this.arrowPrevious;

            if (this.arrowCurrent < 0) {
                if (!this.player.moving) {
                    this.player.look(0);
                }
            }
        }

        console.log(this.arrowCurrent, ' ', this.arrowPrevious);
    }

    onKeyPress(e) {

        if (e.char == ' ') {
            this.drawMode = 1 - this.drawMode;
        }
            
        //console.log("Key press " + e.char + " (" + e.char.charCodeAt(0).toString(16) + ")");
    }

}

var level = null;

var game = new N4.Game();
game.title = "Maze";

game.on('ready', () => {
    level = new Level();
});



