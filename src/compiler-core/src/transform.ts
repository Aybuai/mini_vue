import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

// 单位职责，transform负责修改ast树结构，方便codegen转换
export function transform(root, options = {}) {
  // 声明一个全局上下文对象
  const context = createTransformContext(root, options);
  // 1、遍历ast树 - 深度优先搜索
  traverseNode(root, context);
  // 2、修改 text content

  // 生成一个 rootCodegen
  createRootCodegen(root);

  // 把 helpers 赋值到 root 上
  root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root: any) {
  root.codegenNode = root.children[0];
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options?.nodeTransforms || [],
    helpers: new Map(), // 储存插值ast转变render时，对ast树的修改。可以是对象、或者是map等
    helper(key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}

function traverseNode(node: any, context) {
  // console.log(node)

  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    // 执行 transform 的一些处理ast树的插件函数
    transform(node, context);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      // 把重复使用的 toDisplayString 提取出去
      context.helper(TO_DISPLAY_STRING); // 把 toDisplayString 放到插值跟节点上
      break;
    // 只有 root 和 element 有children
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;

    default:
      break;
  }
}

function traverseChildren(node: any, context: any) {
  const children = node.children;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context);
  }
}
