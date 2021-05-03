const game = require('./Game');

cc.Class({
  extends: cc.Component,

  show(text, time) {
    cc.find('Canvas').addChild(this.node);
    this.node.getChildren()[0].getChildren()[0].getComponent(cc.Label).string =
      game.getString(text);
    if (time > 0) {
      this.timeout = setTimeout(() => this.destroy(), time);
    }
    if (game.toastShown) game.toastShown.close();
    game.toastShown = this;
    return this;
  },

  close() { this.node.destroy(); },

  onDestroy() {
    this.node.off(cc.Node.EventType.TOUCH_START, this.destroy, this);
    clearTimeout(this.timeout);
    if (game.toastShown === this) game.toastShown = undefined;
  },
});
