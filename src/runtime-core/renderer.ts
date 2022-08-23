import { isObject } from "../shared";
import { createComponentInstance, setupComponent } from "./component";
import { shapeFlags } from "../shared/shapeFlags";
import { Fragment, Text } from "./vnode";

export function render(vnode, container) {
  // 执行 patch
  patch(vnode, container);
}

// 核心 -> 所有程序开始的'脚本'
function patch(vnode, container) {
  // check type of vnode
  // vnode 分为 component && element

  // 判断 是 component | element
  // shapeFlags 给 vnode 增加种类标识
  // 用位运算 提高性能
  const { type, shapeFlag } = vnode;

  switch (type) {
    // fragment类型， 去除 slot 外部的无用节点
    case Fragment:
      processFragment(vnode, container);
      break;
    // text类型
    case Text:
      processText(vnode, container);
      break;

    default:
      if (shapeFlag & shapeFlags.ELEMENT) {
        // element
        processElement(vnode, container);
      } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
        // statefulComponent
        processComponent(vnode, container);
      }
      break;
  }
}

function processFragment(vnode: any, container: any) {
  // 重新把里面的 children 去执行 patch 递归出来
  mountChildren(vnode, container);
}

function processText(vnode: any, container: any) {
  // children 用户穿过来的需要渲染的字符串
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  // vnode 是 element类型的 -> div
  const el = (vnode.el = document.createElement(vnode.type));

  const { props, children, shapeFlag } = vnode;

  // children
  // string | array
  if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
    // textChildren
    el.textContent = children;
  } else if (shapeFlag & shapeFlags.ARRAY_CHILDREN) {
    // arrayChildren
    // children 里面是vnode
    mountChildren(vnode, el);
  }

  // props
  for (const key in props) {
    let val = props[key];
    // 抽离通用事件
    // on + Click  on + 首字母大写的事件
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      // 截取事件并且转换成小写
      const event = key.slice(2).toLocaleLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
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
