import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

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
});
