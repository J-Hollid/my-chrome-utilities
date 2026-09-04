import { applySchemaPropertyTypeEdit, canonicalDocumentationPath, canonicalPropertyPath, canonicalRulePropertyPath, exampleValueFromInput, filterAndSortSchemaPropertyRows, manualPropertyContainerAction, mountCanonicalPredicateEditor, renderSchemaPropertyTypeEditor, resolveEffectiveSchemaDocumentation, schemaPropertyExampleChoices, schemaPropertyExampleConflicts, schemaPropertyExampleInputType, schemaPropertyRows, schemaPropertyTypeLabel, schemaPropertyTypeOwner, setPropertyDocumentation, updateSchemaWorkingDraft, } from "../../utilities/data-layer/schemas.js";
export class SchemaPropertyView {
    #ports;
    #disposers = [];
    constructor(ports) { this.#ports = ports; }
    #listen(target, type, listener) {
        target.addEventListener(type, listener);
        this.#disposers.push(() => target.removeEventListener(type, listener));
    }
    dispose() { for (const dispose of this.#disposers.splice(0))
        dispose(); }
    render() {
        const p = this.#ports, root = p.root, document = p.document, property = p.property, rules = p.rules, canonical = p.canonical, library = p.library, tree = root.querySelector("#schema-property-tree"), filter = root.querySelector("#schema-property-filter"), sort = root.querySelector("#schema-property-sort"), status = root.querySelector("#schema-property-result-status"), empty = root.querySelector("#schema-property-empty"), emptyMessage = root.querySelector("#schema-property-empty-message"), editor = root.querySelector("#schema-editor"), detail = root.querySelector("#schema-detail"), add = root.querySelector("#add-schema-property");
        const openRuleDisclosures = tree ? Array.from(tree.querySelectorAll("details[data-attached-rules][open]")) : [];
        for (const disclosure of openRuleDisclosures) {
            const owner = disclosure.closest("[data-schema-property-canonical-path]"), path = owner?.dataset.schemaPropertyCanonicalPath;
            if (path)
                property.expandedRulePaths.add(path);
        }
        const activeElement = document?.activeElement, focused = activeElement && tree?.contains(activeElement) ? activeElement : undefined, previousScroll = tree?.scrollTop ?? 0, previousLabel = focused?.getAttribute("aria-label"), previousRule = focused?.dataset.ruleId && focused.dataset.propertyPath && focused.dataset.schemaRuleAction
            ? { ruleId: focused.dataset.ruleId, propertyPath: focused.dataset.propertyPath, action: focused.dataset.schemaRuleAction } : undefined, promotionFocus = rules.promotionFocusReturn ? { ...rules.promotionFocusReturn } : undefined;
        this.dispose();
        const schema = library.activeSchemaId ? p.active() : library.draft, editable = schema ? p.editorDraft(schema) : undefined, excluded = new Set(Object.entries(editable?.inheritedRuleOverrides ?? {}).filter(([, state]) => state === "disabled").map(([path]) => canonicalRulePropertyPath(path))), rows = editable ? schemaPropertyRows(editable.document, p.parentDocuments(), excluded) : [], view = filterAndSortSchemaPropertyRows(rows, filter?.value ?? "", (sort?.value || "schema")), compact = canonical.editor?.load(), compactByPath = new Map(compact ? Object.values(compact.nodes).map((node) => [canonicalPropertyPath(compact, node.id), node]) : []);
        if (status)
            status.textContent = `${view.matchCount} of ${view.totalCount} properties${filter?.value.trim() && view.matchCount ? `, ${view.contextCount} context` : ""}`;
        if (empty)
            empty.hidden = view.rows.length > 0;
        if (emptyMessage)
            emptyMessage.textContent = view.rows.length ? "" : `No properties match ${filter?.value.trim() ?? ""}`;
        if (tree && document) {
            const items = view.rows.flatMap((row) => {
                const item = document.createElement("li");
                item.dataset.propertyPath = row.canonicalPath;
                item.dataset.schemaPropertyPath = row.displayPath;
                item.dataset.schemaPropertyCanonicalPath = row.canonicalPath;
                const summary = document.createElement("strong"), metadata = document.createElement("span"), selected = row.displayPath === property.selectedPath || row.canonicalPath === p.normalizedPath(property.selectedPath);
                summary.textContent = canonical.editor ? `${row.displayPath} · ${row.canonicalPath}` : row.displayPath;
                metadata.className = "schema-property-metadata";
                metadata.textContent = `${row.filterContext ? "Filter context · " : ""}${row.origin === "inherited" ? "Inherited" : row.displayPath.endsWith(".*") ? "Every item" : row.schema.propertyOrigin === "manual" ? "Manual" : "Observed"} · type ${row.schema.type ?? "unknown"}`;
                if (selected)
                    item.setAttribute("aria-current", "true");
                const compactNode = compactByPath.get(row.canonicalPath), actions = compactNode && canonical.editor ? document.createElement("button") : undefined;
                if (actions) {
                    actions.type = "button";
                    actions.textContent = "⋯";
                    actions.setAttribute("aria-label", `Property actions for ${row.canonicalPath}`);
                    this.#listen(actions, "click", () => p.openCanonicalActions(row.canonicalPath, actions));
                }
                item.tabIndex = -1;
                this.#listen(summary, "click", () => {
                    property.selectedPath = row.displayPath;
                    if (compact && compactNode)
                        void canonical.dispatchCommand({ kind: "select", baseRevision: compact.revision, propertyId: compactNode.id });
                    this.render();
                });
                item.append(summary, metadata, ...(actions ? [actions] : []));
                if (schema) {
                    const presented = p.editorDraft(schema), inherited = row.origin === "inherited" ? schemaPropertyTypeOwner(presented, row.canonicalPath, library.schemas) : undefined, controls = renderSchemaPropertyTypeEditor({ schema: presented, path: row.canonicalPath, property: row.schema,
                        ...(inherited ? { inheritedOwner: { name: inherited.name, open: () => { library.activeSchemaId = inherited.id; library.draft = p.editorDraft(inherited); p.renderAll(); } } } : {}),
                        confirm: (edit) => {
                            const changed = applySchemaPropertyTypeEdit(p.editorDraft(p.active()), edit);
                            p.replaceActive(updateSchemaWorkingDraft(p.active(), { document: changed.document, attachedRules: changed.attachedRules, documentation: changed.documentation }, `Change ${row.canonicalPath} type from ${schemaPropertyTypeLabel(row.schema)} to ${edit.type}`));
                            p.persistLibrary();
                            p.renderAll();
                        } });
                    item.append(controls.action, controls.editor);
                }
                if (selected && compactNode && compact && canonical.editor && row.origin !== "inherited")
                    this.#renderCanonicalControls(item, row.canonicalPath, compact, compactNode);
                if (schema)
                    this.#renderDocumentation(item, schema, row.canonicalPath, row.displayPath, row.schema, compact, compactNode);
                const action = (label, run, aria = `${label} ${row.canonicalPath}`) => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.setAttribute("aria-label", aria); if (label === "Add rule")
                    button.className = "schema-property-add-rule"; this.#listen(button, "click", () => run(button)); item.append(button); };
                action("View", () => { property.selectedPath = row.canonicalPath.slice(1).replaceAll("/", "."); });
                const container = editable ? manualPropertyContainerAction(editable.document, row.canonicalPath) : undefined;
                action(container?.label ?? "Add child", (button) => p.openManual(container?.parentPath ?? row.canonicalPath, button), `${container?.label ?? "Add child"} on ${row.canonicalPath}`);
                action("Add rule", (button) => p.openRulePicker(row.displayPath, button), `Add rule for ${row.displayPath}`);
                if (row.schema.type === "array")
                    action("Add specific index rule", (button) => p.openSpecificIndex(row.canonicalPath, button));
                action("Edit canonical rules", (button) => p.openCanonicalRule(row.displayPath, button), `Edit canonical rules for ${row.displayPath}`);
                action("Copy to another schema", (button) => p.openCopy(row.canonicalPath, button), `Copy ${row.canonicalPath} to another schema`);
                if (row.origin === "inherited")
                    action("Exclude inherited property", () => {
                        const current = p.active(), draft = p.editorDraft(current);
                        p.replaceActive(updateSchemaWorkingDraft(current, { inheritedRuleOverrides: { ...(draft.inheritedRuleOverrides ?? {}), [row.canonicalPath]: "disabled" } }, `Exclude inherited property ${row.canonicalPath}`));
                        p.persistLibrary();
                        p.renderAll();
                        const feedback = root.querySelector("#schema-property-removal-feedback");
                        if (feedback)
                            feedback.textContent = `Excluded inherited property ${row.canonicalPath} locally; the parent schema is unchanged.`;
                    }, `Exclude inherited property ${row.canonicalPath}`);
                else
                    action("Remove property", (button) => p.requestRemoval(row.canonicalPath, button), `Remove property ${row.canonicalPath}`);
                action("Remove documentation", (button) => p.requestDocumentationRemoval(row.canonicalPath, button));
                action(property.expandedRulePaths.has(row.canonicalPath) ? "Hide rules" : "Show rules", () => { if (property.expandedRulePaths.has(row.canonicalPath))
                    property.expandedRulePaths.delete(row.canonicalPath);
                else
                    property.expandedRulePaths.add(row.canonicalPath); this.render(); });
                this.#renderAttachedRules(item, schema, row.canonicalPath, row.displayPath, compact, compactNode, detail);
                return [item];
            });
            const byPath = new Map(view.rows.map((row, index) => [row.displayPath, items[index]])), roots = [];
            view.rows.forEach((row) => {
                const item = byPath.get(row.displayPath);
                item.setAttribute("role", "treeitem");
                item.setAttribute("aria-level", String(Math.max(1, row.displayPath.split(".").length)));
                const parentPath = view.rows.map(({ displayPath }) => displayPath).filter((candidate) => candidate !== row.displayPath && row.displayPath.startsWith(`${candidate}.`)).sort((a, b) => b.length - a.length)[0], parent = parentPath ? byPath.get(parentPath) : undefined;
                if (!parent) {
                    roots.push(item);
                    return;
                }
                let children = Array.from(parent.children).find((child) => child.tagName === "UL" && child.classList.contains("schema-property-children"));
                if (!children) {
                    children = document.createElement("ul");
                    children.className = "schema-property-children";
                    parent.append(children);
                }
                children.append(item);
            });
            tree.replaceChildren(...roots);
            tree.scrollTop = previousScroll;
            if (previousLabel)
                Array.from(tree.querySelectorAll("[aria-label]")).find((control) => control.getAttribute("aria-label") === previousLabel)?.focus({ preventScroll: true });
            else if (previousRule)
                Array.from(tree.querySelectorAll("button[data-rule-id]")).find(({ dataset }) => dataset.ruleId === previousRule.ruleId && dataset.propertyPath === previousRule.propertyPath && dataset.schemaRuleAction === previousRule.action)?.focus({ preventScroll: true });
            else if (promotionFocus && !document.querySelector("#local-rule-promotion-review")?.open)
                Array.from(tree.querySelectorAll("button[data-rule-id]")).find(({ dataset }) => dataset.ruleId === promotionFocus.ruleId && dataset.propertyPath === promotionFocus.propertyPath)?.focus({ preventScroll: true });
            const copy = property.pendingCopyPosition;
            if (copy && copy.schemaId === library.activeSchemaId) {
                tree.querySelector(`button[aria-label="Copy ${copy.path} to another schema"]`)?.focus({ preventScroll: true });
                if (editor)
                    editor.scrollTop = copy.editorScroll;
                tree.scrollTop = copy.treeScroll;
            }
        }
        if (add)
            add.disabled = !schema;
    }
    #renderCanonicalControls(item, path, compact, node) {
        const p = this.#ports, document = p.document, canonical = p.canonical, presence = document.createElement("fieldset"), legend = document.createElement("legend"), mode = document.createElement("select"), save = document.createElement("button"), predicates = document.createElement("section"), draft = canonical.presenceDraft?.propertyId === node.id ? canonical.presenceDraft : undefined;
        presence.className = "compact-canonical-presence";
        presence.dataset.compactPropertyId = node.id;
        legend.textContent = "Conditional presence";
        mode.setAttribute("aria-label", `Conditional presence for ${path}`);
        mode.append(...["optional", "required", "required-when", "forbidden", "forbidden-when"].map((value) => { const option = document.createElement("option"); option.textContent = value.replaceAll("-", " "); option.value = value; return option; }));
        mode.value = draft?.mode ?? node.presence.mode;
        const dispatch = (next) => { void canonical.dispatchCommand({ kind: "set", baseRevision: draft?.baseRevision ?? compact.revision, propertyId: node.id, patch: { presence: next } }); };
        if (typeof document.getElementById === "function")
            mountCanonicalPredicateEditor({ host: predicates, document: compact, ...(node.presence.condition ? { condition: node.presence.condition } : {}), label: `Nested conditional presence for ${path}`, saveLabel: "Save conditional presence", excludePropertyId: node.id,
                onSave: (condition) => { if (mode.value.endsWith("-when"))
                    dispatch({ mode: mode.value, condition }); }, ...(node.presence.condition ? { onClear: () => dispatch({ mode: mode.value.startsWith("forbidden") ? "forbidden" : "required" }) } : {}) });
        predicates.hidden = !mode.value.endsWith("-when");
        this.#listen(mode, "change", () => { predicates.hidden = !mode.value.endsWith("-when"); canonical.presenceDraft = { propertyId: node.id, baseRevision: draft?.baseRevision ?? compact.revision, mode: mode.value }; save.hidden = mode.value.endsWith("-when"); });
        save.type = "button";
        save.textContent = "Save presence";
        save.hidden = mode.value.endsWith("-when");
        this.#listen(save, "click", () => { if (!mode.value.endsWith("-when"))
            dispatch({ mode: mode.value }); });
        presence.append(legend, mode, save, predicates);
        item.append(presence);
        const lifecycle = document.createElement("fieldset"), lifecycleLegend = document.createElement("legend"), renameInput = document.createElement("input"), rename = document.createElement("button"), moveSelect = document.createElement("select"), move = document.createElement("button"), duplicate = document.createElement("button"), expected = document.createElement("input"), saveExpected = document.createElement("button"), reset = document.createElement("button");
        lifecycleLegend.textContent = "Move and lifecycle";
        renameInput.name = "propertyName";
        renameInput.value = node.name;
        renameInput.setAttribute("aria-label", `Rename ${path}`);
        rename.type = "button";
        rename.textContent = "Rename";
        this.#listen(rename, "click", () => { void canonical.dispatchCommand({ kind: "rename", baseRevision: compact.revision, propertyId: node.id, name: renameInput.value }); });
        moveSelect.name = "moveParent";
        moveSelect.setAttribute("aria-label", `Move ${path} under`);
        const root = document.createElement("option");
        root.textContent = "Root";
        root.value = "";
        moveSelect.append(root, ...Object.values(compact.nodes).filter(({ id, parentId }) => id !== node.id && parentId !== node.id).map((candidate) => { const option = document.createElement("option"); option.textContent = candidate.name; option.value = candidate.id; return option; }));
        moveSelect.value = node.parentId ?? "";
        move.type = "button";
        move.textContent = "Move";
        this.#listen(move, "click", () => { void canonical.dispatchCommand({ kind: "move", baseRevision: compact.revision, propertyId: node.id, ...(moveSelect.value ? { parentId: moveSelect.value } : {}) }); });
        duplicate.type = "button";
        duplicate.textContent = "Duplicate";
        this.#listen(duplicate, "click", () => { void canonical.dispatchCommand({ kind: "duplicate", baseRevision: compact.revision, propertyId: node.id, id: p.createId }); });
        expected.name = "expectedValue";
        expected.setAttribute("aria-label", `Expected value for ${path}`);
        expected.value = node.expectedValue === undefined ? "" : String(node.expectedValue);
        saveExpected.type = "button";
        saveExpected.textContent = "Save contextual contribution";
        this.#listen(saveExpected, "click", () => { const raw = expected.value.trim(); let value = raw; if (node.type === "number")
            value = Number(raw);
        else if (node.type === "boolean")
            value = raw === "true";
        else if (node.type === "null")
            value = null; void canonical.dispatchCommand({ kind: "set", baseRevision: compact.revision, propertyId: node.id, patch: { expectedValue: value } }); });
        reset.type = "button";
        reset.textContent = "Reset to parents";
        reset.hidden = compact.source?.provenance !== "project-composed-effective";
        this.#listen(reset, "click", () => { void canonical.dispatchCommand({ kind: "delete", baseRevision: compact.revision, propertyId: node.id }); });
        lifecycle.append(lifecycleLegend, renameInput, rename, moveSelect, move, duplicate, expected, saveExpected, reset);
        item.append(lifecycle);
    }
    #renderDocumentation(item, schema, canonicalPath, displayPath, propertySchema, compact, compactNode) {
        const p = this.#ports, document = p.document, presented = p.editorDraft(schema), path = canonicalDocumentationPath(canonicalPath), effective = resolveEffectiveSchemaDocumentation(presented, [...p.library.schemas.filter(({ id }) => id !== presented.id), presented]), local = presented.documentation?.properties?.[path], documentation = effective.properties[path], parent = presented.parentSchemaId ? p.library.schemas.find(({ id }) => id === presented.parentSchemaId) : undefined, inherited = parent ? resolveEffectiveSchemaDocumentation(parent, p.library.schemas).properties[path] : undefined, summary = document.createElement("p"), edit = document.createElement("a"), editor = document.createElement("fieldset"), legend = document.createElement("legend");
        summary.className = "schema-property-documentation";
        summary.textContent = documentation
            ? `${documentation.displayName || displayPath} · ${documentation.description}${documentation.comments ? ` · Comments: ${documentation.comments}` : ""}${documentation.example ? ` · Example: ${String(documentation.example.value)}` : ""}${documentation.inherited ? ` · inherited from ${documentation.origin.name} revision ${documentation.origin.version}` : " · local"}` : "No documentation";
        edit.setAttribute("role", "button");
        edit.tabIndex = 0;
        edit.className = "schema-property-documentation-control";
        edit.textContent = local || documentation ? "Edit documentation" : "Add documentation";
        edit.setAttribute("aria-label", `${edit.textContent} for ${path}`);
        editor.className = "schema-property-documentation-editor";
        editor.hidden = true;
        legend.textContent = `Documentation for ${path}`;
        const field = (text, control) => { const label = document.createElement("label"); label.htmlFor = control.id; label.textContent = text; return label; }, suffix = displayPath.replace(/[^a-z0-9]+/gi, "-"), displayName = document.createElement("input"), description = document.createElement("textarea"), comments = document.createElement("textarea");
        displayName.id = `schema-documentation-name-${suffix}`;
        displayName.value = local?.displayName ?? documentation?.displayName ?? "";
        description.id = `schema-documentation-description-${suffix}`;
        description.value = local?.description ?? documentation?.description ?? "";
        comments.id = `schema-documentation-comments-${suffix}`;
        comments.name = "comments";
        comments.value = local?.comments ?? documentation?.comments ?? "";
        const exampleGroup = document.createElement("fieldset"), exampleLegend = document.createElement("legend");
        exampleGroup.className = "schema-property-example-editor";
        exampleLegend.textContent = "Example value";
        exampleGroup.append(exampleLegend);
        const name = `schema-documentation-example-${suffix}`, allowed = schemaPropertyExampleChoices(presented, canonicalPath, [...p.library.schemas.filter(({ id }) => id !== presented.id), presented]), type = schemaPropertyExampleInputType(presented, canonicalPath, local?.example?.value ?? documentation?.example?.value ?? allowed[0], [...p.library.schemas.filter(({ id }) => id !== presented.id), presented]);
        let example = structuredClone(local?.example ?? documentation?.example), initialized = example?.selectionMethod === "custom";
        const assistance = document.createElement("output"), noLabel = document.createElement("label"), noExample = document.createElement("input");
        assistance.className = "schema-property-example-assistance";
        noExample.type = "radio";
        noExample.name = name;
        noExample.checked = !example;
        noLabel.append(noExample, " No example value");
        noExample.addEventListener("change", () => { if (noExample.checked) {
            example = undefined;
            assistance.textContent = "";
        } });
        exampleGroup.append(noLabel);
        for (const value of allowed) {
            const label = document.createElement("label"), radio = document.createElement("input");
            radio.type = "radio";
            radio.name = name;
            radio.value = String(value);
            radio.dataset.exampleSelectionMethod = "allowed value";
            radio.checked = example?.selectionMethod === "allowed value" && Object.is(example.value, value);
            radio.addEventListener("change", () => { if (radio.checked) {
                example = { value: structuredClone(value), selectionMethod: "allowed value" };
                assistance.textContent = "";
            } });
            label.append(radio, ` ${String(value)}`);
            exampleGroup.append(label);
        }
        const customLabel = document.createElement("label"), custom = document.createElement("input"), customInput = document.createElement("input");
        custom.type = "radio";
        custom.name = name;
        custom.dataset.exampleSelectionMethod = "custom";
        custom.checked = example?.selectionMethod === "custom";
        customLabel.append(custom, " Custom value");
        customInput.dataset.schemaPropertyExampleInput = path;
        customInput.type = type === "number" ? "number" : "text";
        customInput.value = example?.selectionMethod === "custom" ? String(example.value) : type === "null" ? "null" : "";
        customInput.hidden = !custom.checked;
        customInput.readOnly = type === "null";
        const refresh = () => { const parsed = exampleValueFromInput(customInput.value, type); if (!parsed) {
            example = undefined;
            assistance.textContent = `Enter a valid ${type} example value`;
            return;
        } example = parsed; assistance.textContent = schemaPropertyExampleConflicts(parsed, allowed) ? "Example value does not satisfy the effective Allowed values rule" : ""; };
        custom.addEventListener("change", () => { if (!custom.checked)
            return; customInput.hidden = false; if (!initialized) {
            initialized = true;
            if (type === "boolean" && !customInput.value)
                customInput.value = "false";
            if (type === "null")
                customInput.value = "null";
        } refresh(); customInput.focus(); });
        customInput.addEventListener("input", refresh);
        exampleGroup.append(customLabel, customInput, assistance);
        if (custom.checked)
            refresh();
        const save = document.createElement("input"), remove = document.createElement("input");
        save.type = remove.type = "button";
        save.value = "Save documentation";
        remove.value = inherited ? "Restore inherited documentation" : "Remove documentation";
        remove.hidden = !local;
        save.addEventListener("click", () => {
            if (custom.checked && !example) {
                refresh();
                customInput.focus();
                return;
            }
            const entry = { displayName: displayName.value, description: description.value, ...(comments.value.trim() ? { comments: comments.value.trim() } : {}), ...(example ? { example: structuredClone(example) } : {}) };
            const current = p.editorDraft(p.active()).documentation?.properties?.[path];
            if ((current ?? local) && !entry.displayName.trim() && !entry.description.trim() && !entry.comments && !entry.example) {
                p.requestDocumentationRemoval(path, save);
                return;
            }
            if (p.canonical.editor && compactNode && compact) {
                const canonicalExample = entry.example ? { method: entry.example.selectionMethod === "allowed value" ? "allowed-value" : "custom", value: structuredClone(entry.example.value) } : { method: "blank" };
                void p.canonical.dispatchCommand({ kind: "set", baseRevision: compact.revision, propertyId: compactNode.id, patch: { documentation: { displayText: entry.displayName, description: entry.description, comments: entry.comments ?? "", example: canonicalExample } } });
                return;
            }
            const next = setPropertyDocumentation(p.editorDraft(p.active()).documentation ?? {}, path, entry), schemaId = p.active().id;
            p.replaceActive(updateSchemaWorkingDraft(p.active(), { documentation: next }, `Document property ${path}`));
            p.queuePersistence(schemaId);
            p.renderAll();
            p.root.querySelector("#schema-editor")?.setAttribute("aria-busy", String(p.settleCanonical));
        });
        remove.addEventListener("click", () => p.requestDocumentationRemoval(path, remove));
        edit.addEventListener("click", () => { editor.hidden = false; edit.setAttribute("aria-expanded", "true"); displayName.focus(); });
        edit.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            edit.click();
        } });
        editor.append(legend, field("Display name", displayName), displayName, field("Description", description), description, field("Comments", comments), comments, exampleGroup, save, remove);
        const section = document.createElement("section");
        section.className = "schema-property-documentation-section";
        section.setAttribute("aria-label", `Documentation for ${path}`);
        section.append(summary, edit, editor);
        item.append(section);
    }
    #renderAttachedRules(item, schema, canonicalPath, displayPath, compact, compactNode, detail) {
        const p = this.#ports, document = p.document, attached = (schema?.workingDraft?.attachedRules ?? schema?.attachedRules ?? []).filter(({ propertyPath }) => p.normalizedPath(propertyPath ?? "") === canonicalPath), disclosure = document.createElement("details"), summary = document.createElement("summary");
        disclosure.dataset.attachedRules = "true";
        disclosure.open = p.property.expandedRulePaths.has(canonicalPath);
        summary.textContent = `View attached rules (${attached.length})`;
        const count = document.createElement("span");
        count.className = "schema-property-active-rule-count";
        count.textContent = ` (${attached.filter(({ enabled }) => enabled !== false).length} active rules)`;
        this.#listen(disclosure, "toggle", () => { if (disclosure.open)
            p.property.expandedRulePaths.add(canonicalPath);
        else
            p.property.expandedRulePaths.delete(canonicalPath); });
        disclosure.append(summary, count);
        if (!attached.length)
            disclosure.append("No rules attached to this property.");
        for (const rule of attached) {
            const row = document.createElement("div");
            row.className = "schema-attached-rule";
            row.dataset.ruleId = rule.id;
            row.dataset.propertyPath = canonicalPath;
            row.tabIndex = -1;
            row.textContent = `${rule.id} v${rule.version} · ${rule.operator ?? "rule"} · ${rule.enabled === false ? "disabled" : "active"} `;
            const action = (label, run) => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.dataset.ruleId = rule.id; button.dataset.propertyPath = canonicalPath; button.dataset.schemaRuleAction = label; this.#listen(button, "click", () => run(button)); row.append(button); };
            action("Edit", (button) => { if (schema)
                p.openAttachedRule(schema.id, rule.id, displayPath, button); });
            row.lastElementChild?.classList.add("schema-attached-rule-edit");
            action(rule.enabled === false ? "Re-enable" : "Disable", () => { if (schema)
                p.updateAttachedRule(schema.id, rule.id, rule.enabled === false); });
            action("Remove", () => {
                if (!schema)
                    return;
                p.library.schemas = p.library.schemas.map((candidate) => candidate.id !== schema.id ? candidate : { ...candidate,
                    attachedRules: (candidate.attachedRules ?? []).filter(({ id }) => id !== rule.id), ...(candidate.workingDraft ? { workingDraft: { ...candidate.workingDraft, attachedRules: (candidate.workingDraft.attachedRules ?? []).filter(({ id }) => id !== rule.id) } } : {}) });
                p.persistLibraries();
                p.renderAll();
            });
            if (!p.rules.rules.some(({ id }) => id === rule.id)) {
                action("Promote to reusable rule", () => p.promoteRule(canonicalPath, rule.id));
                const promotion = row.lastElementChild;
                promotion?.classList.add("local-rule-promotion-action");
                if (promotion)
                    this.#listen(promotion, "focus", () => { p.rules.promotionFocusedPosition = { propertyPath: canonicalPath, ruleId: rule.id, detailScroll: detail?.scrollTop ?? 0 }; });
            }
            const canonicalRule = compactNode?.rules.find(({ id }) => id === rule.id);
            if (p.canonical.editor && compact && compactNode && canonicalRule && typeof document.getElementById === "function") {
                const predicate = document.createElement("section");
                mountCanonicalPredicateEditor({ host: predicate, document: compact, ...(canonicalRule.condition ? { condition: canonicalRule.condition } : {}), label: `Nested rule predicate for ${rule.id}`, saveLabel: "Save nested rule predicate",
                    onSave: (condition) => { const latest = p.canonical.editor?.load(), node = latest?.nodes[compactNode.id]; if (latest && node)
                        void p.canonical.dispatchCommand({ kind: "set", baseRevision: latest.revision, propertyId: node.id, patch: { rules: node.rules.map((candidate) => candidate.id === canonicalRule.id ? { ...candidate, condition } : candidate) } }); },
                    ...(canonicalRule.condition ? { onClear: () => { const latest = p.canonical.editor?.load(), node = latest?.nodes[compactNode.id]; if (latest && node)
                            void p.canonical.dispatchCommand({ kind: "set", baseRevision: latest.revision, propertyId: node.id, patch: { rules: node.rules.map((candidate) => { if (candidate.id !== canonicalRule.id)
                                        return candidate; const { condition: _condition, ...without } = candidate; return without; }) } }); } } : {}) });
                row.append(predicate);
            }
            disclosure.append(row);
        }
        item.append(disclosure);
    }
}
//# sourceMappingURL=property-view.js.map