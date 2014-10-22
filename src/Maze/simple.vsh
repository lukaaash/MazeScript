attribute vec4 _position;
attribute vec2 _coords;

uniform vec2 _viewport;

varying vec2 v_texCoord;

void main()
{ 
	vec2 p = _position.xy;
	gl_Position = vec4(p.x * 2.0 / _viewport.x - 1.0, 1.0 - p.y * 2.0 / _viewport.y, 0.0, 1.0);
	v_texCoord = _coords.xy;
}
