'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (value) => {
    return value !== null && typeof value === "object";
};
const isString = (value) => typeof value === "string";
const hasChange = (val, newVal) => {
    return !Object.is(val, newVal);
};
const hasOwn = (raw, key) => Object.prototype.hasOwnProperty.call(raw, key);
// 驼峰命名法
const camelize = (str) => {
    // _ 匹配正则规则 即  -(\w)
    // c 是被匹配的字符串  -f
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toLocaleUpperCase() : "";
    });
};
// 优化成首字母大写
const capitalize = (str) => {
    return str.charAt(0).toLocaleUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? `on${capitalize(str)}` : "";
};

const Fragment = Symbol("Fragment");
const Text = Symbol("text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props === null || props === void 0 ? void 0 : props.key,
        shapeFlag: getShapeFlags(type),
        el: null,
    };
    // 添加 children 属性
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* shapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* shapeFlags.ARRAY_CHILDREN */;
    }
    // 组件类型 + children object
    if (vnode.shapeFlag & 2 /* shapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(children)) {
            vnode.shapeFlag |= 16 /* shapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
// 标准化 vnode 的格式
// 其目的是为了让 child 支持多种格式
function normalizeVNode(child) {
    // 暂时只支持处理 child 为 string 和 number 的情况
    if (typeof child === "string" || typeof child === "number") {
        return createVNode(Text, null, String(child));
    }
    else {
        return child;
    }
}
// 基于 type 来判断是什么类型的组件
function getShapeFlags(type) {
    return typeof type === "string"
        ? 1 /* shapeFlags.ELEMENT */
        : 2 /* shapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    // object
    const slot = slots[name];
    if (slot) {
        // function
        if (typeof slot === "function") {
            // fragment 类型节点 -> 替换掉 slot 的外层 div 节点
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

// 全局的effect指针
let activeEffect;
// 全局 stop 状态, true 没触发  false 为触发
let shouldTrack;
// effect响应式对象
class ReactiveEffect {
    // 公共属性 scheduler 才会被允许在类外部执行
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
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
            if (this.onStop)
                this.onStop();
            this.active = false;
        }
    }
}
function isTracking() {
    // 单纯的走reactive/ref测试，会触发get中的依赖收集，而此时，没有执行effect，所以是没有effect 实例的, 即 activeEffect = undefined
    return shouldTrack && activeEffect !== undefined;
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    // 清空空 Set，节约空间
    effect.deps.length = 0;
}
// 全局的target容器
let targetsMap = new Map();
// 收集依赖
function track(target, key) {
    if (!isTracking())
        return;
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
function trackEffects(dep) {
    // 避免重复收集依赖
    if (dep.has(activeEffect))
        return;
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
function triggerEffects(dep) {
    for (const effect of dep) {
        // 判断effect实例是否有 scheduler方法
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
// 执行函数
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options === null || options === void 0 ? void 0 : options.scheduler);
    // options 继承给 _effect，其中就包括了onStop fn
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

// 缓存一下get， set 后面始终用同一个
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 判断是否是 shallow
        if (shallow)
            return res;
        // 判断内部属性是否是 Object，是的话继续转换成 Proxy
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            // 收集依赖
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        // 警告函数
        console.warn(`${String(key)} cannot be set, because target is readonly, ${target}`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

// 封装成通用创建 Proxy 函数
function createActiveObj(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} should be Object`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}
function reactive(raw) {
    return createActiveObj(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObj(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObj(raw, shallowReadonlyHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
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
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(target[key]);
        },
        set(target, key, value) {
            // 当被修改的属性是 ref 类型，且value 不是 ref 类型就是替换掉被修改的 .value 值
            // 否则，被修改属性和value 都是 ref 类型，直接替换成value即可
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

function emit(instance, event, ...args) {
    // instance.props  -> emit event
    const { props } = instance;
    // TPP
    // 先去写一个特定的行为 ->  重构成通用的行为
    // add  -> Add
    // add-foo  -> addFoo
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    // 初始化 vnode 时， props 可能是 undefined
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        // 用户访问 proxy[key]
        // 这里就匹配一下看看是否有对应的 function
        // 有的话就直接调用这个 function
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            // 先检测访问的 key 是否存在于 setupState 中, 是的话直接返回
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            // 看看 key 是不是在 props 中
            // 代理是可以访问到 props 中的 key 的
            return props[key];
        }
        // $el | $slots
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    // 初始化 slots 时候，不一定都有 children 或者 是一个 slots 类型
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* shapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        next: null,
        setupState: {},
        props: {},
        slots: {},
        provides: (parent === null || parent === void 0 ? void 0 : parent.provides) || {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    // 把 instance 指向给emit
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 代理对象，用来存储 setup 返回值、$el、$options、$slots、$data等
    // 代理的对象通常叫 ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        // 把当前instance 赋值给 currentInstance
        // currentInstance = instance
        // 后续如果赋值失败，无从查询是从何时何地赋值失败，所以用函数包装起来翻遍维护
        setCurrentInstance(instance);
        // setup 返回两种可能：function | Object
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        // setup 执行后，再重置
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO function
    if (typeof setupResult === "object") {
        // 把ref响应式结构用 proxyRefs 自动转换成 .value，在页面上展示
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // compiler 模块不要直接引入 runtime 逻辑；同理，runtime 也不要直接引入 compiler。因为vue3支持更加自由拼组功能
    if (!instance.render) {
        // 如果 compile 有值 并且当组件没有 render 函数，那么就需要把 template 编译成 render 函数
        if (compiler && !Component.render) {
            if (Component.template) {
                // 这里就是 runtime 模块和 compile 模块结合点
                const template = Component.template;
                Component.render = compiler(template);
            }
        }
        instance.render = Component.render;
    }
}
// 全局 当前组件instance 实例
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
// 全局的compile
let compiler;
// 导出一个调用函数去获取 compile 的 render 函数
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, value) {
    // 存
    const currentInstance = getCurrentInstance();
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
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            return typeof defaultValue === "function" ? defaultValue() : defaultValue;
        }
    }
}

// createApp 和 render 强绑定
function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先转换 vnode
                // component -> vnode
                // 所有的操作都是基于 vnode 做处理的
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    // 检查props是否一致，一样就不需要更新，否则反之
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key])
            return true;
    }
    return false;
}

// 存放更新视图任务的队列
const queue = [];
// 更新视图的开关，只需调用一次即可，避免生成过多 promise
let isFlushPending = false;
// 提取公用部分，减少 promise 的创建
const p = Promise.resolve();
function nextTick(fn) {
    // 1、当fn存在时，就是把当前的fn插入到微任务中
    // 2、不存在时，就是创建一个微任务
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    // 执行一次后就关闭
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    // reset
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRenderer(options) {
    // 加上host前缀，如果出错方便鉴别是否是 custom render
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // 执行 patch
        // 初始化的时候，没有父节点，即 null
        patch(null, vnode, container, null, null);
    }
    // 核心 -> 所有程序开始的'脚本'
    // n1 -> 老的虚拟节点
    // n2 -> 新的虚拟节点
    function patch(n1, n2, container, parentComponent, anchor) {
        // check type of vnode
        // vnode 分为 component && element
        // 判断 是 component | element
        // shapeFlags 给 vnode 增加种类标识
        // 用位运算 提高性能
        const { type, shapeFlag } = n2;
        switch (type) {
            // fragment类型， 去除 slot 外部的无用节点
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            // text类型
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* shapeFlags.ELEMENT */) {
                    // element
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* shapeFlags.STATEFUL_COMPONENT */) {
                    // statefulComponent
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        // 重新把里面的 children 去执行 patch 递归出来
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        // children 用户穿过来的需要渲染的字符串
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 虚拟节点是否是初始化
        if (!n1) {
            mountElement(n1, n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("patchElement");
        console.log("n1", n1);
        console.log("n2", n2);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 初始化的时候才会走 mountElement， 会把返回的平台el赋值给第一个element上，也就是更新时的n1
        // 同时要保证el不会丢失还要继续传递给新的element节点 -> n2
        const el = (n2.el = n1.el);
        // update children
        patchChildren(n1, n2, el, parentComponent, anchor);
        // update props
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        // 要去判断新老节点类型，总共四种场景
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const shapeFlag = n2.shapeFlag;
        const c2 = n2.children;
        // 新节点children 是 text
        if (shapeFlag & 4 /* shapeFlags.TEXT_CHILDREN */) {
            // 老节点children 是 array，首先清除掉老dom节点的children，再重新添加新节点的 text
            // 老节点children 是 text，修改成新节点的 text
            if (prevShapeFlag & 8 /* shapeFlags.ARRAY_CHILDREN */) {
                unmountChildren(c1);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 4 /* shapeFlags.TEXT_CHILDREN */) {
                // 老的dom节点children是 text，新节点 children 是 array
                // 需要重新mount去编译然后变成真实dom后挂载到 父级dom上
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // array diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        // 先声明三个指针，初始化
        // i后面会由于左右侧对比，然后变成新老节点对比，第一个不同节点的索引
        // e1后面会由于右侧对比，然后变成老节点最后节点的索引
        // e2后面会由于右侧对比，然后变成新节点最后节点的索引
        let i = 0;
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        // 比较节点是否相同
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            // 新的比老的长  -  创建dom
            // 新的多出的节点在老节点的左侧，就是相当于要把dom生成在老节点的前面，要声明一个锚点，就是第一个老节点的dom，即el
            const nextProp = e2 + 1;
            const anchor = nextProp < l2 ? c2[nextProp].el : null;
            while (i <= e2) {
                patch(null, c2[i], container, parentComponent, anchor);
                i++;
            }
        }
        else if (i > e2) {
            // 老的比新的长  -  删除dom
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            const s1 = i; // 老节点的开始索引
            const s2 = i; // 新节点的开始索引
            const keyToNewIndexMap = new Map(); // 建立 key 的map映射表
            const toBePatched = e2 - s2 + 1; // 新的节点总数
            let patched = 0; // 新节点渲染总数
            // 新的节点和老的节点的映射关系，即中间对比的新的结点里dom在老的节点里索引是多少
            // 老的 a b (c d e) f g
            // 新的 a b (e c d) f g
            // 括号中即中间对比，在新的节点里，相比于老的节点(c d e)，新的节点(e c d)中dom重新排列的顺序是 2 0 1
            const newIndexToOldIndexMap = new Array(toBePatched); // 为了最佳性能，声明定长为新的节点 length 的数组
            let moved = false; // 是否移动
            let maxNewIndexSoFar = 0; // 如果新的没有涉及移动，应该一直是大于之前的index的
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0; // 初始化，为0代表新的节点中新增的dom
            // 把新的key放入map映射表中
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                if (nextChild.key) {
                    keyToNewIndexMap.set(nextChild.key, i);
                }
            }
            // 通过老的key，和map映射去判断是否存在需要删除的节点
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 新节点渲染总数大于新节点长度的话，就代表全是不存在的老节点，应全部删除
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex; // 新老节点相同的dom 索引
                // 判断老节点的 key 的类型 null | undefined
                if (prevChild.key != null) {
                    // dom中key的作用
                    // 通过 key map 去查找，时间复杂度是 o(1)
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 遍历去寻找时间复杂度是 O(n)
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 当新老节点相同dom的索引不存在，即证明新节点中不存在老节点的dom，应删除
                if (newIndex === undefined) {
                    // 删除老的（新的节点不存在，存在于老的节点）
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 迭代出相比于老节点，新节点中存在节点
                    // 给映射表赋值
                    // newIndex - s2 代表的是新的节点中映射关系应该从中间对比的第一个索引开始
                    // i 可能为0，0在映射表中代表的是老节点不存在的节点，需要创建。所以在这里需要加1
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 获取到稳定节点
            // 如果存在移动再执行获取最长递增子序列，达到最优性能目的
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            // 稳定节点最后索引
            let j = increasingNewIndexSequence.length - 1;
            // 基于位置确定的 dom 去 insert 位置发生变更的dom，需要倒序遍历
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 获取中间对比最后一个节点索引
                const nextIndex = i + s2;
                // 获取中间对比最后一个节点
                const nextChild = c2[nextIndex];
                // 要移动到已经确定好位置的节点之前
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                    // 如果存在移动再执行移动逻辑，达到最优性能目的
                }
                else if (moved) {
                    // 对比稳定索引和新节点中的索引，不相同就代表应该移动位置
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (const key in children) {
            // 获取到children中每个child的 dom节点
            const el = children[key].el;
            // remove
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        // 三种场景
        // 1、props 同一属性之前的值和现在的值不一样 ->  修改
        // 2、props 的属性变成 undefined || null  -> 删除
        // 3、props 的属性在新的 element 没有了 -> 删除
        if (oldProps !== newProps) {
            // update props 场景 1 & 2
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            // 场景 3
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!hasOwn(newProps, key)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(n1, n2, container, parentComponent, anchor) {
        // vnode 是 element类型的 -> div
        // 创建平台
        const el = (n2.el = hostCreateElement(n2.type));
        const { props, children, shapeFlag } = n2;
        // children
        // string | array
        if (shapeFlag & 4 /* shapeFlags.TEXT_CHILDREN */) {
            // textChildren
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* shapeFlags.ARRAY_CHILDREN */) {
            // arrayChildren
            // children 里面是vnode
            mountChildren(n2.children, el, parentComponent, anchor);
        }
        // props
        for (const key in props) {
            let val = props[key];
            // 添加属性
            hostPatchProp(el, key, null, val);
        }
        // 挂载
        // container.append(el);
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        // 继续把老节点的instance赋值给新节点
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            // 把新节点挂载到当前instance实例上，然后更新时可以同时获取新的虚拟节点(next)和老的虚拟节点(vnode)
            instance.next = n2;
            // 去调用component的update逻辑，也就是effect返回的runner函数
            instance.update();
        }
        else {
            // 把当前组件的渲染容器传递下去，即老节点的el
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    // initialVNode 顾名思义 - 初始化的虚拟节点
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 初始化时，把instance赋值给component
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // 依赖收集
        instance.update = effect(() => {
            // 初始化
            if (!instance.isMounted) {
                // const { proxy } = instance;
                // const subTree = (instance.subTree = instance.render.call(
                //   proxy,
                //   proxy
                // ));
                const proxyToUse = instance.proxy;
                // 可在 render 函数中通过 this 来使用 proxy
                const subTree = (instance.subTree = normalizeVNode(
                // call 后面加上 proxy 代表了 _ctx，而不是 this.message 去调用message
                instance.render.call(proxyToUse, proxyToUse)));
                // vnode -> patch
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                // 所有的 element 都初始化完成 mounted
                initialVNode.el = subTree.el;
                // 执行初始化之后要改成true
                instance.isMounted = true;
            }
            else {
                // 更新
                // 获取到最新的 vnode
                const { next, vnode } = instance;
                if (next) {
                    // 把当前组件的渲染容器传递给更新后节点的容器，即el传递
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                // const { proxy } = instance;
                // const currentSubTree = instance.render.call(proxy, proxy);
                const proxyToUse = instance.proxy;
                const currentSubTree = normalizeVNode(instance.render.call(proxyToUse, proxyToUse));
                const prevSubTree = instance.subTree;
                // 修改之后，把最新的虚拟节点树赋值给 subtree
                instance.subTree = currentSubTree;
                // vnode -> patch
                // vnode -> element -> mountElement
                patch(prevSubTree, currentSubTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                console.log("update - scheduler");
                queueJobs(instance.update);
            },
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVNode) {
    // 更新成最新的虚拟节点，保持当前最新的虚拟节点
    instance.vnode = nextVNode.vnode;
    // 把下一节点重置为null，代表当前component已更新完成
    instance.next = null;
    // 更新props
    instance.props = nextVNode.props;
}
// 获取最长递增子序列
// 在 diff 算法中的作用：获取稳定的节点，只需要和新节点对比，移动位置变换的即可，性能达到最优
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

// 针对 dom 平台渲染，可根据渲染平台相应的API去自定义平台，例如 canvas 等
function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    // 抽离通用事件
    // on + Click  on + 首字母大写的事件
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 截取事件并且转换成小写
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key, nextVal);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    // parent.append(el);
    // 当锚点为 null 时，就相当于append，直接在后面追加dom
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    // 获取child dom 的父级 dom
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs,
    effect: effect
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

function generate(ast) {
    // 全局上下文
    const context = createCodegenContext();
    const { push } = context;
    // 前导码，导入的逻辑； 可能分为module、function
    genFunctionPreamble(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(", ");
    push(`function ${functionName}(${signature}) {`);
    push("return ");
    // 解析实际的ast内容，去渲染内容
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
    // 插值类型才需要导入 toDisplayString
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`);
    }
    push("\n");
    push("return ");
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_INTERPOLATION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            // 判断是否是 + 是的话，直接添加进来
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // 把props tag children如果不存在都要转换成 null
    // genNodeList 支持用数组形式去执行 genNode
    genNodeList(genNullable([tag, props, children]), context);
    // 由于处理了 createRootCodegen 逻辑，职责分清，把数据在 transform 中处理好
    // genNode(children, context);
    // 直接取到 element 类型，不用再递归 text 和 interpolation 类型
    // for (let i = 0; i < children.length; i++) {
    //   const child = children[i];
    //   genNode(child, context);
    // }
    push(")");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genNullable(args) {
    return args.map((arg) => arg || "null");
}
// 处理表达式
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
// 处理interpolation
function genInterpolation(node, context) {
    const { push, helper } = context;
    // console.log(node);
    push(`${helper(TO_DISPLAY_STRING)}(`);
    // 把插值里面的表达式内容再处理一遍，得到最终的插值内容
    // { type: 0, content: { type: 1, content: 'message' } }
    genNode(node.content, context);
    push(")");
}
// 处理text
function genText(node, context) {
    const { push } = context;
    push(`"${node.content}"`);
}
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}

// 声明开始结尾分隔符
const openDelimiter = "{{";
const closeDelimiter = "}}";
function baseParse(content) {
    // 创建一个全局的上下文对象 供给上下代码使用
    const context = createParserContext(content);
    // 第二个参数是声明一个 element 收集栈
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    // 没结束就一直循环处理node
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        // 没有插值的时候不调用处理函数
        if (s.startsWith(openDelimiter)) {
            // 插值类型
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
            // element类型
            // 第一个字符是 <，第二个字符是 a-z 不区分大小写
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        // 默认是text类型
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    const s = context.source;
    // 2、当遇到结束标签的时候
    if (s.startsWith("</")) {
        // 因为是栈，后进先出，像弹夹一样。如果最开始的 element 缺失结束tag，就会检测出，减少遍历次数，优化性能
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            // 命中结束tag，就不再进行递归
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // 1、context.source 为空的时候
    return !s;
}
function parseText(context) {
    // 1、 获取content
    let endIndex = context.source.length;
    const endTokens = ["<", "{{"];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        // 拦截text，当遇到 {{ 或者 < tag标签都要停止截取text，并且获取最小的index
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content,
    };
}
// 优化逻辑代码
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    // 2、 推进（删除掉已处理后的数据）
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    // 解析tag
    // 删除处理完的代码  -> 推进
    // 先处理前半部分tag
    const element = parseTag(context, 0 /* TagTypes.START */);
    // 收集 element 到栈里
    ancestors.push(element);
    // 添加children
    element.children = parseChildren(context, ancestors);
    // 退出递归循环后，在即将消费结束标签时，弹出
    ancestors.pop();
    // console.log("---------");
    // console.log(element.tag);
    // console.log(context.source);
    // 处理后半部分tag
    // 当前的开始标签是否和 context 结束标签一致，一致才可以消费掉结束标签，否则就抛出错误
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagTypes.END */);
    }
    else {
        throw new Error(`缺失结束标签${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    // 程序健壮性的逻辑
    // source.startsWith("</") 全部转换小写后对比
    return (source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, type) {
    // 首先获取 <，然后第一个字母 a-z，不区分大小写 /i，匹配标签名 ([a-z]*)，\/? 匹配结尾tag标签 </div>
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    // 删除已处理完的代码
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    // 处理后半部分tag不用返回element
    if (type === 1 /* TagTypes.END */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag: tag,
    };
}
function parseInterpolation(context) {
    // 处理完的插值要删除掉   术语 -> 推进
    // {{message}}
    // 拿到插值的结尾，从 message 开始计算到 }}
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    // 推进两个，把前面的 {{ 删掉
    advanceBy(context, openDelimiter.length);
    // 拿到message的长度
    const rawContentLength = closeIndex - openDelimiter.length;
    // 拿到未处理的插值，并且推进掉 message
    const rawContent = parseTextData(context, rawContentLength);
    // 处理边缘逻辑，如果有前后空格
    const content = rawContent.trim();
    // 还要继续推进，删掉全部的插值
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_INTERPOLATION */,
            content: content,
        },
    };
}
// 推进函数，删掉已经处理后的插值
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */,
    };
}
function createParserContext(content) {
    return {
        source: content,
    };
}

// 单位职责，transform负责修改ast树结构，方便codegen转换
function transform(root, options = {}) {
    // 声明一个全局上下文对象
    const context = createTransformContext(root, options);
    // 1、遍历ast树 - 深度优先搜索
    traverseNode(root, context);
    // 2、修改 text content
    // 生成一个 rootCodegen
    createRootCodegen(root);
    // 把 helpers 赋值到 root 上
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: (options === null || options === void 0 ? void 0 : options.nodeTransforms) || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function traverseNode(node, context) {
    // console.log(node)
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        // 执行 transform 的一些处理ast树的插件函数
        // 调用transformText, transformElement插件会返回一个函数
        const onExit = transform(node, context);
        if (onExit)
            exitFns.push(onExit);
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            // 把重复使用的 toDisplayString 提取出去
            context.helper(TO_DISPLAY_STRING); // 把 toDisplayString 放到插值跟节点上
            break;
        // 只有 root 和 element 有children
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    // 退出流程
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // 中间处理层
            // tag
            const vnodeTag = `"${node.tag}"`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            const vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

// transform 的一些处理ast树结构的插件函数
function transformExpression(node) {
    // { type: 0, content: { type: 1, content: 'message' } }
    // 改变插值的 content 内容
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
        // 重构
        // const rawContent = node.content.content;  出现两次以上的调用，代码坏味道
        // node.content.content = "_ctx." + rawContent;
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                // 当是 text 或者 interpolation 类型时，需要合并成复合类型
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            // 初始化符合类型
                            if (!currentContainer) {
                                // 用复合类型替代之前的 text 类型ast树节点
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            // text 和 interpolation 中间的 + 连接符
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            // 删除掉后 push 进来的 text 或者 interpolation 类型ast树
                            children.splice(j, 1);
                            // 删除之后要把删除节点的索引回归，就是--
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        // 按照顺序执行插件
        // 开始的时候执行 transformExpression，后面退出的时候再去执行 transformText 和 transformElement。 先去修改ast结构再去赋值
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    // console.log("ast", ast.codegenNode.children);
    return generate(ast);
}

// mini-vue  出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

exports.createApp = createApp;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.toDisplayString = toDisplayString;
