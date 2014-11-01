/// <reference path="sprites.ts" />
/// <reference path="world.ts" />
/// <reference path="maze.ts" />
/// <reference path="../common/player.ts" />

class LocalAvatar extends Avatar {

    private sprites: Sprites;

    constructor(sprites: Sprites, id: number, options: PlayerOptions) {
        super(id, options);

        this.sprites = sprites;
    }

    render(x: number, y: number, sprite: number, direction: number, step: number) {
        this.sprites.render(x, y, sprite, direction, step);
    }
}

class LocalPlayer extends Player {

    private sprites: Sprites;
    private lastActionT: number;
    private shouldThink: boolean;
    private decisionTime: number;
    private moves: Array<number>;

    constructor(sprites: Sprites, options: PlayerOptions) {
        super(options);

        this.sprites = sprites;
        this.lastActionT = world.time | 0;;
        this.shouldThink = false;
        this.decisionTime = null;
        this.moves = [];

        world.playerCreate(this, options);
    }

    onactivate(id: number) {
        this._setId(id);
    }

    onreport(t: number, fromTime: number, moves: Array<number>, offset: number) {
        //console.log(fromTime, n, JSON.stringify(moves));

        // inform other nodes
        var packet = [
            t,
            this.id,
            fromTime - t,
            moves.slice(offset)
        ];

        world.playerMove(packet);
    }

    render(x: number, y: number, sprite: number, direction: number, step: number) {
        this.sprites.render(x, y, sprite, direction, step);
    }

    move(moves: Array<number>) {
        if (this.decisionTime == null) {
            console.error("move(...) can only be called from think() or idle()");
            return;
        }

        var fromTime;
        if (this.t != null)
            fromTime = this.t;
        else
            fromTime = this.decisionTime + 50; // delay of 50 ms for better network play

        super._move(this.decisionTime, fromTime, moves);
    }

    poke() {
        this.shouldThink = true;
    }

    idle() {
    }

    think() {
    }

    step(direction: number) {
    }

    onstep(direction: number) {
        this.lastActionT = world.time | 0;
        this.step(direction);
    }

    onmove(t: number): boolean {
        var think = super.onmove(t);
        this.shouldThink = this.shouldThink || think;

        this.decisionTime = t;

        if (this.t == null) {
            if ((t - this.lastActionT) > 2000) {
                this.lastActionT = t;
                this.idle();
            }
        }

        if (this.shouldThink) {
            var remaining = (this.t == null) ? 50 : (this.t - t);
            if (remaining >= 50) {
                this.think();
                this.shouldThink = false;
            }
        }

        this.decisionTime = null;

        return think;
    }


}

class Human extends LocalPlayer {

    private directionPrev: number;
    private directionCurr: number;
    private directionNext: number;

    constructor(sprites: Sprites, sprite: number, x: number, y: number, speed?: number) {
        super(sprites, new PlayerOptions(sprite, x, y, speed));
        this.directionPrev = NONE;
        this.directionCurr = NONE;
        this.directionNext = NONE;
    }

    keydown(direction: number) {
        //console.log("go: ", direction);

        if (this.directionCurr == direction || this.directionPrev == direction)
            return;

        if (direction < 0 || direction > 3)
            return;

        this.directionPrev = this.directionCurr;
        this.directionCurr = direction;
        this.directionNext = direction;

        this.poke();
    }

    keyup(direction: number) {
        //console.log("ungo: ", direction);

        if (this.directionCurr == direction)
            this.directionCurr = this.directionPrev;

        this.directionPrev = NONE;

        this.poke();
    }

    step(direction: number) {
        if (this.directionNext == direction)
            this.directionNext = NONE;
    }

    think() {
        //console.log(this.directionNext, ",", this.directionCurr, ",", this.directionPrev);

        var x = this.x;
        var y = this.y;

        var directions = [];
        if (this.directionNext >= 0)
            directions.push(this.directionNext);
        if (this.directionCurr >= 0)
            directions.push(this.directionCurr);
        if (this.directionPrev >= 0)
            directions.push(this.directionPrev);


        var moves = [];

        var k = 0;

        for (var i = 0; i < 8; i++) {

            var direction = NONE;

            for (var j = 0; j < directions.length; j++) {
                if (k >= directions.length)
                    k = 0;
                var d = directions[k];
                k++;

                var dx = DX[d];
                var dy = DY[d];
                dx += x;
                dy += y;

                if (!world.maze.isWall(dx, dy)) {
                    direction = d;
                    x = dx;
                    y = dy;
                    break;
                }
            }

            if (direction == NONE)
                break;

            moves.push(direction);

            if (i == 0 && this.directionNext >= 0) {
                directions.shift();
            }
        }

        this.move(moves);
        if (moves.length == 0)
            this.look(this.directionCurr);
    }

}

class Fool extends LocalPlayer {

    private rot: number;
    private inc: number;

    constructor(sprites: Sprites, sprite: number, x: number, y: number, speed?: number) {
        super(sprites, new PlayerOptions(sprite, x, y, speed));
        this.rot = 0;
        this.inc = 1;
        this.poke();
    }

    step(direction: number) {
    }

    idle() {
        this.poke();
    }

    think() {
        var x = this.x;
        var y = this.y;
        var d = this.d;

        if (d < 0)
            d = RIGHT;

        var moves = [];
        var rot = DIR[d];
        var straight = false;

        for (var s = 0; s < 8; s++) {

            var i;
            for (i = -1; i < 3; i++) {
                var r = (rot + 4 + i) % 4;
                var dir = ROT[r];
                var dx = DX[dir];
                var dy = DY[dir];

                if (!world.maze.isWall(x + dx, y + dy)) {
                    x += dx;
                    y += dy;

                    // prevent infinite circle in open space
                    if (s == 3 && x == this.x && y == this.y && moves[0] != moves[1]) {
                        this.straight(d);
                        return;
                    }

                    moves.push(dir);
                    rot = r;
                    break;
                }
            }

            if (i == 3)
                break;
        }

        this.move(moves);
    }

    straight(d: number) {
        var x = this.x;
        var y = this.y;

        var moves = [];
        var r = DIR[d];
        var straight = false;

        for (var s = 0; s < 8; s++) {

            for (var i = 0; i < 4; i++) {
                var dir = ROT[r];
                var dx = DX[dir];
                var dy = DY[dir];

                if (!world.maze.isWall(x + dx, y + dy)) {
                    x += dx;
                    y += dy;
                    moves.push(dir);
                    break;
                }

                r = (r + 1) % 4;
            }

            if (i == 3)
                break;
        }

        this.move(moves);
    }

}

class Robot extends LocalPlayer {

    private target: ITarget;
    private alternative: ITarget;
    private isIdle: boolean;

    constructor(sprites: Sprites, sprite: number, x: number, y: number, speed?: number) {
        super(sprites, new PlayerOptions(sprite, x, y, speed));
        this.target = null;
    }

    follow(target: ITarget) {
        this.target = target;
        this.alternative = target;
        this.isIdle = false;
        this.poke();
    }

    step(direction: number) {
    }

    idle() {
        this.isIdle = true;
        this.poke();
    }

    think() {
        var moves = this.find(this.alternative);

        if (this.isIdle) {
            this.isIdle = false;

            if (moves.length == 0) {

                if (this.target != this.alternative) {
                    this.alternative = this.target;
                } else {
                    var dx = (this.target.x - this.x) | 0;
                    var dy = (this.target.y - this.y) | 0;

                    var d = (dx == 0 && dy == 0) ? 4 : 16;

                    this.alternative = {
                        x: this.x + (Math.random() - 0.5) * d,
                        y: this.y + (Math.random() - 0.5) * d
                    };
                }

                moves = this.find(this.alternative);
            }
        }

        this.move(moves);
    }

    private find(target: ITarget) : Array<number> {
        var x = this.x;
        var y = this.y;

        if (target == null)
            return [];

        var dx = (target.x - this.x) | 0;
        var dy = (target.y - this.y) | 0;

        var moves = [];

        for (var i = 0; i < 8; i++) {

            var h = (dx < 0) ? LEFT : (dx > 0) ? RIGHT : NONE;
            var v = (dy < 0) ? UP : (dy > 0) ? DOWN : NONE;

            if (h == NONE && v == NONE)
                break;

            var nx = x + DX[h];
            var ny = y + DY[v];

            var wh = world.maze.isWall(nx, y);
            var wv = world.maze.isWall(x, ny);

            if (wh && wv)
                break;

            if (!wh && !wv) {
                var ax = Math.abs(dx);
                var ay = Math.abs(dy);
                var a = ax / (ax + ay);
                var b = Math.random();

                if (b > a)
                    wh = true;
            }

            if (!wh) {
                moves.push(h);
                dx += x - nx;
                x = nx;
                continue;
            }

            if (!wv) {
                moves.push(v);
                dy += y - ny;
                y = ny;
                continue;
            }

            break;
        }

        return moves;
    }



} 


