import { NodeTypes } from "./ast";

// 声明开始结尾分隔符
const openDelimiter = "{{";
const closeDelimiter = "}}";

export function baseParse(content: string) {
  // 创建一个全局的上下文对象 供给上下代码使用
  const context = createParserContext(content);
  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any = [];

  let node;
  // 没有插值的时候不调用处理函数
  if (context.source.startsWith(openDelimiter)) {
    node = parseInterpolation(context);
  }

  nodes.push(node);

  return nodes;
}

function parseInterpolation(context: any) {
  // 处理完的插值要删除掉   术语 -> 推进
  // {{message}}

  // 拿到插值的结尾，从 message 开始计算到 }}
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );

  // 推进两个，把前面的 {{ 删掉
  advanceBy(context, openDelimiter.length);

  // 拿到message的长度
  const rawContentLength = closeIndex - openDelimiter.length;

  // 拿到未处理的插值
  const rawContent = context.source.slice(0, rawContentLength);

  // 处理边缘逻辑，如果有前后空格
  const content = rawContent.trim();

  // 还要继续推进，删掉全部的插值
  advanceBy(context, closeIndex);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_INTERPOLATION,
      content: content,
    },
  };
}

// 推进函数，删掉已经处理后的插值
function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
  };
}

function createParserContext(content: string) {
  return {
    source: content,
  };
}
