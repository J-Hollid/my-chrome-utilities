import { canonicalPropertyPath } from "./data-layer-canonical-schema.js";
import { copyProfileInheritanceRecipe, createProfileInheritanceRecipe, profileInheritanceSelection, profileInheritanceSummary, searchProfileInheritanceProperties } from "./data-layer-selective-profile-inheritance.js";
const clone = (value) => structuredClone(value);
const stable = (values) => [...new Set(values)];
const descendants = (document, propertyId) => { const children = Object.values(document.nodes).filter(({ parentId }) => parentId === propertyId).sort((left, right) => left.order - right.order); return [propertyId, ...children.flatMap(({ id }) => descendants(document, id))]; };
const ruleById = (document, ruleId) => { for (const node of Object.values(document.nodes)) {
    const rule = node.rules.find(({ id }) => id === ruleId);
    if (rule)
        return { propertyId: node.id, rule };
} };
const option = (value, label) => new Option(label, value);
export function mountSelectiveProfileInheritance(options) {
    const { host, profile, target } = options, document = profile.canonicalSchema, card = globalThis.document.createElement("section"), heading = globalThis.document.createElement("h3"), summaryText = globalThis.document.createElement("p"), edit = globalThis.document.createElement("button"), workspace = globalThis.document.createElement("section");
    let staged = clone(options.recipe), open = false, filters = { query: "", concept: "all", type: "all", required: "any", selection: "any" };
    card.className = "profile-inheritance-card";
    card.dataset.profileInheritanceCard = profile.id;
    card.tabIndex = -1;
    card.setAttribute("aria-label", `${profile.name} inheritance summary`);
    heading.textContent = profile.name;
    edit.type = "button";
    edit.textContent = "Edit selection";
    edit.setAttribute("aria-expanded", "false");
    workspace.className = "profile-inheritance-workspace";
    workspace.dataset.profileInheritanceWorkspace = profile.id;
    workspace.hidden = true;
    const updateCard = () => { const summary = profileInheritanceSummary(document, options.recipe); summaryText.textContent = `${summary.synchronizedConcepts} synchronized concepts · ${summary.fixedProperties} fixed selections · ${summary.exclusions} exclusions · ${summary.ruleOverrides} rule overrides · ${summary.effective} effective properties${summary.missingSelections ? ` · ${summary.missingSelections} missing selections` : ""}`; };
    const focusAfter = (selector) => queueMicrotask(() => workspace.querySelector(selector)?.focus({ preventScroll: true }));
    const renderWorkspace = () => {
        workspace.replaceChildren();
        const title = globalThis.document.createElement("h3"), intro = globalThis.document.createElement("p"), starting = globalThis.document.createElement("select"), startingLabel = globalThis.document.createElement("label"), copySelect = globalThis.document.createElement("select"), copyButton = globalThis.document.createElement("button"), copyLabel = globalThis.document.createElement("label"), search = globalThis.document.createElement("input"), searchLabel = globalThis.document.createElement("label"), filterRow = globalThis.document.createElement("div"), conceptFilter = globalThis.document.createElement("select"), typeFilter = globalThis.document.createElement("select"), requiredFilter = globalThis.document.createElement("select"), selectionFilter = globalThis.document.createElement("select"), concepts = globalThis.document.createElement("section"), results = globalThis.document.createElement("ul"), dependencies = globalThis.document.createElement("section"), sticky = globalThis.document.createElement("aside"), apply = globalThis.document.createElement("button"), cancel = globalThis.document.createElement("button");
        title.textContent = `Choose what ${target.name} inherits from ${profile.name}`;
        intro.textContent = "Concepts stay synchronized with the source. Property choices are pinned to stable identities. Explicit exclusions continue to win.";
        startingLabel.textContent = "Starting point";
        for (const [value, label] of [["everything", "Everything"], ["concepts", "Choose concepts"], ["properties", "Choose properties"], ["empty", "Start empty"]])
            starting.append(option(value, label));
        starting.value = staged.startingPoint;
        startingLabel.append(starting);
        starting.addEventListener("change", () => { const next = createProfileInheritanceRecipe({ id: staged.id, profileId: staged.profileId, targetId: staged.targetId, startingPoint: starting.value, sourceRevision: document.revision }); staged = next; renderWorkspace(); focusAfter("select"); });
        const sources = options.copySources ?? [];
        copyLabel.textContent = "Copy selection from";
        copySelect.append(option("", "Choose a target"));
        for (const source of sources)
            copySelect.append(option(source.recipe.id, source.label));
        copyButton.type = "button";
        copyButton.textContent = "Copy selection";
        copyButton.disabled = !sources.length;
        copyButton.addEventListener("click", () => { const source = sources.find(({ recipe }) => recipe.id === copySelect.value); if (!source)
            return; staged = copyProfileInheritanceRecipe(source.recipe, { id: staged.id, targetId: target.id }); staged.profileId = profile.id; staged.sourceRevision = document.revision; renderWorkspace(); focusAfter("[data-profile-copy]"); });
        copyLabel.append(copySelect, copyButton);
        copyLabel.dataset.profileCopy = "";
        searchLabel.textContent = "Search source properties";
        search.type = "search";
        search.value = filters.query;
        search.placeholder = "Name, path, description, or example";
        search.addEventListener("input", () => { filters = { ...filters, query: search.value }; renderWorkspace(); focusAfter("input[type=search]"); });
        searchLabel.append(search);
        const conceptsAvailable = stable(Object.values(document.nodes).flatMap(({ concept }) => concept ? [concept] : [])), types = stable(Object.values(document.nodes).map(({ type }) => type));
        conceptFilter.append(option("all", "All concepts"), ...conceptsAvailable.map((value) => option(value, value)));
        typeFilter.append(option("all", "All types"), ...types.map((value) => option(value, value)));
        requiredFilter.append(option("any", "Any required state"), option("required", "Required"), option("optional", "Optional"));
        selectionFilter.append(option("any", "Any selection state"), option("selected", "Selected"), option("unselected", "Unselected"));
        for (const [control, key] of [[conceptFilter, "concept"], [typeFilter, "type"], [requiredFilter, "required"], [selectionFilter, "selection"]]) {
            control.value = filters[key];
            control.setAttribute("aria-label", `${key} filter`);
            control.addEventListener("change", () => { filters = { ...filters, [key]: control.value }; renderWorkspace(); focusAfter(`[aria-label='${key} filter']`); });
            filterRow.append(control);
        }
        filterRow.className = "profile-inheritance-filters";
        concepts.setAttribute("aria-label", "Concept selections");
        concepts.append(Object.assign(globalThis.document.createElement("h4"), { textContent: "Live concept selections" }));
        const selected = new Set(profileInheritanceSelection(document, staged).directPropertyIds);
        for (const concept of conceptsAvailable) {
            const ids = Object.values(document.nodes).filter((node) => node.concept === concept).map(({ id }) => id), count = ids.filter((id) => selected.has(id)).length, button = globalThis.document.createElement("button"), active = staged.conceptSelections.includes(concept);
            button.type = "button";
            button.dataset.concept = concept;
            button.setAttribute("role", "checkbox");
            button.setAttribute("aria-checked", count === 0 ? "false" : count === ids.length ? "true" : "mixed");
            button.textContent = `${concept}: ${count} of ${ids.length} selected${active ? " · synchronized" : ""}`;
            button.addEventListener("click", () => { staged.conceptSelections = active ? staged.conceptSelections.filter((value) => value !== concept) : stable([...staged.conceptSelections, concept]); renderWorkspace(); focusAfter(`[data-concept='${CSS.escape(concept)}']`); });
            concepts.append(button);
        }
        const matches = searchProfileInheritanceProperties(document, filters, staged), windowed = matches.slice(0, 80);
        results.className = "profile-inheritance-results";
        results.setAttribute("aria-label", `Source properties, showing ${windowed.length} of ${matches.length}`);
        for (const node of windowed) {
            const item = globalThis.document.createElement("li"), toggle = globalThis.document.createElement("button"), branchIds = descendants(document, node.id), selectedCount = branchIds.filter((id) => selected.has(id)).length, isSelected = selected.has(node.id), path = canonicalPropertyPath(document, node.id);
            toggle.type = "button";
            toggle.dataset.profileProperty = node.id;
            toggle.setAttribute("role", "checkbox");
            toggle.setAttribute("aria-checked", selectedCount === 0 ? "false" : selectedCount === branchIds.length ? "true" : "mixed");
            toggle.textContent = `${path} · ${node.type} · ${selectedCount} of ${branchIds.length} selected${isSelected ? " · selected" : " · unselected"}`;
            toggle.addEventListener("click", () => { if (selectedCount === branchIds.length) {
                staged.propertySelections = staged.propertySelections.filter((id) => !branchIds.includes(id));
                staged.excludedPropertyIds = stable([...staged.excludedPropertyIds, ...branchIds]);
            }
            else {
                staged.propertySelections = stable([...staged.propertySelections, ...branchIds]);
                staged.excludedPropertyIds = staged.excludedPropertyIds.filter((id) => !branchIds.includes(id));
            } renderWorkspace(); focusAfter(`[data-profile-property='${CSS.escape(node.id)}']`); });
            const detail = globalThis.document.createElement("small");
            detail.textContent = [node.documentation.displayText, node.documentation.description, node.documentation.example.value].filter(Boolean).join(" · ");
            item.append(toggle, detail);
            results.append(item);
        }
        dependencies.setAttribute("aria-label", "Missing rule dependencies");
        dependencies.append(Object.assign(globalThis.document.createElement("h4"), { textContent: "Rule dependencies" }));
        const closure = profileInheritanceSelection(document, staged);
        if (!closure.missingRuleDependencies.length)
            dependencies.append(Object.assign(globalThis.document.createElement("p"), { textContent: "No unresolved rule dependencies." }));
        for (const dependency of closure.missingRuleDependencies) {
            const row = globalThis.document.createElement("div"), description = globalThis.document.createElement("p"), include = globalThis.document.createElement("button"), exclude = globalThis.document.createElement("button"), replace = globalThis.document.createElement("button"), source = ruleById(document, dependency.sourceRuleId), invariant = source?.rule.enforcement === "invariant";
            row.dataset.ruleDependency = dependency.sourceRuleId;
            description.textContent = `${canonicalPropertyPath(document, dependency.sourcePropertyId)} rule ${dependency.sourceRuleId} needs ${canonicalPropertyPath(document, dependency.propertyId)}`;
            include.type = exclude.type = replace.type = "button";
            include.textContent = `Include ${canonicalPropertyPath(document, dependency.propertyId)}`;
            exclude.textContent = "Exclude this rule";
            replace.textContent = "Replace rule for this target";
            exclude.disabled = replace.disabled = Boolean(invariant);
            if (invariant)
                description.textContent += ` · invariant ${dependency.sourceRuleId} cannot be excluded or weakened`;
            include.addEventListener("click", () => { staged.includedDependencyPropertyIds = stable([...staged.includedDependencyPropertyIds, dependency.propertyId]); renderWorkspace(); focusAfter(`[data-rule-dependency='${CSS.escape(dependency.sourceRuleId)}'] button`); });
            exclude.addEventListener("click", () => { staged.excludedRuleIds = stable([...staged.excludedRuleIds, dependency.sourceRuleId]); renderWorkspace(); focusAfter("[aria-label='Missing rule dependencies']"); });
            replace.addEventListener("click", () => { if (dependency.sourceRuleId.startsWith("presence:")) {
                staged.presenceReplacements = [...staged.presenceReplacements, { sourceRuleId: dependency.sourceRuleId, propertyId: dependency.sourcePropertyId, presence: "required" }];
            }
            else if (source) {
                staged.excludedRuleIds = stable([...staged.excludedRuleIds, dependency.sourceRuleId]);
                staged.ruleReplacements = [...staged.ruleReplacements, { sourceRuleId: dependency.sourceRuleId, propertyId: dependency.sourcePropertyId, rule: { ...clone(source.rule), id: options.id("rule"), replacesRuleId: dependency.sourceRuleId } }];
            } renderWorkspace(); focusAfter("[aria-label='Missing rule dependencies']"); });
            row.append(description, include, exclude, replace);
            dependencies.append(row);
        }
        const totals = profileInheritanceSummary(document, staged);
        sticky.className = "profile-inheritance-summary";
        sticky.setAttribute("aria-label", "Selection summary");
        sticky.textContent = `Direct ${totals.direct} · Structural ${totals.structural} · Rule dependencies ${totals.ruleDependencies} · Conflicts ${totals.conflicts} · Effective total ${totals.effective}`;
        apply.type = cancel.type = "button";
        apply.textContent = "Apply inheritance";
        cancel.textContent = "Cancel";
        apply.addEventListener("click", () => options.onApply({ ...clone(staged), sourceRevision: document.revision }));
        cancel.addEventListener("click", () => { staged = clone(options.recipe); open = false; workspace.hidden = true; edit.setAttribute("aria-expanded", "false"); edit.focus({ preventScroll: true }); });
        sticky.append(apply, cancel);
        workspace.append(title, intro, startingLabel, ...(sources.length ? [copyLabel] : []), searchLabel, filterRow, concepts, results, dependencies, sticky);
    };
    edit.addEventListener("click", () => { open = !open; workspace.hidden = !open; edit.setAttribute("aria-expanded", String(open)); if (open) {
        staged = clone(options.recipe);
        renderWorkspace();
        queueMicrotask(() => workspace.querySelector("select,input,button")?.focus({ preventScroll: true }));
    } });
    updateCard();
    card.append(heading, summaryText, edit, workspace);
    host.append(card);
    return card;
}
//# sourceMappingURL=data-layer-selective-profile-inheritance-ui.js.map