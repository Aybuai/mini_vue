export function generate(ast) {
  // 全局上下文
  const context = createCodegenContext();
  const { push } = context;

  push("return ");
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

function genNode(node: any, context) {
  const { push } = context;
  push(`'${node.content}'`);
}

function createCodegenContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
  };

  return context;
}
