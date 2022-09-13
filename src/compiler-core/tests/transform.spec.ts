import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse"
import { transform } from '../src/transform';

describe('transform', () => {
    // transform 就是对 ast 树做增删改查等操作
    // 需要遍历整个ast 树，从设计模式角度出发，遍历一棵树大致有两种，分别是：广度优先搜索、深度优先搜索

    it('happy path', () => {
        const ast = baseParse('<div>hi,{{message}}</div>')

        // 高内聚，低耦合。
        // transform 抽离出变动点，留下稳定的代码逻辑，对外放出接口，增加可测试性
        // 使用者自定义变动点即可
        const plugin = (node) => {
            if (node.type === NodeTypes.TEXT) {
                node.content = node.content + ' mini-vue'
            }
        }

        transform(ast, {
            nodeTransforms: [plugin]
        })

        const nodeText = ast.children[0].children[0]
        expect(nodeText.content).toBe('hi, mini-vue')
    })
})