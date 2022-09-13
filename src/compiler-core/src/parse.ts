import { NodeTypes, TagTypes } from "./ast";

// 声明开始结尾分隔符
const openDelimiter = "{{";
const closeDelimiter = "}}";

export function baseParse(content: string) {
  // 创建一个全局的上下文对象 供给上下代码使用
  const context = createParserContext(content);
  // 第二个参数是声明一个 element 收集栈
  return createRoot(parseChildren(context, []));
}

function parseChildren(context, ancestors) {
  const nodes: any = [];

  // 没结束就一直循环处理node
  while (!isEnd(context, ancestors)) {
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
        node = parseElement(context, ancestors);
      }
    }

    // 默认是text类型
    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }

  return nodes;
}

function isEnd(context, ancestors) {
  const s = context.source;
  // 2、当遇到结束标签的时候
  if (s.startsWith("</")) {
    // 因为是栈，后进先出，像弹夹一样。如果最开始的 element 缺失结束tag，就会检测出，减少遍历次数，优化性能
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      // 命中结束tag，就不再进行递归
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }

  // 1、context.source 为空的时候
  return !s;
}

function parseText(context: any): any {
  // 1、 获取content

  let endIndex = context.source.length;
  const endTokens = ["<", "{{"];

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    // 拦截text，当遇到 {{ 或者 < tag标签都要停止截取text，并且获取最小的index
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

// 优化逻辑代码
function parseTextData(context: any, length: number) {
  const content = context.source.slice(0, length);
  // 2、 推进（删除掉已处理后的数据）
  advanceBy(context, length);
  return content;
}

function parseElement(context: any, ancestors): any {
  // 解析tag
  // 删除处理完的代码  -> 推进

  // 先处理前半部分tag
  const element: any = parseTag(context, TagTypes.START);
  // 收集 element 到栈里
  ancestors.push(element);

  // 添加children
  element.children = parseChildren(context, ancestors);
  // 退出递归循环后，在即将消费结束标签时，弹出
  ancestors.pop();

  // console.log("---------");
  // console.log(element.tag);
  // console.log(context.source);
  // 处理后半部分tag
  // 当前的开始标签是否和 context 结束标签一致，一致才可以消费掉结束标签，否则就抛出错误
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagTypes.END);
  } else {
    throw new Error(`缺失结束标签${element.tag}`);
  }

  return element;
}

function startsWithEndTagOpen(source, tag) {
  // 程序健壮性的逻辑
  // source.startsWith("</") 全部转换小写后对比
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
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

  // 拿到未处理的插值，并且推进掉 message
  const rawContent = parseTextData(context, rawContentLength);

  // 处理边缘逻辑，如果有前后空格
  const content = rawContent.trim();

  // 还要继续推进，删掉全部的插值
  advanceBy(context, closeDelimiter.length);

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
