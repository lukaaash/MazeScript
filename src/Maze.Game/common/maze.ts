var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

class Maze {
    width: number;
    height: number;
    walls: Array<number>;
    codes: Array<number>;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.walls = new Array<number>(width * height);
        this.codes = new Array<number>(width * height);
        for (var i = 0; i < width * height; i++) {
            this.walls[i] = 0;
            this.codes[i] = 36;
        }
    }

    render() {
    }

    add(x: number, y: number) {
        this.change(x, y, 1);
    }

    remove(x: number, y: number) {
        this.change(x, y, 0);
    }

    toggle(x: number, y: number) {
        this.change(x, y, null);
    }

    change(x: number, y: number, w: number) {
        x |= 0;
        y |= 0;
        w &= 1;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return;

        var offset = y * this.width + x;
        var v = this.walls[offset];
        if (w == v)
            return;

        if (w == null)
            w = 1 - v;

        this.walls[offset] = w;

        this.onchange(x, y);
    }

    isWall(x: number, y: number) {
        return this._get(x, y) != 0;
    }

    _get(x: number, y: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return 1;

        var offset = y * this.width + x;
        var v = this.walls[offset];
        return (v == 0) ? 0 : 1;
    }

    onchange(x: number, y: number) {
    }

}


