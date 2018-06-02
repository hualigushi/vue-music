<template>
  <div class="player" v-show="playlist.length>0">
    <transition name="normal"
                @enter="enter"
                @after-enter="afterEnter"
                @leave="leave"
                @after-leave="afterLeave"
    >
      <div class="normal-player" v-show="fullScreen">
      <div class="background">
        <img width="100%" height="100%" :src="currentSong.image">
      </div>
      <div class="top">
        <div class="back" @click="back">
          <i class="icon-back"></i>
        </div>
        <h1 class="title" v-html="currentSong.name"></h1>
        <h2 class="subtitle" v-html="currentSong.singer"></h2>
      </div>
      <div class="middle" @touchstart.prevent="middleTouchStart"
                          @touchmove.prevent="middleTouchMove"
                          @touchend="middleTouchEnd">
        <div class="middle-l" ref="middleL">
          <div class="cd-wrapper" ref="cdWrapper">
            <div class="cd" :class="cdCls">
              <img class="image" :src="currentSong.image">
            </div>
          </div>
          <div class="playing-lyric-wrapper">
            <div class="playing-lyric">{{playingLyric}}</div>
          </div>
        </div>
        <scroll class="middle-r" ref="lyricList" :data="currentLyric && currentLyric.lines">
          <div class="lyric-wrapper">
            <div v-if="currentLyric">
              <p ref="lyricLine"
                 class="text"
                 :class="{'current':currentLineNum === index}"
                 v-for="(line, index) in currentLyric.lines" :key="index">{{line.txt}}</p>
            </div>
          </div>
        </scroll>
      </div>
      <div class="bottom">
        <div class="dot-wrapper">
          <span class="dot" :class="{'active':currentShow==='cd'}"></span>
          <span class="dot" :class="{'active':currentShow==='lyric'}"></span>
        </div>
        <div class="progress-wrapper">
          <span class="time time-l">{{format(currentTime)}}</span>
          <div class="progress-bar-wrapper">
            <progress-bar :percent="percent" @percentChange="onProgressBarChange"></progress-bar>
          </div>
          <span class="time time-r">{{format(currentSong.duration)}}</span>
        </div>
        <div class="operators">
          <div class="icon i-left" @click="changeMode">
            <i :class="iconMode"></i>
          </div>
          <div class="icon i-left" :class="disableCls">
            <i @click="prev" class="icon-prev" ></i>
          </div>
          <div class="icon i-center" :class="disableCls">
            <i @click="togglePlaying" :class="playIcon"></i>
          </div>
          <div class="icon i-right" :class="disableCls">
            <i @click="next" class="icon-next"></i>
          </div>
          <div class="icon i-right">
            <i class="icon" @click="toggleFavorite(currentSong)" :class="getFavoriteIcon(currentSong)"></i>
          </div>
        </div>
      </div>
    </div>
    </transition>
    <transition name="mini">
      <div class="mini-player" v-show="!fullScreen" @click="open">
      <div class="icon">
        <img :class="cdCls" width="40" height="40" :src="currentSong.image">
      </div>
      <div class="text">
        <h2 class="name" v-html="currentSong.name"></h2>
        <p class="desc" v-html="currentSong.singer"></p>
      </div>
      <div class="control">
        <progress-circle :radius="radius" :percent="percent">
          <i @click.stop="togglePlaying" class="icon-mini" :class="miniIcon"></i>
        </progress-circle>
      </div>
      <div class="control" @click.stop="showPlayList">
        <i class="icon-playlist"></i>
      </div>
    </div>
    </transition>
    <playlist ref="playlist"></playlist>
    <!--canplay audio官方定义事件 ，当歌曲从加载到播放的时候派发
        error 歌曲发生错误，请求不到地址
        timeupdate 歌曲播放时间 -->
    <audio ref="audio" :src="songurl" @play="ready"
           @error="error" @timeupdate="updateTime"
           @ended="end"></audio>
  </div>
</template>
<script type="text/ecmascript-6">
import {mapGetters, mapMutations, mapActions} from 'vuex';
import animations from 'create-keyframe-animation';
import {prefixStyle} from '@common/js/dom.js';
import ProgressBar from '@base/progress-bar/progress-bar';
import ProgressCircle from '@base/progress-circle/progress-circle';
import Lyric from 'lyric-parser';
import Scroll from '@base/scroll/scroll';
import Playlist from '@/components/playlist/playlist';
import {playerMixin} from '@common/js/mixin.js';
import {playMode} from '@common/js/config.js';

const transform = prefixStyle('transform');
const transitionDuration = prefixStyle('transitionDuration');

export default {
  mixins: [playerMixin],
  data () {
    return {
      songReady: false, // 标志位，歌曲ready的时候才能点击下一首，阻止快速点击歌曲,从而导致dom出现异常
      currentTime: 0, // 当前播放时间
      radius: 32,
      currentLyric: null, // 当前歌词
      currentLineNum: 0, // 当前歌词所在行号
      songurl: '',
      currentShow: 'cd', // 当前播放页面（歌词，图片）
      playingLyric: '' // 当前播放的歌词
    };
  },
  computed: {
    cdCls () { // 图片旋转
      return this.playing ? 'play' : 'play pause';
    },
    playIcon () { // 播放按钮样式显示
      return this.playing ? 'icon-pause' : 'icon-play';
    },
    miniIcon () {
      return this.playing ? 'icon-pause-mini' : 'icon-play-mini';
    },
    disableCls () { // 前进后退置灰
      return this.songReady ? '' : 'disabled';
    },
    // 歌曲播放的比例
    percent () {
      return this.currentTime / this.currentSong.duration;
    },
    ...mapGetters([
      'currentIndex',
      'fullScreen',
      'playing'
    ])
  },
  created () {
    this.touch = {

    };
  },
  methods: {
    back () {
      this.setFullScreen(false);
    },
    open () {
      this.setFullScreen(true);
    },
    enter (el, done) {
      const {x, y, scale} = this._getPosAndScale();
      let animation = {
        0: {
          transform: `translate3d(${x}px,${y}px,0) scale(${scale})`
        },
        60: {
          transform: `translate3d(0,0,0) scale(1.1)`
        },
        100: {
          transform: `translate3d(0,0,0) scale(1)`
        }
      };
      // 注册
      animations.registerAnimation({
        name: 'move',
        animation,
        presets: {
          duration: 400,
          easing: 'linear'
        }
      });
      // 运行
      animations.runAnimation(this.$refs.cdWrapper, 'move', done); // done为回调函数
    },
    afterEnter () {
      animations.unregisterAnimation('move');
      this.$refs.cdWrapper.style.animation = '';
    },
    leave (el, done) {
      this.$refs.cdWrapper.style.transition = 'all 0.4s';
      const {x, y, scale} = this._getPosAndScale();
      this.$refs.cdWrapper.style[transform] = `translate3d(${x}px,${y}px,0) scale(${scale})`;
      this.$refs.cdWrapper.addEventListener('transitionend', done);
    },
    afterLeave () {
      this.$refs.cdWrapper.style.transition = '';
      this.$refs.cdWrapper.style[transform] = '';
    },
    togglePlaying () {
      if (!this.songReady) {
        return;
      }
      this.setPlayingState(!this.playing);
      if (this.currentLyric) { // 暂停时，停止歌词
        this.currentLyric.togglePlay();
      }
    },
    // 歌曲播放结束时自动播放下一首法
    end () {
      // 首先判断是否是单曲循环
      if (this.mode === playMode.loop) {
        this.loop();
      } else {
        this.next();
      }
    },
    loop () {
      this.$refs.audio.currentTime = 0;
      this.$refs.audio.play();
      if (this.currentLyric) { // 单曲循环时，歌曲播放结束，重新设置歌词开始
        this.currentLyric.seek(0);
      }
    },
    next () { // 前进
      if (!this.songReady) { // 如果歌曲没有加载完成，则直接返回
        return;
      }
      if (this.playlist.length === 1) { // 处理边界情况，列表只有一条数据
        this.loop(); // 单曲循环
        return;
      } else {
        let index = this.currentIndex + 1;
        if (index === this.playlist.length) { // 到最后一首歌的时候
          index = 0;
        }
        this.setCurrentIndex(index);
        if (!this.playing) { // 如果当前歌曲暂停
          this.togglePlaying(); // 改变歌曲播放状态
        }
      }
      this.songReady = false;
    },
    prev () { // 后退
      if (!this.songReady) {
        return;
      }
      if (this.playlist.length === 1) { // 处理边界情况，列表只有一条数据
        this.loop(); // 单曲循环
        return;
      } else {
        let index = this.currentIndex - 1;
        if (index === -1) {
          index = this.playlist.length - 1;
        }
        this.setCurrentIndex(index);
        if (!this.playing) { // 如果当前歌曲暂停
          this.togglePlaying(); // 改变歌曲播放状态
        }
      }
      this.songReady = false;
    },
    ready () {
      this.songReady = true;
      this.savePlayHistory(this.currentSong); // 将播放的歌曲写入到最近播放列表中
    },
    error () {
      // 没有网络或者下一首歌曲不存在
      this.songReady = true;
    },
    updateTime (e) {
      // currentTime audio标签的属性,设置或返回音频中的当前播放位置（以秒计）
      this.currentTime = e.target.currentTime;
    },
    format (interval) {
      interval = interval | 0; // 正数向下取整，相当于Math.floor
      const minute = interval / 60 | 0;
      const second = this._pad(interval % 60);
      return `${minute}:${second}`;
    },
    onProgressBarChange (percent) {
      const currentTime = this.currentSong.duration * percent;
      this.$refs.audio.currentTime = currentTime;
      if (!this.playing) { // 拖动的时候处于暂停状态则进行播放
        this.togglePlaying();
      }
      if (this.currentLyric) { // 拖动进度条时，歌词相应改变
        this.currentLyric.seek(currentTime * 1000);
      }
    },
    // 获取歌词的请求
    getLyric () {
      this.currentSong.getLyric().then((lyric) => {
        // 防止快速点击时 ，回调延时
        if (this.currentSong.lyric !== lyric) {
          return;
        }
        this.currentLyric = new Lyric(lyric, this.handleLyric);
        if (this.playing) { // 如果当前歌曲正在播放，就播放歌词
          this.currentLyric.play();
        }
      }).catch(() => { // 发生错误时，清理
        this.currentLyric = null;
        this.playingLyric = '';
        this.currentLineNum = 0;
      });
    },
    // 获取完整歌曲播放链接
    getSongUrl () {
      this.currentSong.getSongURLVkey().then((songurl) => {
        this.songurl = songurl;
      });
    },
    // 歌词每一行发生改变时回调
    handleLyric ({lineNum, txt}) {
      this.currentLineNum = lineNum;
      if (lineNum > 5) { // 保持当前歌词在中间
        let lineEl = this.$refs.lyricLine[lineNum - 5];
        this.$refs.lyricList.scrollToElement(lineEl, 1000);
      } else {
        this.$refs.lyricList.scrollTo(0, 0, 1000);
      }
      this.playingLyric = txt;
    },
    // 显示播放列表
    showPlayList () {
      this.$refs.playlist.show();
    },
    middleTouchStart (e) {
      this.touch.initiated = true; // 标志位,标志已经初始化过
      const touches = e.touches[0];
      this.touch.startX = touches.pageX;
      this.touch.startY = touches.pageY;
    },
    middleTouchMove (e) {
      if (!this.touch.initiated) {
        return;
      }
      const touches = e.touches[0];
      const deltaX = touches.pageX - this.touch.startX;
      const deltaY = touches.pageY - this.touch.startY;
      // 歌词是上下滚动的，当纵轴的偏移大于横轴的偏移，就不应该左右移动
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }
      const left = this.currentShow === 'cd' ? 0 : -window.innerWidth;
      const offsetWidth = Math.min(0, Math.max(-window.innerWidth, left + deltaX));
      this.touch.percent = Math.abs(offsetWidth / window.innerWidth); // 滑动的比例
      this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`;
      this.$refs.lyricList.$el.style[transitionDuration] = 0;
      this.$refs.middleL.style.opacity = 1 - this.touch.percent;
      this.$refs.middleL.style[transitionDuration] = 0;
      },
    middleTouchEnd (e) {
      let offsetWidth;
      let opacity;
      if (this.currentShow === 'cd') { // 从右向左滑
        if (this.touch.percent > 0.1) { // 滑动的位置超过10%
          offsetWidth = -window.innerWidth;
          opacity = 0;
          this.currentShow = 'lyric';
        } else {
          offsetWidth = 0;
          opacity = 1;
        }
      } else { // 从左向右滑
          if (this.touch.percent < 0.9) {
            offsetWidth = 0;
            this.currentShow = 'cd';
            opacity = 1;
          } else {
            offsetWidth = -window.innerWidth;
            opacity = 0;
          }
      }
      const time = 300;
      this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`;
      this.$refs.lyricList.$el.style[transitionDuration] = `${time}ms`;
      this.$refs.middleL.style.opcity = opacity;
      this.$refs.middleL.style[transitionDuration] = `${time}ms`;
      },
    // 补零
    _pad(num, n = 2) {
      let len = num.toString().length;
      while (len < n) {
        num = '0' + num;
        len++;
      }
      return num;
    },
    _getPosAndScale () {
      const targetWidth = 40;
      const paddingLeft = 40;
      const paddingBottom = 30;
      const paddingTop = 80;
      const width = window.innerWidth * 0.8;
      const scale = targetWidth / width;
      const x = -(window.innerWidth / 2 - paddingLeft);
      const y = window.innerHeight - paddingTop - width / 2 - paddingBottom;
      return {
        x,
        y,
        scale
      };
    },
    ...mapMutations({
      setFullScreen: 'SET_FULL_SCREEN'
    }),
    ...mapActions([
      'savePlayHistory'
    ])
  },
  watch: {
    currentSong (newSong, oldSong) {
      if (!newSong.id) {
        return;
      }
      if (newSong.id === oldSong.id) { // 解决暂停状态下，切换播放模式，歌曲会自动播放问题
        return;
      }
      if (this.currentLyric) {
        this.currentLyric.stop();
        // 如果没有歌词就清理
        this.currentTime = 0;
        this.playingLyric = '';
        this.currentLineNum = 0;
      }

      this.getSongUrl();

      // 防止快速点击
      clearTimeout(this.timer);

      // 手机端微信后台切到前台，保证播放器正常播放
      this.timer = setTimeout(() => {
        this.$refs.audio.play();
        this.getLyric();
      }, 1000);
    },
    playing (newPlaying) {
      const audio = this.$refs.audio;
      this.$nextTick(() => {
        newPlaying ? audio.play() : audio.pause();
      });
    }
  },
  components: {
    ProgressBar,
    ProgressCircle,
    Scroll,
    Playlist
  }
};
</script>
<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "../../common/stylus/variable"
  @import "../../common/stylus/mixin"

  .player
    .normal-player
      position: fixed
      left: 0
      right: 0
      top: 0
      bottom: 0
      z-index: 150
      background: $color-background
      .background
        position: absolute
        left: 0
        top: 0
        width: 100%
        height: 100%
        z-index: -1
        opacity: 0.6
        filter: blur(20px)
      .top
        position: relative
        margin-bottom: 25px
        .back
          position absolute
          top: 0
          left: 6px
          z-index: 50
          .icon-back
            display: block
            padding: 9px
            font-size: $font-size-large-x
            color: $color-theme
            transform: rotate(-90deg)
        .title
          width: 70%
          margin: 0 auto
          line-height: 40px
          text-align: center
          no-wrap()
          font-size: $font-size-large
          color: $color-text
        .subtitle
          line-height: 20px
          text-align: center
          font-size: $font-size-medium
          color: $color-text
      .middle
        position: fixed
        width: 100%
        top: 80px
        bottom: 170px
        white-space: nowrap
        font-size: 0
        .middle-l
          display: inline-block
          vertical-align: top
          position: relative
          width: 100%
          height: 0
          padding-top: 80%
          .cd-wrapper
            position: absolute
            left: 10%
            top: 0
            width: 80%
            height: 100%
            .cd
              width: 100%
              height: 100%
              box-sizing: border-box
              border: 10px solid rgba(255, 255, 255, 0.1)
              border-radius: 50%
              &.play
                animation: rotate 20s linear infinite
              &.pause
                animation-play-state: paused
              .image
                position: absolute
                left: 0
                top: 0
                width: 100%
                height: 100%
                border-radius: 50%

          .playing-lyric-wrapper
            width: 80%
            margin: 30px auto 0 auto
            overflow: hidden
            text-align: center
            .playing-lyric
              height: 20px
              line-height: 20px
              font-size: $font-size-medium
              color: $color-text-l
        .middle-r
          display: inline-block
          vertical-align: top
          width: 100%
          height: 100%
          overflow: hidden
          .lyric-wrapper
            width: 80%
            margin: 0 auto
            overflow: hidden
            text-align: center
            .text
              line-height: 32px
              color: $color-text-l
              font-size: $font-size-medium
              &.current
                color: $color-text
      .bottom
        position: absolute
        bottom: 50px
        width: 100%
        .dot-wrapper
          text-align: center
          font-size: 0
          .dot
            display: inline-block
            vertical-align: middle
            margin: 0 4px
            width: 8px
            height: 8px
            border-radius: 50%
            background: $color-text-l
            &.active
              width: 20px
              border-radius: 5px
              background: $color-text-ll
        .progress-wrapper
          display: flex
          align-items: center
          width: 80%
          margin: 0px auto
          padding: 10px 0
          .time
            color: $color-text
            font-size: $font-size-small
            flex: 0 0 30px
            line-height: 30px
            width: 30px
            &.time-l
              text-align: left
            &.time-r
              text-align: right
          .progress-bar-wrapper
            flex: 1
        .operators
          display: flex
          align-items: center
          .icon
            flex: 1
            color: $color-theme
            &.disable
              color: $color-theme-d
            i
              font-size: 30px
          .i-left
            text-align: right
          .i-center
            padding: 0 20px
            text-align: center
            i
              font-size: 40px
          .i-right
            text-align: left
          .icon-favorite
            color: $color-sub-theme
      &.normal-enter-active, &.normal-leave-active
        transition: all 0.4s
        .top, .bottom
          transition: all 0.4s cubic-bezier(0.86, 0.18, 0.82, 1.32)
      &.normal-enter, &.normal-leave-to
        opacity: 0
        .top
          transform: translate3d(0, -100px, 0)
        .bottom
          transform: translate3d(0, 100px, 0)
    .mini-player
      display: flex
      align-items: center
      position: fixed
      left: 0
      bottom: 0
      z-index: 180
      width: 100%
      height: 60px
      background: $color-highlight-background
      &.mini-enter-active, &.mini-leave-active
        transition: all 0.4s
      &.mini-enter, &.mini-leave-to
        opacity: 0
      .icon
        flex: 0 0 40px
        width: 40px
        padding: 0 10px 0 20px
        img
          border-radius: 50%
          &.play
            animation: rotate 10s linear infinite
          &.pause
            animation-play-state: paused
      .text
        display: flex
        flex-direction: column
        justify-content: center
        flex: 1
        line-height: 20px
        overflow: hidden
        .name
          margin-bottom: 2px
          no-wrap()
          font-size: $font-size-medium
          color: $color-text
        .desc
          no-wrap()
          font-size: $font-size-small
          color: $color-text-d
      .control
        flex: 0 0 30px
        width: 30px
        padding: 0 10px
        .icon-play-mini, .icon-pause-mini, .icon-playlist
          font-size: 30px
          color: $color-theme-d
        .icon-mini
          font-size: 32px
          position: absolute
          left: 0
          top: 0

  @keyframes rotate
    0%
      transform: rotate(0)
    100%
      transform: rotate(360deg)
</style>
