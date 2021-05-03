let lang = cc.sys.language;
if (cc.sys.LANGUAGE_CHINESE !== 'zh') console.error('bad zh');
if (cc.sys.LANGUAGE_ENGLISH !== 'en') console.error('bad en');
if (cc.sys.LANGUAGE_JAPANESE !== 'ja') console.error('bad ja');

cc.Class({
  extends: cc.Component,

  properties: {
    id: {
      default: '',
    },
  },

  onLoad() {
    const id = this.id || this.node.name;
    const l = this.node.getComponent(cc.Label);
    const v = getString(id);
    if (v !== id) {
      if (l) l.string = v;
      const e = this.node.getComponent(cc.EditBox);
      if (e) e.placeholder = v;
    }
  },
});

const langs = {
  swipe2shoot: {
    zh: '滑屏射击',
    ja: '矢を撃つためにスワイプ',
  },
  tap2jump: {
    zh: '轻戳跳跃',
    ja: 'ジャンプするタップ',
  },
  tap2continue: {
    zh: '轻戳继续',
    ja: '続けるにはタップ',
  },
  homeScene: {
    zh: '首页',
    ja: '家',
  },
  continue: {
    zh: '继续',
    ja: '続けます',
  },
  resume: {
    zh: '恢复',
    ja: '回復',
  },
  restart: {
    zh: '重来',
    ja: '再び',
  },
  tap2start: {
    zh: '轻戳开始',
    ja: 'タップして開始',
  },
  music: {
    zh: '音乐',
    ja: '音楽',
  },
  settings: {
    zh: '设置',
    ja: '設定',
  },
  sound: {
    zh: '声效',
    ja: '効果音',
  },
  back: {
    zh: '返回',
    ja: 'リターン',
  },
  homeTip0: {
    zh: '诺，我是一名守卫汉长城烽燧的士兵！',
    ja: 'こんにちは，私は中国の万里の長城ビーコンタワーを守る兵士です',
  },
  homeTip1: {
    zh: '匈奴人来了，快！骑上马去通知战友！',
    ja: 'フン族が来ました，迅速同志を知らせるために乗りました！',
  },
  'Mind the fire': {
    zh: '小心火焰',
    ja: '火事注意する',
  },
  'Mind the wood': {
    zh: '小心木头',
    ja: '木に注意する',
  },
  'Mind the cliff': {
    zh: '小心悬崖',
    ja: '崖に注意する',
  },
  'Mind the arrow': {
    zh: '小心箭',
    ja: '矢印に注意する',
  },
  'Mind the enemy approaching you': {
    zh: '小心敌人接近你',
    ja: 'あなたに近い敵に注意してください',
  },
  countdown1: {
    zh: '一',
  },
  countdown2: {
    zh: '二',
  },
  countdown3: {
    zh: '三',
  },
  countdowngo: {
    zh: '走',
  },
  changan: {
    zh: '長安',
    ja: '長安',
  },
  beijing: {
    zh: '北京',
    ja: '北京',
  },
  river: {
    zh: '黃河',
    ja: '黄河',
  },
  yumenguan: {
    zh: '玉門關',
    ja: '玉門関',
  },
  jiayuguan: {
    zh: '嘉峪關',
    ja: '嘉峪関',
  },
  road: {
    zh: '丝绸之路',
    ja: 'シルクロード',
  },
  juyongguan: {
    zh: '居庸關',
  },
  yanmenguan: {
    zh: '雁門關',
  },
  shanhaiguan: {
    zh: '山海關',
    ja: '山海関',
  },
  wuwei: {
    zh: '武威',
    ja: '武威市',
  },
  lanzhou: {
    zh: '兰州',
    ja: '蘭州',
  },
  dunhuang: {
    zh: '敦煌',
    ja: '敦煌',
  },
  datong: {
    zh: '大同',
    ja: '大同',
  },
  taiyuan: {
    zh: '太原',
  },
  yulin: {
    zh: '榆林',
  },
  yinchuan: {
    zh: '银川',
    ja: '銀川',
  },
  hushan: {
    zh: '虎山',
  },
  liaodong: {
    zh: '辽东',
  },
  no: {
    zh: '否',
    ja: 'いいえ',
  },
  yes: {
    zh: '是',
    ja: 'はい',
  },
  Exit: {
    zh: '退出',
    ja: 'エグジット',
  },
  exitText: {
    en: 'Are you sure you want to exit Great Wall Run?',
    zh: '你确定要退出”長城Run“吗?',
    ja: 'あなたは”長城Run“を出ると確信していますか？',
  },
  powerSave: {
    zh: '省电模式',
    ja: '省電力モード',
  },
  on: {
    zh: '开',
    ja: 'オン',
  },
  off: {
    zh: '关',
    ja: 'オフ',
  },
  'Loading...': {
    zh: '加载...',
    ja: '読み込み中...',
  },
  'Something wrong, please try later': {
    zh: '发生错误，请稍后再试',
    ja: 'エラーが発生し、後でもう一度試してみてください',
  },
  'Processing...': {
    zh: '处理中...',
    ja: '処理...',
  },
  singleRecord: {
    zh: '单程记录: ',
    ja: 'シングル乗りレコード: ',
  },
  gwr: {
    zh: '长城Run',
    ja: '長城Run',
  },
  getApp: {
    zh: '下载APP',
  },
  '2players': {
    zh: '双人模式',
  },
  roomDialogTitle: {
    zh: '进入双人模式',
  },
  roomEditBox: {
    zh: '输入一个唯一的房间名称',
  },
  cancel: {
    zh: '取消',
  },
  create: {
    zh: '创建',
  },
  join: {
    zh: '加入',
  },
  pleaseInputName: {
    en: 'Please input the room name',
    zh: '请输入房间名字',
  },
  nameUsed: {
    en: 'The room name you entered has already been used',
    zh: '你输入的房间名称已被使用',
  },
  connecting: {
    en: 'Connecting...',
    zh: '连接中...',
  },
  connfailed: {
    en: 'Failed to connect, please try later',
    zh: '连接错误，请稍后再试',
  },
  roomOccupied: {
    en: 'The room has already been occupied',
    zh: '房间已被占用',
  },
  roomUnexisted: {
    en: 'The room has not been created yet',
    zh: '房间尚未创建',
  },
  connClosed: {
    en: 'Connection closed',
    zh: '连接关闭',
  },
  waitForMate: {
    zh: '等待同伴加入...',
    en: 'Waiting for your mate',
  },
};

export function setLang(v) {
  if (v) lang = v;
}

export function getString(id) {
  const v = langs[id];
  return v && (v[lang] || v.en) || id;
}
