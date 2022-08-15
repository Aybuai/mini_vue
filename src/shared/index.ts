export const extend = Object.assign;

export const isObject = (value) => {
  return value !== null && typeof value === "object";
};

export const hasChange = (val, newVal) => {
  return !Object.is(val, newVal);
}
