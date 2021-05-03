const game = require('./Game');

cc.Class({
  extends: cc.Component,

  onLoad() {
    const clickClip = cc.find('Canvas').getComponents(cc.AudioSource).filter(a => a.clip.indexOf('click') >= 0)[0];
    this.node.on('touchstart', () => clickClip.play(), this.node);
  },

  back() {
    game.back();
  },

  gotoFB() {
    cc.sys.openURL('https://www.facebook.com/tinymonsterjump/');
  },
});
