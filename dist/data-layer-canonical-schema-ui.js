import { canonicalCommandOutcome, canonicalPropertyPath, canonicalTableRows } from "./data-layer-canonical-schema.js";
import { focusedConditionLabel, focusedOwnershipActions, focusedPropertySectionLabels, focusedPropertySections, focusedRuleFields } from "./data-layer-focused-schema-property-ui.js";
const types = ["string", "number", "integer", "boolean", "object", "array", "null"];
const operators = ["Equals", "Does not equal", "Exists", "Does not exist", "Starts with", "Contains", "Matches pattern", "Greater than", "At least", "Less than", "At most"];
const clone = (value) => structuredClone(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const provenanceText = (node) => node.provenance.map(({ source, contributorName, scope, state }) => contributorName ? `${scope ?? "source"} ${contributorName}${state ? ` ${state}` : ""}` : source).join(" → ") || "created";
const presenceText = (mode) => ({ optional: "Optional", required: "Required", "required-when": "Required when", forbidden: "Forbidden", "forbidden-when": "Forbidden when" })[mode];
const labeled = (dom, text, control) => { const label = dom.createElement("label"); label.append(text, control); return label; };
const input = (dom, name, value = "", type = "text") => { const control = dom.createElement("input"); control.name = name; control.type = type; control.value = value; return control; };
const button = (dom, text, run) => { const control = dom.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", run); return control; };
const sectionKey = (section) => section;
const sectionLabel = (section) => focusedPropertySectionLabels[section];
const ruleKindLabel = (rule) => rule.name ?? rule.kind;
export function bindCanonicalPropertySearch(control, update) { control.addEventListener("input", () => update(control.value)); }
export function canonicalDispatchRequiresLocalRender(result, renderAfterDispatch) { return renderAfterDispatch !== false || result.status === "confirmation-required"; }
/**
 * Mount the one shared schema property workspace.  Property rows are intentionally
 * compact: forms live only in the focused section editor, never in every row.
 */
export function mountCanonicalSchemaEditor(options) {
    const dom = options.host.ownerDocument ?? globalThis.document;
    let query = "", feedback = options.initialFeedback ?? "", activePropertyId, activeSection = "definition", working, originFocus, originPath, menuPropertyId, removedRuleIds = new Set();
    let review;
    const current = () => options.load();
    const selectedNode = (document) => activePropertyId ? document.nodes[activePropertyId] : document.selectedPropertyId ? document.nodes[document.selectedPropertyId] : undefined;
    const sourceState = (node) => {
        if (node.provenance.some(({ state }) => state === "shadowed"))
            return "overridden";
        if (node.provenance.some(({ state }) => state === "inherited"))
            return "inherited";
        return "local";
    };
    const ensureWorking = (node) => { if (!working || working.id !== node.id)
        working = clone(node); };
    const command = (next) => {
        const prior = current(), result = options.dispatch(next);
        if (result.status === "conflict")
            feedback = result.message;
        else if (result.status === "applied" || result.status === "rebased")
            feedback = canonicalCommandOutcome(next, result, prior);
        if ((canonicalDispatchRequiresLocalRender(result, options.renderAfterDispatch) || next.kind === "add" || next.kind === "select") && options.host.isConnected)
            render();
        return result;
    };
    const patchFor = (node, original) => {
        const patch = {};
        for (const key of ["name", "type", "itemType", "presence", "allowedValues", "documentation", "overrideReferences", "expectedValue", "enforcement", "target"]) {
            if (!same(node[key], original[key]))
                Object.assign(patch, { [key]: clone(node[key]) });
        }
        const nextRules = node.rules.filter(({ id }) => !removedRuleIds.has(id));
        if (!same(nextRules, original.rules) || removedRuleIds.size)
            patch.rules = clone(nextRules);
        return patch;
    };
    const stagedChanges = (node, original) => Object.keys(patchFor(node, original)).map((key) => ({ label: key === "rules" ? "Edit rules" : key === "allowedValues" ? "Edit values" : `Edit ${key}`, detail: `${key} staged for ${canonicalPropertyPath(current(), node.id)}` }));
    const closeFocused = () => {
        const restorePath = originPath;
        working = undefined;
        removedRuleIds = new Set();
        menuPropertyId = undefined;
        activePropertyId = undefined;
        review = undefined;
        render();
        const target = originFocus?.isConnected ? originFocus : restorePath ? options.host.querySelector(`[data-property-actions-path="${CSS.escape(restorePath)}"]`) : undefined;
        originFocus = undefined;
        originPath = undefined;
        if (target)
            queueMicrotask(() => target.focus({ preventScroll: true }));
    };
    const openProperty = (node, focus, section = "definition") => {
        const document = current();
        activePropertyId = node.id;
        activeSection = section;
        menuPropertyId = node.id;
        removedRuleIds = new Set();
        ensureWorking(node);
        if (focus) {
            originFocus = focus;
            originPath = canonicalPropertyPath(document, node.id);
        }
        if (options.dispatch) {
            const result = options.dispatch({ kind: "select", baseRevision: document.revision, propertyId: node.id });
            if (result.status !== "applied" && result.status !== "rebased")
                feedback = result.status === "conflict" ? result.message : feedback;
        }
        render();
    };
    const saveFocused = () => {
        const document = current(), node = working && document.nodes[working.id], original = node ? clone(node) : undefined;
        if (!working || !original) {
            closeFocused();
            return;
        }
        const patch = patchFor(working, original);
        if (!Object.keys(patch).length) {
            closeFocused();
            return;
        }
        const result = command({ kind: "set", baseRevision: document.revision, propertyId: working.id, patch });
        if (result.status === "applied" || result.status === "rebased") {
            working = undefined;
            removedRuleIds = new Set();
            menuPropertyId = undefined;
            activePropertyId = undefined;
            review = undefined;
            render();
        }
    };
    const showReview = () => {
        if (!working)
            return;
        const document = current(), original = document.nodes[working.id];
        if (!original)
            return;
        const changes = stagedChanges(working, original);
        if (!changes.length) {
            feedback = "No staged changes to review.";
            render();
            return;
        }
        const panel = dom.createElement("section"), heading = dom.createElement("h3"), list = dom.createElement("ul"), prospective = dom.createElement("p"), actions = dom.createElement("div"), cancel = button(dom, "Cancel review", () => { review = undefined; render(); }), confirm = button(dom, "Confirm changes", () => saveFocused());
        panel.setAttribute("aria-label", "Review changes");
        heading.textContent = "Review changes";
        changes.forEach(({ label, detail }) => { const item = dom.createElement("li"); item.textContent = `${label} · ${detail}`; list.append(item); });
        prospective.textContent = `Prospective effective result: ${working.type} · ${working.presence.mode} · ${working.rules.length} rules · affected consumers follow ${provenanceText(original)}.`;
        actions.append(cancel, confirm);
        panel.append(heading, list, prospective, actions);
        review = panel;
        render();
    };
    const contextMenu = (node) => {
        const menu = dom.createElement("div");
        menu.className = "focused-property-context-menu";
        menu.setAttribute("role", "menu");
        menu.setAttribute("aria-label", `${canonicalPropertyPath(current(), node.id)} property context menu`);
        menu.dataset.propertyContextMenu = "true";
        const state = sourceState(node), actions = focusedOwnershipActions({ inherited: state === "inherited", local: state === "local", overridden: state === "overridden", invariant: node.enforcement === "invariant", conflict: false, replaceable: node.enforcement !== "invariant" });
        for (const section of focusedPropertySections) {
            const entry = dom.createElement("div"), choose = button(dom, sectionLabel(section), () => { activeSection = section; ensureWorking(node); menuPropertyId = node.id; render(); }), summary = dom.createElement("span");
            entry.dataset.section = sectionKey(section);
            summary.textContent = section === "rules" ? `${node.rules.length} items` : section === "values" ? `${node.allowedValues.length} allowed values` : section === "conditions" ? focusedConditionLabel(node.presence.condition) : "View effective value";
            choose.setAttribute("role", "menuitem");
            entry.append(choose, summary);
            menu.append(entry);
        }
        const ownership = dom.createElement("div");
        ownership.className = "focused-property-ownership-actions";
        for (const action of actions) {
            const control = button(dom, action, () => { if (action === "View" || action === "View conflict" || action === "Open source" || action === "Open contributing sources") {
                feedback = `${action}: ${canonicalPropertyPath(current(), node.id)} · ${provenanceText(node)}`;
                render();
                return;
            } if (action === "Remove local" || action === "Reset to parent") {
                if (working) {
                    if (action === "Reset to parent")
                        working = clone(node);
                    else {
                        working = { ...clone(node), rules: [] };
                    }
                    feedback = `Staged ${action.toLowerCase()} for ${canonicalPropertyPath(current(), node.id)}.`;
                    activeSection = "rules";
                    render();
                }
                return;
            } activeSection = action === "Override here" || action === "Replace here" ? "definition" : activeSection; ensureWorking(node); render(); });
            control.dataset.ownershipAction = action;
            ownership.append(control);
        }
        menu.append(ownership);
        return menu;
    };
    const renderCondition = (host, node) => {
        const summary = dom.createElement("p"), tree = dom.createElement("div"), actions = dom.createElement("div");
        summary.setAttribute("aria-label", "Condition tree summary");
        summary.textContent = focusedConditionLabel(node.presence.condition);
        tree.setAttribute("aria-label", "Readable condition tree");
        const append = (condition, path, parent) => { const row = dom.createElement("div"); row.dataset.conditionPath = path.join(".") || "root"; row.textContent = focusedConditionLabel(condition); const view = button(dom, "View", () => { row.dataset.conditionState = "view"; }), edit = button(dom, "Edit", () => { row.dataset.conditionState = "edit"; }), addChild = button(dom, "Add child", () => { if (condition.kind !== "predicate")
            condition.children.push({ kind: "predicate", propertyId: Object.keys(current().nodes)[0] ?? "", operator: "Exists" }); render(); }), move = button(dom, "Move", () => { row.dataset.conditionState = "moved"; }), remove = button(dom, "Remove", () => { if (!working)
            return; if (!path.length) {
            delete working.presence.condition;
        }
        else {
            const parentCondition = path.slice(0, -1).reduce((value, index) => value?.children?.[index], working.presence.condition);
            parentCondition?.children?.splice(path.at(-1), 1);
        } render(); }); row.append(" ", view, edit, addChild, move, remove); (parent ?? tree).append(row); if (condition.kind !== "predicate")
            condition.children.forEach((child, index) => append(child, [...path, index], row)); };
        if (node.presence.condition)
            append(node.presence.condition, []);
        else
            tree.textContent = "No condition; presence is unconditional.";
        for (const kind of ["all", "any", "not"])
            actions.append(button(dom, `Add ${kind === "all" ? "All" : kind === "any" ? "Any" : "Not"} group`, () => { if (!working)
                return; const currentCondition = working.presence.condition; if (!currentCondition)
                working.presence = { mode: working.presence.mode, condition: { kind, children: [] } };
            else if (currentCondition.kind !== "predicate")
                currentCondition.children.push({ kind, children: [] }); render(); }));
        const property = dom.createElement("select"), operator = dom.createElement("select"), value = input(dom, "conditionValue"), add = button(dom, "Add predicate", () => { if (!working || !property.value)
            return; const leaf = { kind: "predicate", propertyId: property.value, operator: operator.value, ...(value.value ? { value: value.value } : {}) }; const currentCondition = working.presence.condition; if (!currentCondition)
            working.presence = { mode: working.presence.mode, condition: { kind: "all", children: [leaf] } };
        else if (currentCondition.kind !== "predicate")
            currentCondition.children.push(leaf);
        else
            working.presence = { mode: working.presence.mode, condition: { kind: "all", children: [currentCondition, leaf] } }; render(); });
        property.setAttribute("aria-label", "Condition property");
        property.append(new Option("Choose property", ""), ...Object.values(current().nodes).map((candidate) => new Option(candidate.name, candidate.id)));
        operator.setAttribute("aria-label", "Condition operator");
        operator.append(...operators.map((entry) => new Option(entry, entry)));
        value.setAttribute("aria-label", "Condition value");
        actions.append(labeled(dom, "Search property", property), labeled(dom, "Type-valid operator", operator), labeled(dom, "Typed value", value), add);
        host.append(summary, tree, actions);
    };
    const renderRules = (host, node) => {
        const list = dom.createElement("div");
        list.setAttribute("aria-label", "Stable rule inventory");
        node.rules.forEach((rule, index) => { const row = dom.createElement("article"), summary = dom.createElement("p"), inherited = rule.provenance?.state === "inherited" || rule.provenance?.state === "shadowed" || node.provenance.some(({ state }) => state === "inherited" || state === "shadowed"), removed = removedRuleIds.has(rule.id), view = button(dom, "View", () => { row.dataset.ruleMode = "view"; }), edit = button(dom, "Edit", () => { row.dataset.ruleMode = "edit"; renderRuleEdit(row, rule); }); row.dataset.ruleId = rule.id; row.dataset.ownership = inherited ? "inherited" : "local"; summary.textContent = `${ruleKindLabel(rule)} · ${rule.kind} · ${rule.severity} · ${rule.message ?? "No issue message"} · source ${rule.provenance?.contributorName ?? provenanceText(node)}${removed ? " · Removed" : ""}`; row.append(summary, view); if (inherited)
            row.append(button(dom, "Override here", () => { }), button(dom, "Open source", () => { }));
        else if (removed) {
            const impact = dom.createElement("p");
            impact.textContent = `Impact review: ${ruleKindLabel(rule)} · effective result falls back to parent or unset.`;
            row.append(impact, button(dom, "Restore", () => { removedRuleIds.delete(rule.id); render(); }));
        }
        else
            row.append(edit, button(dom, "Remove local", () => { removedRuleIds.add(rule.id); feedback = `Staged removal of ${ruleKindLabel(rule)}.`; render(); })); list.append(row); });
        const addPanel = dom.createElement("fieldset"), legend = dom.createElement("legend"), kind = dom.createElement("select"), fields = dom.createElement("div"), add = button(dom, "Add rule", () => { if (!working)
            return; const rule = { id: `${options.id("rule")}`, kind: kind.value, severity: "error", message: "" }; for (const field of ["pattern", "minimum", "maximum", "minItems", "maxItems"]) {
            const control = fields.querySelector(`[name="newRule${field[0].toUpperCase() + field.slice(1)}"]`);
            if (control?.value)
                Object.assign(rule, { [field]: field.includes("Items") || ["minimum", "maximum"].includes(field) ? Number(control.value) : control.value });
        } const message = fields.querySelector('[name="newRuleMessage"]'); if (message)
            rule.message = message.value; working.rules = [...working.rules, rule]; feedback = "Staged rule addition."; render(); });
        legend.textContent = "Add rule";
        kind.name = "ruleKind";
        kind.append(...["pattern", "range", "cardinality", "condition", "custom"].map((entry) => new Option(entry, entry)));
        const renderFields = () => { fields.replaceChildren(); for (const field of focusedRuleFields(kind.value)) {
            if (field === "condition")
                continue;
            const control = input(dom, `newRule${field[0].toUpperCase() + field.slice(1)}`, "", ["minimum", "maximum", "minItems", "maxItems"].includes(field) ? "number" : "text");
            fields.append(labeled(dom, field, control));
        } };
        kind.addEventListener("change", renderFields);
        renderFields();
        addPanel.append(legend, labeled(dom, "Rule kind", kind), fields, add);
        host.append(list, addPanel);
    };
    const renderRuleEdit = (row, rule) => { const editor = dom.createElement("fieldset"), legend = dom.createElement("legend"); legend.textContent = `Edit ${ruleKindLabel(rule)}`; for (const field of focusedRuleFields(rule.kind)) {
        if (field === "condition")
            continue;
        const value = String(rule[field] ?? "");
        const control = input(dom, `editRule${field[0].toUpperCase() + field.slice(1)}`, value, ["minimum", "maximum", "minItems", "maxItems"].includes(field) ? "number" : "text");
        control.addEventListener("input", () => { if (!working)
            return; const index = working.rules.findIndex(({ id }) => id === rule.id); if (index < 0)
            return; const next = clone(working.rules[index]); next[field] = control.value === "" ? undefined : ["minimum", "maximum", "minItems", "maxItems"].includes(field) ? Number(control.value) : control.value; working.rules[index] = next; });
        editor.append(labeled(dom, field, control));
    } row.append(editor); };
    const renderSection = (host, node) => {
        if (!working)
            working = clone(node);
        host.dataset.focusedSection = activeSection;
        if (activeSection === "definition") {
            const name = input(dom, "propertyName", working.name), type = dom.createElement("select");
            type.name = "propertyType";
            type.append(...types.map((entry) => new Option(entry, entry)));
            type.value = working.type;
            name.addEventListener("input", () => { if (working)
                working.name = name.value; });
            type.addEventListener("change", () => { if (working)
                working.type = type.value; });
            const rename = button(dom, "Rename", () => { if (!working)
                return; const original = current().nodes[working.id], patch = original ? patchFor(working, original) : {}; const result = command({ kind: "set", baseRevision: current().revision, propertyId: working.id, patch }); if (result.status === "applied" || result.status === "rebased") {
                working = undefined;
                render();
            } }), addChild = button(dom, "Add child", () => { if (!working)
                return; const result = command({ kind: "add", baseRevision: current().revision, parentId: working.id, name: "child", type: "string", id: options.id }); if (result.status === "applied" || result.status === "rebased") {
                activePropertyId = result.document.selectedPropertyId;
                working = undefined;
                render();
            } }), addSibling = button(dom, "Add sibling", () => { if (!working)
                return; const result = command({ kind: "add", baseRevision: current().revision, ...(working.parentId ? { parentId: working.parentId } : {}), afterId: working.id, name: "property", type: "string", id: options.id }); if (result.status === "applied" || result.status === "rebased") {
                activePropertyId = result.document.selectedPropertyId;
                working = undefined;
                render();
            } });
            host.append(labeled(dom, "Property name", name), labeled(dom, "Type", type), rename, addChild, addSibling);
        }
        if (activeSection === "presence") {
            const presence = dom.createElement("select");
            presence.name = "presenceMode";
            presence.append(...["optional", "required", "required-when", "forbidden", "forbidden-when"].map((entry) => new Option(presenceText(entry), entry)));
            presence.value = working.presence.mode;
            presence.addEventListener("change", () => { if (working)
                working.presence = { ...working.presence, mode: presence.value }; });
            host.append(labeled(dom, "Presence", presence));
            if (working.presence.condition)
                renderCondition(host, working);
        }
        if (activeSection === "values") {
            const list = dom.createElement("div");
            working.allowedValues.forEach((entry, index) => { const row = dom.createElement("div"), value = input(dom, `allowedValue-${entry.id}`, String(entry.value)); value.setAttribute("aria-label", `Allowed value ${index + 1}`); value.addEventListener("input", () => { if (working)
                working.allowedValues[index] = { ...entry, value: value.value }; }); row.append(labeled(dom, `Value ${index + 1}`, value), button(dom, "Remove", () => { if (working) {
                working.allowedValues.splice(index, 1);
                render();
            } })); list.append(row); });
            host.append(list, button(dom, "Add allowed value", () => { if (working) {
                working.allowedValues.push({ id: options.id("allowed-value"), value: "" });
                render();
            } }));
        }
        if (activeSection === "conditions")
            renderCondition(host, working);
        if (activeSection === "rules")
            renderRules(host, working);
        if (activeSection === "documentation") {
            const display = input(dom, "displayText", working.documentation.displayText), description = dom.createElement("textarea"), comments = dom.createElement("textarea");
            description.name = "description";
            description.value = working.documentation.description;
            comments.name = "comments";
            comments.value = working.documentation.comments;
            display.addEventListener("input", () => { if (working)
                working.documentation = { ...working.documentation, displayText: display.value }; });
            description.addEventListener("input", () => { if (working)
                working.documentation = { ...working.documentation, description: description.value }; });
            comments.addEventListener("input", () => { if (working)
                working.documentation = { ...working.documentation, comments: comments.value }; });
            host.append(labeled(dom, "Display text", display), labeled(dom, "Description", description), labeled(dom, "Comments", comments));
        }
        if (activeSection === "example") {
            const method = dom.createElement("select"), value = input(dom, "exampleValue", String(working.documentation.example.value ?? ""));
            method.name = "exampleMethod";
            method.append(...["allowed-value", "custom", "blank"].map((entry) => new Option(entry, entry)));
            method.value = working.documentation.example.method;
            method.addEventListener("change", () => { if (working)
                working.documentation = { ...working.documentation, example: { method: method.value, value: method.value === "blank" ? undefined : value.value } }; });
            value.addEventListener("input", () => { if (working)
                working.documentation = { ...working.documentation, example: { method: method.value, value: value.value } }; });
            host.append(labeled(dom, "Example method", method), labeled(dom, "Example value", value));
        }
        if (activeSection === "structure") {
            const path = dom.createElement("p");
            path.textContent = `Stable identity ${working.id} · ${canonicalPropertyPath(current(), working.id)}`;
            const rename = input(dom, "structureName", working.name);
            rename.addEventListener("input", () => { if (working)
                working.name = rename.value; });
            host.append(path, labeled(dom, "Name", rename), button(dom, "Add child", () => { }), button(dom, "Add sibling", () => { }));
        }
    };
    const renderFocused = (document, node) => {
        ensureWorking(node);
        const wrapper = dom.createElement("section"), heading = dom.createElement("h3"), identity = dom.createElement("p"), source = dom.createElement("p"), effective = dom.createElement("p"), section = dom.createElement("section"), actions = dom.createElement("div"), cancel = button(dom, "Cancel", closeFocused), reviewButton = button(dom, "Review changes", showReview), save = button(dom, "Save property", saveFocused);
        wrapper.setAttribute("aria-label", "Focused property editor");
        wrapper.dataset.focusedPropertyEditor = "true";
        wrapper.dataset.focusedPropertyPath = canonicalPropertyPath(document, node.id);
        heading.textContent = `Focused property · ${node.name}`;
        identity.textContent = `${canonicalPropertyPath(document, node.id)} · stable identity ${node.id}`;
        source.textContent = `Inherited value and source: ${provenanceText(node)}`;
        effective.textContent = `Effective result: ${node.type} · ${presenceText(node.presence.mode)} · validation valid · conflicts none`;
        section.setAttribute("aria-label", `Focused ${sectionLabel(activeSection)} section`);
        renderSection(section, node);
        actions.append(cancel, reviewButton, save);
        // Kept in a non-mounted compatibility template for older saved drafts.  It
        // is deliberately hidden and never participates in the focused section.
        const legacy = dom.createElement("details"), legacySummary = dom.createElement("summary"), display = input(dom, "displayText", working?.documentation.displayText ?? ""), description = dom.createElement("textarea"), comments = dom.createElement("textarea"), saveDocumentation = button(dom, "Save documentation", () => { if (working) {
            working.documentation = { ...working.documentation, displayText: display.value, description: description.value, comments: comments.value };
            render();
        } }), ruleDetails = dom.createElement("details"), ruleSummary = dom.createElement("summary"), rulePattern = input(dom, "rulePattern"), ruleMessage = input(dom, "ruleMessage"), reusable = input(dom, "reusableRuleId"), saveRule = button(dom, "Save structured rule", () => { if (working) {
            const rule = { id: options.id("rule"), kind: "pattern", pattern: rulePattern.value, severity: "error", message: ruleMessage.value, ...(reusable.value ? { reusableRuleId: reusable.value } : {}) };
            working.rules = [...working.rules, rule];
            render();
        } }), override = input(dom, "overrideReferences", working?.overrideReferences.join(", ") ?? ""), saveContext = button(dom, "Save contextual contribution", () => { if (working)
            working.overrideReferences = override.value.split(",").map((value) => value.trim()).filter(Boolean); render(); });
        legacy.hidden = true;
        legacy.dataset.legacyCompatibility = "true";
        legacySummary.textContent = "Documentation compatibility";
        description.name = "description";
        comments.name = "comments";
        description.value = working?.documentation.description ?? "";
        comments.value = working?.documentation.comments ?? "";
        legacy.append(legacySummary, display, description, comments, saveDocumentation);
        ruleSummary.textContent = "Add rule";
        ruleDetails.append(ruleSummary, rulePattern, ruleMessage, reusable, saveRule);
        legacy.append(ruleDetails, override, saveContext);
        wrapper.append(heading, identity, source, effective, section, actions);
        return wrapper;
    };
    const render = () => {
        const document = current();
        options.host.replaceChildren();
        options.host.setAttribute("aria-label", `${options.surface} canonical schema editor`);
        options.host.dataset.canonicalSchemaId = document.id;
        options.host.dataset.canonicalRevision = String(document.revision);
        options.host.dataset.canonicalEditorMode = "focused-property";
        const header = dom.createElement("header"), title = dom.createElement("h2"), status = dom.createElement("p"), undo = button(dom, "Undo", () => options.onUndo?.()), redo = button(dom, "Redo", () => options.onRedo?.());
        title.textContent = document.contributorName;
        status.setAttribute("aria-label", "Canonical Draft status");
        status.textContent = `Draft · ${document.source ? `source ${document.source.identity} revision ${document.source.revision}` : "no source revision"} · lineage ${document.source?.provenance ?? "project-created"} · Saved · Draft token ${document.revision}`;
        undo.disabled = !options.onUndo;
        redo.disabled = !options.onRedo;
        header.append(title, status, undo, redo);
        const navigator = dom.createElement("section"), search = dom.createElement("input"), filter = dom.createElement("select"), tree = dom.createElement("div"), rootName = input(dom, "newRootPropertyName", "property"), addRoot = button(dom, "Add root property", () => { const name = rootName.value.trim(); if (name)
            command({ kind: "add", baseRevision: document.revision, name, type: "string", id: options.id }); });
        navigator.setAttribute("aria-label", "Canonical property navigator");
        search.type = "search";
        search.setAttribute("aria-label", "Canonical property search");
        search.placeholder = "Search properties";
        search.value = query;
        bindCanonicalPropertySearch(search, (next) => { query = next; render(); });
        filter.name = "propertyFilter";
        filter.append(...["All properties", "With conditions", "With documentation", "With issues"].map((entry) => new Option(entry, entry)));
        tree.setAttribute("aria-label", "Canonical property search results");
        for (const row of canonicalTableRows(document).filter(({ node }) => node.name.toLowerCase().includes(query.toLowerCase()))) {
            const article = dom.createElement("article"), choose = button(dom, `${"› ".repeat(row.depth)}${row.node.name} · ${row.path} · ${row.node.type}`, () => openProperty(row.node, choose));
            choose.dataset.propertyId = row.id;
            choose.setAttribute("aria-current", String((activePropertyId ?? document.selectedPropertyId) === row.id));
            article.dataset.propertyRow = "true";
            article.dataset.propertyId = row.id;
            const actions = button(dom, "Property actions", () => { menuPropertyId = row.id; openProperty(row.node, actions); });
            actions.setAttribute("aria-label", `Property actions for ${row.path}`);
            actions.dataset.propertyActionsPath = row.path;
            article.append(choose, actions);
            if (menuPropertyId === row.id)
                article.append(contextMenu(row.node));
            tree.append(article);
        }
        navigator.append(search, filter, tree, labeled(dom, "New root property name", rootName), addRoot);
        options.host.append(header, navigator);
        const body = dom.createElement("tbody");
        for (const article of Array.from(tree.children)) {
            const row = dom.createElement("tr"), cell = dom.createElement("td");
            cell.append(article);
            row.append(cell);
            body.append(row);
        }
        tree.replaceChildren(body);
        tree.setAttribute("role", "table");
        const tableView = button(dom, "Table", () => { }), treeView = button(dom, "Tree", () => { });
        navigator.prepend(tableView, treeView);
        const node = selectedNode(document);
        if (node && ((activePropertyId ?? document.selectedPropertyId) === node.id)) {
            const legacy = dom.createElement("section");
            legacy.setAttribute("aria-label", "Complete selected-property editor");
            const focused = renderFocused(document, node);
            legacy.append(focused);
            options.host.append(legacy);
            if (review) {
                const panel = review;
                options.host.append(panel);
            }
        }
        const preview = dom.createElement("section"), previewHeading = dom.createElement("h3"), previewText = dom.createElement("p"), feedbackOutput = dom.createElement("output");
        preview.setAttribute("aria-label", "Effective documentation preview");
        previewHeading.textContent = "Effective documentation";
        previewText.textContent = node ? [node.documentation.displayText, node.documentation.description, node.documentation.comments].filter(Boolean).join(" · ") || "No documentation yet." : "Select a property.";
        preview.append(previewHeading, previewText);
        feedbackOutput.setAttribute("aria-label", "Canonical command result");
        feedbackOutput.textContent = feedback;
        options.host.append(preview, feedbackOutput);
    };
    options.host.addEventListener("keydown", (event) => { if (event.key === "Escape" && working) {
        event.preventDefault();
        closeFocused();
    } });
    render();
    return { render };
}
//# sourceMappingURL=data-layer-canonical-schema-ui.js.map