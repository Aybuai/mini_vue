// 老的是 text
// 新的是 text

import { h, ref } from "../../lib/mini-vue.esm.js"
const nextChildren = 'newChildren'
const prevChildren = 'oldChildren'

export default {
    name: 'TextToArray',
    setup() {
        const isChange = ref(false);
        window.isChange = isChange
        return {
            isChange
        }
    },
    render() {
        const self = this

        return self.isChange ? h('div', {}, nextChildren) : h('div', {}, prevChildren)
    }
}