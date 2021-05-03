cc.Class({
  extends: cc.Component,

  onLoad() {
    this.level = cc.find('Canvas').getComponent('Level');
    this.player = this.level.player;
  },

  onCollisionEnter(obj, self) {
    if (obj.node.name.endsWith('star')) {
      if (!self.tag) {
        obj.node.active = false;
        if (obj.node === this.inZone) this.inZone = undefined;
        if (!this.master) {
          this.bonus = 1;
          this.level.eagleClip.play();
          this.node.getChildren()[0].color = cc.color(0, 255, 0);
        }
      } else {
        this.inZone = obj.node;
      }
    } else if (obj.node.name === 'player') {
      this.node.x += 10;
    } else if (obj.node.name === 'coin' && !self.tag) {
      this.level.despawn(obj.node);
    }
  },

  reset() {
    this.node.x = this.player.x - 2 * this.level.ww;
    this.bonus = 0;
    this.node.getChildren()[0].color = cc.color(0, 0, 0);
  },

  onCollisionExit(obj, self) {
    if (obj.node === this.inZone && self.tag) {
      this.inZone = undefined;
    }
  },

  update(dt) {
    if (this.level.stopped) return;
    // do not use level.ww because in master/slave mode it is not real width
    const w = cc.winSize.width / 2;
    const p = this.player;
    const m = this.master;
    if (m) {
      if (!m.node.active) return;
      this.node.x = m.x;
      this.node.y = m.y + 250;
      this.node.rotation = m.node.rotation;
    } else if (this.node.x > p.x + this.node.width + w && !p.speedY) {
      this.reset();
    } else if (this.node.x > p.x - w) {
      const { by, deg } = this.level.getBerzPoint(this.node.x);
      this.node.rotation = -deg;
      this.node.x += this.player.speed * 1.1 * dt;
      if (by === undefined) return;
      if (this.inZone && this.inZone.y > by + 100) {
        this.node.y = this.inZone.y;
      } else {
        this.node.y = by + 250;
      }
    }
  },
});
