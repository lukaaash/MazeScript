/// <reference path="player.ts" />

class Bird extends Robot {

    private target: ITarget;
    private danger: ITarget;
    private safeDistance: number;
    private isIdle: boolean;

    constructor(sprite: number, x: number, y: number, speed?: number) {
        super(new PlayerOptions(sprite, x, y, speed));
        this.target = null;
    }

    avoid(danger: ITarget, safeDistance: number) {
        this.target = null;
        this.danger = danger;
        this.safeDistance = safeDistance;
        this.isIdle = false;
        this.poke();
    }

    step(direction: number) {
        var dx = this.danger.x - this.x;
        var dy = this.danger.y - this.y;
        var distance = Math.abs(dx) + Math.abs(dy);
        if (distance < this.safeDistance)
            this.poke();
    }

    idle() {
        this.isIdle = true;
        this.poke();
    }

    think() {
        var dx = this.danger.x - this.x;
        var dy = this.danger.y - this.y;
        var distance = Math.abs(dx) + Math.abs(dy);

        var panic = false;
        var moves = [];
        for (var i = 0; i < 2; i++) {
            if (distance < this.safeDistance || this.target == null || this.isIdle) {
                this.isIdle = false;

                if (panic) {
                    var angle = Math.random() * Math.PI * 2;
                    dx = Math.cos(angle) * 10;
                    dy = Math.sin(angle) * 10;
                } else if (distance < this.safeDistance) {
                    dx = -dx;
                    dy = -dy;
                } else {
                    dx = (Math.random() - 0.5) * 20;
                    dy = (Math.random() - 0.5) * 20;
                }

                this.target = {
                    x: this.x + dx,
                    y: this.y + dy
                };
            }

            moves = this.find(this.target);
            if (moves.length > 0)
                break;

            if (distance < 3)
                panic = true;
        }

        this.move(moves);
    }

} 
 