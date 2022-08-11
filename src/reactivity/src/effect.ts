// 全局的effect指针
let activeEffect

// effect响应式类
class ReactiveEffect {
    private _fn: any

    // 公共属性 scheduler 才会被允许在类外部执行
    constructor(fn, public scheduler?: any) {
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
        // 判断effect实例是否有 scheduler方法
        if (effect.scheduler) {
            effect.scheduler()
        } else {
            effect.run()
        }
    }
}

// 执行函数
function effect(fn, options: any = {}) {
    const _effect = new ReactiveEffect(fn, options?.scheduler)

    _effect.run()

    return _effect.run.bind(_effect)
}

export {
    track,
    trigger,
    effect
}