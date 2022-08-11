import { extend } from "../../shared"

// 全局的effect指针
let activeEffect: ReactiveEffect

// effect响应式类
class ReactiveEffect {
    private _fn: Function
    deps: Array<ReactiveEffect> = []
    active: Boolean = true
    public scheduler: Function | undefined
    onStop?: () => void

    // 公共属性 scheduler 才会被允许在类外部执行
    constructor(fn, scheduler) {
        this._fn = fn
    }

    run() {
        activeEffect = this
        return this._fn()
    }

    stop() {
        // 外部不管调用n次，节约性能调用一次即可
        if (this.active) {
            // 语义化抽离出功能, 清除依赖中的effect
            cleanupEffect(this)
            // 如果有onStop 就执行
            if (this.onStop) this.onStop()
            this.active = false
        }

    }
}

function cleanupEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
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

    // 单纯的走reactive，会触发get中的依赖收集，而此时是没有effect 实例的
    if (!activeEffect) return

    dep.add(activeEffect)
    activeEffect.deps.push(dep)
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
    // options 继承给 _effect，其中就包括了onStop fn
    extend(_effect, options)

    _effect.run()
    const runner: any = _effect.run.bind(_effect)

    runner.effect = _effect


    return runner
}

// stop
function stop(runner) {
    runner.effect.stop()
}

export {
    track,
    trigger,
    stop,
    effect
}