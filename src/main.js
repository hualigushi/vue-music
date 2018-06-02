// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'babel-polyfill';
import Vue from 'vue';
import App from './App';
import router from './router';
import store from './store';
import fastclick from 'fastclick'; // 解决移动端点击延迟300毫秒问题
import VueLazyload from 'vue-lazyload'; // 图片懒加载

import '@common/stylus/index.styl';

//import Vconsole from 'vconsole';
/* eslint-disable no-unused-vars */
//let vconsole = new Vconsole();
//console.log('test');

fastclick.attach(document.body);

Vue.use(VueLazyload, {
  loading: require('@common/image/default.png')
});

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
});
