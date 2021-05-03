module.exports =
`
attribute vec4 a_position;
attribute vec2 a_texCoord;
attribute vec4 a_color;
varying lowp vec4 v_fragmentColor;
varying mediump vec2 v_texCoord;
void main()
{
    gl_Position = CC_PMatrix * a_position;
    v_fragmentColor = a_color;
    v_texCoord = a_texCoord;
}
`;
