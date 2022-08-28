import { h } from "../../lib/mini-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const x = 100;
    const y = 100;

    return {
      x,
      y,
    };
  },
  render() {
    return h("rect", { x: this.x, y: this.y });
  },
};
