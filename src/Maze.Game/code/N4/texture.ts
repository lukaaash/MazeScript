/// <reference path="game.ts" />
/// <reference path="common.ts" />

module N4 {

    export class Texture {
        _game: Game;
        _texture: WebGLTexture;

        ready: boolean;
        onload: Function;

        width: number;
        height: number;

        constructor(fileName: string) {
            this._game = getGame();
            var gl = this._game.GL;

            this._texture = gl.createTexture();
            this.ready = false;

            var self = this;

            //TODO: cache texture objects
            //TODO: add support for image-based textures
            //TODO: allow calling this before the object is ready (simply schedule it to be called when possible)

            //TODO: handle errors!

            var image = new Image();
            image.onload = () => {

                console.log('Loaded texture: ' + image.width + 'x' + image.height);
                gl.bindTexture(gl.TEXTURE_2D, this._texture);

                //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.pixels);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                this.ready = true;
                this.width = image.width;
                this.height = image.height;

                var e = new Success(this);
                if (typeof this.onload == 'function') {
                    this.onload(e);
                }
            }

        image.src = fileName;
        }

    };

}