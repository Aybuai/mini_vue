// 老的是 array
// 新的是 array

import { h, ref } from "../../lib/mini-vue.esm.js";
const nextChildren = [h("div", {}, "new A"), h("div", {}, "new B")];
const prevChildren = [h("div", {}, "old A"), h("div", {}, "old B")];

export default {
  name: "TextToArray",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;
    return {
      isChange,
    };
  },
  render() {
    const self = this;

    return self.isChange
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};
