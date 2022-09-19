// mini-vue  出口
// 先创建渲染平台，再执行后面的通用 patch 等逻辑
export * from "./runtime-dom";

import { baseCompile } from "./compiler-core/src";
// 相当于Vue
import * as runtimeDom from "./runtime-dom";
import { registerRuntimeCompiler } from "./runtime-dom";

function compileToFunction(template) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);
