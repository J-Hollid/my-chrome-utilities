import { addFlowPageFrame, addGraphOccurrence, addInteractionOccurrenceToPage, addPageContextOccurrence, addUngroupedPageFrame, documentaryFlowGraph, flowRelationshipText, moveGraphOccurrence, projectFlowGraph, removeFlowPageFrame, removeGraphOccurrence, reorderFlowPageGroupLane, saveFlowViewState, saveGraphRelationship, setFlowPageGroupLanes, } from "./data-layer-flow-graph.js";
const nodeWidth = 170, nodeHeight = 82, laneWidth = 220;
const q = (selector, root = document) => { const element = root.querySelector(selector); if (!element)
    throw new Error(`Missing ${selector}`); return element; };
const svg = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);
const button = (text, action) => { const control = document.createElement("button"); control.type = "button"; control.textContent = text; control.addEventListener("click", action); return control; };
const entityName = (entities, id, fallback = "Unknown") => entities.find((entity) => entity.id === id)?.name ?? fallback;
export function flowEdgeGeometry(source, target, width = nodeWidth, height = nodeHeight) {
    const halfWidth = width / 2, halfHeight = height / 2, sourceCenter = { x: source.x + halfWidth, y: source.y + halfHeight }, targetCenter = { x: target.x + halfWidth, y: target.y + halfHeight }, dx = targetCenter.x - sourceCenter.x, dy = targetCenter.y - sourceCenter.y, length = Math.hypot(dx, dy), unitX = length < 0.001 ? 1 : dx / length, unitY = length < 0.001 ? 0 : dy / length, borderDistance = Math.min(Math.abs(unitX) < 0.001 ? Infinity : halfWidth / Math.abs(unitX), Math.abs(unitY) < 0.001 ? Infinity : halfHeight / Math.abs(unitY)), candidateStart = { x: sourceCenter.x + unitX * borderDistance, y: sourceCenter.y + unitY * borderDistance }, candidateEnd = { x: targetCenter.x - unitX * borderDistance, y: targetCenter.y - unitY * borderDistance }, forwardDistance = (candidateEnd.x - candidateStart.x) * unitX + (candidateEnd.y - candidateStart.y) * unitY, midpoint = { x: (sourceCenter.x + targetCenter.x) / 2, y: (sourceCenter.y + targetCenter.y) / 2 }, startX = forwardDistance > 0 ? candidateStart.x : midpoint.x - unitX * 6, startY = forwardDistance > 0 ? candidateStart.y : midpoint.y - unitY * 6, endX = forwardDistance > 0 ? candidateEnd.x : midpoint.x + unitX * 6, endY = forwardDistance > 0 ? candidateEnd.y : midpoint.y + unitY * 6, baseX = endX - unitX * 12, baseY = endY - unitY * 12, normalX = -unitY * 7, normalY = unitX * 7;
    return { startX, startY, endX, endY, arrow: `${baseX + normalX},${baseY + normalY} ${endX},${endY} ${baseX - normalX},${baseY - normalY}` };
}
export function installFlowGraphBuilder(options) {
    const inspector = q("#project-inspector"), advanced = q("#flow-step-editor"), legacyForm = q("#add-flow-step-form"), legacyList = q("#flow-step-list"), legacyResult = q("#flow-step-result"), inspectorContext = document.createElement("section");
    inspectorContext.id = "flow-inspector-context";
    inspector.insertBefore(inspectorContext, q("#add-entity-form"));
    legacyForm.hidden = true;
    legacyList.hidden = true;
    legacyResult.hidden = true;
    let selected;
    let connection;
    let statusMessage = "";
    const current = () => { const context = options.context(), flow = context.flowId && context.state?.project.collections.flows.find(({ id }) => id === context.flowId), graph = flow && context.state ? documentaryFlowGraph(context.state.project, flow.id) : undefined; return { ...context, flow, graph }; };
    const persist = (next) => { try {
        options.persist(next);
    }
    catch (error) {
        statusMessage = error instanceof Error ? error.message : String(error);
        render();
    } };
    const pageFrame = (frameId) => current().graph?.pageFrames.find(({ id }) => id === frameId);
    const selectedFrameForPage = (pageId) => current().graph?.pageFrames.find((frame) => frame.pageId === pageId);
    const saveSelection = (value) => { selected = value; const { state, flow, graph } = current(); if (state && flow && JSON.stringify(graph?.selectedItem) !== JSON.stringify(value))
        persist(saveFlowViewState(state, flow.id, value ? { selectedItem: value } : {}));
    else
        renderInspector(); };
    function renderInspector() {
        inspectorContext.replaceChildren();
        const { state, flow, graph } = current();
        if (!state || !flow) {
            inspectorContext.hidden = true;
            return;
        }
        inspectorContext.hidden = false;
        const heading = document.createElement("h3"), copy = document.createElement("p");
        heading.textContent = "Flow details";
        if (!selected) {
            copy.textContent = `${flow.name}. Select a lane, Page frame, occurrence, or relationship for provenance and details. All graph commands remain in the main workspace.`;
            inspectorContext.append(heading, copy);
            return;
        }
        const occurrence = graph?.occurrences.find(({ id }) => id === selected.id), relationship = graph?.relationships.find(({ id }) => id === selected.id), frame = graph?.pageFrames.find(({ id }) => id === selected.id);
        copy.textContent = occurrence ? `${occurrence.name} · stable occurrence ${occurrence.id}` : relationship ? `Stable relationship ${relationship.id}` : frame ? `${entityName(state.project.collections.pages, frame.pageId)} · stable Page frame ${frame.id}` : "Selection details unavailable";
        inspectorContext.append(heading, copy);
    }
    function catalog(kind, entities, activate) {
        const section = document.createElement("section"), heading = document.createElement("h4"), search = document.createElement("input"), items = document.createElement("div");
        section.setAttribute("aria-label", `${kind} catalog`);
        heading.textContent = kind;
        search.type = "search";
        search.placeholder = `Search ${kind}`;
        search.setAttribute("aria-label", `Search ${kind}`);
        const renderItems = () => { const term = search.value.trim().toLowerCase(); items.replaceChildren(...entities.filter(({ name }) => name.toLowerCase().includes(term)).map((entity) => { const control = button(entity.name, () => activate(entity)); control.draggable = true; control.dataset.componentKind = kind === "Page Groups" ? "page-group" : kind === "Pages" ? "page" : "event"; control.dataset.componentId = entity.id; if (kind === "Pages") {
            const { state } = current(), owner = state?.project.collections.pageGroups.find((group) => (group.pageIds ?? []).includes(entity.id));
            control.textContent = `${entity.name} · ${owner?.name ?? "Ungrouped"}`;
        } control.addEventListener("dragstart", (event) => event.dataTransfer?.setData("application/x-flow-component", JSON.stringify({ kind: control.dataset.componentKind, id: entity.id }))); return control; })); };
        search.addEventListener("input", renderItems);
        renderItems();
        section.append(heading, search, items);
        return section;
    }
    function addLane(group) { const { state, flow, graph } = current(); if (!state || !flow || graph?.pageGroupIds.includes(group.id))
        return; persist(setFlowPageGroupLanes(state, flow.id, [...(graph?.pageGroupIds ?? []), group.id])); }
    function insertPage(page, targetGroupId) {
        const { state, flow, graph } = current();
        if (!state || !flow || !graph)
            return;
        const selectedGroups = state.project.collections.pageGroups.filter((group) => graph.pageGroupIds.includes(group.id) && (group.pageIds ?? []).includes(page.id)), target = targetGroupId ? selectedGroups.find(({ id }) => id === targetGroupId) : selectedGroups[0];
        if (target) {
            const next = addFlowPageFrame(state, flow.id, { pageId: page.id, pageGroupId: target.id, y: 80 + graph.pageFrames.filter(({ pageGroupId }) => pageGroupId === target.id).length * 250 }, options.id);
            if (next === state) {
                statusMessage = `${page.name} is already placed or does not belong to ${target.name}. Open Page Group membership.`;
                render();
            }
            else
                persist(next);
            return;
        }
        const allMembership = state.project.collections.pageGroups.some((group) => (group.pageIds ?? []).includes(page.id));
        if (allMembership) {
            statusMessage = `Add ${entityName(state.project.collections.pageGroups, state.project.collections.pageGroups.find((group) => (group.pageIds ?? []).includes(page.id))?.id)} to the lane order before placing ${page.name}.`;
            render();
            return;
        }
        const binding = (page.contextEventBindings ?? [])[0];
        if (!binding) {
            statusMessage = `${page.name} needs a Page context binding before it can become an ungrouped entry Page.`;
            render();
            return;
        }
        persist(addUngroupedPageFrame(state, flow.id, { name: `${page.name} entry`, pageId: page.id, contextBindingId: binding.id, y: 80 }, options.id));
    }
    function insertEvent(event, frameId) { const { state, flow, graph } = current(), selectedFrameId = frameId ?? (selected && selected.kind === "page-frame" ? selected.id : undefined), frame = selectedFrameId ? pageFrame(selectedFrameId) : undefined; if (!state || !flow || !graph || !frame) {
        statusMessage = "Select a Page frame before inserting an Event.";
        render();
        return;
    } persist(addInteractionOccurrenceToPage(state, flow.id, { name: event.name, pageFrameId: frame.id, ...(frame.pageGroupId ? { pageGroupId: frame.pageGroupId } : {}), pageId: frame.pageId, eventId: event.id, obligation: "Required", minimum: 1, maximum: 1, y: 120 + graph.occurrences.filter((occurrence) => occurrence.pageFrameId === frame.id).length * 105 }, options.id)); }
    function renderLaneControls(host) {
        const { state, flow, graph } = current();
        if (!state || !flow || !graph)
            return;
        const heading = document.createElement("h4"), list = document.createElement("ol");
        heading.textContent = "Flow lane order";
        host.setAttribute("aria-label", "Page Group lane controls");
        for (const groupId of graph.pageGroupIds) {
            const group = state.project.collections.pageGroups.find(({ id }) => id === groupId);
            if (!group)
                continue;
            const item = document.createElement("li");
            item.dataset.pageGroupId = group.id;
            item.append(group.name, button("Move earlier", () => persist(reorderFlowPageGroupLane(current().state, flow.id, group.id, -1))), button("Move later", () => persist(reorderFlowPageGroupLane(current().state, flow.id, group.id, 1))), button("Remove lane", () => { try {
                persist(setFlowPageGroupLanes(current().state, flow.id, current().graph.pageGroupIds.filter((id) => id !== group.id)));
            }
            catch (error) {
                statusMessage = error instanceof Error ? error.message : String(error);
                render();
            } }));
            list.append(item);
        }
        host.append(heading, list);
    }
    function dropPayload(event) { const raw = event.dataTransfer?.getData("application/x-flow-component"); if (!raw)
        return; try {
        return JSON.parse(raw);
    }
    catch {
        return;
    } }
    function renderFrameCards(host) {
        const { state, flow, graph } = current();
        if (!state || !flow || !graph)
            return;
        const heading = document.createElement("h4");
        heading.textContent = "Page frames";
        host.setAttribute("aria-label", "Flow Page frames");
        host.append(heading);
        for (const frame of graph.pageFrames) {
            const page = state.project.collections.pages.find(({ id }) => id === frame.pageId), group = state.project.collections.pageGroups.find(({ id }) => id === frame.pageGroupId), card = document.createElement("article"), title = button(`${group?.name ?? "Ungrouped"} / ${page?.name ?? frame.pageId}`, () => saveSelection({ kind: "page-frame", id: frame.id })), context = document.createElement("details"), summary = document.createElement("summary"), bindings = document.createElement("div");
            card.dataset.pageFrameId = frame.id;
            card.dataset.pageId = frame.pageId;
            if (frame.pageGroupId)
                card.dataset.pageGroupId = frame.pageGroupId;
            summary.textContent = "Context events";
            for (const binding of (page?.contextEventBindings ?? [])) {
                const event = state.project.collections.events.find(({ id }) => id === binding.eventId), control = button(`${binding.name} · ${binding.trigger ?? "Page context"} · ${event?.name ?? "Missing Event"}`, () => persist(addPageContextOccurrence(current().state, flow.id, { pageFrameId: frame.id, contextBindingId: binding.id, y: 120 + current().graph.occurrences.filter((occurrence) => occurrence.pageFrameId === frame.id).length * 105 }, options.id)));
                bindings.append(control);
            }
            context.append(summary, bindings);
            card.addEventListener("dragover", (event) => event.preventDefault());
            card.addEventListener("drop", (event) => { event.preventDefault(); const payload = dropPayload(event); if (payload?.kind === "event") {
                const entity = current().state?.project.collections.events.find(({ id }) => id === payload.id);
                if (entity)
                    insertEvent(entity, frame.id);
            }
            else if (payload?.kind === "page") {
                statusMessage = "A Page frame cannot contain another Page. Use its owning lane.";
                render();
            } });
            card.append(title, context, button("Remove Page frame", () => persist(removeFlowPageFrame(current().state, flow.id, frame.id))));
            host.append(card);
        }
        for (const free of graph.occurrences.filter(({ freePageFrame }) => freePageFrame)) {
            const page = state.project.collections.pages.find(({ id }) => id === free.pageId), card = document.createElement("article");
            card.dataset.freePageFrameId = free.id;
            card.dataset.pageId = String(free.pageId);
            card.textContent = `Ungrouped / ${page?.name ?? free.name}`;
            card.addEventListener("dragover", (event) => event.preventDefault());
            card.addEventListener("drop", (event) => { event.preventDefault(); const payload = dropPayload(event), entity = payload?.kind === "event" ? current().state?.project.collections.events.find(({ id }) => id === payload.id) : undefined; if (entity)
                persist(addInteractionOccurrenceToPage(current().state, flow.id, { name: entity.name, freePageFrameId: free.id, pageId: String(free.pageId), eventId: entity.id, obligation: "Required", minimum: 1, maximum: 1, y: 190 }, options.id)); });
            host.append(card);
        }
    }
    function cancelConnection(announce = true) { const sourceId = connection?.sourceId; connection?.preview?.remove(); connection = undefined; document.querySelectorAll(".is-valid-target,.is-invalid-target").forEach((element) => element.classList.remove("is-valid-target", "is-invalid-target")); if (announce)
        statusMessage = "Connection cancelled; canonical state was not changed."; document.querySelector(`[data-occurrence-id="${CSS.escape(sourceId ?? "")}"]`)?.focus(); }
    function commitConnection(targetId) { const { state, flow, graph } = current(), sourceId = connection?.sourceId; if (!state || !flow || !graph || !sourceId || sourceId === targetId) {
        cancelConnection();
        return;
    } const before = new Set(graph.relationships.map(({ id }) => id)), next = saveGraphRelationship(state, flow.id, sourceId, { toStepId: targetId, kind: "expected-next" }, options.id); connection = undefined; persist(next); queueMicrotask(() => { const created = current().graph?.relationships.find(({ id }) => !before.has(id)); if (created) {
        selected = { kind: "relationship", id: created.id };
        render();
        queueMicrotask(() => document.querySelector(`[data-relationship-popover="${CSS.escape(created.id)}"] select`)?.focus());
    } }); }
    function renderRelationshipPopover(host) {
        if (selected?.kind !== "relationship")
            return;
        const { state, flow, graph } = current(), relationship = graph?.relationships.find(({ id }) => id === selected.id);
        if (!state || !flow || !graph || !relationship)
            return;
        const form = document.createElement("form"), heading = document.createElement("h4"), kind = document.createElement("select"), group = document.createElement("input"), label = document.createElement("input"), condition = document.createElement("textarea"), expectation = document.createElement("textarea"), save = document.createElement("button"), cancel = document.createElement("button");
        form.dataset.relationshipPopover = relationship.id;
        form.setAttribute("aria-label", "Inline relationship popover");
        heading.textContent = "Relationship meaning";
        for (const value of ["expected-next", "alternative", "parallel", "merge"])
            kind.append(new Option(value, value));
        kind.value = String(relationship.kind);
        kind.setAttribute("aria-label", "Relationship kind");
        group.value = String(relationship.group ?? "");
        group.setAttribute("aria-label", "Relationship group");
        label.value = String(relationship.label ?? "");
        label.setAttribute("aria-label", "Relationship label");
        condition.value = String(relationship.documentationCondition ?? "");
        condition.setAttribute("aria-label", "Documentation condition");
        expectation.value = String(relationship.expectation ?? "");
        expectation.setAttribute("aria-label", "Relationship expectation");
        save.type = "submit";
        save.textContent = "Save relationship";
        cancel.type = "button";
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => { selected = undefined; render(); document.querySelector(`[data-occurrence-id="${CSS.escape(relationship.sourceNodeId)}"]`)?.focus(); });
        form.addEventListener("submit", (event) => { event.preventDefault(); persist(saveGraphRelationship(current().state, flow.id, relationship.sourceNodeId, { id: relationship.id, toStepId: relationship.targetNodeId, kind: kind.value, group: group.value.trim(), label: label.value.trim(), documentationCondition: condition.value.trim(), expectation: expectation.value.trim() }, options.id)); queueMicrotask(() => document.querySelector(`[data-relationship-id="${CSS.escape(relationship.id)}"]`)?.focus()); });
        const labeled = (text, control) => { const wrapper = document.createElement("label"); wrapper.append(text, control); return wrapper; };
        form.append(heading, labeled("Kind", kind), labeled("Group", group), labeled("Label", label), labeled("Condition", condition), labeled("Expectation", expectation), save, cancel);
        host.append(form);
    }
    function renderActions(host) {
        if (selected?.kind !== "occurrence")
            return;
        const { state, flow, graph } = current(), occurrence = graph?.occurrences.find(({ id }) => id === selected.id), node = state && flow ? projectFlowGraph(state.project, flow.id).graph.nodes.find(({ id }) => id === selected.id) : undefined;
        if (!state || !flow || !graph || !occurrence || !node)
            return;
        const actions = document.createElement("section");
        actions.setAttribute("aria-label", "Selected node inline actions");
        const connect = () => document.querySelector(`[data-output-port-for="${CSS.escape(occurrence.id)}"]`)?.focus();
        const duplicate = () => { const next = addGraphOccurrence(current().state, flow.id, { name: `${occurrence.name} copy`, ...(occurrence.pageFrameId ? { pageFrameId: String(occurrence.pageFrameId) } : {}), ...(occurrence.pageGroupId ? { pageGroupId: String(occurrence.pageGroupId) } : {}), ...(occurrence.freePageFrameId ? { freePageFrameId: String(occurrence.freePageFrameId) } : {}), pageId: String(occurrence.pageId), ...(occurrence.contextBindingId ? { contextBindingId: String(occurrence.contextBindingId) } : { eventId: String(occurrence.eventId) }), obligation: String(occurrence.obligation ?? "Required"), minimum: Number(occurrence.minimum ?? 1), maximum: Number(occurrence.maximum ?? 1), y: Number(occurrence.position?.y ?? 70) + 24 }, options.id); persist(next); };
        const openSchema = () => { document.querySelector(`[data-occurrence-id="${CSS.escape(occurrence.id)}"]`)?.dispatchEvent(new MouseEvent("click", { bubbles: true })); queueMicrotask(() => { const open = Array.from(document.querySelectorAll('[aria-label="Schema constraints summary"] button')).find(({ textContent }) => textContent?.includes("Open complete schema editor")); open?.click(); }); };
        actions.append(button("Move", () => document.querySelector(`[data-occurrence-id="${CSS.escape(occurrence.id)}"]`)?.focus()), button("Connect", connect), button("Duplicate occurrence", duplicate), button("Remove", () => persist(removeGraphOccurrence(current().state, flow.id, occurrence.id))), button("Open schema contribution", openSchema));
        host.append(actions);
    }
    function renderGraph(flow) {
        const host = q("#flow-graph-workspace");
        host.replaceChildren();
        const { state, graph: stored } = current();
        if (!state || !stored)
            return;
        selected = selected ?? stored.selectedItem;
        const projection = projectFlowGraph(state.project, flow.id), section = document.createElement("section"), heading = document.createElement("h3"), boundary = document.createElement("p"), toolbar = document.createElement("section"), laneControls = document.createElement("section"), status = document.createElement("p"), frames = document.createElement("section"), views = document.createElement("div"), canvas = svg("svg"), outline = document.createElement("ol"), popover = document.createElement("section"), actions = document.createElement("section");
        section.className = "documentary-flow";
        heading.textContent = "Canvas-first directional Flow";
        boundary.className = "status-text";
        boundary.textContent = "Documentary journey expectations are checked manually. Each Event payload schema validates independently.";
        toolbar.setAttribute("aria-label", "Flow component catalogs");
        const toggleInspector = button(inspector.hidden ? "Open Inspector" : "Close Inspector", () => { inspector.hidden = !inspector.hidden; toggleInspector.textContent = inspector.hidden ? "Open Inspector" : "Close Inspector"; });
        toolbar.append(catalog("Page Groups", state.project.collections.pageGroups, addLane), catalog("Pages", state.project.collections.pages, (page) => insertPage(page)), catalog("Events", state.project.collections.events, (event) => insertEvent(event)), toggleInspector);
        renderLaneControls(laneControls);
        renderFrameCards(frames);
        status.setAttribute("role", "status");
        status.textContent = statusMessage || (!stored.pageGroupIds.length ? "Add a Page Group to begin. No fallback lanes exist." : !stored.pageFrames.length ? "Add a Page from the Pages catalog." : "Draw from an output port to an input port, or press Enter on an output port.");
        canvas.classList.add("flow-graph-canvas");
        canvas.setAttribute("aria-label", "Interactive directional Flow canvas");
        canvas.setAttribute("role", "application");
        canvas.setAttribute("viewBox", `0 0 ${Math.max(720, stored.pageGroupIds.length * laneWidth + 220)} 780`);
        outline.setAttribute("aria-label", "Synchronized editable Flow outline");
        views.className = "flow-projections";
        projection.lanes.forEach((lane, index) => { const group = svg("g"), rect = svg("rect"), label = svg("text"), x = index * laneWidth + 10; group.dataset.pageGroupId = lane.id; rect.setAttribute("x", String(x)); rect.setAttribute("y", "20"); rect.setAttribute("width", String(laneWidth - 20)); rect.setAttribute("height", "730"); rect.setAttribute("class", "flow-lane"); rect.dataset.laneDropzone = lane.id; rect.addEventListener("dragover", (event) => event.preventDefault()); rect.addEventListener("drop", (event) => { event.preventDefault(); const payload = dropPayload(event), page = payload?.kind === "page" ? current().state?.project.collections.pages.find(({ id }) => id === payload.id) : undefined; if (page)
            insertPage(page, lane.id); }); label.classList.add("flow-lane-label"); label.setAttribute("x", String(x + 12)); label.setAttribute("y", "45"); label.textContent = lane.name; group.append(rect, label); canvas.append(group); });
        if (stored.occurrences.some(({ freePageFrame, freePageFrameId }) => freePageFrame || freePageFrameId)) {
            const label = svg("text");
            label.classList.add("flow-lane-label");
            label.setAttribute("x", String(projection.lanes.length * laneWidth + 22));
            label.setAttribute("y", "45");
            label.textContent = "Ungrouped entry pages";
            canvas.append(label);
        }
        for (const frame of stored.pageFrames) {
            const laneIndex = stored.pageGroupIds.indexOf(String(frame.pageGroupId)), x = laneIndex * laneWidth + 20, y = frame.position.y, group = svg("g"), rect = svg("rect"), label = svg("text"), page = state.project.collections.pages.find(({ id }) => id === frame.pageId);
            group.dataset.pageFrameId = frame.id;
            group.dataset.pageId = frame.pageId;
            if (frame.pageGroupId)
                group.dataset.pageGroupId = frame.pageGroupId;
            group.setAttribute("transform", `translate(${x} ${y})`);
            group.tabIndex = 0;
            rect.setAttribute("width", String(laneWidth - 40));
            rect.setAttribute("height", "205");
            rect.setAttribute("rx", "12");
            rect.classList.add("flow-page-frame");
            label.setAttribute("x", "10");
            label.setAttribute("y", "22");
            label.textContent = page?.name ?? frame.pageId;
            group.addEventListener("click", () => saveSelection({ kind: "page-frame", id: frame.id }));
            group.append(rect, label);
            canvas.append(group);
        }
        for (const relationship of projection.graph.relationships) {
            const source = projection.graph.nodes.find(({ id }) => id === relationship.sourceNodeId), target = projection.graph.nodes.find(({ id }) => id === relationship.targetNodeId);
            if (!source?.layout || !target?.layout)
                continue;
            const geometry = flowEdgeGeometry(source.layout, target.layout), edge = svg("g"), line = svg("line"), arrow = svg("polygon"), label = svg("text");
            edge.classList.add("flow-edge");
            edge.dataset.relationshipId = relationship.id;
            edge.dataset.directed = "true";
            edge.tabIndex = 0;
            edge.setAttribute("role", "button");
            edge.setAttribute("aria-label", flowRelationshipText(projection.graph, relationship));
            line.setAttribute("x1", String(geometry.startX));
            line.setAttribute("y1", String(geometry.startY));
            line.setAttribute("x2", String(geometry.endX));
            line.setAttribute("y2", String(geometry.endY));
            arrow.setAttribute("points", geometry.arrow);
            label.setAttribute("x", String((geometry.startX + geometry.endX) / 2));
            label.setAttribute("y", String((geometry.startY + geometry.endY) / 2 - 8));
            label.textContent = relationship.label || relationship.kind;
            edge.addEventListener("click", () => saveSelection({ kind: "relationship", id: relationship.id }));
            edge.append(line, arrow, label);
            canvas.append(edge);
            const row = document.createElement("li"), control = button(flowRelationshipText(projection.graph, relationship), () => saveSelection({ kind: "relationship", id: relationship.id }));
            row.dataset.relationshipId = relationship.id;
            row.append(control);
            outline.append(row);
        }
        for (const nodeData of projection.graph.nodes) {
            if (!nodeData.layout)
                continue;
            const group = svg("g"), box = svg("rect"), title = svg("text"), detail = svg("text"), input = svg("circle"), output = svg("circle"), layout = nodeData.layout;
            group.classList.add("flow-node");
            group.dataset.occurrenceId = nodeData.id;
            group.setAttribute("transform", `translate(${layout.x} ${layout.y})`);
            group.tabIndex = 0;
            group.setAttribute("role", "button");
            group.setAttribute("aria-label", `${nodeData.name}. Drag or use Arrow keys to move.`);
            box.setAttribute("width", String(nodeWidth));
            box.setAttribute("height", String(nodeHeight));
            box.setAttribute("rx", "10");
            title.setAttribute("x", "12");
            title.setAttribute("y", "30");
            title.textContent = nodeData.name;
            detail.setAttribute("x", "12");
            detail.setAttribute("y", "55");
            detail.textContent = nodeData.occurrenceType === "page-context" ? "Page context" : "Interaction Event";
            input.setAttribute("cx", "0");
            input.setAttribute("cy", String(nodeHeight / 2));
            input.setAttribute("r", "8");
            input.tabIndex = 0;
            input.dataset.inputPortFor = nodeData.id;
            input.setAttribute("aria-label", `Input port for ${nodeData.name}`);
            output.setAttribute("cx", String(nodeWidth));
            output.setAttribute("cy", String(nodeHeight / 2));
            output.setAttribute("r", "8");
            output.tabIndex = 0;
            output.dataset.outputPortFor = nodeData.id;
            output.setAttribute("aria-label", `Output port for ${nodeData.name}`);
            const startConnection = () => { connection?.preview?.remove(); const preview = svg("line"), targets = projection.graph.nodes.filter(({ id }) => id !== nodeData.id).map(({ id }) => id); preview.classList.add("flow-connection-preview"); preview.setAttribute("x1", String(layout.x + nodeWidth)); preview.setAttribute("y1", String(layout.y + nodeHeight / 2)); preview.setAttribute("x2", String(layout.x + nodeWidth + 20)); preview.setAttribute("y2", String(layout.y + nodeHeight / 2)); canvas.append(preview); connection = { sourceId: nodeData.id, targets, targetIndex: 0, preview }; statusMessage = "Connection mode: choose a valid input port; Escape cancels."; document.querySelector(`[data-input-port-for="${CSS.escape(targets[0] ?? "")}"]`)?.classList.add("is-valid-target"); };
            output.addEventListener("pointerdown", (event) => { event.stopPropagation(); startConnection(); });
            output.addEventListener("keydown", (event) => { if (event.key === "Enter" && !connection) {
                event.preventDefault();
                startConnection();
                return;
            } if (!connection)
                return; if (event.key === "Escape") {
                event.preventDefault();
                cancelConnection();
                return;
            } if (event.key.startsWith("Arrow")) {
                event.preventDefault();
                document.querySelectorAll(".is-valid-target").forEach((element) => element.classList.remove("is-valid-target"));
                connection.targetIndex = (connection.targetIndex + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + connection.targets.length) % connection.targets.length;
                document.querySelector(`[data-input-port-for="${CSS.escape(connection.targets[connection.targetIndex] ?? "")}"]`)?.classList.add("is-valid-target");
                return;
            } if (event.key === "Enter") {
                event.preventDefault();
                commitConnection(connection.targets[connection.targetIndex]);
            } });
            input.addEventListener("pointerup", (event) => { event.stopPropagation(); commitConnection(nodeData.id); });
            let dragStart;
            group.addEventListener("pointerdown", (event) => { if (event.target.closest("circle"))
                return; dragStart = { x: layout.x, y: layout.y, clientX: event.clientX, clientY: event.clientY }; group.setPointerCapture(event.pointerId); });
            group.addEventListener("pointermove", (event) => { if (!dragStart)
                return; group.setAttribute("transform", `translate(${dragStart.x + event.clientX - dragStart.clientX} ${dragStart.y + event.clientY - dragStart.clientY})`); });
            group.addEventListener("pointerup", (event) => { if (!dragStart)
                return; const x = dragStart.x + event.clientX - dragStart.clientX, y = dragStart.y + event.clientY - dragStart.clientY; dragStart = undefined; const semantic = Boolean(nodeData.pageGroupId || nodeData.pageFrameId || nodeData.freePageFrameId || nodeData.freePageFrame), validX = Math.abs(x - layout.x) <= 85; if (!validX) {
                group.setAttribute("transform", `translate(${layout.x} ${layout.y})`);
                statusMessage = "Move rejected. Add the predefined Event to another Page frame instead.";
                render();
                return;
            } persist(moveGraphOccurrence(current().state, flow.id, nodeData.id, semantic ? { y: Math.max(55, Math.round(y)) } : { lane: layout.lane, x, y })); });
            group.addEventListener("keydown", (event) => { if (!event.key.startsWith("Arrow"))
                return; event.preventDefault(); const dx = event.key === "ArrowLeft" ? -20 : event.key === "ArrowRight" ? 20 : 0, dy = event.key === "ArrowUp" ? -20 : event.key === "ArrowDown" ? 20 : 0; if (dx && (nodeData.pageFrameId || nodeData.pageGroupId || nodeData.freePageFrameId)) {
                statusMessage = "Move rejected. Add the predefined Event to another Page frame instead.";
                render();
                return;
            } persist(moveGraphOccurrence(current().state, flow.id, nodeData.id, { y: Math.max(55, layout.y + dy) })); });
            group.addEventListener("click", () => saveSelection({ kind: "occurrence", id: nodeData.id }));
            group.append(box, title, detail, input, output);
            canvas.append(group);
            const row = document.createElement("li"), control = button(`${nodeData.name} · ${nodeData.occurrenceType ?? nodeData.role}`, () => saveSelection({ kind: "occurrence", id: nodeData.id }));
            row.dataset.occurrenceId = nodeData.id;
            row.append(control);
            outline.insertBefore(row, outline.querySelector("[data-relationship-id]"));
        }
        canvas.addEventListener("pointermove", (event) => { if (!connection?.preview)
            return; const bounds = canvas.getBoundingClientRect(), scaleX = canvas.viewBox.baseVal.width / bounds.width, scaleY = canvas.viewBox.baseVal.height / bounds.height; connection.preview.setAttribute("x2", String((event.clientX - bounds.left) * scaleX)); connection.preview.setAttribute("y2", String((event.clientY - bounds.top) * scaleY)); document.querySelectorAll(".is-valid-target,.is-invalid-target").forEach((element) => element.classList.remove("is-valid-target", "is-invalid-target")); const input = event.target.closest("[data-input-port-for]"), node = event.target.closest("[data-occurrence-id]"); if (input && input.dataset.inputPortFor !== connection.sourceId)
            input.classList.add("is-valid-target");
        else if (input || node)
            (input ?? node).classList.add("is-invalid-target"); });
        canvas.addEventListener("pointerup", (event) => { if (!connection)
            return; const input = event.target.closest("[data-input-port-for]"); if (input)
            commitConnection(input.dataset.inputPortFor);
        else
            cancelConnection(); });
        canvas.addEventListener("keydown", (event) => { if (event.key === "Escape" && connection) {
            event.preventDefault();
            cancelConnection();
        } });
        views.append(canvas, outline);
        renderRelationshipPopover(popover);
        renderActions(actions);
        section.append(heading, boundary, toolbar, laneControls, status, frames, views, actions, popover);
        host.append(section);
        document.querySelectorAll("[data-occurrence-id],[data-relationship-id],[data-page-frame-id]").forEach((element) => { const id = element.dataset.occurrenceId ?? element.dataset.relationshipId ?? element.dataset.pageFrameId; element.classList.toggle("is-selected", id === selected?.id); });
        renderInspector();
    }
    function render() { const { flow } = current(); advanced.hidden = !flow; if (flow)
        renderGraph(flow);
    else {
        document.querySelector("#flow-graph-workspace")?.replaceChildren();
        inspectorContext.replaceChildren();
    } }
    return { render, renderSelectors: render };
}
//# sourceMappingURL=data-layer-flow-graph-ui.js.map