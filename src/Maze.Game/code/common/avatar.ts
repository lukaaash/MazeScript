/// <reference path="player.ts" /> 

class Avatar extends Player {

    constructor(id: number, options: PlayerOptions) {
        super(options);

        this._setId(id);
    }

    onreport(t: number, fromTime: number, moves: Array<number>, offset: number) {
        console.log("Avatar ", this.id, ": ", fromTime, JSON.stringify(moves.slice(offset)));
    }


}