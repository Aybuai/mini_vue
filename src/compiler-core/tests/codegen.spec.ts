import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformElement } from "../src/transforms/transformElement";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformText } from "../src/transforms/transformText";

describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");

    // 把 template 转换成 要变成 render 函数所需要的ast树
    transform(ast);

    // 转换成render函数
    const { code } = generate(ast);

    // 快照 -> string
    // 方便抓bug
    // 更新快照  -u

    expect(code).toMatchSnapshot();
  });

  it("interpolation", () => {
    const ast = baseParse("{{message}}");

    transform(ast, {
      nodeTransforms: [transformExpression],
    });

    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });

  it("element", () => {
    const ast: any = baseParse("<div></div>");

    transform(ast, {
      // 按照顺序执行插件
      // 开始的时候执行 transformExpression，后面退出的时候再去执行 transformText 和 transformElement。 先去修改ast结构再去赋值
      nodeTransforms: [transformElement],
    });

    // console.log("ast", ast.codegenNode.children);
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });

  it("element text interpolation", () => {
    const ast: any = baseParse("<div>hi, {{message}}</div>");

    transform(ast, {
      // 按照顺序执行插件
      // 开始的时候执行 transformExpression，后面退出的时候再去执行 transformText 和 transformElement。 先去修改ast结构再去赋值
      nodeTransforms: [transformExpression, transformElement, transformText],
    });

    // console.log("ast", ast.codegenNode.children);
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });
});
