uniform vec2 _viewport;

attribute vec2 _position;
attribute vec2 _coords;

varying vec2 v_texCoord;
varying vec2 v_pos;

void main()
{
	vec2 p = _position.xy;
	gl_Position = vec4(p.x * 2.0 / _viewport.x - 1.0, 1.0 - p.y * 2.0 / _viewport.y, 0.0, 1.0);
	v_texCoord = _coords.xy;
	v_pos = p / 128.0;
}
