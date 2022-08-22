'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
        return c ? c.toLocaleUpperCase() : '';
    });
};
// 优化成首字母大写
const capitalize = (str) => {
    return str.charAt(0).toLocaleUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? `on${capitalize(str)}` : '';
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
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        // 重构优化相同逻辑，判断对象是否存在属性，存在就返回value
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // $el
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { }
    };
    // 把 instance 指向给emit
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 代理对象，用来存储 setup 返回值、$el、$options、$slots、$data等
    // 代理的对象通常叫 ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        // setup 返回两种可能：function | Object
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
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

function render(vnode, container) {
    // 执行 patch
    patch(vnode, container);
}
function patch(vnode, container) {
    // check type of vnode
    // vnode 分为 component && element
    // 判断 是 component | element
    // shapeFlags 给 vnode 增加种类标识
    // 用位运算 提高性能
    const { shapeFlags: shapeFlagsVNode } = vnode;
    if (shapeFlagsVNode & 1 /* shapeFlags.ELEMENT */) {
        // element
        processElement(vnode, container);
    }
    else if (shapeFlagsVNode & 2 /* shapeFlags.STATEFUL_COMPONENT */) {
        // statefulComponent
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    // vnode 是 element类型的 -> div
    const el = (vnode.el = document.createElement(vnode.type));
    const { props, children, shapeFlags: shapeFlagsVNode } = vnode;
    // children
    // string | array
    if (shapeFlagsVNode & 4 /* shapeFlags.TEXT_CHILDREN */) {
        // textChildren
        el.textContent = children;
    }
    else if (shapeFlagsVNode & 8 /* shapeFlags.ARRAY_CHILDREN */) {
        // arrayChildren
        // children 里面是vnode
        mountChildren(vnode, el);
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
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
// initialVNode 顾名思义 - 初始化的虚拟节点
function mountComponent(initialVNode, container) {
    const instance = createComponentInstance(initialVNode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
    // 所有的 element 都初始化完成 mounted
    initialVNode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlags(type),
        el: null,
    };
    // 添加 children 属性
    if (typeof children === "string") {
        vnode.shapeFlags |= 4 /* shapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= 8 /* shapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlags(type) {
    return typeof type === "string"
        ? 1 /* shapeFlags.ELEMENT */
        : 2 /* shapeFlags.STATEFUL_COMPONENT */;
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

exports.createApp = createApp;
exports.h = h;
