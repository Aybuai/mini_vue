import { h, ref } from "../../lib/mini-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);

    const onClick = () => {
      count.value++;
    };

    // update element props
    // 三种场景
    // 1、props 同一属性之前的值和现在的值不一样 ->  修改
    // 2、props 的属性变成 undefined || null  -> 删除
    // 3、props 的属性在新的 element 没有了 -> 删除
    const props = ref({
      foo: "foo",
      bar: "bar",
    });

    const onChangeProps1 = () => {
      props.value.foo = "new-foo";
    };

    const onChangeProps2 = () => {
      props.value.foo = undefined;
    };

    const onChangeProps3 = () => {
      props.value = {
        foo: "foo",
      };
    };
    return {
      count,
      onClick,
      onChangeProps1,
      onChangeProps2,
      onChangeProps3,
      props,
    };
  },
  render() {
    return h("div", { id: "root", ...this.props }, [
      h("p", {}, `count: ${this.count}`), // 依赖收集
      h("button", { onClick: this.onClick }, "click"),
      h(
        "button",
        { onClick: this.onChangeProps1 },
        "changeProps - 值改变了 - 修改"
      ),
      h(
        "button",
        { onClick: this.onChangeProps2 },
        "changeProps - 值变成 undefined || null - 删除"
      ),
      h(
        "button",
        { onClick: this.onChangeProps3 },
        "changeProps - key 在新的element里没有了 - 删除"
      ),
    ]);
  },
};
