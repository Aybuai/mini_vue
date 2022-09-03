import { h } from "../../lib/mini-vue.esm.js";

import ArrayToText from "./ArrayToText.js";
import TextToText from "./TextToText.js";
import TextToArray from "./TextToArray.js";
import ArrayToArray from "./ArrayToArray.js";

export const App = {
  name: "App",
  setup() {
    // update element children
    // children 有两种格式，所以就有四种变化可能：
    // 1、老节点是 array， 新节点是 text
    // 2、老节点是 text， 新节点是 text
    // 3、老节点是 text， 新节点是 array
    // 4、老节点是 array，新节点是 array
  },
  render() {
    return h("div", { id: "root" }, [
      h("p", {}, "主页"),
      // 情况一
      // h(ArrayToText),
      // 情况二
      // h(TextToText),
      // 情况三
      // h(TextToArray),
      // 情况四
      h(ArrayToArray),
    ]);
  },
};
