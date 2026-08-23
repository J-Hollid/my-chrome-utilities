const nodeOrder = (left, right) => left.label.localeCompare(right.label);
export function inheritedPropertySelectionHierarchy(items) {
    const concepts = new Map();
    for (const item of items) {
        let concept = concepts.get(item.concept);
        if (!concept) {
            concept = { kind: "concept", key: `concept:${item.concept}`, label: item.concept, level: 1, propertyIds: [], children: [] };
            concepts.set(item.concept, concept);
        }
        const segments = item.path.split("/").filter(Boolean);
        let parent = concept, path = "";
        for (const [segmentIndex, segment] of segments.entries()) {
            path += `/${segment}`;
            const property = segmentIndex === segments.length - 1;
            let node = parent.children.find(({ key }) => key === `${item.concept}:${path}`);
            if (!node) {
                node = { kind: property ? "property" : "branch", key: `${item.concept}:${path}`, label: path, level: parent.level + 1, propertyIds: [], children: [] };
                parent.children.push(node);
            }
            if (property) {
                node.kind = "property";
                node.propertyId = item.propertyId;
                node.item = item;
            }
            parent = node;
        }
    }
    const finalize = (node) => { node.children.sort(nodeOrder); const ids = [...(node.propertyId ? [node.propertyId] : []), ...node.children.flatMap(finalize)]; node.propertyIds = [...new Set(ids)]; return node.propertyIds; };
    const roots = [...concepts.values()].sort(nodeOrder);
    for (const root of roots)
        finalize(root);
    return roots;
}
export const inheritedPropertySelectionNodeState = (node, selected) => {
    const count = node.propertyIds.filter((propertyId) => selected.has(propertyId)).length;
    return count === 0 ? "false" : count === node.propertyIds.length ? "true" : "mixed";
};
export function mountInheritedPropertySelection(options) {
    const document = options.host.ownerDocument, section = document.createElement("section"), summary = document.createElement("button"), workspace = document.createElement("section");
    let staged = new Set(options.model.items.filter(({ selected }) => selected).map(({ propertyId }) => propertyId)), query = "", conceptFilter = "all", typeFilter = "all", presenceFilter = "all", selectionFilter = "any", reviewOpen = false;
    section.className = "inherited-property-selection";
    section.setAttribute("aria-label", `Inherited properties for ${options.targetName}`);
    summary.type = "button";
    summary.setAttribute("aria-expanded", "false");
    workspace.hidden = true;
    workspace.setAttribute("aria-label", "Inherited property selection workspace");
    const reset = () => { staged = new Set(options.model.items.filter(({ selected }) => selected).map(({ propertyId }) => propertyId)); query = ""; conceptFilter = typeFilter = presenceFilter = "all"; selectionFilter = "any"; reviewOpen = false; };
    const render = () => {
        summary.textContent = `Inherited properties ${staged.size} of ${options.model.totalCount} selected`;
        workspace.replaceChildren();
        const heading = document.createElement("h3"), search = document.createElement("input"), filters = document.createElement("div"), concept = document.createElement("select"), type = document.createElement("select"), presence = document.createElement("select"), filter = document.createElement("select"), tree = document.createElement("ol"), actions = document.createElement("div"), review = document.createElement("button"), cancel = document.createElement("button"), apply = document.createElement("button"), reviewPanel = document.createElement("section");
        heading.textContent = `Choose what ${options.targetName} inherits`;
        search.type = "search";
        search.value = query;
        search.placeholder = "Name, path, source, or concept";
        search.setAttribute("aria-label", "Search inherited properties");
        const appendFilter = (control, values, allLabel, value, label) => { control.append(new Option(allLabel, "all"), ...values.map((entry) => new Option(entry, entry))); control.value = value; control.setAttribute("aria-label", label); };
        appendFilter(concept, [...new Set(options.model.items.map(({ concept }) => concept))].sort(), "All concepts", conceptFilter, "Inherited property concept filter");
        appendFilter(type, [...new Set(options.model.items.map((item) => item.type))].sort(), "All types", typeFilter, "Inherited property type filter");
        appendFilter(presence, [...new Set(options.model.items.map((item) => item.presence))].sort(), "Any presence", presenceFilter, "Inherited property presence filter");
        for (const [value, label] of [["any", "Any selection state"], ["selected", "Selected"], ["unselected", "Unselected"]])
            filter.append(new Option(label, value));
        filter.value = selectionFilter;
        filter.setAttribute("aria-label", "Inherited property selection state filter");
        filters.setAttribute("aria-label", "Inherited property filters");
        filters.append(concept, type, presence, filter);
        search.addEventListener("input", () => { query = search.value; render(); });
        concept.addEventListener("change", () => { conceptFilter = concept.value; render(); });
        type.addEventListener("change", () => { typeFilter = type.value; render(); });
        presence.addEventListener("change", () => { presenceFilter = presence.value; render(); });
        filter.addEventListener("change", () => { selectionFilter = filter.value; render(); });
        const needle = query.trim().toLowerCase(), visible = options.model.items.filter((item) => (conceptFilter === "all" || item.concept === conceptFilter) && (typeFilter === "all" || item.type === typeFilter) && (presenceFilter === "all" || item.presence === presenceFilter) && (selectionFilter === "any" || (selectionFilter === "selected") === staged.has(item.propertyId)) && (!needle || `${item.path} ${item.source} ${item.concept}`.toLowerCase().includes(needle)));
        tree.setAttribute("role", "tree");
        tree.setAttribute("aria-label", `Inherited property selection tree, showing ${visible.length} of ${options.model.totalCount} properties`);
        const blockedIds = new Set(visible.filter(({ blocked }) => blocked).map(({ propertyId }) => propertyId)), renderNode = (node) => { const item = document.createElement("li"), toggle = document.createElement("button"), children = document.createElement("ol"), state = inheritedPropertySelectionNodeState(node, staged), selectableIds = node.propertyIds.filter((propertyId) => !blockedIds.has(propertyId)); item.setAttribute("role", "treeitem"); item.setAttribute("aria-level", String(node.level)); item.setAttribute("aria-checked", state); item.dataset.inheritedSelectionNode = node.kind; if (node.propertyId)
            item.dataset.inheritedPropertyId = node.propertyId; toggle.type = "button"; toggle.setAttribute("role", "checkbox"); toggle.setAttribute("aria-checked", state); toggle.disabled = selectableIds.length === 0; toggle.textContent = node.kind === "concept" ? `${node.label} · ${node.propertyIds.filter((propertyId) => staged.has(propertyId)).length} of ${node.propertyIds.length} selected` : node.label; toggle.addEventListener("click", () => { const choose = inheritedPropertySelectionNodeState(node, staged) !== "true"; for (const propertyId of selectableIds)
            choose ? staged.add(propertyId) : staged.delete(propertyId); render(); }); item.append(toggle); if (node.item) {
            const detail = document.createElement("span");
            detail.textContent = `${node.item.source}${node.item.blocked ? ` · ${node.item.blocker} ${node.item.repairRoute}` : ""}`;
            item.append(detail);
        } for (const child of node.children)
            children.append(renderNode(child)); if (node.children.length)
            item.append(children); return item; };
        for (const root of inheritedPropertySelectionHierarchy(visible))
            tree.append(renderNode(root));
        review.type = cancel.type = apply.type = "button";
        review.textContent = "Review selection";
        review.setAttribute("aria-expanded", String(reviewOpen));
        review.addEventListener("click", () => { reviewOpen = !reviewOpen; render(); });
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => { reset(); workspace.hidden = true; summary.setAttribute("aria-expanded", "false"); render(); summary.focus(); });
        apply.textContent = "Apply inheritance";
        apply.addEventListener("click", () => { options.onApply([...staged]); workspace.hidden = true; summary.setAttribute("aria-expanded", "false"); });
        reviewPanel.hidden = !reviewOpen;
        reviewPanel.setAttribute("aria-label", "Reviewed inherited property selection");
        const deselected = options.model.items.filter(({ propertyId }) => !staged.has(propertyId));
        reviewPanel.textContent = `Selected ${staged.size} of ${options.model.totalCount}. Deselected properties and descendants: ${deselected.map(({ path, descendantPaths }) => [path, ...descendantPaths].join(", ")).join("; ") || "none"}. Affected compiled contexts recompile, outputs become stale, runtime validation changes, and one Undo action is available. The Draft and effective Table remain unchanged until Apply.`;
        actions.append(review, cancel, apply);
        workspace.append(heading, search, filters, tree, actions, reviewPanel);
    };
    summary.addEventListener("click", () => { const open = workspace.hidden; workspace.hidden = !open; summary.setAttribute("aria-expanded", String(open)); if (open) {
        reset();
        render();
        workspace.querySelector("input,button")?.focus();
    } });
    render();
    section.append(summary, workspace);
    options.host.append(section);
    return section;
}
//# sourceMappingURL=ui.js.map