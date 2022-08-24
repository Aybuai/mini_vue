import { h, getCurrentInstance } from "../../lib/mini-vue.esm.js";

export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");
    const foo = h(Foo);

    return h("div", {}, [app, foo]);
  },

  setup() {
    const instance = getCurrentInstance()
    console.log('App: ', instance)
    return {};
  },
};

// Foo 组件
const Foo = {
  name: "Foo",
  setup() {
    const instance = getCurrentInstance()
    console.log('Foo: ', instance)
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");

    return h("div", {}, [foo]);
  },
};
