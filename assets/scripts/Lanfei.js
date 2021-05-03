/* eslint no-restricted-properties: 0 */

cc.Class({
  extends: cc.Component,

  onLoad() {
    this.level = cc.find('Canvas').getComponent('Level');
    this.speed = this.level.ww / 100;
    this.speedY = this.level.wh / 200;
    this.node.getChildren().forEach((n) => {
      setTimeout(() => {
        if (n && typeof n.getComponent === 'function') {
          n.getComponent(cc.Animation).play();
        }
      }, Math.random() * 1000);
    });
    this.node.y = this.level.wh * 3 / 4;
    this.node.x = this.level.ww / 2;
  },

  reset() {
    this.node.y = this.level.wh / 2;
    this.node.x = 0;
  },

  update(dt) {
    this.node.x += dt * this.speed;
    this.node.y += dt * this.speedY;
    let r = this.node.x / this.level.ww;
    r = 1 - Math.abs(r - 0.5);
    this.node.opacity = Math.pow(r, 0.33) * 255;
    const y = this.node.y;
    const dy = this.node.height / 4;
    const wh = this.level.wh;
    if (y > wh + dy || y < 0) this.reset();
    if (y > wh) {
      this.node.opacity *= (dy - (y - wh)) / dy;
    }
  },
});
