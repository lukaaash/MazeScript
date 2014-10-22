/// <reference path="game.ts" />
/// <reference path="common.ts" />

module N4 {

    export class Shader {
        _game: Game;
        _shader: WebGLShader;

        ready: boolean;
        onload: Function;

        constructor(fileName: string, type: number) {
            this._game = getGame();
            var gl = this._game.GL;

            this._shader = gl.createShader(type);
            this.ready = false;

            var self = this;

            //TODO: cache shader objects
            //TODO: add support for string-based shaders (specified by an optional argument)
            //TODO: allow calling this before the object is ready (simple schedule it to be called when possible)
            //TODO: only call ready when all resources are loaded? (but then maybe add support for another event to be called before)

            this._game.loadText(fileName, e => {
                if (e['success']) {
                    var shader = this._shader;

                    gl.shaderSource(shader, e.text);
                    gl.compileShader(shader);

                    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                        var log = gl.getShaderInfoLog(shader);
                        gl.deleteShader(shader);
                        e = new Failure(this, 'Error while compiling shader.');
                        e['log'] = log;
                        //console.log("error: ", log);
                    } else {
                        e = new Success(this);
                        this.ready = true;
                    }
                }

                if (typeof this.onload == 'function') {
                    this.onload(e);
                }
            });
        }
    }

}