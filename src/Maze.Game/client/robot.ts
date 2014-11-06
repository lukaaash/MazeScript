/// <reference path="player.ts" />

class Robot extends LocalPlayer {

    constructor(options: PlayerOptions) {
        super(options);
    }

    find(target: ITarget): Array<number> {
        var x = this.x;
        var y = this.y;

        if (target == null)
            return [];

        var dx = (target.x - this.x) | 0;
        var dy = (target.y - this.y) | 0;

        var moves = [];

        for (var i = 0; i < 8; i++) {

            var h = (dx < 0) ? LEFT : (dx > 0) ? RIGHT : NONE2;
            var v = (dy < 0) ? UP : (dy > 0) ? DOWN : NONE2;

            if (h == NONE2 && v == NONE2)
                break;

            var nx = x + DX[h];
            var ny = y + DY[v];

            var wh = world.maze.isWall(nx, y) || h == NONE2;
            var wv = world.maze.isWall(x, ny) || v == NONE2;

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
 