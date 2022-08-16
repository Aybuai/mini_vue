import { ReactiveEffect } from "./effect";

class ComputedRefImpl{

    private _dirty: Boolean = true;
    private _value: any;
    private _effect: ReactiveEffect;

    constructor(getter) {
        this._effect = new ReactiveEffect(getter, () => {
            // 修改响应式对象数据时，触发set，后执行 scheduler， 重新把计算属性放开，_dirty 变为 true
            if (!this._dirty) {
                this._dirty = true
            }
        });
    }

    get value() {
        if (this._dirty) {
            this._dirty = false
            this._value = this._effect.run();
        }
        return this._value
    }
}

export function computed(getter) {
    return new ComputedRefImpl(getter)
}
