import { applySchemaPropertyCopy, planSchemaPropertyCopy, } from "./data-layer-schema-property-copy.js";
function element(tag, text) { const value = document.createElement(tag); if (text !== undefined)
    value.textContent = text; return value; }
export function renderSchemaPropertyCopyReview(dialog, options) {
    const decisions = {};
    let current;
    let destructiveConfirmed = false;
    let activeSource = options.source;
    const heading = element("h4", "Copy property to another schema");
    heading.tabIndex = -1;
    const source = element("p", `Source: ${activeSource.label} · Selected path: ${options.selectedPath}`);
    const sourceLabel = element("label", "Source snapshot ");
    const sourceChoice = element("select");
    sourceChoice.id = "schema-property-copy-source";
    sourceChoice.append(...(options.sources ?? [options.source]).map((candidate, index) => Object.assign(element("option"), { value: String(index), textContent: candidate.label })));
    sourceLabel.append(sourceChoice);
    const destinationLabel = element("label", "Destination schema ");
    const destination = element("select");
    destination.id = "schema-property-copy-destination";
    destination.append(Object.assign(element("option"), { value: "", textContent: "Choose destination" }), ...options.destinations.map((schema) => Object.assign(element("option"), { value: schema.id, textContent: `${schema.name} revision ${schema.version}` })));
    destinationLabel.append(destination);
    const review = element("section");
    review.setAttribute("aria-label", "Schema property copy review");
    const feedback = element("output");
    feedback.setAttribute("aria-live", "polite");
    const confirm = element("button", "Copy to selected schema");
    confirm.type = "button";
    confirm.disabled = true;
    const cancel = element("button", "Cancel");
    cancel.type = "button";
    const renderPlan = () => {
        const selected = options.destinations.find(({ id }) => id === destination.value);
        if (!selected) {
            current = undefined;
            review.replaceChildren();
            confirm.disabled = true;
            return;
        }
        try {
            current = planSchemaPropertyCopy({ source: activeSource, destination: selected, selectedPath: options.selectedPath, schemas: options.schemas, reusableRuleIds: options.reusableRuleIds, decisions });
        }
        catch (error) {
            current = undefined;
            review.replaceChildren(element("p", error instanceof Error ? error.message : "The selected property is unavailable in this snapshot."));
            confirm.disabled = true;
            return;
        }
        const identity = element("p", `${activeSource.label} → ${selected.name} revision ${selected.version}`);
        const subtree = element("details");
        subtree.open = true;
        const subtreeSummary = element("summary", `Selected property and structural paths (${current.propertyPaths.length})`);
        const paths = element("ul");
        paths.replaceChildren(...current.propertyPaths.map((path) => element("li", path)));
        subtree.append(subtreeSummary, paths);
        const dependencies = element("details");
        const dependencySummary = element("summary", `Conditional dependencies (${current.dependencies.length})`);
        const dependencyList = element("ul");
        dependencyList.replaceChildren(...current.dependencies.map((item) => { const row = element("li"); const label = element("label"); const included = element("input"); included.type = "checkbox"; included.checked = decisions[item.path] !== "exclude dependency"; included.dataset.copyDependencyPath = item.path; included.addEventListener("change", () => { if (included.checked)
            delete decisions[item.path];
        else
            decisions[item.path] = "exclude dependency"; renderPlan(); }); label.append(included, ` ${item.path} · required by ${item.requiredBy}`); row.append(label); return row; }));
        dependencies.append(dependencySummary, dependencyList);
        const rules = element("details");
        const ruleSummary = element("summary", `Rules and reusable attachments (${current.rules.length})`);
        const ruleList = element("ul");
        ruleList.replaceChildren(...current.rules.map((item) => element("li", `${item.sourceId} · ${item.ownership} · ${item.origin.name} revision ${item.origin.version} · ${item.rule.conditionGroup ? "conditional" : "unconditional"}`)));
        rules.append(ruleSummary, ruleList);
        const documentation = element("details");
        const documentationSummary = element("summary", `Property documentation (${current.documentation.length})`);
        const documentationList = element("ul");
        documentationList.replaceChildren(...current.documentation.map((item) => element("li", `${item.path} · ${item.entry.displayName} · ${item.origin.name} revision ${item.origin.version}`)));
        documentation.append(documentationSummary, documentationList);
        const conflicts = element("fieldset");
        const legend = element("legend", `Conflicts (${current.conflicts.length})`);
        conflicts.append(legend);
        if (!current.conflicts.length)
            conflicts.append(element("p", "No conflicts. Existing compatible configuration will be merged or reused once."));
        for (const conflict of current.conflicts) {
            const row = element("section");
            row.dataset.copyConflictPath = conflict.path;
            row.append(element("p", `${conflict.path} · ${conflict.kind}`));
            if (conflict.kind === "blocked structural conflict") {
                row.append(element("p", "Destination ancestor is not an object or array. Confirmation is blocked until its structure changes."));
                conflicts.append(row);
                continue;
            }
            const label = element("label", "Resolution ");
            const choice = element("select");
            choice.dataset.copyConflictDecision = conflict.path;
            const choices = conflict.kind === "documentation conflict"
                ? [["Choose resolution", "cancel"], ["Use destination text", "use destination text"], ["Use source text", "use source text"]]
                : [["Choose resolution", "cancel"], ["Keep destination", "keep destination"], ["Replace from source", "replace from source"]];
            choice.append(...choices.map(([text, value]) => Object.assign(element("option"), { value, textContent: text })));
            choice.value = decisions[conflict.decisionKey] ?? "cancel";
            choice.addEventListener("change", () => { decisions[conflict.decisionKey] = choice.value; destructiveConfirmed = false; renderPlan(); });
            label.append(choice);
            row.append(label);
            conflicts.append(row);
        }
        const destructive = element("details");
        const destructiveCount = current.replacementImpact.paths.length + current.replacementImpact.rules.length + current.replacementImpact.documentation.length;
        const destructiveSummary = element("summary", `Replacement impact (${destructiveCount})`);
        destructive.append(destructiveSummary);
        if (destructiveCount) {
            const list = element("ul");
            list.replaceChildren(...current.replacementImpact.paths.map((path) => element("li", `Destination property replaced or removed: ${path}`)), ...current.replacementImpact.rules.map((id) => element("li", `Destination rule removed: ${id}`)), ...current.replacementImpact.documentation.map((path) => element("li", `Destination documentation removed: ${path}`)));
            const label = element("label");
            const confirmation = element("input");
            confirmation.type = "checkbox";
            confirmation.checked = destructiveConfirmed;
            confirmation.dataset.copyDestructiveConfirmation = "true";
            confirmation.addEventListener("change", () => { destructiveConfirmed = confirmation.checked; confirm.disabled = !current?.ready || !destructiveConfirmed; });
            label.append(confirmation, " Confirm replacement impact");
            destructive.append(list, label);
        }
        else
            destructive.append(element("p", "No destination-owned items will be removed."));
        const impact = element("p", current.ready ? "One destination working-draft transaction will be created. Published source and destination revisions remain unchanged." : "Resolve all conflicts and dependencies before confirmation.");
        review.replaceChildren(identity, subtree, dependencies, rules, documentation, conflicts, destructive, impact);
        confirm.disabled = !current.ready || (destructiveCount > 0 && !destructiveConfirmed);
    };
    destination.addEventListener("change", renderPlan);
    sourceChoice.addEventListener("change", () => { activeSource = (options.sources ?? [options.source])[Number(sourceChoice.value)] ?? options.source; source.textContent = `Source: ${activeSource.label} · Selected path: ${options.selectedPath}`; destructiveConfirmed = false; renderPlan(); });
    confirm.addEventListener("click", () => { if (!current || !current.ready)
        return; const transaction = applySchemaPropertyCopy(current); options.onApply(transaction); feedback.textContent = `Copied ${current.selectedPath} to ${transaction.schema.name}. Undo is available.`; dialog.close(); options.onClose?.(); });
    const close = () => { dialog.close(); options.onClose?.(); options.trigger?.focus({ preventScroll: true }); };
    cancel.addEventListener("click", close);
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); }, { once: true });
    dialog.replaceChildren(heading, source, sourceLabel, destinationLabel, review, confirm, cancel, feedback);
    dialog.showModal();
    heading.focus({ preventScroll: true });
    return { plan: () => current ? structuredClone(current) : undefined, close };
}
//# sourceMappingURL=data-layer-schema-property-copy-ui.js.map