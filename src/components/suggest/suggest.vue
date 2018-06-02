<template>
   <!--根据搜索框中数据向服务器请求数据并展示-->
  <scroll class="suggest"
          :data="result"
          :pullup="pullup"
          :beforeScroll="beforeScroll"
          @scrollToEnd="searchMore"
          @beforeScroll="listScroll"
          ref="suggest"
  >
    <ul class="suggest-list">
      <li @click="selectItem(item)" class="suggest-item" v-for="(item, index) in result" :key="index">
        <div class="icon">
          <i :class="getIconCls(item)"></i>
        </div>
        <div class="name">
          <p class="text" v-html="getDisplayName(item)"></p>
        </div>
      </li>
      <loading v-show="hasMore" title=""></loading>
    </ul>
    <div v-show="!hasMore && !result.length" class="no-result-wrapper">
      <no-result title="抱歉，暂无搜索结果"></no-result>
    </div>
  </scroll>
</template>
<script type="text/ecmascript-6">
  import {search} from '@api/search';
  import {ERR_OK} from '@api/config';
  import {createSong} from '@common/js/song.js';
  import Scroll from '@base/scroll/scroll';
  import Loading from '@base/loading/loading';
  import Singer from '@common/js/singer';
  import {mapMutations, mapActions} from 'vuex';
  import NoResult from '@base/no-result/no-result';

  const TYPE_SINGER = 'singer';
  const perpage = 20;

  export default {
  props: {
    query: {
      type: String,
      default: ''
    },
    showSinger: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      page: 1, // 当前页码
      result: [], // 搜索结果集
      pullup: true, // 上拉刷新
      hasMore: true, // 是否已加载完数据
      beforeScroll: true
    };
  },
  methods: {
    search () {
      // query变化后，第一次搜索时重置状态，scroll组件位置重置到顶部
      this.page = 1;
      this.$refs.suggest.scrollTo(0, 0);
      this.hasMore = true;
      search(this.query, this.page, this.showSinger, perpage).then((res) => {
        if (res.code === ERR_OK) {
          this.result = this._genResult(res.data);
          this._checkMore(res.data);
        }
      });
    },
    // 上拉刷新，scroll派发的事件
    searchMore () {
      if (!this.hasMore) {
        return;
      }
      this.page++;
      search(this.query, this.page, this.showSinger, perpage).then((res) => {
        if (res.code === ERR_OK) {
          // 数据拼接，result变化，dom也变化,数据传给scroll,scroll又重新计算高度
          this.result = this.result.concat(this._genResult(res.data));
          this._checkMore(res.data);
        }
      });
    },
    getIconCls (item) {
      if (item.type === TYPE_SINGER) { // 显示歌手结果图标
        return 'icon-mime';
      } else {
        return 'icon-music';
      }
    },
    // 显示歌手或歌曲
    getDisplayName (item) {
      if (item.type === TYPE_SINGER) {
        return item.singername;
      } else {
        return `${item.name} - ${item.singer}`;
      }
    },
    // 根据歌手或歌曲跳转到不同的页面
    selectItem(item) {
      // 歌手直接跳转到歌手详情页
      if (item.type === TYPE_SINGER) {
        const singer = new Singer({
          id: item.singermid,
          name: item.singername
        });
        this.$router.push({
          path: `/search/${singer.id}`
        });
        this.setSinger(singer);
      } else { // 点击歌曲时，将歌曲插入到播放列表中
        this.insertSong(item);
      }
      // 自己的业务处理完成以后，向外派发事件，让关心这个组件的父组件处理，比如添加历史记录
      this.$emit('select');
    },
    refresh () {
      this.$refs.suggest.refresh();
    },
    // input 框foucs时，在手机上会掉起键盘，所以在列表滚动前监听事件,将事件派发给search,使其blur
    listScroll () {
      this.$emit('listScroll');
    },
    // 判断是否还有数据
    _checkMore (data) {
      const song = data.song;
      if (!song.list.length || (song.curnum + song.curpage * perpage) >= song.totalnum) {
        this.hasMore = false;
      }
    },
    // 根据歌曲和歌手处理结果集
    _genResult (data) {
      let ret = [];
      if (data.zhida && data.zhida.singerid) {
        ret.push({...data.zhida, ...{type: TYPE_SINGER}});
      }
      if (data.song) {
        ret = ret.concat(this._normalizeSongs(data.song.list));
      }
      return ret;
    },
    _normalizeSongs (list) {
      let ret = [];
      list.forEach((musicData) => {
        if (musicData.songid && musicData.albumid) {
            ret.push(createSong(musicData));
        }
      });
      return ret;
    },
    // 通过vuex传递歌手信息
    ...mapMutations({
      setSinger: 'SET_SINGER'
    }),
    ...mapActions([
      'insertSong'
    ])
  },
  watch: {
    // query发生变化时，向服务器请求数据
    query () {
      this.search();
    }
  },
  components: {
    Scroll,
    Loading,
    NoResult
  }
};
</script>
<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "../../common/stylus/variable"
  @import "../../common/stylus/mixin"

  .suggest
    height: 100%
    overflow: hidden
    .suggest-list
      padding: 0 30px
      .suggest-item
        display: flex
        align-items: center
        padding-bottom: 20px
      .icon
        flex: 0 0 30px
        width: 30px
        [class^="icon-"]
          font-size: 14px
          color: $color-text-d
      .name
        flex: 1
        font-size: $font-size-medium
        color: $color-text-d
        overflow: hidden
        .text
          no-wrap()
    .no-result-wrapper
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
