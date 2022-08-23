import { h } from "../../lib/mini-vue.esm.js";
import { renderSlots } from "../../lib/mini-vue.esm.js";

export const Foo = {
  name: "Foo",
  // vue3 -> emit 通过 setup 第二个参数传过来
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");
    // 就是把foo  .vnode  .children 赋值给 $slots

    // 抽离出 renderSlots 方法，用来把父组件APP传过来的 children 转换成 vnode
    // 接收单个 vnode 或者 children
    // 数据结构都改成数组格式,即 children

    // 具名插槽
    // 1、获取到要渲染的元素
    // 2、获取到要渲染的位置
    // 数据结构改成对象key，value格式

    // 作用域插槽
    // 子组件内部的变量，父组件APP调用插槽可以使用
    // 数据结构改成对象key，function格式

    const age = 18;
    return h("div", {}, [
      renderSlots(this.$slots, 'header', { age }),
      foo,
      renderSlots(this.$slots, 'footer')
    ]);
  },
};
