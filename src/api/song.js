import {commonParams} from './config';
import axios from 'axios';

export function getLyric (mid) {
  const url = '/api/lyric';
  const data = Object.assign({}, commonParams, {
    songmid: mid,
    pcachetime: +new Date(),
    platform: 'yqq',
    hostUin: 0,
    needNewCode: 0,
    g_tk: 5381,
    format: 'json'
  });

  return axios.get(url, {
    params: data
  }).then((res) => {
    return Promise.resolve(res.data);
  });
}

// 获取歌曲播放的vkey
export function getSongURLVkey (mid) {
  const url = '/api/getSongVkey';
  const data = Object.assign({}, commonParams, {
    g_tk: 5381,
    hostUin: 0,
    loginUin: 0,
    format: 'json',
    notice: 0,
    platform: 'yqq',
    needNewCode: 0,
    cid: 205361747,
    guid: 8974487358,
    uin: 0,
    songmid: mid,
    filename: 'C400' + mid + '.m4a'
  });

  return axios.get(url, {
    params: data
  }).then((res) => {
    return Promise.resolve(res.data);
  });
}
