import { effect } from "../src/effect"
import { reactive } from "../src/reactive"

describe('effect', () => {
    it('happy path', () => {
        // 创建一个reactive响应式数据
        const reactiveUser = reactive({
            age: 10
        })

        let newAge
        effect(() => {
            newAge = reactiveUser.age + 1
        })

        expect(newAge).toBe(11)

        // update age
        reactiveUser.age ++
        expect(newAge).toBe(12)
    })

    it('should return runner when call effect', () => {
        // effect(fn) => function(runner) => fn => return
        // 调用effect会返回一个函数runner， 调用runner会再次执行fn，调用fn， fn会返回一个返回值 
        let foo = 10
        const runner = effect(() => {
            foo++
            return 'foo'
        })
        expect(foo).toBe(11)
        const r = runner()
        expect(foo).toBe(12)
        expect(r).toBe('foo')
    })
})