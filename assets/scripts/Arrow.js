cc.Class({
  extends: cc.Component,

  onLoad() {
    this.level = cc.find('Canvas').getComponent('Level');
    this.player = this.level.player;
  },

  reset() {
    this.node.x = this.x0 = this.from.x + (this.speed > 0 ? 1 : -1) * this.from.width / 2;
    this.node.y = this.y0 = this.from.y + this.from.height;
    if (!this.target) return;
    const p = this.player;
    this.startTime = new Date();
    this.duration = Math.min(1000, (p.x - this.target.x) / p.speed * 1000);
  },

  onCollisionEnter(obj, self) {
    if (obj.node.name === 'player' && obj.tag === 0 &&
      !this.player.speedY && !this.speed &&
      this.player.x < this.node.x) {
      this.player.node.getComponent(cc.Animation).play('player-fetch-arrow');
      this.level.despawn(this.node);
      this.player.narrows++;
    } else if (self.tag === 0) this.shooted(obj);
  },

  shooted(obj) {
    if (obj.node.name === 'enemy' && obj.tag === 3 && !this.from.isEnemy && this.speed) {
      cc.log('arrow destroyed');
      this.level.despawn(this.node);
      obj.node.getComponent('Player').die();
    }
    if (obj.node.name === 'player' && this.speed && obj.tag === 1 && this.from.isEnemy) {
      cc.log('player hit by arrow');
      this.player.lives -= 1;
      if (this.player.lives < 0) this.player.die('arrow');
      else {
        this.speed = -this.speed;
        this.node.x -= this.node.width;
      }
    }
    if (obj.node.name === 'board') {
      this.speed = 0;
      const node = this.level.spawn('fire');
      node.x = this.node.x;
      node.y = this.node.y;
    }
    if (obj.node.name === 'eagle' && !this.from.isEnemy && !obj.tag) {
      this.level.exposion.x = obj.node.x;
      this.level.exposion.y = obj.node.y;
      this.level.exposion.scale = 0.5;
      this.level.despawn(this.node);
      this.level.exposion.getComponent(cc.Animation).play();
      const e = obj.node.getComponent('Eagle');
      if (e.bonus) this.player.lives += 1;
      e.reset();
      e.master = undefined;
    }
    if (obj.node.name === 'fengshui' && !this.from.isEnemy && this.speedY < 0) {
      const l = obj.node.getChildren().filter(n => n.name === 'lighted');
      if (l[0] && !l[0].active) {
        l.forEach(n => (n.active = true));
        this.level.igniteWallFire();
        this.player.lives += 1;
        this.speed = 0;
      }
    }
  },

  update(dt) {
    const p = this.player;
    const t = this.target;
    if (!t) {
      if (this.node.x > p.x && p.y - this.node.y > 5 * cc.winSize.height ||
        this.node.x < p.x - cc.winSize.width) {
        cc.log('arrow destroyed');
        this.level.despawn(this.node);
        return;
      }
      if (!this.speed || this.level.stopped) return;
      this.node.x += dt * this.speed;
      this.node.y += dt * this.speedY;
      this.speedY -= dt * this.gravity;
      let s = this.speed;
      if (s < 0) s -= p.speed;
      this.node.rotation = -Math.atan(this.speedY / s) * 180 / Math.PI;
      this.node.scaleX = this.speed > 0 ? 1 : -1;
      if (this.speedY > 0) return;
      const { by, onPit } = this.level.getBerzPoint(this.node.x);
      if (!onPit && this.node.y <= by) {
        this.speed = 0;
        this.node.y = by;
      }
      return;
    }
    const percent = Math.min(1, (new Date() - this.startTime) / this.duration);
    this.node.scale = Math.sqrt(percent);
    if (t.x < p.x) this.node.scaleX = -this.node.scaleX;
    const dx = (t.x - this.x0) * percent;
    this.node.x = this.x0 + dx;
    this.node.y = this.y0 + (t.y - this.y0) * percent + Math.sin(percent * Math.PI) * Math.abs(dx);
    this.node.rotation = 45 - Math.acos(percent) * 180 / Math.PI;
    if (this.node.y < p.y - cc.winSize.height) {
      this.level.despawn(this.node);
      cc.log('arrow destroyed');
    }
  },
});
