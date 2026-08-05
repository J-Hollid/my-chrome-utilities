import { FLOW_PAGE_FRAME_SELECTOR, renderedElementBounds } from "./workspace-dom.js";
export function decorateCompactFlowCards(canvas, duplicateFrames, outline) {
    for (const card of Array.from(duplicateFrames?.querySelectorAll("[data-page-frame-id]") ?? [])) {
        const frameId = card.dataset.pageFrameId;
        const group = frameId ? canvas.querySelector(`[data-page-frame-id="${CSS.escape(frameId)}"]`) : undefined;
        if (!group || group.querySelector(".flow-page-source"))
            continue;
        const source = card.querySelector('[aria-label^="Name in this Flow for "]')?.getAttribute("aria-label")?.replace("Name in this Flow for ", "") ?? "Page";
        const status = card.querySelector("[data-example-status]")?.dataset.exampleStatus ?? "Incomplete";
        const provenance = document.createElementNS(canvas.namespaceURI, "text"), readiness = document.createElementNS(canvas.namespaceURI, "text");
        provenance.setAttribute("x", "14");
        provenance.setAttribute("y", "54");
        provenance.classList.add("flow-page-source");
        provenance.textContent = source;
        readiness.setAttribute("x", "14");
        readiness.setAttribute("y", "76");
        readiness.classList.add("flow-readiness");
        readiness.textContent = status;
        group.classList.add("flow-page-card");
        group.append(provenance, readiness);
        group.setAttribute("aria-label", `${group.getAttribute("aria-label") ?? "Page frame"}. Source Page ${source}. ${status}.`);
    }
    for (const row of Array.from(outline?.querySelectorAll("[data-occurrence-id]") ?? [])) {
        const occurrenceId = row.dataset.occurrenceId;
        const group = occurrenceId ? canvas.querySelector(`[data-occurrence-id="${CSS.escape(occurrenceId)}"]`) : undefined;
        if (!group || group.querySelector(".flow-readiness"))
            continue;
        const status = row.querySelector("[data-example-status]")?.dataset.exampleStatus ?? "Incomplete";
        const readiness = document.createElementNS(canvas.namespaceURI, "text");
        readiness.setAttribute("x", "12");
        readiness.setAttribute("y", "76");
        readiness.classList.add("flow-readiness");
        readiness.textContent = status;
        group.append(readiness);
        group.setAttribute("aria-label", `${group.getAttribute("aria-label") ?? "Event occurrence"}. ${status}.`);
    }
    const frames = Array.from(canvas.querySelectorAll(FLOW_PAGE_FRAME_SELECTOR)).flatMap((item) => {
        const bounds = renderedElementBounds(item);
        return bounds && item.dataset.pageFrameId ? [{ id: item.dataset.pageFrameId, bounds }] : [];
    });
    for (const occurrence of Array.from(canvas.querySelectorAll("[data-occurrence-id]"))) {
        const bounds = renderedElementBounds(occurrence);
        const frame = bounds && frames.find(({ bounds: candidate }) => bounds.x >= candidate.x && bounds.y >= candidate.y && bounds.x + bounds.width <= candidate.x + candidate.width && bounds.y + bounds.height <= candidate.y + candidate.height);
        if (!frame)
            continue;
        occurrence.dataset.containingPageFrameId = frame.id;
        const occurrenceId = occurrence.dataset.occurrenceId;
        if (occurrenceId)
            outline?.querySelector(`[data-occurrence-id="${CSS.escape(occurrenceId)}"]`)?.setAttribute("data-containing-page-frame-id", frame.id);
    }
}
//# sourceMappingURL=workspace-card-ui.js.map