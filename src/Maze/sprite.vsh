uniform vec2 _viewport;

attribute vec4 _position; // [px, py, x, y]
attribute vec3 _coords; // [tx, ty, rotation]
attribute vec2 _sprite; // [scale, alpha]

varying vec2 v_texCoord;

void main()
{
	float c = cos(_coords.z);
	float s = sin(_coords.z);
	vec2 p = _position.zw * _sprite.x / 256.0;
	p = vec2(p.x * c - p.y * s + _position.x, p.x * s + p.y * c + _position.y);
	gl_Position = vec4(p.x * 2.0 / _viewport.x - 1.0, 1.0 - p.y * 2.0 / _viewport.y, 0.0, 1.0);
	v_texCoord = _coords.xy;
}
