import { comparisonValueFromInput, operatorsForConditionType, } from "./data-layer-conditional-validation-rules.js";
import { assignmentDataConditionSummary, validateAssignmentDataConditions, } from "./data-layer-schema-assignment-data-conditions.js";
import { renderLocalDraftReorderControl as renderReorderControl } from "./reorderable-editor/control.js";
import { reorderValues } from "./reorderable-editor/model.js";
import { StableIdentitySequence } from "./reorderable-editor/stable-identities.js";
const predicateIdentitySequences = new WeakMap();
function element(tag, text) {
    const result = document.createElement(tag);
    if (text !== undefined)
        result.textContent = text;
    return result;
}
function labelledControl(labelText, control) {
    const label = element("label", labelText);
    label.append(control);
    return label;
}
function comparisonText(predicate) {
    return predicate.operator === "Is one of"
        ? predicate.comparisons?.map(({ value }) => String(value)).join(",") ?? ""
        : predicate.comparison ? String(predicate.comparison.value) : "";
}
function parsedComparison(input, type) {
    return comparisonValueFromInput(input, type);
}
function withComparison(predicate, input) {
    const type = predicate.detectedType ?? "string";
    const { comparison: _comparison, comparisons: _comparisons, ...base } = predicate;
    if (predicate.operator === "Is one of") {
        const comparisons = input.split(",").map((value) => parsedComparison(value.trim(), type)).filter((value) => value !== undefined);
        return { ...base, comparisons };
    }
    const comparison = parsedComparison(input, type);
    return { ...base, ...(comparison ? { comparison } : {}) };
}
function withoutComparison(predicate) {
    const { comparison: _comparison, comparisons: _comparisons, ...base } = predicate;
    return base;
}
function controlIdentity(element) {
    if (!(element instanceof HTMLElement))
        return undefined;
    const name = element.dataset.assignmentConditionControl;
    return name ? `${name}|${element.dataset.predicateIndex ?? ""}` : undefined;
}
export function renderAssignmentDataConditionEditor(root, state, changed) {
    const focusIdentity = controlIdentity(document.activeElement);
    const scrollTop = root.scrollTop;
    const update = (next) => changed(structuredClone(next));
    const heading = element("h4", "Data layer conditions");
    const summary = element("p");
    summary.id = "schema-assignment-condition-summary";
    const assistance = element("output");
    assistance.id = "schema-assignment-condition-assistance";
    assistance.setAttribute("aria-live", "polite");
    if (!state.group) {
        predicateIdentitySequences.delete(root);
        summary.textContent = "No data conditions. This assignment is unrestricted by event data.";
        const add = element("button", "Add Data layer conditions");
        add.type = "button";
        add.id = "add-schema-assignment-data-conditions";
        add.dataset.assignmentConditionControl = "add-group";
        add.addEventListener("click", () => update({ ...state, group: { operator: "All", predicates: [] } }));
        assistance.textContent = validateAssignmentDataConditions(undefined).assistance;
        root.replaceChildren(heading, summary, add, assistance);
        return;
    }
    const target = element("select");
    target.id = "schema-assignment-condition-target";
    target.dataset.assignmentConditionControl = "target";
    target.replaceChildren(...["payload", "raw input"].map((value) => Object.assign(element("option", value === "payload" ? "Payload" : "Raw input"), { value, selected: value === state.target })));
    target.addEventListener("change", () => update({ ...state, target: target.value === "raw input" ? "raw input" : "payload" }));
    const operator = element("select");
    operator.id = "schema-assignment-condition-group-operator";
    operator.dataset.assignmentConditionControl = "group-operator";
    operator.replaceChildren(...["All", "Any"].map((value) => Object.assign(element("option", value), { value, selected: value === state.group?.operator })));
    operator.addEventListener("change", () => update({ ...state, group: { ...state.group, operator: operator.value === "Any" ? "Any" : "All" } }));
    const removeGroup = element("button", "Remove data conditions");
    removeGroup.type = "button";
    removeGroup.dataset.assignmentConditionControl = "remove-group";
    removeGroup.addEventListener("click", () => { const { group: _group, ...withoutGroup } = state; update(withoutGroup); });
    const list = element("ol");
    list.id = "schema-assignment-condition-predicates";
    const predicateIdentities = predicateIdentitySequences.get(root) ?? new StableIdentitySequence("assignment-condition");
    predicateIdentitySequences.set(root, predicateIdentities);
    const stablePredicateIds = predicateIdentities.reconcile(state.group.predicates.length);
    const suggestions = element("datalist");
    suggestions.id = "schema-assignment-condition-path-suggestions";
    suggestions.replaceChildren(...state.suggestions.map(({ propertyPath, detectedType }) => Object.assign(element("option", `${propertyPath} · ${detectedType}`), { value: propertyPath })));
    const replacePredicate = (index, predicate) => {
        const predicates = [...(state.group?.predicates ?? [])];
        predicates[index] = predicate;
        update({ ...state, group: { ...state.group, predicates } });
    };
    for (const [index, predicate] of state.group.predicates.entries()) {
        const row = element("li");
        row.dataset.assignmentConditionPredicate = String(index);
        const path = element("input");
        path.value = predicate.propertyPath;
        path.setAttribute("list", suggestions.id);
        path.dataset.assignmentConditionControl = "path";
        path.dataset.predicateIndex = String(index);
        path.addEventListener("change", () => {
            const suggestion = state.suggestions.find(({ propertyPath }) => propertyPath === path.value.trim());
            const detectedType = suggestion?.detectedType ?? predicate.detectedType ?? "string";
            const available = operatorsForConditionType(detectedType);
            replacePredicate(index, { ...predicate, propertyPath: path.value.trim(), detectedType, operator: available.includes(predicate.operator) ? predicate.operator : available[0] });
        });
        const type = element("select");
        type.dataset.assignmentConditionControl = "type";
        type.dataset.predicateIndex = String(index);
        type.replaceChildren(...["string", "number", "boolean", "null", "array", "object"].map((value) => Object.assign(element("option", value), { value, selected: value === (predicate.detectedType ?? "string") })));
        type.addEventListener("change", () => {
            const detectedType = type.value;
            const available = operatorsForConditionType(detectedType);
            replacePredicate(index, { ...withoutComparison(predicate), detectedType, operator: available.includes(predicate.operator) ? predicate.operator : available[0] });
        });
        const predicateOperator = element("select");
        predicateOperator.dataset.assignmentConditionControl = "operator";
        predicateOperator.dataset.predicateIndex = String(index);
        predicateOperator.replaceChildren(...operatorsForConditionType(predicate.detectedType ?? "string").map((value) => Object.assign(element("option", value), { value, selected: value === predicate.operator })));
        predicateOperator.addEventListener("change", () => replacePredicate(index, { ...withoutComparison(predicate), operator: predicateOperator.value }));
        const comparison = element("input");
        comparison.value = comparisonText(predicate);
        comparison.placeholder = predicate.operator === "Is one of" ? "comma-separated values" : "comparison value";
        comparison.dataset.assignmentConditionControl = "comparison";
        comparison.dataset.predicateIndex = String(index);
        comparison.hidden = predicate.operator === "Exists" || predicate.operator === "Does not exist";
        comparison.addEventListener("change", () => replacePredicate(index, withComparison(predicate, comparison.value)));
        const predicateIdentity = (_candidate, candidateIndex) => stablePredicateIds[candidateIndex];
        const reorder = renderReorderControl({ focusScopeId: "assignment-data-predicates", itemId: predicateIdentity(predicate, index), itemLabel: predicate.propertyPath || `Condition ${index + 1}`,
            completeOrder: state.group.predicates.map((candidate, candidateIndex) => ({ id: predicateIdentity(candidate, candidateIndex), label: candidate.propertyPath || `Condition ${candidateIndex + 1}` })),
            dropTarget: row, orderedContainer: list, onMove: ({ itemId, toIndex }) => { const currentIds = predicateIdentities.values(), currentIdentity = (_candidate, candidateIndex) => currentIds[candidateIndex], fromIndex = currentIds.indexOf(itemId), predicates = reorderValues(state.group.predicates, itemId, toIndex, currentIdentity); predicateIdentities.move(fromIndex, toIndex); update({ ...state, group: { ...state.group, predicates } }); return true; } });
        const remove = element("button", "Remove condition");
        remove.type = "button";
        remove.addEventListener("click", () => { predicateIdentities.remove(index); update({ ...state, group: { ...state.group, predicates: state.group?.predicates.filter((_, candidate) => candidate !== index) ?? [] } }); });
        row.append(reorder, labelledControl("Property path", path), labelledControl("Detected type", type), labelledControl("Operator", predicateOperator), labelledControl("Configured value", comparison), remove);
        list.append(row);
    }
    const add = element("button", "Add condition");
    add.type = "button";
    add.id = "add-schema-assignment-condition";
    add.dataset.assignmentConditionControl = "add-predicate";
    add.addEventListener("click", () => { predicateIdentities.append(); update({ ...state, group: { ...state.group, predicates: [...state.group.predicates, { propertyPath: "", detectedType: "string", operator: "Exists" }] } }); });
    const validation = validateAssignmentDataConditions(state.group);
    assistance.textContent = validation.assistance;
    summary.textContent = assignmentDataConditionSummary({ target: state.target, conditionTarget: state.target, dataConditionGroup: state.group });
    root.replaceChildren(heading, labelledControl("Condition target", target), labelledControl("Group operator", operator), summary, list, suggestions, add, removeGroup, assistance);
    root.scrollTop = scrollTop;
    if (focusIdentity)
        Array.from(root.querySelectorAll("[data-assignment-condition-control]")).find((candidate) => controlIdentity(candidate) === focusIdentity)?.focus({ preventScroll: true });
}
//# sourceMappingURL=data-layer-schema-assignment-data-conditions-ui.js.map