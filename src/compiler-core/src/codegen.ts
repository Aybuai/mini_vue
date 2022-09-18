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

    default:
      break;
  }
}

function genElement(node, context) {
  const { push, helper } = context;
  const { tag } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}("${tag}")`);
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
  push(`'${node.content}'`);
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
