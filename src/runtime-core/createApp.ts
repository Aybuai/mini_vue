import { createVNode } from "./vnode";

// createApp 和 render 强绑定
export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 先转换 vnode
        // component -> vnode
        // 所有的操作都是基于 vnode 做处理的

        const vnode = createVNode(rootComponent);

        render(vnode, rootContainer);
      },
    };
  };
}
