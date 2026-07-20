import { compileLayeredSchema, exportLayeredSchema, resolveLayeredTarget, validateLayeredObservation } from "./data-layer-layered-schema.js";
import { confirmCanonicalMigration, redoProjectTransaction, transactProject, undoProjectTransaction } from "./data-layer-specification-project.js";
import { applyCanonicalCommand, canonicalSchemaWithConstraint, canonicalTableRows, createCanonicalSchema, migrateLegacyProfile } from "./data-layer-canonical-schema.js";
import { mountCanonicalSchemaEditor } from "./data-layer-canonical-schema-ui.js";
import { layeredContributorPath, layeredContributorsForPath } from "./data-layer-layered-schema-project.js";
export { layeredContributionDetails, layeredContributorPath, layeredContributorsForPath } from "./data-layer-layered-schema-project.js";
const q = (selector) => { const value = document.querySelector(selector); if (!value)
    throw new Error(`Missing ${selector}`); return value; };
const scopeFor = (kind) => ({ profiles: "Shared Profile", events: "Event", pageGroups: "Page Group", pages: "Page", flows: "Flow Page-instance" }[kind] ?? "Event-occurrence");
const structuredPaths = (document, prefix = "") => { if (!document || typeof document !== "object")
    return []; const properties = document.properties ?? {}; return Object.entries(properties).flatMap(([name, value]) => { const path = `${prefix}/${name}`; return [path, ...structuredPaths(value, path)]; }); };
export function composeStructuredRules(rules, reusableRules, structured) { return { rules: [...rules, ...(structured.field ? [{ field: structured.field, operator: structured.operator || "equals", ...(structured.value ? { value: structured.value } : {}) }] : [])], reusableRules: [...reusableRules, ...(structured.reusableRuleId ? [{ id: structured.reusableRuleId }] : [])] }; }
const profileStructuredDocument = (profile) => profile.canonicalSchema?.sourceContent?.document ?? profile.structuredSchema ?? profile.structuredDraft?.document;
export const sharedProfilePropertyPaths = (profile) => { const canonical = profile.canonicalSchema; return canonical ? canonicalTableRows(canonical).map(({ path }) => path) : [...new Set([...structuredPaths(profileStructuredDocument(profile)), ...(profile.schemaConstraints ?? []).map(({ path }) => path)])]; };
export function compareLayeredRevisions(entity, from, to) { const canonical = entity.canonicalSchema, sourcePaths = structuredPaths(profileStructuredDocument(entity)), draftPaths = sharedProfilePropertyPaths(entity), pathsFor = (choice) => choice === "source" ? sourcePaths : draftPaths, labelFor = (choice) => choice === "source" ? `Source revision ${String(entity.sourceRevision ?? canonical?.source?.revision ?? "new")}` : "Current draft", fromPaths = pathsFor(from), toPaths = pathsFor(to), fromSet = new Set(fromPaths), toSet = new Set(toPaths); return { fromLabel: labelFor(from), toLabel: labelFor(to), addedPaths: toPaths.filter((path) => !fromSet.has(path)), removedPaths: fromPaths.filter((path) => !toSet.has(path)), retainedPaths: toPaths.filter((path) => fromSet.has(path)), constraintChanges: from === to ? 0 : canonical?.changes.length ?? (entity.schemaConstraints ?? []).length }; }
const appendRevisionComparisonControls = (host, entity, ariaLabel) => { const from = document.createElement("select"), to = document.createElement("select"), compare = document.createElement("button"), result = document.createElement("output"), labeled = (text, control) => { const label = document.createElement("label"); label.append(text, control); return label; }, option = (choice) => new Option(choice === "source" ? `Source revision ${String(entity.sourceRevision ?? "new")}` : "Current draft", choice); host.setAttribute("aria-label", ariaLabel); from.setAttribute("aria-label", `${ariaLabel} from`); to.setAttribute("aria-label", `${ariaLabel} to`); from.append(option("source"), option("draft")); to.append(option("source"), option("draft")); from.value = "source"; to.value = "draft"; compare.type = "button"; compare.textContent = "Compare revisions"; result.setAttribute("aria-label", `${ariaLabel} result`); result.textContent = "Choose revisions, then compare."; compare.addEventListener("click", () => { const comparison = compareLayeredRevisions(entity, from.value, to.value), paths = (values) => values.length ? values.join(", ") : "none"; result.textContent = `${comparison.fromLabel} → ${comparison.toLabel} · Added: ${paths(comparison.addedPaths)} · Removed: ${paths(comparison.removedPaths)} · Retained: ${comparison.retainedPaths.length} · Draft constraint changes: ${comparison.constraintChanges}`; }); host.append(labeled("Compare from", from), labeled("Compare to", to), compare, result); };
export function appendSharedProfileConstraint(state, profileId, constraint) { const profile = state.project.collections.profiles.find(({ id }) => id === profileId); if (!profile)
    throw new Error(`Shared Profile ${profileId} is unavailable.`); const canonical = profile.canonicalSchema ?? migrateLegacyProfile(profile, { id: (kind) => `${kind}:${crypto.randomUUID()}` }).document, next = canonicalSchemaWithConstraint(canonical, constraint, (kind) => `${kind}:${crypto.randomUUID()}`); return transactProject(state, `Save canonical schema contribution for ${profile.name}`, (project) => ({ ...project, collections: { ...project.collections, profiles: project.collections.profiles.map((candidate) => { if (candidate.id !== profileId)
            return candidate; const updated = { ...candidate, requirements: [], canonicalSchema: next, compiledTargetsStale: true }; delete updated.structuredSchema; delete updated.structuredDraft; delete updated.schemaConstraints; return updated; }) } })); }
export function mountSidePanelLayeredProfileEditor(options) { let selectedProfileId; const render = () => { const state = options.load(), profiles = state?.project.collections.profiles ?? []; options.host.replaceChildren(); options.host.setAttribute("aria-label", "Side-panel Shared Profile editor"); const heading = document.createElement("h4"); heading.textContent = "Shared Profile schema editor"; options.host.append(heading); if (!state || !profiles.length) {
    const empty = document.createElement("p");
    empty.textContent = state ? "Add a Shared Profile in the Builder to begin canonical schema authoring." : "Create or open a Specification Project to edit Shared Profiles.";
    options.host.append(empty);
    return;
} if (!profiles.some(({ id }) => id === selectedProfileId))
    selectedProfileId = profiles[0].id; const selector = document.createElement("select"), label = document.createElement("label"), profile = profiles.find(({ id }) => id === selectedProfileId); selector.setAttribute("aria-label", "Shared Profile to edit"); for (const candidate of profiles)
    selector.append(new Option(candidate.name, candidate.id)); selector.value = profile.id; selector.addEventListener("change", () => { selectedProfileId = selector.value; render(); }); label.append("Shared Profile", selector); options.host.append(label); const canonical = profile.canonicalSchema; if (!canonical) {
    const plan = migrateLegacyProfile(profile, { id: (kind) => `${kind}:${crypto.randomUUID()}` }), review = document.createElement("section"), summary = document.createElement("p"), confirm = document.createElement("button");
    review.setAttribute("aria-label", "Canonical schema migration review");
    summary.textContent = `Migration review: ${Object.keys(plan.document.nodes).length} properties · ${plan.conflicts.length} conflicts.`;
    confirm.type = "button";
    confirm.textContent = "Confirm canonical migration";
    confirm.disabled = Boolean(plan.conflicts.length);
    confirm.addEventListener("click", () => { options.persist(confirmCanonicalMigration(state, plan)); render(); });
    review.append(summary, confirm);
    options.host.append(review);
    return;
} const editorHost = document.createElement("section"); options.host.append(editorHost); mountCanonicalSchemaEditor({ host: editorHost, surface: "Side panel", load: () => options.load().project.collections.profiles.find(({ id }) => id === selectedProfileId).canonicalSchema, id: (kind) => `${kind}:${crypto.randomUUID()}`, dispatch: (command) => { const currentState = options.load(), currentProfile = currentState.project.collections.profiles.find(({ id }) => id === selectedProfileId), current = currentProfile.canonicalSchema, result = applyCanonicalCommand(current, command); if (result.status === "applied" || result.status === "rebased")
        options.persist(transactProject(currentState, `${command.kind} canonical property in ${currentProfile.name}`, (project) => ({ ...project, collections: { ...project.collections, profiles: project.collections.profiles.map((candidate) => candidate.id === currentProfile.id ? { ...candidate, canonicalSchema: result.document, requirements: [] } : candidate) } }))); return result; }, onUndo: () => { const current = options.load(); if (current) {
        options.persist(undoProjectTransaction(current));
        render();
    } }, onRedo: () => { const current = options.load(); if (current) {
        options.persist(redoProjectTransaction(current));
        render();
    } } }); }; render(); window.addEventListener("storage", (event) => { if (event.storageArea === localStorage)
    render(); }); return { render }; }
export const layeredEventRole = (entity) => entity.role === "context-setting" ? "context" : entity.role === "interaction" ? "interaction" : entity.contextBindingId || entity.occurrenceType === "page-context" ? "context" : "interaction";
export const effectivePropertySummary = (property) => [property.type ? `type ${property.type}` : undefined, property.allowedValues ? `allowed ${JSON.stringify(property.allowedValues)}` : undefined, property.presence ? `presence ${property.presence}` : undefined, property.expectedValue !== undefined ? `expected ${JSON.stringify(property.expectedValue)}` : undefined, property.patterns?.length ? `patterns ${JSON.stringify(property.patterns)}` : undefined, property.minimum !== undefined || property.maximum !== undefined ? `range ${String(property.minimum ?? "−∞")}..${String(property.maximum ?? "∞")}` : undefined, property.minItems !== undefined || property.maxItems !== undefined ? `cardinality ${String(property.minItems ?? 0)}..${String(property.maxItems ?? "∞")}` : undefined, property.rules?.length ? `rules ${property.rules.length}` : undefined, property.reusableRules?.length ? `reusable ${property.reusableRules.length}` : undefined].filter(Boolean).join(" · ");
export function installLayeredSchemaUi(options) {
    const inspector = q("#project-inspector"), workspace = q("#workspace-content"), editorHost = q("#layered-schema-editor-host"), summary = document.createElement("section"), editor = document.createElement("section");
    let graphSelection, graphSelectionScope, returnFocus, flowReturn;
    summary.setAttribute("aria-label", "Schema constraints summary");
    editor.setAttribute("aria-label", "Shared schema constraints editor");
    editor.hidden = true;
    inspector.insertBefore(summary, inspector.firstChild?.nextSibling ?? null);
    editorHost.append(editor);
    const current = () => { const { state, kind, entityId } = options.context(), entity = state && entityId ? state.project.collections[kind].find(({ id }) => id === entityId) : undefined; return { state, kind, entity: graphSelection ?? entity, scope: graphSelectionScope ?? scopeFor(kind) }; };
    const id = (kind) => `${kind}:${crypto.randomUUID()}`;
    const writeCanonical = (state, entity, scope, canonical) => transactProject(state, `Save canonical schema for ${entity.name}`, (project) => { if (graphSelection && (scope === "Event-occurrence" || Boolean(graphSelection.freePageFrame))) {
        const flowId = options.context().entityId, graphs = project.documentationFlowGraphs;
        return { ...project, documentationFlowGraphs: { ...graphs, [flowId]: { ...graphs[flowId], occurrences: graphs[flowId].occurrences.map((candidate) => candidate.id === entity.id ? { ...candidate, canonicalSchema: canonical } : candidate) } } };
    } const collectionKind = scope === "Page" ? "pages" : scope === "Page Group" ? "pageGroups" : scope === "Event" ? "events" : scope === "Shared Profile" ? "profiles" : "flows"; return { ...project, collections: { ...project.collections, [collectionKind]: project.collections[collectionKind].map((candidate) => candidate.id === entity.id ? { ...candidate, canonicalSchema: canonical, ...(collectionKind === "profiles" ? { requirements: [] } : {}) } : candidate) } }; });
    const ensureCanonical = () => { const { state, entity, scope } = current(); if (!state || !entity || entity.canonicalSchema)
        return; const legacy = Boolean(entity.requirements || entity.structuredSchema || entity.structuredDraft || entity.schemaConstraints), canonical = legacy ? migrateLegacyProfile(entity, { id }).document : createCanonicalSchema({ id: id("canonical-schema"), contributorId: entity.id, contributorName: entity.name }); if (graphSelection)
        graphSelection = { ...graphSelection, canonicalSchema: canonical }; options.persist(writeCanonical(state, entity, scope, canonical)); };
    const renderCanonicalLayerEditor = (state, entity, scope) => { const canonical = entity.canonicalSchema; if (!canonical)
        return false; const title = document.createElement("h2"), identity = document.createElement("p"), areas = document.createElement("nav"), host = document.createElement("section"), back = document.createElement("button"), compiled = compileLayeredSchema(layeredContributorsForPath(state, layeredContributorPath(state, entity, scope, options.context().kind === "flows" ? options.context().entityId : undefined)), { eventId: String(entity.eventId ?? entity.id), eventRole: layeredEventRole(entity), occurrenceId: entity.id }); title.tabIndex = -1; title.textContent = "Shared canonical schema editor"; identity.textContent = `Contributor: ${entity.name} · Scope: ${scope}`; areas.textContent = `Inherited constraints · Local contributions · Effective results · Blocking conflicts (${compiled.conflicts.length})`; back.type = "button"; back.textContent = "Return to Flow"; back.addEventListener("click", () => { editor.hidden = true; editorHost.hidden = true; workspace.hidden = false; returnFocus?.focus({ preventScroll: true }); }); editor.append(title, identity, areas, host, renderRuntimeControls(state, entity, scope, compiled), back); mountCanonicalSchemaEditor({ host, surface: "Flow workspace", load: () => current().entity.canonicalSchema, id, dispatch: (command) => { const live = current(), document = live.entity.canonicalSchema, result = applyCanonicalCommand(document, command); if ((result.status === "applied" || result.status === "rebased") && live.state) {
            if (graphSelection)
                graphSelection = { ...graphSelection, canonicalSchema: result.document };
            options.persist(writeCanonical(live.state, live.entity, live.scope, result.document));
            queueMicrotask(renderEditor);
        } return result; } }); return true; };
    const contributorsFor = (state, entity, scope) => layeredContributorsForPath(state, layeredContributorPath(state, entity, scope, options.context().kind === "flows" ? options.context().entityId : undefined));
    const storedTargets = (state) => state.project.layeredSchemaTargets ?? [];
    const executableTargets = (state) => storedTargets(state).map((target) => ({ ...target, compiled: compileLayeredSchema(layeredContributorsForPath(state, target), { eventId: target.eventId, eventRole: target.eventRole, ...(target.occurrenceId ? { occurrenceId: target.occurrenceId } : {}) }) }));
    function renderRuntimeControls(state, entity, scope, compiled) {
        const section = document.createElement("section"), heading = document.createElement("h3"), propertyTree = document.createElement("ol"), targetEvent = document.createElement("select"), targetRole = document.createElement("select"), activation = document.createElement("select"), priority = document.createElement("input"), applicability = document.createElement("textarea"), saveTarget = document.createElement("button"), observation = document.createElement("textarea"), test = document.createElement("button"), assignmentResult = document.createElement("pre"), manual = document.createElement("select"), payload = document.createElement("textarea"), validate = document.createElement("button"), validationResult = document.createElement("pre"), developerExport = document.createElement("button"), exportResult = document.createElement("pre"), existing = storedTargets(state).find(({ contributorId }) => contributorId === entity.id), path = layeredContributorPath(state, entity, scope, options.context().kind === "flows" ? options.context().entityId : undefined);
        const effectivePathButton = (propertyPath, text) => { const choose = document.createElement("button"); choose.type = "button"; choose.dataset.propertyId = propertyPath; choose.setAttribute("aria-current", "false"); choose.textContent = text; choose.addEventListener("click", () => { propertyTree.querySelectorAll("[data-property-id]").forEach((candidate) => candidate.setAttribute("aria-current", String(candidate === choose))); choose.focus(); }); return choose; };
        section.setAttribute("aria-label", "Effective schema operations");
        heading.textContent = "Compiled effective schema and activation";
        propertyTree.setAttribute("aria-label", "Compiled layered property tree");
        for (const [propertyPath, property] of Object.entries(compiled.properties)) {
            const item = document.createElement("li"), effective = effectivePropertySummary(property);
            item.append(effectivePathButton(propertyPath, `${propertyPath}${effective ? ` · ${effective}` : ""} · ${property.origins.map(({ scope: originScope, contributorName }) => `${originScope}: ${contributorName}`).join(" → ")}${property.superseded.length ? ` · superseded ${property.superseded.map(({ contributorName, value }) => `${contributorName} ${String(value)}`).join(", ")}` : ""}`));
            propertyTree.append(item);
        }
        for (const conflict of compiled.conflicts) {
            const item = document.createElement("li"), left = document.createElement("button"), right = document.createElement("button");
            item.className = "error";
            left.type = right.type = "button";
            left.textContent = conflict.contributors[0] ?? "Earlier contributor";
            right.textContent = conflict.contributors[1] ?? entity.name;
            item.append(effectivePathButton(conflict.path, `${conflict.path}: ${conflict.message}`), " · ", left, " ↔ ", right);
            propertyTree.append(item);
        }
        targetEvent.setAttribute("aria-label", "Layered target Event");
        targetEvent.append(new Option("Choose Event", ""), ...state.project.collections.events.map((event) => new Option(event.name, event.id)));
        targetEvent.value = existing?.eventId ?? path.eventId ?? "";
        targetEvent.required = true;
        targetRole.setAttribute("aria-label", "Layered target Event role");
        targetRole.append(new Option("Context Event", "context"), new Option("Interaction Event", "interaction"));
        targetRole.value = existing?.eventRole ?? layeredEventRole(entity);
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
        saveTarget.addEventListener("click", () => { const liveState = current().state ?? state, liveEntity = current().entity ?? entity, liveExisting = storedTargets(liveState).find(({ contributorId }) => contributorId === liveEntity.id), predicates = JSON.parse(applicability.value || "[]"), eventName = predicates.find(({ field, operator }) => field === "eventName" && operator === "equals")?.value, selectedEvent = liveState.project.collections.events.find(({ id, name }) => id === targetEvent.value || !targetEvent.value && eventName === name); if (!selectedEvent)
            throw new Error("Choose the Event for this layered target."); const flow = liveState.project.collections.flows.find(({ id }) => id === path.flowId), page = liveState.project.collections.pages.find(({ id }) => id === path.pageId), context = { eventId: selectedEvent.id, eventRole: targetRole.value, ...(scope === "Event-occurrence" ? { occurrenceId: liveEntity.id } : {}) }, target = { id: liveExisting?.id ?? `layered-target:${liveEntity.id}`, name: liveEntity.name, contributorId: liveEntity.id, activation: activation.value, priority: Number(priority.value), applicability: predicates, ...path, ...context, revision: (liveExisting?.revision ?? 0) + 1, flowName: flow?.name ?? liveEntity.name, pageName: page?.name ?? String(liveEntity.pageName ?? liveEntity.pageId ?? "Page"), eventName: selectedEvent.name }, next = transactProject(liveState, `Save layered activation for ${liveEntity.name}`, (project) => ({ ...project, layeredSchemaTargets: [...(project.layeredSchemaTargets ?? []).filter(({ contributorId }) => contributorId !== liveEntity.id), target] })); options.persist(next); renderEditor(); });
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
        section.append(heading, propertyTree, labeled("Target Event", targetEvent), labeled("Event role", targetRole), labeled("Activation", activation), labeled("Priority", priority), labeled("Applicability", applicability), saveTarget, labeled("Test observation", observation), test, assignmentResult, labeled("Manual Flow / Page / Event", manual), labeled("Validation payload", payload), validate, validationResult, developerExport, exportResult);
        return section;
    }
    function renderSummary() { const context = options.context(), { state, entity, scope } = current(); summary.replaceChildren(); summary.dataset.contextKind = context.kind; summary.dataset.contextEntityId = context.entityId ?? ""; if (!state || !entity) {
        summary.hidden = true;
        delete summary.dataset.eventRole;
        return;
    } summary.hidden = false; const title = document.createElement("h3"), counts = document.createElement("p"), open = document.createElement("button"), eventRole = layeredEventRole(entity), compiled = compileLayeredSchema(contributorsFor(state, entity, scope), { eventId: String(entity.eventId ?? entity.id), eventRole, ...(entity.id ? { occurrenceId: entity.id } : {}) }), local = (entity.schemaConstraints ?? []).length, activation = String(entity.activation ?? "manual"); summary.dataset.eventRole = eventRole; title.textContent = `Schema constraints · ${entity.name} · ${scope}`; counts.textContent = `Inherited ${Math.max(0, compiled.provenance.length - 1)} · Local ${local} · Effective ${Object.keys(compiled.properties).length} · Conflict ${compiled.conflicts.length} · ${eventRole === "context" ? "Context Event" : "Interaction Event"} · Activation ${activation}`; open.type = "button"; open.textContent = "Open complete schema editor"; open.addEventListener("click", () => { returnFocus = open; editor.hidden = false; ensureCanonical(); renderEditor(); editorHost.hidden = false; workspace.hidden = true; editor.querySelector("h2")?.focus(); }); summary.append(title, counts, open); }
    function renderEditor() { const { state, entity, scope } = current(); editor.replaceChildren(); if (!state || !entity)
        return; if (!renderCanonicalLayerEditor(state, entity, scope)) {
        const unavailable = document.createElement("p");
        unavailable.textContent = "Initialize the canonical contribution before editing.";
        editor.append(unavailable);
    } }
    editor.addEventListener("submit", () => queueMicrotask(() => { const output = editor.querySelector('[role="status"]'), scope = current().scope; if (output)
        output.textContent = `Affected scope: ${scope} · compiled targets stale · Draft · Undo available`; }));
    const graphContributorSelector = '[data-occurrence-id],[data-page-frame-id],[aria-label="Interactive directional Flow canvas"] [data-page-group-id]';
    const selectGraphContributor = (target) => { const { state, kind, entityId: flowId } = options.context(); if (!state || kind !== "flows" || !flowId)
        return; const graphs = state.project.documentationFlowGraphs, occurrenceId = target.dataset.occurrenceId, pageId = target.dataset.pageId ?? target.dataset.pageFrameId, pageGroupId = !pageId ? target.dataset.pageGroupId : undefined, pane = q("#workspace-pane"), graph = document.querySelector('[aria-label="Interactive directional Flow canvas"]'); if (occurrenceId) {
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
        return; const stableSelectorId = occurrenceId ?? target.dataset.pageFrameId ?? pageGroupId, id = CSS.escape(stableSelectorId), selector = occurrenceId ? `[data-occurrence-id="${id}"]` : pageId ? `[data-page-frame-id="${id}"]` : `[aria-label="Interactive directional Flow canvas"] [data-page-group-id="${id}"]`; flowReturn = { selector, scrollLeft: pane.scrollLeft, scrollTop: pane.scrollTop, viewBox: graph?.getAttribute("viewBox") ?? "" }; renderSummary(); };
    document.addEventListener("click", (event) => { const target = event.target.closest(graphContributorSelector); if (target)
        selectGraphContributor(target); });
    document.addEventListener("keydown", (event) => { if (event.key !== "Enter" && event.key !== " ")
        return; const target = event.target.closest(graphContributorSelector); if (target)
        selectGraphContributor(target); });
    const openGraphOccurrenceSchema = (occurrenceId, path) => { const { state, kind, entityId: flowId } = options.context(), graphs = state?.project.documentationFlowGraphs, occurrence = flowId ? graphs?.[flowId]?.occurrences?.find(({ id }) => id === occurrenceId) : undefined; if (!state || kind !== "flows" || !flowId || !occurrence)
        return false; graphSelection = occurrence; graphSelectionScope = occurrence.freePageFrame ? "Flow Page-instance" : "Event-occurrence"; returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined; editor.hidden = false; ensureCanonical(); renderEditor(); editorHost.hidden = false; workspace.hidden = true; editor.querySelector("h2")?.focus(); if (path)
        setTimeout(() => Array.from(editor.querySelectorAll("[data-property-id]")).find((candidate) => candidate.dataset.propertyId === path || candidate.textContent?.includes(path))?.click(), 0); return true; };
    return { render() { if (editor.hidden) {
            graphSelection = undefined;
            graphSelectionScope = undefined;
        } renderSummary(); }, openGraphOccurrenceSchema };
}
//# sourceMappingURL=data-layer-layered-schema-ui.js.map