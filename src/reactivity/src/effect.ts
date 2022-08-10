// 全局的fn指针
let activeEffect

// effect响应式类
class ReactiveEffect {
    private _fn: any

    constructor(fn) {
        this._fn = fn
    }

    run() {
        activeEffect = this
        return this._fn()
    }
}

// 全局的target容器
let targetsMap = new Map()

// 收集依赖
function track(target, key) {
    // target => key => dep
    // target 目标对象
    // key 目标对象中的属性
    // dep 属性关联的函数(不可以重复)
    let depsMap = targetsMap.get(target)
    if (!depsMap) {
        depsMap = new Map()
        targetsMap.set(target, depsMap)
    }

    let dep = depsMap.get(key)
    if (!dep) {
        dep = new Set()
        depsMap.set(key, dep)
    }
    dep.add(activeEffect)
}

// 触发依赖
function trigger(target, key) {
    let depsMap = targetsMap.get(target)
    let dep = depsMap.get(key)
    for (const effect of dep) {
        effect.run()
    }
}

// 执行函数
function effect(fn) {
    const _effect = new ReactiveEffect(fn)

    _effect.run()

    return _effect.run.bind(_effect)
}

export {
    track,
    trigger,
    effect
}