cc.Class({
  extends: cc.Component,

  onLoad() {
    this.level = cc.find('Canvas').getComponent('Level');
    this.node.x = Math.random() * this.level.ww;
    this.node.y = this.level.wh * Math.random();
    this.speed = 60;
    this.speedY = 40;
    this.node.color = cc.color(255, 255, 255);
  },

  onCollisionEnter(obj) {
    if (obj.node.name === 'arrow' && !obj.tag &&
      !obj.node.getComponent('Arrow').from.isEnemy) {
      this.node.color = cc.color(0, 0, 0);
    }
  },

  update(dt) {
    this.node.x -= (Math.random() > 0.05 ? 1 : -1) * dt * this.speed;
    this.node.y -= (Math.random() > 0.05 ? 1 : -1) * dt * this.speedY;
    this.node.rotation += 100 * dt * Math.random();
    if (this.node.y < 0 || this.node.x < 0) {
      this.node.x = (0.25 + Math.random()) * this.level.ww;
      this.node.y = this.level.wh;
      this.node.color = cc.color(255, 255, 255);
    }
  },
});
