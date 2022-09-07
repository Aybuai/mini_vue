import { h, ref } from "../../lib/mini-vue.esm.js";

export const App = {
  name: "App",
  render() {
    return h("div", {}, [
      h("div", { class: "blue" }, "hello world"),
      h("button", { onClick: this.changeChildProps }, "change - child - props"),
      h(Child, { msg: this.msg }),
      h("button", { onClick: this.changeSelfCount }, "change - self - count"),
      h("p", {}, `count:${this.count}`),
    ]);
  },

  setup() {
    const msg = ref("123");

    // 挂载到window上，方便demo调试用
    window.msg = msg;

    const changeChildProps = () => {
      msg.value = "456";
    };

    const count = ref(1);

    const changeSelfCount = () => {
      count.value++;
    };
    return {
      msg,
      changeChildProps,
      count,
      changeSelfCount,
    };
  },
};

// child 子组件
const Child = {
  name: "Child",
  setup(props) {},
  render() {
    return h("p", {}, `child - props - msg: ${this.$props.msg}`);
  },
};
