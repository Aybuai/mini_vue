import { shallowReadonly } from "../reactivity/src/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides: parent?.provides || {},
    parent,
    emit: () => {},
  };

  // 把 instance 指向给emit
  component.emit = emit.bind(null, component) as any;

  return component;
}

export function setupComponent(instance) {
  // TODO
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
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

function handleSetupResult(instance: any, setupResult: any) {
  // TODO function
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (Component.render) {
    instance.render = Component.render;
  }
}

// 全局 当前组件instance 实例
let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

function setCurrentInstance(instance) {
  currentInstance = instance;
}
