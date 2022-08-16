import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // 执行 patch
  patch(vnode, container);
}

function patch(vnode, container) {
  // TODO
  // check type of vnode
  // vnode 分为 component && element

  // 判断 是 component | element
  processComponent(vnode, container);
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

function mountComponent(vnode: any, container) {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container) {
  const subTree = instance.render();

  // vnode -> patch
  // vnode -> element -> mountElement

  patch(subTree, container);
}
