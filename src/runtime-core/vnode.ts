import { shapeFlags } from "../shared/shapeFlags";

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapeFlags: getShapeFlags(type),
    el: null,
  };

  // 添加 children 属性
  if (typeof children === "string") {
    vnode.shapeFlags |= shapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlags |= shapeFlags.ARRAY_CHILDREN
  }

  return vnode;
}

function getShapeFlags(type) {
  return typeof type === "string" ? shapeFlags.ELEMENT : shapeFlags.STATEFUL_COMPONENT
}
