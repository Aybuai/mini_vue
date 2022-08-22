export const extend = Object.assign;

export const isObject = (value) => {
  return value !== null && typeof value === "object";
};

export const hasChange = (val, newVal) => {
  return !Object.is(val, newVal);
};

export const hasOwn = (raw, key) => Object.prototype.hasOwnProperty.call(raw, key);

// 驼峰命名法
export const camelize = (str: String) => {
  // _ 匹配正则规则 即  -(\w)
  // c 是被匹配的字符串  -f
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toLocaleUpperCase() : "";
  });
};

// 优化成首字母大写
const capitalize = (str: String) => {
  return str.charAt(0).toLocaleUpperCase() + str.slice(1);
};

export const toHandlerKey = (str: String) => {
  return str ? `on${capitalize(str)}` : "";
};
