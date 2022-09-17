import { NodeTypes } from "../ast";

// transform 的一些处理ast树结构的插件函数
export function transformExpression(node) {
  // { type: 0, content: { type: 1, content: 'message' } }
  // 改变插值的 content 内容

  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
    // 重构
    // const rawContent = node.content.content;  出现两次以上的调用，代码坏味道
    // node.content.content = "_ctx." + rawContent;
  }
}

function processExpression(node: any): any {
  node.content = `_ctx.${node.content}`;
  return node;
}
