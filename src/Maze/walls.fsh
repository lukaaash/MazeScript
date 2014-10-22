precision mediump float;

uniform sampler2D texture;
uniform sampler2D overlay;

varying vec2 v_texCoord;
varying vec2 v_pos;

void main()
{
	vec4 mask = texture2D(texture, v_texCoord);
	vec4 color = texture2D(overlay, v_pos);

	color *= mask * 2.0;
	gl_FragColor = color;
}
