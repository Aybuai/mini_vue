const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value === "object";
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

// 全局的target容器
let targetsMap = new Map();
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
        setupState: {},
        props: {},
        slots: {},
        provides: (parent === null || parent === void 0 ? void 0 : parent.provides) || {},
        parent,
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
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
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

const Fragment = Symbol("Fragment");
const Text = Symbol("text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
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
function getShapeFlags(type) {
    return typeof type === "string"
        ? 1 /* shapeFlags.ELEMENT */
        : 2 /* shapeFlags.STATEFUL_COMPONENT */;
}

function render(vnode, container) {
    // 执行 patch
    // 初始化的时候，没有父节点，即 null
    patch(vnode, container, null);
}
// 核心 -> 所有程序开始的'脚本'
function patch(vnode, container, parentComponent) {
    // check type of vnode
    // vnode 分为 component && element
    // 判断 是 component | element
    // shapeFlags 给 vnode 增加种类标识
    // 用位运算 提高性能
    const { type, shapeFlag } = vnode;
    switch (type) {
        // fragment类型， 去除 slot 外部的无用节点
        case Fragment:
            processFragment(vnode, container, parentComponent);
            break;
        // text类型
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* shapeFlags.ELEMENT */) {
                // element
                processElement(vnode, container, parentComponent);
            }
            else if (shapeFlag & 2 /* shapeFlags.STATEFUL_COMPONENT */) {
                // statefulComponent
                processComponent(vnode, container, parentComponent);
            }
            break;
    }
}
function processFragment(vnode, container, parentComponent) {
    // 重新把里面的 children 去执行 patch 递归出来
    mountChildren(vnode, container, parentComponent);
}
function processText(vnode, container) {
    // children 用户穿过来的需要渲染的字符串
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
}
function mountElement(vnode, container, parentComponent) {
    // vnode 是 element类型的 -> div
    const el = (vnode.el = document.createElement(vnode.type));
    const { props, children, shapeFlag } = vnode;
    // children
    // string | array
    if (shapeFlag & 4 /* shapeFlags.TEXT_CHILDREN */) {
        // textChildren
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* shapeFlags.ARRAY_CHILDREN */) {
        // arrayChildren
        // children 里面是vnode
        mountChildren(vnode, el, parentComponent);
    }
    // props
    for (const key in props) {
        let val = props[key];
        // 抽离通用事件
        // on + Click  on + 首字母大写的事件
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            // 截取事件并且转换成小写
            const event = key.slice(2).toLocaleLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
        patch(v, container, parentComponent);
    });
}
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}
// initialVNode 顾名思义 - 初始化的虚拟节点
function mountComponent(initialVNode, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container, instance);
    // 所有的 element 都初始化完成 mounted
    initialVNode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先转换 vnode
            // component -> vnode
            // 所有的操作都是基于 vnode 做处理的
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
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

export { createApp, createTextVNode, getCurrentInstance, h, inject, provide, renderSlots };
