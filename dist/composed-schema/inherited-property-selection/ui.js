const nodeOrder = (left, right) => left.label.localeCompare(right.label);
const selectionNodeKey = (kind, ...identity) => JSON.stringify([kind, ...identity]);
export function inheritedPropertySelectionHierarchy(items) {
    const concepts = new Map(), locations = new Map();
    for (const item of items) {
        let concept = concepts.get(item.concept);
        if (!concept) {
            concept = { kind: "concept", key: selectionNodeKey("concept", item.concept), label: item.concept, level: 1, propertyIds: [], children: [] };
            concepts.set(item.concept, concept);
        }
        const segments = item.path.split("/").filter(Boolean);
        let parent = concept, path = "";
        for (const [segmentIndex, segment] of segments.entries()) {
            path += `/${segment}`;
            const property = segmentIndex === segments.length - 1;
            const location = JSON.stringify([item.concept, path]);
            let node = locations.get(location);
            if (!node) {
                node = { kind: property ? "property" : "branch", key: property ? selectionNodeKey("property", item.propertyId) : selectionNodeKey("branch", item.concept, path), label: path, level: parent.level + 1, propertyIds: [], children: [] };
                parent.children.push(node);
                locations.set(location, node);
            }
            if (property) {
                node.kind = "property";
                node.key = selectionNodeKey("property", item.propertyId);
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
export function inheritedPropertySelectionTreePage(roots, expanded, offset, pageSize) {
    const flattened = [];
    const visit = (node) => {
        flattened.push(node);
        if (expanded.has(node.key))
            for (const child of node.children)
                visit(child);
    };
    for (const root of roots)
        visit(root);
    const boundedOffset = Math.max(0, Math.min(offset, Math.max(0, flattened.length - 1)));
    return { nodes: flattened.slice(boundedOffset, boundedOffset + pageSize), offset: boundedOffset, total: flattened.length };
}
export function inheritedPropertySelectionTreeTarget(nodes, currentKey, key, expanded) {
    const index = Math.max(0, nodes.findIndex((node) => node.key === currentKey)), current = nodes[index] ?? nodes[0];
    if (!current)
        return { key: currentKey };
    if (key === "ArrowDown")
        return { key: nodes[Math.min(nodes.length - 1, index + 1)]?.key ?? current.key };
    if (key === "ArrowUp")
        return { key: nodes[Math.max(0, index - 1)]?.key ?? current.key };
    if (key === "ArrowRight" && current.children.length) {
        return expanded.has(current.key) ? { key: current.children[0]?.key ?? current.key } : { key: current.key, expand: current.key };
    }
    if (key === "ArrowLeft") {
        if (current.children.length && expanded.has(current.key))
            return { key: current.key, collapse: current.key };
        for (let candidate = index - 1; candidate >= 0; candidate -= 1)
            if (nodes[candidate].level < current.level)
                return { key: nodes[candidate].key };
    }
    return { key: current.key };
}
export function mountInheritedPropertySelection(options) {
    const document = options.host.ownerDocument, focusOwner = options.focusOwner ?? options.host, card = document.createElement("section"), heading = document.createElement("h3"), summary = document.createElement("p"), edit = document.createElement("button"), workspace = document.createElement("section");
    let staged = new Set(options.model.items.filter(({ selected }) => selected).map(({ propertyId }) => propertyId)), query = "", conceptFilter = "all", typeFilter = "all", presenceFilter = "all", selectionFilter = "any", reviewOpen = false, expanded = new Set(), activeKey, detailKey, treeOffset = 0;
    card.className = "profile-inheritance-card contextual-profile-inheritance-card";
    card.dataset.profileInheritanceCard = "contextual";
    card.tabIndex = -1;
    card.setAttribute("aria-label", `Inherited properties for ${options.targetName}`);
    heading.textContent = "Inherited properties";
    edit.type = "button";
    edit.textContent = "Edit selection";
    edit.setAttribute("aria-expanded", "false");
    workspace.className = "profile-inheritance-workspace";
    workspace.dataset.profileInheritanceWorkspace = "contextual";
    workspace.hidden = true;
    const reset = () => { staged = new Set(options.model.items.filter(({ selected }) => selected).map(({ propertyId }) => propertyId)); query = ""; conceptFilter = typeFilter = presenceFilter = "all"; selectionFilter = "any"; reviewOpen = false; expanded = new Set(); activeKey = detailKey = undefined; treeOffset = 0; };
    const focusAfter = (selector) => queueMicrotask(() => workspace.querySelector(selector)?.focus({ preventScroll: true }));
    const allKeys = (nodes) => nodes.flatMap((node) => [node.key, ...allKeys(node.children)]);
    const render = () => {
        summary.textContent = `${staged.size} of ${options.model.totalCount} selected · contextual parent stack · sparse exclusions`;
        workspace.replaceChildren();
        const title = document.createElement("h3"), intro = document.createElement("p"), toolbar = document.createElement("section"), search = document.createElement("input"), filters = document.createElement("div"), concept = document.createElement("select"), type = document.createElement("select"), presence = document.createElement("select"), selection = document.createElement("select"), pager = document.createElement("nav"), previous = document.createElement("button"), pageStatus = document.createElement("span"), next = document.createElement("button"), tree = document.createElement("ol"), actions = document.createElement("aside"), counts = document.createElement("strong"), review = document.createElement("button"), cancel = document.createElement("button"), apply = document.createElement("button"), reviewPanel = document.createElement("section");
        title.textContent = `Choose what ${options.targetName} inherits`;
        intro.textContent = "The complete current parent stack is selected by default. Apply stores only sparse stable-identity exclusions.";
        search.type = "search";
        search.value = query;
        search.placeholder = "Name, path, source, or concept";
        search.setAttribute("aria-label", "Search inherited properties");
        const appendFilter = (control, values, allLabel, value, label) => { control.append(new Option(allLabel, "all"), ...values.map((entry) => new Option(entry, entry))); control.value = value; control.setAttribute("aria-label", label); };
        appendFilter(concept, [...new Set(options.model.items.map(({ concept }) => concept))].sort(), "All concepts", conceptFilter, "Inherited property concept filter");
        appendFilter(type, [...new Set(options.model.items.map((item) => item.type))].sort(), "All types", typeFilter, "Inherited property type filter");
        appendFilter(presence, [...new Set(options.model.items.map((item) => item.presence))].sort(), "Any presence", presenceFilter, "Inherited property presence filter");
        for (const [value, label] of [["any", "Any selection state"], ["selected", "Selected"], ["unselected", "Unselected"]])
            selection.append(new Option(label, value));
        selection.value = selectionFilter;
        selection.setAttribute("aria-label", "Inherited property selection state filter");
        filters.className = "profile-inheritance-filters";
        filters.setAttribute("aria-label", "Inherited property filters");
        filters.append(concept, type, presence, selection);
        toolbar.className = "profile-inheritance-toolbar";
        toolbar.append(search, filters);
        search.addEventListener("input", () => { query = search.value; treeOffset = 0; rerenderWithFocus("Search inherited properties", search.selectionStart); });
        concept.addEventListener("change", () => { conceptFilter = concept.value; treeOffset = 0; rerenderWithFocus("Inherited property concept filter"); });
        type.addEventListener("change", () => { typeFilter = type.value; treeOffset = 0; rerenderWithFocus("Inherited property type filter"); });
        presence.addEventListener("change", () => { presenceFilter = presence.value; treeOffset = 0; rerenderWithFocus("Inherited property presence filter"); });
        selection.addEventListener("change", () => { selectionFilter = selection.value; treeOffset = 0; rerenderWithFocus("Inherited property selection state filter"); });
        const needle = query.trim().toLowerCase(), visible = options.model.items.filter((item) => (conceptFilter === "all" || item.concept === conceptFilter) && (typeFilter === "all" || item.type === typeFilter) && (presenceFilter === "all" || item.presence === presenceFilter) && (selectionFilter === "any" || (selectionFilter === "selected") === staged.has(item.propertyId)) && (!needle || `${item.path} ${item.source} ${item.concept}`.toLowerCase().includes(needle))), hierarchy = inheritedPropertySelectionHierarchy(visible), discovering = Boolean(needle || conceptFilter !== "all" || typeFilter !== "all" || presenceFilter !== "all" || selectionFilter !== "any"), effectiveExpanded = discovering ? new Set(allKeys(hierarchy)) : expanded, page = inheritedPropertySelectionTreePage(hierarchy, effectiveExpanded, treeOffset, 100), blockedIds = new Set(options.model.items.filter(({ blocked }) => blocked).map(({ propertyId }) => propertyId));
        treeOffset = page.offset;
        pager.className = "profile-inheritance-tree-pager";
        pager.setAttribute("aria-label", "Inheritance tree pages");
        previous.type = next.type = "button";
        previous.textContent = "Previous properties";
        next.textContent = "Next properties";
        previous.disabled = page.offset === 0;
        next.disabled = page.offset + 100 >= page.total;
        pageStatus.textContent = page.total ? `Nodes ${page.offset + 1}–${Math.min(page.offset + 100, page.total)} of ${page.total}` : "No matching properties";
        previous.addEventListener("click", () => { treeOffset = Math.max(0, treeOffset - 100); render(); focusAfter("[aria-label='Inheritance tree pages'] button:last-of-type"); });
        next.addEventListener("click", () => { treeOffset += 100; render(); focusAfter("[aria-label='Inheritance tree pages'] button:first-of-type"); });
        pager.append(previous, pageStatus, next);
        tree.className = "profile-inheritance-tree";
        tree.setAttribute("role", "tree");
        tree.setAttribute("aria-label", `Inherited property selection tree, showing ${visible.length} of ${options.model.totalCount} properties`);
        const focusTree = (key) => { activeKey = key; focusAfter(`[data-tree-node-id='${CSS.escape(key)}']`); };
        for (const node of page.nodes) {
            const item = document.createElement("li"), row = document.createElement("div"), disclosure = node.children.length ? document.createElement("button") : document.createElement("span"), toggle = document.createElement("button"), state = inheritedPropertySelectionNodeState(node, staged), selectableIds = node.propertyIds.filter((propertyId) => !blockedIds.has(propertyId)), isExpanded = effectiveExpanded.has(node.key);
            item.setAttribute("role", "treeitem");
            item.setAttribute("aria-level", String(node.level));
            item.setAttribute("aria-checked", state);
            item.style.setProperty("--tree-level", String(node.level));
            item.tabIndex = node.key === (activeKey ?? page.nodes[0]?.key) ? 0 : -1;
            item.dataset.treeNodeId = node.key;
            item.dataset.inheritedSelectionNode = node.kind;
            if (node.propertyId)
                item.dataset.inheritedPropertyId = node.propertyId;
            if (node.children.length)
                item.setAttribute("aria-expanded", String(isExpanded));
            item.addEventListener("focus", () => { activeKey = node.key; });
            item.addEventListener("keydown", (event) => { if (event.target !== item || !["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", " "].includes(event.key))
                return; event.preventDefault(); if (event.key === " ") {
                toggle.click();
                return;
            } const target = inheritedPropertySelectionTreeTarget(page.nodes, node.key, event.key, effectiveExpanded); if (target.expand)
                expanded.add(target.expand); if (target.collapse)
                expanded.delete(target.collapse); if (target.expand || target.collapse)
                render(); focusTree(target.key); });
            if (disclosure instanceof HTMLButtonElement) {
                disclosure.type = "button";
                disclosure.className = "profile-inheritance-disclosure";
                disclosure.textContent = isExpanded ? "▾" : "▸";
                disclosure.setAttribute("aria-label", `${isExpanded ? "Collapse" : "Expand"} ${node.label}`);
                disclosure.addEventListener("click", () => { isExpanded ? expanded.delete(node.key) : expanded.add(node.key); activeKey = node.key; render(); focusTree(node.key); });
            }
            else
                disclosure.className = "profile-inheritance-disclosure-placeholder";
            toggle.type = "button";
            toggle.className = "profile-inheritance-checkbox";
            toggle.setAttribute("role", "checkbox");
            toggle.setAttribute("aria-checked", state);
            toggle.disabled = selectableIds.length === 0;
            toggle.setAttribute("aria-label", `${node.label}, ${node.propertyIds.filter((propertyId) => staged.has(propertyId)).length} of ${node.propertyIds.length} selected`);
            const primary = document.createElement("span"), secondary = document.createElement("small");
            primary.textContent = node.label;
            secondary.textContent = node.item ? `${node.item.type} · ${node.item.presence} · ${node.item.source}` : `${node.propertyIds.filter((propertyId) => staged.has(propertyId)).length} of ${node.propertyIds.length} selected`;
            toggle.append(primary, secondary);
            toggle.addEventListener("click", () => { const choose = inheritedPropertySelectionNodeState(node, staged) !== "true"; for (const propertyId of selectableIds)
                choose ? staged.add(propertyId) : staged.delete(propertyId); activeKey = node.key; render(); focusTree(node.key); });
            row.append(disclosure, toggle);
            if (node.item) {
                const details = document.createElement("button");
                details.type = "button";
                details.className = "profile-inheritance-details-button";
                details.textContent = detailKey === node.key ? "Hide details" : "Property details";
                details.setAttribute("aria-expanded", String(detailKey === node.key));
                details.addEventListener("click", () => { detailKey = detailKey === node.key ? undefined : node.key; activeKey = node.key; render(); focusAfter(detailKey ? `[data-inherited-property-details='${CSS.escape(node.item.propertyId)}']` : `[data-tree-node-id='${CSS.escape(node.key)}']`); });
                row.append(details);
            }
            item.append(row);
            if (node.item && detailKey === node.key) {
                const detail = document.createElement("section");
                detail.dataset.inheritedPropertyDetails = node.item.propertyId;
                detail.dataset.profileDetails = node.item.propertyId;
                detail.tabIndex = -1;
                detail.textContent = `Full path ${node.item.path} · Source and provenance ${node.item.source} · ${node.item.blocked ? `${node.item.blocker} · Repair ${node.item.repairRoute}` : "No selection blocker"}`;
                item.append(detail);
            }
            tree.append(item);
        }
        const deselected = options.model.items.filter(({ propertyId }) => !staged.has(propertyId)), issues = options.model.items.filter(({ blocked }) => blocked).length;
        actions.className = "profile-inheritance-summary";
        actions.setAttribute("aria-label", "Selection summary");
        counts.textContent = `Selected properties ${staged.size} · Exclusions ${deselected.length} · Issues ${issues}`;
        review.type = cancel.type = apply.type = "button";
        review.textContent = "Review selection";
        review.setAttribute("aria-expanded", String(reviewOpen));
        review.addEventListener("click", () => { reviewOpen = !reviewOpen; render(); focusAfter("[aria-label='Selection summary'] button"); });
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => { reset(); workspace.hidden = true; edit.setAttribute("aria-expanded", "false"); render(); edit.focus({ preventScroll: true }); });
        apply.textContent = "Apply inheritance";
        apply.addEventListener("click", () => { focusOwner.dataset.inheritedSelectionPendingFocus = "contextual"; options.onApply([...staged]); workspace.hidden = true; edit.setAttribute("aria-expanded", "false"); });
        reviewPanel.hidden = !reviewOpen;
        reviewPanel.setAttribute("aria-label", "Reviewed inheritance selection");
        const affectedContext = options.targetName.endsWith("Flow Page-instance") ? `${options.targetName} and its contained Event occurrence branches` : options.targetName.endsWith("Page") ? `${options.targetName} and every downstream Flow Page-instance branch` : options.targetName;
        reviewPanel.textContent = `Selected ${staged.size} of ${options.model.totalCount}. Deselected properties and descendants: ${deselected.map(({ path, descendantPaths }) => [path, ...descendantPaths].join(", ")).join("; ") || "none"}. Affected compiled contexts: ${affectedContext}. Outputs become stale, runtime validation changes, and one Undo action is available. The Draft and effective Table remain unchanged until Apply.`;
        actions.append(counts, review, cancel, apply, reviewPanel);
        workspace.append(title, intro, toolbar, pager, tree, actions);
    };
    function rerenderWithFocus(label, caret) { render(); const control = workspace.querySelector(`[aria-label="${label}"]`); control?.focus(); if (control instanceof HTMLInputElement && caret !== undefined)
        control.setSelectionRange(caret, caret); }
    edit.addEventListener("click", () => { const open = workspace.hidden; workspace.hidden = !open; edit.setAttribute("aria-expanded", String(open)); if (open) {
        reset();
        render();
        workspace.querySelector("input,button")?.focus({ preventScroll: true });
    } });
    render();
    card.append(heading, summary, edit, workspace);
    options.host.append(card);
    if (focusOwner.dataset.inheritedSelectionPendingFocus === "contextual") {
        delete focusOwner.dataset.inheritedSelectionPendingFocus;
        queueMicrotask(() => {
            card.focus({ preventScroll: true });
            card.dataset.applyFocusRestored = String(document.activeElement === card);
        });
    }
    return card;
}
//# sourceMappingURL=ui.js.map