/* eslint no-restricted-properties: 0 */

const game = require('./Game');

cc.Class({
  extends: cc.Component,

  properties: {
    x: {
      get() {
        return this.node.x;
      },

      set(v) {
        if (this.isEnemy || this.isPlayer2) {
          this.node.x = v;
          return;
        }
        let dx;
        if (game.isSlave) dx = v + 100 - this.level.ww / 2;
        else dx = v - this.node.x;
        const it = dx / this.getDefaultSpeed() * game.normalHorseSpeed();
        let km;
        if (game.isSlave) km = it;
        else {
          game.addItinerary(it);
          km = game.getCurrentRun();
        }
        this.node.x = v;
        km = parseInt(km * 1000, 10) / 1000;
        this.distLabel.string = km + ' km';
      },
    },

    y: {
      get() {
        return this.node.y;
      },

      set(v) {
        this.node.y = v;
      },
    },

    narrows: {
      get() {
        return this._narrows;
      },

      set(v) {
        this._narrows = v;
        this.narrowsLabel.string = v + '';
        this.narrowsLabel.node.parent.getComponent(cc.Animation).play();
      },
    },

    ncoins: {
      get() {
        return game.ncoins;
      },

      set(v) {
        game.ncoins = v;
        this.ncoinsLabel.string = v + '';
        this.ncoinsLabel.node.parent.getComponent(cc.Animation).play();
        cc.find('Canvas/power').active = v >= 10 && !game.isMaster && !game.isSlave;
      },
    },

    speed: {
      get() {
        if (game.isMaster || game.isSlave) return this._speed;
        if (!this.level) return null; // for editor
        return this._speed * (1 +
          (Math.pow(this.level.player.lives, 2 / 3) || 0) / 10);
      },

      set(v) {
        this._speed = v;
      },
    },

    height: {
      get() {
        return this.node.height;
      },
    },

    width: {
      get() {
        return this.node.width;
      },
    },

    ribbon: {
      default: null,
      type: cc.Node,
    },

    lives: {
      get() {
        return this._lives;
      },

      set(v) {
        if (this.powered) {
          return;
        }
        v = Math.max(v, -1);
        if (v > (this._lives || 0) && v > 0) {
          this.showPower(cc.color(0, 255, 0));
          this.level.scoreClip.play();
          // cc.repeat(cc.sequence(cc.fadeTo(1, 0), cc.fadeTo(1, 1)), 5)
          // action.repeatForever()
          // node.stopAction
          // this.lifeLabel.node.parent.runAction(cc.blink(0.5, 2));
        } else if (v < this._lives && v >= 0 && !this.level.stopped) {
          this.level.whooshClip.play();
          this.showPower();
        }
        this._lives = v;
        this.lifeLabel.string = (v + 1) + '';
        this.lifeLabel.node.parent.getComponent(cc.Animation).play();
        if (!this.isEnemy) {
          this.ribbon.color = cc.color(0, this.lives > 0 ? 255 : 0, 0);
        }
      },
    },
  },

  resetArrows() {
    this.narrows = 3;
  },

  onLoad() {
    this.rotation = 0;
    this.isEnemy = !this.node.name.startsWith('player');
    this.level = cc.find('Canvas').getComponent('Level');
    this.speedY = 0;
    const wrapper = this.node.getChildren().filter(n => n.name === 'wrapper')[0];
    this.animation = wrapper.getComponent(cc.Animation);
    this.trace = wrapper.getChildren().filter(n => n.name === 'trace')[0];
    this.onBridge = [];

    this.speed = this.getDefaultSpeed();

    if (this.isEnemy) {
      if (this.node.scaleX < 0) {
        this.node.active = false;
        this.animation.enabled = false;
        this.trace.active = false;
      }
      this.speed *= 1.05;
      if (game.isSlave) this.node.active = false;
      // this.node.on(cc.Node.EventType.TOUCH_START, this.shootArrows, this);
      return;
    }

    this.animation.enabled = false;
    this.node.x = this.level.x0;
    this.node.y = this.level.y0;

    if (this.node.name === 'player2') {
      this.isPlayer2 = true;
      if (game.isMaster) this.node.x -= 100;
      else this.node.x += 100;
      return;
    }

    this.lifeLabel = cc.find('Canvas/top/left/life/label').getComponent(cc.Label);
    this.distLabel = cc.find('Canvas/top/right/label').getComponent(cc.Label);
    this.narrowsLabel = cc.find('Canvas/top/left/narrows/label').getComponent(cc.Label);
    this.ncoinsLabel = cc.find('Canvas/top/left/ncoins/label').getComponent(cc.Label);
    if (game.isMaster || game.isSlave) cc.find('Canvas/top/left/ncoins').active = false;
    else {
      cc.find('Canvas/power').on(cc.Node.EventType.TOUCH_START, () => {
        this.level.powerup();
      });
    }
    this.ncoins = this.ncoins;

    this.resetArrows();

    this.lives = 0;

    cc.find('Canvas').on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    cc.find('Canvas').on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    cc.eventManager.addListener({
      event: cc.EventListener.KEYBOARD,
      onKeyPressed: (keyCode) => {
        if (keyCode === cc.KEY.space) this.level.pause();
        if (keyCode === cc.KEY.back || keyCode === cc.KEY.backspace) {
          let s = cc.find('Canvas').getComponent(cc.Animation).getAnimationState('countdown');
          if (s.isPlaying) return;
          s = cc.find('Canvas/mask').getComponent(cc.Animation).getAnimationState('mask');
          if (s.isPlaying) return;
          s = cc.find('Canvas/menu').getComponent(cc.Animation).getAnimationState('fadein');
          if (s.isPlaying) return;
          if (game.dialogShown) game.dialogShown.close();
          else if (!this.level.stopped || this.level.paused) this.level.pause();
          else if (!cc.find('Canvas/menu').active) this.level.showMenu();
        }
      },
    }, this.node);
  },

  getDefaultSpeed() {
    return game.isMaster || game.isSlave ? this.level.ww / 2 :
      Math.max(cc.winSize.width, 1.8 * this.level.wh) / 2;
  },

  getInitSpeedY() {
    return this.speed * 1.5;
  },

  getGravity() {
    return this.getInitSpeedY() * 2;
  },

  shootArrows(e, dy0) {
    if (this.level.stopped) return;
    const node = this.level.spawnArrow();
    const arrow = node.getComponent('Arrow');
    if (this.node.scaleX < 0) {
      let r = Math.random();
      let p;
      if (game.isMaster) p = this.level.player;
      else if (game.isSlave) p = this.level.player2;
      if (p) r = Math.abs(this.x - p.x) / this.level.ww;
      arrow.speed = -this.speed * (0.5 + r);
      arrow.speedY = -arrow.speed;
      arrow.gravity = -arrow.speed;
      arrow.target = null;
      arrow.from = this;
      this.node.getComponent(cc.Animation).play('player-shoot');
    } else if (!e) {
      arrow.speed = this.speed * 1.5;
      const p = this.level.player;
      const t = Math.max(0.5, (p.x + this.level.ww / 2 - this.x) / arrow.speed);
      arrow.gravity = arrow.speed;
      const dy = dy0 || cc.winSize.height / 2;
      if (p.y > this.y) { // player is higher
        arrow.speedY = arrow.gravity * t * Math.sqrt(dy + p.y - this.y) /
          Math.sqrt(2 * dy + p.y - this.y);
      } else {
        arrow.speedY = arrow.gravity * t * Math.sqrt(dy) / Math.sqrt(2 * dy + this.y - p.y);
      }
      const r = Math.tan(-this.rotation * Math.PI / 180) * this.speed;
      if (r > 0) arrow.speedY += r;
      this.node.getComponent(cc.Animation).play('player-shoot');
      arrow.target = null;
      arrow.from = this;
    } else {
      this.level.player.node.getComponent(cc.Animation).play('player-shoot');
      arrow.target = e.target;
      arrow.from = this.level.player;
    }
    arrow.reset();
  },

  randomShoot() {
    const ww = this.level.ww;
    const x = this.x - ww * (game.isMaster || game.isSlave ? 1 : Math.random()) / 5;
    const e = this.level.enemies.getChildren()[0];
    const x0 = e.x;
    const y0 = e.y;
    e.x = x;
    e.y = this.y + cc.winSize.height / 2;
    e.getComponent('Player').shootArrows(null, 1); // just borrow e to shootArrows
    e.x = x0;
    e.y = y0;
  },

  onTouchStart(e) {
    if (game.dialogShown) return;
    if (e && e.target !== e.currentTarget) return;
    if (this.level.died &&
      cc.find('Canvas/tip').active &&
      cc.find('Canvas/tip/tap').opacity > 128 &&
      !cc.find('Canvas/menu').active) {
      this.level.showMenu();
      this.level.playClick();
    }
    if (this.level.stopped) return;
    const l = e.getLocation();
    if (l.x > this.level.ww / 2 && l.y < this.level.wh / 2) {
      if (this.speedY === 0) {
        this.jump();
        this.afterJump();
      }
    }
  },

  afterJump() {
    if (!this.level.player2) return;
    const d = { jump: 1 };
    if (game.isMaster) {
      d.x = parseInt(this.x, 10);
      d.y = parseInt(this.y, 10);
      d.r = parseInt(this.rotation, 10);
    }
    game.send(d);
  },

  onTouchEnd(e) {
    if (this.level.stopped) return;
    const s = e.getStartLocation();
    const l = e.getLocation();
    const dx = l.x - s.x;
    const dy = l.y - s.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    cc.log('touchmove distance =', d);
    const sensitive = 30;
    if (l.x > this.level.ww / 2 && l.y < this.level.wh / 2) {
      if (d < sensitive) return;
    } else if (d < sensitive) {
      if (this.speedY === 0) {
        this.jump();
        this.afterJump();
      }
      return;
    }
    if (this.narrows <= 0) {
      // cc.blink buggy, make node invisible unpredicable
      // this.narrowsLabel.node.parent.runAction(cc.blink(0.5, 2));
      this.narrowsLabel.node.parent.getComponent(cc.Animation).play();
      return;
    }
    const node = this.level.spawnArrow();
    const arrow = node.getComponent('Arrow');
    arrow.from = this;
    arrow.target = null;
    arrow.speed = dx >= 0 ? 2 * this.speed : -this.speed / 2;
    arrow.speedY = (dy >= 0 ? 1 : -1) *
      Math.min(2, Math.abs(dy / (dx || 1))) * this.speed;
    arrow.gravity = 2 * this.speed;
    this.node.getComponent(cc.Animation).play('player-shoot' +
      (arrow.speed > 0 ? '2' : ''));
    arrow.reset();
    this.level.arrowClip.play();
    this.narrows--;
  },

  jump(n) {
    if (!this.isEnemy && !this.isPlayer2) {
      if (this.level.player2 && game.isMaster) {
        setTimeout(() => {
          if (!this.level.player2.speedY) this.level.player2.jump();
        }, 100 / this.speed * 1000);
      }
    }
    if (!this.isEnemy && this.isPlayer2 && game.isSlave) {
      setTimeout(() => {
        if (!this.level.player.speedY) this.level.player.jump();
      }, 100 / this.speed * 1000);
    }
    let r = Math.tan(-this.rotation * Math.PI / 180) * this.speed;
    if (r < 0) r = 0;
    this.speedY = (n || this.getInitSpeedY()) + r;
    this.jumpAt = this.x;
  },

  showPower(color = cc.color(255, 255, 0)) {
    const node = this.node.getChildren().filter(n => n.name === 'power')[0];
    node.color = color;
    node.getChildren().forEach(n => (n.color = color));
    this.node.getComponent(cc.Animation).play('player-power');
  },

  onCollisionEnter(obj, self) {
    if (obj.node.name === 'board') {
      if (!self.tag) this.onBridge.push(obj.node);
    } else if (!this.isEnemy) {
      if (this.isPlayer2) return;
      if (obj.node.name === 'enemy' && obj.tag === 1 && self.tag === 1) {
        this.lives -= 1;
        if (this.lives >= 0) {
          obj.node.getComponent('Player').die();
          return;
        }
        obj.node.getComponent(cc.Animation).play('daoguang');
        this.die('enemy approaching you');
      } else if (obj.node.name === 'fence' &&
       !obj.node.parent.name.startsWith('hit') && !self.tag) {
        if (this.onTerrain2) return;
        const x = self.node.x;
        const ps = this.level.points2;
        if (x > ps[0][0] && x < ps[ps.length - 1][0]) {
          // jumping to terrain2
          if (this.speedY < 0 && this.jumpAt <= ps[0][0] + 100) return;
        }
        this.lives -= 1;
        if (this.lives < 0) this.die('wood');
        this.level.hit(obj.node, this.node);
      } else if (obj.node.name.endsWith('fire') &&
        !obj.node.parent.name.startsWith('hit') && !self.tag) {
        if (this.onTerrain2) return;
        const x = self.node.x;
        const ps = this.level.points2;
        if (x > ps[0][0] && x < ps[ps.length - 1][0]) {
          // jumping to terrain2
          if (this.speedY < 0 && this.jumpAt <= ps[0][0] + 100) return;
        }
        if (!this.speedY && this.x < obj.node.x) {
          this.lives -= 1;
          if (this.lives < 0) {
            this.die('fire');
            return;
          }
        }
        this.level.hit(obj.node, this.node);
      } else if (obj.node.name.endsWith('star') && self.tag === 2) {
        obj.node.active = false;
        let ignite;
        obj.node.parent.getChildren().forEach((n) => {
          if (n.name === 'lighted' && !n.active) {
            n.active = true;
            ignite = true;
          }
        });
        if (ignite) this.level.igniteWallFire();
        this.lives += 1;
      } else if (obj.node.name === 'coin' && self.tag === 2) {
        this.level.despawn(obj.node);
        game.play('coin');
        this.ncoins++;
      }
    } else if (obj.node.name === 'fence' || obj.node.name.endsWith('fire')) {
      if (obj.node.parent.name.startsWith('hit')) {
        const c = obj.node.getComponent('Movement');
        if (self.tag === 3 && c.speed !== 0) {
          this.die();
        }
      } else if (this.speedY === 0 &&
      this.x > this.level.player.x - this.level.ww / 2 &&
      !this.onBridge[0]) {
        this.jump(this.getInitSpeedY() * 2 / 3);
      }
    }
  },

  revive() {
    this.node.getChildren().filter(n => n.name === 'wrapper')[0].getChildren().forEach((n) => {
      n.active = !n.name.startsWith('shoot') && n.name !== 'fetch-arrow';
    });
    this.node.getComponent(cc.Animation).enabled = true;
    this.resetArrows();
  },

  die(text, underpit) {
    if (game.makeTerrain) return;
    if (this.isEnemy) {
      if (this.level.player2 && !text) {
        game.send({ pk: this.id });
      }
      cc.log('#', this.id, 'enemy killed');
      const l = this.level;
      l.exposion.x = this.node.x;
      l.exposion.y = this.node.y;
      l.exposion.scale = 1;
      l.exposion.getComponent(cc.Animation).play();
      this.node.x = l.player.x + l.ww;
      this.node.active = false;
      l.poofClip.play();
      const s = this.level.staticEnemy;
      if (this.eagle) this.eagle.master = undefined;
      if (this.node !== s && !s.active && !game.isSlave) {
        const ps = l.points;
        for (let i = l.istart + 1; i < ps.length - 1; ++i) {
          const p = ps[i];
          const x = p[0];
          const y = p[1];
          if (x > l.player.x + l.ww && p.length < 3 &&
            l.controls[i][1] === y &&
            (y > ps[i - 1][1] && y < ps[i + 1][1]) &&
            !l.nearTo(x, l.fences, l.ww / 2)) {
            s.x = x;
            s.y = y;
            s.active = true;
            s.scaleX = -1;
            if (game.isMaster && this.level.player2) {
              game.send({ e: [parseInt(x, 10), parseInt(y, 10)] });
            }
            break;
          }
        }
      }
      return;
    }
    this.level.horseClip.play();
    game.addDie();
    this.level.enemyList.forEach((enemy) => {
      enemy.trace.active = false;
      enemy.animation.enabled = false;
    });
    this.level.eagles.getChildren().forEach((eagle) => {
      eagle.getChildren()[0].getComponent(cc.Animation).enabled = false;
    });
    this.node.getComponent(cc.Animation).stop();
    const func = () => {
      this.node.getChildren().filter(n => n.name !== 'wrapper')[0].active = false;
      this.node.getChildren().filter(n => n.name === 'wrapper')[0].getChildren().forEach((n) => {
        if (n.name !== 'horse') n.active = false;
      });
    };
    func();
    setTimeout(func, 2000); // double check
    this.animation.enabled = false;
    if (this.level.player2) this.level.player2.animation.enabled = false;
    this.level.stopped = true;
    const died = cc.find('Canvas/playground/scroll/' + (underpit ? 'under-pit' : 'die-player'));
    if (underpit) this.node.active = false;
    died.getChildren().forEach((n) => {
      n.x = this.node.x;
      n.y = this.node.y + (underpit ? 0 : 50);
      const m = n.getComponent('Movement');
      if (underpit) {
        m.speed = -m.getDefaultSpeed(); // m not onLoaded right now, so m.speed is undefined
        m.speedY = -100;
      } else {
        m.speed = m.speedY = 0;
      }
      m.reset();
      m.underpit = underpit;
    });
    died.active = true;
    cc.find('Canvas/tip').active = true;
    cc.find('Canvas/tip').getChildren().forEach(n => (n.opacity = 0));
    cc.find('Canvas/tip/label').getComponent(cc.Label).string =
      game.getString('Mind the ' + text) + '!';
    cc.find('Canvas/tip').getComponent(cc.Animation).play();
    cc.find('Canvas/bottom/died').active = true;
    if (this.level.player2) {
      if (game.isMaster) game.send({ die: [text, underpit] });
      else if (!this.isPlayer2) game.send({ unjoined: 1 });
    }
  },

  onCollisionExit(obj, self) {
    if (!self.tag) {
      this.onBridge = this.onBridge.filter(n => n !== obj.node);
    }
  },

  update(dt) {
    if (this.level.stopped) return;
    const x0 = this.node.x;
    let speed = this.speed;
    if (this.powered) {
      speed *= 2;
    }
    const x = x0 + dt * speed;
    let terrain2;
    if (this.isEnemy) {
      if (this.node === this.level.staticEnemy) {
        const dx = x0 - this.level.player.x;
        const now = new Date();
        if (dx < 0 && this.node.scaleX < 0) this.node.scaleX = 1;
        if (dx < -this.level.ww) {
          this.node.active = false;
        }
        if (Math.abs(dx) < this.level.ww &&
          now - (this.lastShoot || 0) > 1000) {
          this.lastShoot = now;
          this.shootArrows();
        }
        return;
      }
    } else {
      const ps = this.level.points2;
      if (x > ps[0][0] && x < ps[ps.length - 1][0]) {
        terrain2 = this.onTerrain2;
        if (this.isPlayer2) {
          if (this.level.player.onTerrain2) terrain2 = true;
        } else if (this.speedY && this.jumpAt <= ps[0][0] + 100 && !terrain2) {
          terrain2 = true;
        }
      } else {
        this.onTerrain2 = false;
      }
    }
    const { by, deg, onPit, p, p1 } = this.level.getBerzPoint(x, 0, undefined, terrain2);
    const y0 = this.node.y;
    let y = y0 + dt * this.speedY;
    if (by === undefined) {
      console.error('by undefined');
    } else if (game.makeTerrain && !this.isEnemy) {
      y = by;
      this.rotation = -deg;
    } else if (onPit && this.onBridge[0] && this.speedY <= 0) {
      const b = this.onBridge[0];
      if (b.parent.name === 'board') { // bridge2
        let x2 = b.x * b.parent.scaleX;
        let y2 = b.y;
        const w = Math.sqrt(x2 * x2 + y2 * y2);
        let deg2 = w > 0 ? b.parent.rotation - Math.asin(y2 / w) * 180 / Math.PI : 0;
        let rad = -deg2 * Math.PI / 180;
        x2 = b.parent.parent.x + w * Math.cos(rad);
        y2 = b.parent.parent.y + w * Math.sin(rad);
        deg2 = b.parent.rotation +
          Math.atan(Math.tan(b.rotation * Math.PI / 180) / b.parent.scaleX) * 180 / Math.PI;
        rad = -deg2 * Math.PI / 180;
        y = y2 + (x - x2) * Math.tan(rad);
        this.rotation = deg2;
      } else {
        this.rotation = b.rotation * b.parent.scaleX;
        y = b.parent.y;
        y += (x - b.parent.x) * Math.tan(-this.rotation / 180 * Math.PI);
        y -= b.height / 2;
      }
      this.speedY = 0;
    } else if (onPit || this.speedY && y > by) {
      if (onPit && this.isEnemy && this.speedY === 0 && (!this.lastOnPit || this.lastOnBridge)) {
        this.jump();
        this.update(dt);
        return;
      }
      if (onPit && !this.isEnemy && !this.isPlayer2 && y < Math.min(p[1], p1[1]) - 200) {
        this.die('cliff');
        return;
      }
      this.rotation = -Math.atan(this.speedY / this.speed) * 180 / Math.PI;
      if (this.rotation < 0) this.rotation /= 2;
      else this.rotation /= 3;
      this.speedY -= dt * this.getGravity();
    } else {
      if (this.lastOnPit && !this.isEnemy && !this.isPlayer2 && !this.lastOnBridge
        && !this.onBridge[0] && y < by - 20 && y0 < by && this.speedY < 0) {
        this.node.x = p[0] - this.node.width / 2;
        this.die('cliff', true);
        return;
      }
      y = by;
      this.rotation = -deg;
      this.speedY = 0;
    }
    if (!this.isEnemy && !this.lastOnPit && onPit) {
      this.randomShoot();
    }
    this.trace.active = !this.speedY && !onPit;
    this.lastOnPit = onPit;
    this.lastOnBridge = this.onBridge[0];
    this.x = x;
    this.y = y;
    this.node.rotation = this.rotation;
    if (this.isEnemy) {
      const dx = this.level.player.x - x;
      const now = new Date();
      if (dx < this.level.ww * 2 / 3 && dx > 0 &&
        now - (this.lastShoot || 0) > 3000) {
        this.lastShoot = now;
        this.shootArrows();
      }
      if (game.showSwipeGuesture &&
        !this.level.tipNode.active &&
        Math.abs(dx - this.level.ww / 2) < this.speed * dt * 3) {
        this.level.showGuestureTip(true);
      }
    } else if (!this.isPlayer2) {
      if (!this.onTerrain2 && terrain2 && !this.speedY) {
        this.onTerrain2 = true;
      }
      this.level.transform(by, x, y);
    }
  },
});
