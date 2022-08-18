import { h } from "../../lib/mini-vue.esm.js";

window.self = null
export const App = {
  // vue 组件
  // <template></template>  编译成 -> render函数
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
      },
      // 从 setupState 中取出 msg
      "hi, " + this.msg
      // children 可能是 string or array
      // string
      // "hi, mini-vue",
      // array
      // [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')]
    );
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
