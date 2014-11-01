/// <reference path="world.ts" />
/// <reference path="maze.ts" />

var NONE = -1;
var DOWN = 0;
var LEFT = 1;
var RIGHT = 2;
var UP = 3;

var DIR = [3, 2, 0, 1];
var ROT = [2, 3, 1, 0];
var DX = [0, -1, 1, 0];
var DY = [1, 0, 0, -1];

interface ITarget {
    x: number;
    y: number;
}

class PlayerOptions {
    sprite: number;
    x: number;
    y: number;
    speed: number;

    constructor(sprite: number, x: number, y: number, speed?: number) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.speed = speed;
    }
}

class Player implements ITarget {
    private _id: number;
    private sprite: number;
    private speed: number; // speed in squares per second
    private stepT: number; // step duration in ms (how long it takes to go from one square to another)

    private direction: number; // current direction
    private lookDirection: number; // current look direction (used if direction == NONE)

    private fromT: number;
    private fromX: number;
    private fromY: number;

    private nextT: number;
    private nextX: number;
    private nextY: number;

    // each move sequence has 4 components: nextT, direction, nextX, nextY
    private route: Array<number>;
    private current: number;

    private moveTime: number;

    get id(): number {
        return this._id;
    }

    get x(): number {
        return this.nextX;
    }

    get y(): number {
        return this.nextY;
    }

    get t(): number {
        return this.nextT;
    }

    get d(): number {
        return this.direction;
    }

    //TODO: make most of the members 'protected' (needs a recent version of TypeScript - see https://github.com/Microsoft/TypeScript/pull/688)

    //TODO: when creating a player, have the server assign its ID to ensure all clients activate an instance of Player at once

    constructor(options: PlayerOptions) {
        var t = world.time | 0;

        options.sprite |= 0;
        options.x |= 0;
        options.y |= 0;

        var speed = options.speed;
        speed = (speed > 0.5) ? speed : 0.5;
        speed = (speed < 5.0) ? speed : 5.0;
        options.speed = speed;

        this._id = 0;
        this.sprite = options.sprite | 0;
        this.speed = speed;
        this.stepT = (1000 / speed) | 0;
        this.direction = DOWN;
        this.lookDirection = DOWN;
        this.fromT = 0;
        this.nextT = null;
        this.nextX = this.fromX = options.x;
        this.nextY = this.fromY = options.y;
        this.route = [];
        this.current = 0;

        this.moveTime = null;
    }

    look(direction: number) {
        this.lookDirection = direction >= 0 ? direction : DOWN;
    }

    _setId(id: number) {
        this._id = id;
    }

    _move(decisionTime: number, fromTime: number, moves: Array<number>) {
        decisionTime |= 0;
        fromTime |= 0;

        // it is prohibited to change history
        if (fromTime < decisionTime) {
            console.error("Attempt to change history detected.");
            return;
        }

        // find the last element to keep
        var route = this.route;
        var offset = -4;
        var nextTime = null;
        while ((offset + 4) < route.length) {
            offset += 4;
            nextTime = route[offset + 0];
            if (nextTime >= fromTime)
                break;

            // remove legacy moves from the route
            if (nextTime < decisionTime && offset < this.current) {
                route = route.slice(4);
                this.current -= 4;
                offset -= 4;
                nextTime = null;
                continue;
            }
        }

        // if the route is empty, start with fromTime
        if (nextTime == null)
            nextTime = this.fromT;

        // reject attempts to change partial steps
        if (nextTime > fromTime) {
            console.error("Someting is wrong (nextTime > fromTime): " + nextTime + " > " + fromTime);
            return;
        }

        // detect unchanged section of the route
        var n = 0;
        if (nextTime == fromTime) {
            for (n = 0; n < moves.length; n++) {
                offset += 4;
                if (offset >= route.length) {
                    offset -= 4;
                    break;
                }

                if (nextTime != fromTime) {
                    offset -= 4;
                    break;
                }

                var d = route[offset + 1];
                if (d != moves[n]) {
                    offset -= 4;
                    break;
                }

                nextTime = route[offset];
                fromTime += this.stepT;
            }
        }

        // get position at the end of unchanged section of the route
        var x;
        var y;
        if (offset >= 0) {
            x = route[offset + 2];
            y = route[offset + 3];
        } else {
            x = this.nextX;
            y = this.nextY;
        }

        // remove changed section of the route
        var discarded = false;
        if ((offset + 4) < route.length) {
            route = route.slice(0, offset + 4);
            discarded = true;
        }

        // determine whether to change the current move
        var reroute = false;
        if (this.current >= route.length) {

            if (this.current > route.length) {
                this.current = route.length;
                reroute = true;
            } else if (this.nextT == null) {
                reroute = true;
            }
        }

        // report the new route
        //if (discarded || moves.length > 0) {
            this.onreport(decisionTime, fromTime, moves, n);
        //} else {
        //    return;
        //}

        // determine move time to make it possible to change the current move
        var t = this.moveTime;

        // insert a delay before appending the new route if needed
        if (nextTime < fromTime) {
            // nextT, direction, nextX, nextY
            route.push(fromTime);
            route.push(NONE);
            route.push(x);
            route.push(y);
            offset += 4;

            // change the current move if needed
            if (reroute) {
                if (t < fromTime) {
                    this.current = route.length;
                    this.direction = NONE;
                    this.fromT = nextTime;
                    this.fromX = x;
                    this.fromY = y;
                    this.nextT = fromTime;
                    this.nextX = x;
                    this.nextY = y;
                    reroute = false;
                }
            }

            nextTime = fromTime;
        }

        // add new moves to the route
        for (var i = n; n < moves.length; n++) {
            nextTime = fromTime + this.stepT;
            d = moves[n];
            var nx = x + DX[d];
            var ny = y + DY[d];
            route.push(nextTime);
            route.push(d);
            route.push(nx);
            route.push(ny);

            // change the current move if needed
            if (reroute) {
                if (t >= fromTime && t < nextTime) {
                    this.current = route.length;
                    this.direction = d;
                    this.fromT = fromTime;
                    this.fromX = x;
                    this.fromY = y;
                    this.nextT = nextTime;
                    this.nextX = nx;
                    this.nextY = ny;
                    reroute = false;
                }
            }

            x = nx;
            y = ny;
            fromTime = nextTime;
        }

        // change the current move if needed
        if (reroute) {
            this.current = route.length;
            this.direction = NONE;
            this.fromT = fromTime;
            this.nextT = null;
            this.fromX = this.nextX = x;
            this.fromY = this.nextY = y;
            reroute = false;
        }

        // activate the route
        this.route = route;
    }

    onreport(t: number, fromTime: number, moves: Array<number>, offset: number) {
    }

    onstep(direction: number) {
    }

    onmove(t: number) : boolean {

        var think = false;

        if (this.nextT != null) {
            while (t > this.nextT) {
                this.fromT = this.nextT;
                this.fromX = this.nextX;
                this.fromY = this.nextY;

                var route = this.route;
                var current = this.current;
                var len = route.length - this.current;

                if (len > 0) {
                    // nextT, direction, nextX, nextY
                    this.nextT = route[current++];
                    this.direction = route[current++];
                    this.nextX = route[current++];
                    this.nextY = route[current++];
                    this.current = current;
                    len -= 4;

                    if (len == 8 || len == 0)
                        think = true;

                } else {
                    this.direction = NONE;
                    this.nextT = null;

                    //think = true;
                    break;
                }

                if (this.direction != NONE)
                    this.onstep(this.direction);
            }
        }

        return think;
    }

    onrender(t: number) {

        this.moveTime = t;
        this.onmove(t);
        this.moveTime = null;

        var x;
        var y;
        var step;
        var direction = this.direction;

        if (this.nextT == null || direction < 0 || t < this.fromT) {

            x = this.fromX * TILE_WIDTH;
            y = this.fromY * TILE_HEIGHT;
            step = 1;
            direction = this.lookDirection;

        } else {

            var total = this.nextT - this.fromT;
            var current = t - this.fromT;

            var et = current / total;
            var rt = 1 - et;

            x = this.fromX * rt + this.nextX * et;
            y = this.fromY * rt + this.nextY * et;

            x *= TILE_WIDTH;
            y *= TILE_HEIGHT;

            var speed = this.speed;
            if (speed < 2)
                speed = 2;

            step = (((t / 250.0 * speed) | 0) % 4);
            if (step == 3)
                step = 1;

            /*
            x = this.nextX;
            y = this.nextY;
            for (var i = 0; i < this.moves.length; i++) {
                x += DX[this.moves[i]];
                y += DY[this.moves[i]];
                this.sprites.render(x * TILE_WIDTH, y * TILE_HEIGHT, 3, 0, 1);
            }
            */
        }

        this.render(x, y, this.sprite, direction, step);
    }

    render(x: number, y: number, sprite: number, direction: number, step: number) {
    }
}
