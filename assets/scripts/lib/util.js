/* eslint no-prototype-builtins: 0 */
/* eslint no-restricted-syntax: 0 */
/* eslint prefer-const: 0 */
/* eslint no-underscore-dangle: 0 */
/* eslint no-extend-native: 0 */
/* eslint func-names: 0 */
/* global XMLHttpRequest */
/* global window */

import Promise from './promise';

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}
if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (suffix) {
    return this.indexOf(suffix) === 0;
  };
}

function getDate(t) {
  if (typeof t === 'object') {
    if (t.iso) return new Date(t.iso);
    if (t.getYear) return t;
  }
  if (typeof t === 'string') return new Date(t);
  return '';
}

export function diffTime(t, now) {
  if (!now) now = new Date();
  t = getDate(t);
  if (!t) return '';
  let diff = Math.floor((now.getTime() - t.getTime()) / 1000);
  let unit = '秒';
  if (diff / 60 < 1) {
    return '刚刚'; // diff + unit;
  }
  diff /= 60;
  unit = '分钟前';
  if (diff / 60 < 1) {
    return Math.floor(diff) + unit;
  }
  diff /= 60;
  unit = '小时前';
  if (diff / 24 < 1) {
    return Math.floor(diff) + unit;
  }
  diff /= 24;
  unit = '天前';
  if (diff / 30 < 1) {
    return Math.floor(diff) + unit;
  }
  diff /= 30;
  unit = '月前';
  if (diff / 12 < 1) {
    return Math.floor(diff) + unit;
  }
  diff /= 12;
  unit = '年前';
  return Math.floor(diff) + unit;
}

export function strftime(t, fmt) {
  t = getDate(t);
  if (!t) return '';
  if (t.strftime) return t.strftime(fmt);
  const o = {
    'M+': t.getMonth() + 1, // 月份
    'd+': t.getDate(), // 日
    'h+': t.getHours(), // 小时
    'm+': t.getMinutes(), // 分
    's+': t.getSeconds(), // 秒
    'q+': Math.floor((t.getMonth() + 3) / 3), // 季度
    S: t.getMilliseconds(), // 毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1,
      (t.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
  }
  return fmt;
}

export function tail(d) {
  if (!d) return null;
  return d[d.length - 1];
}

export function getTimeStr(t) {
  t = getDate(t);
  if (!t) return '';
  const now = new Date();
  if (t.getYear() !== now.getYear()) {
    return strftime(t, 'yyyy年M月d日');
  }

  if (t.getMonth() === now.getMonth()) {
    const d = now.getDate() - t.getDate();
    if (d === 0) return strftime(t, 'hh:mm');
    if (d === 1) return strftime(t, '昨天 hh:mm');
    if (d === 2) return strftime(t, '前天 hh:mm');
  }

  return strftime(t, 'M月d日');
}

export function throttle(callback, delay, debounceMode) {
  let timeoutID;
  let lastExec = 0;

  function wrapper(...args) {
    const self = this;
    const elapsed = new Date().getTime() - lastExec;

    function exec() {
      lastExec = new Date().getTime();
      callback.apply(self, args);
    }

    if (timeoutID) {
      clearTimeout(timeoutID);
    }

    if (elapsed >= delay) {
      exec();
    } else {
      timeoutID = setTimeout(exec, debounceMode ? delay : delay - elapsed);
    }
  }

  return wrapper;
}

export function debounce(callback, delay) {
  return throttle(callback, delay, true);
}

export function size(value) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object') return Object.keys(value).length;
  return 0;
}

export function isEmpty(value) {
  if (Array.isArray(value)) return !value.length;
  if (typeof value === 'object') return !Object.keys(value).length;
  return !value;
}

export function forEach(value, func) {
  if (Array.isArray(value)) {
    value.forEach(func);
  } else if (typeof value === 'object') {
    for (let key in value) {
      if (value.hasOwnProperty(key)) {
        func(value[key], key, value);
      }
    }
  }
}

export function map(value, func) {
  if (Array.isArray(value)) {
    return value.map(func);
  }
  if (typeof value === 'object') {
    const out = [];
    forEach(value, (v, k) => out.push(func ? func(v, k) : v));
    return out;
  }
  return [];
}

export function clone(object) {
  return JSON.parse(JSON.stringify(object));
}

export function copy(dest, src) {
  forEach(src, (v, k) => (dest[k] = v));
  return dest;
}

function once(func) {
  return () => {
    if (func) {
      func();
      func = undefined;
    }
  };
}

export const _ = {
  copy,
  forEach,
  map,
  size,
  isEmpty,
  throttle,
  debounce,
  clone,
  once,
  length,
};

export function parseJson(data) {
  try {
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

export const storage = {
  getItem(key) {
    return new Promise((resolve) => {
      const value = cc.sys.localStorage.getItem(JSON.stringify(key));
      if (!value) {
        resolve(undefined);
        return;
      }
      resolve(parseJson(value));
    });
  },

  setItem(key, data) {
    return new Promise((resolve) => {
      cc.sys.localStorage.setItem(JSON.stringify(key), JSON.stringify(data));
      resolve();
    });
  },
};

function waitFor_(func, resolve, reject, timeout) {
  if (func()) {
    resolve();
    return;
  }
  if (timeout < 0) {
    reject();
    return;
  }
  const step = 300;
  setTimeout(() => {
    waitFor_(func, resolve, reject, timeout - step);
  }, step);
}

export function waitFor(func, timeout) {
  return new Promise((resolve, reject) => waitFor_(func, resolve, reject, timeout));
}

export function replaceValue(obj, v1, v2) {
  _.forEach(obj, (v, k) => {
    if (v === v1) obj[k] = v2;
    else replaceValue(v, v1, v2);
  });
}

function Deg2Rad(deg) {
  return deg * Math.PI / 180;
}

export function distance(lat1, lon1, lat2, lon2) {
  lat1 = Deg2Rad(lat1);
  lat2 = Deg2Rad(lat2);
  lon1 = Deg2Rad(lon1);
  lon2 = Deg2Rad(lon2);
  const R = 6371; // km
  const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
  const y = (lat2 - lat1);
  const d = Math.sqrt(x * x + y * y) * R;
  return d;
}

export function length(a, b) {
  if (typeof a.x === 'undefined') {
    return Math.sqrt(
    (a[0] - b[0]) * (a[0] - b[0]) +
    (a[1] - b[1]) * (a[1] - b[1]));
  }
  return Math.sqrt(
    (a.x - b.x) * (a.x - b.x) +
    (a.y - b.y) * (a.y - b.y));
}

export function request(args) {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      const res = {};
      res.data = parseJson(xhr.responseText);
      res.statusCode = xhr.status;
      if (typeof args.success === 'function') args.success(res);
    }
  };
  xhr.open(args.method, args.url, true);
  if (args.method === 'POST' || args.method === 'PUT') {
    xhr.setRequestHeader('Content-Type', 'application/json');
  }
  xhr.send(JSON.stringify(args.data));
}

export function getParameterByName(name) {
  if (typeof window === 'undefined' || !window.location) return '';
  const url = window.location.href;
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
