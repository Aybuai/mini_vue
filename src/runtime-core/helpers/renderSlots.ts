import { createVNode } from "../vnode";

export function renderSlots(slots, name, props) {
    // object
    const slot = slots[name];

    if (slot) {
        // function
        if (typeof slot === 'function') {
            return createVNode('div', {}, slot(props))
        }
    }
}
