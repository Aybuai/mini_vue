import { h } from "../../lib/mini-vue.esm.js";

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

// Foo 组件
const Foo = {
  name: "Foo",
  // vue3 -> emit 通过 setup 第二个参数传过来
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log("emit event");
      emit("add", 1, 2);
      // 烤肉串命名格式
      emit("add-foo");
    };
    return {
      emitAdd,
    };
  },
  render() {
    const btn = h(
      "button",
      {
        onClick: this.emitAdd,
      },
      "emitEvent"
    );

    const foo = h("p", {}, "foo");
    return h("div", {}, [foo, btn]);
  },
};
