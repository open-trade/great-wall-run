cc.Class({
  extends: cc.Component,

  onLoad() {
    this.level = cc.find('Canvas').getComponent('Level');
    this.sprite = this.node.getChildren().filter(n => n.name === 'sprite')[0];
    this.speed = 5;
    this.reset();
  },

  onCollisionEnter(obj) {
    if (obj.node.name === 'arrow' && !obj.tag &&
      this.speedY > 0 &&
      !obj.node.getComponent('Arrow').from.isEnemy) {
      this.node.color = cc.color(0, 0, 0);
      this.sprite.opacity = 100;
      this.speedY = -2 * this.speedY;
    }
  },

  reset() {
    if (!this.node.y && !this.node.x) {
      this.node.y = Math.random() * this.node.parent.height;
    } else this.node.y = 0;
    this.node.x = Math.random() * this.node.parent.width;
    this.dt = Math.random();
    this.speedY = (1 + Math.random()) * 20;
    this.sprite.opacity = 210;
  },

  update(dt) {
    this.dt += dt;
    this.node.x += Math.sin(this.dt * Math.PI) * dt * this.speed;
    this.node.y += dt * this.speedY;
    if (this.node.y > this.node.parent.height + this.node.height / 2 ||
      this.node.y < 0) this.reset();
  },
});
