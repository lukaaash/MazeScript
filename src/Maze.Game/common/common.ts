
interface Process {
    hrtime(): Array<number>;
}

declare var process: Process;
declare var global: any;
declare var self: Window;

class PerformaceBrowser {

    private start: number;
    private hrtime: Function;

    constructor() {
        this.start = new Date().getTime();
    }

    now(): number {
        var t = (new Date().getTime() - this.start);
        return t;
    }
}


class PerformaceNode {

    private start: number;
    private hrtime: Function;

    constructor() {
        this.start = this.getTime();
    }

    now(): number {
        var t = (this.getTime() - this.start) / 1000000;
        return t;
    }

    private getTime() {
        var t = process.hrtime();
        return t[0] * 1000000000 + t[1];
    }

}

if (typeof performance === 'undefined') {
    if (typeof window !== 'undefined')
        window.performance = <any>new PerformaceBrowser();
    else if (typeof global === 'undefined')
        self.performance = <any>new PerformaceBrowser();
    else
        global.performance = <any>new PerformaceNode();
}
