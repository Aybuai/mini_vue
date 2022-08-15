import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly"
}

// 封装成通用创建 Proxy 函数
function createActiveObj(raw: any, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}

export function reactive(raw) {
  return createActiveObj(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActiveObj(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createActiveObj(raw, shallowReadonlyHandlers);
}

// 1、只要取值就会触发 get，然后在 get 中根据 内置 isReadonly 属性去判断是 Reactive or Readonly
// 2、方法只返回 true or false， 不关心是否是响应式对象，强制转换成 Boolean 类型
export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value)
}
