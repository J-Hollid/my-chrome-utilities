import { compileLayeredSchema, exportLayeredSchema, resolveLayeredTarget, validateLayeredObservation } from "./data-layer-layered-schema.js";
import { transactProject } from "./data-layer-specification-project.js";
const q = (selector) => { const value = document.querySelector(selector); if (!value)
    throw new Error(`Missing ${selector}`); return value; };
const scopeFor = (kind) => ({ profiles: "Shared Profile", events: "Event", pageGroups: "Page Group", pages: "Page", flows: "Flow Page-instance" }[kind] ?? "Event-occurrence");
const contributionFor = (entity, scope) => ({ id: entity.id, name: entity.name, scope, constraints: (entity.schemaConstraints ?? []) });
const structuredPaths = (document, prefix = "") => { if (!document || typeof document !== "object")
    return []; const properties = document.properties ?? {}; return Object.entries(properties).flatMap(([name, value]) => { const path = `${prefix}/${name}`; return [path, ...structuredPaths(value, path)]; }); };
export const layeredEventRole = (entity) => entity.contextBindingId || entity.occurrenceType === "page-context" ? "context" : "interaction";
export const effectivePropertySummary = (property) => [property.type ? `type ${property.type}` : undefined, property.allowedValues ? `allowed ${JSON.stringify(property.allowedValues)}` : undefined, property.presence ? `presence ${property.presence}` : undefined, property.patterns?.length ? `patterns ${JSON.stringify(property.patterns)}` : undefined, property.rules?.length ? `rules ${property.rules.length}` : undefined].filter(Boolean).join(" · ");
const referencedId = (entity, key) => typeof entity[key] === "string" ? String(entity[key]) : undefined;
const referencedProfileId = (state, entity) => referencedId(entity, "profileId") ?? (entity.profileIds?.length === 1 ? String(entity.profileIds[0]) : state.project.collections.profiles.length === 1 ? state.project.collections.profiles[0].id : undefined);
export function layeredContributorPath(state, entity, scope, flowId) {
    const selectedFlowId = flowId ?? (scope === "Flow Page-instance" ? entity.id : undefined), flowGraph = selectedFlowId ? state.project.documentationFlowGraphs?.[selectedFlowId] : undefined, flowPageGroupIds = flowGraph?.pageGroupIds ?? [], flowPageGroupId = flowPageGroupIds.length === 1 ? flowPageGroupIds[0] : undefined, flowPageGroup = state.project.collections.pageGroups.find(({ id }) => id === flowPageGroupId), flowPageIds = flowPageGroup?.pageIds ?? [], flowPageId = flowPageIds.length === 1 ? flowPageIds[0] : undefined, profileId = scope === "Shared Profile" ? entity.id : referencedProfileId(state, entity), pageId = referencedId(entity, "pageId") ?? (scope === "Page" ? entity.id : scope === "Flow Page-instance" ? flowPageId : undefined), containingGroups = pageId ? state.project.collections.pageGroups.filter((group) => (group.pageIds ?? []).includes(pageId)) : [], pageGroupId = referencedId(entity, "pageGroupId") ?? (scope === "Page Group" ? entity.id : containingGroups.length === 1 ? containingGroups[0].id : scope === "Flow Page-instance" ? flowPageGroupId : undefined), selectedPage = pageId ? state.project.collections.pages.find(({ id }) => id === pageId) : undefined, contextBinding = (selectedPage?.contextEventBindings ?? []).find(({ id }) => id === entity.contextBindingId), eventId = referencedId(entity, "eventId") ?? referencedId(contextBinding ?? { id: "", name: "" }, "eventId") ?? (scope === "Event" ? entity.id : undefined);
    return { ...(profileId ? { profileId } : {}), ...(eventId ? { eventId } : {}), ...(pageGroupId ? { pageGroupId } : {}), ...(pageId ? { pageId } : {}), ...(flowId || scope === "Flow Page-instance" ? { flowId: flowId ?? entity.id } : {}), ...(scope === "Event-occurrence" ? { occurrenceId: entity.id } : {}) };
}
export function layeredContributorsForPath(state, path) {
    const graph = path.flowId ? state.project.documentationFlowGraphs?.[path.flowId] : undefined, occurrence = graph?.occurrences?.find(({ id }) => id === path.occurrenceId);
    const one = (entities, id, scope) => id ? entities.filter((entity) => entity.id === id).map((entity) => contributionFor(entity, scope)) : [];
    return [...one(state.project.collections.profiles, path.profileId, "Shared Profile"), ...one(state.project.collections.events, path.eventId, "Event"), ...one(state.project.collections.pageGroups, path.pageGroupId, "Page Group"), ...one(state.project.collections.pages, path.pageId, "Page"), ...one(state.project.collections.flows, path.flowId, "Flow Page-instance"), ...(occurrence ? [contributionFor(occurrence, occurrence.freePageFrame ? "Flow Page-instance" : "Event-occurrence")] : [])];
}
export function installLayeredSchemaUi(options) {
    const inspector = q("#project-inspector"), workspace = q("#workspace-content"), editorHost = q("#layered-schema-editor-host"), summary = document.createElement("section"), editor = document.createElement("section");
    let graphSelection, graphSelectionScope, returnFocus, flowReturn;
    summary.setAttribute("aria-label", "Schema constraints summary");
    editor.setAttribute("aria-label", "Shared schema constraints editor");
    editor.hidden = true;
    inspector.insertBefore(summary, inspector.firstChild?.nextSibling ?? null);
    editorHost.append(editor);
    const current = () => { const { state, kind, entityId } = options.context(), entity = state && entityId ? state.project.collections[kind].find(({ id }) => id === entityId) : undefined; return { state, kind, entity: graphSelection ?? entity, scope: graphSelectionScope ?? scopeFor(kind) }; };
    const contributorsFor = (state, entity, scope) => layeredContributorsForPath(state, layeredContributorPath(state, entity, scope, options.context().kind === "flows" ? options.context().entityId : undefined));
    const storedTargets = (state) => state.project.layeredSchemaTargets ?? [];
    const executableTargets = (state) => storedTargets(state).map((target) => ({ ...target, compiled: compileLayeredSchema(layeredContributorsForPath(state, target), { eventId: target.eventId, eventRole: target.eventRole, ...(target.occurrenceId ? { occurrenceId: target.occurrenceId } : {}) }) }));
    function renderRuntimeControls(state, entity, scope, compiled) {
        const section = document.createElement("section"), heading = document.createElement("h3"), propertyTree = document.createElement("ol"), activation = document.createElement("select"), priority = document.createElement("input"), applicability = document.createElement("textarea"), saveTarget = document.createElement("button"), observation = document.createElement("textarea"), test = document.createElement("button"), assignmentResult = document.createElement("pre"), manual = document.createElement("select"), payload = document.createElement("textarea"), validate = document.createElement("button"), validationResult = document.createElement("pre"), developerExport = document.createElement("button"), exportResult = document.createElement("pre"), existing = storedTargets(state).find(({ contributorId }) => contributorId === entity.id);
        section.setAttribute("aria-label", "Effective schema operations");
        heading.textContent = "Compiled effective schema and activation";
        propertyTree.setAttribute("aria-label", "Compiled layered property tree");
        for (const [path, property] of Object.entries(compiled.properties)) {
            const item = document.createElement("li"), effective = effectivePropertySummary(property);
            item.textContent = `${path}${effective ? ` · ${effective}` : ""} · ${property.origins.map(({ scope: originScope, contributorName }) => `${originScope}: ${contributorName}`).join(" → ")}${property.superseded.length ? ` · superseded ${property.superseded.map(({ contributorName, value }) => `${contributorName} ${String(value)}`).join(", ")}` : ""}`;
            propertyTree.append(item);
        }
        for (const conflict of compiled.conflicts) {
            const item = document.createElement("li"), left = document.createElement("button"), right = document.createElement("button");
            item.className = "error";
            left.type = right.type = "button";
            left.textContent = conflict.contributors[0] ?? "Earlier contributor";
            right.textContent = conflict.contributors[1] ?? entity.name;
            item.append(`${conflict.path}: ${conflict.message} · `, left, " ↔ ", right);
            propertyTree.append(item);
        }
        for (const value of ["automatic", "manual", "documentation-only"])
            activation.append(new Option(value === "documentation-only" ? "Documentation only" : value, value));
        activation.setAttribute("aria-label", "Layered target activation");
        activation.value = existing?.activation ?? "manual";
        priority.type = "number";
        priority.value = String(existing?.priority ?? 10);
        priority.setAttribute("aria-label", "Layered target priority");
        applicability.setAttribute("aria-label", "Layered applicability predicates");
        applicability.value = JSON.stringify(existing?.applicability ?? [], null, 2);
        saveTarget.type = "button";
        saveTarget.textContent = "Save activation target";
        saveTarget.addEventListener("click", () => { const path = layeredContributorPath(state, entity, scope, options.context().kind === "flows" ? options.context().entityId : undefined), context = { eventId: String(path.eventId ?? entity.id), eventRole: layeredEventRole(entity), ...(scope === "Event-occurrence" ? { occurrenceId: entity.id } : {}) }, target = { id: existing?.id ?? `layered-target:${entity.id}`, name: entity.name, contributorId: entity.id, activation: activation.value, priority: Number(priority.value), applicability: JSON.parse(applicability.value || "[]"), ...path, ...context, revision: (existing?.revision ?? 0) + 1, flowName: String(entity.flowName ?? "Checkout journey"), pageName: String(entity.pageName ?? entity.pageId ?? "Shipping Page"), eventName: String(entity.eventName ?? "Purchase Event") }, next = transactProject(state, `Save layered activation for ${entity.name}`, (project) => ({ ...project, layeredSchemaTargets: [...(project.layeredSchemaTargets ?? []).filter(({ contributorId }) => contributorId !== entity.id), target] })); options.persist(next); renderEditor(); });
        observation.setAttribute("aria-label", "Applicability test observation");
        observation.value = '{"pathname":"/checkout/shipping","page_name":"shipping","checkout_variant":"alternative","eventName":"Purchase"}';
        test.type = "button";
        test.textContent = "Test automatic applicability";
        assignmentResult.setAttribute("aria-label", "Layered assignment evidence");
        test.addEventListener("click", () => { const result = resolveLayeredTarget(executableTargets(current().state), JSON.parse(observation.value)); assignmentResult.textContent = JSON.stringify({ selectionMode: result.selectionMode, winner: result.winner?.name, ties: result.ties, candidates: result.candidates }, null, 2); });
        manual.setAttribute("aria-label", "Manual layered target");
        manual.append(new Option("Choose Flow / Page / Event target", ""), ...storedTargets(state).filter(({ activation: mode }) => mode === "manual").map((target) => new Option(`${target.flowName} / ${target.pageName} / ${target.eventName}`, target.id)));
        payload.setAttribute("aria-label", "Layered validation payload");
        payload.value = '{"funnel_step":"3a","funnel_name":"checkout"}';
        validate.type = "button";
        validate.textContent = "Validate selected layered target";
        validationResult.setAttribute("aria-label", "Layered validation result");
        validate.addEventListener("click", () => { const targets = executableTargets(current().state), manualResolution = manual.value ? resolveLayeredTarget(targets, {}, { manualTargetId: manual.value }) : undefined, automaticResolution = manual.value ? undefined : resolveLayeredTarget(targets, JSON.parse(observation.value)), winner = manualResolution?.winner ?? automaticResolution?.winner; if (!winner) {
            validationResult.textContent = JSON.stringify({ blocked: true, ties: automaticResolution?.ties ?? [], automaticWinnerClaim: false });
            return;
        } const stored = storedTargets(current().state).find(({ id }) => id === winner.id); validationResult.textContent = JSON.stringify({ ...validateLayeredObservation({ targetId: winner.id, targetName: winner.name, revision: stored.revision, compiled: winner.compiled }, JSON.parse(payload.value)), selectionMode: manualResolution ? "manual" : "automatic", automaticWinnerClaim: Boolean(automaticResolution?.winner) }, null, 2); });
        developerExport.type = "button";
        developerExport.textContent = "Generate effective schema developer export";
        exportResult.setAttribute("aria-label", "Effective schema developer export");
        developerExport.addEventListener("click", () => { const target = storedTargets(current().state).find(({ contributorId }) => contributorId === entity.id); exportResult.textContent = exportLayeredSchema({ targetName: target?.flowName ?? entity.name, pageName: target?.pageName ?? String(entity.pageId ?? "Page"), eventName: target?.eventName ?? String(entity.eventId ?? "Event"), activation: target?.activation ?? "manual", compiled }); });
        const labeled = (text, control) => { const label = document.createElement("label"); label.append(text, control); return label; };
        section.append(heading, propertyTree, labeled("Activation", activation), labeled("Priority", priority), labeled("Applicability", applicability), saveTarget, labeled("Test observation", observation), test, assignmentResult, labeled("Manual Flow / Page / Event", manual), labeled("Validation payload", payload), validate, validationResult, developerExport, exportResult);
        return section;
    }
    function renderSummary() { const { state, entity, scope } = current(); summary.replaceChildren(); if (!state || !entity) {
        summary.hidden = true;
        return;
    } summary.hidden = false; const title = document.createElement("h3"), counts = document.createElement("p"), open = document.createElement("button"), compiled = compileLayeredSchema(contributorsFor(state, entity, scope), { eventId: String(entity.eventId ?? entity.id), eventRole: layeredEventRole(entity), ...(entity.id ? { occurrenceId: entity.id } : {}) }), local = (entity.schemaConstraints ?? []).length, activation = String(entity.activation ?? "manual"); title.textContent = `Schema constraints · ${entity.name} · ${scope}`; counts.textContent = `Inherited ${Math.max(0, compiled.provenance.length - 1)} · Local ${local} · Effective ${Object.keys(compiled.properties).length} · Conflict ${compiled.conflicts.length} · Activation ${activation}`; open.type = "button"; open.textContent = "Open complete schema editor"; open.addEventListener("click", () => { returnFocus = open; renderEditor(); editor.hidden = false; editorHost.hidden = false; workspace.hidden = true; editor.querySelector("h2")?.focus(); }); summary.append(title, counts, open); }
    function renderEditor() {
        const { state, entity, scope } = current();
        editor.replaceChildren();
        if (!state || !entity)
            return;
        const title = document.createElement("h2"), identity = document.createElement("p"), areas = document.createElement("nav"), tree = document.createElement("ul"), search = document.createElement("input"), form = document.createElement("form"), status = document.createElement("p"), back = document.createElement("button"), compiled = compileLayeredSchema(contributorsFor(state, entity, scope), { eventId: String(entity.eventId ?? entity.id), eventRole: layeredEventRole(entity), occurrenceId: entity.id });
        title.tabIndex = -1;
        title.textContent = "Shared schema editor";
        identity.textContent = `Contributor: ${entity.name} · Scope: ${scope}`;
        areas.setAttribute("aria-label", "Constraint result layers");
        areas.textContent = `Inherited constraints · Local contributions · Effective results · Superseded expectations · Blocking conflicts (${compiled.conflicts.length})`;
        search.type = "search";
        search.setAttribute("aria-label", "Add constraint inherited property search");
        search.placeholder = "Search inherited property paths";
        const paths = [...new Set(Object.keys(compiled.properties))];
        const refreshPaths = () => { tree.replaceChildren(...paths.filter((path) => path.includes(search.value)).map((path) => { const item = document.createElement("li"), button = document.createElement("button"); button.type = "button"; button.textContent = path; button.addEventListener("click", () => { form.querySelector('[name="path"]').value = path; }); item.append(button); return item; })); };
        search.addEventListener("input", refreshPaths);
        refreshPaths();
        const fields = [["path", "Property path", "text"], ["type", "Scalar type", "text"], ["allowedValues", "Allowed values (JSON)", "text"], ["presence", "Required, optional, forbidden, or permitted", "text"], ["expectedValue", "Expected value", "text"], ["enforcement", "Enforcement policy", "text"], ["target", "Target events", "text"], ["patterns", "Regular expressions (JSON)", "text"], ["condition", "Condition (JSON)", "text"], ["documentation", "Documentation", "text"], ["examples", "Examples (JSON)", "text"], ["rules", "Conditional and reusable rules (JSON)", "text"]];
        for (const [name, labelText, type] of fields) {
            const label = document.createElement("label"), input = document.createElement("input");
            label.textContent = labelText;
            input.name = name;
            input.type = type;
            if (name === "path")
                input.required = true;
            label.append(input);
            form.append(label);
        }
        const save = document.createElement("button");
        save.type = "submit";
        save.textContent = "Save constraint";
        form.append(save);
        status.setAttribute("role", "status");
        form.addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(form), parse = (name) => { const value = String(data.get(name) ?? "").trim(); if (!value)
            return undefined; if (["allowedValues", "patterns", "condition", "examples", "rules"].includes(name))
            return JSON.parse(value); return value; }, constraint = { path: String(data.get("path")), ...(parse("type") ? { type: String(parse("type")) } : {}), ...(parse("allowedValues") ? { allowedValues: parse("allowedValues") } : {}), ...(parse("presence") ? { presence: parse("presence") } : {}), ...(parse("expectedValue") !== undefined ? { expectedValue: parse("expectedValue") } : {}), ...(parse("enforcement") ? { enforcement: parse("enforcement") } : {}), ...(parse("target") ? { target: String(parse("target")) } : {}), ...(parse("patterns") ? { patterns: parse("patterns") } : {}), ...(parse("condition") ? { condition: parse("condition") } : {}), ...(parse("documentation") ? { documentation: String(parse("documentation")) } : {}), ...(parse("examples") ? { examples: parse("examples") } : {}), ...(parse("rules") ? { rules: parse("rules") } : {}) }; const next = transactProject(state, `Save schema constraint for ${entity.name}`, (project) => { if (graphSelection && (graphSelectionScope === "Event-occurrence" || Boolean(graphSelection.freePageFrame))) {
            const flowId = options.context().entityId, graphs = project.documentationFlowGraphs;
            return { ...project, documentationFlowGraphs: { ...graphs, [flowId]: { ...graphs[flowId], occurrences: graphs[flowId].occurrences.map((candidate) => candidate.id === entity.id ? { ...candidate, schemaConstraints: [...(candidate.schemaConstraints ?? []), constraint], compiledTargetsStale: true } : candidate) } } };
        } const collectionKind = graphSelectionScope === "Page" ? "pages" : graphSelectionScope === "Page Group" ? "pageGroups" : options.context().kind; return { ...project, collections: { ...project.collections, [collectionKind]: project.collections[collectionKind].map((candidate) => candidate.id === entity.id ? { ...candidate, schemaConstraints: [...(candidate.schemaConstraints ?? []), constraint], compiledTargetsStale: true } : candidate) } }; }); options.persist(next); status.textContent = `Affected scope: ${scope} · compiled targets stale · Draft · Undo available`; renderSummary(); renderEditor(); });
        const schemaDocument = entity.structuredSchema ?? entity.structuredDraft?.document;
        for (const path of structuredPaths(schemaDocument)) {
            const item = document.createElement("li");
            item.textContent = `${path} · property · required/forbidden · rules · documentation · examples`;
            tree.append(item);
        }
        back.type = "button";
        back.textContent = "Return to Flow";
        back.addEventListener("click", () => { editor.hidden = true; editorHost.hidden = true; workspace.hidden = false; if (flowReturn) {
            const saved = flowReturn, pane = q("#workspace-pane"), graph = document.querySelector('[aria-label="Interactive directional Flow canvas"]');
            pane.scrollLeft = saved.scrollLeft;
            pane.scrollTop = saved.scrollTop;
            if (graph && graph.getAttribute("viewBox") !== saved.viewBox)
                graph.setAttribute("viewBox", saved.viewBox);
            queueMicrotask(() => document.querySelector(saved.selector)?.focus({ preventScroll: true }));
        }
        else
            returnFocus?.focus({ preventScroll: true }); });
        editor.append(title, identity, areas, search, tree, form, status, renderRuntimeControls(state, entity, scope, compiled), back);
    }
    editor.addEventListener("submit", () => queueMicrotask(() => { const output = editor.querySelector('[role="status"]'), scope = current().scope; if (output)
        output.textContent = `Affected scope: ${scope} · compiled targets stale · Draft · Undo available`; }));
    const graphContributorSelector = '[data-occurrence-id],[data-page-frame-id],[aria-label="Interactive directional Flow canvas"] [data-page-group-id]';
    const selectGraphContributor = (target) => { const { state, kind, entityId: flowId } = options.context(); if (!state || kind !== "flows" || !flowId)
        return; const graphs = state.project.documentationFlowGraphs, occurrenceId = target.dataset.occurrenceId, pageId = target.dataset.pageFrameId, pageGroupId = !pageId ? target.dataset.pageGroupId : undefined, pane = q("#workspace-pane"), graph = document.querySelector('[aria-label="Interactive directional Flow canvas"]'); if (occurrenceId) {
        graphSelection = graphs[flowId]?.occurrences?.find(({ id }) => id === occurrenceId);
        graphSelectionScope = graphSelection?.freePageFrame ? "Flow Page-instance" : "Event-occurrence";
    }
    else if (pageId) {
        graphSelection = state.project.collections.pages.find(({ id }) => id === pageId);
        graphSelectionScope = "Page";
    }
    else if (pageGroupId && pageGroupId !== "ungrouped") {
        graphSelection = state.project.collections.pageGroups.find(({ id }) => id === pageGroupId);
        graphSelectionScope = "Page Group";
    }
    else
        return; if (!graphSelection)
        return; const id = CSS.escape(occurrenceId ?? pageId ?? pageGroupId), selector = occurrenceId ? `[data-occurrence-id="${id}"]` : pageId ? `[data-page-frame-id="${id}"]` : `[aria-label="Interactive directional Flow canvas"] [data-page-group-id="${id}"]`; flowReturn = { selector, scrollLeft: pane.scrollLeft, scrollTop: pane.scrollTop, viewBox: graph?.getAttribute("viewBox") ?? "" }; renderSummary(); };
    document.addEventListener("click", (event) => { const target = event.target.closest(graphContributorSelector); if (target)
        selectGraphContributor(target); });
    document.addEventListener("keydown", (event) => { if (event.key !== "Enter" && event.key !== " ")
        return; const target = event.target.closest(graphContributorSelector); if (target)
        selectGraphContributor(target); });
    return { render() { if (!editor.hidden)
            return; graphSelection = undefined; graphSelectionScope = undefined; renderSummary(); } };
}
//# sourceMappingURL=data-layer-layered-schema-ui.js.map