import {playMode} from '@common/js/config';
import {loadSearch, loadPlay, loadFavorite} from '@common/js/cache';

const state = {
  singer: {}, // 歌手数据
  playing: false, // 播放
  fullScreen: false, // 全屏
  playlist: [], // 播放列表
  sequenceList: [], // 顺序列表
  mode: playMode.sequence, // 播放模式
  currentIndex: -1, // 当前播放歌曲的索引
  disc: {}, // 歌单对象
  topList: {}, // 排行榜列表
  searchHistory: loadSearch(), // 搜索历史列表,初始值从本地存储中获取
  playHistory: loadPlay(), // 播放历史列表
  favoriteList: loadFavorite() // 收藏列表
};

export default state;
