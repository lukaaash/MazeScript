/// <reference path="N4/N4.ts" />
/// <reference path="client/world.ts" />
/// <reference path="client/player.ts" />
/// <reference path="client/sprites.ts" />

var KEYLEFT = 37;
var KEYUP = 38;
var KEYRIGHT = 39;
var KEYDOWN = 40;

class Level {

    sprites: Sprites;

    human: Human;

    drawMode: number;
    drawOn: boolean;

    keys: Array<boolean>;
    
    constructor(sprites: Sprites) {
        this.sprites = sprites;

        this.drawMode = 1;
        this.drawOn = false;

        game.on('render', e => this.onrender(e));
        game.on('resize', e => this.onResize(e));
        game.on('mousedown', e => this.onMouseDown(e));
        game.on('mouseup', e => this.onMouseUp(e));
        game.on('mousemove', e => this.onMouseMove(e));
        game.on('keydown', e => this.onKeyDown(e));
        game.on('keyup', e => this.onKeyUp(e));
        game.on('keypress', e => this.onKeyPress(e));
        game.on('mousewheel', e => this.onMouseWheel(e));

        this.human = new Human(this.sprites, 1, 8, 8, 4);

        this.keys = new Array(256);
    }

    onrender(e) {

        var t = world.time;

        world.players.forEach(player => {
            player.onrender(t);
        });

        this.sprites.atlas._flush();

        world.maze.render();
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
                if (world.players.findFirst(player => {
                    var px = player.x | 0;
                    var py = player.y | 0;
                    if (x == px && y == py)
                        return true;

                    return false;
                })) return;
            }

            world.maze.change(x, y, this.drawMode);
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

        if (this.human != null) {
            var arrow = this.keyToArrow(code);
            if (arrow >= 0) {
                this.human.keydown(arrow);
            }
        }
    }

    onKeyUp(e) {
        var code = e['code'];
        if (code < 256)
            this.keys[code] = false;

        if (this.human != null) {
            var arrow = this.keyToArrow(code);
            if (arrow >= 0) {
                this.human.keyup(arrow);
            }
        }
    }

    onKeyPress(e) {

        if (this.human != null) {
            if (e.char == 'z') {
                var robot = new Robot(this.sprites, 0, 4, 6, 0.7 + Math.random() * 0.3);
                robot.follow(this.human);
            }

            if (e.char == 'h') {
                var robot = new Robot(this.sprites, 1, 4, 6, 2.6 + Math.random() * 0.5);
                robot.follow(this.human);
            }

            if (e.char == 'k') {
                var robot = new Robot(this.sprites, 2, 16, 6, 2.6 + Math.random() * 0.5);
                robot.follow(this.human);
            }

            if (e.char == 'x') {
                var robot = new Robot(this.sprites, 3, 4, 6, 2.8 + Math.random() * 0.4);
                robot.follow(this.human);
            }

            if (e.char == 'd') {
                var fool = new Fool(this.sprites, 4, 4, 6, 3.3 + Math.random() * 0.4);
            }

            if (e.char == 'v') {
                var robot = new Robot(this.sprites, 5, 4, 6, 1.5 + Math.random() * 0.4);
                robot.follow(this.human);
            }

            if (e.char == 'p') {
                var robot = new Robot(this.sprites, 6, 4, 6, 1.0 + Math.random() * 0.3);
                robot.follow(this.human);
            }

            if (e.char == 's') {
                var robot = new Robot(this.sprites, 7, 4, 6, 0.9 + Math.random() * 0.5);
                robot.follow(this.human);
            }
        }

        if (e.char == 't') {
            world.sync();
        }

        if (e.char == ' ') {
            this.drawMode = 1 - this.drawMode;
        }
            
        //console.log("Key press " + e.char + " (" + e.char.charCodeAt(0).toString(16) + ")");
    }

}

/*
var info = JSON.parse(e.text);

var url = <string>info['url'];

var loc = window.location
var scheme: string;
if (loc.protocol === "https:") {
    scheme = "wss://";
} else {
    scheme = "ws://";
}
url = scheme + loc.host + url;
*/

var url = "ws://localhost:1337";

var level = null;

var game = new N4.Game();
game.title = "Maze";

game.on('ready', () => {

    var sprites = new Sprites();

    world = new LocalWorld(game, sprites);
    //world = new RemoteWorld(game, sprites, url);

    world.onready = () => {
        //alert('ready');
        level = new Level(sprites);

    }

});




