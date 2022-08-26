import { hasOwn } from "../shared";

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // setupState
    // 用户访问 proxy[key]
    // 这里就匹配一下看看是否有对应的 function
    // 有的话就直接调用这个 function
    const { setupState, props } = instance;


    if (hasOwn(setupState, key)) {
      // 先检测访问的 key 是否存在于 setupState 中, 是的话直接返回
      return setupState[key];
    } else if (hasOwn(props, key)) {
      // 看看 key 是不是在 props 中
      // 代理是可以访问到 props 中的 key 的
      return props[key];
    }

    // $el | $slots
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
