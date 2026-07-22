import { canonicalCommandOutcome, canonicalPropertyPath, canonicalTableRows, evaluateCanonicalPredicate } from "./data-layer-canonical-schema.js";
import { mountCanonicalPredicateEditor } from "./data-layer-canonical-predicate-editor.js";
const dom = globalThis.document;
const types = ["string", "number", "integer", "boolean", "object", "array", "null"];
const provenanceText = (node) => node.provenance.map(({ source, contributorName, scope, state }) => contributorName ? `${scope} ${contributorName} ${state}` : source).join(" → ");
const inheritsFromParent = (node) => node.provenance.some(({ state }) => state === "inherited" || state === "shadowed");
const labeled = (text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const select = (name, values, value) => { const control = dom.createElement("select"); control.name = name; for (const entry of values)
    control.append(new Option(entry, entry)); control.value = value; return control; };
export function bindCanonicalPropertySearch(control, update) { control.addEventListener("input", () => update(control.value)); }
export function canonicalDispatchRequiresLocalRender(result, renderAfterDispatch) { return renderAfterDispatch !== false || result.status === "confirmation-required"; }
export function mountCanonicalSchemaEditor(options) {
    let query = "", feedback = options.initialFeedback ?? "", pendingType;
    const send = (command) => { const prior = options.load(), result = options.dispatch(command); if (result.status === "conflict")
        feedback = result.message; if (result.status === "confirmation-required" && command.kind === "type") {
        pendingType = { result, command };
        feedback = result.impact;
    }
    else if (result.status === "applied" || result.status === "rebased") {
        pendingType = undefined;
        feedback = canonicalCommandOutcome(command, result, prior);
    } if (canonicalDispatchRequiresLocalRender(result, options.renderAfterDispatch) && options.host.isConnected)
        render(); return result; };
    const propertyCommand = (document, kind) => { const propertyId = document.selectedPropertyId; if (!propertyId)
        return; if (kind === "rename") {
        const name = options.host.querySelector('[name="propertyName"]')?.value.trim();
        if (name)
            send({ kind, baseRevision: document.revision, propertyId, name });
    }
    else if (kind === "duplicate")
        send({ kind, baseRevision: document.revision, propertyId, id: options.id });
    else
        send({ kind, baseRevision: document.revision, propertyId }); };
    const renderPredicate = (host, document, predicate) => { const fieldset = dom.createElement("fieldset"), legend = dom.createElement("legend"), group = select("predicateGroup", ["all", "any", "not"], predicate?.kind !== "predicate" ? predicate?.kind ?? "all" : "all"), property = select("predicateProperty", Object.keys(document.nodes), predicate?.kind === "predicate" ? predicate.propertyId : ""), operator = select("predicateOperator", ["Equals", "Does not equal", "Exists", "Does not exist", "Starts with", "Contains", "Matches pattern", "Greater than", "At least", "Less than", "At most"], predicate?.kind === "predicate" ? predicate.operator : "Equals"), value = input("predicateValue", predicate?.kind === "predicate" ? String(predicate.value ?? "") : ""); legend.textContent = "Nested All / Any / Not predicate builder"; for (const option of Array.from(property.options))
        option.textContent = document.nodes[option.value]?.name ?? option.value; property.prepend(new Option("Choose property", "")); const summary = dom.createElement("p"), testValue = dom.createElement("textarea"), test = dom.createElement("button"), result = dom.createElement("output"); summary.textContent = predicate ? plainPredicate(predicate, document) : "All group · add a property predicate"; testValue.setAttribute("aria-label", "Predicate test observation"); testValue.value = "{}"; test.type = "button"; test.textContent = "Test matching and non-matching observations"; test.addEventListener("click", () => { if (!predicate)
        return; try {
        const evidence = evaluateCanonicalPredicate(predicate, document, JSON.parse(testValue.value));
        result.textContent = `${evidence.matched ? "Matched" : "Did not match"} · ${evidence.branches.map((branch) => `${branch.matched ? "satisfied" : "failed"}: ${branch.label}`).join(" · ")}`;
    }
    catch (error) {
        result.textContent = error instanceof Error ? error.message : String(error);
    } }); fieldset.append(legend, labeled("Group", group), labeled("Property", property), labeled("Typed operator", operator), labeled("Typed value", value), summary, testValue, test, result); host.append(fieldset); };
    function render() {
        const document = options.load();
        options.host.replaceChildren();
        options.host.setAttribute("aria-label", `${options.surface} canonical schema editor`);
        options.host.dataset.canonicalSchemaId = document.id;
        options.host.dataset.canonicalRevision = String(document.revision);
        const header = dom.createElement("header"), title = dom.createElement("h2"), state = dom.createElement("p"), undo = dom.createElement("button"), redo = dom.createElement("button"), baseRevision = input("commandBaseRevision", String(document.revision), "number"), search = dom.createElement("input"), filter = select("propertyFilter", ["All properties", "With conditions", "With documentation", "With issues"], "All properties"), views = dom.createElement("div"), treeView = dom.createElement("button"), tableView = dom.createElement("button"), navigator = dom.createElement("section"), results = dom.createElement("section"), editor = dom.createElement("section"), preview = dom.createElement("section"), status = dom.createElement("output"), advanced = dom.createElement("details"), advancedSummary = dom.createElement("summary"), advancedJson = dom.createElement("textarea");
        title.textContent = document.contributorName;
        state.setAttribute("aria-label", "Canonical Draft status");
        state.textContent = `Draft · ${document.source ? `source ${document.source.identity} revision ${document.source.revision}` : "no source revision"} · lineage ${document.source?.provenance ?? "project-created"} · Saved · Draft token ${document.revision}`;
        undo.type = redo.type = "button";
        undo.textContent = "Undo";
        redo.textContent = "Redo";
        undo.disabled = !options.onUndo;
        redo.disabled = !options.onRedo;
        undo.addEventListener("click", () => options.onUndo?.());
        redo.addEventListener("click", () => options.onRedo?.());
        baseRevision.min = "0";
        baseRevision.setAttribute("aria-label", "Command base revision");
        header.append(title, state, undo, redo, labeled("Command base revision", baseRevision));
        const refreshResults = () => {
            results.replaceChildren();
            const rows = canonicalTableRows(document).filter(({ node }) => node.name.toLowerCase().includes(query.toLowerCase()));
            if (document.view === "tree") {
                const tree = dom.createElement("ul");
                tree.setAttribute("aria-label", "Canonical property tree");
                for (const row of rows) {
                    const item = dom.createElement("li"), choose = dom.createElement("button");
                    item.style.paddingInlineStart = `${row.depth * 1.25}rem`;
                    choose.type = "button";
                    choose.textContent = `${row.node.name} · ${row.path} · ${row.node.type} · ${provenanceText(row.node)}`;
                    choose.dataset.propertyId = row.id;
                    choose.setAttribute("aria-current", String(row.selected));
                    choose.addEventListener("click", () => send({ kind: "select", baseRevision: document.revision, propertyId: row.id }));
                    item.append(choose);
                    tree.append(item);
                }
                results.append(tree);
            }
            else {
                const table = dom.createElement("table"), head = dom.createElement("thead"), body = dom.createElement("tbody");
                table.setAttribute("aria-label", "Complete canonical schema table");
                head.innerHTML = "<tr><th>Property</th><th>Path</th><th>Type</th><th>Presence</th><th>Expected or allowed values</th><th>Conditions</th><th>Rules</th><th>Documentation</th><th>Example</th><th>Source</th><th>Local state</th><th>Validation state</th><th>Actions</th></tr>";
                for (const row of rows) {
                    const tr = dom.createElement("tr"), choose = dom.createElement("button"), type = select(`inlineType-${row.id}`, types, row.node.type), presence = select(`inlinePresence-${row.id}`, ["optional", "required", "required-when", "forbidden", "forbidden-when"], row.node.presence.mode), values = input(`inlineValues-${row.id}`, row.node.allowedValues.map(({ value }) => String(value)).join(", ")), expected = input(`inlineExpected-${row.id}`, String(row.node.expectedValue ?? "")), documentation = input(`inlineDocumentation-${row.id}`, row.node.documentation.description), example = input(`inlineExample-${row.id}`, String(row.node.documentation.example.value ?? "")), valueGroup = dom.createElement("div"), actions = dom.createElement("div"), addChild = dom.createElement("button"), addSibling = dom.createElement("button"), rename = dom.createElement("button"), duplicate = dom.createElement("button"), move = dom.createElement("button"), remove = dom.createElement("button"), reveal = dom.createElement("button");
                    choose.type = "button";
                    choose.textContent = `${"› ".repeat(row.depth)}${row.node.name}`;
                    choose.dataset.propertyId = row.id;
                    choose.setAttribute("aria-expanded", String(row.selected));
                    choose.addEventListener("click", () => send({ kind: "select", baseRevision: document.revision, propertyId: row.id }));
                    type.setAttribute("aria-label", `${row.path} inline type`);
                    presence.setAttribute("aria-label", `${row.path} inline presence`);
                    values.setAttribute("aria-label", `${row.path} inline allowed values`);
                    expected.setAttribute("aria-label", `${row.path} inline expected value`);
                    documentation.setAttribute("aria-label", `${row.path} inline documentation`);
                    example.setAttribute("aria-label", `${row.path} inline example`);
                    type.addEventListener("change", () => send({ kind: "type", baseRevision: document.revision, propertyId: row.id, type: type.value, ...(type.value === "array" ? { itemType: row.node.itemType ?? "string" } : {}) }));
                    presence.addEventListener("change", () => send({ kind: "set", baseRevision: document.revision, propertyId: row.id, patch: { presence: { mode: presence.value, ...(presence.value.endsWith("-when") && row.node.presence.condition ? { condition: row.node.presence.condition } : {}) } } }));
                    values.addEventListener("change", () => send({ kind: "set", baseRevision: document.revision, propertyId: row.id, patch: { allowedValues: values.value.split(",").map((value) => value.trim()).filter(Boolean).map((value, index) => ({ id: row.node.allowedValues[index]?.id ?? options.id("allowed-value"), value })) } }));
                    expected.addEventListener("change", () => send({ kind: "set", baseRevision: document.revision, propertyId: row.id, patch: { expectedValue: expected.value || undefined } }));
                    documentation.addEventListener("change", () => send({ kind: "set", baseRevision: document.revision, propertyId: row.id, patch: { documentation: { ...row.node.documentation, description: documentation.value } } }));
                    example.addEventListener("change", () => send({ kind: "set", baseRevision: document.revision, propertyId: row.id, patch: { documentation: { ...row.node.documentation, example: example.value ? { method: "custom", value: example.value } : { method: "blank" } } } }));
                    valueGroup.append(labeled("Expected", expected), labeled("Allowed", values));
                    for (const [button, text] of [[addChild, "Add child"], [addSibling, "Add sibling"], [rename, "Rename"], [duplicate, "Duplicate"], [move, "Move"], [remove, "Delete"], [reveal, "Reveal complex row detail"]]) {
                        button.type = "button";
                        button.textContent = text;
                    }
                    addChild.addEventListener("click", () => send({ kind: "add", baseRevision: document.revision, parentId: row.id, name: "child", type: "string", id: options.id }));
                    addSibling.addEventListener("click", () => send({ kind: "add", baseRevision: document.revision, ...(row.node.parentId ? { parentId: row.node.parentId } : {}), afterId: row.id, name: "property", type: "string", id: options.id }));
                    rename.addEventListener("click", () => { const next = prompt(`Rename ${row.node.name}`, row.node.name)?.trim(); if (next)
                        send({ kind: "rename", baseRevision: document.revision, propertyId: row.id, name: next }); });
                    duplicate.addEventListener("click", () => send({ kind: "duplicate", baseRevision: document.revision, propertyId: row.id, id: options.id }));
                    move.addEventListener("click", () => send({ kind: "move", baseRevision: document.revision, propertyId: row.id }));
                    remove.addEventListener("click", () => send({ kind: "delete", baseRevision: document.revision, propertyId: row.id }));
                    reveal.addEventListener("click", () => send({ kind: "select", baseRevision: document.revision, propertyId: row.id }));
                    actions.className = "canonical-inline-row-actions";
                    actions.append(addChild, addSibling, rename, duplicate, move, remove, reveal);
                    const cells = [choose, row.path, type, presence, valueGroup, row.node.presence.condition ? plainPredicate(row.node.presence.condition, document) : "Always", String(row.node.rules.length), documentation, example, provenanceText(row.node), row.node.provenance.at(-1)?.state ?? "Local canonical definition", row.validationState, actions];
                    for (const value of cells) {
                        const cell = dom.createElement("td");
                        if (value instanceof HTMLElement)
                            cell.append(value);
                        else
                            cell.textContent = value;
                        tr.append(cell);
                    }
                    body.append(tr);
                }
                table.append(head, body);
                results.append(table);
            }
        };
        search.type = "search";
        search.setAttribute("aria-label", "Canonical property search");
        search.placeholder = "Search properties";
        search.value = query;
        bindCanonicalPropertySearch(search, (next) => { query = next; refreshResults(); });
        treeView.type = tableView.type = "button";
        treeView.textContent = "Tree";
        tableView.textContent = "Table";
        treeView.setAttribute("aria-pressed", String(document.view === "tree"));
        tableView.setAttribute("aria-pressed", String(document.view === "table"));
        treeView.addEventListener("click", () => send({ kind: "view", baseRevision: document.revision, view: "tree" }));
        tableView.addEventListener("click", () => send({ kind: "view", baseRevision: document.revision, view: "table" }));
        views.append(treeView, tableView);
        results.setAttribute("aria-label", "Canonical property search results");
        navigator.setAttribute("aria-label", "Canonical property navigator");
        navigator.append(search, filter, views, results);
        refreshResults();
        const rootName = input("newRootPropertyName", "property"), addRoot = dom.createElement("button");
        rootName.setAttribute("aria-label", "New root property name");
        addRoot.type = "button";
        addRoot.textContent = "Add root property";
        addRoot.addEventListener("click", () => { const name = rootName.value.trim(); if (!name) {
            rootName.setCustomValidity("Enter a property name");
            rootName.reportValidity();
            return;
        } rootName.setCustomValidity(""); send({ kind: "add", baseRevision: Number(baseRevision.value), name, type: "string", id: options.id }); });
        navigator.append(labeled("New root property name", rootName), addRoot);
        const selected = document.selectedPropertyId ? document.nodes[document.selectedPropertyId] : undefined;
        if (selected)
            renderPropertyEditor(editor, document, selected, send, options.id, propertyCommand, pendingType);
        else {
            const empty = dom.createElement("p");
            empty.textContent = "This canonical property tree is empty. Add root property is the recommended next action.";
            editor.append(empty);
        }
        preview.setAttribute("aria-label", "Effective documentation preview");
        const previewHeading = dom.createElement("h3");
        previewHeading.textContent = "Effective documentation";
        const previewText = dom.createElement("p");
        previewText.textContent = selected ? [selected.documentation.displayText, selected.documentation.description, selected.documentation.comments].filter(Boolean).join(" · ") || "No documentation yet." : "Select a property.";
        preview.append(previewHeading, previewText);
        status.setAttribute("role", "status");
        status.setAttribute("aria-label", "Canonical command result");
        status.textContent = feedback;
        advancedSummary.textContent = "Advanced JSON (optional)";
        advancedJson.readOnly = true;
        advancedJson.setAttribute("aria-label", "Canonical schema Advanced JSON");
        advanced.addEventListener("toggle", () => { if (advanced.open && !advancedJson.value)
            advancedJson.value = JSON.stringify(options.load(), null, 2); });
        advanced.append(advancedSummary, advancedJson);
        options.host.append(header, navigator, editor, preview, status, advanced);
    }
    render();
    return { render };
}
function plainPredicate(predicate, document) { if (predicate.kind === "predicate")
    return `${document.nodes[predicate.propertyId]?.name ?? "Unresolved property"} ${predicate.operator}${predicate.value === undefined ? "" : ` ${String(predicate.value)}`}`; return `${predicate.kind === "all" ? "All" : predicate.kind === "any" ? "Any" : "Not"} (${predicate.children.map((child) => plainPredicate(child, document)).join(predicate.kind === "any" ? " or " : " and ")})`; }
function renderPropertyEditor(host, document, node, send, id, propertyCommand, pending) {
    host.setAttribute("aria-label", "Complete selected-property editor");
    const heading = dom.createElement("h3"), path = dom.createElement("p"), structure = dom.createElement("div"), name = input("propertyName", node.name), rename = dom.createElement("button"), addChild = dom.createElement("button"), addSibling = dom.createElement("button"), duplicate = dom.createElement("button"), move = dom.createElement("button"), remove = dom.createElement("button");
    heading.textContent = node.name;
    path.textContent = `Generated path ${canonicalPropertyPath(document, node.id)} · stable identity ${node.id} · provenance ${provenanceText(node)}`;
    for (const [button, text] of [[rename, "Rename"], [addChild, "Add child"], [addSibling, "Add sibling"], [duplicate, "Duplicate"], [move, "Move"], [remove, inheritsFromParent(node) ? "Reset to parents" : "Delete"]]) {
        button.type = "button";
        button.textContent = text;
    }
    rename.addEventListener("click", () => propertyCommand(document, "rename"));
    addChild.addEventListener("click", () => send({ kind: "add", baseRevision: document.revision, parentId: node.id, name: "child", type: "string", id }));
    addSibling.addEventListener("click", () => send({ kind: "add", baseRevision: document.revision, ...(node.parentId ? { parentId: node.parentId } : {}), afterId: node.id, name: "property", type: "string", id }));
    duplicate.addEventListener("click", () => propertyCommand(document, "duplicate"));
    move.addEventListener("click", () => { const parentId = host.querySelector('[name="moveParent"]')?.value || undefined; send({ kind: "move", baseRevision: document.revision, propertyId: node.id, ...(parentId ? { parentId } : {}) }); });
    remove.addEventListener("click", () => propertyCommand(document, "delete"));
    const moveParent = select("moveParent", Object.keys(document.nodes).filter((candidate) => candidate !== node.id), node.parentId ?? "");
    moveParent.prepend(new Option("Root", ""));
    for (const option of Array.from(moveParent.options))
        if (option.value)
            option.textContent = document.nodes[option.value]?.name ?? option.value;
    structure.append(labeled("Property name", name), rename, addChild, addSibling, duplicate, labeled("Move under", moveParent), move, remove);
    const pendingHere = pending?.result.propertyId === node.id ? pending : undefined, typeSection = dom.createElement("fieldset"), typeLegend = dom.createElement("legend"), type = select("propertyType", types, pendingHere?.command.type ?? node.type), itemType = select("itemType", types, pendingHere?.command.itemType ?? node.itemType ?? "string"), impact = dom.createElement("output"), confirm = dom.createElement("button");
    typeLegend.textContent = "Scalar, object, array, and item type";
    type.addEventListener("change", () => { const result = send({ kind: "type", baseRevision: document.revision, propertyId: node.id, type: type.value, ...(type.value === "array" ? { itemType: itemType.value } : {}) }); if (result.status === "confirmation-required")
        impact.textContent = result.impact; });
    itemType.addEventListener("change", () => send({ kind: "type", baseRevision: document.revision, propertyId: node.id, type: "array", itemType: itemType.value }));
    confirm.type = "button";
    confirm.textContent = "Confirm destructive type change";
    confirm.hidden = !pendingHere;
    confirm.addEventListener("click", () => { if (pendingHere)
        send({ ...pendingHere.command, baseRevision: document.revision, confirmed: true }); });
    impact.textContent = pendingHere?.result.impact ?? "Impact review: no incompatible dependent data";
    typeSection.append(typeLegend, labeled("Property type", type), labeled("Array item type", itemType), impact, confirm);
    const presence = select("presenceMode", ["optional", "required", "required-when", "forbidden", "forbidden-when"], node.presence.mode), presenceSection = dom.createElement("section");
    presence.addEventListener("change", () => send({ kind: "set", baseRevision: document.revision, propertyId: node.id, patch: { presence: { mode: presence.value, ...(presence.value.endsWith("-when") && node.presence.condition ? { condition: node.presence.condition } : {}) } } }));
    presenceSection.append(labeled("Presence", presence));
    const predicateHost = dom.createElement("div");
    if (node.presence.mode.endsWith("-when")) {
        const predicate = node.presence.condition, draft = predicate && predicate.kind !== "predicate" ? structuredClone(predicate) : { kind: "all", children: predicate ? [structuredClone(predicate)] : [] }, builder = dom.createElement("fieldset"), legend = dom.createElement("legend"), target = dom.createElement("select"), property = select("predicateProperty", Object.keys(document.nodes), predicate?.kind === "predicate" ? predicate.propertyId : ""), operator = select("predicateOperator", ["Equals", "Does not equal", "Exists", "Does not exist", "Starts with", "Contains", "Matches pattern", "Greater than", "At least", "Less than", "At most"], predicate?.kind === "predicate" ? predicate.operator : "Equals"), value = input("predicateValue", predicate?.kind === "predicate" ? String(predicate.value ?? "") : ""), save = dom.createElement("button"), addPredicate = dom.createElement("button"), all = dom.createElement("button"), any = dom.createElement("button"), not = dom.createElement("button"), summary = dom.createElement("output"), testValue = dom.createElement("textarea"), test = dom.createElement("button"), testResult = dom.createElement("output");
        builder.setAttribute("aria-label", `Nested conditional presence for ${canonicalPropertyPath(document, node.id)}`);
        legend.textContent = "Nested All / Any / Not predicate builder";
        target.name = "predicateTargetGroup";
        target.setAttribute("aria-label", "Predicate target group");
        for (const option of Array.from(property.options))
            option.textContent = document.nodes[option.value]?.name ?? option.value;
        property.prepend(new Option("Choose property", ""));
        summary.setAttribute("aria-label", "Predicate draft in plain language");
        testValue.setAttribute("aria-label", "Predicate test observation");
        testValue.value = "{}";
        testResult.setAttribute("aria-label", "Predicate branch evidence");
        const groupEntries = () => { const entries = []; const visit = (group, path) => { entries.push({ path, group, label: `${group.kind === "all" ? "All" : group.kind === "any" ? "Any" : "Not"} ${path.length ? path.join(".") : "root"}` }); group.children.forEach((child, index) => { if (child.kind !== "predicate")
            visit(child, [...path, index]); }); }; visit(draft, []); return entries; };
        const refresh = () => { const selected = target.value; target.replaceChildren(...groupEntries().map(({ path, label }) => new Option(label, path.join(".")))); if (Array.from(target.options).some(({ value: option }) => option === selected))
            target.value = selected; summary.textContent = plainPredicate(draft, document); };
        const selectedGroup = () => groupEntries().find(({ path }) => path.join(".") === target.value)?.group ?? draft;
        const addGroup = (kind) => { const group = selectedGroup(); if (group.kind === "not" && group.children.length) {
            target.setCustomValidity("Not accepts one branch");
            return;
        } target.setCustomValidity(""); group.children.push({ kind, children: [] }); refresh(); };
        const typedLeaf = () => { const referenced = document.nodes[property.value]; if (!referenced) {
            property.setCustomValidity("Choose a referenced property");
            return;
        } const numeric = ["Greater than", "At least", "Less than", "At most"].includes(operator.value), textual = ["Starts with", "Contains", "Matches pattern"].includes(operator.value); if (numeric && !["number", "integer"].includes(referenced.type)) {
            operator.setCustomValidity(`${operator.value} requires a number or integer property`);
            return;
        } if (textual && referenced.type !== "string") {
            operator.setCustomValidity(`${operator.value} requires a string property`);
            return;
        } operator.setCustomValidity(""); property.setCustomValidity(""); let typedValue = value.value; if (referenced.type === "number" || referenced.type === "integer") {
            typedValue = Number(value.value);
            if (!Number.isFinite(typedValue)) {
                value.setCustomValidity("Enter a compatible numeric value");
                return;
            }
        }
        else if (referenced.type === "boolean") {
            if (!["true", "false"].includes(value.value)) {
                value.setCustomValidity("Enter true or false");
                return;
            }
            typedValue = value.value === "true";
        } value.setCustomValidity(""); return { kind: "predicate", propertyId: property.value, operator: operator.value, ...(!["Exists", "Does not exist"].includes(operator.value) ? { value: typedValue } : {}) }; };
        addPredicate.type = "button";
        addPredicate.textContent = "Add predicate";
        addPredicate.addEventListener("click", () => { const leaf = typedLeaf(); if (!leaf)
            return; const group = selectedGroup(); if (group.kind === "not" && group.children.length) {
            target.setCustomValidity("Not accepts one branch");
            return;
        } group.children.push(leaf); refresh(); });
        for (const [control, text, kind] of [[all, "Add All group", "all"], [any, "Add Any group", "any"], [not, "Add Not group", "not"]]) {
            control.type = "button";
            control.textContent = text;
            control.addEventListener("click", () => addGroup(kind));
        }
        save.type = "button";
        save.textContent = "Save typed predicate";
        save.addEventListener("click", () => { if (!draft.children.length) {
            const leaf = typedLeaf();
            if (!leaf)
                return;
            draft.children.push(leaf);
        } send({ kind: "set", baseRevision: document.revision, propertyId: node.id, patch: { presence: { mode: node.presence.mode, condition: draft } } }); });
        test.type = "button";
        test.textContent = "Test predicate observation";
        test.addEventListener("click", () => { try {
            const evidence = evaluateCanonicalPredicate(draft, document, JSON.parse(testValue.value));
            testResult.textContent = `${evidence.matched ? "Matched" : "Did not match"} · ${evidence.branches.map((branch) => `${branch.matched ? "satisfied" : "failed"}: ${branch.label}`).join(" · ")}`;
        }
        catch (error) {
            testResult.textContent = error instanceof Error ? error.message : String(error);
        } });
        builder.append(legend, labeled("Target group", target), all, any, not, labeled("Property", property), labeled("Typed operator", operator), labeled("Typed value", value), addPredicate, summary, save, testValue, test, testResult);
        refresh();
        predicateHost.append(builder);
    }
    const values = dom.createElement("fieldset"), valuesLegend = dom.createElement("legend"), valuesList = dom.createElement("div"), addValue = dom.createElement("button");
    valuesLegend.textContent = "Allowed values";
    node.allowedValues.forEach((entry, index) => { const row = dom.createElement("div"), value = input(`allowedValue-${entry.id}`, String(entry.value)), remove = dom.createElement("button"), up = dom.createElement("button"), down = dom.createElement("button"); value.setAttribute("aria-label", `Allowed value ${index + 1}`); remove.type = up.type = down.type = "button"; remove.textContent = "Remove"; up.textContent = "Move up"; down.textContent = "Move down"; const commit = (next) => send({ kind: "set", baseRevision: document.revision, propertyId: node.id, patch: { allowedValues: next } }); value.addEventListener("change", () => commit(node.allowedValues.map((candidate) => candidate.id === entry.id ? { ...candidate, value: value.value } : candidate))); remove.addEventListener("click", () => commit(node.allowedValues.filter(({ id }) => id !== entry.id))); up.addEventListener("click", () => { if (index === 0)
        return; const next = structuredClone(node.allowedValues); [next[index - 1], next[index]] = [next[index], next[index - 1]]; commit(next); }); down.addEventListener("click", () => { if (index === node.allowedValues.length - 1)
        return; const next = structuredClone(node.allowedValues); [next[index], next[index + 1]] = [next[index + 1], next[index]]; commit(next); }); value.addEventListener("keydown", (event) => { if (event.altKey && event.key === "ArrowUp")
        up.click(); if (event.altKey && event.key === "ArrowDown")
        down.click(); }); row.append(labeled(`Value ${index + 1}`, value), remove, up, down); valuesList.append(row); });
    addValue.type = "button";
    addValue.textContent = "Add value";
    addValue.addEventListener("click", () => send({ kind: "set", baseRevision: document.revision, propertyId: node.id, patch: { allowedValues: [...node.allowedValues, { id: id("allowed-value"), value: "" }] } }));
    values.append(valuesLegend, valuesList, addValue);
    const rules = dom.createElement("details"), rulesSummary = dom.createElement("summary"), ruleKind = select("ruleKind", ["pattern", "range", "cardinality", "condition", "custom"], "pattern"), severity = select("ruleSeverity", ["error", "warning"], "error"), message = input("ruleMessage"), pattern = input("rulePattern"), minimum = input("ruleMinimum", "", "number"), maximum = input("ruleMaximum", "", "number"), reusable = input("reusableRuleId"), addRule = dom.createElement("button"), ruleList = dom.createElement("ul");
    rulesSummary.textContent = "Add rule";
    for (const rule of node.rules) {
        const item = dom.createElement("li"), description = dom.createElement("p"), predicateHost = dom.createElement("section");
        description.textContent = `${rule.kind} · ${rule.severity} · ${rule.message}${rule.reusableRuleId ? ` · reusable ${rule.reusableRuleId}` : ""}${rule.condition ? ` · ${plainPredicate(rule.condition, document)}` : ""}`;
        mountCanonicalPredicateEditor({ host: predicateHost, document, ...(rule.condition ? { condition: rule.condition } : {}), label: `Nested rule predicate for ${rule.id}`, saveLabel: "Save nested rule predicate", onSave: (condition) => send({ kind: "set", baseRevision: document.revision, propertyId: node.id, patch: { rules: node.rules.map((candidate) => candidate.id === rule.id ? { ...candidate, condition } : candidate) } }), ...(rule.condition ? { onClear: () => send({ kind: "set", baseRevision: document.revision, propertyId: node.id, patch: { rules: node.rules.map((candidate) => { if (candidate.id !== rule.id)
                            return candidate; const { condition: _condition, ...withoutCondition } = candidate; return withoutCondition; }) } }) } : {}) });
        item.append(description, predicateHost);
        ruleList.append(item);
    }
    addRule.type = "button";
    addRule.textContent = "Save structured rule";
    addRule.addEventListener("click", () => send({ kind: "set", baseRevision: document.revision, propertyId: node.id, patch: { rules: [...node.rules, { id: id("rule"), kind: ruleKind.value, severity: severity.value, message: message.value, ...(pattern.value ? { pattern: pattern.value } : {}), ...(minimum.value ? { minimum: Number(minimum.value) } : {}), ...(maximum.value ? { maximum: Number(maximum.value) } : {}), ...(reusable.value ? { reusableRuleId: reusable.value } : {}) }] } }));
    rules.append(rulesSummary, ruleList, labeled("Type-aware rule", ruleKind), labeled("Regular expression", pattern), labeled("Minimum / min items", minimum), labeled("Maximum / max items", maximum), labeled("Severity", severity), labeled("Issue message", message), labeled("Reusable rule", reusable), addRule);
    const documentation = dom.createElement("fieldset"), documentationLegend = dom.createElement("legend"), display = input("displayText", node.documentation.displayText), description = dom.createElement("textarea"), comments = dom.createElement("textarea"), method = select("exampleMethod", ["allowed-value", "custom", "blank"], node.documentation.example.method), example = input("exampleValue", String(node.documentation.example.value ?? "")), saveDocumentation = dom.createElement("button");
    documentationLegend.textContent = "Documentation and typed example";
    description.name = "description";
    description.value = node.documentation.description;
    comments.name = "comments";
    comments.value = node.documentation.comments;
    saveDocumentation.type = "button";
    saveDocumentation.textContent = "Save documentation";
    saveDocumentation.addEventListener("click", () => send({ kind: "set", baseRevision: document.revision, propertyId: node.id, patch: { documentation: { displayText: display.value, description: description.value, comments: comments.value, example: { method: method.value, ...(method.value !== "blank" ? { value: example.value } : {}) } } } }));
    documentation.append(documentationLegend, labeled("Display text", display), labeled("Description", description), labeled("Comments", comments), labeled("Example selection", method), labeled("Typed example", example), saveDocumentation);
    const contribution = dom.createElement("fieldset"), contributionLegend = dom.createElement("legend"), expected = input("expectedValue", String(node.expectedValue ?? "")), enforcement = select("enforcement", ["", "invariant", "overridable"], node.enforcement ?? ""), target = input("target", node.target ?? "all"), overrides = input("overrideReferences", node.overrideReferences.join(", ")), saveContribution = dom.createElement("button");
    contributionLegend.textContent = "Context, applicability, and explicit override";
    saveContribution.type = "button";
    saveContribution.textContent = "Save contextual contribution";
    saveContribution.addEventListener("click", () => send({ kind: "set", baseRevision: document.revision, propertyId: node.id, patch: { ...(expected.value ? { expectedValue: expected.value } : {}), ...(enforcement.value ? { enforcement: enforcement.value } : {}), target: target.value, overrideReferences: overrides.value.split(",").map((value) => value.trim()).filter(Boolean) } }));
    contribution.append(contributionLegend, labeled("Expected value", expected), labeled("Enforcement policy", enforcement), labeled("Target events", target), labeled("Definitions explicitly resolved", overrides), saveContribution);
    host.append(heading, path, structure, typeSection, presenceSection, predicateHost, values, rules, documentation, contribution);
}
//# sourceMappingURL=data-layer-canonical-schema-ui.js.map