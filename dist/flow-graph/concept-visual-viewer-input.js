import { flowConceptVisualPan, flowConceptVisualZoomAt } from "./concept-visual-viewer-state.js";
const trapTab = (event, dialog) => { const focusable = Array.from(dialog.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")); if (!focusable.length)
    return; const first = focusable[0], last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
}
else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
} };
export function installFlowConceptVisualViewerInput({ dialog, viewport, controls, finish, geometry, state, update }) {
    const center = () => ({ x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 });
    const zoomTo = (scale, anchor = center()) => update(flowConceptVisualZoomAt({ ...geometry(), state: state() }, scale, anchor));
    const pan = (x, y) => update(flowConceptVisualPan({ ...geometry(), state: state() }, { x, y }));
    const commands = { "+": () => zoomTo(state().scale * 1.25), "=": () => zoomTo(state().scale * 1.25), "-": () => zoomTo(state().scale / 1.25), "0": () => controls.fit.click(), "1": () => controls.actual.click(), ArrowLeft: () => controls.panLeft.click(), ArrowRight: () => controls.panRight.click(), ArrowUp: () => controls.panUp.click(), ArrowDown: () => controls.panDown.click() };
    dialog.addEventListener("keydown", event => { if (event.key === "Escape") {
        event.preventDefault();
        finish();
        return;
    } const command = commands[event.key]; if (command) {
        event.preventDefault();
        command();
        return;
    } if (event.key === "Tab")
        trapTab(event, dialog); });
    viewport.addEventListener("wheel", event => { event.preventDefault(); if (event.ctrlKey || event.metaKey) {
        const box = viewport.getBoundingClientRect();
        zoomTo(state().scale * (event.deltaY < 0 ? 1.1 : .9), { x: event.clientX - box.left, y: event.clientY - box.top });
    }
    else
        pan(-event.deltaX, -event.deltaY); }, { passive: false });
    const pointers = new Map();
    let dragPointer, pinch;
    viewport.addEventListener("pointerdown", event => { if (event.button !== 0)
        return; try {
        viewport.setPointerCapture?.(event.pointerId);
    }
    catch { /* Synthetic accessibility/browser probes may not create native pointer activation. */ } pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); if (pointers.size === 1) {
        dragPointer = event.pointerId;
        viewport.dataset.dragging = "true";
    }
    else if (pointers.size === 2) {
        const [left, right] = [...pointers.values()], midpoint = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
        pinch = { distance: Math.hypot(left.x - right.x, left.y - right.y), midpoint };
        dragPointer = undefined;
    } });
    viewport.addEventListener("pointermove", event => { const previous = pointers.get(event.pointerId); if (!previous)
        return; pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); if (pinch && pointers.size >= 2) {
        const [left, right] = [...pointers.values()], midpoint = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 }, distance = Math.hypot(left.x - right.x, left.y - right.y), box = viewport.getBoundingClientRect();
        let next = flowConceptVisualZoomAt({ ...geometry(), state: state() }, state().scale * distance / Math.max(1, pinch.distance), { x: pinch.midpoint.x - box.left, y: pinch.midpoint.y - box.top });
        next = flowConceptVisualPan({ ...geometry(), state: next }, { x: midpoint.x - pinch.midpoint.x, y: midpoint.y - pinch.midpoint.y });
        pinch = { distance, midpoint };
        update(next);
    }
    else if (dragPointer === event.pointerId)
        pan(event.clientX - previous.x, event.clientY - previous.y); });
    const endPointer = (event) => { pointers.delete(event.pointerId); if (dragPointer === event.pointerId)
        dragPointer = undefined; if (pointers.size < 2)
        pinch = undefined; if (pointers.size === 1)
        dragPointer = [...pointers.keys()][0]; if (pointers.size === 0)
        delete viewport.dataset.dragging; };
    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);
}
//# sourceMappingURL=concept-visual-viewer-input.js.map