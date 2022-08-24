import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // 存
  const currentInstance: any = getCurrentInstance();

  // provide和inject 必须在 setup 内使用才生效，因为实现方法的时候需要获取当前的组件instance实例，即getCurrentInstance()；要判断当前实例是否存在
  if (currentInstance) {
    let { provides } = currentInstance;
    // 获取父组件的provides
    const parentProvides = currentInstance.parent.provides;

    // init
    // 当前未注入的 provide 和 父组件的 provide 是相同的
    if (provides === parentProvides) {
      // 用原型链方式处理，当前没有 provides，则总是向上访问 provides
      provides = currentInstance.provides = Object.create(parentProvides);
    }

    provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  // 取
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;

    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  }
}
