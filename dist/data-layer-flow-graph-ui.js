import { addGraphOccurrence, documentaryFlowGraph, flowOutline, flowRelationshipText, moveGraphOccurrence, projectFlowGraph, inspectPageGroupLaneRemoval, removeGraphOccurrence, removePageGroupLaneAndMembership, reorderGraphOccurrence, saveGraphRelationship, updateGraphOccurrence, } from "./data-layer-flow-graph.js";
const lanes = [{ name: "Context", x: 30 }, { name: "Shipping", x: 230 }, { name: "Payment", x: 430 }, { name: "Merge", x: 630 }];
const nodeWidth = 170, nodeHeight = 82;
const q = (selector) => { const element = document.querySelector(selector); if (!element)
    throw new Error(`Missing ${selector}`); return element; };
const replaceOptions = (select, entities, placeholder) => { const value = select.value, empty = new Option(placeholder, ""); select.replaceChildren(empty, ...entities.map(({ id, name }) => new Option(name, id))); select.value = value; };
export function flowEdgeGeometry(source, target, width = nodeWidth, height = nodeHeight) {
    const halfWidth = width / 2, halfHeight = height / 2, sourceCenter = { x: source.x + halfWidth, y: source.y + halfHeight }, targetCenter = { x: target.x + halfWidth, y: target.y + halfHeight }, dx = targetCenter.x - sourceCenter.x, dy = targetCenter.y - sourceCenter.y, length = Math.hypot(dx, dy), unitX = length < 0.001 ? 1 : dx / length, unitY = length < 0.001 ? 0 : dy / length, borderDistance = Math.min(Math.abs(unitX) < 0.001 ? Infinity : halfWidth / Math.abs(unitX), Math.abs(unitY) < 0.001 ? Infinity : halfHeight / Math.abs(unitY)), candidateStart = { x: sourceCenter.x + unitX * borderDistance, y: sourceCenter.y + unitY * borderDistance }, candidateEnd = { x: targetCenter.x - unitX * borderDistance, y: targetCenter.y - unitY * borderDistance }, forwardDistance = (candidateEnd.x - candidateStart.x) * unitX + (candidateEnd.y - candidateStart.y) * unitY, midpoint = { x: (sourceCenter.x + targetCenter.x) / 2, y: (sourceCenter.y + targetCenter.y) / 2 }, startX = forwardDistance > 0 ? candidateStart.x : midpoint.x - unitX * 6, startY = forwardDistance > 0 ? candidateStart.y : midpoint.y - unitY * 6, endX = forwardDistance > 0 ? candidateEnd.x : midpoint.x + unitX * 6, endY = forwardDistance > 0 ? candidateEnd.y : midpoint.y + unitY * 6, baseX = endX - unitX * 12, baseY = endY - unitY * 12, normalX = -unitY * 7, normalY = unitX * 7;
    return { startX, startY, endX, endY, arrow: `${baseX + normalX},${baseY + normalY} ${endX},${endY} ${baseX - normalX},${baseY - normalY}` };
}
function svgClientPoint(graph, clientX, clientY) { const matrix = graph.getScreenCTM(); if (!matrix)
    throw new Error("Interactive Flow canvas has no screen transformation matrix."); return new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse()); }
function addSelect(form, id, labelText, choices, before) { const label = document.createElement("label"), select = document.createElement("select"); select.id = id; label.textContent = labelText; for (const [value, text] of choices)
    select.append(new Option(text, value)); label.append(select); form.insertBefore(label, before); return select; }
export function installFlowGraphBuilder(options) {
    const inspector = q("#project-inspector"), advancedEditor = q("#flow-step-editor"), addForm = q("#add-flow-step-form"), list = q("#flow-step-list"), result = q("#flow-step-result"), minimumLabel = q("#flow-step-minimum").closest("label"), inspectorContext = document.createElement("div"), documentaryEditor = document.createElement("section");
    inspectorContext.id = "flow-inspector-context";
    documentaryEditor.id = "flow-documentary-editor";
    documentaryEditor.append(addForm, list, result);
    inspector.insertBefore(inspectorContext, q("#add-entity-form"));
    inspector.insertBefore(documentaryEditor, advancedEditor);
    const role = addSelect(addForm, "flow-step-role", "Role", [["interaction", "Interaction"], ["context-setting", "Context-setting"]], minimumLabel), pageGroup = addSelect(addForm, "flow-step-page-group", "Page Group", [], minimumLabel), occurrenceType = addSelect(addForm, "flow-step-occurrence-type", "Occurrence type", [["interaction", "Interaction"], ["page-context", "Page context"]], minimumLabel), contextBinding = addSelect(addForm, "flow-step-context-binding", "Context-event binding", [], minimumLabel), obligation = addSelect(addForm, "flow-step-obligation", "Obligation", [["Required", "Required"], ["Optional", "Optional"], ["Conditional", "Conditional"], ["Informational", "Informational"]], minimumLabel);
    const addName = q("#flow-step-name"), addPage = q("#flow-step-page"), addEvent = q("#flow-step-event");
    addName.required = addPage.required = addEvent.required = true;
    q("#flow-step-name").closest("label").firstChild.textContent = "Occurrence name";
    q("#flow-step-page").closest("label").firstChild.textContent = "Page";
    q("#flow-step-event").closest("label").firstChild.textContent = "Shared Event";
    q("#flow-step-minimum").closest("label").firstChild.textContent = "Expected minimum";
    q("#flow-step-maximum").closest("label").firstChild.textContent = "Expected maximum";
    q("#flow-step-optional").closest("label").hidden = true;
    role.closest("label").hidden = true;
    addForm.querySelector('button[type="submit"]').textContent = "Add occurrence";
    let selectedItem;
    const current = () => { const context = options.context(), flow = context.flowId ? context.state?.project.collections.flows.find(({ id }) => id === context.flowId) : undefined, graph = flow && context.state ? documentaryFlowGraph(context.state.project, flow.id) : { occurrences: [], relationships: [] }; return { ...context, flow, steps: graph.occurrences, relationships: graph.relationships }; };
    const synchronizedRole = (eventId, fallback) => { const event = current().state?.project.collections.events.find(({ id }) => id === eventId), eventRole = event?.role; return eventRole === "context-setting" || eventRole === "interaction" ? { role: eventRole, authoritative: true } : { role: fallback === "context-setting" ? "context-setting" : "interaction", authoritative: false }; };
    const syncRoleControl = (eventSelect, roleSelect, fallback = roleSelect.value) => { const selected = synchronizedRole(eventSelect.value, fallback); roleSelect.value = selected.role; roleSelect.disabled = selected.authoritative; roleSelect.title = selected.authoritative ? "This role is defined by the selected Event." : "Choose a fallback role until the Event definition has one."; };
    addEvent.addEventListener("change", () => syncRoleControl(addEvent, role));
    const syncAddContextBindings = () => { const page = current().state?.project.collections.pages.find(({ id }) => id === addPage.value), bindings = page?.contextEventBindings ?? [], value = contextBinding.value; contextBinding.replaceChildren(new Option("Choose Page context binding", ""), ...bindings.map(({ id, name }) => new Option(name, id))); contextBinding.value = value; const contextual = occurrenceType.value === "page-context"; contextBinding.closest("label").hidden = !contextual; addEvent.closest("label").hidden = contextual; contextBinding.required = contextual; addEvent.required = !contextual; };
    addPage.addEventListener("change", syncAddContextBindings);
    occurrenceType.addEventListener("change", syncAddContextBindings);
    const laneForX = (x) => lanes.reduce((nearest, lane) => Math.abs(lane.x - x) < Math.abs(nearest.x - x) ? lane : nearest, lanes[0]);
    const occurrenceInput = (values) => { const editorPageGroup = current().state?.project.collections.pageGroups.some(({ id }) => id === values.lane) ? values.lane : "", pageGroupId = editorPageGroup || pageGroup.value, contextual = editorPageGroup ? values.fallbackRole === "context-setting" : occurrenceType.value === "page-context", eventReference = editorPageGroup ? values.eventId : contextual ? contextBinding.value : values.eventId; return pageGroupId ? { name: values.name, pageGroupId, pageId: values.pageId, ...(contextual ? { contextBindingId: eventReference } : { eventId: eventReference }), obligation: values.obligation, minimum: values.minimum, maximum: values.maximum, y: values.y } : { name: values.name, pageId: values.pageId, eventId: values.eventId, fallbackRole: values.fallbackRole, obligation: values.obligation, minimum: values.minimum, maximum: values.maximum, layout: { lane: values.lane, x: values.x, y: values.y } }; };
    function renderFlowLaneControls() {
        const laneSelect = document.querySelector('#flow-inspector-context select[name="pageGroupIds"]'), { state, flow } = current();
        if (!laneSelect || !state || !flow || laneSelect.dataset.laneControls)
            return;
        const selectedFlow = flow;
        laneSelect.dataset.laneControls = "true";
        laneSelect.setAttribute("aria-label", "Ordered Page Group lanes");
        const controls = document.createElement("section"), up = document.createElement("button"), down = document.createElement("button"), pageSelect = document.createElement("select"), target = document.createElement("select"), review = document.createElement("button"), confirm = document.createElement("button"), message = document.createElement("p");
        controls.setAttribute("aria-label", "Page Group lane controls");
        up.type = down.type = review.type = confirm.type = "button";
        up.textContent = "Move selected lane up";
        down.textContent = "Move selected lane down";
        review.textContent = "Review lane or membership removal";
        confirm.textContent = "Confirm reassignment and removal";
        confirm.hidden = true;
        message.setAttribute("role", "status");
        pageSelect.setAttribute("aria-label", "Page Group member Page");
        target.setAttribute("aria-label", "Reassign affected occurrences to Page Group");
        const selectedOption = () => Array.from(laneSelect.options).find(({ selected }) => selected);
        const move = (delta) => { const option = selectedOption(); if (!option)
            return; const index = Array.from(laneSelect.options).indexOf(option), targetIndex = Math.max(0, Math.min(laneSelect.options.length - 1, index + delta)); if (index === targetIndex)
            return; laneSelect.insertBefore(option, delta > 0 ? laneSelect.options[targetIndex].nextSibling : laneSelect.options[targetIndex]); option.selected = true; laneSelect.dispatchEvent(new Event("change", { bubbles: true })); };
        up.addEventListener("click", () => move(-1));
        down.addEventListener("click", () => move(1));
        const syncRemoval = () => { const group = state.project.collections.pageGroups.find(({ id }) => id === selectedOption()?.value), pageValue = pageSelect.value; replaceOptions(pageSelect, state.project.collections.pages.filter(({ id }) => (group?.pageIds ?? []).includes(id)), "Choose member Page"); pageSelect.value = pageValue; replaceOptions(target, state.project.collections.pageGroups.filter(({ id, pageIds }) => id !== group?.id && (pageIds ?? []).includes(pageSelect.value)), "Choose reassignment Page Group"); };
        laneSelect.addEventListener("change", syncRemoval);
        pageSelect.addEventListener("change", syncRemoval);
        syncRemoval();
        review.addEventListener("click", () => { const groupId = selectedOption()?.value; if (!groupId || !pageSelect.value)
            return; const inspection = inspectPageGroupLaneRemoval(state.project, flow.id, groupId, pageSelect.value); message.textContent = inspection.message; confirm.hidden = false; confirm.disabled = inspection.blocked && !target.value; });
        target.addEventListener("change", () => { confirm.disabled = !target.value; });
        confirm.addEventListener("click", () => { const fresh = current().state, groupId = selectedOption()?.value; if (!fresh || !groupId || !pageSelect.value)
            return; const inspection = inspectPageGroupLaneRemoval(fresh.project, flow.id, groupId, pageSelect.value), reassignments = inspection.occurrenceIds.map((occurrenceId) => ({ occurrenceId, pageGroupId: target.value })); options.persist(removePageGroupLaneAndMembership(fresh, flow.id, groupId, pageSelect.value, reassignments)); });
        controls.append(up, down, pageSelect, target, review, confirm, message);
        laneSelect.closest("form")?.append(controls);
    }
    function renderSelectors() { const { state, flow } = current(); if (!state)
        return; replaceOptions(q("#flow-step-page"), state.project.collections.pages, "Choose Page"); replaceOptions(q("#flow-step-event"), state.project.collections.events, "Choose Event"); const laneIds = flow ? (flow.pageGroupIds ?? []) : [], groups = laneIds.map((groupId) => state.project.collections.pageGroups.find(({ id }) => id === groupId)).filter((group) => Boolean(group)); replaceOptions(pageGroup, groups, "Choose Page Group"); syncAddContextBindings(); }
    function renderInspector() {
        render(false);
        synchronizeRenderedOccurrenceControls();
        const { steps, relationships } = current(), selection = selectedItem, sourceId = selection?.kind === "relationship" ? relationships.find(({ id }) => id === selection.id)?.sourceNodeId : undefined;
        for (const item of Array.from(list.children)) {
            const occurrenceId = item.querySelector("[data-edit-occurrence-id]")?.dataset.editOccurrenceId;
            item.toggleAttribute("hidden", Boolean(selection && occurrenceId !== (selection.kind === "occurrence" ? selection.id : sourceId)));
            if (selection?.kind === "relationship")
                for (const form of Array.from(item.querySelectorAll(":scope > div > form")))
                    form.toggleAttribute("hidden", form.querySelector("[data-edit-relationship-id]")?.dataset.editRelationshipId !== selection.id);
        }
        document.querySelectorAll("#flow-graph-workspace [data-occurrence-id],#flow-graph-workspace [data-relationship-id]").forEach((element) => element.classList.toggle("is-selected", element.dataset[selection?.kind === "occurrence" ? "occurrenceId" : "relationshipId"] === selection?.id));
        documentaryEditor.querySelector(".flow-selection-heading")?.remove();
        if (!selection)
            return;
        const heading = document.createElement("h3"), occurrence = steps.find(({ id }) => id === selection.id), relationship = relationships.find(({ id }) => id === selection.id), source = steps.find(({ id }) => id === relationship?.sourceNodeId), target = steps.find(({ id }) => id === relationship?.targetNodeId);
        heading.className = "flow-selection-heading";
        heading.tabIndex = -1;
        heading.textContent = selection.kind === "occurrence" ? `Selected occurrence: ${occurrence?.name ?? selection.id}` : `Selected relationship: ${source?.name ?? "Unknown source"} → ${target?.name ?? "Unknown target"}`;
        documentaryEditor.insertBefore(heading, list);
        heading.focus({ preventScroll: true });
    }
    function selectItem(kind, itemId) { selectedItem = { kind, id: itemId }; renderInspector(); queueMicrotask(() => document.querySelector(kind === "occurrence" ? `[data-edit-occurrence-id="${itemId}"]` : `[data-edit-relationship-id="${itemId}"]`)?.focus()); }
    function focusOccurrence(nodeId) { selectItem("occurrence", nodeId); }
    function focusRelationship(relationshipId) { selectedItem = { kind: "relationship", id: relationshipId }; document.querySelectorAll("#flow-graph-workspace [data-relationship-id]").forEach((element) => element.classList.toggle("is-selected", element.dataset.relationshipId === relationshipId)); queueMicrotask(() => document.querySelector(`[aria-label="Synchronized editable Flow outline"] [data-relationship-id="${relationshipId}"] button`)?.focus()); }
    function saveLayout(flowId, nodeId, currentLayout, x, y) { const { state } = current(); if (!state)
        return; const lane = laneForX(x), layout = { lane: lane.name, x: lane.x, y: Math.max(55, Math.round(y)) }; if (layout.x === currentLayout.x && layout.y === currentLayout.y && layout.lane === currentLayout.lane) {
        document.querySelector(`[data-occurrence-id="${nodeId}"]`)?.focus();
        return;
    } options.persist(moveGraphOccurrence(state, flowId, nodeId, layout)); queueMicrotask(() => document.querySelector(`[data-occurrence-id="${nodeId}"]`)?.focus()); }
    function renderGraph(flow) {
        const host = q("#flow-graph-workspace");
        host.replaceChildren();
        const { state } = current();
        if (!state)
            return;
        const projection = projectFlowGraph(state.project, flow.id), section = document.createElement("section"), heading = document.createElement("h3"), boundary = document.createElement("p"), instructions = document.createElement("p"), views = document.createElement("div"), graph = document.createElementNS("http://www.w3.org/2000/svg", "svg"), outline = document.createElement("ol");
        const graphLanes = projection.lanes.length ? projection.lanes.map(({ id, name }, index) => ({ id, name, x: 30 + index * 200 })) : lanes.map((lane) => ({ ...lane, id: lane.name }));
        section.className = "documentary-flow";
        heading.textContent = "Directional Flow graph";
        boundary.className = "status-text";
        boundary.textContent = "Specification Flow — Event payload validation remains independent. Sequence, branch, and occurrence expectations are checked manually.";
        instructions.textContent = "Drag a node, or focus it and use arrow keys, to reposition it. Press Enter or Space to edit. Use the synchronized outline to edit occurrence and relationship meaning.";
        views.className = "flow-projections";
        graph.classList.add("flow-graph-canvas");
        graph.setAttribute("aria-label", "Interactive directional Flow canvas");
        graph.setAttribute("role", "application");
        outline.setAttribute("aria-label", "Synchronized editable Flow outline");
        if (!projection.graph.nodes.length) {
            const empty = document.createElement("section"), copy = document.createElement("p"), action = document.createElement("button");
            empty.className = "flow-empty-state";
            copy.textContent = "Page Groups define lanes, Pages bind context Events, and Events own reusable payload schemas. Occurrences retain stable Page Group, Page, binding, and Event references. Per-Event payload validation remains independent; topology, branch, and journey expectations remain manual.";
            action.type = "button";
            action.className = "primary";
            action.textContent = "Start a Page-context occurrence";
            action.addEventListener("click", () => { occurrenceType.value = "page-context"; syncAddContextBindings(); q("#flow-step-name").focus(); });
            empty.append(copy, action);
            section.append(heading, boundary, empty);
            host.append(section);
            return;
        }
        const positions = new Map(projection.graph.nodes.map((node, index) => [node.id, node.layout ?? { lane: node.role === "context-setting" ? "Context" : "Shipping", x: node.role === "context-setting" ? 30 : 230, y: 70 + index * 120 }])), canvasHeight = Math.max(360, ...Array.from(positions.values(), ({ y }) => y + 150));
        graph.setAttribute("viewBox", `0 0 840 ${canvasHeight}`);
        for (const lane of graphLanes) {
            const band = document.createElementNS(graph.namespaceURI, "rect"), label = document.createElementNS(graph.namespaceURI, "text");
            band.classList.add("flow-lane");
            band.dataset.pageGroupId = lane.id;
            band.setAttribute("x", String(lane.x - 15));
            band.setAttribute("y", "8");
            band.setAttribute("width", "200");
            band.setAttribute("height", String(canvasHeight - 16));
            label.classList.add("flow-lane-label");
            label.setAttribute("x", String(lane.x));
            label.setAttribute("y", "32");
            label.textContent = lane.name;
            graph.append(band, label);
        }
        for (const relationship of projection.graph.relationships) {
            const source = positions.get(relationship.sourceNodeId), target = positions.get(relationship.targetNodeId);
            if (!source || !target)
                continue;
            const record = flowRelationshipText(projection.graph, relationship), item = document.createElement("li"), button = document.createElement("button"), edge = document.createElementNS(graph.namespaceURI, "g"), line = document.createElementNS(graph.namespaceURI, "line"), arrow = document.createElementNS(graph.namespaceURI, "polygon"), label = document.createElementNS(graph.namespaceURI, "text"), geometry = flowEdgeGeometry(source, target), selected = selectedItem?.kind === "relationship" && relationship.id === selectedItem.id, select = () => selectItem("relationship", relationship.id);
            button.type = "button";
            button.textContent = record;
            button.setAttribute("aria-current", String(selected));
            button.addEventListener("click", select);
            item.dataset.relationshipId = relationship.id;
            item.classList.toggle("is-selected", selected);
            item.append(button);
            outline.append(item);
            edge.dataset.relationshipId = relationship.id;
            edge.dataset.directed = "true";
            edge.classList.add("flow-edge");
            edge.classList.toggle("is-selected", selected);
            edge.tabIndex = 0;
            edge.setAttribute("role", "button");
            edge.setAttribute("aria-label", `Edit relationship ${record}`);
            edge.addEventListener("click", select);
            edge.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                select();
            } });
            line.setAttribute("x1", String(geometry.startX));
            line.setAttribute("y1", String(geometry.startY));
            line.setAttribute("x2", String(geometry.endX));
            line.setAttribute("y2", String(geometry.endY));
            arrow.setAttribute("points", geometry.arrow);
            label.setAttribute("x", String((geometry.startX + geometry.endX) / 2));
            label.setAttribute("y", String((geometry.startY + geometry.endY) / 2 - 8));
            label.textContent = record;
            edge.append(line, arrow, label);
            graph.append(edge);
        }
        for (const row of flowOutline(projection.graph)) {
            const nodeData = projection.graph.nodes.find(({ id }) => id === row.nodeId), page = projection.catalog.pages.find(({ id }) => id === nodeData.pageId), event = projection.catalog.events.find(({ id }) => id === nodeData.eventId), position = positions.get(nodeData.id), record = `${row.name} · ${row.role} · ${page?.name ?? "Unresolved Page"} · ${event?.name ?? "Unresolved Event"} · ${row.obligation} · ${row.expectedMinimum}–${row.expectedMaximum ?? "many"}`, item = document.createElement("li"), button = document.createElement("button"), node = document.createElementNS(graph.namespaceURI, "g"), box = document.createElementNS(graph.namespaceURI, "rect"), roleLabel = document.createElementNS(graph.namespaceURI, "text"), nameLabel = document.createElementNS(graph.namespaceURI, "text"), referenceLabel = document.createElementNS(graph.namespaceURI, "text");
            button.type = "button";
            button.textContent = `${record} · ${position.lane}`;
            button.addEventListener("click", () => focusOccurrence(nodeData.id));
            item.dataset.occurrenceId = nodeData.id;
            item.append(button);
            outline.insertBefore(item, outline.querySelector("[data-relationship-id]"));
            node.dataset.occurrenceId = nodeData.id;
            node.dataset.lane = position.lane;
            node.classList.add("flow-node");
            node.tabIndex = 0;
            node.setAttribute("role", "button");
            node.setAttribute("aria-label", `${record}. Lane ${position.lane}. Drag or use arrow keys to move. Press Enter or Space to edit.`);
            node.setAttribute("transform", `translate(${position.x} ${position.y})`);
            box.setAttribute("width", String(nodeWidth));
            box.setAttribute("height", String(nodeHeight));
            box.setAttribute("rx", "10");
            roleLabel.classList.add("flow-node-role");
            roleLabel.setAttribute("x", "12");
            roleLabel.setAttribute("y", "19");
            roleLabel.textContent = row.role;
            nameLabel.setAttribute("x", "12");
            nameLabel.setAttribute("y", "43");
            nameLabel.textContent = row.name;
            referenceLabel.classList.add("flow-node-reference");
            referenceLabel.setAttribute("x", "12");
            referenceLabel.setAttribute("y", "65");
            referenceLabel.textContent = `${page?.name ?? "No Page"} · ${event?.name ?? "No Event"} · ${row.obligation}`;
            node.append(box, roleLabel, nameLabel, referenceLabel);
            node.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                focusOccurrence(nodeData.id);
                return;
            } if (!event.key.startsWith("Arrow"))
                return; event.preventDefault(); const currentLane = Math.max(0, lanes.findIndex(({ name }) => name === position.lane)); if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                const nextIndex = Math.max(0, Math.min(lanes.length - 1, currentLane + (event.key === "ArrowLeft" ? -1 : 1)));
                saveLayout(flow.id, nodeData.id, position, lanes[nextIndex].x, position.y);
                return;
            } const distance = event.shiftKey ? 60 : 20; saveLayout(flow.id, nodeData.id, position, lanes[currentLane].x, Math.max(55, position.y + (event.key === "ArrowUp" ? -distance : distance))); });
            node.addEventListener("pointerdown", (event) => { if (event.button !== 0)
                return; event.preventDefault(); node.focus(); const origin = svgClientPoint(graph, event.clientX, event.clientY), pointerId = event.pointerId; let nextX = position.x, nextY = position.y, finished = false; try {
                node.setPointerCapture(pointerId);
                node.dataset.pointerCapture = node.hasPointerCapture(pointerId) ? "native" : "synthetic-unavailable";
            }
            catch {
                node.dataset.pointerCapture = "synthetic-unavailable";
            } const move = (moveEvent) => { if (moveEvent.pointerId !== pointerId)
                return; const point = svgClientPoint(graph, moveEvent.clientX, moveEvent.clientY); nextX = Math.max(30, Math.min(630, position.x + point.x - origin.x)); nextY = Math.max(55, position.y + point.y - origin.y); node.setAttribute("transform", `translate(${nextX} ${nextY})`); node.dataset.lane = laneForX(nextX).name; }, cleanup = () => { node.removeEventListener("pointermove", move); node.removeEventListener("pointerup", commit); node.removeEventListener("pointercancel", cancel); node.removeEventListener("lostpointercapture", cancel); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", commit); window.removeEventListener("pointercancel", cancel); if (node.hasPointerCapture(pointerId))
                node.releasePointerCapture(pointerId); }, commit = (commitEvent) => { if (finished || commitEvent.pointerId !== pointerId)
                return; finished = true; cleanup(); saveLayout(flow.id, nodeData.id, position, nextX, nextY); }, cancel = (cancelEvent) => { if (finished || cancelEvent.pointerId !== pointerId)
                return; finished = true; cleanup(); node.setAttribute("transform", `translate(${position.x} ${position.y})`); node.dataset.lane = position.lane; node.focus(); }; node.addEventListener("pointermove", move); node.addEventListener("pointerup", commit); node.addEventListener("pointercancel", cancel); node.addEventListener("lostpointercapture", cancel); window.addEventListener("pointermove", move); window.addEventListener("pointerup", commit); window.addEventListener("pointercancel", cancel); });
            graph.append(node);
        }
        const graphView = document.createElement("section"), outlineView = document.createElement("section"), graphHeading = document.createElement("h4"), outlineHeading = document.createElement("h4"), diagnostics = document.createElement("p");
        graphHeading.textContent = "Interactive canvas";
        outlineHeading.textContent = "Synchronized outline";
        diagnostics.textContent = projection.diagnostics.length ? projection.diagnostics.map(({ kind, message }) => `${kind}: ${message}`).join("; ") : "No graph integrity diagnostics.";
        graphView.append(graphHeading, instructions, graph);
        outlineView.append(outlineHeading, outline);
        views.append(graphView, outlineView);
        section.append(heading, boundary, views, diagnostics);
        host.append(section);
    }
    function render(renderWorkspace = true) {
        const list = q("#flow-step-list");
        list.replaceChildren();
        addForm.querySelector(".documentary-flow")?.remove();
        const { state, flow, steps } = current();
        if (!state || !flow)
            return;
        if (renderWorkspace)
            renderGraph(flow);
        steps.forEach((step, index) => {
            const item = document.createElement("li"), form = document.createElement("form"), heading = document.createElement("h3"), name = document.createElement("input"), minimum = document.createElement("input"), maximum = document.createElement("input"), nodeRole = document.createElement("select"), nodeObligation = document.createElement("select"), lane = document.createElement("select"), page = document.createElement("select"), event = document.createElement("select"), save = document.createElement("button"), up = document.createElement("button"), down = document.createElement("button"), remove = document.createElement("button"), relationships = document.createElement("div"), position = step.position;
            heading.textContent = `${index + 1}. ${step.name}`;
            name.value = step.name;
            name.dataset.editOccurrenceId = step.id;
            name.setAttribute("aria-label", "Occurrence name");
            minimum.type = maximum.type = "number";
            minimum.min = maximum.min = "0";
            minimum.value = String(step.minimum ?? 1);
            maximum.value = String(step.maximum ?? 1);
            minimum.setAttribute("aria-label", "Expected minimum");
            maximum.setAttribute("aria-label", "Expected maximum");
            for (const [value, text] of [["interaction", "Interaction"], ["context-setting", "Context-setting"]])
                nodeRole.append(new Option(text, value));
            nodeRole.value = String(step.fallbackRole ?? "interaction");
            nodeRole.setAttribute("aria-label", "Role");
            for (const value of ["Required", "Optional", "Conditional", "Informational"])
                nodeObligation.append(new Option(value, value));
            nodeObligation.value = String(step.obligation ?? (step.optional ? "Optional" : "Required"));
            nodeObligation.setAttribute("aria-label", "Obligation");
            replaceOptions(page, state.project.collections.pages, "Choose Page");
            replaceOptions(event, state.project.collections.events, "Choose Event");
            page.value = String(step.pageId ?? "");
            event.value = String(step.eventId ?? "");
            page.setAttribute("aria-label", "Resolved Page");
            event.setAttribute("aria-label", "Shared Event");
            for (const value of lanes.map(({ name }) => name))
                lane.append(new Option(value, value));
            lane.value = String(step.lane ?? (step.fallbackRole === "context-setting" ? "Context" : "Shipping"));
            lane.setAttribute("aria-label", "Canvas lane");
            save.type = "submit";
            save.textContent = "Save occurrence";
            up.type = down.type = remove.type = "button";
            up.textContent = "Move up";
            down.textContent = "Move down";
            remove.textContent = "Remove";
            up.disabled = index === 0;
            down.disabled = index === steps.length - 1;
            form.addEventListener("submit", (submitEvent) => { submitEvent.preventDefault(); const fresh = current().state; if (!fresh)
                return; const laneX = lanes.find(({ name }) => name === lane.value)?.x ?? 230; options.persist(updateGraphOccurrence(fresh, flow.id, step.id, occurrenceInput({ name: name.value.trim(), pageId: page.value, eventId: event.value, fallbackRole: nodeRole.value, obligation: nodeObligation.value, minimum: Number(minimum.value), maximum: Number(maximum.value), lane: lane.value, x: laneX, y: position?.y ?? 70 + index * 120 }))); queueMicrotask(() => document.querySelector(`[data-edit-occurrence-id="${step.id}"]`)?.focus()); });
            up.addEventListener("click", () => { const fresh = current().state; if (fresh)
                options.persist(reorderGraphOccurrence(fresh, flow.id, index, index - 1)); });
            down.addEventListener("click", () => { const fresh = current().state; if (fresh)
                options.persist(reorderGraphOccurrence(fresh, flow.id, index, index + 1)); });
            remove.addEventListener("click", () => { const fresh = current().state; if (fresh)
                options.persist(removeGraphOccurrence(fresh, flow.id, step.id)); });
            form.append(heading, name, page, event, nodeRole, nodeObligation, minimum, maximum, lane, save, up, down, remove);
            const appendRelationship = (relationship) => { const row = document.createElement("form"), target = document.createElement("select"), kind = document.createElement("select"), relationGroup = document.createElement("input"), label = document.createElement("input"), documentationCondition = document.createElement("input"), expectation = document.createElement("input"), commit = document.createElement("button"); replaceOptions(target, steps.filter(({ id }) => id !== step.id), "Choose target occurrence"); target.value = relationship?.toStepId ?? ""; target.setAttribute("aria-label", `Relationship target from ${step.name}`); for (const value of ["expected-next", "alternative", "parallel", "merge"])
                kind.append(new Option(value, value)); kind.value = relationship?.kind ?? "expected-next"; kind.setAttribute("aria-label", "Relationship kind"); if (relationship)
                kind.dataset.editRelationshipId = relationship.id; relationGroup.value = relationship?.group ?? ""; relationGroup.setAttribute("aria-label", "Relationship group"); label.value = relationship?.label ?? ""; label.setAttribute("aria-label", `Relationship label from ${step.name}`); documentationCondition.value = relationship?.documentationCondition ?? ""; documentationCondition.setAttribute("aria-label", `Documentation condition from ${step.name}`); documentationCondition.placeholder = "Plain-language documentation condition"; expectation.value = relationship?.expectation ?? ""; expectation.setAttribute("aria-label", `Relationship expectation from ${step.name}`); commit.type = "submit"; commit.textContent = relationship ? "Save relationship" : "Add relationship"; row.addEventListener("submit", (submitEvent) => { submitEvent.preventDefault(); const fresh = current().state; if (!fresh || !target.value)
                return; const relationshipId = relationship?.id ?? options.id("flow-relationship"); options.persist(saveGraphRelationship(fresh, flow.id, step.id, { id: relationshipId, toStepId: target.value, kind: kind.value, ...(relationGroup.value.trim() ? { group: relationGroup.value.trim() } : {}), ...(label.value.trim() ? { label: label.value.trim() } : {}), ...(documentationCondition.value.trim() ? { documentationCondition: documentationCondition.value.trim() } : {}), ...(expectation.value.trim() ? { expectation: expectation.value.trim() } : {}) }, options.id)); focusRelationship(relationshipId); }); row.append(kind, target, relationGroup, label, documentationCondition, expectation, commit); relationships.append(row); };
            for (const relationship of current().relationships.filter(({ sourceNodeId }) => sourceNodeId === step.id))
                appendRelationship({ ...relationship, id: relationship.id, toStepId: String(relationship.targetNodeId ?? "") });
            appendRelationship();
            item.append(form, relationships);
            list.append(item);
        });
    }
    function synchronizeRenderedOccurrenceControls() {
        for (const item of Array.from(q("#flow-step-list").children)) {
            const occurrenceForm = item.querySelector("form");
            if (!occurrenceForm)
                continue;
            const name = occurrenceForm.querySelector('[aria-label="Occurrence name"]'), page = occurrenceForm.querySelector('[aria-label="Resolved Page"]'), event = occurrenceForm.querySelector('select[aria-label="Shared Event"]'), nodeRole = occurrenceForm.querySelector('[aria-label="Role"]'), lane = occurrenceForm.querySelector('[aria-label="Canvas lane"]'), step = current().steps.find(({ id }) => id === name.dataset.editOccurrenceId);
            name.required = page.required = event.required = true;
            if (step?.pageGroupId) {
                const { state, flow } = current(), laneIds = flow?.pageGroupIds ?? [], groups = laneIds.map((groupId) => state?.project.collections.pageGroups.find(({ id }) => id === groupId)).filter((group) => Boolean(group));
                replaceOptions(lane, groups, "Choose Page Group");
                lane.value = String(step.pageGroupId);
                lane.setAttribute("aria-label", "Page Group");
                nodeRole.hidden = true;
                const contextual = Boolean(step.contextBindingId), type = occurrenceForm.querySelector('[aria-label="Occurrence type"]') ?? document.createElement("output");
                type.setAttribute("aria-label", "Occurrence type");
                type.textContent = contextual ? "Page context" : "Interaction";
                if (!type.parentElement)
                    occurrenceForm.insertBefore(type, nodeRole);
                nodeRole.value = contextual ? "context-setting" : "interaction";
                if (contextual) {
                    const selectedPage = state?.project.collections.pages.find(({ id }) => id === step.pageId), bindings = selectedPage?.contextEventBindings ?? [];
                    replaceOptions(event, bindings, "Choose context-event binding");
                    event.value = String(step.contextBindingId);
                    event.setAttribute("aria-label", "Context-event binding");
                }
                else
                    event.value = String(step.eventId ?? "");
            }
            else {
                syncRoleControl(event, nodeRole);
                event.addEventListener("change", () => syncRoleControl(event, nodeRole));
            }
            for (const target of Array.from(item.querySelectorAll('[aria-label^="Relationship target"]')))
                target.required = true;
        }
    }
    addForm.addEventListener("submit", (event) => { event.preventDefault(); const { state, flow, steps } = current(); if (!state || !flow) {
        q("#flow-step-result").textContent = "Select a Flow before adding an Event occurrence.";
        return;
    } try {
        const projectedRole = synchronizedRole(addEvent.value, role.value).role, nodeObligation = obligation.value, lane = projectedRole === "context-setting" ? lanes[0] : lanes[1];
        options.persist(addGraphOccurrence(state, flow.id, occurrenceInput({ name: addName.value.trim(), pageId: addPage.value, eventId: addEvent.value, fallbackRole: role.value, obligation: nodeObligation, minimum: Number(q("#flow-step-minimum").value), maximum: Number(q("#flow-step-maximum").value), lane: lane.name, x: lane.x, y: 70 + steps.length * 120 }), options.id));
        q("#flow-step-result").textContent = "Event occurrence saved with stable Page and Event references.";
        addForm.reset();
        q("#flow-step-minimum").value = "1";
        q("#flow-step-maximum").value = "1";
    }
    catch (error) {
        q("#flow-step-result").textContent = error instanceof Error ? error.message : String(error);
    } });
    addForm.addEventListener("reset", () => queueMicrotask(() => { role.disabled = false; role.value = "interaction"; }));
    return { render: () => { const active = Boolean(current().flow); documentaryEditor.hidden = !active; render(); synchronizeRenderedOccurrenceControls(); syncRoleControl(addEvent, role); renderFlowLaneControls(); }, renderSelectors };
}
//# sourceMappingURL=data-layer-flow-graph-ui.js.map