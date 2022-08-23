import { shapeFlags } from "../shared/shapeFlags";

export function initSlots(instance, children) {
  // 初始化 slots 时候，不一定都有 children 或者 是一个 slots 类型
  const { vnode } = instance;

  if (vnode.shapeFlag & shapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
