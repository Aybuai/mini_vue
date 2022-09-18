import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING,
} from "./runtimeHelpers";

export function generate(ast) {
  // 全局上下文
  const context = createCodegenContext();
  const { push } = context;

  // 前导码，导入的逻辑； 可能分为module、function
  genFunctionPreamble(ast, context);

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");

  push(`function ${functionName}(${signature}) {`);
  push("return ");

  // 解析实际的ast内容，去渲染内容
  genNode(ast.codegenNode, context);

  push("}");

  return {
    code: context.code,
  };
}

function genFunctionPreamble(ast, context) {
  const { push } = context;
  const VueBinging = "Vue";
  const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
  // 插值类型才需要导入 toDisplayString
  if (ast.helpers.length > 0) {
    push(
      `const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`
    );
  }
  push("\n");
  push("return ");
}

function genNode(node: any, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_INTERPOLATION:
      genExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;

    default:
      break;
  }
}

function genCompoundExpression(node, context) {
  const { push } = context;
  const { children } = node;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (isString(child)) {
      // 判断是否是 + 是的话，直接添加进来
      push(child);
    } else {
      genNode(child, context);
    }
  }
}

function genElement(node, context) {
  const { push, helper } = context;
  const { tag, children, props } = node;

  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  // 把props tag children如果不存在都要转换成 null
  // genNodeList 支持用数组形式去执行 genNode
  genNodeList(genNullable([tag, props, children]), context);

  // 由于处理了 createRootCodegen 逻辑，职责分清，把数据在 transform 中处理好
  // genNode(children, context);

  // 直接取到 element 类型，不用再递归 text 和 interpolation 类型
  // for (let i = 0; i < children.length; i++) {
  //   const child = children[i];
  //   genNode(child, context);
  // }
  push(")");
}

function genNodeList(nodes, context) {
  const { push } = context;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }

    if (i < nodes.length - 1) {
      push(", ");
    }
  }
}

function genNullable(args) {
  return args.map((arg) => arg || "null");
}

// 处理表达式
function genExpression(node, context) {
  const { push } = context;
  push(`${node.content}`);
}

// 处理interpolation
function genInterpolation(node: any, context: any) {
  const { push, helper } = context;
  // console.log(node);
  push(`${helper(TO_DISPLAY_STRING)}(`);
  // 把插值里面的表达式内容再处理一遍，得到最终的插值内容
  // { type: 0, content: { type: 1, content: 'message' } }
  genNode(node.content, context);
  push(")");
}

// 处理text
function genText(node: any, context: any) {
  const { push } = context;
  push(`"${node.content}"`);
}

function createCodegenContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    },
  };

  return context;
}
