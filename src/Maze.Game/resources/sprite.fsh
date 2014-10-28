precision mediump float;

uniform sampler2D texture;

varying vec2 v_texCoord;

void main()
{
	vec4 color = texture2D(texture, v_texCoord);
	gl_FragColor = color;
}
