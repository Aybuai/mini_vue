import { NodeTypes } from "../ast";
import { isText } from "../utils";

export function transformText(node) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;

      let currentContainer;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        // 当是 text 或者 interpolation 类型时，需要合并成复合类型
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];

            if (isText(next)) {
              // 初始化符合类型
              if (!currentContainer) {
                // 用复合类型替代之前的 text 类型ast树节点
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }

              // text 和 interpolation 中间的 + 连接符
              currentContainer.children.push(" + ");
              currentContainer.children.push(next);
              // 删除掉后 push 进来的 text 或者 interpolation 类型ast树
              children.splice(j, 1);
              // 删除之后要把删除节点的索引回归，就是--
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
