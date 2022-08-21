export function initProps(instance, rawProps) {
  // 初始化 vnode 时， props 可能是 undefined
  instance.props = rawProps || {};
}
