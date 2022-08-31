import { hasChange, isObject } from "../../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  public dep: Set<RefImpl>;
  // 缓存最原始的数据，因为可能接收到单一类型或者对象类型
  private _rawValue: any;
  public __v_isRef: Boolean = true;

  constructor(value) {
    this._rawValue = value;
    // 如果是对象类型，需要封装成 reactive
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    // hasChange 发生改变才会收集依赖并且赋值；具体用 Object.is 取反实现
    // 用新值和 之前没发生改变的数据比较
    if (hasChange(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      // 触发依赖
      triggerEffects(this.dep);
    }
  }
}

function trackRefValue(ref) {
  if (isTracking()) {
    // 收集依赖
    trackEffects(ref.dep);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(target[key]);
    },
    set(target, key, value) {
      // 当被修改的属性是 ref 类型，且value 不是 ref 类型就是替换掉被修改的 .value 值
      // 否则，被修改属性和value 都是 ref 类型，直接替换成value即可
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
