cc.Class({
  extends: cc.Component,

  onLoad() {
    this.level = cc.find('Canvas').getComponent('Level');
    this.sprite = this.node.getChildren().filter(n => n.name === 'sprite')[0];
    this.reset();
  },

  onCollisionEnter(obj) {
    if (obj.node.name === 'arrow' && !obj.tag &&
      this.speedY > 0 &&
      !obj.node.getComponent('Arrow').from.isEnemy) {
      this.speedY = -3 * this.speedY;
      this.sprite.color = cc.color(0, 0, 0);
    }
  },

  reset() {
    if (!this.node.y && !this.node.x) {
      this.node.y = Math.random() * this.node.parent.height;
    } else this.node.y = 0;
    this.node.x = (0.2 + Math.random() * 0.8) * this.node.parent.width;
    this.speedY = (1 + Math.random()) * 10;
    this.speed = (1 + Math.random()) * -15;
    const c = 255;
    this.sprite.color = cc.color(c, c, c);
  },

  update(dt) {
    this.node.x += dt * this.speed;
    this.node.y += dt * this.speedY;
    const wh = this.node.parent.height;
    const y = this.node.y;
    const dy = this.node.height * this.node.scaleY / 2;
    this.node.opacity = 255;
    if (y > wh + dy || y < 0 || this.node.x < -this.node.width * this.node.scaleX / 2) this.reset();
    if (y > wh) {
      this.node.opacity *= (dy - (y - wh)) / dy;
    }
  },
});
