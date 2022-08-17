import { h } from "../../lib/mini-vue.esm.js";

export const App = {
  // vue 组件
  // <template></template>  编译成 -> render函数
  render() {
    return h("div", "hi, " + this.msg);
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
