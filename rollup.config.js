import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

export default {
    input: "./src/index.ts",
    output: [
        // cjs  ->  nodejs的 commonjs规范   对应package.json 的main
        // esm   对应package.json 的module
        {
            format: 'cjs',
            file: pkg.main
        },
        {
            format: 'es',
            file: pkg.module
        }
    ],
    // 默认支持js，所以就需要导入ts插件
    plugins: [typescript()]
}
