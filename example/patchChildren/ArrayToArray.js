// 老的是 array
// 新的是 array

import { h, ref } from "../../lib/mini-vue.esm.js";

// diff 双端对比
// 声明三个指针，i, e1, e2
// 初始化时，i为0，e1 为老节点最后索引，即 老节点.length - 1， e2 为新节点最后索引，即 新节点.length - 1
// 最终确定变化范围
// i -> 新老节点不同时的索引
// e1 -> 新老节点不同时，老节点的索引
// e2 -> 新老节点不同时，新节点的索引

// 1. 左侧对比
// (a b) c
// (a b) d e
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
// ];

// 2. 右侧对比
// c (a b)
// d e (a b)
// const prevChildren = [
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];
// const nextChildren = [
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];

// 3. 新的比老的长
// 创建新的dom
// 左侧
// (a b)
// (a b) c d
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
// ];

// 右侧
// (a b)
// c d (a b)
// i -> 0    e1 -> -1    e2 -> 1
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];
// const nextChildren = [
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];

// 4. 老的比新的长
// 删除dom
// 左侧
// (a b) c d
// (a b)
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];

// 右侧
// i -> 0   e1 -> 1   e2 -> -1
// c d (a b)
// (a b)
// const prevChildren = [
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];
// const nextChildren = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];

// 5. 中间部分对比
// 删除老的 （在老的里存在，新的里不存在）
// a b (c d) f g
// a b (e c) f g
// D 节点在新的里面不存在，需要删除
// C 节点 props 也发生了变化，需要重新渲染
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C", id: "prev-c" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "C", id: "next-c" }, "C"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];

// a b (c e d h) f g
// a b (e c) f g
// 中间部分，老的比新的多，那么多出来的直接应该删除掉（优化删除逻辑）
const prevChildren = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B" }, "B"),
  h("div", { key: "C", id: "prev-c" }, "C"),
  h("div", { key: "E", id: "prev-e" }, "E"),
  h("div", { key: "D" }, "D"),
  h("div", { key: "H" }, "H"),
  h("div", { key: "F" }, "F"),
  h("div", { key: "G" }, "G"),
];
const nextChildren = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B" }, "B"),
  h("div", { key: "E", id: "next-e" }, "E"),
  h("div", { key: "C", id: "next-c" }, "C"),
  h("div", { key: "F" }, "F"),
  h("div", { key: "G" }, "G"),
];

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
