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
})