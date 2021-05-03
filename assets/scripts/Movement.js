cc.Class({
  extends: cc.Component,

  onLoad() {
    this.level = cc.find('Canvas').getComponent('Level');
    this.anim = this.node.getComponent(cc.Animation);
    this.reset();
  },

  reset() {
    this.speed = this.speed || this.getDefaultSpeed();
    this.speedY = this.speedY > 0 ? this.speedY : this.getInitSpeedY();
    this.lastOnPit = false;
    this.slide = undefined;
    this.node.active = true;
  },

  getInitSpeedY() {
    return Math.abs(this.speed) * 3;
  },

  getDefaultSpeed() {
    return cc.winSize.height * (0.5 + Math.random() / 2) / 2;
  },

  getGravity() {
    return this.getInitSpeedY() * 2;
  },

  onCollisionEnter(obj, self) {
    if (self.node.parent.name === 'die-player' &&
      obj.node.name === 'fence' &&
      !obj.node.parent.name.startsWith('hit')) {
      this.level.hit(obj.node, this.node);
    }
  },

  update(dt) {
    if (this.level.player.y - this.node.y > 5 * cc.winSize.height
      || this.level.player.x - this.node.x > cc.winSize.width) {
      this.node.active = false;
      return;
    }
    if (!this.speed || this.slide <= 0) return;
    this.node.x += dt * this.speed;
    const { by, deg, onPit } = this.level.getBerzPoint(this.node.x);
    this.node.y += dt * this.speedY;
    if (this.lastOnPit && !onPit && this.node.y < by - 20) {
      this.speed = -this.speed;
      return;
    } else if (!onPit && this.node.y <= by && !this.underpit || this.slide > 0) {
      this.node.y = by;
      this.node.rotation = -deg;
      if (this.slide > 0) {
        this.slide -= dt;
      } else if (this.anim) {
        this.slide = 0.5;
        this.anim.play();
      } else this.speed = 0;
      return;
    }
    this.speedY -= dt * this.getGravity();
    this.lastOnPit = onPit;
    if (!this.underpit) {
      this.node.rotation = -Math.atan(this.speedY / this.speed) * 180 * 4 / Math.PI;
    }
  },
});
