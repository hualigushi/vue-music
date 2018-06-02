import {mapGetters, mapMutations, mapActions} from 'vuex';
import {playMode} from '@common/js/config.js';
import {shuffle} from '@common/js/utils.js';

export const playlistMixin = {
  computed: {
    ...mapGetters([
      'playlist'
    ])
  },
  mounted () {
    this.handlePlaylist(this.playlist);
  },
  // keep-alive组件切过来时的钩子函数
  activated () {
    this.handlePlaylist(this.playlist);
  },
  watch: {
    playlist (newVal) {
      this.handlePlaylist(newVal);
    }
  },
  methods: {
    handlePlaylist () {
      // 组件必须实现handlePlaylist函数，就会覆盖mixin中的方法。如果组件中没有定义，就会调用mixin中的此方法，抛出异常
      throw new Error('component must implement handlePlaylist method');
    }
  }
};

// 播放状态判断的逻辑抽出来
export const playerMixin = {
  computed: {
    iconMode () {
      return this.mode === playMode.sequence ? 'icon-sequence' : this.mode === playMode.loop ? 'icon-loop' : 'icon-random';
    },
    ...mapGetters([
      'sequenceList',
      'playlist',
      'currentSong',
      'mode',
      'favoriteList'
    ])
  },
  methods: {
    // 切换播放模式
    changeMode () {
      const mode = (this.mode + 1) % 3;
      this.setPlayMode(mode);
      let list = null;
      // 根据播放模式，改变当前播放列表
      if (mode === playMode.random) {
        list = shuffle(this.sequenceList);
      } else {
        list = this.sequenceList;
      }
      // 会改变currentSong
      this.resetCurrentIndex(list);
      this.setPlayList(list);
    },
    // 播放模式切换的时候，不改变当前正在播放的歌曲
    resetCurrentIndex (list) {
      // 在list中找到当前播放歌曲的id ,set进去
      let index = list.findIndex((item, index) => {
        return item.id === this.currentSong.id;
      });
      this.setCurrentIndex(index);
    },
    // 判断当前收藏的状态图标
    getFavoriteIcon (song) {
      if (this.isFavorite(song)) {
        return 'icon-favorite';
      }
      return 'icon-not-favorite';
    },
    toggleFavorite (song) {
      if (this.isFavorite(song)) {
        this.deleteFavoriteList(song);
      } else {
        this.saveFavoriteList(song);
      }
    },
    // 判断当前是否已收藏
    isFavorite (song) {
      const index = this.favoriteList.findIndex((item) => {
        return item.id === song.id;
      });
      return index > -1;
    },
    ...mapMutations({
      setFullScreen: 'SET_FULL_SCREEN',
      setPlayingState: 'SET_PLAYING_STATE',
      setCurrentIndex: 'SET_CURRENT_INDEX',
      setPlayMode: 'SET_PLAY_MODE',
      setPlayList: 'SET_PLAYLIST'
    }),
    ...mapActions([
      'saveFavoriteList',
      'deleteFavoriteList'
    ])
  }
};

// 将搜索框的逻辑抽出来
export const searchMixin = {
  data () {
    return {
      query: '',
      refreshDelay: 100
    };
  },
  computed: {
    ...mapGetters([
      'searchHistory'
    ])
  },
  methods: {
    // input失去焦点，目的是使手机上的键盘消失
    blurInput () {
      this.$refs.searchBox.blur(); // 调用子组件的方法
    },
    // 保存搜索结果
    saveSearch () {
      this.saveSearchHistory(this.query);
    },
    // 监听search-box 派发的事件
    onQueryChange (query) {
      this.query = query; // query传递给suggest组件,然后触发watch,进行api请求，result有了结果，dom就会跟着更新
    },
    // 点击热门搜索自动填充到搜索框中
    addQuery (query) {
      // 调用子组件中的方法
      this.$refs.searchBox.setQuery(query);
    },
    ...mapActions([
      'saveSearchHistory',
      'deleteSearchHistory'
    ])
  }
};
