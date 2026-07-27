const clone = (value) => structuredClone(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const propertyPath = (choices, definitionId) => choices.find((choice) => choice.definitionId === definitionId)?.path ?? definitionId;
const groupAt = (root, path) => path.reduce((group, index) => { const child = group.children[index]; if (!child || child.kind === "predicate")
    throw new Error("Choose a condition group."); return child; }, root);
export function addComposedConditionGroup(draft, path, kind) { const condition = clone(draft.condition), group = groupAt(condition, path); if (group.kind === "not" && group.children.length)
    throw new Error("Not accepts one branch."); group.children.push({ kind, children: [] }); return { ...draft, condition }; }
export function addComposedConditionPredicate(draft, path, predicate) { const condition = clone(draft.condition), group = groupAt(condition, path); if (group.kind === "not" && group.children.length)
    throw new Error("Not accepts one branch."); group.children.push({ kind: "predicate", ...clone(predicate) }); return { ...draft, condition }; }
export function composedConditionPredicate(choice, operator, value) { return { propertyId: choice.definitionId, operator, ...(value !== undefined ? { value: clone(value) } : {}) }; }
export function removeComposedConditionBranch(draft, path) { if (!path.length)
    return { ...draft, condition: { kind: "all", children: [] } }; const condition = clone(draft.condition), parent = groupAt(condition, path.slice(0, -1)); parent.children.splice(path.at(-1), 1); return { ...draft, condition }; }
export function moveComposedConditionBranch(draft, path, delta) { if (!path.length)
    return draft; const condition = clone(draft.condition), parent = groupAt(condition, path.slice(0, -1)), index = path.at(-1), target = index + delta; if (index < 0 || index >= parent.children.length || target < 0 || target >= parent.children.length)
    return draft; [parent.children[index], parent.children[target]] = [parent.children[target], parent.children[index]]; return { ...draft, condition }; }
const valueAt = (observation, path) => path.split("/").filter(Boolean).reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, observation);
const includesAny = (actual, expected) => (Array.isArray(expected) ? expected : [expected]).some((choice) => Array.isArray(actual) ? actual.some((entry) => same(entry, choice)) : String(actual ?? "").includes(String(choice ?? "")));
export function evaluateComposedCondition(condition, observation, propertyChoices = []) { if (condition.kind !== "predicate") {
    if (condition.kind === "all")
        return condition.children.every((child) => evaluateComposedCondition(child, observation, propertyChoices));
    if (condition.kind === "any")
        return condition.children.some((child) => evaluateComposedCondition(child, observation, propertyChoices));
    return !condition.children.some((child) => evaluateComposedCondition(child, observation, propertyChoices));
} const actual = valueAt(observation, propertyPath(propertyChoices, condition.propertyId)), expected = condition.value; switch (condition.operator) {
    case "Equals": return same(actual, expected);
    case "Does not equal": return !same(actual, expected);
    case "Exists": return actual !== undefined;
    case "Does not exist": return actual === undefined;
    case "Starts with": return String(actual ?? "").startsWith(String(expected ?? ""));
    case "Contains": return String(actual ?? "").includes(String(expected ?? ""));
    case "Is one of": return (Array.isArray(expected) ? expected : [expected]).some((choice) => same(actual, choice));
    case "Contains any of": return includesAny(actual, expected);
    case "Matches pattern": try {
        return new RegExp(String(expected ?? "")).test(String(actual ?? ""));
    }
    catch {
        return false;
    }
    case "Greater than": return Number(actual) > Number(expected);
    case "At least": return Number(actual) >= Number(expected);
    case "Less than": return Number(actual) < Number(expected);
    case "At most": return Number(actual) <= Number(expected);
    default: return false;
} }
//# sourceMappingURL=facet-conditions.js.map