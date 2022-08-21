import { h } from "../../lib/mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = null;
export const App = {
  // vue 组件
  // <template></template>  编译成 -> render函数
  name: "App",
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
        onClick() {
          console.log("click");
        },
        onMousedown() {
          console.log("mousedown");
        },
      },
      // 从 setupState 中取出 msg
      // "hi, " + this.msg
      // children 可能是 string or array
      // string
      // "hi, mini-vue",
      // array
      // [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')]
      [
        h("span", { class: "red" }, "hi "),
        h("span", { class: "blue" }, this.msg),
        h(Foo, { count: 1 }),
      ]
    );
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
