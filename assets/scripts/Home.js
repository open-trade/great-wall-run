/* global location */

const game = require('./Game');

cc.Class({
  extends: cc.Component,

  properties: {
    roomDialogPrefab: {
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
  },

  soundPlayable() {
    return game.history.length ||
      cc.sys.browserType !== cc.sys.BROWSER_TYPE_WECHAT ||
      cc.sys.os !== cc.sys.OS_IOS;
  },

  eagleFlyoff() {
    if (this.soundPlayable()) game.play('eagle');
  },

  shoot() {
    if (this.soundPlayable()) game.play('arrow');
  },

  startFire() {
    const fire = game.getSound('fire');
    fire.loop = true;
    if (this.soundPlayable()) fire.play();
  },

  onLoad() {
    if (game.ws) game.ws.close();
    game.isMaster = false;
    game.isSlave = false;
    game.useT = false;
    this.maskState = cc.find('Canvas/mask').getComponent(cc.Animation).getAnimationState('mask');
    this.node.getComponent(cc.Animation).enabled = !game.history.length && game.getItinerary() < 1;
    cc.find('Canvas').on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    // seems preload on native can cause crash sometimes
    if (!cc.sys.isNative) cc.director.preloadScene('level');
    this.audios = this.node.getComponents(cc.AudioSource);
    // if not add timeout, the looped audio can not be stopped after node destroyed,
    // cocos creator buggy
    setTimeout(() => {
      const desert = game.getSound('desert');
      const horse = game.getSound('horse');
      const music = game.getSound('music');
      [music, horse, desert].forEach((a) => {
        if (!a) return;
        a.loop = true;
        if (this.soundPlayable()) a.play();
      });
      if (!this.node.getComponent(cc.Animation).enabled) this.startFire();
    }, 10);
    ['music', 'sound'].forEach((name) => {
      const base = 'Canvas/menu/ui/' + name;
      cc.find(base + '/slide').on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
      cc.find(base + '/slide').on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
      this.updateVolume(game[name + 'Volume'], name);
    });

    const menu = cc.find('Canvas/menu');
    menu.getComponent(cc.Animation).on('finished', () => {
      if (!menu.opacity) menu.active = false; // so that button event etc not triggered
    });

    if (!cc.sys.isNative) {
      cc.find('Canvas/menu/fb').active = !location.href.startsWith('cn');
    }

    cc.eventManager.addListener({
      event: cc.EventListener.KEYBOARD,
      onKeyPressed: (keyCode) => {
        if (keyCode === cc.KEY.back || keyCode === cc.KEY.backspace) {
          if (this.maskState.isPlaying) return;
          if (game.dialogShown) {
            game.dialogShown.close();
          } else if (cc.find('Canvas/menu').active) {
            cc.find('Canvas/menu').active = false;
          } else {
            this.showExit();
          }
        }
      },
    }, this.node);

    cc.find('Canvas/getApp').active = !cc.sys.isNative;

    game.onSceneLoad(this);
  },

  onTouchStart() {
    if (game.dialogShown) return;
    if (cc.find('Canvas/menu').active && cc.find('Canvas/menu').opacity > 0) return;
    if (this.maskState.isPlaying) return;
    if (cc.find('Canvas/label').active ||
      cc.find('Canvas/tips/tip').active &&
      cc.find('Canvas/tips/tip/label2').opacity > 128) {
      game.showToast('Loading...');
      game.loadScene('level');
    }
  },

  setPower(effectOn) {
    if (typeof effectOn === 'undefined') effectOn = game.getEffectOn();
    else game.setEffectOn(effectOn);
    const a = cc.color(1, 194, 254);
    const b = cc.color(255, 255, 255);
    cc.find('Canvas/menu/ui/power/toggle/on').color = effectOn ? b : a;
    cc.find('Canvas/menu/ui/power/toggle/off').color = effectOn ? a : b;
  },

  togglePower() {
    this.setPower(!game.getEffectOn());
  },

  showExit() {
    cc.instantiate(this.dialogPrefab).getComponent('Dialog').show(
      'Exit',
      'exitText',
      () => {
        cc.director.end();
      },
    );
  },

  onTouchMove(e) {
    if (e.target !== e.currentTarget) return;
    const node = e.target.getChildren()[0];
    const v = (e.getLocation().x - e.getPreviousLocation().x) / node.width;
    let v0;
    const name = e.target.parent.name;
    if (name === 'music') v0 = game.musicVolume;
    else v0 = game.soundVolume;
    this.setVolume(v + v0, e.target.parent.name);
  },

  onTouchEnd(e) {
    if (e.target !== e.currentTarget) return;
    const node = e.target.getChildren()[0];
    const nodep = e.target.convertToWorldSpace(node.position);
    const p0 = e.getStartLocation();
    const p1 = e.getLocation();
    if (Math.abs(p0.x - p1.x) < 3 && Math.abs(p0.y - p1.y) < 3) {
      const v = (p1.x - nodep.x) / node.width;
      this.setVolume(v, e.target.parent.name);
    }
  },

  setVolume(v, type) {
    if (v < 0) v = 0;
    else if (v > 1) v = 1;
    if (type === 'music') game.setMusicVolume(v);
    else game.setSoundVolume(v);
    this.updateVolumeUi(type);
    this.updateVolume(v, type);
  },

  updateVolume(v, type) {
    if (type === 'sound') {
      this.audios.forEach((a, i) => {
        if (a.clip.indexOf('music') >= 0) return;
        a.volume = v;
        if (i === 2) a.volume = v * 0.5;
      });
    } else {
      this.audios.forEach((a) => {
        if (a.clip.indexOf('music') < 0) return;
        a.volume = v;
      });
    }
  },

  updateVolumeUi(type) {
    const v = type === 'music' ? game.musicVolume : game.soundVolume;
    const base = 'Canvas/menu/ui/' + type + '/slide/line';
    cc.find(base + '/active').width = cc.find(base).width * v;
    cc.find(base + '/dot').x = cc.find(base).width * v;
  },

  showMenu() {
    if (game.dialogShown) return;
    cc.find('Canvas/menu').active = true;
    cc.find('Canvas/getApp').active = false;
    cc.find('Canvas/2players').active = false;
    this.updateVolumeUi('music');
    this.updateVolumeUi('sound');
    this.setPower();
    cc.find('Canvas/menu').getComponent(cc.Animation).play();
  },

  hideMenu() {
    cc.find('Canvas/menu').getComponent(cc.Animation).play('fadeout');
    cc.find('Canvas/getApp').active = !cc.sys.isNative;
    cc.find('Canvas/2players').active = true;
  },

  gotoFb() {
    cc.sys.openURL('https://www.facebook.com/Great-Wall-Run-1919301444991413/');
  },

  getApp() {
    if (game.dialogShown) return;
    if (game.wxReady()) cc.sys.openURL('http://cn.newshbb.com/gw');
    else cc.sys.openURL('http://gw.newshbb.com');
  },

  twoPlayers() {
    if (game.dialogShown) return;
    cc.instantiate(this.roomDialogPrefab).getComponent('RoomDialog').show();
  },
});
