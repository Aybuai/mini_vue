import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

// 实现功能思想：
// 先实现主逻辑，然后再处理边缘case

describe("Parse", () => {
  // 插值   即   {{ message }}
  describe("interpolation", () => {
    test("simple interpolation", () => {
      // 抽象语法树
      const ast = baseParse("{{message}}");

      // 编译时候所有的根节点 root
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_INTERPOLATION,
          content: "message",
        },
      });
    });
  });

  describe("element", () => {
    it("simple element div", () => {
      // 抽象语法树
      const ast = baseParse("<div></div>");

      // 编译时候所有的根节点 root
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
      });
    });
  });

  describe("text", () => {
    it("simple text", () => {
      // 抽象语法树
      const ast = baseParse("some text");

      // 编译时候所有的根节点 root
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "some text",
      });
    });
  });
});
