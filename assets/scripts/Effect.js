const game = require('./Game');

const vsh = require('../shaders/blur_gassian.vsh');

cc.Class({
  extends: cc.Component,

  properties: {
    flagShader: '',
  },

  load() {
    const l = cc.find('Canvas').getComponent('Level');
    if (l) this.player = l.player;
    const self = this;
    this.parameters = {
      startTime: Date.now(),
      time: 0.0,
      mouse: {
        x: 0,
        y: -cc.winSize.height / 2,
        z: 0.0,
        w: 0.0,
      },
      resolution: {
        x: 0.0,
        y: 0.0,
        z: 1.0,
      },
      opacity: 0,
      NNOISE: 1,
      NFOG: 1,
      FAR: 30,
      bgcolor: {
        x: 0.5,
        y: 0.5,
        z: 0.5,
      },
    };

    cc.loader.loadRes(self.flagShader, (err, txt) => {
      txt = txt.text;
      if (err) {
        cc.log(err);
      } else {
        if (!cc.sys.isNative) {
          txt = txt.replace('// #define NNOISE', '#define NNOISE')
            .replace('// #define NFOG', '#define NFOG')
            .replace('uniform float NNOISE', '// uniform float NNOISE')
            .replace('uniform float NFOG', '// uniform float NFOG');
          if (game.NNOISE > 0) {
            txt = txt.replace('NNOISE 1', 'NNOISE ' + game.NNOISE);
          }
          if (game.NFOG > 0) {
            txt = txt.replace('NFOG 1', 'NFOG ' + game.NFOG);
          }
        }
        self.frag_glsl = txt;
        self._use();
        this.update();
      }
    });
  },

  update() {
    if (this._program) {
      this._program.use();
      this.updateGLParameters();
      if (cc.sys.isNative) {
        const state = cc.GLProgramState.getOrCreateWithGLProgram(this._program);
        state.setUniformVec3('iResolution', this.parameters.resolution);
        state.setUniformFloat('iGlobalTime', this.parameters.time);
        state.setUniformVec4('iMouse', this.parameters.mouse);
        state.setUniformFloat('opacity', this.parameters.opacity);
        state.setUniformVec3('bgcolor', this.parameters.bgcolor);
        state.setUniformFloat('NNOISE', this.parameters.NNOISE);
        state.setUniformFloat('NFOG', this.parameters.NFOG);
        state.setUniformFloat('FAR', this.parameters.FAR);
      } else {
        this._program.setUniformLocationWith3f(this._resolution,
          this.parameters.resolution.x, this.parameters.resolution.y, this.parameters.resolution.z);
        this._program.setUniformLocationWith1f(this._time,
          this.parameters.time);
        this._program.setUniformLocationWith4f(this._mouse,
          this.parameters.mouse.x, this.parameters.mouse.y,
          this.parameters.mouse.z, this.parameters.mouse.w);
        this._program.setUniformLocationWith1f(this._opacity,
          this.parameters.opacity);
        this._program.setUniformLocationWith3f(this._bgcolor,
          this.parameters.bgcolor.x, this.parameters.bgcolor.y, this.parameters.bgcolor.z);
        this._program.setUniformLocationWith1f(this._FAR,
          this.parameters.FAR);
      }
    }
  },

  updateGLParameters() {
    this.parameters.time = (Date.now() - this.parameters.startTime) / 1000;
    this.parameters.resolution.x = this.node.width;
    this.parameters.resolution.y = this.node.height;
  },

  reset(st) {
    this.parameters.startTime = st || Date.now();
  },

  _use() {
    this._program = new cc.GLProgram();
    if (cc.sys.isNative) {
      cc.log('use native GLProgram');
      this._program.initWithString(vsh, this.frag_glsl);
    } else {
      this._program.initWithVertexShaderByteArray(vsh, this.frag_glsl);
    }
    this._program.addAttribute(cc.macro.ATTRIBUTE_NAME_POSITION, cc.macro.VERTEX_ATTRIB_POSITION);
    this._program.addAttribute(cc.macro.ATTRIBUTE_NAME_COLOR, cc.macro.VERTEX_ATTRIB_COLOR);
    this._program.addAttribute(cc.macro.ATTRIBUTE_NAME_TEX_COORD,
         cc.macro.VERTEX_ATTRIB_TEX_COORDS);
    this._program.link();
    this._program.updateUniforms();

    if (!cc.sys.isNative) {
      this._resolution = this._program.getUniformLocationForName('iResolution');
      this._time = this._program.getUniformLocationForName('iGlobalTime');
      this._mouse = this._program.getUniformLocationForName('iMouse');
      this._opacity = this._program.getUniformLocationForName('opacity');
      this._FAR = this._program.getUniformLocationForName('FAR');
      this._bgcolor = this._program.getUniformLocationForName('bgcolor');
    }

    this.setProgram(this.node._sgNode, this._program);
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

    children.forEach(c => this.setProgram(c, program));
  },

});
