/* global jsb */
/* global wx */
/* global document */

import { _ } from './lib/util';

const game = require('./Game');

const changan = [0.8, -155.4];
const beijing = [-205.5, 60.8];
const changan2beijing = 1035; // km
const gwscale = changan2beijing / _.length(beijing, changan);

const gwpoints = [
  [-418, 111],
  [-387, 123],
  [-369, 128],
  [-335, 103],
  [-315, 78],
  [-288, 70], // jiayuguan
  [-252, 68],
  [-236, 63],
  [-218, 46],
  [-201, 17], // wuwei
  [-163, 2],
  [-142, -26],
  [-111, -38],
  [-80, -20],
  [-65, 22], // yinchuan
  [-30, -11],
  [3, -27], // yulin
  [74, 43],
  [107, 26], // yanmenguan
  [132, 36],
  [152, 27],
  [188, 73], // Juyongguan
  [210, 85],
  [259, 74],
  [293, 74], // shanhaiguan
  [302, 71],
  [302, 90],
  [326, 135],
  [358, 149],
  [371, 129], // liaodong
  [378, 150],
  [398, 162],
  [419, 177],
  [423, 166],
  [413, 140],
  [424, 90],
];

const allguans = [
  { index: 0, name: 'Yumenguan', distance: 0 },
  { index: 5, name: 'Jiayuguan' },
  { index: 9, name: 'Wuwei' },
  { index: 14, name: 'yinchuan' },
  { index: 16, name: 'Yulin' },
  { index: 18, name: 'Yanmenguan' },
  { index: 21, name: 'Juyongguan' },
  { index: 24, name: 'Shanhaiguan' },
  { index: 29, name: 'Liaodong' },
  { index: 35, name: 'Hushan' },
];

game.guans = allguans;

allguans.slice(1).forEach((p) => {
  let total = 0;
  for (let i = 1; i <= p.index; ++i) {
    total += _.length(gwpoints[i], gwpoints[i - 1]);
  }
  total *= gwscale;
  p.distance = total;
});
cc.log(JSON.stringify(allguans));

cc.Class({
  extends: cc.Component,

  properties: {
    playerPrefab: {
      default: null,
      type: cc.Prefab,
    },

    eaglePrefab: {
      default: null,
      type: cc.Prefab,
    },

    camera: {
      default: null,
      type: cc.Camera,
    },

    coinPrefab: {
      default: null,
      type: cc.Prefab,
    },

    fengshuiPrefab: {
      default: null,
      type: cc.Prefab,
    },

    bridgePrefab: {
      default: null,
      type: cc.Prefab,
    },

    dialogPrefab: {
      default: null,
      type: cc.Prefab,
    },

    toastPrefab: {
      default: null,
      type: cc.Prefab,
    },

    bridge2Prefab: {
      default: null,
      type: cc.Prefab,
    },

    arrowPrefab: {
      default: null,
      type: cc.Prefab,
    },

    enemyPrefab: {
      default: null,
      type: cc.Prefab,
    },

    firePrefab: {
      default: null,
      type: cc.Prefab,
    },

    treePrefabs: {
      default: [],
      type: cc.Prefab,
    },

    leafPrefabs: {
      default: [],
      type: cc.Prefab,
    },

    numEnemies: {
      default: 3,
    },

    leaves: {
      default: null,
      type: cc.Node,
    },

    denglongs: {
      default: null,
      type: cc.Node,
    },

    kates: {
      default: null,
      type: cc.Node,
    },

    denglongPrefab: {
      default: null,
      type: cc.Prefab,
    },

    katePrefab: {
      default: null,
      type: cc.Prefab,
    },

    birdPrefab: {
      default: null,
      type: cc.Prefab,
    },

    stopped: {
      get() {
        return this._died || this._paused;
      },

      set(v) {
        this._died = v;
        cc.find('Canvas/pause').active = !v && !game.isSlave;
        cc.find('Canvas/power').active = !v && this.player.ncoins >= 10 && !game.isMaster && !game.isSlave;
        // no idea why tipNode is null on wx sometimes
        if (this.tipNode) this.tipNode.opacity = v ? 0 : 255;
      },
    },

    died: {
      get() {
        return this._died;
      },
    },

    paused: {
      get() {
        return this._paused;
      },

      set(v) {
        this._paused = v;
        cc.find('Canvas/pause').active = !v && !game.isSlave;
        cc.find('Canvas/power').active = !v && this.player.ncoins >= 10 && !game.isMaster && !game.isSlave;
        // no idea why tipNode is null on wx sometimes
        if (this.tipNode) this.tipNode.opacity = v ? 0 : 255;
      },
    },
  },

  spawnEnemy() {
    const node = cc.instantiate(this.enemyPrefab);
    node.x = 2 * this.ww;
    const eagle = cc.instantiate(this.eaglePrefab);
    const p = node.getComponent('Player');
    const e = eagle.getComponent('Eagle');
    e.master = p;
    p.eagle = e;
    this.enemies.addChild(node);
    p.id = this.enemyList.length;
    this.enemyList.push(p);
    this.eagles.addChild(eagle);
    eagle.x = node.x;
    if (game.isSlave) {
      node.x = -this.ww;
      eagle.x = -this.ww;
    }
  },

  playClick() {
    this.clickClip.play();
  },

  onCountdown(arg) {
    if (arg === 'go') {
      this.startClip.play();
      this.pause2();
    } else {
      game.play('countdown');
    }
  },

  gc() {
    game.showGc();
  },

  onLoad() {
    this.tipNode = cc.find('Canvas/guesture-tip');
    cc.level = this;
    const wh = this.wh = cc.winSize.height;
    const ww = this.ww = game.isMaster || game.isSlave ? wh * 1.8 : cc.winSize.width;
    const x = this.x0 = this.camera.node.x = ww / 2;
    const y = this.y0 = this.camera.node.y = wh / 2;
    this.maxx = ww * 100;

    this.paused = true;

    // remind only register event once, otherwise will be called multiple times
    // or on 'finished'
    cc.find('Canvas/mask').getComponent(cc.Animation).on('stop', () => {
      this.paused = false;
      this.player.animation.enabled = true;
      if (game.isSlave || game.isMaster) {
        this.player2 = cc.instantiate(this.playerPrefab);
        this.player2.name = 'player2';
        cc.find('Canvas/playground/scroll/player2').addChild(this.player2);
        this.player2 = this.player2.getComponent('Player');
        this.player2.animation.enabled = true;
        this.player2.node.active = false;
        if (game.isMaster) {
          game.send({ restart: 1 });
          this.player2.node.scale = 0.8;
          game.showToast('waitForMate');
          this.pause();
        } else {
          this.player.node.scale = 0.8;
          game.send({ joined: 1 });
        }
      }
      this.startClip.play();
      this.onMaskFinishRevive();
    });

    this.gameHidden = () => {
      if (!this.stopped) this.pause(true);
    };
    cc.game.on(cc.game.EVENT_HIDE, this.gameHidden);
    this.gameShown = () => {
      if (this.effect) this.effect.reset(Date.now() - (0.1 + Math.random() * 0.9) * 5000);
    };
    cc.eventManager.addCustomListener(cc.game.EVENT_SHOW, this.gameShown);

    this.audios = this.node.getComponents(cc.AudioSource);
    this.desertClip = game.getSound('desert');
    this.clickClip = game.getSound('click');
    this.startClip = game.getSound('ding');
    this.scoreClip = game.getSound('score');
    this.eagleClip = game.getSound('eagle');
    this.arrowClip = game.getSound('arrow');
    this.fireClip = game.getSound('fire');
    this.poofClip = game.getSound('poof');
    this.whooshClip = game.getSound('whoosh');
    this.horseClip = game.getSound('horse-shout');
    this.horseRunClip = game.getSound('horse-run');
    this.audios.forEach((a) => {
      if (a.clip.indexOf('music') >= 0) a.volume = game.musicVolume;
      else a.volume = game.soundVolume;
    });
    setTimeout(() => {
      const music = game.getSound('music');
      [music, this.desertClip, this.horseRunClip, this.fireClip].forEach((a) => {
        if (!a) return;
        a.loop = true;
        a.play();
      });
      this.horseRunClip.mute = true;
      this.fireClip.volume = 0;
    }, 10);

    this.showGuestureTip();

    cc.find('Canvas/bottom/died/share').active =
      cc.find('Canvas/menu/bottom/left').active =
      cc.find('Canvas/bottom/paused/share').active = cc.sys.isNative || game.wxReady();
    if (cc.sys.isNative) {
      cc.find('Canvas/menu/bottom/left/gc/android').active = cc.sys.os === cc.sys.OS_ANDROID;
      cc.find('Canvas/menu/bottom/left/gc/ios').active = cc.sys.os === cc.sys.OS_IOS;
    }
    cc.find('Canvas/menu/bottom/died/middle').active = !game.isMaster && !game.isSlave;
    cc.find('Canvas/menu/bottom/died/right').active = game.isMaster || game.isSlave;
    this.trees = cc.find('Canvas/playground/scroll/trees');
    this.birds = cc.find('Canvas/playground/scroll/birds');
    this.fengshuis = cc.find('Canvas/playground/scroll/fengshuis');
    this.terrain = cc.find('Canvas/playground/scroll/terrain');
    this.terrain2 = cc.find('Canvas/playground/scroll/terrain2');
    this.bridges = cc.find('Canvas/playground/scroll/bridges');
    this.arrows = cc.find('Canvas/playground/scroll/arrows');
    this.bgMask = cc.find('Canvas/bg-mask');
    this.bg = cc.find('Canvas/bg');
    this.changcheng = cc.find('Canvas/changcheng');
    this.scroll = cc.find('Canvas/playground/scroll');

    this.effect = cc.find('Canvas/effect').getComponent('Effect');
    if (!game.getEffectOn() || !cc.GLProgram) {
      this.effect.node.destroy();
      this.effect = undefined;
    } else this.effect.load();

    this.fires = cc.find('Canvas/playground/scroll/fires');
    this.eagles = cc.find('Canvas/playground/scroll/eagles');
    this.player = cc.instantiate(this.playerPrefab);
    cc.find('Canvas/playground/scroll/player').addChild(this.player);
    this.player = this.player.getComponent('Player');
    this.enemies = cc.find('Canvas/playground/scroll/enemies');
    this.enemyList = [];
    this.exposion = cc.find('Canvas/playground/scroll/exposion');
    for (let i = 0; i < this.numEnemies; ++i) this.spawnEnemy();
    this.staticEnemy = cc.instantiate(this.enemyPrefab);
    this.staticEnemy.scaleX = -1;
    cc.find('Canvas/playground/scroll/staticEnemy').addChild(this.staticEnemy);
    this.fences = cc.find('Canvas/playground/scroll/fences');
    this.coins = cc.find('Canvas/playground/scroll/coins');
    cc.director.getCollisionManager().enabled = true;
    this.treePools = [];

    const pvs = [[-ww * 2 + x, -ww / 3], [x, y], [ww * 2 + x, -ww / 3]]; // peaks and valleys
    const pts = [pvs[0]];
    const cts = [pvs[0]];
    for (let i = 1; i < pvs.length; ++i) {
      const p0 = pvs[i - 1];
      const p1 = pvs[i];
      const c = this.interpolate(p0, p1);
      pts.push(c[1], p1);
      cts.push(c[0], c[2]);
    }
    this.points = game.useT ? game.T.terrain.points : pts;
    this.controls = game.useT ? game.T.terrain.controls : cts;
    this.istart = 0;
    this.iend = pts.length - 1;
    this.iend2 = this.istart2 = 0;
    this.controls2 = this.points2 = [pts[0]];

    for (let i = 0; i < this.leafPrefabs.length; ++i) {
      for (let j = 0; j < 4; ++j) {
        this.leaves.addChild(cc.instantiate(this.leafPrefabs[i]));
      }
    }

    for (let i = 0; i < 8; ++i) {
      this.denglongs.addChild(cc.instantiate(this.denglongPrefab));
    }

    for (let i = 0; i < 3; ++i) {
      this.kates.addChild(cc.instantiate(this.katePrefab));
    }

    this.drawTerrain();
    this.changeTheme(this.whereami());

    if (game.makeTerrain) {
      if (cc.winSize.width / cc.winSize.height !== 1.8) {
        throw String('aspect ratio must be 1.8 if your wanna make terrain');
      }
      game.makeTerrain = {
        terrain: {
          points: pts,
          controls: cts,
        },
        terrain2: {
          points: [],
          controls: [],
        },
        fences: [],
        bridges: {},
        fengshuis: [],
      };
    }

    game.onSceneLoad(this);
  },

  showGuestureTip(swipe) {
    if (game.tipShownTimes >= 4) {
      game.showSwipeGuesture = false;
      return;
    }
    this.tipNode.active = false;
    game.tipShownTimes = (game.tipShownTimes || 0) + 1;
    cc.find('Canvas/guesture-tip/tap').active = !swipe;
    cc.find('Canvas/guesture-tip/swipe').active = swipe;
    if (game.getItinerary() < 3) {
      this.tipNode.active = true;
      game.showSwipeGuesture = true;
      this.timeout = setTimeout(() => {
        this.tipNode.active = false;
      }, 12000);
    }
  },

  interpolate(a, b) {
    const r = 0.5;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const c = [a[0] + dx * r, a[1] + dy * r];
    const d = Math.sqrt(dx * dx + dy * dy);
    const da = d * r;
    const db = d * (1 - r);
    const cos = dx / d;
    const p0x = a[0] + da / 2 / cos;
    const p1x = b[0] - db / 2 / cos;
    const c0 = [p0x, a[1]];
    const c1 = [p1x, b[1]];
    return [c0, c, c1];
  },

  wxShare() {
    const tip = cc.find('Canvas/tip');
    const tmp = tip.active;
    tip.active = false;
    cc.find('Canvas/menu/bottom').active = false;
    cc.find('Canvas/top/middle').active = true;
    cc.find('Canvas/top/left').active = false;
    cc.find('Canvas/top/right').active = false;
    cc.find('Canvas/bottom').active = false;
    cc.find('Canvas/code').active = true;
    let t;
    const restore = (wrong) => {
      cc.find('Canvas/menu/bottom').active = true;
      cc.find('Canvas/top/middle').active = false;
      cc.find('Canvas/top/left').active = true;
      cc.find('Canvas/top/right').active = true;
      cc.find('Canvas/bottom').active = true;
      cc.find('Canvas/code').active = false;
      tip.active = tmp;
      if (t) t.destroy();
      if (wrong) {
        t = game.showToast('Something wrong, please try later');
        setTimeout(() => t.destroy(), 3000);
      }
    };
    setTimeout(() => {
      const canvas = document.getElementsByTagName('canvas')[0];
      if (!canvas.toBlob) {
        restore(true);
        return;
      }
      t = game.showToast('Processing...');
      canvas.toBlob((blob) => {
        /* global location */
        /* global XMLHttpRequest */
        const xhr = new XMLHttpRequest();
        xhr.open('POST', location.origin + '/api/file/upload');
        xhr.onload = () => {
          /* eslint no-bitwise: 0 */
          if (xhr.status / 100 | 0 === 2) {
            const current = location.origin + '/gw/images/' + xhr.responseText;
            wx.previewImage({
              current,
              urls: [current],
            });
            restore();
          } else {
            restore(true);
          }
        };
        /* global FormData */
        const body = new FormData();
        body.append('local', 'gw');
        body.append('blob', blob);
        xhr.send(body);
        xhr.onerror = () => { restore(true); };
      }, 'image/jpeg', 0.95);
    }, 100);
  },

  share() {
    if (!cc.sys.isNative) {
      this.wxShare();
      return;
    }
    const tip = cc.find('Canvas/tip');
    const tmp = tip.active;
    tip.active = false;
    cc.find('Canvas/menu/bottom').active = false;
    cc.find('Canvas/top/middle').active = true;
    cc.find('Canvas/top/left').active = false;
    cc.find('Canvas/top/right').active = false;
    cc.find('Canvas/bottom').active = false;
    cc.find('Canvas/mask').getComponent(cc.Mask).enabled = false;
    this.denglongs.parent.getComponent(cc.Mask).enabled = false;
    this.kates.parent.getComponent(cc.Mask).enabled = false;
    const t = cc.RenderTexture.create(cc.winSize.width, cc.winSize.height);
    t.begin();
    this.node._sgNode.visit();
    t.end();
    cc.find('Canvas/menu/bottom').active = true;
    cc.find('Canvas/top/middle').active = false;
    cc.find('Canvas/top/left').active = true;
    cc.find('Canvas/top/right').active = true;
    cc.find('Canvas/bottom').active = true;
    cc.find('Canvas/mask').getComponent(cc.Mask).enabled = true;
    this.denglongs.parent.getComponent(cc.Mask).enabled = true;
    this.kates.parent.getComponent(cc.Mask).enabled = true;
    tip.active = tmp;

    const name = 'gw-share.jpg';
    // third param is isRGBA
    t.saveToFile(name, cc.ImageFormat.JPG, false, () => {
      // t.release(); // no release if not call retain
      const shareInfo = {};
      // jsb.fileUtils.getWritablePath() not accessable by other app
      // on android (iOS has settings to make it accessable),
      // so nativeShare not work on android
      // to make below work, we must build cocos with modifying

/*
  cd /Applications/CocosCreator.app/Contents/Resources/cocos2d-x
  vi ./cocos/2d/CCRenderTexture.cpp
  std::string fullpath = std::string("/sdcard/Android/data/") + fileName;
  del tools/simulator/frameworks/runtime-src/proj.android-studio/
  cocos gen-libs -p android --app-abi armeabi-v7a
  // gen-libs fails (stupid cocos), we must copy to overwrite cocos prebuilt manually as below
  cp -rf
  ./tools/simulator/frameworks/runtime-src/proj.android/obj/local/armeabi-v7a/*a
  ./prebuilt/android/armeabi-v7a
*/

      const isAndroid = cc.sys.os === cc.sys.OS_ANDROID;
      const path = isAndroid ? '/sdcard/Android/data/' : jsb.fileUtils.getWritablePath();
      // shareInfo.title = 'Run with "Great Wall Run"\nhttp://gw.newshbb.com';
      const fn = path + name;
      // shareInfo.link = 'http://gw.newshbb.com';
      shareInfo.showDialog = true;
      shareInfo.platform = sdkbox.SocialPlatform.Platform_Select;
      shareInfo.image = fn;
      sdkbox.PluginShare.nativeShare(shareInfo);
      // sdkbox.PluginShare.share(shareInfo);
    });
  },

  draw(ctx, points, controls, xoffset, yoffset) {
    ctx.clear();
    const ox = xoffset || 0;
    const oy = yoffset || 0;
    let miny;
    let p0;
    for (let i = 0; i < points.length; ++i) {
      const c = controls[i];
      const p = points[i];
      const x = p[0] + ox;
      const y = p[1] + oy;
      if (y < miny) miny = y;
      const border = p.length > 2 || !points[i + 1] || !i;
      if (border) {
        const borderStart = !i || points[i - 1].length > 2;
        if (!borderStart) {
          ctx.quadraticCurveTo(c[0] + ox, c[1] + oy, x, y);
          if (ctx.strokeColor.a > 1) ctx.stroke();
          if (ctx.fillColor.a > 1) {
            miny -= 2 * this.wh;
            ctx.lineTo(x, miny);
            ctx.lineTo(p0[0], miny);
            ctx.close();
            ctx.fill();
          }
        } else {
          ctx.moveTo(x, y);
          p0 = [x, y];
          miny = y;
        }
      } else {
        ctx.quadraticCurveTo(c[0] + ox, c[1] + oy, x, y);
      }
    }
  },

  updateTerrain(x0) {
    if (game.useT) return;
    const ww = this.ww;
    let x;
    do {
      const p = this.points[this.points.length - 1];
      const pPrev = this.points[this.points.length - 2];
      const r = Math.random();
      const dx = ((pPrev.length > 2 ? 0.5 : 0.2) + r * 2.5) * ww;
      x = p[0] + dx;
      let dy = Math.random() - 0.5;
      if (dy < 0 && dy > -0.1) dy = -0.25;
      else if (dy >= 0 && dy < 0.1) dy = 0.25;
      const y = p[1] + dy * dx;
      const p1 = [x, y];
      const c = this.interpolate(p, p1);
      const w = p1[0] - p[0];
      const h = Math.abs(p1[1] - p[1]);
      if (w > 0.5 * ww && w < 1.5 * ww && h < ww && p[0] - pPrev[0] > ww
        && p[0] - (this.lastBridge || 0) > ww * 5) { // pit
        p.push(true);
        p1.push(true);
        this.lastBridge = p1[0];
        this.points.push(p1);
        this.controls.push(c[2]);
      } else {
        this.points.push(c[1], p1);
        this.controls.push(c[0], c[2]);
      }
    } while (x - x0 < this.maxx);
  },

  drawTerrain() {
    const ps = this.points.slice(this.istart, this.iend + 1);
    const cs = this.controls.slice(this.istart, this.iend + 1);
    this.terrain.getChildren().forEach((node) => {
      const ctx = node.getComponent(cc.Graphics);
      this.draw(ctx, ps, cs);
    });
  },

  tryUpdateTerrain(x0) {
    const ps = this.points;
    if (ps[ps.length - 1][0] < x0 + this.maxx / 2) {
      this.updateTerrain(x0);
    }

    if (ps[this.iend][0] < x0 + this.ww * 2) {
      const x1 = x0 - this.ww * 2;
      for (let i = this.istart + 1; i < ps.length - 1; ++i) {
        if (ps[i][0] <= x1) {
          if (ps[i + 1][0] >= x1) {
            this.istart = i;
            break;
          }
        } else break;
      }
      const x2 = x0 + this.ww * 2;
      for (let i = this.istart + 1; i < ps.length; ++i) {
        if (ps[i][0] >= x2) {
          this.iend = i;
          break;
        }
      }
      this.drawTerrain();
      cc.log(
        'npoints', this.points.length,
        'ndrawn', this.iend - this.istart + 1,
        'nbridges', this.bridges.getChildren().length,
        this.bridges.getChildren().filter(n => n.active).length,
        'narrows', this.arrows.getChildren().length,
        'nfires', this.fires.getChildren().length,
        'nfengshui', this.fengshuis.getChildren().length,
        this.fengshuis.getChildren().filter(n => n.active).length,
        'neagles', this.eagles.getChildren().length,
        this.eagles.getChildren().filter(n => n.active).length,
        'ntrees', this.trees.getChildren().length,
        'nbirds', this.birds.getChildren().length,
        'nfences', this.fences.getChildren().length,
        this.fences.getChildren().filter(n => n.active).length,
        'nenemies', this.enemies.getChildren().length,
        this.enemies.getChildren().filter(n => n.active).length,
        'ncoins', this.coins.getChildren().length,
        this.coins.getChildren().filter(n => n.active).length,
      );
    }
  },

  spawnBridge(second = '') {
    const node = this.spawn('bridge' + second, true);
    this.bridges.addChild(node);
    return node;
  },

  drawBridge2(a, b) {
    const node = this.spawnBridge(2);
    node.x = a[0];
    node.y = a[1];
    const board = node.getChildren().filter(n => n.name === 'board')[0];
    const right = node.getChildren().filter(n => n.name === 'right')[0];
    right.x = b[0] - a[0];
    right.y = b[1] - a[1];
    const w = Math.sqrt(right.x * right.x + right.y * right.y);
    board.scaleX = w / board.width;
    board.rotation = -Math.asin(right.y / w) / Math.PI * 180;
    return node;
  },

  drawBridge(a, b) {
    let T;
    if (game.useT) {
      T = game.T.bridges[a[0]] || game.T.bridges[b[0]];
    }
    const r = (b[0] - a[0]) / this.ww;
    if ((game.useT && !T) || r < 0.75 || r > 1.25) {
      return this.drawBridge2(a, b);
    }
    const node = this.spawnBridge();
    let sx = 1;
    if (T) {
      sx = T.sx;
    } else if (Math.random() > 0.5) sx = -1;
    node.scaleX = sx;
    if (sx < 0) {
      const tmp = a;
      a = b;
      b = tmp;
      b = [b[0] + 300, b[1] + 100];
    } else b = [b[0] - 300, b[1] + 100];
    node.x = a[0];
    node.y = a[1];
    const board = node.getChildren().filter(n => n.name === 'board')[0];
    let w = _.length(a, b);
    board.scaleX = w / board.width;

    const star = node.getChildren().filter(n => n.name.endsWith('star'))[0];
    star.active = true;
    if (T) {
      star.x = T.star.x;
      star.y = T.star.y;
    } else if (sx > 0) {
      star.x = (b[0] - a[0]) / 2;
      star.y = (b[1] - a[1]) / 2 + 200 * (1 + Math.random() / 5);
    } else {
      star.x = a[0] - b[0] + 300 + 200 * Math.random();
      star.y = b[1] - a[1] + 150 * (1 + Math.random() / 5);
    }

    board.rotation = -Math.asin((b[1] - a[1]) / w) / Math.PI * 180;
    const thread = node.getChildren().filter(n => n.name === 'pull-thread')[0];
    b = [b[0] - (b[0] - a[0]) / 10, b[1] - (b[1] - a[1]) / 10 - board.height];
    a = [a[0] + sx * thread.x, a[1] + thread.y];
    w = _.length(a, b);
    thread.scaleX = w / thread.width;
    thread.rotation = -Math.asin((b[1] - a[1]) / w) / Math.PI * 180;
    if (game.makeTerrain) {
      game.makeTerrain.bridges[node.x] = {
        sx, star: { x: star.x, y: star.y },
      };
    }
    return node;
  },

  spawnTree() {
    const f = this.treePrefabs;
    const i = parseInt(Math.random() * f.length, 10);
    let p = this.treePools[i];
    if (!p) p = this.treePools[i] = new cc.NodePool();
    let node;
    if (p.size() > 0) {
      node = p.get(this);
    } else {
      node = cc.instantiate(f[i]);
      node.name = '' + i;
    }
    this.trees.addChild(node);
    return node;
  },

  despawnTree(node) {
    this.treePools[node.name].put(node);
  },

  spawnArrow() {
    return this.spawn('arrow');
  },

  spawn(name, noAdd) {
    let node;
    const pname = name + 'Pool';
    if (!this[pname]) this[pname] = new cc.NodePool(name);
    if (this[pname].size() > 0) {
      node = this[pname].get(this);
      node.active = true;
    } else {
      node = cc.instantiate(this[name + 'Prefab']);
    }
    if (!noAdd) this[name + 's'].addChild(node);
    return node;
  },

  despawn(node) {
    this[node.name + 'Pool'].put(node);
  },

  getBerzPoint(x0, delta = 0, checkPit, terrain2, ntried = 0) {
    ntried++;
    const x = x0 + delta;
    let i = terrain2 ? 0 : this.istart;
    let pitx;
    const ps = terrain2 ? this.points2 : this.points;
    if (x < ps[i][0]) {
      console.error('x < istart');
    }
    for (; i < ps.length - 1; ++i) {
      const p = ps[i + 1];
      if (p.length > 2) pitx = p[0];
      if (p[0] > x) {
        if (checkPit > 0 && p.length < 3) {
          for (let j = i + 2; j < ps.length; ++j) {
            const p2 = ps[j];
            if (p2[0] - x0 > checkPit) break;
            if (p2.length > 2) {
              pitx = p2[0];
              break;
            }
          }
        }
        break;
      }
    }
    const p = ps[i];
    const p1 = ps[i + 1];
    if (!p1) {
      console.error('p1 undefined');
      return {};
    }
    const onPit = p.length > 2 && p1.length > 2;
    if (checkPit > 0) {
      if (onPit) return {};
      else if (pitx > 0 && Math.abs(x0 - pitx) < checkPit) return {};
    }
    const t = (x - p[0]) / (p1[0] - p[0]);
    const c = (terrain2 ? this.controls2 : this.controls)[i + 1];
    const tc = 1 - t;
    const bx = tc * tc * p[0] + 2 * t * tc * c[0] + t * t * p1[0];
    const df = x0 - bx;
    if (delta === 0 && Math.abs(df) > 1) {
      return this.getBerzPoint(x0, df, checkPit, terrain2, ntried);
    }
    const by = tc * tc * p[1] + 2 * t * tc * c[1] + t * t * p1[1];
    const dx = (tc * c[0] + t * p1[0]) - (tc * p[0] + t * c[0]);
    const dy = (tc * c[1] + t * p1[1]) - (tc * p[1] + t * c[1]);
    const deg = Math.atan2(dy, dx) / Math.PI * 180;
    if (ntried > 2) {
      console.error('ntried > 2');
    }
    return { bx, by, deg, onPit, p, p1, ntried };
  },

  updateCoins(x0) {
    if (game.isMaster || game.isSlave) return;
    const ww = this.ww;
    const c = this.coins;
    if (c.x < x0 - 1.5 * ww) {
      c.getChildren().slice().forEach(n => this.despawn(n));
    } else c.active = c.x < x0 + 1.5 * ww;
    if (c.getChildren().length) return;
    cc.log('updated coins');
    const ex = x0 + (2 + 2 * Math.random()) * ww;
    const { bx, by, deg } = this.getBerzPoint(ex, -1);
    if (!bx) return;
    c.x = bx;
    c.y = by + 200;
    c.rotation = -deg;
    const ctx = c.getComponent(cc.Graphics);
    ctx.clear();
    for (let i = 0; i < 3; ++i) {
      const yin = Math.random() < 0.5;
      const y = i * 80;
      let n = this.spawn('coin');
      n.x = -110;
      n.y = y;
      n = this.spawn('coin');
      n.x = 110;
      n.y = y;
      if (yin) {
        ctx.moveTo(-120, y);
        ctx.lineTo(-20, y);
        ctx.moveTo(20, y);
        ctx.lineTo(120, y);
        n = this.spawn('coin');
        n.x = -30;
        n.y = y;
        n = this.spawn('coin');
        n.x = 30;
        n.y = y;
      } else {
        ctx.moveTo(-120, y);
        ctx.lineTo(120, y);
        n = this.spawn('coin');
        n.x = 0;
        n.y = y;
      }
    }
    ctx.stroke();
  },

  updateFences(x0) {
    const ww = this.ww;
    if (game.useT) {
      let i = this.ifence || 0;
      const fences = game.T.fences;
      for (i; i < fences.length; ++i) {
        const f = fences[i];
        if (f.x <= x0 + ww + 50) {
          const n = this.fences.getChildren()[f.i];
          n.x = f.x;
          n.y = f.y;
          n.rotation = f.r;
        } else {
          break;
        }
      }
      this.ifence = i;
      return;
    }
    let x = Math.max(this.fencex || 0, x0);
    this.fences.getChildren().forEach(n => (n.active = Math.abs(n.x - x0) < ww + 50));
    if (x > this.points[this.points.length - 1][0]) return; // save power
    this.fences.getChildren().forEach((n, i) => {
      if (n.x > x0 - ww * 2) return;
      const ex = x + (0.5 + 2 * Math.random()) * ww;
      const { bx, by, deg } = this.getBerzPoint(ex, -1, ww);
      cc.log('update fences');
      if (!bx) {
        x += ww;
        return;
      }
      if (bx - x0 < ww / 2) return;
      // in case next expected one is pit
      if (this.points[this.points.length - 1][0] - bx < ww) {
        x += ww;
        return;
      }
      if (Math.abs(this.staticEnemy.x - bx) < ww / 2) {
        x += ww / 2;
        return;
      }
      x = bx;
      n.active = Math.abs(x - x0) < ww;
      n.x = x;
      n.y = by;
      n.rotation = -deg;
      if (game.makeTerrain) {
        game.makeTerrain.fences.push({
          x, y: by, r: -deg, i,
        });
      }
    });
    this.fencex = x;
  },

  updateEnemies(x0, dt) {
    if (game.isSlave) return;
    const ww = this.ww;
    this.enemyList.forEach((p) => {
      const eg = p.eagle.node;
      eg.active = Math.abs(eg.x - x0) < ww || p.node.active;
      if (!p.node.active) p.x += dt * p.speed;
      const d = p.x - x0;
      if (!p.node.active && d < 0 && d > -ww) {
        p.node.active = true;
        cc.log(p.id, 'enemy turn active');
        if (game.isMaster && this.player2) {
          game.send({
            x: parseInt(this.player.x, 10),
            y: parseInt(this.player.y, 10),
            r: parseInt(this.player.rotation, 10),
            e: [p.id, parseInt(p.x, 10)],
          });
        }
      }
      if (p.x < x0 + ww * 1.5 && p.x > x0 - ww * 3) return;
      const x = x0 - (1 + 2 * Math.random()) * ww;
      if (this.nearTo(x, this.enemies, ww / 2)) return;
      p.x = x;
      p.node.active = false;
      p.eagle.master = p;
      p.eagle.reset();
    });
  },

  nearTo(x, objs, dis) {
    const c = objs.getChildren();
    let near;
    for (let i = 0; i < c.length; ++i) {
      if (Math.abs(x - c[i].x) < dis) return true;
    }
    return near;
  },

  hit(node, by) {
    node.active = false;
    node.x = this.player.x - 5 * this.ww;
    let name = node.name.split('-');
    name = name[name.length - 1];
    const f = cc.find('Canvas/playground/scroll/hit-' + name);
    f.getChildren().forEach((n) => {
      n.active = true;
      n.x = by.x;
      n.y = by.y + 10;
      n.getComponent('Movement').reset();
    });
    f.active = true;
  },

  updateFengshui(x0) {
    const ps = this.points;
    const released = [];
    const ww = this.ww;
    this.fengshuis.getChildren().forEach((n) => {
      if (n.x <= ps[this.istart][0]) released.push(n);
      else n.active = Math.abs(n.x - x0) < ww + 100;
    });
    released.forEach(n => this.despawn(n));
    if (this.fengshuis.getChildren().length) return;
    if (game.useT) {
      let i = this.ifengshui || 0;
      const fengshuis = game.T.fengshuis;
      for (i; i < fengshuis.length; ++i) {
        const f = fengshuis[i];
        if (f.x <= x0 + ww + 100) {
          const n = this.spawn('fengshui');
          n.getChildren().forEach(n2 => (n2.active = n2.name !== 'lighted'));
          n.x = f.x;
          n.y = f.y;
        } else {
          break;
        }
      }
      this.ifengshui = i;
      return;
    }
    let x = this.fengshuix || 0;
    for (let i = this.istart + 1; i < ps.length - 1; ++i) {
      const p = ps[i];
      if (p[0] > x + ww * 12 && p.length === 2 &&
        i !== this.istart2 && i !== this.iend2 &&
        p[1] - ps[i - 1][1] > 100 &&
        p[1] - ps[i + 1][1] > 100) {
        const n = this.spawn('fengshui');
        n.getChildren().forEach(n2 => (n2.active = n2.name !== 'lighted'));
        x = n.x = p[0];
        cc.log('new fengshui', x, i);
        n.y = p[1];
        this.fengshuix = x;
        if (game.makeTerrain) {
          game.makeTerrain.fengshuis.push({
            x, y: n.y,
          });
        }
        break;
      }
    }
  },

  updateBridges(x0) {
    const ps = this.points;
    const released = [];
    this.bridges.getChildren().forEach((n) => {
      if (n.x1 <= ps[this.istart][0]) released.push(n);
      else n.active = n.x0 < x0 + this.ww && n.x1 > x0 - this.ww;
    });
    released.forEach(n => this.despawn(n));
    if (this.bridges.getChildren().length) return;
    let x = this.bridgex || 0;
    for (let i = this.istart; i < ps.length - 1; ++i) {
      if (ps[i][0] > x && ps[i].length > 2 && ps[i + 1].length > 2) {
        const n = this.drawBridge(ps[i], ps[i + 1]);
        n.x0 = ps[i][0];
        x = n.x1 = ps[i + 1][0];
        this.bridgex = x;
        break;
      }
    }
  },

  onDestroy() {
    _.forEach(this, (v, k) => {
      if (k.endsWith('Pool')) {
        cc.log('clear ' + k);
        v.clear();
      }
    });
    this.treePools.forEach(p => p.clear());
    clearTimeout(this.timeout);
    game.newRun();
    cc.game.off(cc.game.EVENT_HIDE, this.gameHidden);
    cc.game.off(cc.game.EVENT_SHOW, this.gameShown);
  },

  updateFires(x0) {
    const released = [];
    this.fires.getChildren().forEach((n) => {
      if (n.x < x0 - this.ww) released.push(n);
    });
    released.forEach(n => this.despawn(n));
  },

  updateFireVolume(x0) {
    let dfire = this.ww;
    this.fires.getChildren().forEach((n) => {
      if (!n.active) return;
      let d = Math.abs(x0 - n.x);
      if (d >= this.ww) return;
      d = _.length(n, this.player);
      if (d < dfire) dfire = d;
    });
    this.fences.getChildren().forEach((n) => {
      if (!n.active) return;
      if (n.name.indexOf('fire') < 0) return;
      let d = Math.abs(x0 - n.x);
      if (d >= this.ww) return;
      d = _.length(n, this.player);
      if (d < dfire) dfire = d;
    });
    let dfengshui = this.ww;
    this.fengshuis.getChildren().forEach((n) => {
      if (!n.active) return;
      let d = Math.abs(x0 - n.x);
      if (d >= this.ww) return;
      d = _.length(n, this.player);
      const l = n.getChildren().filter(n2 => n2.name === 'lighted')[0];
      if (l.active && d < dfengshui) {
        dfengshui = d;
      }
    });
    dfire = (this.ww - dfire) / 3;
    dfengshui = this.ww - dfengshui;
    const v = Math.max(0, Math.min(1, (dfire + dfengshui) / this.ww));
    this.fireClip.volume = v * game.soundVolume;
  },

  updateTerrain2(x0) {
    const ww = this.ww;
    const ps = this.points;
    const x = ps[this.iend2][0];
    let updated;
    if (x < x0 - ww * 2 && game.useT) {
      const it2 = this.iterrain2 || 0;
      const t2 = game.T.terrain2.points[it2];
      if (t2) {
        for (let i = this.istart + 1; i < ps.length; ++i) {
          if (ps[i][0] === t2[0][0]) {
            const j = i + 4;
            cc.log('update terrain2', it2);
            this.istart2 = i;
            this.iend2 = j;
            this.points2 = t2;
            this.controls2 = game.T.terrain2.controls[it2];
            updated = true;
            break;
          }
        }
        this.iterrain2 = it2 + 1;
      }
    }
    if (x < x0 - ww * 2 && !game.useT) {
      for (let i = this.istart + 1; i < ps.length - 5; ++i) {
        let y = ps[i][1];
        if (ps[i][0] > x + ww * 6 &&
          ps[i - 1].length === 2 &&
          ps[i + 1].length === 2 &&
          this.controls[i][1] === y &&
          !this.nearTo(ps[i][0], this.fengshuis, 200) &&
          ps[i + 1][1] < y) {
          let j = i + 4;
          y = ps[j][1];
          if (
            ps[j - 1].length === 2 &&
            ps[j + 1].length === 2 &&
            this.controls[j][1] === y &&
            ps[j - 1][1] < y &&
            !this.nearTo(ps[j][0], this.fengshuis, 200) &&
            ps[j][0] - ps[i][0] > 2 * ww
          ) {
            cc.log('new terrain2', i, j);
            this.istart2 = i;
            this.iend2 = j;
            let k = i + 2;
            i = ps[i];
            j = ps[j];
            k = [(i[0] + j[0]) / 2, Math.max(i[1], j[1]) + 100];
            // i = [i[0], i[1] - 10];
            // j = [j[0], j[1] - 10];
            const c1 = this.interpolate(i, k);
            const c2 = this.interpolate(k, j);
            this.points2 = [i, c1[1], k, c2[1], j];
            this.controls2 = [i, c1[0], c1[2], c2[0], c2[2]];
            updated = true;
            break;
          }
        }
      }
    }

    if (updated) {
      this.terrain2.getChildren().forEach((node) => {
        const ctx = node.getComponent(cc.Graphics);
        if (ctx) this.draw(ctx, this.points2, this.controls2);
      });
      if (game.makeTerrain) {
        game.makeTerrain.terrain2.points.push(this.points2);
        game.makeTerrain.terrain2.controls.push(this.controls2);
      }
      this.updateTrees();
      this.updateBirds();
    }
    this.birds.active = this.trees.active = this.terrain2.active =
      ps[this.istart2][0] < x0 + ww && ps[this.iend2][0] > x0 - ww;
  },

  updateTrees() {
    this.trees.getChildren().slice().forEach(n => this.despawnTree(n));
    const ps = this.points2;
    for (let x = ps[0][0] + 200; x <= ps[ps.length - 1][0] - 200; x += 200) {
      const { deg, bx, by } = this.getBerzPoint(x, 0, undefined, true);
      cc.log('update trees');
      const node = this.spawnTree();
      node.x = bx;
      node.y = by;
      node.rotation = -deg;
    }
  },

  updateBirds() {
    const ps = this.points2;
    const p = ps[parseInt(ps.length / 2, 10)];
    const num = 10;
    this.birds.getChildren().slice().forEach(b => this.despawn(b));
    for (let i = 0; i < num; ++i) {
      const x2 = p[0] + (i - num / 2) * 30 * (1 + Math.random());
    // for (let x = ps[0][0] + 100; x <= ps[ps.length - 1][0] - 100; x += 100) {
      // if (Math.random() < 0.5) continue;
      // const x2 = x + 50 * (0.5 - Math.random());
      const { deg, bx, by } = this.getBerzPoint(x2, 0, undefined, true);
      cc.log('update birds');
      const node = this.spawn('bird');
      node.x = bx;
      node.y = by;
      node.getComponent('Bird').reset();
      node.rotation = -deg;
      node.scaleX = Math.random() > 0.5 ? 1 : -1;
    }
  },

  update(dt) {
    if (this.effect) this.updateEffect(dt);
    this.horseRunClip.mute = this.player.speedY || !this.player.speed || this.stopped;
    if (this.stopped) return;
    this.updateOthers(dt);
  },

  updateOthers(dt = 0) {
    const x0 = this.player.x;
    this.tryUpdateTerrain(x0);
    this.updateFences(x0);
    this.updateCoins(x0);
    this.updateEnemies(x0, dt);
    this.updateBridges(x0);
    this.updateFengshui(x0);
    this.updateFires(x0);
    this.updateFireVolume(x0);
    this.updateTerrain2(x0);
  },

  updateEffect(dt) {
    const e = this.effect;
    if (typeof e.opacity === 'undefined') {
      e.opacity = -1;
      e.fadeIn = true;
    }
    if (e.opacity > 0.9) dt /= game.effectLength1 || 50;
    else if (e.opacity < 0) dt /= game.effectLength0 || 10;
    if (e.fadeIn) e.opacity += dt;
    else e.opacity -= dt;
    e.parameters.opacity = Math.max(0, e.opacity);
    if (!e.node.active && e.opacity > 0) {
      e.parameters.bgcolor = {
        x: 0.1 + Math.random() * 0.4,
        y: 0.1 + Math.random() * 0.4,
        z: 0.1 + Math.random() * 0.4,
      };
      const s = 3;
      e.node.width = this.ww / s;
      e.node.height = this.wh / s;
      e.node.scale = s; // smaller to make less calc
      if (game.NFOG > 2) {
        e.parameters.mouse.y = 0;
      } else {
        e.parameters.mouse.y = -e.node.height * (0.5 + Math.random() / 2);
      }
      e.reset(Date.now() - (0.1 + Math.random() * 0.9) * 5000);
      e.parameters.NNOISE = parseInt(Math.random() * 3, 10);
      e.node.active = true;
    }
    if (e.node.active && e.opacity < 0) {
      e.node.active = false;
    }
    if (e.opacity >= 1) e.fadeIn = false;
    if (e.opacity <= -1) e.fadeIn = true;
  },

  pause2() {
    this.paused = !this.paused;
    this.player.animation.enabled = !this.paused;
    if (this.player2) this.player2.animation.enabled = !this.paused;
    this.enemyList.forEach(n => (n.animation.enabled = !this.paused));
    this.eagles.getChildren().forEach((eagle) => {
      eagle.getChildren()[0].getComponent(cc.Animation).enabled = !this.paused;
    });
    this.birds.getChildren().forEach((n) => {
      n.getChildren().filter(n2 => n2.name === 'fly')[0].getComponent(cc.Animation).enabled = !this.paused;
    });
    if (game.isMaster) game.send({ paused: this.paused ? 1 : 0 });
  },

  pause() {
    if (!this.paused) {
      this.pause2();
      cc.find('Canvas/bottom/paused').active = true;
      game.saveItinerary();
    } else {
      cc.find('Canvas/bottom/paused').active = false;
      this.hideMenu();
      cc.find('Canvas').getComponent(cc.Animation).play('countdown');
    }
  },

  restart() {
    game.loadScene('level');
  },

  showMenu(noAnim) {
    cc.find('Canvas/bottom/paused').active = false;
    cc.find('Canvas/bottom/died').active = false;
    cc.find('Canvas/tip').active = false;
    if (cc.GLProgram) cc.find('Canvas/menu/blur').getComponent('LayerBlur').blur();
    cc.find('Canvas/menu').active = true;
    cc.find('Canvas/menu/bottom/died').active = this.died;
    const restart = cc.find('Canvas/menu/bottom/died/right');
    if (this.died && !restart.active && !game.canContinue()) {
      restart.active = true;
    }
    cc.find('Canvas/menu/bottom/paused').active = !this.died;
    if (cc.find('Canvas/top').opacity) {
      // plus blur, this anim make screen blink, though it blinks,
      // still better than no anim
      if (!noAnim) cc.find('Canvas/menu').getComponent(cc.Animation).play();
      this.drawRoute();
    } else {
      this.drawRouteAnim();
    }

    game.saveItinerary();
  },

  hideMenu() {
    cc.find('Canvas/menu').active = false;
    if (cc.GLProgram) cc.find('Canvas/menu/blur').getComponent('LayerBlur').removeBlur();
  },

  goHome() {
    game.loadScene('home');
  },

  revive() {
    if (!game.canContinue()) {
      cc.instantiate(this.dialogPrefab).getComponent('Dialog').show(
        'Purchase',
        'you need Are you sure you want to exit Great Wall Run?',
        () => {
          game.purchase('continue');
        },
      );
      return;
    }
    this.player.revive();
    this.hideMenu();
    cc.find('Canvas/playground/scroll/die-player').active = false;
    game.newRun();
    cc.find('Canvas/mask').getComponent(cc.Animation).play();
    this.player.lives = 0;
    // this.changeTheme(parseInt(Math.min(game.getBestDistance(), 4) * Math.random(), 10));
    this.changeTheme(parseInt(4 * Math.random(), 10));
  },

  onMaskFinishRevive() {
    if (!this.died) return;
    this.enemyList.forEach((e) => {
      e.trace.active = true;
      e.animation.enabled = true;
    });
    this.staticEnemy.active = false;
    this.eagles.getChildren().forEach((eagle) => {
      eagle.getChildren()[0].getComponent(cc.Animation).enabled = true;
    });
    let x0 = this.player.x;
    const { p, p1, onPit, by } = this.getBerzPoint(x0);
    if (onPit) {
      let b;
      this.bridges.getChildren().forEach((n) => {
        if (n.x0 === p[0]) b = n;
      });
      if (b && b.name === 'bridge') {
        this.enemies.getChildren().forEach((n) => {
          n.x += p1[0] - x0;
        });
        this.player.node.x = p1[0];
        this.player.node.y = p1[1];
        this.player.speedY = 0;
        this.player.node.rotation = 0;
      }
    } else if (this.player.y < by) this.player.y = by;
    x0 = this.player.x;
    this.fires.getChildren().forEach((n) => {
      if (n.x > x0 - this.ww / 2 && n.x < x0 + this.ww / 2) n.x = x0 - this.ww * 2;
    });
    this.fences.getChildren().forEach((n) => {
      if (n.x > x0 - this.ww / 2 && n.x < x0 + this.ww / 2) n.x = x0 - this.ww * 2;
    });
    this.arrows.getChildren().forEach((n) => {
      if (n.x > x0 - this.ww / 2 && n.x < x0 + this.ww / 2) this.despawn(n);
    });
    this.enemies.getChildren().forEach((n) => {
      if (n.x > x0 - this.ww / 2 && n.x < x0 + this.ww / 2) n.x = x0 + this.ww * 2;
    });

    this.stopped = false;
    this.player.node.active = true;
    this.player.animation.enabled = true;
  },

  drawRoute(it) {
    if (!it) it = game.getItinerary();
    const node = cc.find('Canvas/menu/itinerary');
    if (it > 1000) it = parseInt(it * 10, 10) / 10;
    else it = parseInt(it * 100, 10) / 100;
    cc.find('Canvas/menu/itinerary/label').getComponent(cc.Label).string = it
       + 'km';
    cc.find('Canvas/menu/itinerary/fall-label').getComponent(cc.Label).string =
      game.getDies() + '';
    let best = game.getBestDistance();
    best = parseInt(best * 1000, 10) / 1000;
    cc.find('Canvas/menu/record/label').getComponent(cc.Label).string =
      best + 'km';
    const d0 = it / gwscale;
    const r = cc.find('Canvas/menu/map/route');
    const ctx = r.getComponent(cc.Graphics);
    ctx.clear();
    ctx.moveTo(gwpoints[0][0], gwpoints[0][1]);
    let i;
    let d = 0;
    let d2;
    for (i = 1; i < gwpoints.length; ++i) {
      d2 = _.length(gwpoints[i], gwpoints[i - 1]);
      d += d2;
      if (d > d0) break;
      ctx.lineTo(gwpoints[i][0], gwpoints[i][1]);
    }
    let x = gwpoints[i - 1][0];
    let y = gwpoints[i - 1][1];
    if (i < gwpoints.length) {
      d -= d2;
      x += (d0 - d) / d2 * (gwpoints[i][0] - x);
      y += (d0 - d) / d2 * (gwpoints[i][1] - y);
      ctx.lineTo(x, y);
    } else {
      // finished
    }
    node.x = x;
    node.y = y;
    ctx.stroke();
  },

  drawRouteAnim() {
    const i = this.whereami();
    if (!i) return;
    const a = allguans[i - 1].distance;
    const b = allguans[i].distance;
    if (a > 0) this.drawRoute(a);
    let n = 1;
    const intid = setInterval(() => {
      this.drawRoute(n * (b - a) / 10 + a);
      n += 1;
      if (n > 10) {
        clearInterval(intid);
      }
    }, 100);
  },

  whereami() {
    const it = game.getItinerary();
    for (let i = 1; i < allguans.length; ++i) {
      if (allguans[i].distance > it && allguans[i - 1].distance <= it) {
        return i - 1;
      }
    }
    return allguans.length - 1;
  },

  transform(by, x, y) {
    let s = 1;
    if (y > by) {
      const r = (y - by) / this.ww;
      s = 1 - r;
    }
    s = Math.max(0.5, s);
    this.scroll.scale = s;
    this.scroll.x = this.x0 - x * s;
    this.scroll.y = this.y0 - y * s;
    /*
    this.camera.node.x = x;
    this.camera.node.y = y;
    this.camera.zoomRatio = s;
    */
    this.bgMask.opacity = 25 * s * s * s;
    /* make eyes tired
    this.bg.opacity = 255 * s;
    */
    const a = this.changcheng;
    const b = this.bgMask;
    this.dbg = this.dbg || 0;
    this.dbg += 1;
    if (this.dbg % 10) return;
    const fires = cc.find('Canvas/changcheng/1/fires').getChildren();
    const fires2 = cc.find('Canvas/changcheng/2/fires').getChildren();
    [a, b].forEach((n) => {
      n.x -= this.player.speed / 500;
      if (n.x <= -1500) {
        n.x = 0;
        if (n === a) {
          fires.forEach((f, i) => {
            f.active = fires2[i].active;
          });
          fires2.forEach(f => (f.active = false));
        }
      }
    });
    const w = this.ww / 2;
    fires.concat(fires2).forEach((f) => {
      if (!f.active) return;
      const d = f.width * f.scaleX;
      const x2 = f.parent.parent.parent.x + f.parent.parent.x + f.x;
      if (x2 + d < -w || x2 - d > w) {
        f.active = true;
      }
    });
  },

  igniteWallFire() {
    const a = cc.find('Canvas/changcheng/1/fires').getChildren();
    let b = cc.find('Canvas/changcheng/2/fires').getChildren();
    b = a.concat(b);
    const w = this.ww / 2;
    for (let i = 0; i < b.length; ++i) {
      const f = b[i];
      if (f.active) continue;
      const d = f.width * f.scaleX;
      const x = f.parent.parent.parent.x + f.parent.parent.x + f.x;
      if (x + d > -w && x - d < w) {
        f.active = true;
        break;
      }
    }
  },

  changeTheme(num) {
    if (num > 3) num = 2;
    const a = this.node.getChildren().filter(n => n.name === 'theme');
    const b = cc.find('Canvas/changcheng').getChildren().filter(n => n.name === 'theme');
    a.concat(b).forEach((theme) => {
      theme.getChildren().forEach(n => (n.active = n.name === '' + num));
    });
  },

  powerup() {
    if (this.player.ncoins >= 10) {
      this.player.ncoins -= 10;
      this.player.powered = true;
      clearTimeout(this.powerTimeout);
      const p = this.player.node.getChildren().filter(n => n.name === 'power')[0];
      p.active = true;
      this.powerTimeout = setTimeout(() => {
        this.player.powered = false;
        p.active = false;
      }, 1000);
    }
  },

  updatePlayer2(data) {
    if (this.died) return;
    const p2 = this.player2;
    const p = this.player;
    if (typeof data.x !== 'undefined') {
      p2.x = data.x;
      p2.y = data.y;
      p2.node.rotation = data.r;
      p.x = p2.x - 100;
      if (!p.speedY) p.y = p2.y + 100;
      p.node.rotation = data.r;
      this.transform(p.y, p.x, p.y);
      this.tryUpdateTerrain(p.x);
      this.updateOthers();
    }
    if (data.e) {
      const e = this.enemyList[data.e[0]];
      if (e) {
        e.x = data.e[1];
        e.node.active = true;
        e.eagle.master = e;
        e.eagle.reset();
      } else {
        const s = this.staticEnemy;
        s.x = data.e[0];
        s.y = data.e[1];
        s.active = true;
        s.scaleX = -1;
      }
    }
    if (typeof data.pk !== 'undefined') {
      const e = this.enemyList[data.pk];
      if (e) e.die('player2');
      else this.staticEnemy.die('player2');
    }
    if (data.jump) {
      p2.jump();
    }
    if (data.die) {
      this.player.animation.enabled = false;
      p2.die(data.die[0], data.die[1]);
    }
    if (typeof data.paused !== 'undefined') {
      if (this.paused !== !!data.paused) this.pause2();
    }
  },
});
