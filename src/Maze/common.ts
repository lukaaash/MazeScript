module N4 {

    export var gl = WebGLRenderingContext;

    export class Result {
        sender: Object;
        success: boolean;
        message: string;
    }

    export class Success extends Result {
        constructor(sender: Object) {
            super();
            this.sender = sender;
            this.success = true;
            this.message = 'Success';
        }
    }

    export class Failure extends Result {
        constructor(sender: Object, message: string) {
            super();
            this.sender = sender;
            this.success = false;
            this.message = message;
        }
    }

    export class Color {
        private _r: number;
        private _g: number;
        private _b: number;

        get R(): number {
            return this._r;
        }

        get G(): number {
            return this._g;
        }

        get B(): number {
            return this._b;
        }

        private static _black: Color = new Color(0, 0, 0);

        static get Black(): Color {
            return Color._black;
        }

        constructor(r: number, g: number, b: number) {
            this._r = this.from(r);
            this._g = this.from(g);
            this._b = this.from(b);
        }

        private from(v: number): number {
            if (v < 0)
                return 0.0;
            if (v > 255)
                return 1.0;
            if (v > 1)
                return v / 255.0;

            return v;
        }
    }

    export function MIN(a: any, b: any) {
        if (a <= b)
            return a;
        else
            return b;
    }

    export function MAX(a: any, b: any) {
        if (a >= b)
            return a;
        else
            return b;
    }

}
