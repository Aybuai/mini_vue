import { isObject } from "../shared";
import { createComponentInstance, setupComponent } from "./component";
import { shapeFlags } from '../shared/shapeFlags';

export function render(vnode, container) {
  // 执行 patch
  patch(vnode, container);
}

function patch(vnode, container) {
  // check type of vnode
  // vnode 分为 component && element

  // 判断 是 component | element
  // shapeFlags 给 vnode 增加种类标识
  // 用位运算 提高性能
  const { shapeFlags: shapeFlagsVNode } = vnode

  if (shapeFlagsVNode & shapeFlags.ELEMENT) {
    // element
    processElement(vnode, container);
  } else if (shapeFlagsVNode & shapeFlags.STATEFUL_COMPONENT) {
    // statefulComponent
    processComponent(vnode, container);
  }
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  // vnode 是 element类型的 -> div
  const el = (vnode.el = document.createElement(vnode.type));

  const { props, children, shapeFlags: shapeFlagsVNode } = vnode;

  // children
  // string | array
  if (shapeFlagsVNode & shapeFlags.TEXT_CHILDREN) {
    // textChildren
    el.textContent = children;
  } else if (shapeFlagsVNode & shapeFlags.ARRAY_CHILDREN) {
    // arrayChildren
    // children 里面是vnode
    mountChildren(vnode, el);
  }

  // props
  for (const key in props) {
    let val = props[key];
    el.setAttribute(key, val);
  }

  container.append(el);
}

function mountChildren(vnode, container) {
  vnode.children.forEach((v) => {
    patch(v, container);
  });
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

// initialVNode 顾名思义 - 初始化的虚拟节点
function mountComponent(initialVNode: any, container) {
  const instance = createComponentInstance(initialVNode);

  setupComponent(instance);
  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance: any, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);

  // vnode -> patch
  // vnode -> element -> mountElement

  patch(subTree, container);

  // 所有的 element 都初始化完成 mounted
  initialVNode.el = subTree.el;
}
