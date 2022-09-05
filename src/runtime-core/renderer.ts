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
    patch(null, vnode, container, null, null);
  }

  // 核心 -> 所有程序开始的'脚本'
  // n1 -> 老的虚拟节点
  // n2 -> 新的虚拟节点
  function patch(n1, n2, container, parentComponent, anchor) {
    // check type of vnode
    // vnode 分为 component && element

    // 判断 是 component | element
    // shapeFlags 给 vnode 增加种类标识
    // 用位运算 提高性能
    const { type, shapeFlag } = n2;

    switch (type) {
      // fragment类型， 去除 slot 外部的无用节点
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      // text类型
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & shapeFlags.ELEMENT) {
          // element
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & shapeFlags.STATEFUL_COMPONENT) {
          // statefulComponent
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 重新把里面的 children 去执行 patch 递归出来
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processText(n1, n2: any, container: any) {
    // children 用户穿过来的需要渲染的字符串
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 虚拟节点是否是初始化
    if (!n1) {
      mountElement(n1, n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    // 初始化的时候才会走 mountElement， 会把返回的平台el赋值给第一个element上，也就是更新时的n1
    // 同时要保证el不会丢失还要继续传递给新的element节点 -> n2
    const el = (n2.el = n1.el);

    // update children
    patchChildren(n1, n2, el, parentComponent, anchor);
    // update props
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    // 要去判断新老节点类型，总共四种场景
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const shapeFlag = n2.shapeFlag;
    const c2 = n2.children;

    // 新节点children 是 text
    if (shapeFlag & shapeFlags.TEXT_CHILDREN) {
      // 老节点children 是 array，首先清除掉老dom节点的children，再重新添加新节点的 text
      // 老节点children 是 text，修改成新节点的 text
      if (prevShapeFlag & shapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & shapeFlags.TEXT_CHILDREN) {
        // 老的dom节点children是 text，新节点 children 是 array
        // 需要重新mount去编译然后变成真实dom后挂载到 父级dom上
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // array diff array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    // 先声明三个指针，初始化
    // i后面会由于左右侧对比，然后变成新老节点对比，第一个不同节点的索引
    // e1后面会由于右侧对比，然后变成老节点最后节点的索引
    // e2后面会由于右侧对比，然后变成新节点最后节点的索引
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    // 比较节点是否相同
    function isSomeVNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }

    // 右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    if (i > e1) {
      // 新的比老的长  -  创建dom
      // 新的多出的节点在老节点的左侧，就是相当于要把dom生成在老节点的前面，要声明一个锚点，就是第一个老节点的dom，即el
      const nextProp = e2 + 1;
      const anchor = nextProp < l2 ? c2[nextProp].el : null;
      while (i <= e2) {
        patch(null, c2[i], container, parentComponent, anchor);
        i++;
      }
    } else if (i > e2) {
      // 老的比新的长  -  删除dom
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      const s1 = i; // 老节点的开始索引
      const s2 = i; // 新节点的开始索引

      const keyToNewIndexMap = new Map(); // 建立 key 的map映射表
      const toBePatched = e2 - s2 + 1; // 新的节点总数
      let patched = 0; // 新节点渲染总数
      // 新的节点和老的节点的映射关系，即中间对比的新的结点里dom在老的节点里索引是多少
      // 老的 a b (c d e) f g
      // 新的 a b (e c d) f g
      // 括号中即中间对比，在新的节点里，相比于老的节点(c d e)，新的节点(e c d)中dom重新排列的顺序是 2 0 1
      const newIndexToOldIndexMap = new Array(toBePatched); // 为了最佳性能，声明定长为新的节点 length 的数组
      let moved = false; // 是否移动
      let maxNewIndexSoFar = 0; // 如果新的没有涉及移动，应该一直是大于之前的index的

      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0; // 初始化，为0代表新的节点中新增的dom

      // 把新的key放入map映射表中
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        if (nextChild.key) {
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }

      // 通过老的key，和map映射去判断是否存在需要删除的节点
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        // 新节点渲染总数大于新节点长度的话，就代表全是不存在的老节点，应全部删除
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }
        let newIndex; // 新老节点相同的dom 索引
        // 判断老节点的 key 的类型 null | undefined
        if (prevChild.key != null) {
          // dom中key的作用
          // 通过 key map 去查找，时间复杂度是 o(1)
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 遍历去寻找时间复杂度是 O(n)
          for (let j = s2; j <= e2; j++) {
            if (isSomeVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        // 当新老节点相同dom的索引不存在，即证明新节点中不存在老节点的dom，应删除
        if (newIndex === undefined) {
          // 删除老的（新的节点不存在，存在于老的节点）
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          // 迭代出相比于老节点，新节点中存在节点

          // 给映射表赋值
          // newIndex - s2 代表的是新的节点中映射关系应该从中间对比的第一个索引开始
          // i 可能为0，0在映射表中代表的是老节点不存在的节点，需要创建。所以在这里需要加1
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      // 获取到稳定节点
      // 如果存在移动再执行获取最长递增子序列，达到最优性能目的
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      // 稳定节点最后索引
      let j = increasingNewIndexSequence.length - 1;

      // 基于位置确定的 dom 去 insert 位置发生变更的dom，需要倒序遍历
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 获取中间对比最后一个节点索引
        const nextIndex = i + s2;
        // 获取中间对比最后一个节点
        const nextChild = c2[nextIndex];
        // 要移动到已经确定好位置的节点之前
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
          // 如果存在移动再执行移动逻辑，达到最优性能目的
        } else if (moved) {
          // 对比稳定索引和新节点中的索引，不相同就代表应该移动位置
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function unmountChildren(children) {
    for (const key in children) {
      // 获取到children中每个child的 dom节点
      const el = children[key].el;
      // remove
      hostRemove(el);
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

  function mountElement(n1, n2: any, container: any, parentComponent, anchor) {
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
      mountChildren(n2.children, el, parentComponent, anchor);
    }

    // props
    for (const key in props) {
      let val = props[key];

      // 添加属性
      hostPatchProp(el, key, null, val);
    }

    // 挂载
    // container.append(el);
    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountComponent(n2, container, parentComponent, anchor);
  }

  // initialVNode 顾名思义 - 初始化的虚拟节点
  function mountComponent(
    initialVNode: any,
    container,
    parentComponent,
    anchor
  ) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
    // 依赖收集
    effect(() => {
      // 初始化
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));

        // vnode -> patch
        // vnode -> element -> mountElement

        patch(null, subTree, container, instance, anchor);

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

        patch(prevSubTree, currentSubTree, container, instance, anchor);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}

// 获取最长递增子序列
// 在 diff 算法中的作用：获取稳定的节点，只需要和新节点对比，移动位置变换的即可，性能达到最优
function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
