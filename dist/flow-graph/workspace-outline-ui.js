import { itemIdentity } from "./workspace-dom.js";
function canvasSelector(row) {
    if (row.dataset.flowSectionId)
        return `[data-section-dropzone="${CSS.escape(row.dataset.flowSectionId)}"]`;
    if (row.dataset.occurrenceId)
        return `[data-occurrence-id="${CSS.escape(row.dataset.occurrenceId)}"]`;
    if (row.dataset.pageFrameId)
        return `[data-page-frame-id="${CSS.escape(row.dataset.pageFrameId)}"]`;
    if (row.dataset.relationshipId)
        return `[data-relationship-id="${CSS.escape(row.dataset.relationshipId)}"]`;
    return undefined;
}
export function prepareFlowOutline(options) {
    const { outline, canvas } = options;
    const panel = document.createElement("section");
    const search = document.createElement("input");
    const results = document.createElement("ol");
    const rows = Array.from(outline.children).filter((row) => row instanceof HTMLLIElement);
    const sections = rows.filter(({ dataset }) => dataset.flowSectionId);
    const frames = rows.filter(({ dataset }) => dataset.pageFrameId && !dataset.occurrenceId);
    const occurrences = rows.filter(({ dataset }) => dataset.occurrenceId);
    const relationships = rows.filter(({ dataset }) => dataset.relationshipId);
    const tree = document.createElement("ol");
    const pageSection = (row) => {
        const id = row.dataset.pageFrameId;
        return id ? canvas.querySelector(`[data-page-frame-id="${CSS.escape(id)}"]`)?.dataset.flowSectionId : undefined;
    };
    const occurrenceFrame = (row) => {
        const id = row.dataset.occurrenceId;
        return id ? canvas.querySelector(`[data-occurrence-id="${CSS.escape(id)}"]`)?.dataset.pageFrameId : undefined;
    };
    const appendFrame = (target, frame) => {
        const children = document.createElement("ol");
        const frameId = frame.dataset.pageFrameId;
        for (const occurrence of occurrences.filter((row) => occurrenceFrame(row) === frameId))
            children.append(occurrence);
        if (children.children.length)
            frame.append(children);
        target.append(frame);
    };
    for (const section of sections) {
        const nested = document.createElement("ol");
        const sectionId = section.dataset.flowSectionId;
        for (const frame of frames.filter((row) => pageSection(row) === sectionId))
            appendFrame(nested, frame);
        section.append(nested);
        tree.append(section);
    }
    const outside = document.createElement("li"), outsideHeading = document.createElement("span"), outsideRows = document.createElement("ol");
    outsideHeading.textContent = "Outside Sections";
    for (const frame of frames.filter((row) => !pageSection(row)))
        appendFrame(outsideRows, frame);
    outside.append(outsideHeading, outsideRows);
    tree.append(outside);
    const relationshipGroup = document.createElement("li"), relationshipHeading = document.createElement("span"), relationshipRows = document.createElement("ol");
    relationshipHeading.textContent = "Relationships";
    relationshipRows.append(...relationships);
    relationshipGroup.append(relationshipHeading, relationshipRows);
    tree.append(relationshipGroup);
    outline.replaceChildren(...Array.from(tree.children));
    search.type = "search";
    search.setAttribute("aria-label", "Search Flow Outline");
    results.setAttribute("aria-label", "Flow Outline search results");
    results.hidden = true;
    const renderResults = () => {
        const term = search.value.trim().toLowerCase();
        results.replaceChildren();
        results.hidden = !term;
        if (!term)
            return;
        for (const row of rows.filter((candidate) => candidate.textContent?.toLowerCase().includes(term))) {
            const selector = canvasSelector(row);
            if (!selector)
                continue;
            const item = document.createElement("li"), activate = document.createElement("button");
            activate.type = "button";
            activate.textContent = row.textContent?.trim() ?? itemIdentity(row) ?? "Flow item";
            activate.addEventListener("click", () => {
                row.querySelector("button")?.click();
                setTimeout(() => {
                    const liveCanvas = document.querySelector('[aria-label="Interactive directional Flow canvas"]');
                    const matched = liveCanvas?.querySelector(selector);
                    const target = matched?.dataset.sectionDropzone ? matched.closest("g") ?? matched : matched;
                    if (target)
                        options.reveal(target);
                }, 50);
            });
            item.append(activate);
            results.append(item);
        }
    };
    search.addEventListener("input", renderResults);
    panel.setAttribute("aria-label", "Flow Outline");
    panel.append(search, results, outline);
    queueMicrotask(() => search.focus({ preventScroll: true }));
    return panel;
}
//# sourceMappingURL=workspace-outline-ui.js.map