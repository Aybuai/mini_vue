import { NodeTypes, TagTypes } from "./ast";

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
  const s = context.source;
  // 没有插值的时候不调用处理函数
  if (s.startsWith(openDelimiter)) {
    // 插值类型
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    // element类型
    // 第一个字符是 <，第二个字符是 a-z 不区分大小写
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }

  nodes.push(node);

  return nodes;
}

function parseElement(context: any): any {
  // 解析tag
  // 删除处理完的代码  -> 推进

  // 先处理前半部分tag
  const element = parseTag(context, TagTypes.START);

  // 处理后半部分tag
  parseTag(context, TagTypes.END);

  return element;
}

function parseTag(context: any, type: TagTypes) {
  // 首先获取 <，然后第一个字母 a-z，不区分大小写 /i，匹配标签名 ([a-z]*)，\/? 匹配结尾tag标签 </div>
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);

  const tag = match[1];

  // 删除已处理完的代码
  advanceBy(context, match[0].length);
  advanceBy(context, 1);

  // 处理后半部分tag不用返回element
  if (type === TagTypes.END) return;

  return {
    type: NodeTypes.ELEMENT,
    tag: tag,
  };
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
