
interface Process {
    hrtime(): Array<number>;
}

declare var process: Process;
declare var global: any;

class PerformaceBad {

    private start: number;
    private hrtime: Function;

    constructor() {
        this.start = this.getTime();
    }

    now(): number {
        return (this.getTime() - this.start) / 1000000;
    }

    private getTime() {
        var t = process.hrtime();
        return t[0] * 1000000000 + t[1];
    }
}

class Performace {

    private start2: number;
    private start: number;
    private hrtime: Function;

    constructor() {
        this.start = this.getTime();
        this.start2 = new Date().getTime();
    }

    now(): number {
        var x = (this.getTime() - this.start) / 1000000;
        //var y = (new Date().getTime() - this.start2) * 1000;
        //console.log(x, y);
        return x;
    }

    private getTime() {
        var t = process.hrtime();
        return t[0] * 1000000000 + t[1];
    }

}


if (typeof performance === 'undefined') {
    global.performance = new Performace();
}
