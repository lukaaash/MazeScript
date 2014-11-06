/// <reference path="sprites.ts" />
/// <reference path="world.ts" />
/// <reference path="maze.ts" />
/// <reference path="../common/player.ts" />

class LocalAvatar extends Avatar {

    constructor(id: number, options: PlayerOptions) {
        super(id, options);
    }

    render(x: number, y: number, sprite: number, direction: number, step: number) {
        world.sprites.render(x, y, sprite, direction, step);
    }
}

class LocalPlayer extends Player {

    private lastActionT: number;
    private shouldThink: boolean;
    private decisionTime: number;
    private moves: Array<number>;

    constructor(options: PlayerOptions) {
        super(options);

        this.lastActionT = world.time | 0;
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
        world.sprites.render(x, y, sprite, direction, step);
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

    constructor(sprite: number, x: number, y: number, speed?: number) {
        super(new PlayerOptions(sprite, x, y, speed));
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

    constructor(sprite: number, x: number, y: number, speed?: number) {
        super(new PlayerOptions(sprite, x, y, speed));
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


