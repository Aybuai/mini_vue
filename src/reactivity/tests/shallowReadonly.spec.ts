import { isReadonly, shallowReadonly } from "../src/reactive"

describe('shallowReadonly', () => {
    // 只做表层的响应式，内部对象不是响应式，节约性能
    it('should not make non-reactive properties reactive', () => {
        const props = shallowReadonly({ p: { bar: 1 } });

        expect(isReadonly(props)).toBe(true);
        expect(isReadonly(props.p)).toBe(false);
    })

    it("warning when set triggered", () => {
        // mock   console.warn 警告函数调用
        console.warn = jest.fn();
    
        const user = shallowReadonly({
          age: 10,
        });
    
        user.age = 11;
    
        expect(console.warn).toBeCalled();
      });
})
