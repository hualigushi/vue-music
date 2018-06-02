<template>
  <transition name="slide">
    <music-list :title="title" :bg-image="bgImage" :songs="songs"></music-list>
  </transition>
</template>
<script type="text/ecmascript-6">
  import MusicList from '@/components/music-list/music-list';
  import { mapGetters } from 'vuex';
  import { getSongList } from '@api/recommend.js';
  import {ERR_OK} from '@api/config.js';
  import {createSong} from '@common/js/song';

  export default {
    computed: {
      title () { // 标题
        return this.disc.dissname;
      },
      bgImage () { // 背景图
        return this.disc.imgurl;
      },
      ...mapGetters([
        'disc'
      ])
    },
    data () {
      return {
        songs: []
      };
    },
    created () {
      this._getSongList();
    },
    methods: {
      _getSongList () {
        // 如果没有就回退到父级路由
        if (!this.disc.dissid) {
          this.$router.push('/recommend');
          return;
        }
        getSongList(this.disc.dissid).then((res) => {
            if (res.code === ERR_OK) {
              this.songs = this._normalizeSongs(res.cdlist[0].songlist);
            }
        });
      },
      // 对歌单中的歌曲进行处理
      _normalizeSongs (list) {
        let ret = [];
        list.forEach((musicData) => {
          if (musicData.songid && musicData.albumid) {
            ret.push(createSong(musicData));
          }
        });
        return ret;
      }
    },
    components: {
      MusicList
    }
  };
</script>
<style lang="stylus" rel="stylesheet/stylus">
  .slider-enter-active, .slider-leave-active
    transition: all 0.3s

  .slider-enter, .slider-leave-to
    transform: translate3d(100%, 0, 0)
</style>
