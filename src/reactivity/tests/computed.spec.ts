import { computed } from "../src/computed";
import { reactive } from "../src/reactive";

describe("computed", () => {
  it("happy path", () => {
    // .value 拿到返回值
    // 会缓存计算好的值
    const user = reactive({
      age: 1,
    });

    const age = computed(() => {
      return user.age;
    });

    expect(age.value).toBe(1);
  });

  it("should compute lazily", () => {
    const user = reactive({
      age: 1,
    });

    const getter = jest.fn(() => {
      return user.age;
    });

    const dummy = computed(getter);

    // lazy 未调用getter时，不会执行计算
    expect(getter).not.toHaveBeenCalled();

    // 调用getter，执行计算
    expect(dummy.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // 响应式对象未修改，再次执行，不会执行计算，从缓存中拿出之前计算的值
    dummy.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // // 响应式对象变更，且调用时再计算
    user.age = 2; // 触发set -> trigger -> get
    expect(getter).toHaveBeenCalledTimes(1);

    // // now it should compute
    expect(dummy.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not compute again
    dummy.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
