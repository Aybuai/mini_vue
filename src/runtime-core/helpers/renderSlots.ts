import { createVNode, Fragment } from "../vnode";

export function renderSlots(slots, name, props) {
  // object
  const slot = slots[name];

  if (slot) {
    // function
    if (typeof slot === "function") {
      // fragment 类型节点 -> 替换掉 slot 的外层 div 节点
      return createVNode(Fragment, {}, slot(props));
    }
  }
}
