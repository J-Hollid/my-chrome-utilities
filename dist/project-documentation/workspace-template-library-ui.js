import { assignDocumentationTemplate, createDocumentationTemplate, documentationTemplateAssignment, removeDocumentationTemplate, replaceDocumentationTemplate } from "../documentation-templates/template-library.js";
import { writeDocumentationTemplateStarter } from "../documentation-templates/excel-renderer.js";
import { builtInRichTemplate, richTemplateBlockScopes, richTemplateHelpBindingsFor, validateRichDocumentationTemplate } from "../documentation-templates/rich-template.js";
import { templateDigest } from "../documentation-templates/template-contract.js";
import { DOCUMENTATION_TEMPLATE_XLSX_TYPE } from "../documentation-templates/template-body.js";
import { validateExcelTemplateWorkbook } from "../documentation-templates/excel-workbook.js";
import { renderExcelTemplateFindings, renderExcelTemplateGuide } from "./workspace-excel-template-guidance-ui.js";
import { documentationButton as button, documentationHeading as heading, documentationLabelled as labelled } from "./workspace-ui-elements.js";
const formats = ["excel", "rich"], kinds = ["overview", "flow", "matrix", "profile"];
const kindName = (kind) => kind === "profile" ? "Site Profile" : kind === "matrix" ? "Data capture matrix" : kind[0].toUpperCase() + kind.slice(1);
const digest = async (file) => `sha256:${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())), byte => byte.toString(16).padStart(2, "0")).join("")}`;
const richBlocks = (template) => template.richBlocks;
const recordBlocks = (blocks) => blocks;
const excelCandidates = new Map();
const candidateKey = (options) => `${options.projectId}:${options.set.id}`;
const cloneWithIds = (block) => { const copy = structuredClone(block); return copy.type === "repeat" ? { ...copy, id: `block:${crypto.randomUUID()}`, children: copy.children.map(cloneWithIds) } : { ...copy, id: `block:${crypto.randomUUID()}` }; };
const editSiblings = (blocks, id, edit) => { const index = blocks.findIndex(block => block.id === id); if (index >= 0)
    return edit(blocks, index); return blocks.map(block => block.type === "repeat" ? { ...block, children: editSiblings(block.children, id, edit) } : block); };
const replaceBlock = (blocks, id, update) => blocks.map(block => block.id === id ? update(block) : block.type === "repeat" ? { ...block, children: replaceBlock(block.children, id, update) } : block);
const renameRepeatVariable = (blocks, from, to) => blocks.map(block => {
    const rename = (value) => value === from ? to : value.startsWith(`${from}.`) ? `${to}${value.slice(from.length)}` : value;
    if (block.type === "heading" || block.type === "paragraph")
        return { ...block, content: block.content.map(inline => "binding" in inline ? { ...inline, binding: rename(inline.binding) } : inline) };
    return block.type === "repeat" ? { ...block, items: rename(block.items), children: renameRepeatVariable(block.children, from, to) } : block;
});
const replaceRichText = (content, value) => { const result = []; let replaced = false; for (const inline of content) {
    if (!("text" in inline)) {
        result.push(inline);
        continue;
    }
    if (!replaced) {
        result.push({ ...inline, text: value });
        replaced = true;
    }
} if (!replaced)
    result.unshift({ text: value }); return result; };
const dataSource = (kind) => kind === "overview" ? "overview.fields" : kind === "flow" ? "flow.rows" : kind === "matrix" ? "matrix.rows" : "profile.rows";
const conceptSource = (kind) => kind === "matrix" ? "matrix.concepts" : kind === "profile" ? "profile.concepts" : "table.concepts";
const rootCollections = (kind) => kind === "overview" ? ["overview.fields"] : kind === "flow" ? ["flow.pages", "table.rows", "flow.rows"] : kind === "matrix" ? ["matrix.rows", "matrix.concepts", "table.rows"] : ["profile.rows", "profile.concepts", "table.rows"];
const collectionVariable = (collection) => collection.endsWith(".pages") ? "page" : collection.endsWith(".events") ? "event" : collection.endsWith(".cells") ? "cell" : collection.endsWith(".concepts") ? "concept" : collection.endsWith(".fields") ? "field" : "row";
const newBlock = (type, kind, collections = []) => { const id = `block:${crypto.randomUUID()}`; if (type === "heading")
    return { id, type, level: 2, content: [{ text: "Heading" }] }; if (type === "paragraph")
    return { id, type, content: [{ text: "Text" }] }; if (type === "divider" || type === "theme-logo")
    return { id, type }; if (type === "data-table")
    return { id, type, source: dataSource(kind) }; if (type === "concept-group")
    return { id, type, source: conceptSource(kind) }; const items = collections[0] ?? (kind === "flow" ? "flow.pages" : "table.rows"); return { id, type, items, variable: collectionVariable(items), children: [] }; };
async function persistBody(options, bodyDigest, file, records, label) { const alreadyStored = (options.records.templates ?? []).some(template => template.body?.digest === bodyDigest); await options.storeBody?.(options.projectId, bodyDigest, file); try {
    await options.persist(records, label);
}
catch (error) {
    if (!alreadyStored)
        await options.discardBody?.(options.projectId, bodyDigest).catch(() => { });
    throw error;
} }
function richEditor(detail, selected, templates, options) {
    const blocks = richBlocks(selected) ?? [], scopes = richTemplateBlockScopes(selected.kind, blocks), flat = [];
    const collect = (items) => items.forEach(block => { flat.push(block); if (block.type === "repeat")
        collect(block.children); });
    collect(blocks);
    const selectedBlock = flat.find(block => block.id === options.selectedRichBlockId) ?? flat[0], selectedIndex = selectedBlock ? flat.indexOf(selectedBlock) : -1;
    const focusAfterRender = (selector) => setTimeout(() => detail.ownerDocument.querySelector(selector)?.focus(), 0);
    const choose = (id, showDetail = true) => { options.selectRichBlock(id); options.setRichEditorMobileDetail(showDetail); options.rerender(); focusAfterRender(showDetail ? '[aria-label="Selected rich template block detail"]' : '[data-rich-block-selected="true"]'); };
    const commit = (nextBlocks, label = "Edit", nextSelection = selectedBlock?.id) => { const candidate = { ...selected, blocks: nextBlocks }, validation = validateRichDocumentationTemplate(candidate); if (!validation.valid)
        throw new Error(validation.findings.map(({ blockId, message }) => `${blockId}: ${message}`).join("\n")); const next = { ...selected, richBlocks: recordBlocks(nextBlocks), digest: templateDigest("rich", nextBlocks), validation }; if (nextSelection)
        options.selectRichBlock(nextSelection); options.persist({ ...options.records, templates: templates.map(item => item.id === selected.id ? next : item) }, `${label} Rich page template ${selected.name}`); options.rerender(); };
    const editor = document.createElement("div"), outlineSurface = document.createElement("section"), detailSurface = document.createElement("section"), outline = document.createElement("ol");
    editor.className = "rich-template-editor";
    outlineSurface.setAttribute("aria-label", "Rich template outline surface");
    detailSurface.setAttribute("aria-label", "Selected rich template block detail");
    outlineSurface.dataset.mobileSurface = options.richEditorMobileDetail ? "inactive" : "active";
    detailSurface.dataset.mobileSurface = options.richEditorMobileDetail ? "active" : "inactive";
    outline.setAttribute("aria-label", "Rich template outline");
    const ids = flat.map(block => block.id), renderItems = (parent, items) => items.forEach(block => { const item = document.createElement("li"), select = button(block.type, () => choose(block.id)); select.dataset.richBlockId = block.id; select.dataset.richBlockSelected = String(block.id === selectedBlock?.id); select.setAttribute("aria-current", String(block.id === selectedBlock?.id)); select.addEventListener("keydown", event => { const current = ids.indexOf(block.id), target = event.key === "ArrowDown" ? Math.min(ids.length - 1, current + 1) : event.key === "ArrowUp" ? Math.max(0, current - 1) : event.key === "Home" ? 0 : event.key === "End" ? ids.length - 1 : -1; if (target < 0)
        return; event.preventDefault(); choose(ids[target], false); }); item.append(select); if (block.type === "repeat") {
        const children = document.createElement("ol");
        children.setAttribute("aria-label", `${block.items} child blocks`);
        renderItems(children, block.children);
        item.append(children);
    } parent.append(item); });
    renderItems(outline, blocks);
    outlineSurface.append(heading(4, "Template outline"), outline);
    for (const type of ["heading", "paragraph", "divider", "theme-logo", "repeat", "data-table", "concept-group"])
        outlineSurface.append(button(`Add ${type}`, () => { const added = newBlock(type, selected.kind, rootCollections(selected.kind)); options.setRichEditorMobileDetail(true); commit([...blocks, added], "Add", added.id); }));
    detailSurface.tabIndex = -1;
    detailSurface.append(heading(4, selectedBlock ? `${selectedBlock.type} block` : "Select a block"));
    if (selectedBlock) {
        const scope = scopes[selectedBlock.id], siblings = (() => { let found = blocks; const visit = (items) => { if (items.some(block => block.id === selectedBlock.id)) {
            found = items;
            return true;
        } return items.some(block => block.type === "repeat" && visit(block.children)); }; visit(blocks); return found; })(), index = siblings.findIndex(block => block.id === selectedBlock.id), move = (offset) => commit(editSiblings(blocks, selectedBlock.id, (items, current) => { const next = [...items], target = current + offset; if (target < 0 || target >= next.length)
            return next; [next[current], next[target]] = [next[target], next[current]]; return next; }), "Move"), earlier = button("Move earlier", () => move(-1)), later = button("Move later", () => move(1)), copied = cloneWithIds(selectedBlock), copy = button("Copy block", () => commit(editSiblings(blocks, selectedBlock.id, (items, current) => [...items.slice(0, current + 1), copied, ...items.slice(current + 1)]), "Copy", copied.id)), fallback = flat[selectedIndex + 1]?.id ?? flat[selectedIndex - 1]?.id ?? "", remove = button("Remove block", () => commit(editSiblings(blocks, selectedBlock.id, (items, current) => items.filter((_, candidate) => candidate !== current)), "Remove", fallback));
        earlier.disabled = index === 0;
        later.disabled = index === siblings.length - 1;
        detailSurface.append(earlier, later, copy, remove);
        if (selectedBlock.type === "heading" || selectedBlock.type === "paragraph") {
            const text = document.createElement("input"), textEmphasis = document.createElement("select"), binding = document.createElement("select"), bindingEmphasis = document.createElement("select"), emphasisOptions = () => [new Option("No emphasis", ""), new Option("Bold", "strong"), new Option("Italic", "emphasis")];
            text.setAttribute("aria-label", `${selectedBlock.type} text`);
            text.value = selectedBlock.content.filter((inline) => ("text" in inline)).map(({ text: value }) => value).join("");
            text.addEventListener("change", () => commit(replaceBlock(blocks, selectedBlock.id, current => ({ ...current, content: replaceRichText(current.content, text.value) })), "Edit"));
            textEmphasis.setAttribute("aria-label", `${selectedBlock.type} text emphasis`);
            textEmphasis.append(...emphasisOptions());
            textEmphasis.value = selectedBlock.content.find((inline) => ("text" in inline))?.emphasis ?? "";
            textEmphasis.addEventListener("change", () => commit(replaceBlock(blocks, selectedBlock.id, current => ({ ...current, content: current.content.map(inline => "text" in inline ? { text: inline.text, ...(textEmphasis.value ? { emphasis: textEmphasis.value } : {}) } : inline) })), "Emphasize"));
            binding.setAttribute("aria-label", `${selectedBlock.type} binding`);
            binding.append(...(scope?.bindings ?? []).map(value => new Option(value, value)));
            bindingEmphasis.setAttribute("aria-label", `${selectedBlock.type} binding emphasis`);
            bindingEmphasis.append(...emphasisOptions());
            detailSurface.append(labelled("Text", text), labelled("Text emphasis", textEmphasis), labelled("Binding", binding), labelled("Binding emphasis", bindingEmphasis), button("Add binding", () => commit(replaceBlock(blocks, selectedBlock.id, current => ({ ...current, content: [...current.content, { binding: binding.value, ...(bindingEmphasis.value ? { emphasis: bindingEmphasis.value } : {}) }] })), "Bind")));
        }
        if (selectedBlock.type === "repeat") {
            const collection = document.createElement("select"), variable = document.createElement("input");
            collection.setAttribute("aria-label", "Repeat collection");
            collection.append(...(scope?.collections ?? []).map(value => new Option(value, value)));
            collection.value = selectedBlock.items;
            collection.addEventListener("change", () => commit(replaceBlock(blocks, selectedBlock.id, current => ({ ...current, items: collection.value, variable: collectionVariable(collection.value), children: [] })), "Change collection"));
            variable.setAttribute("aria-label", "Repeat item name");
            variable.value = selectedBlock.variable;
            variable.addEventListener("change", () => { const next = variable.value.trim() || "item"; commit(replaceBlock(blocks, selectedBlock.id, current => ({ ...current, variable: next, children: renameRepeatVariable(current.children, selectedBlock.variable, next) })), "Rename repeat item"); });
            const addChild = (type) => { const added = newBlock(type, selected.kind, scope?.childCollections); commit(replaceBlock(blocks, selectedBlock.id, current => ({ ...current, children: [...current.children, added] })), "Add child", added.id); };
            detailSurface.append(labelled("Collection", collection), labelled("Item name", variable), button("Add child heading", () => addChild("heading")), button("Add child paragraph", () => addChild("paragraph")), button("Add child data table", () => addChild("data-table")));
            if (scope?.childCollections.length)
                detailSurface.append(button("Add nested repeat", () => addChild("repeat")));
        }
    }
    detailSurface.append(button("Back to template outline", () => { options.setRichEditorMobileDetail(false); options.rerender(); focusAfterRender('[data-rich-block-selected="true"]'); }));
    editor.append(outlineSurface, detailSurface);
    detail.append(editor);
    if (options.selectedRichBlockId && !options.richEditorMobileDetail)
        focusAfterRender('[data-rich-block-selected="true"]');
}
function candidateDetail(_host, detail, candidate, templates, options) {
    detail.append(heading(3, `${candidate.file.name} — unsaved candidate`), Object.assign(document.createElement("p"), { textContent: `${kindName(candidate.kind)} · contract 2 · no template metadata or body has been saved` }));
    const inspection = document.createElement("section");
    inspection.setAttribute("aria-label", "Excel template candidate inspection");
    inspection.append(heading(4, "Candidate inspection"));
    const bindings = document.createElement("ul");
    bindings.append(...candidate.validation.inspection.bindings.map(binding => Object.assign(document.createElement("li"), { textContent: `Binding cell ${binding.cell}: ${binding.path}` })));
    const areas = document.createElement("ul");
    areas.append(...candidate.validation.inspection.areas.map(area => Object.assign(document.createElement("li"), { textContent: area.type === "repeat" ? `${area.name}: ${area.source}, item prefix ${area.itemPrefix}, ${area.direction}, range ${area.range}, parent ${area.parent ?? "none"}` : `${area.name}: image ${area.source}, range ${area.range}` })));
    inspection.append(bindings, areas);
    detail.append(inspection);
    if (options.previewCandidateExcel)
        detail.append(button("Populated preview — output only", () => void options.previewCandidateExcel(candidate.file, candidate.kind).then(bytes => options.download?.(`${candidate.file.name.replace(/\.xlsx$/iu, "")}-populated-output.xlsx`, bytes, DOCUMENTATION_TEMPLATE_XLSX_TYPE)).catch(error => detail.append(Object.assign(document.createElement("p"), { role: "alert", textContent: error instanceof Error ? error.message : String(error) })))));
    detail.append(button("Save template", () => void (async () => { const bodyDigest = await digest(candidate.file), template = createDocumentationTemplate({ id: `documentation-template:${crypto.randomUUID()}`, name: candidate.file.name.replace(/\.xlsx$/iu, ""), format: "excel", kind: candidate.kind, body: { assetId: `documentation-template-body:${crypto.randomUUID()}`, digest: bodyDigest, byteLength: candidate.file.size }, validation: candidate.validation }); await persistBody(options, bodyDigest, candidate.file, { ...options.records, templates: [...templates, template] }, `Save Excel template ${template.name}`); excelCandidates.delete(candidateKey(options)); options.selectTemplate(template.id); options.rerender(); })().catch(error => detail.append(Object.assign(document.createElement("p"), { role: "alert", textContent: error instanceof Error ? error.message : String(error) })))));
    detail.append(button("Discard candidate", () => { excelCandidates.delete(candidateKey(options)); options.setMobileDetail(false); options.rerender(); }));
}
export function renderDocumentationTemplateLibrary(host, options) {
    host.replaceChildren();
    host.className = "documentation-template-library";
    host.setAttribute("aria-label", "Documentation Template Library");
    host.append(heading(2, "Templates"));
    const grid = document.createElement("div"), list = document.createElement("section"), detail = document.createElement("section"), templates = options.records.templates ?? [];
    grid.className = "documentation-template-library-grid";
    list.dataset.mobileSurface = options.mobileDetail ? "inactive" : "active";
    detail.dataset.mobileSurface = options.mobileDetail ? "active" : "inactive";
    list.setAttribute("aria-label", "Template list");
    detail.setAttribute("aria-label", "Selected template detail");
    for (const format of formats)
        for (const kind of kinds) {
            const group = document.createElement("section"), assignment = document.createElement("select");
            assignment.setAttribute("aria-label", `${kindName(kind)} ${format} template assignment`);
            assignment.append(new Option("Built-in", "builtin"), ...templates.filter(template => template.format === format && template.kind === kind).map(template => new Option(template.name, template.id)));
            assignment.value = documentationTemplateAssignment(options.set, format, kind);
            assignment.addEventListener("change", () => { options.persist(assignDocumentationTemplate(options.records, options.set.id, format, kind, assignment.value), `Assign ${assignment.selectedOptions[0]?.textContent ?? "Built-in"}`); options.rerender(); });
            group.append(heading(3, `${format === "excel" ? "Excel" : "Rich page"} · ${kindName(kind)}`), labelled("Assignment", assignment));
            for (const template of templates.filter(template => template.format === format && template.kind === kind)) {
                const select = button(template.name, () => { excelCandidates.delete(candidateKey(options)); options.selectTemplate(template.id); options.setMobileDetail(true); options.rerender(); });
                select.setAttribute("aria-pressed", String(options.selectedTemplateId === template.id));
                group.append(select);
            }
            if (format === "excel")
                group.append(renderExcelTemplateGuide(kind));
            else {
                const bindings = document.createElement("details"), bindingList = document.createElement("ul");
                bindings.append(Object.assign(document.createElement("summary"), { textContent: "Template bindings" }));
                bindingList.append(...richTemplateHelpBindingsFor(kind).map(value => Object.assign(document.createElement("li"), { textContent: value })));
                bindings.append(bindingList);
                group.append(bindings);
            }
            if (format === "excel") {
                group.append(button("Download guided starter", () => void writeDocumentationTemplateStarter(kind).then(bytes => options.download?.(`${kind}-documentation-template.xlsx`, bytes, DOCUMENTATION_TEMPLATE_XLSX_TYPE))));
                const upload = document.createElement("input");
                upload.type = "file";
                upload.accept = `.xlsx,${DOCUMENTATION_TEMPLATE_XLSX_TYPE}`;
                upload.setAttribute("aria-label", `Select Excel template for ${kindName(kind)}`);
                upload.addEventListener("change", () => void (async () => { const file = upload.files?.[0]; if (!file)
                    return; const validation = await validateExcelTemplateWorkbook(file, kind); if (!validation.valid) {
                    renderExcelTemplateFindings(detail, validation.findings);
                    return;
                } excelCandidates.set(candidateKey(options), { file, kind, validation }); options.selectTemplate(""); options.setMobileDetail(true); options.rerender(); })().catch(error => detail.replaceChildren(Object.assign(document.createElement("p"), { role: "alert", textContent: error instanceof Error ? error.message : String(error) }))));
                group.append(upload);
            }
            else
                group.append(button("New rich page template", () => { const id = `documentation-template:${crypto.randomUUID()}`, rich = builtInRichTemplate(kind, id, `${kindName(kind)} page`), template = createDocumentationTemplate({ ...rich, richBlocks: recordBlocks(rich.blocks), validation: { valid: true, findings: [] } }); options.persist({ ...options.records, templates: [...templates, template] }, `Create Rich page template ${template.name}`); options.selectTemplate(template.id); options.setMobileDetail(true); options.rerender(); }));
            list.append(group);
        }
    const candidate = excelCandidates.get(candidateKey(options)), selected = templates.find(({ id }) => id === options.selectedTemplateId);
    if (candidate)
        candidateDetail(host, detail, candidate, templates, options);
    else {
        detail.append(heading(3, selected?.name ?? "Template detail"));
        if (!selected)
            detail.append(Object.assign(document.createElement("p"), { textContent: templates.length ? `${templates.length} project templates. Select one to edit its presentation.` : "Select an Excel template or create a Rich page template." }));
        else {
            const name = document.createElement("input");
            name.value = selected.name;
            name.setAttribute("aria-label", "Template name");
            detail.append(labelled("Name", name), button("Rename template", () => { options.persist({ ...options.records, templates: templates.map(template => template.id === selected.id ? { ...selected, name: name.value.trim() || selected.name } : template) }, `Rename documentation template ${selected.name}`); options.rerender(); }), button("Duplicate template", () => { const copy = { ...structuredClone(selected), id: `documentation-template:${crypto.randomUUID()}`, name: `${selected.name} copy` }; options.persist({ ...options.records, templates: [...templates, copy] }, `Duplicate documentation template ${selected.name}`); options.selectTemplate(copy.id); options.rerender(); }), button("Remove template", () => { try {
                options.persist(removeDocumentationTemplate(options.records, selected.id), `Remove documentation template ${selected.name}`);
                options.selectTemplate("");
                options.setMobileDetail(false);
                options.rerender();
            }
            catch (error) {
                detail.append(Object.assign(document.createElement("p"), { role: "alert", textContent: error instanceof Error ? error.message : String(error) }));
            } }));
            if (selected.format === "excel") {
                if (options.sampleExcel)
                    detail.append(button("Download sample-filled workbook", () => void options.sampleExcel(selected).then(bytes => options.download?.(`${selected.name.toLowerCase().replace(/[^a-z0-9]+/gu, "-")}-sample.xlsx`, bytes, DOCUMENTATION_TEMPLATE_XLSX_TYPE)).catch(error => detail.append(Object.assign(document.createElement("p"), { role: "alert", textContent: error instanceof Error ? error.message : String(error) })))));
                const replacement = document.createElement("input");
                replacement.type = "file";
                replacement.accept = ".xlsx";
                replacement.setAttribute("aria-label", "Replace Excel template body");
                replacement.addEventListener("change", () => void (async () => { const file = replacement.files?.[0]; if (!file)
                    return; const validation = await validateExcelTemplateWorkbook(file, selected.kind); if (!validation.valid)
                    throw new Error(validation.findings.map(({ location, message }) => `${location}: ${message}`).join("\n")); const bodyDigest = await digest(file), records = replaceDocumentationTemplate(options.records, selected.id, { assetId: selected.body.assetId, digest: bodyDigest, byteLength: file.size }); await persistBody(options, bodyDigest, file, records, `Replace documentation template ${selected.name}`); options.rerender(); })().catch(error => detail.append(Object.assign(document.createElement("p"), { role: "alert", textContent: error instanceof Error ? error.message : String(error) }))));
                detail.append(replacement);
            }
            else
                richEditor(detail, selected, templates, options);
        }
    }
    detail.append(button("Back to template list", () => { options.setMobileDetail(false); options.rerender(); }));
    grid.append(list, detail);
    host.append(grid);
}
//# sourceMappingURL=workspace-template-library-ui.js.map