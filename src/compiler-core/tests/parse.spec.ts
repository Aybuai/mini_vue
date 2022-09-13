import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

// 实现功能思想：
// 先实现主逻辑，然后再处理边缘case

describe("Parse", () => {
  // 插值   即   {{ message }}
  describe("interpolation", () => {
    it("simple interpolation", () => {
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
        children: [],
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

  // element + text + interpolation
  test("hello world", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");

    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.TEXT,
          content: "hi,",
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_INTERPOLATION,
            content: "message",
          },
        },
      ],
    });
  });

  // 扩展case
  test("nested element", () => {
    const ast = baseParse("<div><p>hi</p>{{message}}</div>");

    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: "p",
          children: [
            {
              type: NodeTypes.TEXT,
              content: "hi",
            },
          ],
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_INTERPOLATION,
            content: "message",
          },
        },
      ],
    });
  });

  test("should throw error when lack end tag", () => {
    expect(() => {
      baseParse("<div><span></div>");
    }).toThrowError("缺失结束标签span");
  });
});
