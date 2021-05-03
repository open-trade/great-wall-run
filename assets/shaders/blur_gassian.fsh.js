module.exports =
`
precision lowp float;
varying vec4 v_fragmentColor;
varying vec2 v_texCoord;

// uniform sampler2D CC_Texture0;
uniform float resolution;
uniform float radius;
uniform vec2 dir;

void main() {
    //this will be our RGBA sum
    vec4 sum = vec4(0.0);

    //our original texcoord for this fragment
    vec2 tc = v_texCoord;

    //the amount to blur, i.e. how far off center to sample from
    //1.0 -> blur by one pixel
    //2.0 -> blur by two pixels, etc.
    float blur = radius/resolution;

    //the direction of our blur
    //(1.0, 0.0) -> x-axis blur
    //(0.0, 1.0) -> y-axis blur
    float hstep = dir.x;
    float vstep = dir.y;

    //apply blurring, using a 15-tap filter with predefined gaussian weights
    sum += texture2D(CC_Texture0, vec2(tc.x - 7.0*blur*hstep, tc.y - 7.0*blur*vstep)) * 0.0044299121055113265;
    sum += texture2D(CC_Texture0, vec2(tc.x - 6.0*blur*hstep, tc.y - 6.0*blur*vstep)) * 0.00895781211794;
    sum += texture2D(CC_Texture0, vec2(tc.x - 5.0*blur*hstep, tc.y - 5.0*blur*vstep)) * 0.0215963866053;
    sum += texture2D(CC_Texture0, vec2(tc.x - 4.0*blur*hstep, tc.y - 4.0*blur*vstep)) * 0.0443683338718;
    sum += texture2D(CC_Texture0, vec2(tc.x - 3.0*blur*hstep, tc.y - 3.0*blur*vstep)) * 0.0776744219933;
    sum += texture2D(CC_Texture0, vec2(tc.x - 2.0*blur*hstep, tc.y - 2.0*blur*vstep)) * 0.115876621105;
    sum += texture2D(CC_Texture0, vec2(tc.x - 1.0*blur*hstep, tc.y - 1.0*blur*vstep)) * 0.147308056121;
    sum += texture2D(CC_Texture0, vec2(tc.x, tc.y)) * 0.159576912161;
    sum += texture2D(CC_Texture0, vec2(tc.x + 1.0*blur*hstep, tc.y + 1.0*blur*vstep)) * 0.147308056121;
    sum += texture2D(CC_Texture0, vec2(tc.x + 2.0*blur*hstep, tc.y + 2.0*blur*vstep)) * 0.115876621105;
    sum += texture2D(CC_Texture0, vec2(tc.x + 3.0*blur*hstep, tc.y + 3.0*blur*vstep)) * 0.0776744219933;
    sum += texture2D(CC_Texture0, vec2(tc.x + 4.0*blur*hstep, tc.y + 4.0*blur*vstep)) * 0.0443683338718;
    sum += texture2D(CC_Texture0, vec2(tc.x + 5.0*blur*hstep, tc.y + 5.0*blur*vstep)) * 0.0215963866053;
    sum += texture2D(CC_Texture0, vec2(tc.x + 6.0*blur*hstep, tc.y + 6.0*blur*vstep)) * 0.00895781211794;
    sum += texture2D(CC_Texture0, vec2(tc.x + 7.0*blur*hstep, tc.y + 7.0*blur*vstep)) * 0.0044299121055113265;

    //discard alpha for our simple demo, multiply by vertex color and return
    gl_FragColor = v_fragmentColor * vec4(sum.rgb, 1.0);
}
`;
