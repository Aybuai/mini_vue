import { isObject } from "../shared";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // 执行 patch
  patch(vnode, container);
}

function patch(vnode, container) {
  // check type of vnode
  // vnode 分为 component && element

  // 判断 是 component | element
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  // vnode 是 element类型的 -> div
  const el = vnode.el = document.createElement(vnode.type);

  const { props, children } = vnode;

  // children
  // string | array
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
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
