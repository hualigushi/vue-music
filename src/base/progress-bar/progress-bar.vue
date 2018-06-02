<template>
  <div class="progress-bar" ref="progressBar" @click="progressClick">
    <div class="bar-inner">
      <div class="progress" ref="progress"></div>
      <div class="progress-btn-wrapper" ref="progressBtn"
           @touchstart.prevent="progressTouchStart"
           @touchmove.prevent="progressTouchMove"
           @touchend="progressTouchEnd">
        <div class="progress-btn"></div>
      </div>
    </div>
  </div>
</template>
<script type="text/ecmascript-6">
import {prefixStyle} from '@common/js/dom.js';

const progressBtnWidth = 16; // 进度条上小球的宽度
const transform = prefixStyle('transform');

export default {
  props: {
    percent: {
      type: Number,
      default: 0
    }
  },
  created() {
    this.touch = {}; // 用于不同的回调函数中共享一些数据
  },
  methods: {
    progressTouchStart (e) {
      this.touch.initiated = true; // 表示已经初始化了
      this.touch.startX = e.touches[0].pageX; // 手指点击的位置，横向坐标
      this.touch.left = this.$refs.progress.clientWidth; // 当前按钮偏移的位置
    },
    progressTouchMove (e) {
      if (!this.touch.initiated) {
        return;
      }
      const deltaX = e.touches[0].pageX - this.touch.startX; // 偏移量
      const offsetWidth = Math.min(this.$refs.progressBar.clientWidth, Math.max(0, this.touch.left + deltaX)); // 已经偏移的量加上手指移动的偏移量,大于0，小于progress-bar宽度
      this._offset(offsetWidth);
    },
    progressTouchEnd () {
      this.touch.initiated = false;
      // end的时候向外派发事件，告诉当前拖动位置的进度
      this._triggerPercent();
    },
    progressClick (e) {
      const rect = this.$refs.progressBar.getBoundingClientRect();
      const offsetWidth = e.pageX - rect.left;
      this._offset(offsetWidth);
      this._triggerPercent(); // 通知外层改变了多少percent
    },
    _triggerPercent () {
      const barWidth = this.$refs.progressBar.clientWidth - progressBtnWidth; // 进度条宽度
      const percent = this.$refs.progress.clientWidth / barWidth;
      this.$emit('percentChange', percent); // 不做业务逻辑判断，只是告诉外层拖动完成
    },
    // 设置偏移位置
    _offset (offsetWidth) {
      this.$refs.progress.style.width = `${offsetWidth}px`;
      this.$refs.progressBtn.style[transform] = `translate3d(${offsetWidth}px,0,0)`;
    }
  },
  watch: {
    percent (newPercent) {
      if (newPercent >= 0 && !this.touch.initiated) { // 拖动过程中不能修改进度，否则会冲突
        const barWidth = this.$refs.progressBar.clientWidth - progressBtnWidth; // 进度条宽度
        const offsetWidth = newPercent * barWidth;// 当前偏移宽度
        this._offset(offsetWidth);
      }
    }
  }
};
</script>
<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "../../common/stylus/variable"

  .progress-bar
    height: 30px
    .bar-inner
      position: relative
      top: 13px
      height: 4px
      background: rgba(0, 0, 0, 0.3)
      .progress
        position: absolute
        height: 100%
        background: $color-theme
      .progress-btn-wrapper
        position: absolute
        left: -8px
        top: -13px
        width: 30px
        height: 30px
        .progress-btn
          position: relative
          top: 7px
          left: 7px
          box-sizing: border-box
          width: 16px
          height: 16px
          border: 3px solid $color-text
          border-radius: 50%
          background: $color-theme
</style>
