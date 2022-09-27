# mini-vue
如果觉得不错，点个 `star` 吧 😃

实现一个最简 Vue3，主要包含核心三大模块：reactivity 响应式、runtime 运行时、compiler 编译

## 菜单
```javascript
.
├── example              runtime-core 测试文件
├── lib                  roll up 打包runtime 的库
├── src                  源码
│   ├── compiler-core    compiler 编译
│   │   ├── src          compiler 实现文件
│   │   └── tests        compiler 测试文件
│   ├── reactivity       reactivity 响应式
│   │   ├── src          reactivity 实现文件
│   │   └── tests        reactivity 测试文件
│   ├── runtime-core     runtime 通用逻辑
│   ├── runtime-dom      runtime custom render个性化
│   ├── shared           通用抽离方法
│   └── index.ts         mini-vue 出口
│  
├── README.md
├── package.json
├── babel.config.js      解决jest esm和ts支持
├── rollup.config.js     rollup配置文件
└── tsconfig.json        ts配置文件
```
<!-- ![image](https://github.com/Aybuai/data_structure/blob/main/%E8%8F%9C%E5%8D%95.png) -->

## 技术文档（CSDN）

**可能由于篇幅太小或者其他原因，导致文章被过滤掉，如有需要可直接访问 [一起学Vue3源码，实现最简Vue3](https://blog.csdn.net/aybuai/category_11960617.html?spm=1001.2014.3001.5482) 专题栏**

1、[一起学Vue3源码，实现最简Vue3【01】 -  初始化环境，集成jest，ts](http://t.csdn.cn/78yBD)

2、[一起学Vue3源码，实现最简Vue3【02】 -  实现 effect & reactive & 依赖收集 & 触发依赖](https://blog.csdn.net/Aybuai/article/details/126275000)

3、[一起学Vue3源码，实现最简Vue3【03】 -  实现 effect 返回 runner](http://t.csdn.cn/6NIld)

4、[一起学Vue3源码，实现最简Vue3【04】 -  实现 effect 的scheduler 功能](http://t.csdn.cn/Y70Yr)

5、[一起学Vue3源码，实现最简Vue3【05】 -  实现 effect 的 stop 功能](http://t.csdn.cn/3Pk1M)

6、[一起学Vue3源码，实现最简Vue3【06】 -  实现 readonly 功能](http://t.csdn.cn/CcGwL)

7、[一起学Vue3源码，实现最简Vue3【07】 -  实现 isReactive 和 isReadonly](http://t.csdn.cn/WKgR9)

8、[一起学Vue3源码，实现最简Vue3【08】 -  实现 reactive 和 readonly 嵌套对象转换功能](http://t.csdn.cn/NfRCi)

9、[一起学Vue3源码，实现最简Vue3【09】 -  实现 shallowReadonly 功能](http://t.csdn.cn/A9URs)

10、[一起学Vue3源码，实现最简Vue3【10】 - 实现 isProxy 功能](http://t.csdn.cn/AoxY7)

11、[一起学Vue3源码，实现最简Vue3【11】 - 实现 ref 功能](http://t.csdn.cn/ijb5i)

12、[一起学Vue3源码，实现最简Vue3【12】 - 实现 isRef 和 unRef 功能](http://t.csdn.cn/O4tTt)

13、[一起学Vue3源码，实现最简Vue3【13】 - 实现 proxyRefs 功能](http://t.csdn.cn/hPbs2)
