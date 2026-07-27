import { canonicalPropertyPath } from "./data-layer-canonical-schema.js";
function actualFor(document, observation, propertyId) { return Object.hasOwn(observation, propertyId) ? observation[propertyId] : canonicalPropertyPath(document, propertyId).split("/").filter(Boolean).reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, observation); }
function includesAny(actual, expected) {
    const choices = Array.isArray(expected) ? expected : [expected];
    if (Array.isArray(actual))
        return choices.some((choice) => actual.some((entry) => Object.is(entry, choice)));
    return choices.some((choice) => String(actual ?? "").includes(String(choice ?? "")));
}
function leafMatches(leaf, document, observation) { const actual = actualFor(document, observation, leaf.propertyId), expected = leaf.value; switch (leaf.operator) {
    case "Equals": return Object.is(actual, expected);
    case "Does not equal": return !Object.is(actual, expected);
    case "Exists": return actual !== undefined;
    case "Does not exist": return actual === undefined;
    case "Starts with": return String(actual ?? "").startsWith(String(expected ?? ""));
    case "Contains": return String(actual ?? "").includes(String(expected ?? ""));
    case "Is one of": return (Array.isArray(expected) ? expected : [expected]).some((choice) => Object.is(actual, choice));
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
} }
export function evaluateCanonicalPredicate(predicate, document, observation) { const branches = []; const visit = (branch) => { if (branch.kind === "predicate") {
    const matched = Boolean(document.nodes[branch.propertyId]) && leafMatches(branch, document, observation);
    branches.push({ label: `${document.nodes[branch.propertyId]?.name ?? "Unresolved property"} ${branch.operator}${branch.value === undefined ? "" : ` ${String(branch.value)}`}`, matched, propertyId: branch.propertyId });
    return matched;
} const results = branch.children.map(visit), matched = branch.kind === "all" ? results.every(Boolean) : branch.kind === "any" ? results.some(Boolean) : !results.some(Boolean); branches.push({ label: `${branch.kind.toUpperCase()} group`, matched }); return matched; }; return { matched: visit(predicate), branches }; }
//# sourceMappingURL=data-layer-canonical-schema-predicates.js.map