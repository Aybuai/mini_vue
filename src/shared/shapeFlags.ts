// 位运算 - 二进制实现 vnode 的属性判断
// 0001 -> 代表 element
// 0010 -> 代表 component
// 0100 -> 代表 text-children
// 1000 -> 代表 array-children

// |  -> 用来修改属性（比较两位全为0，结果才为0）
// 0001 | 0100   ->   0101
// &  -> 用来查询属性（比较两位全为1，结果才为1）
// 0001 & 0100   ->   0000

export const enum shapeFlags {
  ELEMENT = 1, // 0001
  STATEFUL_COMPONENT = 1 << 1, // 0010
  TEXT_CHILDREN = 1 << 2, // 0100
  ARRAY_CHILDREN = 1 << 3, // 1000
  SLOT_CHILDREN = 1 << 4, // 10000
}
