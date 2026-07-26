import { evaluateCanonicalPredicate, } from "./data-layer-canonical-schema.js";
import { renderSharedConditionTree } from "./data-layer-shared-condition-tree-editor.js";
const clone = (value) => structuredClone(value);
const existenceOperators = ["Exists", "Does not exist"];
const equalityOperators = ["Equals", "Does not equal"];
const textualOperators = ["Starts with", "Contains", "Matches pattern"];
const numericOperators = ["Greater than", "At least", "Less than", "At most"];
export function canonicalPredicateOperators(type) {
    if (type === "string")
        return [...existenceOperators, ...equalityOperators, ...textualOperators];
    if (type === "number" || type === "integer")
        return [...existenceOperators, ...equalityOperators, ...numericOperators];
    if (type === "boolean" || type === "null")
        return [...existenceOperators, ...equalityOperators];
    return existenceOperators;
}
export function canonicalPredicateLeafFromInput(document, propertyId, operator, input) {
    const property = document.nodes[propertyId];
    if (!property)
        return { ready: false, message: "Choose an available canonical property" };
    if (!canonicalPredicateOperators(property.type).includes(operator))
        return { ready: false, message: `${operator} is not compatible with ${property.type}` };
    if (existenceOperators.includes(operator))
        return { ready: true, predicate: { kind: "predicate", propertyId, operator } };
    let value = input;
    if (property.type === "number" || property.type === "integer") {
        if (!input.trim())
            return { ready: false, message: `Enter a compatible ${property.type} value` };
        value = Number(input);
        if (!Number.isFinite(value) || property.type === "integer" && !Number.isInteger(value))
            return { ready: false, message: `Enter a compatible ${property.type} value` };
    }
    else if (property.type === "boolean") {
        if (input !== "true" && input !== "false")
            return { ready: false, message: "Enter true or false" };
        value = input === "true";
    }
    else if (property.type === "null") {
        if (input !== "null")
            return { ready: false, message: "Enter null" };
        value = null;
    }
    if (operator === "Matches pattern") {
        try {
            new RegExp(input);
        }
        catch {
            return { ready: false, message: "Enter a valid regular expression" };
        }
    }
    return { ready: true, predicate: { kind: "predicate", propertyId, operator, value } };
}
function leafInput(leaf) {
    return leaf.value === null ? "null" : leaf.value === undefined ? "" : String(leaf.value);
}
export function validateCanonicalPredicateTree(document, predicate) {
    const visit = (branch, path) => {
        if (branch.kind === "predicate") {
            const result = canonicalPredicateLeafFromInput(document, branch.propertyId, branch.operator, leafInput(branch));
            return result.ready ? { ready: true, message: "Ready" } : { ready: false, message: result.message, path };
        }
        if (!branch.children.length)
            return { ready: false, message: `${branch.kind === "all" ? "All" : branch.kind === "any" ? "Any" : "Not"} needs a branch`, path };
        if (branch.kind === "not" && branch.children.length !== 1)
            return { ready: false, message: "Not accepts exactly one branch", path };
        for (let index = 0; index < branch.children.length; index += 1) {
            const result = visit(branch.children[index], [...path, index]);
            if (!result.ready)
                return result;
        }
        return { ready: true, message: "Ready" };
    };
    return visit(predicate, []);
}
export function canonicalPredicateText(document, predicate) {
    if (predicate.kind === "predicate") {
        const name = document.nodes[predicate.propertyId]?.name ?? "Unresolved property";
        return `${name} ${predicate.operator}${predicate.value === undefined ? "" : ` ${String(predicate.value)}`}`;
    }
    const label = predicate.kind === "all" ? "All" : predicate.kind === "any" ? "Any" : "Not";
    const conjunction = predicate.kind === "any" ? " or " : " and ";
    return `${label} (${predicate.children.map((child) => canonicalPredicateText(document, child)).join(conjunction)})`;
}
const pathKey = (path) => path.length ? path.join(".") : "root";
export function mountCanonicalPredicateEditor(options) {
    const dom = options.host.ownerDocument;
    const candidates = Object.values(options.document.nodes).filter(({ id }) => id !== options.excludePropertyId);
    let draft = options.condition ? clone(options.condition) : undefined;
    const render = () => {
        options.host.replaceChildren();
        options.host.setAttribute("aria-label", options.label);
        options.host.dataset.conditionPresentation = "shared";
        const heading = dom.createElement("h4"), summary = dom.createElement("output"), tree = dom.createElement("div"), assistance = dom.createElement("output");
        heading.textContent = options.label;
        summary.setAttribute("aria-label", `${options.label} plain language`);
        summary.textContent = draft ? canonicalPredicateText(options.document, draft) : "No condition configured.";
        assistance.setAttribute("aria-label", `${options.label} validation`);
        renderSharedConditionTree(tree, {
            dom,
            ...(draft ? { condition: draft } : {}),
            properties: () => candidates.map(({ id, name, type }) => ({ id, name: `${name} · ${id}`, type })),
            id: (kind) => `${kind}:${crypto.randomUUID()}`,
            onChange: (condition) => {
                draft = condition;
                summary.textContent = draft ? canonicalPredicateText(options.document, draft) : "No condition configured.";
                assistance.textContent = "";
            },
        });
        const save = dom.createElement("button"), clear = dom.createElement("button"), testValue = dom.createElement("textarea"), test = dom.createElement("button"), testResult = dom.createElement("output");
        save.type = "button";
        save.textContent = options.saveLabel;
        save.addEventListener("click", () => {
            if (!draft) {
                assistance.textContent = "Add a condition or group.";
                tree.querySelector("button, select, input")?.focus({ preventScroll: true });
                return;
            }
            const validation = validateCanonicalPredicateTree(options.document, draft);
            assistance.textContent = validation.message;
            if (!validation.ready) {
                const key = pathKey(validation.path ?? []);
                const control = tree.querySelector(`[data-condition-path="${key}"] select, [data-condition-path="${key}"] input`);
                control?.focus({ preventScroll: true });
                return;
            }
            options.onSave(clone(draft));
        });
        clear.type = "button";
        clear.textContent = "Remove condition";
        clear.hidden = !options.onClear;
        clear.addEventListener("click", () => options.onClear?.());
        testValue.setAttribute("aria-label", `${options.label} test observation`);
        testValue.value = "{}";
        test.type = "button";
        test.textContent = "Test predicate observation";
        test.addEventListener("click", () => { try {
            if (!draft)
                throw new Error("Add a condition before testing.");
            const evidence = evaluateCanonicalPredicate(draft, options.document, JSON.parse(testValue.value));
            testResult.textContent = `${evidence.matched ? "Matched" : "Did not match"} · ${evidence.branches.map((branch) => `${branch.matched ? "satisfied" : "failed"}: ${branch.label}`).join(" · ")}`;
        }
        catch (error) {
            testResult.textContent = error instanceof Error ? error.message : String(error);
        } });
        options.host.append(heading, summary, tree, assistance, save, clear, testValue, test, testResult);
    };
    render();
}
//# sourceMappingURL=data-layer-canonical-predicate-editor.js.map