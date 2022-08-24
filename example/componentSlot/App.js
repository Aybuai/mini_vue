import { h, createTextVNode } from "../../lib/mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");
    // const foo = h(Foo, {}, h('p', {}, '123'));
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => [
          h("p", {}, "header " + age),
          // 创建文本节点
          createTextVNode("Hello, Mr Aybuai"),
        ],
        footer: () => h("p", {}, "footer"),
      }
    );

    return h("div", {}, [app, foo]);
  },

  setup() {
    return {};
  },
};
