import { h } from "../../lib/mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  // vue 组件
  // <template></template>  编译成 -> render函数
  name: "App",
  render() {
    return h("div", {}, [
      h("div", {}, "emit"),
      h(Foo, {
        // emit 和 element 组件事件一样  ->  on + Event
        // add 带参数
        onAdd(a, b) {
          console.log("onAdd", a, b);
        },
        // add-foo  烤肉串命名格式
        onAddFoo() {
          console.log("onAddFoo");
        },
      }),
    ]);
  },

  setup() {
    return {};
  },
};
