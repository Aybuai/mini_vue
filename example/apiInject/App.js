import { h, provide, inject } from "../../lib/mini-vue.esm.js";

export const App = {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};

// Provider 组件
const Provider = {
  name: "Provider",
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)]);
  },

  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");

    return {};
  },
};

// ProviderTwo 组件
const ProviderTwo = {
  name: "ProviderTwo",
  render() {
    return h("div", {}, [
      h("p", {}, `ProviderTwo - foo: ${this.foo}`),
      h(Consumer),
    ]);
  },

  setup() {
    provide("foo", "fooTwo");
    const foo = inject("foo");

    return {
      foo,
    };
  },
};

// consumer 组件
const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    // 默认值种类 String | Function
    // const baz = inject('baz', 'bazDefault')
    const baz = inject("baz", () => "bazDefault");

    return {
      foo,
      bar,
      baz,
    };
  },
  render() {
    return h(
      "div",
      {},
      `Consumer - foo: ${this.foo} - bar: ${this.bar} - baz: ${this.baz}`
    );
  },
};
