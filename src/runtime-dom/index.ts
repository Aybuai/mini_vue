import { createRenderer } from "../runtime-core";

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
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key, nextVal);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

function insert(el, container) {
  container.append(el);
}

function remove(child) {
  // 获取child dom 的父级 dom
  const parent = child.parentNode
  if (parent) {
    parent.removeChild(child)
  }
}

function setElementText(el, text) {
  el.textContent = text
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
