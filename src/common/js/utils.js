// 工具方法

// 返回min,max之间的一个随机数
function getRandomInt (min, max) {
 return Math.floor(Math.random() * (max - min + 1) + min);
}
// 洗牌函數
export function shuffle (arr) {
  let _arr = arr.slice();// 拷贝一个副本，不影响原来的数组
  for (let i = 0; i < _arr.length; i++) {
    // 从0和i之间取一个索引，然后把这个索引对应的元素和arr[i]做交换
    let j = getRandomInt(0, i);
    let t = _arr[i];
    _arr[i] = _arr[j];
    _arr[j] = t;
  }
  return _arr;
}

// input节流
export function debounce (func, delay) {
  let timer;

  // 延迟执行要执行的函数，实际真正要执行的函数只执行一次
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};
