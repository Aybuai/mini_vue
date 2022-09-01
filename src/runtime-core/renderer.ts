import { createComponentInstance, setupComponent } from "./component";
import { shapeFlags } from "../shared/shapeFlags";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity";
import { EMPTY_OBJ, hasOwn } from "../shared";

export function createRenderer(options) {
  // 加上host前缀，如果出错方便鉴别是否是 custom render
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode, container) {
    // 执行 patch
    // 初始化的时候，没有父节点，即 null
    patch(null, vnode, container, null);
  }

  // 核心 -> 所有程序开始的'脚本'
  // n1 -> 老的虚拟节点
  // n2 -> 新的虚拟节点
  function patch(n1, n2, container, parentComponent) {
    // check type of vnode
    // vnode 分为 component && element

    // 判断 是 component | element
    // shapeFlags 给 vnode 增加种类标识
    // 用位运算 提高性能
    const { type, shapeFlag } = n2;

    switch (type) {
      // fragment类型， 去除 slot 外部的无用节点
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      // text类型
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & shapeFlags.ELEMENT) {
          // element
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
          // statefulComponent
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    // 重新把里面的 children 去执行 patch 递归出来
    mountChildren(n2.children, container, parentComponent);
  }

  function processText(n1, n2: any, container: any) {
    // children 用户穿过来的需要渲染的字符串
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    // 虚拟节点是否是初始化
    if (!n1) {
      mountElement(n1, n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function patchElement(n1: any, n2: any, container: any, parentComponent) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    // 初始化的时候才会走 mountElement， 会把返回的平台el赋值给第一个element上，也就是更新时的n1
    // 同时要保证el不会丢失还要继续传递给新的element节点 -> n2
    const el = (n2.el = n1.el);

    // update children
    patchChildren(n1, n2, el, parentComponent)
    // update props
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent) {
    // 要去判断新老节点类型，总共四种场景
    const prevShapeFlag = n1.shapeFlag
    const c1 = n1.children
    const shapeFlag = n2.shapeFlag
    const c2 = n2.children

    // 新节点children 是 text
    if(shapeFlag & shapeFlags.TEXT_CHILDREN) {
      // 老节点children 是 array，首先清除掉老dom节点的children，再重新添加新节点的 text
      // 老节点children 是 text，修改成新节点的 text
      if (prevShapeFlag & shapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1)
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & shapeFlags.TEXT_CHILDREN) {
        // 老的dom节点children是 text，新节点 children 是 array
        // 需要重新mount去编译然后变成真实dom后挂载到 父级dom上
        hostSetElementText(container, '')
        mountChildren(c2, container, parentComponent)
      }
    }
  }

  function unmountChildren(children) {
    for (const key in children) {
      // 获取到children中每个child的 dom节点
      const el = children[key].el
      // remove
      hostRemove(el)
    }
  }

  function patchProps(el, oldProps, newProps) {
    // 三种场景
    // 1、props 同一属性之前的值和现在的值不一样 ->  修改
    // 2、props 的属性变成 undefined || null  -> 删除
    // 3、props 的属性在新的 element 没有了 -> 删除
    if (oldProps !== newProps) {
      // update props 场景 1 & 2
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];

        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }

      // 场景 3
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!hasOwn(newProps, key)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  function mountElement(n1, n2: any, container: any, parentComponent) {
    // vnode 是 element类型的 -> div
    // 创建平台
    const el = (n2.el = hostCreateElement(n2.type));

    const { props, children, shapeFlag } = n2;

    // children
    // string | array
    if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
      // textChildren
      el.textContent = children;
    } else if (shapeFlag & shapeFlags.ARRAY_CHILDREN) {
      // arrayChildren
      // children 里面是vnode
      mountChildren(n2.children, el, parentComponent);
    }

    // props
    for (const key in props) {
      let val = props[key];

      // 添加属性
      hostPatchProp(el, key, null, val);
    }

    // 挂载
    // container.append(el);
    hostInsert(el, container);
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }

  function processComponent(n1, n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  // initialVNode 顾名思义 - 初始化的虚拟节点
  function mountComponent(initialVNode: any, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode, container) {
    // 依赖收集
    effect(() => {
      // 初始化
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));

        // vnode -> patch
        // vnode -> element -> mountElement

        patch(null, subTree, container, instance);

        // 所有的 element 都初始化完成 mounted
        initialVNode.el = subTree.el;
        // 执行初始化之后要改成true
        instance.isMounted = true;
      } else {
        // 更新
        const { proxy } = instance;
        const currentSubTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        // 修改之后，把最新的虚拟节点树赋值给 subtree
        instance.subTree = currentSubTree;

        // vnode -> patch
        // vnode -> element -> mountElement

        patch(prevSubTree, currentSubTree, container, instance);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
