import { h } from "../../lib/mini-vue.esm.js";

export const App = {
  // vue 组件
  // <template></template>  编译成 -> render函数
  render() {
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
      },
      // "hi, " + this.msg,
      // children 可能是 string or array
      // string
      // "hi, mini-vue",
      // array
      [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')]
    );
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
