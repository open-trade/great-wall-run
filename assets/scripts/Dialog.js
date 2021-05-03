const game = require('./Game');

cc.Class({
  extends: cc.Component,

  properties: {
    title: {
      type: cc.Node,
      default: null,
    },

    text: {
      type: cc.Node,
      default: null,
    },
  },

  onYes() {
    this.yesCallback();
    this.close();
  },

  onNo() {
    if (this.noCallback) this.noCallback();
    this.close();
  },

  close() {
    this.node.destroy();
    game.dialogShown = undefined;
  },

  show(title, text, yesCallback, noCallback) {
    game.dialogShown = this;
    this.yesCallback = yesCallback;
    this.noCallback = noCallback;
    cc.find('Canvas').addChild(this.node);
    this.title.getComponent(cc.Label).string = game.getString(title);
    this.text.getComponent(cc.Label).string = game.getString(text);
  },
});
