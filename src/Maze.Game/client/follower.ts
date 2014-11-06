/// <reference path="player.ts" />
/// <reference path="robot.ts" />

class Follower extends Robot {

    private target: ITarget;
    private alternative: ITarget;
    private isIdle: boolean;

    constructor(sprite: number, x: number, y: number, speed?: number) {
        super(new PlayerOptions(sprite, x, y, speed));
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

} 
 