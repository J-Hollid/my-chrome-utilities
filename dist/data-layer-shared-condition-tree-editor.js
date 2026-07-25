const existence = ["Exists", "Does not exist"];
const operators = (type) => type === "number" || type === "integer" ? [...existence, "Equals", "Does not equal", "Greater than", "At least", "Less than", "At most"] : type === "boolean" || type === "null" ? [...existence, "Equals", "Does not equal"] : [...existence, "Equals", "Does not equal", "Starts with", "Contains", "Matches pattern"];
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const clone = (value) => structuredClone(value);
const withIds = (condition, id) => condition.kind === "predicate" ? { ...condition, id: condition.id ?? id("condition") } : { ...condition, id: condition.id ?? id("condition"), children: condition.children.map((child) => withIds(child, id)) };
export function renderSharedConditionTree(host, options) {
    const { dom } = options;
    let condition = options.condition ? withIds(clone(options.condition), options.id) : undefined;
    const render = () => {
        host.replaceChildren();
        host.setAttribute("aria-label", "Shared editable condition tree");
        const tree = dom.createElement("div"), controls = dom.createElement("fieldset"), search = dom.createElement("input"), property = dom.createElement("select"), operator = dom.createElement("select"), valueHost = dom.createElement("span");
        const properties = () => options.properties();
        const selected = () => properties().find(({ id, name }) => id === property.value || name === property.value);
        const renderValue = () => { valueHost.replaceChildren(); if (existence.includes(operator.value))
            return; const value = dom.createElement("input"); value.setAttribute("aria-label", "Typed condition value"); valueHost.append(value); };
        const renderProperties = () => { const query = search.value.trim().toLowerCase(), prior = property.value; property.replaceChildren(new Option("Choose property", ""), ...properties().filter(({ name, id }) => !query || name.toLowerCase().includes(query) || id.toLowerCase().includes(query)).map(({ name, id }) => new Option(name, id))); property.value = prior; };
        const renderOperators = () => { operator.replaceChildren(...operators(selected()?.type).map((entry) => new Option(entry, entry))); renderValue(); };
        const append = (node, path) => { const row = dom.createElement("article"); row.dataset.conditionId = node.id ?? ""; row.dataset.conditionPath = path.join(".") || "root"; row.append(Object.assign(dom.createElement("p"), { textContent: node.kind === "predicate" ? `${node.propertyId} ${node.operator}${node.value === undefined ? "" : ` ${String(node.value)}`}` : `${node.kind} (${node.children.length})` })); const replace = (next) => { if (!path.length) {
            condition = next;
            options.onChange(next);
            render();
            return;
        } const parent = path.slice(0, -1).reduce((candidate, index) => candidate && candidate.kind !== "predicate" ? candidate.children[index] : undefined, condition); if (!parent || parent.kind === "predicate")
            return; if (next)
            parent.children[path.at(-1)] = next;
        else
            parent.children.splice(path.at(-1), 1); options.onChange(condition); render(); }; row.append(button(dom, "View", () => { row.dataset.conditionMode = "view"; }), button(dom, "Edit", () => { row.dataset.conditionMode = "edit"; if (node.kind === "predicate") {
            const editor = dom.createElement("fieldset"), propertyInput = dom.createElement("input"), operatorInput = dom.createElement("select"), valueInput = dom.createElement("input");
            propertyInput.setAttribute("aria-label", "Edit condition property");
            propertyInput.value = node.propertyId;
            operatorInput.setAttribute("aria-label", "Edit condition operator");
            operatorInput.append(...operators(properties().find(({ id }) => id === node.propertyId)?.type).map((entry) => new Option(entry, entry)));
            operatorInput.value = node.operator;
            valueInput.setAttribute("aria-label", "Edit condition value");
            valueInput.value = String(node.value ?? "");
            const apply = button(dom, "Apply condition edit", () => { node.propertyId = propertyInput.value; node.operator = operatorInput.value; if (existence.includes(node.operator))
                delete node.value;
            else
                node.value = valueInput.value; options.onChange(condition); render(); });
            editor.append(labeled(dom, "Searchable property", propertyInput), labeled(dom, "Type-valid operator", operatorInput), labeled(dom, "Typed value", valueInput), apply);
            row.append(editor);
        } }), button(dom, "Add child", () => { if (node.kind === "predicate")
            return; node.children.push({ kind: "predicate", id: options.id("condition"), propertyId: properties()[0]?.id ?? "", operator: "Exists" }); options.onChange(condition); render(); }), button(dom, "Move", () => { if (!path.length)
            return; const parent = path.slice(0, -1).reduce((candidate, index) => candidate && candidate.kind !== "predicate" ? candidate.children[index] : undefined, condition); if (!parent || parent.kind === "predicate")
            return; const index = path.at(-1); const target = index === 0 ? 1 : index - 1; if (target < 0 || target >= parent.children.length)
            return; [parent.children[index], parent.children[target]] = [parent.children[target], parent.children[index]]; options.onChange(condition); render(); }), button(dom, "Remove", () => replace(undefined))); tree.append(row); if (node.kind !== "predicate")
            node.children.forEach((child, index) => append(child, [...path, index])); };
        if (condition)
            append(condition, []);
        else
            tree.textContent = "No condition configured.";
        search.type = "search";
        search.placeholder = "Search condition properties";
        search.setAttribute("aria-label", "Search condition properties");
        property.setAttribute("aria-label", "Condition property");
        operator.setAttribute("aria-label", "Type-valid operator");
        search.addEventListener("input", renderProperties);
        property.addEventListener("change", renderOperators);
        operator.addEventListener("change", renderValue);
        renderProperties();
        renderOperators();
        controls.append(labeled(dom, "Search properties", search), labeled(dom, "Condition property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", valueHost), button(dom, "Add predicate", () => { const choice = selected(); if (!choice)
            return; const next = { kind: "predicate", id: options.id("condition"), propertyId: choice.id, operator: operator.value, ...(existence.includes(operator.value) ? {} : { value: valueHost.querySelector("input")?.value ?? "" }) }; if (!condition)
            condition = { kind: "all", id: options.id("condition"), children: [next] };
        else if (condition.kind === "predicate")
            condition = { kind: "all", ...(condition.id ? { id: condition.id } : {}), children: [condition, next] };
        else
            condition.children.push(next); options.onChange(condition); render(); }));
        for (const kind of ["all", "any", "not"])
            controls.append(button(dom, `Add ${kind.toUpperCase()} group`, () => { const next = { kind, id: options.id("condition"), children: [] }; if (!condition)
                condition = next;
            else if (condition.kind === "predicate")
                condition = { kind: "all", id: options.id("condition"), children: [condition, next] };
            else
                condition.children.push(next); options.onChange(condition); render(); }));
        host.append(tree, controls);
    };
    render();
}
//# sourceMappingURL=data-layer-shared-condition-tree-editor.js.map