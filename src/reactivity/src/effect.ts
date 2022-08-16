import { extend } from "../../shared";

// 全局的effect指针
let activeEffect: any;
// 全局 stop 状态, true 没触发  false 为触发
let shouldTrack: Boolean;

// effect响应式对象
export class ReactiveEffect {
  private _fn: Function;
  deps: Array<ReactiveEffect> = [];
  active: Boolean = true;
  public scheduler: Function | undefined;
  onStop?: () => void;

  // 公共属性 scheduler 才会被允许在类外部执行
  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  run() {
    if (!this.active) {
      return this._fn();
    }

    // 应该收集依赖
    shouldTrack = true;
    activeEffect = this;

    const res = this._fn();

    // reset
    shouldTrack = false;

    return res;
  }

  stop() {
    // 外部不管调用n次，节约性能调用一次即可
    if (this.active) {
      // 语义化抽离出功能, 清除依赖中的effect
      cleanupEffect(this);
      // 如果有onStop 就执行
      if (this.onStop) this.onStop();
      this.active = false;
    }
  }
}

export function isTracking() {
  // 单纯的走reactive/ref测试，会触发get中的依赖收集，而此时，没有执行effect，所以是没有effect 实例的, 即 activeEffect = undefined
  return shouldTrack && activeEffect !== undefined;
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  // 清空空 Set，节约空间
  effect.deps.length = 0;
}

// 全局的target容器
let targetsMap = new Map();

// 收集依赖
function track(target, key) {
  if (!isTracking()) return;
  // target => key => dep
  // target 目标对象
  // key 目标对象中的属性
  // dep 属性关联的函数(不可以重复)
  let depsMap = targetsMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetsMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  trackEffects(dep);
}

// ref reactive 收集依赖通用逻辑
export function trackEffects(dep) {
  // 避免重复收集依赖
  if (dep.has(activeEffect)) return;

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

// 触发依赖
function trigger(target, key) {
  let depsMap = targetsMap.get(target);
  let dep = depsMap.get(key);
  triggerEffects(dep);
}

// ref reactive 触发依赖通用逻辑
export function triggerEffects(dep) {
  for (const effect of dep) {
    // 判断effect实例是否有 scheduler方法
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

// 执行函数
function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options?.scheduler);
  // options 继承给 _effect，其中就包括了onStop fn
  extend(_effect, options);

  _effect.run();
  const runner: any = _effect.run.bind(_effect);

  runner.effect = _effect;

  return runner;
}

// stop
function stop(runner) {
  runner.effect.stop();
}

export { track, trigger, stop, effect };
