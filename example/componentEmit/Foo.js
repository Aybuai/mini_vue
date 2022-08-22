import { h } from "../../lib/mini-vue.esm.js";

export const Foo = {
  name: "Foo",
  // vue3 -> emit 通过 setup 第二个参数传过来
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log('emit event');
      emit('add', 1, 2);
      // 烤肉串命名格式
      emit('add-foo');
    }
    return {
      emitAdd
    }
  },
  render() {
    const btn = h('button', {
      onClick: this.emitAdd
    }, 'emitEvent')

    const foo = h('p', {}, 'foo')
    return h("div", {}, [foo, btn]);
  },
};
