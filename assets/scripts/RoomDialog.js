const game = require('./Game');

cc.Class({
  extends: cc.Component,

  onNo() {
    this.close();
  },

  connect(event) {
    const name = cc.find('Canvas/dialog/content/text').getComponent(cc.EditBox).string.trim();
    if (!name) {
      game.showToast('pleaseInputName', 5000);
      return;
    }
    game.setItem('roomName', name);
    game.showToast('connecting');
    game.connect(name, event);
  },

  onCreate() {
    this.connect('create');
  },

  onJoin() {
    this.connect('join');
  },

  close() {
    this.node.destroy();
    game.dialogShown = undefined;
  },

  show() {
    game.dialogShown = this;
    cc.find('Canvas').addChild(this.node);
  },

  onDestroy() {
    game.dialogShown = undefined;
  },

  onLoad() {
    const name = game.getItem('roomName');
    if (name) cc.find('Canvas/dialog/content/text').getComponent(cc.EditBox).string = name;
  },
});
