/// <reference path="Window.d.ts" />
/// <reference path="common.ts" />


module N4 {

    var _game: Game = null;

    function setGame(game: Game) {
        _game = game;
    }

    export function getGame() {
        return _game;
    }

    export class Game {

        private _gl: WebGLRenderingContext;
        private _width: number;
        private _height: number;
        private _scale: number;

        get width(): number {
            return this._width;
        }

        get height(): number {
            return this._height;
        }

        get scale(): number {
            return this._scale;
        }

        get GL() : WebGLRenderingContext {
            return this._gl;
        }

        private _events: Object;
        private _ready: boolean;

        private _animationTime: number;
        private _animationStart: number;

        // not implemented by N4 Shell
        private _canvas: HTMLCanvasElement;
        private _requestAnimationId: number;

        // both
        _viewportX: number;
        _viewportY: number;
        _viewportH: number;
        _viewportW: number;
        private _viewportChangeCounter: number;

        private _backColor: Color;

        constructor(canvas?: HTMLCanvasElement) {
            var N4shell = (typeof window.N4Shell !== 'undefined');

            if (!N4shell) {
                if (typeof canvas === 'undefined' || canvas == null)
                    canvas = document.getElementsByTagName("canvas")[0];

                if (typeof canvas === 'undefined' || canvas == null)
                    throw "Canvas not specified and no '#canvas' element found";
            }

            this._ready = false;
            this._events = new Object();
            this._backColor = Color.Black;

            if (_game == null) {
                setGame(this);
            }

            if (N4shell) {

                window.register(this);

                this._start();

            } else {

                this._animationStart = null;
                this._requestAnimationId = null;
                this._gl = null;
                this._canvas = canvas;
                this._updateCanvasSize();

                var intervalId = setInterval(() => {
                    if (document.readyState === "complete") {
                        clearInterval(intervalId);
                        this._ready = true;
                        this._init();
                    }
                }, 10);
            }
        }

        on(eventName: string, callback: Function) {
            this._events[eventName] = callback;
        }

        onActivate(callback: Function) {
            this.on('activate', callback);
        }

        onReady(callback: Function) {
            this.on('ready', callback);
        }

        onRender(callback: Function) {
            this.on('render', callback);
        }

        onResize(callback: Function) {
            this.on('resize', callback);
        }

        onKeyDown(callback: Function) {
            this.on('keydown', callback);
        }

        onKeyUp(callback: Function) {
            this.on('keyup', callback);
        }

        onKeyPress(callback: Function) {
            this.on('keypress', callback);
        }

        onMouseMove(callback: Function) {
            this.on('mousemove', callback);
        }

        onMouseDown(callback: Function) {
            this.on('mousedown', callback);
        }

        onMouseUp(callback: Function) {
            this.on('mouseup', callback);
        }

        onMouseWheel(callback: Function) {
            this.on('mousewheel', callback);
        }

        private _raise(eventName: string, e: Object) {
            e['type'] = eventName;
            var callback = this._events[eventName];
            if (typeof callback == 'function')
                callback(e);
        }

        get animationTime(): number {
            return this._animationTime;
        }

        get time(): number {
            return performance.now();
        }

        private _render(t: number) {
            var gl = this._gl;
            var color = this._backColor;

            gl.disable(gl.SCISSOR_TEST);
            gl.clearColor(color.R, color.G, color.B, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if (this._animationStart == null) {
                this._animationStart = performance.now() - t;
            }

            this._animationTime = this._animationStart + t;

            this._raise('render', this._animationTime);

            this._animationTime = null;
        }

        private _renderEvent(t) {
            this._render(t);

            this._requestAnimationId = window.requestAnimationFrame(t => this._renderEvent(t));
        }

        private _updateCanvasSize() {
            if (this._canvas == null)
                return;

            var width = this._canvas.clientWidth;
            var height = this._canvas.clientHeight;
            var scale = window.devicePixelRatio;
            var ratio = Math.round(scale * 100);

            var w = (width * scale) | 0;
            var h = (height * scale) | 0;

            //TODO: rozpoznavani blizkych skutecnych hodnot screen_width a z toho i kompenzace yres?
            //console.log('resize: ' + width + "x" + height + " -> " + w + "x" + h + " (ratio " + ratio + ")");

            this._scale = scale;
            this._canvas.width = this._width = w;
            this._canvas.height = this._height = h;
        }

        private _resizeEvent() {
            var width = this.width;
            var height = this.height;
            var scale = this.scale;

            this._updateCanvasSize();

            if (width == this.width && height == this.height && scale == this.scale)
                return;

            this._resize(width, height, scale);
        }

        private _resize(oldWidth: number, oldHeight: number, oldScale: number) {

            var dy = this.height - oldHeight;
            var counter = this._viewportChangeCounter;

            var e = new Object();
            e['width'] = this.width;
            e['height'] = this.height;
            e['scale'] = this.scale;
            this._raise('resize', e);

            if (counter == this._viewportChangeCounter) {
                this._moveViewport(0, dy);
            }
        }

        private _mouseWheel(event: WheelEvent) {
            event.preventDefault();
            if (event['handled'])
                return;
            event['handled'] = true;

            var deltaY = 0;
            switch (event.deltaMode) {
                case 0: //DOM_DELTA_PIXEL (Chrome 38)
                    deltaY = event['wheelDeltaY'];
                    if (typeof deltaY !== 'undefined')
                        deltaY /= 120.0; // Chrome 38 on Windows provides native units (one unit of 120) as well
                    else
                        deltaY = event.deltaY / 100.0; // in Chrome 38 on Windows, one unit is 100
                    break;
                case 1: //DOM_DELTA_LINE (Firefox 31)
                    deltaY = event.deltaY / 3.0; // in Firefox 31 on Windows, one unit is 3
                    break;
            }

            if (deltaY == 0)
                return;

            //TODO: make x and y available as well
            var e = new Object();
            e['deltaY'] = deltaY;
            this._raise("mousewheel", e);
        }

        private _mouseEvent(event: MouseEvent) {

            event.preventDefault();
            if (event['handled'])
                return;

            event['handled'] = true;

            var canvas = this._canvas;

            var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
            var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);

            var x = event.pageX - scrollX + canvas.clientLeft;
            var y = event.pageY - scrollY + canvas.clientTop;

            // transform css coords to backbuffer coords
            x *= this.scale;
            y *= this.scale;

            var e = new Object();
            e['x'] = x;
            e['y'] = y;
            switch (event.type) {
                case 'mousedown':
                    e['button'] = event.button;
                    e['action'] = 1;
                    break;
                case 'mouseup':
                    e['button'] = event.button;
                    e['action'] = 2;
                    break;
                case 'mousemove':
                    break;
                default:
                    return;
            }

            //console.log(event.type, x, y);
            this._raise(event.type, e);
        }

        private _keyEvent(event: KeyboardEvent) {
            event.stopPropagation();

            if (event.type == 'keydown') {
                if (event.keyCode == 116) return;
                if (event.keyCode == 82 && event.ctrlKey) return;
            }

            var e = new Object();

            if (event.type == 'keypress') {
                var c;
                if (typeof event.char == 'undefined') {
                    if (event.charCode != 0) {
                        // convert characters
                        c = String.fromCharCode(event.charCode);
                    } else {
                        // Firefox posts special characters such as arrows as well
                        return;
                    }
                } else {
                    // standard, but not supported by Chrome and Firefox
                    c = event.char;
                }

                //console.log(e.type + " '" + c + "' ");
                e['char'] = c;
                this._raise('keypress', e);
            } else {
                var c;
                if (typeof event.key == 'undefined') {
                    // Chrome does not support e.key yet

                    c = event.keyCode;

                    if (event.location == 3) { // DOM_KEY_LOCATION_NUMPAD
                        if (c >= 96 && c <= 105)
                            c -= 48;
                    }

                } else {
                    c = 0;

                    //console.log(event.type, ": ", event.key);

                    if (event.location == 3) { // DOM_KEY_LOCATION_NUMPAD
                        // Firefox doesn't assign 'proper' codes to these
                        switch (event.key) {
                            case '*': c = 0x6A; break;
                            case '+': c = 0x6B; break;
                            case '-': c = 0x6D; break;
                            case '.': c = 0x6E; break;
                            case '/': c = 0x6F; break;
                        }
                    }

                    if (c == 0)
                        c = this._keyToCode(event.key);

                    if (c == 0) {
                        c = event.keyCode; //'[' + e.key + ']';
                        c = '[' + event.key + ']';
                    }
                }

                switch (c) {
                    case 8: // backspace
                    case 9: // tab
                    case 27: // escape (see https://bugs.webkit.org/show_bug.cgi?id=78206)
                    case 0x6F: // numeric divide
                        event.preventDefault();
                        break;
                }

                //console.log(event.type + " " + c);
                e['code'] = c;
                this._raise(event.type, e);
            }
        }

        private _keyToCode(key: string) {
            if (key.length == 1) {
                var code = key.charCodeAt(0);

                if (code >= 0x30 && code <= 0x39) // 0..9
                    return code;
                if (code >= 0x41 && code <= 0x5A) // A..Z
                    return code;
                if (code >= 0x61 && code <= 0x7A) // a..z
                    return code - 0x20;

                return 0;
            }

            //0x5B left cmd
            //0x5D right cmd

            switch (key) {
                default:
                case "Exit":
                case "Meta":
                case "Equals": return 0;

                case "Backspace": return 0x08;
                case "Tab": return 0x09;
                case "Clear": return 0x0C;
                case "Enter": return 0x0D;
                case "Shift": return 0x10;
                case "Control": return 0x11;
                case "Alt": return 0x12;
                case "CapsLock": return 0x14;

                case "Esc":
                case "Escape":
                case "BrowserBack": return 0x1B;
                case "Spacebar": return 0x20;
                case "PageUp": return 0x21;
                case "PageDown": return 0x22;
                case "End": return 0x23;
                case "Home": return 0x24;
                case "Left":
                case "ArrowLeft": return 0x25;
                case "Up":
                case "ArrowUp": return 0x26;
                case "Right":
                case "ArrowRight": return 0x27;
                case "Down":
                case "ArrowDown": return 0x28;
                case "Insert": return 0x2D;
                case "Del":
                case "Delete": return 0x2E;
                case "Help": return 0x2F;

                case "Apps":
                case "Menu":
                case "ContextMenu": return 0x5D;

                case "Multiply": return 0x6A;
                case "Add": return 0x6B;
                case "Separator": return 0x6C;
                case "Subtract": return 0x6D;
                case "Decimal":
                case "Dot": return 0x6E;
                case "Divide": return 0x6F;

                case "F1": return 0x70;
                case "F2": return 0x71;
                case "F3": return 0x72;
                case "F4": return 0x73;
                case "F5": return 0x74;
                case "F6": return 0x75;
                case "F7": return 0x76;
                case "F8": return 0x77;
                case "F9": return 0x78;
                case "F10": return 0x79;
                case "F11": return 0x7A;
                case "F12": return 0x7B;
                case "F13": return 0x7C;
                case "F14": return 0x7D;
                case "F15": return 0x7E;
                case "F16": return 0x7F;
                case "F17": return 0x80;
                case "F18": return 0x81;
                case "F19": return 0x82;
                case "F20": return 0x83;
                case "F21": return 0x84;
                case "F22": return 0x85;
                case "F23": return 0x86;
                case "F24": return 0x87;

                case "NumLock": return 0x90;

                case "Scroll":
                case "ScrollLock": return 0x91
}
        }

        private _init() {
            if (!this._ready)
                throw 'Not ready yet';

            if (typeof this._canvas != 'object')
                throw 'Canvas not specifid';

            if (typeof this._canvas.getContext != 'function') {
                alert("Canvas does not support contexts");
            }

            this._updateCanvasSize();

            this._gl = this._getContext();
            if (!this.GL) {
                if (window.WebGLRenderingContext) {
                    alert("WebGL is supported by your browser, but it cannot currently be used.");
                } else {
                    alert("WebGL is not supported by your browser.");
                }
                return;
            }

            function receiveEvent(e) {
                //console.log('Event: ' + e.type + " " + e.keyCode);
            }

            window.onresize = () => this._resizeEvent();

            window.addEventListener("focus", receiveEvent);
            window.addEventListener("blur", receiveEvent);
            document.addEventListener("visibilitychange", receiveEvent);

            document.addEventListener("keydown", e => this._keyEvent(e));
            document.addEventListener("keyup", e => this._keyEvent(e));
            document.addEventListener("keypress", e => this._keyEvent(e));

            window.addEventListener("mousemove", e => this._mouseEvent(e));
            window.addEventListener("mousedown", e => this._mouseEvent(e));
            window.addEventListener("mouseup", e => this._mouseEvent(e));
            window.addEventListener("wheel", e => this._mouseWheel(<WheelEvent>e));

            this._start();

            this._requestAnimationId = window.requestAnimationFrame(t => this._renderEvent(t));
        }

        private _start() {
            this._raise('ready', new Object());

            var gl = this.GL;

            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            this.setViewport(0, 0, -1, -1, 1);
        }

        private _getContext(): WebGLRenderingContext {

            var canvas = this._canvas;

            function onContextCreationError(event) {
                console.log("WebGL context creation error: " + event.statusMessage);
            }

            var contextAttributes = {
                antialias: false,
                alpha: false,
                preserveDrawingBuffer: false
            };

            var gl = null;
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
                ['webgl', 'experimental-webgl'].some(function (webglId) {
                    return gl = canvas.getContext(webglId, contextAttributes);
                });
            } catch (e) {
                console.log("WebGL context creation failure: " + e);
            } finally {
                canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }

            return gl;
        }

        private _moveViewport(deltaX: number, deltaY: number) {
            var gl = this.GL;
            this._viewportX += deltaX;
            this._viewportY += deltaY;
            gl.viewport(this._viewportX, this._viewportY, this._viewportW, this._viewportH);

            if (gl.isEnabled(gl.SCISSOR_TEST))
                gl.scissor(this._viewportX, this._viewportY, this._viewportW, this._viewportH);

            this._viewportChangeCounter = (this._viewportChangeCounter + 1) & 0xFFFFFFFF;
        }

        setViewport(x: number, y: number, width: number, height: number, fov: number) {
            //TODO: add fov-kind (see http://en.wikipedia.org/wiki/Field_of_view_in_video_games)
            var gl = this.GL;

            if (width < 0)
                width = this.width;

            if (height < 0)
                height = this.height;

            y = this.height - height - y;

            x = MAX(x, 0);
            y = MAX(y, 0);
            width = MIN(x + width, this.width) - x;
            height = MIN(y + height, this.height) - y;

            gl.viewport(x, y, width, height);
            this._viewportX = x;
            this._viewportY = y;
            this._viewportW = width;
            this._viewportH = height;

            if (x > 0 || y > 0 || width < this.width || height < this.height) {
                gl.scissor(x, y, width, height);
                gl.enable(gl.SCISSOR_TEST);
            }
            else {
                gl.disable(gl.SCISSOR_TEST);
            }


            if (fov > 3.0)
                fov = 3.0;
            /*
            float aspect = float(width) / float(height);

            float scale = 1.0f; // used by n2 demos
            scale = scale / sqrtf(aspect); // let's try something else

            float n = 0.01f; //near view plane
            float f = 1000.0f; //far view plane

            float xScale = scale / tanf(fov / 2.0f);
            float yScale = xScale * aspect;

            Matrix projection = Matrix();
            projection.X.X = xScale;
            projection.Y.Y = yScale;
            projection.Z.Z = (f + n) / (f - n);
            projection.Z.W = 1.0f;
            projection.P.Z = (2.0f * n * f) / (n - f);
            projection.P.W = 0.0f;

            SetProjectionMatrix(projection);
            */

            this._viewportChangeCounter = (this._viewportChangeCounter + 1) & 0xFFFFFFFF;
        }

        get title() : string {
            return document.title;
        }

        set title(title: string) {
            document.title = title;
        }

        get backColor(): Color {
            return this._backColor;
        }

        set backColor(color: Color) {
            this._backColor = color;
        }

        loadText(fileName: string, callback: Function) {

            var req = new XMLHttpRequest();

            req.addEventListener("load", event => {
                var target = <XMLHttpRequest>event.target;
                var e;

                if (target.status == 200) {
                    e = new Success(this);
                    e['text'] = target.responseText;
                } else {
                    e = new Failure(this, target.statusText);
                    e['text'] = null;
                    e['status'] = target.status;
                }
                callback(e);
            }, false);

            req.addEventListener("error", event => {
                // only fires for network-level events
                var e = new Failure(this, 'Network error');
                callback(e);
            }, false);

            req.open("GET", fileName, true);
            req.overrideMimeType("text/plain; charset=utf-8");
            try {
                req.send();
            } catch (error) {
                var e = new Failure(this, event['message']);
                e['code'] = event['code'];
                callback(e);
            }
        }
    }
}
