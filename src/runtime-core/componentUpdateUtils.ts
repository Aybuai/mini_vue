export function shouldUpdateComponent(prevVNode, nextVNode) {
  // 检查props是否一致，一样就不需要更新，否则反之
  const { props: prevProps } = prevVNode;
  const { props: nextProps } = nextVNode;

  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) return true;
  }

  return false;
}
