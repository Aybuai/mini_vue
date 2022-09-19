import { generate } from "./codegen";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transformText";

export function baseCompile(template) {
  const ast: any = baseParse(template);

  transform(ast, {
    // 按照顺序执行插件
    // 开始的时候执行 transformExpression，后面退出的时候再去执行 transformText 和 transformElement。 先去修改ast结构再去赋值
    nodeTransforms: [transformExpression, transformElement, transformText],
  });

  // console.log("ast", ast.codegenNode.children);
  return generate(ast);
}
