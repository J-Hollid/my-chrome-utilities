import { renderSharedProjectConditionTree, } from "./data-layer-shared-condition-tree-editor.js";
const values = new WeakMap();
const emptyCondition = () => ({ kind: "all", conditions: [] });
const clone = (value) => structuredClone(value);
export function projectConditionEditorDraft(condition) {
    return clone(condition ?? emptyCondition());
}
export function mountProjectConditionEditor(host, condition) {
    host.dataset.conditionBuilder = "true";
    host.dataset.conditionPresentation = "shared";
    values.set(host, projectConditionEditorDraft(condition));
    renderSharedProjectConditionTree(host, {
        dom: host.ownerDocument,
        ...(condition ? { condition: condition } : {}),
        onChange: (next) => {
            values.set(host, clone(next ?? emptyCondition()));
        },
    });
}
export function projectConditionEditorValue(host) {
    return clone(values.get(host) ?? emptyCondition());
}
//# sourceMappingURL=data-layer-project-condition-editor.js.map