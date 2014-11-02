/// <reference path="player.ts" /> 

class Avatar extends Player {

    private lastX: number;
    private lastY: number;

    constructor(id: number, options: PlayerOptions) {
        super(options);

        this._setId(id);

        this.lastX = this.x;
        this.lastY = this.y;
    }

    onreport(t: number, fromTime: number, moves: Array<number>, offset: number) {
        //console.log("Avatar ", this.id, ": ", fromTime, JSON.stringify(moves.slice(offset)));
        //console.log(this['route'].length / 4);
    }

    onstep(direction: number) {
        //console.log("Avatar", this.id, ": move", this.lastX, this.lastY, "->", this.x, this.y);
        this.lastX = this.x;
        this.lastY = this.y;
    }

}