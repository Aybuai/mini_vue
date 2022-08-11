import { mutableHandlers, readonlyHandlers } from "./baseHandlers"

// 封装成通用创建 Proxy 函数
function createActiveObj(raw: any, baseHandlers) {
    return new Proxy(raw, baseHandlers)
}

export function reactive(raw) {
    return createActiveObj(raw, mutableHandlers)
}

export function readonly(raw) {
    return createActiveObj(raw, readonlyHandlers)
}