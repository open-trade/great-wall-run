/* eslint no-restricted-syntax: 0 */
/* eslint no-prototype-builtins: 0 */
/* global window */
/* global location */
/* global performance */
/* global wx */
/* global WebSocket */

import { setLang, getString } from './Lang';
import { getParameterByName } from './lib/util';

const T = require('./T');

let itinerary = 0;
let bestDistance = 0;
let currentRun = 0;
let numDies = 0;
let effectOn = true;

function testPerf() {
  const obj = typeof performance !== 'undefined' ? performance : Date;
  const a = obj.now();
  for (let i = 0; i < 10; i++) {
    const array = [];
    const dict = {};
    for (let j = 0; j < 300; j++) {
      const str = 'fecad640-f63e-4868-b6b3-c7c4732e2258' + j;
      array.push(str);
      dict[str] = true;
    }
  }
  const v = obj.now() - a;
  cc.log('testPerf', v);
  return v;
}

let lastLoadSceneTime = 0;
const game = {
  loadScene(name, delay) {
    if (delay > 0) {
      setTimeout(() => this.loadScene(name, 0), delay);
      return;
    }

    const t = Date.now();
    if (t - lastLoadSceneTime < 1000) return;
    lastLoadSceneTime = t;

    let h = this.history;
    if (h.length > 10) {
      h = this.history = h.splice(h.length - 10);
    }
    if (!h.length || h[h.length - 1] !== name) h.push(name);
    cc.director.loadScene(name);
  },

  back() {
    const h = this.history;
    h.pop();
    if (h.length) cc.director.loadScene(h[h.length - 1]);
    else cc.director.loadScene('home');
  },

  previousScene() {
    const h = this.history;
    return h.length > 1 ? h[h.length - 2] : '';
  },

  paid() {
    return false;
  },

  canContinue() {
    return true;
    // return !(cc.sys.isNative && cc.sys.os === cc.sys.OS_ANDROID && !this.paid());
  },

  purchase(name) {
    name = 'test';
    sdkbox.IAP.purchase(name);
  },

  getString(id) { return getString(id); },
  setLang(v) { setLang(v); },

  load() {
    this.T = T;
    setLang(getParameterByName('lang'));
    this.history = [];
    bestDistance = this.getItem('bestDistance') || 0;
    itinerary = this.getItem('itinerary') || 0;
    numDies = this.getItem('numDies') || 0;
    this.ncoins = this.getItem('ncoins') || 0;
    this.soundVolume = this.getItem('soundVolume', 0.5);
    this.musicVolume = this.getItem('musicVolume', 0.25);
    this.purchased = this.getItem('purchased') || {};
    const e = this.getItem('effectOn');
    if (typeof e === 'undefined') {
      this.setEffectOn(testPerf() < 12 && cc.sys.isNative);
      // this.setEffectOn(false);
    } else effectOn = JSON.parse(e);
    if (typeof sdkbox !== 'undefined') {
      sdkbox.PluginFlurryAnalytics.init();
      sdkbox.PluginShare.init();
      sdkbox.PluginReview.init();
      sdkbox.PluginSdkboxPlay.init();
      sdkbox.PluginFacebook.init();
      /*
      sdkbox.IAP.init();
      sdkbox.IAP.refresh();
      sdkbox.IAP.setListener({
        onProductRequestSuccess(products) {
        },
        onSuccess(product) {
          cc.log('xxxxxxx', product);
        },
      });
      */
      if (this.getItem('GPS_CONNECTED')) {
        sdkbox.PluginSdkboxPlay.signin();
      }
      sdkbox.PluginSdkboxPlay.setListener({
        // onScoreSubmitted(name, score) {
        //   cc.log('onScoreSubmitted', name, score);
        // },
        onConnectionStatusChanged(status) {
          if (parseInt(status, 10) === 1000) {
            cc.log('GPS_CONNECTED');
            game.setItem('GPS_CONNECTED', 1);
            game.submitScore();
            if (game.afterGcSignedIn) {
              game.afterGcSignedIn();
              game.afterGcSignedIn = undefined;
            }
          }
        },
      });
    }
  },

  showGc() {
    if (sdkbox.PluginSdkboxPlay.isSignedIn()) {
      sdkbox.PluginSdkboxPlay.showAllLeaderboards();
    } else {
      sdkbox.PluginSdkboxPlay.signin();
      game.afterGcSignedIn = sdkbox.PluginSdkboxPlay.showAllLeaderboards;
    }
  },

  logEvent(name, data) {
    data = data || {};
    const newData = {};
    let key;
    for (key in data) {
      if (data.hasOwnProperty(key)) {
        newData[key] = JSON.stringify(data[key]);
      }
    }
    if (typeof sdkbox !== 'undefined') sdkbox.PluginFlurryAnalytics.logEvent(name, JSON.stringify(newData));
  },

  debug() {
    cc.director.getCollisionManager().enabledDebugDraw =
      !cc.director.getCollisionManager().enabledDebugDraw;
  },

  maxHorseSpeed() {
    return 60 / 3600; // km / second
  },

  normalHorseSpeed() {
    return 45 / 3600;
  },

  addItinerary(v) {
    currentRun += v;
    if (currentRun > bestDistance) bestDistance = currentRun;
  },

  setEffectOn(v) {
    effectOn = v;
    this.setItem('effectOn', v);
  },

  getEffectOn() { return effectOn; },

  newRun() {
    itinerary += currentRun;
    currentRun = 0;
  },

  saveItinerary() {
    this.setItem('itinerary', this.getItinerary());
    this.setItem('bestDistance', bestDistance);
    this.submitScore();
    this.setItem('ncoins', this.ncoins);
  },

  setItem(key, value) {
    cc.sys.localStorage.setItem(JSON.stringify(key), JSON.stringify(value));
  },

  getItem(key, defaultValue) {
    const value = cc.sys.localStorage.getItem(JSON.stringify(key));
    if (!value) return defaultValue;
    return JSON.parse(value);
  },

  getBestDistance() { return bestDistance; },

  submitScore() {
    if (typeof sdkbox !== 'undefined' && sdkbox.PluginSdkboxPlay.isSignedIn()) {
      sdkbox.PluginSdkboxPlay.submitScore('total',
        parseInt(1000 * game.getItinerary(), 10));
      sdkbox.PluginSdkboxPlay.submitScore('best',
        parseInt(1000 * bestDistance, 10));
    }
  },

  getCurrentRun() {
    return currentRun;
  },

  getItinerary() {
    return itinerary + currentRun;
  },

  resetItinerary() {
    itinerary = 0;
    currentRun = 0;
    numDies = 0;
    this.newRun();
    this.saveDies();
  },

  addDie() {
    numDies += 1;
    this.saveDies();
  },

  getDies() {
    return numDies;
  },

  saveDies() {
    this.setItem('numDies', numDies);
  },

  setSoundVolume(v) {
    this.soundVolume = v;
    this.setItem('soundVolume', v);
  },

  setMusicVolume(v) {
    this.musicVolume = v;
    this.setItem('musicVolume', v);
  },

  toggleForRecording() {
    const settings = cc.find('Canvas/settings');
    if (settings) {
      let v = settings.opacity;
      if (!v) v = 255;
      else v = 0;
      settings.opacity = v;
      cc.find('Canvas/label').opacity = v;
      cc.find('Canvas/tips').opacity = v;
      if (!v) {
        const anim = cc.find('Canvas').getComponent(cc.Animation);
        if (anim.enabled) {
          setTimeout(anim.pause.bind(anim), 100);
          setTimeout(anim.play.bind(anim), 5000);
        }
      }
      return;
    }
    const top = cc.find('Canvas/top');
    let v = top.opacity;
    if (!v) v = 255;
    else v = 0;
    top.opacity = v;
    cc.find('Canvas/bottom').opacity = v;
    cc.find('Canvas/menu/bottom').opacity = v;
    cc.find('Canvas/pause').opacity = v;
    cc.find('Canvas/tip').opacity = v;
    cc.find('Canvas/guesture-tip').opacity = v;
    cc.find('Canvas/menu/itinerary').getChildren().forEach(n => (n.opacity = v));
  },

  onSceneLoad(s) {
    cc.game.setFrameRate(effectOn ? 60 : 30);
    if (typeof location === 'object' &&
      location.href && location.href.indexOf('record') > 0) game.toggleForRecording();
    this.scene = s;
    s.audios.forEach((a) => {
      const tmp = a.play;
      a.play = () => {
        try {
          tmp.apply(a);
        } catch (e) {
          //
        }
      };
    });
  },

  getSound(name) {
    const audios = cc.find('Canvas').getComponents(cc.AudioSource);
    return audios.filter(a => a.clip.indexOf(name) >= 0)[0] || {
      play() {},
    };
  },

  play(name) {
    game.getSound(name).play();
  },

  wxReady() {
    return typeof wx === 'object' && wx.defaultShareData;
  },

  showToast(text, time) {
    return cc.instantiate(this.scene.toastPrefab).getComponent('Toast').show(text, time);
  },

  connect(name, event) {
    // we are using sockjs on server side, so need to append websocket to access
    // with native websocket, if we use sockjs client,
    // we can should use url without websocket appended
    if (this.ws) this.ws.close();
    let wss = 'ws';
    let host;
    if (typeof location === 'undefined') {
      host = cc.sys.LANGUAGE_CHINESE === 'zh' ? 'cn.newshbb.com' : 'gw.newshbb.com';
    } else {
      if (location.href.startsWith('https:')) wss += 's';
      host = location.host;
      if (host.startsWith('localhost')) host = 'gw.newshbb.com';
    }
    const ws = new WebSocket(wss + '://' + host + '/ws/websocket');
    ws.onopen = () => {
      ws.send(JSON.stringify({ event, name }));
    };
    ws.onmessage = (evt) => {
      console.log('response text msg: ', evt);
      const data = JSON.parse(evt.data);
      if (data.created) {
        if (this.toastShown) this.toastShown.close();
        game.isMaster = true;
        game.useT = true;
        this.loadScene('level');
      }
      const p2 = this.scene.player2;
      if (game.isMaster) {
        if (data.joined) {
          if (p2) {
            const p = this.scene.player.node;
            p2.node.active = true;
            p2.node.x = p.x - 100;
            p2.node.y = p.y + 100;
            p2.node.rotation = p.rotation;
            ws.send(JSON.stringify({
              x: parseInt(p.x, 10),
              y: parseInt(p.y, 10),
              r: parseInt(p.rotation, 10),
              paused: this.scene.stopped ? 1 : 0,
            }));
            if (this.toastShown) {
              this.toastShown.close();
              this.scene.pause();
            }
          }
        } else if (data.unjoined) {
          if (p2) p2.node.active = false;
        } else if (p2) {
          this.scene.updatePlayer2(data);
        }
      } else if (data.joined || data.restart) {
        if (this.toastShown) this.toastShown.close();
        game.isSlave = true;
        game.useT = true;
        this.loadScene('level');
      } else if (p2) {
        if (!p2.node.active) p2.node.active = true;
        this.scene.updatePlayer2(data);
      }
      if (data.join === 'unexisted') {
        this.showToast('roomUnexisted', 5000);
      }
      if (data.create === 'occupied') {
        this.showToast('nameUsed', 5000);
      }
      if (data.join === 'occupied') {
        this.showToast('roomOccupied', 5000);
      }
    };
    ws.onerror = (evt) => {
      console.log('Send Text fired an error', evt);
      this.showToast('connfailed', 5000);
      if (this.ws === ws) delete this.ws;
    };
    ws.onclose = (evt) => {
      console.log('WebSocket instance closed.', evt);
      if (this.ws === ws) delete this.ws;
      if (this.scene.player) {
        this.loadScene('home');
        setTimeout(() => this.showToast('connClosed', 3000), 500);
      }
    };
    this.ws = ws;
  },

  send(d) {
    if (this.ws) this.ws.send(JSON.stringify(d));
  },
};

game.load();
if (typeof window !== 'undefined') {
  window.game = game;
}

module.exports = game;
