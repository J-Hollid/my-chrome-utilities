import { renderSharedProjectConditionTree, } from "./data-layer-shared-condition-tree-editor.js";
import { declareStudioChoice } from "./data-layer-studio-choice-controls.js";
const values = new WeakMap();
const emptyCondition = () => ({ kind: "all", conditions: [] });
const clone = (value) => structuredClone(value);
export function projectConditionEditorDraft(condition) {
    return clone(condition ?? emptyCondition());
}
export function projectConditionNegated(condition) {
    return condition?.kind === "not";
}
export function setProjectConditionNegated(condition, negated) {
    const current = clone(condition ?? emptyCondition());
    if (negated)
        return current.kind === "not" ? current : { kind: "not", conditions: [current] };
    return current.kind === "not" ? clone(current.conditions[0] ?? emptyCondition()) : current;
}
export function mountProjectConditionEditor(host, condition) {
    host.dataset.conditionBuilder = "true";
    host.dataset.conditionPresentation = "shared";
    values.set(host, projectConditionEditorDraft(condition));
    const render = () => {
        const current = values.get(host) ?? emptyCondition(), negated = projectConditionNegated(current);
        const label = host.ownerDocument.createElement("label"), toggle = host.ownerDocument.createElement("input"), tree = host.ownerDocument.createElement("div");
        toggle.type = "checkbox";
        toggle.checked = negated;
        declareStudioChoice(toggle, "condition.negation");
        label.append(toggle, " Negate this condition");
        toggle.addEventListener("change", () => {
            values.set(host, setProjectConditionNegated(values.get(host), toggle.checked));
            render();
        });
        host.replaceChildren(label, tree);
        const editable = negated && current.kind === "not" ? current.conditions[0] ?? emptyCondition() : current;
        renderSharedProjectConditionTree(tree, {
            dom: host.ownerDocument,
            condition: editable,
            onChange: (next) => {
                const changed = clone(next ?? emptyCondition());
                values.set(host, negated ? setProjectConditionNegated(changed, true) : changed);
            },
        });
    };
    render();
}
export function projectConditionEditorValue(host) {
    return clone(values.get(host) ?? emptyCondition());
}
//# sourceMappingURL=data-layer-project-condition-editor.js.map