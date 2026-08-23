import { compileProjectDocumentation, ProjectDocumentationVisualUnavailableError, projectDocumentationSources } from "./data-layer-project-documentation-compiler.js";
import { createProjectDocumentationSet, } from "./data-layer-project-documentation-records.js";
import { projectDocumentationSnapshotStale, selectProjectDocumentationTables, themeFingerprint, } from "./data-layer-project-documentation-workspace.js";
import { declareStudioChoice } from "./data-layer-studio-choice-controls.js";
import { renderReorderControl } from "./reorderable-editor/control.js";
import { reorderValues } from "./reorderable-editor/model.js";
import { documentationButton as button, documentationControlInput as controlInput, documentationHeading as heading, documentationLabelled as labelled, documentationLogoArea as logoArea, renderDocumentationTable as renderTable, } from "./project-documentation/workspace-ui-elements.js";
import { consumeDocumentationIncompleteConfirmation, documentationExportPresentation, documentationExportSelection, renderDocumentationExport, } from "./project-documentation/workspace-export-ui.js";
import { createDocumentationSectionConfigurationRenderer } from "./project-documentation/workspace-build-ui.js";
import { renderDocumentationConceptConfiguration, renderDocumentationContent } from "./project-documentation/workspace-content-ui.js";
import { renderDocumentationTheme } from "./project-documentation/workspace-theme-ui.js";
import { appendProjectDocumentationSet } from "./project-documentation/workspace-set-creation.js";
import { renderDocumentationSetCreationUi } from "./project-documentation/workspace-set-creation-ui.js";
import { renderDocumentationTemplateLibrary } from "./project-documentation/workspace-template-library-ui.js";
import { writeProjectDocumentationWorkbookWithTemplates } from "./documentation-templates/excel-renderer.js";
import { renderProjectDocumentationRichWithTemplates } from "./documentation-templates/rich-renderer.js";
import { documentationTemplateAssignment, documentationTemplateProblems } from "./documentation-templates/template-library.js";
import { documentationPreviewSelection, documentationTabAfterKey, } from "./project-documentation/workspace-navigation.js";
export { consumeDocumentationIncompleteConfirmation, documentationExportPresentation, documentationExportSelection, documentationPreviewSelection, documentationTabAfterKey, };
const visualBodyKey = (projectId, digest) => `${projectId}\u0000${digest}`;
const visualBodyFailureMessage = (error) => error instanceof DOMException && error.name === "NotFoundError" ? "The saved visual body is unavailable." : "The saved visual body could not be read.";
const visualBodyDataUrl = async (body, mediaType) => { const bytes = new Uint8Array(await body.arrayBuffer()); let binary = ""; for (let offset = 0; offset < bytes.length; offset += 32768)
    binary += String.fromCharCode(...bytes.slice(offset, offset + 32768)); return `data:${mediaType};base64,${btoa(binary)}`; };
export function projectDocumentationVisualBodyRequirements(state, set) { if (!set)
    return []; const flowIds = new Set(set.sections.filter(({ selected, kind }) => selected && kind === "flow").map(({ targetId }) => String(targetId ?? ""))), assetIds = new Set(), graphs = state.project.documentationFlowGraphs ?? {}; for (const flowId of flowIds)
    for (const frame of graphs[flowId]?.pageFrames ?? []) {
        const assetId = String(frame.conceptVisual?.assetId ?? "");
        if (assetId)
            assetIds.add(assetId);
    } const assets = state.project.conceptVisualAssets ?? [], byId = new Map(assets.map(asset => [asset.id, asset])); return [...assetIds].flatMap(assetId => { const asset = byId.get(assetId); return asset && ["image/png", "image/jpeg", "image/webp"].includes(asset.mediaType) ? [{ digest: asset.digest, mediaType: asset.mediaType }] : []; }).filter((item, index, items) => items.findIndex(candidate => candidate.digest === item.digest) === index); }
export function createProjectDocumentationVisualBodyHydrator(load) { const bodies = new Map(), failures = new Map(), inFlight = new Map(); const hydrateOne = (projectId, requirement, retryFailed) => { const key = visualBodyKey(projectId, requirement.digest); if (bodies.has(key) || (!retryFailed && failures.has(key)))
    return Promise.resolve(); const active = inFlight.get(key); if (active)
    return active; const task = (async () => { failures.delete(key); try {
    const body = await load(projectId, requirement.digest);
    if (!body)
        throw new DOMException("The saved visual body is unavailable.", "NotFoundError");
    bodies.set(key, await visualBodyDataUrl(body, requirement.mediaType));
}
catch (error) {
    failures.set(key, { digest: requirement.digest, message: visualBodyFailureMessage(error) });
}
finally {
    inFlight.delete(key);
} })(); inFlight.set(key, task); return task; }; const settle = async (projectId, requirements, settings = {}) => { await Promise.all(requirements.map(requirement => hydrateOne(projectId, requirement, settings.retryFailed === true))); return requirements.flatMap(requirement => { const failure = failures.get(visualBodyKey(projectId, requirement.digest)); return failure ? [failure] : []; }); }; const status = (projectId, requirements) => { if (!requirements.length || requirements.every(({ digest }) => bodies.has(visualBodyKey(projectId, digest))))
    return "ready"; if (requirements.some(({ digest }) => inFlight.has(visualBodyKey(projectId, digest))))
    return "loading"; if (requirements.some(({ digest }) => failures.has(visualBodyKey(projectId, digest))))
    return "failed"; return "idle"; }; const prime = (state) => { const assets = state.project.conceptVisualAssets ?? []; for (const asset of assets)
    if (typeof asset.bytes === "string" && /^data:image\/(?:png|jpeg|webp);base64,/iu.test(asset.bytes))
        bodies.set(visualBodyKey(state.project.id, asset.digest), asset.bytes); }; const apply = (state) => { const project = state.project; return { ...state, project: { ...project, conceptVisualAssets: project.conceptVisualAssets?.map(asset => { const bytes = bodies.get(visualBodyKey(project.id, asset.digest)); return bytes ? { ...asset, bytes } : asset; }) } }; }; return { apply, prime, settle, status }; }
const defaultPorts = () => ({
    writePlain: async (value) => navigator.clipboard.writeText(value),
    writeRich: async (html, plain) => {
        if (globalThis.ClipboardItem && navigator.clipboard.write) {
            await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([plain], { type: "text/plain" }) })]);
            return;
        }
        await navigator.clipboard.writeText(plain);
    },
    download: (name, bytes, type) => { const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes).buffer], { type })), link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); },
});
export function installProjectDocumentationWorkspaceUi(options) {
    const basePorts = options.ports ?? defaultPorts(), ports = { ...basePorts, ...(options.loadTemplateBody ? { readTemplateBody: async (digest) => { const projectId = options.state()?.project.id; if (!projectId)
                throw new Error("Open a project before exporting a template."); const body = await options.loadTemplateBody(projectId, digest); if (!body)
                throw new Error("The assigned Excel template body is missing from this project."); return body; } } : {}) };
    let selectedSetId = "", selectedSectionId = "", selectedTemplateId = "", selectedRichBlockId = "", selectedExportIds = new Set(), snapshot, feedback = "", confirmedIncomplete = false, exportScope = "current", primaryTab = "build", previewSectionId = "", addContentOpen = false, themeOpen = false, templatesOpen = false, templateMobileDetail = false, richEditorMobileDetail = false, setCreationOpen = false, mobileBuildSurface = "outline", documentSettingsOpen = false, pendingExportAction, visualHydration;
    const visualBodyHydrator = options.loadVisualAssetBody ? createProjectDocumentationVisualBodyHydrator(options.loadVisualAssetBody) : undefined;
    const documentation = () => options.state()?.project.documentation ?? { sets: [], themes: [] };
    const active = () => { const records = documentation(), set = records.sets.find(({ id }) => id === selectedSetId) ?? records.sets[0], theme = set ? records.themes.find(({ id }) => id === set.themeId) : undefined; return { records, set, theme }; };
    const persist = (records, label) => options.save(records, label);
    const saveSet = (next, label) => { const records = documentation(); persist({ ...records, sets: records.sets.some(({ id }) => id === next.id) ? records.sets.map((item) => item.id === next.id ? next : item) : [...records.sets, next] }, label); };
    const saveTheme = (next, label) => { const records = documentation(); persist({ ...records, themes: records.themes.some(({ id }) => id === next.id) ? records.themes.map((item) => item.id === next.id ? next : item) : [...records.themes, next] }, label); };
    const mutateSection = (set, sectionId, update, label) => saveSet(createProjectDocumentationSet({ ...set, sections: set.sections.map((section) => section.id === sectionId ? update(section) : section) }), label);
    const sources = (state) => projectDocumentationSources(state, new Date().toISOString(), options.revision());
    const visualContext = () => { const state = options.state(), { set } = active(); if (!state)
        return { state, requirements: [] }; visualBodyHydrator?.prime(state); return { state, requirements: projectDocumentationVisualBodyRequirements(state, set) }; };
    const stateWithVisualBodies = () => { const state = options.state(); if (!state)
        return state; visualBodyHydrator?.prime(state); return visualBodyHydrator?.apply(state) ?? state; };
    const compile = () => { const state = stateWithVisualBodies(), { set, theme } = active(); if (!state || !set || !theme)
        return undefined; try {
        return compileProjectDocumentation({ state, set, theme, revision: options.revision(), generatedAt: new Date().toISOString() });
    }
    catch (error) {
        if (error instanceof ProjectDocumentationVisualUnavailableError)
            return undefined;
        throw error;
    } };
    const settleVisualBodies = async (retryFailed) => { const { state, requirements } = visualContext(); if (!state || !visualBodyHydrator)
        return; const failures = await visualBodyHydrator.settle(state.project.id, requirements, { retryFailed }); if (failures.length)
        throw new Error(`A saved Page visual could not be loaded: ${failures[0].message} Retry loading visuals, then refresh preview.`); };
    const stale = () => { if (!snapshot)
        return { stale: false, changedSources: [] }; const current = compile(), sources = projectDocumentationSnapshotStale(snapshot, current?.sourceRevisions ?? {}), templatesChanged = Boolean(current && current.snapshotHash !== snapshot.snapshotHash && !sources.stale); return { stale: sources.stale || templatesChanged, changedSources: [...sources.changedSources, ...(templatesChanged ? ["Templates"] : [])] }; };
    const selection = () => { const { set } = active(); return documentationExportSelection({ scope: exportScope, currentSectionId: selectedSectionId, selectedSectionIds: [...selectedExportIds], fallbackSectionId: set?.sections[0]?.id }); };
    const renderSectionConfiguration = createDocumentationSectionConfigurationRenderer(mutateSection);
    function render(host) {
        const currentVisuals = visualContext(), visualStatus = currentVisuals.state && visualBodyHydrator ? visualBodyHydrator.status(currentVisuals.state.project.id, currentVisuals.requirements) : "ready";
        if (visualStatus === "idle" && !visualHydration) {
            visualHydration = settleVisualBodies(false).catch(() => undefined).finally(() => { visualHydration = undefined; render(host); });
        }
        const state = options.state(), { records, set, theme } = active();
        host.replaceChildren();
        const root = document.createElement("section");
        root.setAttribute("aria-label", "Project Documentation workspace");
        root.append(Object.assign(document.createElement("h1"), { textContent: "Documentation" }));
        if (!state) {
            root.append("Open a project to create documentation.");
            host.append(root);
            return;
        }
        const createSet = (setName, themeName) => { const created = appendProjectDocumentationSet(records, { setId: `documentation-set:${crypto.randomUUID()}`, themeId: `documentation-theme:${crypto.randomUUID()}`, setName, themeName }); selectedSetId = created.set.id; selectedSectionId = created.set.sections[0].id; previewSectionId = selectedSectionId; snapshot = undefined; setCreationOpen = false; persist(created.records, "Create Documentation Set"); };
        if (!set || !theme) {
            const name = controlInput("setName", ""), themeName = controlInput("newThemeName", ""), create = button("Create Documentation Set", () => createSet(name.value, themeName.value));
            name.setAttribute("aria-label", "Documentation Set name");
            themeName.setAttribute("aria-label", "Theme name");
            root.append(labelled("Set name", name), labelled("Theme name", themeName), create);
            host.append(root);
            return;
        }
        selectedSetId = set.id;
        const selectedSections = set.sections.filter(({ selected }) => selected);
        if (!selectedSectionId || !selectedSections.some(({ id }) => id === selectedSectionId))
            selectedSectionId = selectedSections[0]?.id ?? "";
        if (!previewSectionId)
            previewSectionId = selectedSectionId;
        const available = sources(state), contextHeader = document.createElement("header"), tabList = document.createElement("div"), buildPanel = document.createElement("section"), setRegion = document.createElement("section"), content = document.createElement("section"), configure = document.createElement("section"), themeRegion = document.createElement("aside"), templateRegion = document.createElement("aside"), preview = document.createElement("section"), exportRegion = document.createElement("section");
        contextHeader.className = "documentation-context-header";
        tabList.className = "documentation-primary-tabs";
        tabList.setAttribute("role", "tablist");
        tabList.setAttribute("aria-label", "Documentation workspace modes");
        buildPanel.className = "documentation-build-panel";
        setRegion.className = "documentation-outline";
        configure.className = "documentation-configuration";
        content.className = "documentation-add-content";
        themeRegion.className = "documentation-theme-panel";
        templateRegion.className = "documentation-template-panel";
        preview.className = "documentation-preview-panel";
        exportRegion.className = "documentation-export-panel";
        preview.append(heading(2, "Preview"));
        exportRegion.append(heading(2, "Export"));
        const creationUi = renderDocumentationSetCreationUi({ sets: records.sets, selectedSetId: set.id, open: setCreationOpen, select: (id) => { selectedSetId = id; snapshot = undefined; previewSectionId = ""; setCreationOpen = false; render(host); }, show: () => { setCreationOpen = true; render(host); }, cancel: () => { setCreationOpen = false; render(host); queueMicrotask(() => host.querySelector('[data-new-documentation-set="true"]')?.focus()); }, create: createSet });
        const outline = document.createElement("ol");
        outline.setAttribute("aria-label", "Documentation section outline");
        for (const section of selectedSections) {
            const item = document.createElement("li"), select = button(`${section.name} · ${section.kind}`, () => { selectedSectionId = section.id; previewSectionId = section.id; mobileBuildSurface = "configuration"; render(host); }), reorder = renderReorderControl({ itemId: section.id, itemLabel: section.name, completeOrder: selectedSections.map(({ id, name }) => ({ id, label: name })), dropTarget: item, orderedContainer: outline, focusScope: host, focusScopeId: `documentation-outline:${set.id}`, onMove: ({ itemId, toIndex }) => { const moved = reorderValues(selectedSections, itemId, toIndex, value => value.id); let selectedIndex = 0; const sections = set.sections.map(value => value.selected ? moved[selectedIndex++] : value); saveSet(createProjectDocumentationSet({ ...set, sections }), `Reorder ${section.name}`); return true; } });
            select.setAttribute("aria-current", String(section.id === selectedSectionId));
            item.dataset.sectionKind = section.kind;
            item.append(reorder, select);
            outline.append(item);
        }
        const editTheme = button(`Edit theme · ${theme.name}`, () => { themeOpen = !themeOpen; render(host); });
        editTheme.setAttribute("aria-expanded", String(themeOpen));
        editTheme.setAttribute("aria-controls", "documentation-theme-panel");
        const editTemplates = button("Templates", () => { templatesOpen = !templatesOpen; render(host); });
        editTemplates.setAttribute("aria-expanded", String(templatesOpen));
        editTemplates.setAttribute("aria-controls", "documentation-template-panel");
        const freshness = document.createElement("output"), snapshotState = !snapshot ? "Preview not built" : stale().stale ? "Preview out of date" : "Preview current";
        freshness.textContent = snapshotState;
        freshness.setAttribute("aria-label", "Preview freshness");
        contextHeader.append(creationUi.context, editTheme, editTemplates, freshness);
        const addContent = button("Add content", () => { addContentOpen = !addContentOpen; render(host); }), documentSettings = button("Document settings", () => { documentSettingsOpen = !documentSettingsOpen; render(host); });
        addContent.setAttribute("aria-expanded", String(addContentOpen));
        documentSettings.setAttribute("aria-expanded", String(documentSettingsOpen));
        setRegion.append(heading(2, "Document outline"), outline, addContent, documentSettings);
        if (visualStatus !== "ready") {
            const status = document.createElement("section"), message = document.createElement("p");
            status.dataset.documentationVisualStatus = visualStatus;
            status.setAttribute("aria-live", "polite");
            message.textContent = visualStatus === "failed" ? "A saved Page visual is unavailable. Retry loading it before refreshing preview or exporting." : "Loading saved Page visuals before preview and export.";
            status.append(message);
            if (visualStatus === "failed")
                status.append(button("Retry loading visuals", () => { feedback = "Retrying saved Page visuals."; visualHydration = settleVisualBodies(true).catch(error => { feedback = error instanceof Error ? error.message : String(error); }).finally(() => { visualHydration = undefined; render(host); }); render(host); }));
            contextHeader.append(status);
        }
        const templateProblem = documentationTemplateProblems(records)[0];
        if (templateProblem) {
            const issue = document.createElement("section"), summary = document.createElement("p"), technical = document.createElement("details"), go = button("Go to problem", () => { templatesOpen = true; selectedTemplateId = templateProblem.templateId; templateMobileDetail = true; render(host); queueMicrotask(() => host.querySelector('[data-template-repair-primary="true"]')?.focus()); });
            issue.role = "alert";
            issue.setAttribute("aria-label", "Documentation template problem");
            summary.textContent = `${templateProblem.name} · ${templateProblem.format} · ${templateProblem.kind} · ${templateProblem.assignments.length} affected Documentation Set${templateProblem.assignments.length === 1 ? "" : "s"}.`;
            technical.append(Object.assign(document.createElement("summary"), { textContent: "Technical details" }), Object.assign(document.createElement("pre"), { textContent: JSON.stringify({ templateId: templateProblem.templateId, invariant: templateProblem.invariant }, null, 2) }));
            issue.append(summary, go, technical);
            contextHeader.append(issue);
        }
        renderDocumentationContent(content, set, available, saveSet, host);
        const selectedSection = set.sections.find(({ id }) => id === selectedSectionId);
        renderSectionConfiguration(configure, set, selectedSection, available);
        themeRegion.id = "documentation-theme-panel";
        if (themeOpen) {
            const currentTable = compile()?.tables.find(({ id }) => id === selectedSectionId);
            renderDocumentationTheme({ host: themeRegion, set, theme, sampleTable: currentTable, ports, documentation, persist, saveTheme });
        }
        templateRegion.id = "documentation-template-panel";
        templateRegion.hidden = !templatesOpen;
        if (templatesOpen)
            renderDocumentationTemplateLibrary(templateRegion, { records, set, projectId: state.project.id, mobileDetail: templateMobileDetail, selectedTemplateId, selectedRichBlockId, richEditorMobileDetail, persist, ...(options.storeTemplateBody ? { storeBody: options.storeTemplateBody } : {}), ...(options.discardTemplateBody ? { discardBody: options.discardTemplateBody } : {}), ...(options.loadTemplateBody ? { loadBody: options.loadTemplateBody } : {}), download: ports.download, sampleExcel: async (template) => { await settleVisualBodies(true); const current = compile(); if (!current || !options.loadTemplateBody || !template.body)
                    throw new Error("The current immutable documentation snapshot or template body is unavailable."); const section = current.set.sections.find(item => item.selected && item.kind === template.kind); if (!section)
                    throw new Error(`Select a ${template.kind} section before generating a sample.`); const assignedSet = { ...current, set: { ...current.set, templateAssignments: { ...(current.set.templateAssignments ?? {}), [`excel:${template.kind}`]: template.id } }, templates: records.templates ?? [] }; return writeProjectDocumentationWorkbookWithTemplates(assignedSet, { scope: "current", currentSectionId: section.id, confirmIncomplete: true }, async (bodyDigest) => { const body = await options.loadTemplateBody(state.project.id, bodyDigest); if (!body)
                    throw new Error("The selected Excel template body is unavailable."); return body; }); }, previewCandidateExcel: async (file, kind) => { await settleVisualBodies(true); const current = compile(); if (!current)
                    throw new Error("Refresh the current immutable documentation snapshot before previewing this candidate."); const section = current.set.sections.find(item => item.selected && item.kind === kind); if (!section)
                    throw new Error(`Select a ${kind} section before generating populated output.`); const digest = `sha256:${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())), byte => byte.toString(16).padStart(2, "0")).join("")}`, candidate = { id: "unsaved-excel-candidate", name: "Unsaved candidate", format: "excel", kind, contractVersion: 2, digest, body: { assetId: "unsaved-excel-candidate-body", digest, byteLength: file.size }, validation: { valid: true, findings: [] } }, assigned = { ...current, set: { ...current.set, templateAssignments: { ...(current.set.templateAssignments ?? {}), [`excel:${kind}`]: candidate.id } }, templates: [...(current.templates ?? []), candidate] }; return writeProjectDocumentationWorkbookWithTemplates(assigned, { scope: "current", currentSectionId: section.id, confirmIncomplete: true }, async () => file); }, rerender: () => render(host), setMobileDetail: value => { templateMobileDetail = value; }, selectTemplate: id => { selectedTemplateId = id; selectedRichBlockId = ""; richEditorMobileDetail = false; }, selectRichBlock: id => { selectedRichBlockId = id; }, setRichEditorMobileDetail: value => { richEditorMobileDetail = value; } });
        const refresh = button("Refresh preview", () => { feedback = "Loading saved Page visuals."; visualHydration = settleVisualBodies(true).then(() => { snapshot = compile(); if (!snapshot)
            throw new Error("A saved Page visual is unavailable. Retry loading visuals before refreshing preview."); feedback = `Preview refreshed · immutable snapshot ${snapshot.snapshotHash}`; }).catch(error => { feedback = error instanceof Error ? error.message : String(error); }).finally(() => { visualHydration = undefined; render(host); }); render(host); }), previewNavigator = document.createElement("select"), previewStatus = document.createElement("output"), previewToolbar = document.createElement("div"), previewSurface = document.createElement("div");
        previewNavigator.setAttribute("aria-label", "Documentation preview section");
        for (const section of selectedSections)
            previewNavigator.append(new Option(section.name, section.id));
        previewNavigator.append(new Option("Entire document", "entire"));
        previewNavigator.value = previewSectionId;
        previewNavigator.addEventListener("change", () => { previewSectionId = previewNavigator.value; render(host); });
        previewStatus.setAttribute("aria-label", "Preview status");
        previewStatus.textContent = !snapshot ? "Preview not built" : stale().stale ? "Preview out of date" : "Preview current";
        previewToolbar.className = "documentation-preview-toolbar";
        previewToolbar.append(labelled("Show", previewNavigator), refresh, previewStatus);
        previewSurface.className = "documentation-preview-surface";
        preview.append(previewToolbar, previewSurface);
        if (snapshot) {
            const live = stale();
            if (live.stale)
                previewToolbar.append(Object.assign(document.createElement("p"), { textContent: `Changed sources: ${live.changedSources.join(", ")}.`, role: "alert" }));
            for (const table of selectProjectDocumentationTables(snapshot, documentationPreviewSelection(previewSectionId))) {
                const section = snapshot.set.sections.find(item => item.id === table.id), sectionHost = document.createElement("section"), assigned = documentationTemplateAssignment(snapshot.set, "rich", section.kind);
                sectionHost.dataset.previewSection = table.id;
                sectionHost.dataset.themeFingerprint = themeFingerprint(theme);
                if (assigned !== "builtin") {
                    try {
                        const rendered = renderProjectDocumentationRichWithTemplates(snapshot, { scope: "current", currentSectionId: table.id, confirmIncomplete: true }), content = document.createElement("div");
                        content.innerHTML = rendered.html;
                        sectionHost.append(...Array.from(content.childNodes));
                    }
                    catch (error) {
                        sectionHost.append(Object.assign(document.createElement("p"), { role: "alert", textContent: error instanceof Error ? error.message : String(error) }));
                    }
                }
                else {
                    const sectionTitle = heading(3, table.title), identity = [theme.clientName, theme.headerText].filter(Boolean).join(" · ");
                    sectionTitle.style.fontFamily = theme.typography.family;
                    sectionTitle.style.fontSize = `${theme.typography.headingSize}pt`;
                    sectionTitle.style.fontWeight = "700";
                    sectionTitle.style.color = theme.colors.heading;
                    if (theme.logo)
                        sectionHost.append(logoArea(theme));
                    sectionHost.append(sectionTitle);
                    if (identity)
                        sectionHost.append(Object.assign(document.createElement("p"), { textContent: identity }));
                    sectionHost.append(renderTable(table, theme));
                    if (table.legend)
                        sectionHost.append(Object.assign(document.createElement("p"), { textContent: table.legend }));
                    if (theme.footerText)
                        sectionHost.append(Object.assign(document.createElement("footer"), { textContent: theme.footerText }));
                }
                previewSurface.append(sectionHost);
            }
        }
        renderDocumentationExport({ host: exportRegion, setName: set.name, sections: selectedSections, currentSectionId: selectedSectionId, selectedSectionIds: selectedExportIds, snapshot, stale: stale().stale, scope: exportScope, pendingAction: pendingExportAction, confirmedIncomplete, feedback, ports, selection, openRepair: options.openRepair, setScope: (value) => { exportScope = value; }, setSectionSelected: (id, selected) => { selected ? selectedExportIds.add(id) : selectedExportIds.delete(id); }, setPendingAction: (value) => { pendingExportAction = value; }, setConfirmedIncomplete: (value) => { confirmedIncomplete = value; }, setFeedback: (value) => { feedback = value; }, rerender: () => render(host) });
        const conceptRegion = renderDocumentationConceptConfiguration(set, state, saveSet);
        conceptRegion.querySelectorAll('ol input[type="checkbox"]').forEach((input) => declareStudioChoice(input, "documentation.concept-membership"));
        const conceptHeadingHint = document.createElement("small");
        conceptHeadingHint.id = `documentation-concept-heading-hint-${set.id.replace(/[^a-z0-9_-]/giu, "-")}`;
        conceptHeadingHint.textContent = "Shown between included concept groups after Refresh preview.";
        conceptRegion.querySelectorAll(':scope > label input[type="checkbox"]').forEach((input) => { declareStudioChoice(input, "documentation.concept-subheadings"); input.setAttribute("aria-describedby", conceptHeadingHint.id); });
        conceptRegion.append(conceptHeadingHint);
        exportRegion.querySelector("ul")?.setAttribute("aria-label", "Documentation export preflight");
        content.querySelectorAll('input[type="checkbox"]').forEach((input) => declareStudioChoice(input, "documentation.section-membership"));
        themeRegion.querySelectorAll('input[type="checkbox"]').forEach((input) => declareStudioChoice(input, "documentation.theme-option"));
        buildPanel.id = "documentation-panel-build";
        preview.id = "documentation-panel-preview";
        exportRegion.id = "documentation-panel-export";
        for (const panel of [buildPanel, preview, exportRegion])
            panel.setAttribute("role", "tabpanel");
        buildPanel.hidden = primaryTab !== "build";
        themeRegion.hidden = !themeOpen;
        preview.hidden = primaryTab !== "preview";
        exportRegion.hidden = primaryTab !== "export";
        for (const tab of ["build", "preview", "export"]) {
            const control = button(tab[0].toUpperCase() + tab.slice(1), () => { primaryTab = tab; render(host); });
            control.id = `documentation-tab-${tab}`;
            control.dataset.documentationTab = tab;
            control.setAttribute("role", "tab");
            control.setAttribute("aria-controls", `documentation-panel-${tab}`);
            control.setAttribute("aria-selected", String(primaryTab === tab));
            control.tabIndex = primaryTab === tab ? 0 : -1;
            control.addEventListener("keydown", (event) => { const next = documentationTabAfterKey(tab, event.key); if (next === tab)
                return; event.preventDefault(); primaryTab = next; render(host); queueMicrotask(() => host.querySelector(`[data-documentation-tab="${next}"]`)?.focus()); });
            tabList.append(control);
        }
        const mobileOutline = button("Show document outline", () => { mobileBuildSurface = "outline"; render(host); }), mobileConfiguration = button("Show selected configuration", () => { mobileBuildSurface = "configuration"; render(host); }), mobileControls = document.createElement("div");
        mobileControls.className = "documentation-mobile-build-switcher";
        mobileOutline.setAttribute("aria-pressed", String(mobileBuildSurface === "outline"));
        mobileConfiguration.setAttribute("aria-pressed", String(mobileBuildSurface === "configuration"));
        mobileControls.append(mobileOutline, mobileConfiguration);
        setRegion.dataset.mobileSurface = mobileBuildSurface === "outline" ? "active" : "inactive";
        configure.dataset.mobileSurface = mobileBuildSurface === "configuration" ? "active" : "inactive";
        const buildGrid = document.createElement("div");
        buildGrid.className = "documentation-build-grid";
        buildGrid.append(setRegion, configure);
        buildPanel.append(heading(2, "Build"), mobileControls, buildGrid);
        if (addContentOpen)
            buildPanel.append(content);
        if (documentSettingsOpen)
            buildPanel.append(conceptRegion);
        root.append(contextHeader, ...(creationUi.setup ? [creationUi.setup] : []), tabList, templateRegion, buildPanel, preview, exportRegion, themeRegion);
        host.append(root);
    }
    return { render };
}
//# sourceMappingURL=data-layer-project-documentation-workspace-ui.js.map