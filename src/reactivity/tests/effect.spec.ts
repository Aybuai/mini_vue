import { effect, stop } from "../src/effect";
import { reactive } from "../src/reactive";

describe("effect", () => {
  it("happy path", () => {
    // 创建一个reactive响应式数据
    const reactiveUser = reactive({
      age: 10,
    });

    let newAge;
    effect(() => {
      newAge = reactiveUser.age + 1;
    });

    expect(newAge).toBe(11);

    // update age
    reactiveUser.age++;
    expect(newAge).toBe(12);
  });

  it("should return runner when call effect", () => {
    // effect(fn) => function(runner) => fn => return
    // 调用effect会返回一个函数runner， 调用runner会再次执行fn，调用fn， fn会返回一个返回值
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });

  it("scheduler", () => {
    // 1、当调用effect时 给定了第二个参数 options 中的  scheduler fn
    // 2、effect第一次执行的时候，会执行fn
    // 3、当 响应式对象 set时，不会执行fn，而是执行scheduler fn
    // 4、当 执行runner函数，才会再次执行fn

    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);

    // should be called on first trigger 触发收集依赖
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);

    // should not run yet
    expect(dummy).toBe(1);

    // manually run  手动执行run
    run();

    // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);

    stop(runner);
    obj.prop = 3;
    expect(dummy).toBe(2);

    runner();
    expect(dummy).toBe(3);
  });

  it("onStop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const onStop = jest.fn();
    const runner = effect(
      () => {
        dummy = obj.prop;
      },
      { onStop }
    );

    stop(runner);
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
