import { flowDocumentationPropertyPaths } from "./data-layer-flow-table-documentation-export.js";
import { compileProjectDocumentation, projectDocumentationProfileColumns, projectDocumentationProfilePaths, projectDocumentationSources, reconcileProjectDocumentationConcepts } from "./data-layer-project-documentation-compiler.js";
import { projectCanonicalConcepts } from "./data-layer-layered-schema-project.js";
import { createProjectDocumentationSet, createProjectDocumentationTheme, parseProjectDocumentationTheme, serializeProjectDocumentationTheme, } from "./data-layer-project-documentation-records.js";
import { projectDocumentationSnapshotStale, renderProjectDocumentationClipboard, selectProjectDocumentationTables, themeFingerprint, writeProjectDocumentationWorkbook, } from "./data-layer-project-documentation-workspace.js";
import { conceptSectionHeading } from "./data-layer-flow-table-documentation-export.js";
import { declareStudioChoice } from "./data-layer-studio-choice-controls.js";
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
const button = (text, action) => { const value = document.createElement("button"); value.type = "button"; value.textContent = text; value.addEventListener("click", action); return value; };
const labelled = (text, control) => { const value = document.createElement("label"); value.append(control, ` ${text}`); return value; };
const heading = (level, text) => Object.assign(document.createElement(`h${level}`), { textContent: text });
const defaultTheme = (id, name = "Project theme") => createProjectDocumentationTheme({ id, name, clientName: "", logo: "", colors: { heading: "#222222", accent: "#336699", stripe: "#f4f4f4" }, typography: { family: "Arial", headingSize: 16, bodySize: 11 }, density: "comfortable", borders: true, striping: true, highlightedHeadings: true, columnWidths: { Property: 28, Description: 48 }, headerText: "", footerText: "" });
const move = (items, item, direction) => { const index = items.indexOf(item), target = index + direction; if (index < 0 || target < 0 || target >= items.length)
    return [...items]; const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next; };
const moveVisible = (items, item, direction, visible) => { const projected = items.filter(visible), index = projected.indexOf(item), target = index + direction; if (index < 0 || target < 0 || target >= projected.length)
    return [...items]; const targetItem = projected[target], sourceIndex = items.indexOf(item), targetIndex = items.indexOf(targetItem), next = [...items]; [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]]; return next; };
const checkedOrder = (all, configured) => configured ? [...configured] : [...all];
const setChecked = (current, id, checked) => checked ? [...current.filter((candidate) => candidate !== id), id] : current.filter((candidate) => candidate !== id);
const controlInput = (name, value, type = "text") => { const input = document.createElement("input"); input.name = name; input.type = type; input.value = value; return input; };
export const PROJECT_DOCUMENTATION_LOGO_DATA_URL_LIMIT = 250_000;
export async function readProjectDocumentationLogoFile(file, readDataUrl) {
    if (!["image/png", "image/jpeg", "image/gif"].includes(file.type))
        throw new Error("Choose a PNG, JPEG, or GIF image");
    let dataUrl;
    try {
        dataUrl = await readDataUrl(file);
    }
    catch {
        throw new Error("The logo could not be read");
    }
    if (!dataUrl.startsWith(`data:${file.type};base64,`))
        throw new Error("The logo could not be read");
    if (dataUrl.length > PROJECT_DOCUMENTATION_LOGO_DATA_URL_LIMIT)
        throw new Error("The logo is too large");
    return { fileName: file.name, dataUrl };
}
const fileDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unreadable logo")));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Unreadable logo")));
    reader.addEventListener("abort", () => reject(new Error("Unreadable logo")));
    reader.readAsDataURL(file);
});
function applyThemeToTable(table, theme) {
    table.dataset.themeFingerprint = themeFingerprint(theme);
    table.dataset.density = theme.density;
    table.style.borderCollapse = "collapse";
    table.style.fontFamily = theme.typography.family;
    table.style.fontSize = `${theme.typography.bodySize}pt`;
    table.style.color = theme.colors.accent;
    const cells = Array.from(table.querySelectorAll("th,td")), padding = theme.density === "compact" ? "2px 4px" : "5px 7px";
    for (const cell of cells) {
        cell.style.padding = padding;
        cell.style.whiteSpace = "pre-wrap";
        cell.style.overflowWrap = "anywhere";
        if (theme.borders)
            cell.style.border = "1px solid #666";
    }
    for (const cell of Array.from(table.querySelectorAll("th"))) {
        cell.style.fontSize = `${theme.typography.headingSize}pt`;
        if (theme.highlightedHeadings) {
            cell.style.backgroundColor = theme.colors.heading;
            cell.style.color = "#fff";
        }
    }
    for (const cell of Array.from(table.querySelectorAll('th[scope="rowgroup"]'))) {
        cell.style.backgroundColor = theme.colors.stripe;
        cell.style.color = theme.colors.accent;
        cell.style.fontSize = `${Math.min(theme.typography.bodySize, theme.typography.headingSize - 2)}pt`;
        cell.style.fontWeight = "600";
        cell.style.textAlign = "start";
    }
    if (theme.striping)
        for (const [index, row] of Array.from(table.querySelectorAll("tbody tr")).entries())
            if (index % 2 === 1)
                row.style.backgroundColor = theme.colors.stripe;
    for (const [index, name] of Array.from(table.querySelectorAll("th")).map(({ textContent }) => textContent ?? "").entries()) {
        const width = theme.columnWidths[name];
        if (width) {
            const column = document.createElement("col");
            column.style.width = `${width}ch`;
            let group = table.querySelector("colgroup");
            if (!group) {
                group = document.createElement("colgroup");
                table.prepend(group);
            }
            while (group.children.length < index)
                group.append(document.createElement("col"));
            group.append(column);
        }
    }
}
function renderTable(value, theme) {
    const table = document.createElement("table"), head = document.createElement("thead"), headRow = document.createElement("tr"), body = document.createElement("tbody"), groups = new Map(value.conceptGroups?.map((group) => [group.start, group]) ?? []), columns = () => value.headings.map((text) => { const cell = document.createElement("th"); cell.scope = "col"; cell.textContent = text; return cell; });
    headRow.append(...columns());
    head.append(headRow);
    for (const [index, sourceRow] of value.rows.entries()) {
        const group = groups.get(index);
        if (group) {
            const headingRow = document.createElement("tr"), cell = document.createElement("th");
            headingRow.dataset.conceptHeading = group.name;
            cell.colSpan = value.headings.length;
            cell.scope = "rowgroup";
            cell.textContent = conceptSectionHeading(group.name);
            headingRow.append(cell);
            body.append(headingRow);
        }
        const row = document.createElement("tr");
        row.append(...sourceRow.map((cell) => Object.assign(document.createElement("td"), { textContent: cell })));
        body.append(row);
    }
    table.append(head, body);
    applyThemeToTable(table, theme);
    return table;
}
export function installProjectDocumentationWorkspaceUi(options) {
    const ports = options.ports ?? defaultPorts();
    let selectedSetId = "", selectedSectionId = "", selectedExportIds = new Set(), snapshot, feedback = "", confirmedIncomplete = false, exportScope = "current";
    const documentation = () => options.state()?.project.documentation ?? { sets: [], themes: [] };
    const active = () => { const records = documentation(), set = records.sets.find(({ id }) => id === selectedSetId) ?? records.sets[0], theme = set ? records.themes.find(({ id }) => id === set.themeId) : undefined; return { records, set, theme }; };
    const persist = (records, label) => options.save(records, label);
    const saveSet = (next, label) => { const records = documentation(); persist({ ...records, sets: records.sets.some(({ id }) => id === next.id) ? records.sets.map((item) => item.id === next.id ? next : item) : [...records.sets, next] }, label); };
    const saveTheme = (next, label) => { const records = documentation(); persist({ ...records, themes: records.themes.some(({ id }) => id === next.id) ? records.themes.map((item) => item.id === next.id ? next : item) : [...records.themes, next] }, label); };
    const mutateSection = (set, sectionId, update, label) => saveSet(createProjectDocumentationSet({ ...set, sections: set.sections.map((section) => section.id === sectionId ? update(section) : section) }), label);
    const sources = (state) => projectDocumentationSources(state, new Date().toISOString(), options.revision());
    const compile = () => { const state = options.state(), { set, theme } = active(); return state && set && theme ? compileProjectDocumentation({ state, set, theme, revision: options.revision(), generatedAt: new Date().toISOString() }) : undefined; };
    const stale = () => snapshot ? projectDocumentationSnapshotStale(snapshot, compile()?.sourceRevisions ?? {}) : { stale: false, changedSources: [] };
    const selection = () => { const { set } = active(), fallback = set?.sections[0]?.id ?? ""; return exportScope === "current" ? { scope: "current", currentSectionId: selectedSectionId || fallback } : exportScope === "selected" ? { scope: "selected", selectedSectionIds: [...selectedExportIds] } : { scope: "complete" }; };
    function renderOrderedChoices(host, input) {
        const selected = new Set(input.selected), list = document.createElement("ol");
        list.setAttribute("aria-label", `${input.name} order`);
        for (const item of input.all) {
            const row = document.createElement("li"), check = document.createElement("input");
            check.type = "checkbox";
            declareStudioChoice(check, input.choiceKey);
            check.checked = selected.has(item.id);
            check.addEventListener("change", () => input.onChange(setChecked(input.selected, item.id, check.checked)));
            row.append(labelled(item.label, check));
            if (check.checked) {
                const earlier = button("Move earlier", () => input.onChange(move(input.selected, item.id, -1))), later = button("Move later", () => input.onChange(move(input.selected, item.id, 1)));
                earlier.disabled = input.selected.indexOf(item.id) === 0;
                later.disabled = input.selected.indexOf(item.id) === input.selected.length - 1;
                row.append(earlier, later);
            }
            list.append(row);
        }
        host.append(list);
    }
    function renderFlowConfiguration(host, set, section, available) {
        const source = available.flows.find(({ entity }) => entity.id === section.targetId);
        host.dataset.configurationKind = "flow";
        host.append(heading(3, `Configure Flow value map · ${section.name}`));
        if (!source) {
            host.append("Flow unavailable.");
            return;
        }
        const contexts = source.snapshot.contexts.map(({ id, pageName, eventName }) => ({ id, label: `${pageName} / ${eventName}` })), contextIds = checkedOrder(contexts.map(({ id }) => id), section.configuration?.contextIds), paths = checkedOrder(flowDocumentationPropertyPaths(source.snapshot), section.configuration?.paths), metadata = (section.configuration?.columns ?? []);
        const contextGroup = document.createElement("fieldset");
        contextGroup.append(Object.assign(document.createElement("legend"), { textContent: "Value-map contexts and ordering" }));
        renderOrderedChoices(contextGroup, { all: contexts, selected: contextIds, name: "Flow contexts", choiceKey: "documentation.flow-context", onChange: (next) => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, contextIds: next } }), "Configure Flow contexts") });
        const labels = document.createElement("div");
        labels.setAttribute("aria-label", "Flow documentation labels");
        for (const context of contexts.filter(({ id }) => contextIds.includes(id))) {
            const input = controlInput(`label:${context.id}`, section.configuration?.labels?.[context.id] ?? "");
            input.setAttribute("aria-label", `Documentation label for ${context.label}`);
            input.addEventListener("change", () => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, labels: { ...value.configuration?.labels, [context.id]: input.value } } }), `Label ${context.label}`));
            labels.append(labelled(context.label, input));
        }
        contextGroup.append(labels);
        const pathGroup = document.createElement("fieldset");
        pathGroup.append(Object.assign(document.createElement("legend"), { textContent: "Property rows and ordering" }));
        renderOrderedChoices(pathGroup, { all: flowDocumentationPropertyPaths(source.snapshot).map((path) => ({ id: path, label: path })), selected: paths, name: "Flow property rows", choiceKey: "documentation.property-row", onChange: (next) => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, paths: next } }), "Configure Flow property rows") });
        const metadataGroup = document.createElement("fieldset");
        metadataGroup.append(Object.assign(document.createElement("legend"), { textContent: "Metadata columns" }));
        for (const [id, label] of [["description", "Description"], ["type", "Type"], ["allowedValues", "Allowed values"], ["example", "Example"], ["comments", "Comments"]]) {
            const check = document.createElement("input");
            check.type = "checkbox";
            declareStudioChoice(check, "documentation.metadata-column");
            check.checked = metadata.includes(id);
            check.addEventListener("change", () => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, columns: setChecked(metadata, id, check.checked) } }), `Configure Flow metadata ${label}`));
            metadataGroup.append(labelled(label, check));
        }
        host.append(contextGroup, pathGroup, metadataGroup);
    }
    function renderMatrixHierarchy(host, set, section, available) {
        host.dataset.configurationKind = "matrix";
        host.append(heading(3, "Configure project capture matrix"));
        const search = controlInput("matrixSearch", "", "search"), tree = document.createElement("div"), selected = section.configuration?.contextIds ?? [];
        search.setAttribute("aria-label", "Search capture-matrix hierarchy");
        const draw = () => { tree.replaceChildren(); const matches = available.matrixContexts.filter(({ searchText, label }) => `${searchText} ${label}`.toLowerCase().includes(search.value.trim().toLowerCase())), groups = new Map(); for (const context of matches) {
            const parents = groups.get(context.groupLabel) ?? new Map(), items = parents.get(context.parentLabel) ?? [];
            items.push(context);
            parents.set(context.parentLabel, items);
            groups.set(context.groupLabel, parents);
        } for (const [group, parents] of groups) {
            const groupSet = document.createElement("fieldset");
            groupSet.dataset.matrixGroup = group;
            groupSet.append(Object.assign(document.createElement("legend"), { textContent: group }));
            for (const [parent, contexts] of parents) {
                const sectionHost = document.createElement("section");
                sectionHost.dataset.matrixParent = parent;
                sectionHost.append(heading(4, parent));
                for (const context of contexts) {
                    const check = document.createElement("input");
                    check.type = "checkbox";
                    declareStudioChoice(check, "documentation.matrix-context");
                    check.checked = selected.includes(context.id);
                    check.dataset.matrixContextId = context.id;
                    check.dataset.matrixContextKind = context.kind;
                    check.addEventListener("change", () => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, contextIds: setChecked(selected, context.id, check.checked) } }), `Configure matrix ${context.label}`));
                    sectionHost.append(labelled(context.label, check));
                }
                groupSet.append(sectionHost);
            }
            tree.append(groupSet);
        } };
        search.addEventListener("input", draw);
        draw();
        host.append(search, tree);
        const order = document.createElement("fieldset");
        order.append(Object.assign(document.createElement("legend"), { textContent: "Selected matrix column order" }));
        renderOrderedChoices(order, { all: available.matrixContexts.filter(({ id }) => selected.includes(id)).map(({ id, label }) => ({ id, label })), selected, name: "Matrix columns", choiceKey: "documentation.matrix-context", onChange: (next) => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, contextIds: next } }), "Reorder matrix columns") });
        host.append(order);
    }
    function renderProfileConfiguration(host, set, section, available) {
        host.dataset.configurationKind = "profile";
        host.append(heading(3, `Configure Site Profile · ${section.name}`));
        const profile = available.profiles.find(({ id }) => id === section.targetId);
        if (!profile) {
            host.append("Site Profile unavailable.");
            return;
        }
        const allPaths = projectDocumentationProfilePaths(profile), paths = checkedOrder(allPaths, section.configuration?.paths), columns = checkedOrder(projectDocumentationProfileColumns(), section.configuration?.columns);
        const rows = document.createElement("fieldset");
        rows.append(Object.assign(document.createElement("legend"), { textContent: "Profile property rows and ordering" }));
        renderOrderedChoices(rows, { all: allPaths.map((path) => ({ id: path, label: path })), selected: paths, name: `${section.name} property rows`, choiceKey: "documentation.property-row", onChange: (next) => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, paths: next } }), `Configure ${section.name} rows`) });
        const columnHost = document.createElement("fieldset");
        columnHost.append(Object.assign(document.createElement("legend"), { textContent: "Profile columns and ordering" }));
        renderOrderedChoices(columnHost, { all: projectDocumentationProfileColumns().map((column) => ({ id: column, label: column })), selected: columns, name: `${section.name} columns`, choiceKey: "documentation.profile-column", onChange: (next) => mutateSection(set, section.id, (value) => ({ ...value, configuration: { ...value.configuration, columns: next } }), `Configure ${section.name} columns`) });
        host.append(rows, columnHost);
    }
    function renderTheme(host, set, theme) {
        host.append(heading(2, "Theme"));
        const name = controlInput("themeName", theme.name), copyOutput = document.createElement("output"), paste = document.createElement("textarea");
        name.setAttribute("aria-label", "Project-local theme name");
        paste.setAttribute("aria-label", "Structured theme values");
        const groups = {};
        for (const title of ["Brand", "Typography", "Table", "Header and footer"]) {
            const details = document.createElement("details");
            details.dataset.themeGroup = title;
            details.append(Object.assign(document.createElement("summary"), { textContent: title }));
            groups[title] = details;
            host.append(details);
        }
        const client = controlInput("clientName", theme.clientName), logoPicker = controlInput("logoFile", "", "file"), logoName = document.createElement("p"), logoDiagnostic = document.createElement("output"), removeLogo = button("Remove logo", () => { }), headingColor = controlInput("headingColor", theme.colors.heading, "color"), accent = controlInput("accentColor", theme.colors.accent, "color"), stripe = controlInput("stripeColor", theme.colors.stripe, "color");
        let logoValue = theme.logo, logoFileName = theme.logo ? "Saved logo" : "";
        client.setAttribute("aria-label", "Theme client name");
        logoPicker.accept = "image/png,image/jpeg,image/gif";
        logoPicker.setAttribute("aria-label", "Choose logo file");
        logoDiagnostic.id = `documentation-logo-diagnostic-${theme.id}`;
        logoDiagnostic.setAttribute("aria-live", "polite");
        logoPicker.setAttribute("aria-describedby", logoDiagnostic.id);
        logoName.dataset.logoFileName = "true";
        logoDiagnostic.dataset.logoDiagnostic = "true";
        groups.Brand.append(labelled("Client name", client), labelled("Choose logo file", logoPicker), logoName, logoDiagnostic, removeLogo, labelled("Heading color", headingColor), labelled("Accent color", accent), labelled("Stripe color", stripe));
        const family = controlInput("family", theme.typography.family), headingSize = controlInput("headingSize", String(theme.typography.headingSize), "number"), bodySize = controlInput("bodySize", String(theme.typography.bodySize), "number");
        family.setAttribute("aria-label", "Theme font family");
        groups.Typography.append(labelled("Font family", family), labelled("Heading size", headingSize), labelled("Body size", bodySize));
        const density = document.createElement("select");
        density.name = "density";
        density.append(new Option("Comfortable", "comfortable"), new Option("Compact", "compact"));
        density.value = theme.density;
        const borders = document.createElement("input"), striping = document.createElement("input"), highlighted = document.createElement("input"), widths = document.createElement("textarea"), tableChoices = document.createElement("fieldset");
        for (const check of [borders, striping, highlighted])
            check.type = "checkbox";
        borders.name = "borders";
        striping.name = "striping";
        highlighted.name = "highlightedHeadings";
        borders.checked = theme.borders;
        striping.checked = theme.striping;
        highlighted.checked = theme.highlightedHeadings;
        widths.value = Object.entries(theme.columnWidths).map(([column, width]) => `${column}=${width}`).join("\n");
        widths.setAttribute("aria-label", "Theme column widths");
        tableChoices.append(Object.assign(document.createElement("legend"), { textContent: "Table presentation choices" }), labelled("Density", density), labelled("Borders", borders), labelled("Striping", striping), labelled("Highlighted headings", highlighted), labelled("Column widths", widths));
        groups.Table.append(tableChoices);
        const header = controlInput("headerText", theme.headerText), footer = controlInput("footerText", theme.footerText);
        header.setAttribute("aria-label", "Theme header text");
        footer.setAttribute("aria-label", "Theme footer text");
        groups["Header and footer"].append(labelled("Header text", header), labelled("Footer text", footer));
        const read = () => createProjectDocumentationTheme({ id: theme.id, name: name.value, clientName: client.value, logo: logoValue, colors: { heading: headingColor.value, accent: accent.value, stripe: stripe.value }, typography: { family: family.value, headingSize: Number(headingSize.value), bodySize: Number(bodySize.value) }, density: density.value === "compact" ? "compact" : "comfortable", borders: borders.checked, striping: striping.checked, highlightedHeadings: highlighted.checked, columnWidths: Object.fromEntries(widths.value.split(/\r?\n/u).flatMap((line) => { const [column, raw] = line.split("="); return column && Number(raw) > 0 ? [[column.trim(), Number(raw)]] : []; })), headerText: header.value, footerText: footer.value });
        const sampleHost = document.createElement("section"), drawSample = (sampleTheme) => { sampleHost.replaceChildren(); sampleHost.dataset.themeSample = "true"; if (sampleTheme.logo) {
            const image = Object.assign(document.createElement("img"), { src: sampleTheme.logo, alt: `${sampleTheme.clientName || sampleTheme.name} logo` });
            image.style.maxWidth = "12rem";
            image.style.maxHeight = "5rem";
            image.style.width = "auto";
            image.style.height = "auto";
            image.style.objectFit = "contain";
            sampleHost.append(image);
        } sampleHost.append(Object.assign(document.createElement("p"), { textContent: [sampleTheme.clientName, sampleTheme.headerText].filter(Boolean).join(" · ") }), renderTable({ id: "theme-sample", title: "Theme sample", headings: ["Property", "Description"], rows: [["page_name", "Page name"], ["event_name", "Observed event"]] }, sampleTheme), Object.assign(document.createElement("p"), { textContent: sampleTheme.footerText })); };
        const drawLogoState = () => { logoName.textContent = logoFileName; removeLogo.hidden = !logoValue; drawSample(read()); };
        removeLogo.addEventListener("click", () => { logoValue = ""; logoFileName = ""; logoPicker.value = ""; logoDiagnostic.textContent = ""; drawLogoState(); });
        logoPicker.addEventListener("change", () => { const file = logoPicker.files?.[0]; if (!file)
            return; logoDiagnostic.textContent = ""; void readProjectDocumentationLogoFile(file, fileDataUrl).then((logo) => { logoValue = logo.dataUrl; logoFileName = logo.fileName; drawLogoState(); }, (error) => { logoPicker.value = ""; logoDiagnostic.textContent = error instanceof Error ? error.message : String(error); }); });
        drawLogoState();
        const save = button("Save theme", () => { try {
            saveTheme(read(), "Save project documentation theme");
        }
        catch (error) {
            copyOutput.textContent = error instanceof Error ? error.message : String(error);
        } }), preview = button("Preview theme changes", () => { try {
            drawSample(read());
        }
        catch (error) {
            copyOutput.textContent = error instanceof Error ? error.message : String(error);
        } }), copy = button("Copy structured theme values", () => { void ports.writePlain(serializeProjectDocumentationTheme(read())).then(() => copyOutput.textContent = "Structured theme values copied."); }), pasteButton = button("Paste as new project-local theme", () => { try {
            const next = parseProjectDocumentationTheme(paste.value, { id: `documentation-theme:${crypto.randomUUID()}`, name: `${theme.name} copy` }), records = documentation(), nextSet = createProjectDocumentationSet({ ...set, themeId: next.id });
            persist({ sets: records.sets.map((candidate) => candidate.id === set.id ? nextSet : candidate), themes: [...records.themes, next] }, "Paste project-local documentation theme");
        }
        catch (error) {
            copyOutput.textContent = error instanceof Error ? error.message : String(error);
        } });
        host.prepend(name);
        host.append(save, preview, copy, paste, pasteButton, copyOutput, sampleHost);
    }
    function renderConceptConfiguration(set, state) {
        const region = document.createElement("section"), list = document.createElement("ol"), concepts = reconcileProjectDocumentationConcepts(set, projectCanonicalConcepts(state)), headings = document.createElement("input");
        region.setAttribute("aria-label", "Documentation concept configuration");
        region.append(heading(2, "Concept grouping"));
        list.setAttribute("aria-label", "Ordered documentation concepts");
        for (const [index, concept] of concepts.entries()) {
            const item = document.createElement("li"), include = document.createElement("input"), earlier = button("Move concept earlier", () => { if (index < 1)
                return; const next = [...concepts], [value] = next.splice(index, 1); next.splice(index - 1, 0, value); saveSet(createProjectDocumentationSet({ ...set, concepts: next }), `Move concept ${concept.name} earlier`); }), later = button("Move concept later", () => { if (index >= concepts.length - 1)
                return; const next = [...concepts], [value] = next.splice(index, 1); next.splice(index + 1, 0, value); saveSet(createProjectDocumentationSet({ ...set, concepts: next }), `Move concept ${concept.name} later`); });
            include.type = "checkbox";
            include.checked = concept.included;
            include.addEventListener("change", () => saveSet(createProjectDocumentationSet({ ...set, concepts: concepts.map((candidate) => candidate.name === concept.name ? { ...candidate, included: include.checked } : candidate) }), `${include.checked ? "Include" : "Exclude"} concept ${concept.name}`));
            earlier.disabled = index === 0;
            later.disabled = index === concepts.length - 1;
            item.dataset.documentationConcept = concept.name;
            item.append(labelled(concept.name, include), earlier, later);
            list.append(item);
        }
        headings.type = "checkbox";
        headings.checked = set.includeConceptSubheadings === true;
        headings.addEventListener("change", () => saveSet(createProjectDocumentationSet({ ...set, concepts, includeConceptSubheadings: headings.checked }), `${headings.checked ? "Include" : "Hide"} concept subheadings`));
        region.append(list, labelled("Include concept subheadings", headings));
        return region;
    }
    function render(host) {
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
        if (!set || !theme) {
            const name = controlInput("setName", ""), themeName = controlInput("newThemeName", ""), create = button("Create Documentation Set", () => { const themeId = `documentation-theme:${crypto.randomUUID()}`, setId = `documentation-set:${crypto.randomUUID()}`, nextTheme = defaultTheme(themeId, themeName.value.trim() || "Project theme"), nextSet = createProjectDocumentationSet({ id: setId, name: name.value.trim() || "Client specification", themeId, sections: [{ id: `${setId}:overview`, kind: "overview", name: "Overview", selected: true }, { id: `${setId}:matrix`, kind: "matrix", name: "Data capture matrix", selected: true, configuration: { contextIds: [] } }] }); selectedSetId = setId; selectedSectionId = nextSet.sections[0].id; persist({ sets: [...records.sets, nextSet], themes: [...records.themes, nextTheme] }, "Create Documentation Set"); });
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
        const available = sources(state), setRegion = document.createElement("section"), content = document.createElement("section"), configure = document.createElement("section"), themeRegion = document.createElement("section"), preview = document.createElement("section"), exportRegion = document.createElement("section");
        for (const [region, title] of [[setRegion, "Set"], [content, "Content"], [configure, "Configure"], [preview, "Preview"], [exportRegion, "Export"]])
            region.append(heading(2, title));
        const setChoice = document.createElement("select");
        setChoice.setAttribute("aria-label", "Documentation Set");
        for (const candidate of records.sets)
            setChoice.append(new Option(candidate.name, candidate.id));
        setChoice.value = set.id;
        setChoice.addEventListener("change", () => { selectedSetId = setChoice.value; snapshot = undefined; render(host); });
        const outline = document.createElement("ol");
        outline.setAttribute("aria-label", "Documentation section outline");
        for (const section of selectedSections) {
            const item = document.createElement("li"), select = button(`${section.name} · ${section.kind}`, () => { selectedSectionId = section.id; render(host); }), earlier = button("Move earlier", () => saveSet(createProjectDocumentationSet({ ...set, sections: moveVisible(set.sections, section, -1, ({ selected }) => selected) }), `Reorder ${section.name}`)), later = button("Move later", () => saveSet(createProjectDocumentationSet({ ...set, sections: moveVisible(set.sections, section, 1, ({ selected }) => selected) }), `Reorder ${section.name}`));
            select.setAttribute("aria-current", String(section.id === selectedSectionId));
            earlier.disabled = selectedSections.indexOf(section) === 0;
            later.disabled = selectedSections.indexOf(section) === selectedSections.length - 1;
            item.dataset.sectionKind = section.kind;
            item.append(select, earlier, later);
            outline.append(item);
        }
        setRegion.append(setChoice, outline);
        const flowSearch = controlInput("flowSearch", "", "search"), profileSearch = controlInput("profileSearch", "", "search");
        flowSearch.setAttribute("aria-label", "Search Flows");
        profileSearch.setAttribute("aria-label", "Search Site Profiles");
        const projectChoices = document.createElement("fieldset"), flowChoices = document.createElement("fieldset"), profileChoices = document.createElement("fieldset"), overview = set.sections.find(({ kind }) => kind === "overview"), overviewCheck = document.createElement("input");
        projectChoices.append(Object.assign(document.createElement("legend"), { textContent: "Project sections" }));
        overviewCheck.type = "checkbox";
        overviewCheck.checked = Boolean(overview?.selected);
        overviewCheck.addEventListener("change", () => { const sections = overview ? set.sections.map((section) => section.id === overview.id ? { ...section, selected: overviewCheck.checked } : section) : [{ id: `${set.id}:overview`, kind: "overview", name: "Overview", selected: true }, ...set.sections]; saveSet(createProjectDocumentationSet({ ...set, sections }), `${overviewCheck.checked ? "Select" : "Remove"} Overview`); });
        projectChoices.append(labelled("Overview", overviewCheck));
        flowChoices.append(Object.assign(document.createElement("legend"), { textContent: "Flow value-map sections" }));
        profileChoices.append(Object.assign(document.createElement("legend"), { textContent: "Site Profile property-table sections" }));
        const drawContent = () => { flowChoices.querySelectorAll("label").forEach((value) => value.remove()); profileChoices.querySelectorAll("label").forEach((value) => value.remove()); for (const { entity } of available.flows.filter(({ entity }) => entity.name.toLowerCase().includes(flowSearch.value.toLowerCase()))) {
            const existing = set.sections.find((section) => section.kind === "flow" && section.targetId === entity.id), check = document.createElement("input");
            check.type = "checkbox";
            check.checked = Boolean(existing);
            check.addEventListener("change", () => { const sections = check.checked ? [...set.sections, { id: `section:flow:${entity.id}`, kind: "flow", name: entity.name, targetId: entity.id, selected: true }] : set.sections.filter(({ id }) => id !== existing?.id); saveSet(createProjectDocumentationSet({ ...set, sections }), `${check.checked ? "Select" : "Remove"} Flow ${entity.name}`); });
            flowChoices.append(labelled(entity.name, check));
        } for (const profile of available.profiles.filter(({ name }) => name.toLowerCase().includes(profileSearch.value.toLowerCase()))) {
            const existing = set.sections.find((section) => section.kind === "profile" && section.targetId === profile.id), check = document.createElement("input");
            check.type = "checkbox";
            check.checked = Boolean(existing);
            check.addEventListener("change", () => { const sections = check.checked ? [...set.sections, { id: `section:profile:${profile.id}`, kind: "profile", name: profile.name, targetId: profile.id, selected: true }] : set.sections.filter(({ id }) => id !== existing?.id); saveSet(createProjectDocumentationSet({ ...set, sections }), `${check.checked ? "Select" : "Remove"} Site Profile ${profile.name}`); });
            profileChoices.append(labelled(profile.name, check));
        } };
        flowSearch.addEventListener("input", drawContent);
        profileSearch.addEventListener("input", drawContent);
        drawContent();
        content.append(projectChoices, flowSearch, flowChoices, profileSearch, profileChoices);
        const selectedSection = set.sections.find(({ id }) => id === selectedSectionId);
        configure.setAttribute("aria-label", "Selected documentation section configuration");
        if (selectedSection?.kind === "flow")
            renderFlowConfiguration(configure, set, selectedSection, available);
        else if (selectedSection?.kind === "matrix")
            renderMatrixHierarchy(configure, set, selectedSection, available);
        else if (selectedSection?.kind === "profile")
            renderProfileConfiguration(configure, set, selectedSection, available);
        else
            configure.append(heading(3, "Configure Overview"), Object.assign(document.createElement("p"), { textContent: "Overview derives the project name, purpose, and website." }));
        renderTheme(themeRegion, set, theme);
        const refresh = button("Refresh preview", () => { snapshot = compile(); feedback = snapshot ? `Preview refreshed · immutable snapshot ${snapshot.snapshotHash}` : "Preview unavailable"; render(host); });
        preview.append(refresh);
        if (snapshot) {
            const live = stale();
            if (live.stale)
                preview.append(Object.assign(document.createElement("p"), { textContent: `Preview stale — changed sources: ${live.changedSources.join(", ")}.`, role: "alert" }));
            for (const table of selectProjectDocumentationTables(snapshot, { scope: "complete" })) {
                const sectionHost = document.createElement("section"), sectionTitle = heading(3, table.title), identity = [theme.clientName, theme.headerText].filter(Boolean).join(" · ");
                sectionHost.dataset.previewSection = table.id;
                sectionHost.dataset.themeFingerprint = themeFingerprint(theme);
                sectionTitle.style.fontFamily = theme.typography.family;
                sectionTitle.style.fontSize = `${theme.typography.headingSize}pt`;
                sectionTitle.style.fontWeight = "700";
                sectionTitle.style.color = theme.colors.heading;
                if (theme.logo)
                    sectionHost.append(Object.assign(document.createElement("img"), { src: theme.logo, alt: `${theme.clientName || theme.name} logo` }));
                sectionHost.append(sectionTitle);
                if (identity)
                    sectionHost.append(Object.assign(document.createElement("p"), { textContent: identity }));
                sectionHost.append(renderTable(table, theme));
                if (table.legend)
                    sectionHost.append(Object.assign(document.createElement("p"), { textContent: table.legend }));
                if (theme.footerText)
                    sectionHost.append(Object.assign(document.createElement("footer"), { textContent: theme.footerText }));
                preview.append(sectionHost);
            }
            if (snapshot.diagnostics.length) {
                const diagnostics = document.createElement("ul");
                diagnostics.setAttribute("aria-label", "Documentation export preflight");
                for (const issue of snapshot.diagnostics) {
                    const item = document.createElement("li");
                    item.append(`${issue.message} · `);
                    if (issue.repairTarget) {
                        const link = document.createElement("a"), query = new URLSearchParams({ kind: issue.repairTarget.kind, entity: issue.repairTarget.id, ...(issue.repairTarget.path ? { field: issue.repairTarget.path } : {}) });
                        link.href = `?${query}`;
                        link.textContent = issue.repair;
                        link.addEventListener("click", (event) => { event.preventDefault(); options.openRepair?.(issue.repairTarget); });
                        item.append(link);
                    }
                    else
                        item.append(issue.repair);
                    diagnostics.append(item);
                }
                preview.append(diagnostics);
            }
        }
        const scope = document.createElement("select");
        scope.setAttribute("aria-label", "Documentation export scope");
        scope.append(new Option("Current section", "current"), new Option("Selected sections", "selected"), new Option("Complete Documentation Set", "complete"));
        scope.value = exportScope;
        scope.addEventListener("change", () => { exportScope = scope.value; });
        for (const section of selectedSections) {
            const check = document.createElement("input");
            check.type = "checkbox";
            check.checked = selectedExportIds.has(section.id);
            check.addEventListener("change", () => check.checked ? selectedExportIds.add(section.id) : selectedExportIds.delete(section.id));
            exportRegion.append(labelled(`Export ${section.name}`, check));
        }
        const confirm = document.createElement("input");
        confirm.type = "checkbox";
        confirm.checked = confirmedIncomplete;
        const liveStale = stale().stale, blocked = !snapshot || liveStale || (snapshot.incomplete && !confirmedIncomplete), copy = button("Copy rich documentation", () => { if (!snapshot)
            return; const live = stale(); if (live.stale) {
            feedback = "Refresh the stale preview before export.";
            render(host);
            return;
        } try {
            const value = renderProjectDocumentationClipboard(snapshot, { ...selection(), confirmIncomplete: confirmedIncomplete });
            void ports.writeRich(value.html, value.plain).then(() => { feedback = "Rich documentation copied with plain-text fallback."; render(host); });
        }
        catch (error) {
            feedback = error instanceof Error ? error.message : String(error);
            render(host);
        } }), download = button("Download Excel workbook", () => { if (!snapshot)
            return; const live = stale(); if (live.stale) {
            feedback = "Refresh the stale preview before export.";
            render(host);
            return;
        } try {
            const bytes = writeProjectDocumentationWorkbook(snapshot, { ...selection(), confirmIncomplete: confirmedIncomplete });
            ports.download(`${set.name.toLowerCase().replace(/[^a-z0-9]+/gu, "-")}.xlsx`, bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            feedback = "Excel workbook downloaded.";
            render(host);
        }
        catch (error) {
            feedback = error instanceof Error ? error.message : String(error);
            render(host);
        } });
        confirm.addEventListener("change", () => { confirmedIncomplete = confirm.checked; copy.disabled = download.disabled = !snapshot || liveStale || (snapshot.incomplete && !confirmedIncomplete); });
        copy.disabled = download.disabled = blocked;
        exportRegion.append(scope, labelled("Confirm incomplete export", confirm), copy, download, Object.assign(document.createElement("output"), { textContent: feedback }));
        const conceptRegion = renderConceptConfiguration(set, state);
        conceptRegion.querySelectorAll('ol input[type="checkbox"]').forEach((input) => declareStudioChoice(input, "documentation.concept-membership"));
        const conceptHeadingHint = document.createElement("small");
        conceptHeadingHint.id = `documentation-concept-heading-hint-${set.id.replace(/[^a-z0-9_-]/giu, "-")}`;
        conceptHeadingHint.textContent = "Shown between included concept groups after Refresh preview.";
        conceptRegion.querySelectorAll(':scope > label input[type="checkbox"]').forEach((input) => { declareStudioChoice(input, "documentation.concept-subheadings"); input.setAttribute("aria-describedby", conceptHeadingHint.id); });
        conceptRegion.append(conceptHeadingHint);
        content.querySelectorAll('input[type="checkbox"]').forEach((input) => declareStudioChoice(input, "documentation.section-membership"));
        themeRegion.querySelectorAll('input[type="checkbox"]').forEach((input) => declareStudioChoice(input, "documentation.theme-option"));
        const exportChoices = Array.from(exportRegion.querySelectorAll('input[type="checkbox"]'));
        exportChoices.slice(0, -1).forEach((input) => declareStudioChoice(input, "documentation.export-section"));
        if (exportChoices.length)
            declareStudioChoice(exportChoices.at(-1), "documentation.confirm-incomplete");
        root.append(setRegion, conceptRegion, content, configure, themeRegion, preview, exportRegion);
        host.append(root);
    }
    return { render };
}
//# sourceMappingURL=data-layer-project-documentation-workspace-ui.js.map