var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

class Maze {
    width: number;
    height: number;
    walls: Array<number>;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.walls = new Array<number>(width * height);
    }

    deserialize(data: any) {
        var packed = <Array<number>>data;

        this.walls = [];
        this.width = packed.shift();
        this.height = packed.shift();

        var offset = 0;
        while (packed.length > 0) {
            var v = packed.shift();
            var count;
            if (v < 0) {
                count = -v;
                v = packed.shift();
                while (count > 0) {
                    this.walls.push(v);
                    count--;
                }
            } else {
                this.walls.push(v);
            }
        }
    }

    serialize(): any {
        var packed = [this.width, this.height];
        var last = -1;
        var count = 0;
        for (var i = 0; i < this.walls.length; i++) {
            var v = this.walls[i] | 0;
            if (v == last) {
                count++;
                continue;
            } else {
                if (count == 1) {
                    packed.push(last);
                } else if (count > 1) {
                    packed.push(-count);
                    packed.push(last);
                }

                last = v;
                count = 1;
            }
        }

        if (count > 0) {
            packed.push(-count);
            packed.push(last);
        }

        return packed;
    }

    render() {
    }

    add(x: number, y: number) {
        this.set(x, y, 1);
    }

    remove(x: number, y: number) {
        this.set(x, y, 0);
    }

    toggle(x: number, y: number) {
        this.set(x, y, null);
    }

    set(x: number, y: number, w: number): boolean {
        x |= 0;
        y |= 0;
        w |= 0;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return false;

        var offset = y * this.width + x;
        var v = this.walls[offset] | 0;
        if (w == v)
            return false;

        this.walls[offset] = w;

        this.onchange(x, y);
        return true;
    }

    isWall(x: number, y: number): boolean {
        return this.get(x, y) != 0;
    }

    get(x: number, y: number): number {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return 1;

        var offset = y * this.width + x;
        var v = this.walls[offset];
        return v | 0;
    }

    onchange(x: number, y: number) {
    }

}


