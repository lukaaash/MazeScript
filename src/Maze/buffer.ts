/// <reference path="game.ts" />

module N4 {

    export class Buffer {
        _game: Game;
        _target: number;
        _usage: number;
        _buffer: WebGLBuffer;

        constructor(target: number, size: number, dynamic: boolean) {
            this._game = getGame();
            var gl = this._game.GL;

            this._target = target;
            this._usage = dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
            this._buffer = gl.createBuffer();
            gl.bindBuffer(target, this._buffer);
            gl.bufferData(target, size, this._usage);
        }

        update(offset: number, data: any) {
            var gl = this._game.GL;
            gl.bindBuffer(this._target, this._buffer);
            gl.bufferSubData(this._target, offset, data);
        }

        resize(newSize: number) {
            var gl = this._game.GL;
            gl.bindBuffer(this._target, this._buffer);
            gl.bufferData(this._target, newSize, this._usage);
        }
    }

}