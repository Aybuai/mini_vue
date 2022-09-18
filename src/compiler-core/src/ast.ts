import { CREATE_ELEMENT_VNODE } from "./runtimeHelpers";

// parsed content 种类
export const enum NodeTypes {
  INTERPOLATION,
  SIMPLE_INTERPOLATION,
  ELEMENT,
  TEXT,
  ROOT,
  COMPOUND_EXPRESSION,
}

// element tag 前后标识枚举
export const enum TagTypes {
  START,
  END,
}

export function createVNodeCall(context, tag, props, children) {
  context.helper(CREATE_ELEMENT_VNODE);

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  };
}
