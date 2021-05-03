const fsh = require('../shaders/blur_gassian.fsh');
const fsh1 = require('../shaders/blur_gassian_1.fsh');
const vsh = require('../shaders/blur_gassian.vsh');

cc.Class({
  extends: cc.Component,

  removeBlur() {
    if (this.blurTex) {
      this.blurTex.removeFromParent();
      this.blurTex = undefined;
    }
  },

  blur(blurRadius = 3) {
    this.removeBlur();

    // create shader program
    const program = new cc.GLProgram();
    // somehow, the two pass one does not work well on native, so use
    // the one pass solution.
    const isAndroid = cc.sys.os === cc.sys.OS_ANDROID;
    if (cc.sys.isNative) {
      // somehow fsh1 not work on android
      program.initWithString(vsh, isAndroid ? fsh : fsh1);
    } else program.initWithVertexShaderByteArray(vsh, fsh);
    program.addAttribute(cc.macro.ATTRIBUTE_NAME_POSITION, cc.macro.VERTEX_ATTRIB_POSITION);
    program.addAttribute(cc.macro.ATTRIBUTE_NAME_COLOR, cc.macro.VERTEX_ATTRIB_COLOR);
    program.addAttribute(cc.macro.ATTRIBUTE_NAME_TEX_COORD, cc.macro.VERTEX_ATTRIB_TEX_COORDS);
    program.link();
    program.updateUniforms();

    // draw current scene into render_texture
    // below can solve mask problem, but cocos has bug with it on iOS
    // cc.RenderTexture.create(cc.winSize.width, cc.winSize.height,
    //  cc.Texture2D.PIXEL_FORMAT_RGBA8888, gl.DEPTH_STENCIL);
    let bgTex = cc.RenderTexture.create(cc.winSize.width, cc.winSize.height);
    bgTex.begin();
    const l = cc.find('Canvas').getComponent('Level');
    cc.find('Canvas/top').active = false;
    cc.find('Canvas/bottom').active = false;
    (cc.find('Canvas/effect') || {}).active = false;
    cc.find('Canvas/mask').getComponent(cc.Mask).enabled = false;
    l.denglongs.parent.getComponent(cc.Mask).enabled = false;
    l.kates.parent.getComponent(cc.Mask).enabled = false;
    cc.find('Canvas')._sgNode.visit();
    cc.find('Canvas/top').active = true;
    cc.find('Canvas/bottom').active = true;
    (cc.find('Canvas/effect') || {}).active = true;
    cc.find('Canvas/mask').getComponent(cc.Mask).enabled = true;
    l.denglongs.parent.getComponent(cc.Mask).enabled = true;
    l.kates.parent.getComponent(cc.Mask).enabled = true;
    bgTex.end();

    program.use();
    const resolutionUni = program.getUniformLocationForName('resolution');
    const radiusUni = program.getUniformLocationForName('radius');
    const dirUni = program.getUniformLocationForName('dir');
    if (cc.sys.isNative) {
      const state = cc.GLProgramState.getOrCreateWithGLProgram(program);
      if (isAndroid) {
        state.setUniformFloat('resolution', cc.winSize.width);
        state.setUniformVec2('dir', { x: 1, y: 0 });
        state.setUniformFloat('radius', blurRadius);
      } else {
        state.setUniformVec2('resolution', { x: cc.winSize.width, y: cc.winSize.height });
        state.setUniformFloat('blurRadius', 20);
        state.setUniformFloat('sampleNum', 10);
      }
    } else {
      program.setUniformLocationF32(resolutionUni, cc.winSize.height);
      program.setUniformLocationF32(radiusUni, blurRadius);
      program.setUniformLocationWith2f(dirUni, 0, 1);
    }

    this.setProgram(bgTex, program);
    bgTex.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);

    let blurTex = cc.RenderTexture.create(cc.winSize.width, cc.winSize.height);
    blurTex.begin();
    bgTex.visit();
    blurTex.end();
    // bgTex.release(); // no release if not call retain

    if (cc.sys.isNative) {
      this.node._sgNode.addChild(blurTex);
      this.blurTex = blurTex;
      return;
    }

    program.use();
    program.setUniformLocationF32(resolutionUni, cc.winSize.width);
    program.setUniformLocationWith2f(dirUni, 1, 0);

    bgTex = blurTex;
    this.setProgram(bgTex, program);
    bgTex.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);

    blurTex = cc.RenderTexture.create(cc.winSize.width, cc.winSize.height);
    blurTex.begin();
    bgTex.visit();
    blurTex.end();
    // bgTex.release(); // no release if not call retain

    // blurTex.saveToFile('1.png', cc.IMAGE_FORMAT_PNG);
    // cc.log(jsb.fileUtils.getWritablePath());
    this.node._sgNode.addChild(blurTex);
    this.blurTex = blurTex;
  },

  setProgram(node, program) {
    if (cc.sys.isNative) {
      const state = cc.GLProgramState.getOrCreateWithGLProgram(program);
      node.setGLProgramState(state);
    } else {
      node.setShaderProgram(program);
    }

    const children = node.children;
    if (!children) return;

    for (let i = 0; i < children.length; i++) this.setProgram(children[i], program);
  },
});
