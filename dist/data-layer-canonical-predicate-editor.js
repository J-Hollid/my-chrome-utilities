import { evaluateCanonicalPredicate, } from "./data-layer-canonical-schema.js";
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
const groupLabel = (kind) => kind === "all" ? "All" : kind === "any" ? "Any" : "Not";
const pathKey = (path) => path.length ? path.join(".") : "root";
export function mountCanonicalPredicateEditor(options) {
    const dom = options.host.ownerDocument;
    const candidates = Object.values(options.document.nodes).filter(({ id }) => id !== options.excludePropertyId);
    let draft = clone(options.condition ?? { kind: "all", children: [] });
    if (draft.kind === "predicate")
        draft = { kind: "all", children: [draft] };
    const defaultLeaf = () => ({ kind: "predicate", propertyId: candidates[0]?.id ?? "", operator: "Exists" });
    const render = () => {
        options.host.replaceChildren();
        options.host.setAttribute("aria-label", options.label);
        const heading = dom.createElement("h4"), summary = dom.createElement("output"), assistance = dom.createElement("output");
        heading.textContent = options.label;
        summary.setAttribute("aria-label", `${options.label} plain language`);
        summary.textContent = canonicalPredicateText(options.document, draft);
        assistance.setAttribute("aria-label", `${options.label} validation`);
        const renderBranch = (branch, path, remove) => {
            const key = pathKey(path);
            if (branch.kind === "predicate") {
                const row = dom.createElement("fieldset"), legend = dom.createElement("legend"), property = dom.createElement("select"), operator = dom.createElement("select"), value = dom.createElement("input"), removeButton = dom.createElement("button");
                row.dataset.predicatePath = key;
                row.setAttribute("aria-label", `Predicate branch ${key}`);
                legend.textContent = `Predicate ${key}`;
                property.setAttribute("aria-label", `Predicate property ${key}`);
                property.append(new Option("Choose property", ""), ...candidates.map((node) => new Option(`${node.name} · ${node.id}`, node.id)));
                property.value = branch.propertyId;
                const propertyType = options.document.nodes[branch.propertyId]?.type;
                const operators = propertyType ? canonicalPredicateOperators(propertyType) : existenceOperators;
                operator.setAttribute("aria-label", `Predicate operator ${key}`);
                operator.append(...operators.map((entry) => new Option(entry, entry)));
                operator.value = operators.includes(branch.operator) ? branch.operator : operators[0];
                value.setAttribute("aria-label", `Predicate value ${key}`);
                value.value = leafInput(branch);
                value.hidden = existenceOperators.includes(operator.value);
                property.addEventListener("change", () => { branch.propertyId = property.value; branch.operator = "Exists"; delete branch.value; render(); });
                operator.addEventListener("change", () => { branch.operator = operator.value; if (existenceOperators.includes(branch.operator))
                    delete branch.value;
                else if (branch.value === undefined)
                    branch.value = ""; render(); });
                value.addEventListener("input", () => { const parsed = canonicalPredicateLeafFromInput(options.document, branch.propertyId, branch.operator, value.value); if (parsed.ready) {
                    branch.value = parsed.predicate.value;
                    value.setCustomValidity("");
                }
                else {
                    branch.value = value.value;
                    value.setCustomValidity(parsed.message);
                } summary.textContent = canonicalPredicateText(options.document, draft); });
                removeButton.type = "button";
                removeButton.textContent = `Remove predicate ${key}`;
                removeButton.hidden = !remove;
                removeButton.addEventListener("click", () => { remove?.(); render(); });
                row.append(legend, property, operator, value, removeButton);
                return row;
            }
            const group = dom.createElement("fieldset"), legend = dom.createElement("legend"), kind = dom.createElement("select"), children = dom.createElement("div");
            group.dataset.predicatePath = key;
            group.setAttribute("aria-label", `${groupLabel(branch.kind)} predicate group ${key}`);
            legend.textContent = `${groupLabel(branch.kind)} group ${key}`;
            kind.setAttribute("aria-label", `Predicate group ${key}`);
            kind.append(...["all", "any", "not"].map((entry) => new Option(groupLabel(entry), entry)));
            kind.value = branch.kind;
            kind.addEventListener("change", () => { branch.kind = kind.value; if (branch.kind === "not" && branch.children.length > 1)
                branch.children.splice(1); render(); });
            const append = (child) => { if (branch.kind === "not")
                branch.children.splice(0, branch.children.length, child);
            else
                branch.children.push(child); render(); };
            const addPredicate = dom.createElement("button");
            addPredicate.type = "button";
            addPredicate.textContent = `Add predicate to ${groupLabel(branch.kind)} ${key}`;
            addPredicate.addEventListener("click", () => append(defaultLeaf()));
            group.append(legend, kind, addPredicate);
            for (const childKind of ["all", "any", "not"]) {
                const add = dom.createElement("button");
                add.type = "button";
                add.textContent = `Add ${groupLabel(childKind)} group to ${groupLabel(branch.kind)} ${key}`;
                add.addEventListener("click", () => append({ kind: childKind, children: [] }));
                group.append(add);
            }
            if (remove) {
                const removeButton = dom.createElement("button");
                removeButton.type = "button";
                removeButton.textContent = `Remove ${groupLabel(branch.kind)} group ${key}`;
                removeButton.addEventListener("click", () => { remove(); render(); });
                group.append(removeButton);
            }
            branch.children.forEach((child, index) => children.append(renderBranch(child, [...path, index], () => branch.children.splice(index, 1))));
            group.append(children);
            return group;
        };
        const save = dom.createElement("button"), clear = dom.createElement("button"), testValue = dom.createElement("textarea"), test = dom.createElement("button"), testResult = dom.createElement("output");
        save.type = "button";
        save.textContent = options.saveLabel;
        save.addEventListener("click", () => { const validation = validateCanonicalPredicateTree(options.document, draft); assistance.textContent = validation.message; if (!validation.ready) {
            const control = options.host.querySelector(`[data-predicate-path="${pathKey(validation.path ?? [])}"] select, [data-predicate-path="${pathKey(validation.path ?? [])}"] input`);
            control?.focus({ preventScroll: true });
            return;
        } options.onSave(clone(draft)); });
        clear.type = "button";
        clear.textContent = "Remove condition";
        clear.hidden = !options.onClear;
        clear.addEventListener("click", () => options.onClear?.());
        testValue.setAttribute("aria-label", `${options.label} test observation`);
        testValue.value = "{}";
        test.type = "button";
        test.textContent = "Test predicate observation";
        test.addEventListener("click", () => { try {
            const evidence = evaluateCanonicalPredicate(draft, options.document, JSON.parse(testValue.value));
            testResult.textContent = `${evidence.matched ? "Matched" : "Did not match"} · ${evidence.branches.map((branch) => `${branch.matched ? "satisfied" : "failed"}: ${branch.label}`).join(" · ")}`;
        }
        catch (error) {
            testResult.textContent = error instanceof Error ? error.message : String(error);
        } });
        options.host.append(heading, summary, renderBranch(draft, []), assistance, save, clear, testValue, test, testResult);
    };
    render();
}
//# sourceMappingURL=data-layer-canonical-predicate-editor.js.map