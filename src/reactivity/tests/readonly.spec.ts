import { isProxy, isReadonly, readonly } from "../src/reactive";

describe("readonly", () => {
  it("happy path", () => {
    // set not be triggered
    const original = { prop: 1, bar: { age: 10 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);

    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);

    expect(isProxy(wrapped)).toBe(true);

    // 嵌套测试
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(original.bar)).toBe(false);

    expect(wrapped.prop).toBe(1);
  });

  it("warning when set triggered", () => {
    // mock   console.warn 警告函数调用
    console.warn = jest.fn();

    const user = readonly({
      age: 10,
    });

    user.age = 11;

    expect(console.warn).toBeCalled();
  });
});
