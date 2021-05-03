cc.Class({
  extends: cc.Component,

  onLoad() {
    this.level = cc.find('Canvas').getComponent('Level');
    this.reset();
  },

  onCollisionEnter(obj) {
    if (obj.node.name === 'player') {
      if (!this.speed) this.fly();
    }
  },

  reset() {
    this.node.getChildren().forEach(n => (n.active = n.name !== 'fly'));
    this.speed = 0;
  },

  fly() {
    this.node.getChildren().forEach(n => (n.active = n.name === 'fly'));
    this.speed = this.level.player.speed * (0.5 - Math.random());
    this.speedY = this.level.player.speed / 2;
    this.node.scaleX = this.speed > 0 ? 1 : -1;
    this.level.audios.filter(a => a.clip.indexOf('bird-flap') >= 0)[0].play();
  },

  update(dt) {
    if (!this.speed || this.level.stopped) return;
    this.node.x += dt * this.speed;
    this.node.y += dt * this.speedY;
    if (this.node.x < this.level.player.x - this.level.ww / 2) this.level.despawn(this.node);
  },
});
