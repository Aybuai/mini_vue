import {
  h,
  ref,
  getCurrentInstance,
  nextTick,
} from "../../lib/mini-vue.esm.js";

export const App = {
  // vue 组件
  // <template></template>  编译成 -> render函数
  name: "App",
  render() {
    // vue3 跟新视图是一个异步的，因为如果是同步更新的话，遇到循环，没必要更新中间的视图(造成性能浪费)，直接更新一次最终结果即可
    // 实现原理就是在同步任务执行之后，把更新视图逻辑变成微任务

    const btn = h("button", { onClick: this.onChange }, "update");
    const count = h("p", {}, `count: ${this.count}`);
    const name = h("p", {}, `name: ${this.name}`);

    return h("div", {}, [btn, count, name]);
  },

  setup() {
    const count = ref(1);
    const name = ref("tom");

    const instance = getCurrentInstance();

    const onChange = () => {
      for (let i = 0; i < 100; i++) {
        console.log("update");
        count.value = i;
        name.value = "tom" + i;
      }

      // 此时获取数据el实例的时候还没更新，保持更新前的视图，因为更新视图变成了异步，所以需要用 nextTick()
      console.log(instance);

      // 用来获取更新后的视图el实例
      nextTick(() => {
        console.log(instance);
      });

      // 第二种形式
      // await nextTick()
      // console.log(instance)
    };

    return {
      count,
      name,
      onChange,
    };
  },
};
