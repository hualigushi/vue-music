<template>
  <div class="search-box">
    <i class="icon-search"></i>
    <input ref="query" class="box" v-model="query" :placeholder="placeholder">
    <i @click="clear" v-show="query" class="icon-dismiss"></i>
  </div>
</template>
<script type="text/ecmascript-6">
  import {debounce} from '@common/js/utils.js';

export default {
  props: {
    placeholder: { // 搜索框占位文字
      type: String,
      default: '搜索歌曲、歌手'
    }
  },
  data () {
    return {
      query: '' // 搜索输入框数据双向绑定
    };
  },
  methods: {
    clear () { // 清空输入框
      this.query = '';
    },
    setQuery (query) {
      this.query = query;
    },
    blur () {
      this.$refs.query.blur();
    }
  },
  created () {
    // 向外暴露query字符串
    // query变化时，向外派发事件
    // 使用钩子函数的原因是： 组件本身不关心query的变化
    this.$watch('query', debounce((newQuery) => {
        this.$emit('query', newQuery);
    }, 200)); // 200毫秒内query变化，不会派发事件
  }
};
</script>
<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "../../common/stylus/variable"

  .search-box
    display: flex
    align-items: center
    box-sizing: border-box
    width: 100%
    padding: 0 6px
    height: 40px
    background: $color-highlight-background
    border-radius: 6px
    .icon-search
      font-size: 24px
      color: $color-background
    .box
      flex: 1
      margin: 0 5px
      line-height: 18px
      background: $color-highlight-background
      color: $color-text
      font-size: $font-size-medium
      &::placeholder
        color: $color-text-d
    .icon-dismiss
      font-size: 16px
      color: $color-background
</style>
