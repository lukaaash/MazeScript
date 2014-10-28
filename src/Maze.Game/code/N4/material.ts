/// <reference path="game.ts" />
/// <reference path="shader.ts" />
/// <reference path="texture.ts" />

module N4 {

    export var LOC_POSITION = 0;
    export var LOC_TEXTURE_COORDS = 1;
    export var LOC_SPRITE_PARAMS = 2;

    var NAME_POSITION = "_position";
    var NAME_COORDS = "_coords";
    var NAME_SPRITE = "_sprite";

    var NAME_MATRIX_WORLD_PROJECTION = "_worldProjectionMatrix"; //matrix4x4
    var NAME_MATRIX_WORLD = "_worldMatrix"; //matrix4x4
    var NAME_MATRIX_NORMAL = "_normalMatrix"; //matrix3x3
    var NAME_VIEWPORT = "_viewport"; //vec2
    var NAME_TIME = "_time"; //float

    var _typeToSize = [ // 0x8B50 - 0x8B62
        2, 3, 4, //FLOAT_VEC2, FLOAT_VEC3, FLOAT_VEC4
        2, 3, 4, //INT_VEC2, INT_VEC3, INT_VEC4,
        1, 2, 3, 4, //BOOL, BOOL_VEC2, BOOL_VEC3, BOOL_VEC4
        4, 9, 16, // FLOAT_MAT2, FLOAT_MAT3, FLOAT_MAT4
        1, 1, 1, 1, 1, 1, //SAMPLER_1D, SAMPLER_2D, SAMPLER_3D, SAMPLER_CUBE, SAMPLER_1D_SHADOW, SAMPLER_1D_SHADOW
    ];

    var _typeToType = [ // 0x8B50 - 0x8B60
        gl.FLOAT, gl.FLOAT, gl.FLOAT,
        gl.INT, gl.INT, gl.INT,
        gl.BOOL, gl.BOOL, gl.BOOL, gl.BOOL,
        gl.FLOAT, gl.FLOAT, gl.FLOAT,
        1, 2, 3, 4, 5, 6,
    ];

    class VariableInfo {
        name: string;
        type: number;
        elementsCount: number;
        elementFields: number;
        auto: boolean;

        constructor(info: WebGLActiveInfo) {
            this.name = info.name;
            this.elementsCount = info.size;
            this.auto = false;

            var type = null;

            switch (info.type) {
                case gl.FLOAT:
                case gl.INT:
                case gl.BOOL:
                    this.type = type = info.type;
                    this.elementFields = 1;
                    return;
            }

            type = info.type;

            //GL_FLOAT, GL_FLOAT_VEC2, GL_FLOAT_VEC3, GL_FLOAT_VEC4
            //GL_INT, GL_INT_VEC2, GL_INT_VEC3, GL_INT_VEC4,
            //GL_BOOL, GL_BOOL_VEC2, GL_BOOL_VEC3, GL_BOOL_VEC4,
            //GL_FLOAT_MAT2, GL_FLOAT_MAT3, GL_FLOAT_MAT4
            //GL_SAMPLER_2D, GL_SAMPLER_CUBE
            //GL_SAMPLER_1D GL_SAMPLER_2D GL_SAMPLER_3D (only 2D supporten by OpenGL ES 2.0)
            //GL_SAMPLER_1D_SHADOW GL_SAMPLER_2D_SHADOW (not supported by OpenGL ES 2.0)

            if (type < 0x8B50 || type > 0x8B62) {
                throw "Unexpected variable type";
            }

            type -= 0x8B50;

            this.elementFields = _typeToSize[type];
            this.type = _typeToType[type];
        }
    }

    class UniformInfo extends VariableInfo {
        location: WebGLUniformLocation;
        matrix: number;
        method: string;

        constructor(info: WebGLActiveInfo) {
            super(info);

            switch (info.type) {
                case gl.FLOAT_MAT2:
                    this.matrix = 2;
                    break;
                case gl.FLOAT_MAT3:
                    this.matrix = 3;
                    break;
                case gl.FLOAT_MAT4:
                    this.matrix = 4;
                    break;
                default:
                    this.matrix = 1;
            }


            if (this.matrix > 1) {
                this.method = "uniformMatrix" + this.matrix + "f";
            } else {
                this.method = "uniform" + this.elementFields;

                if (this.type == gl.FLOAT)
                    this.method += 'f';
                else
                    this.method += 'i';
            }

            switch (info.name) {
                case NAME_MATRIX_WORLD_PROJECTION:
                case NAME_MATRIX_WORLD:
                case NAME_MATRIX_NORMAL:
                case NAME_VIEWPORT:
                case NAME_TIME:
                    //TODO: make sure the type and size match the expected value
                    this.auto = true;
                    break;
            }

        }
    }

    class AttributeInfo extends VariableInfo {
        location: number;

        constructor(info: WebGLActiveInfo) {
            super(info);

            switch (info.name) {
                case NAME_POSITION:
                case NAME_COORDS:
                case NAME_SPRITE:
                    //TODO: make sure the type and size match the expected value
                    this.auto = true;
                    break;
            }

        }
    }

    export class MaterialInfo {

        vertexShader: Shader;
        fragmentShader: Shader;

        blending: boolean;
        transparent: boolean;
    }

    export class Material {

        _game: Game;
        GL: WebGLRenderingContext;

        _program: WebGLProgram;

        private _uniforms: Array<UniformInfo>;
        private _attributes: Array<AttributeInfo>;

        _autos: Array<Object>;
        _textures: Array<Texture>;

        ready: boolean;
        onload: Function;

        blending: boolean;

        constructor(info: MaterialInfo) {
            this._game = getGame();
            var gl = this._game.GL;
            var program = gl.createProgram();

            this.GL = gl;
            this.ready = false;
            this._program = program;
            this._uniforms = [];
            this._attributes = [];
            this._autos = [];
            this._textures = [];

            var self = this;

            var async = false;

            var vertexShader = info.vertexShader;
            if (!vertexShader.ready) {
                vertexShader.onload = e => init(e);
                async = true;
            }

            var fragmentShader = info.fragmentShader;
            if (!fragmentShader.ready) {
                fragmentShader.onload = e => init(e);
                async = true;
            }

            if (!async)
                init(new Success(this));

            function init(e: Result) {
                if (e.success) {
                    if (!vertexShader.ready)
                        return;

                    if (!fragmentShader.ready)
                        return;

                    gl.attachShader(program, vertexShader._shader);
                    gl.attachShader(program, fragmentShader._shader);

                    // bind 'automatic' attribute locations
                    gl.bindAttribLocation(program, LOC_POSITION, NAME_POSITION);
                    gl.bindAttribLocation(program, LOC_TEXTURE_COORDS, NAME_COORDS);
                    gl.bindAttribLocation(program, LOC_SPRITE_PARAMS, NAME_SPRITE);

                    gl.linkProgram(program);

                    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                        var log = gl.getProgramInfoLog(program);
                        e = new Failure(self, "Error while linking program.");
                        e['log'] = log;
                    } else {

                        self._initialize(info);

                        e = new Success(self);
                    }
                } else {
                    console.log("Error: ", e.message, ' ', e['log']);
                }

                //TODO: if (async == true), call the callback during a next tick, otherwise it won't work at all

                if (typeof self.onload == 'function') {
                    self.onload(e);
                }
            }

        }

        _initialize(info: MaterialInfo) {
            var gl = this.GL;
            var program = this._program;

            var attributesCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

            for (var n = 0; n < attributesCount; n++) {
                var ai = gl.getActiveAttrib(program, n);

                var attribute = new AttributeInfo(ai);
                attribute.location = gl.getAttribLocation(program, ai.name);

                this._attributes.push(attribute);
                this._attributes[attribute.name] = attribute;

                if (attribute.auto)
                    this._autos[attribute.name] = attribute;

                console.log(attribute.name + " " + attribute.type.toString(16) + " " + attribute.elementsCount + " " + attribute.elementFields + " " + attribute.auto);
            }

            var uniformsCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
            for (var n = 0; n < uniformsCount; n++) {

                var ui = gl.getActiveUniform(program, n);

                var uniform = new UniformInfo(ui);
                uniform.location = gl.getUniformLocation(program, ui.name);

                this._uniforms.push(uniform);
                this._uniforms[uniform.name] = uniform;

                if (uniform.auto)
                    this._autos[uniform.name] = uniform;

                console.log(uniform.name + " " + uniform.type.toString(16) + " " + attribute.elementsCount + " " + uniform.elementFields + " " + uniform.auto);
            }

            gl.useProgram(program);

            for (var propertyName in info) {
                var value = info[propertyName];
                if (typeof value === 'undefined')
                    continue;

                switch (propertyName) {
                    case 'vertexShader':
                    case 'fragmentShader':
                        continue;
                    case 'blending':
                        this.blending = (value == true);
                        break;
                    case 'transparent':
                        break;
                }

                if (value == null)
                    continue;

                if (value instanceof Texture) {
                    var unit = this._textures.length;
                    this._textures.push(<Texture>value);
                    value = unit;
                }

                this.setUniform(propertyName, value, true);
            }

            this.ready = true;
        }

        use() {
            var game = this._game;
            var gl = this.GL;
            var program = this._program;

            gl.useProgram(program);

            this._textures.forEach((value, index) => {
                gl.activeTexture(gl.TEXTURE0 + index);
                gl.bindTexture(gl.TEXTURE_2D, value._texture);
            });

            if (this.blending) {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.enable(gl.BLEND);
            } else {
                gl.disable(gl.BLEND);
            }

            gl.disable(gl.DEPTH_TEST);

            gl.disable(gl.CULL_FACE);
            //gl.frontFace(gl.CW);

            for (var name in this._autos) {
                switch (name) {
                    case NAME_VIEWPORT:
                        this.setUniform(name, [game._viewportW, game._viewportH], false);
                        break;
                }

            }
        }

        setUniform(name: string, value: any, ignoreNotFound?: boolean) {

            var uniform = <UniformInfo>this._uniforms[name];
            if (uniform == null) {
                if (ignoreNotFound === true)
                    return;

                throw "Uniform not found";
            }

            var gl = this.GL;
            var loc = uniform.location;

            if (!Array.isArray(value)) {
                if (uniform.elementFields != 1)
                    throw "Uniform item fields mismatch";

                if (uniform.elementsCount != 1)
                    throw "Uniform items count mismatch";

                switch (uniform.type) {
                    case gl.FLOAT:
                        gl.uniform1f(loc, value);
                        break;
                    case gl.INT:
                    case gl.BOOL:
                    default:
                        gl.uniform1i(loc, value);
                        break;
                }

            } else if (uniform.matrix > 1) {
                //TODO: check that sizes match
                switch (uniform.matrix) {
                    case 2:
                        gl.uniformMatrix2fv(loc, true, value);
                        break;
                    case 3:
                        gl.uniformMatrix3fv(loc, true, value);
                        break;
                    case 4:
                        gl.uniformMatrix4fv(loc, true, value);
                        break;
                }
            } else {
                //TODO: check that sizes match
                switch (uniform.elementFields) {
                    case 1:
                        gl.uniform1fv(loc, value);
                        break;
                    case 2:
                        gl.uniform2fv(loc, value);
                        break;
                    case 3:
                        gl.uniform3fv(loc, value);
                        break;
                    case 4:
                        gl.uniform4fv(loc, value);
                        break;
                }
            }

        }


    }

}
