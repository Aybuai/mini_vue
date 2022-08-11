import { track, trigger } from "./effect"

// 缓存一下get， set 后面始终用同一个
const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)

function createGetter(isReadonly: Boolean = false) {
    return function get(target, key) {
        const res = Reflect.get(target, key)

        if (!isReadonly) {
            // 收集依赖
            track(target, key)
        }
        return res
    }
}

function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value)

        // 触发依赖
        trigger(target, key)
        return res
    }
}

export const mutableHandlers = {
    get,
    set
}

export const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        // 警告函数
        console.warn(`${ String(key) } cannot be set, because target is readonly, ${ target }`)
        return true
    }
}