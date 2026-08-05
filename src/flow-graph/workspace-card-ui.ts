export function decorateCompactFlowCards(canvas: SVGSVGElement, duplicateFrames?: HTMLElement, outline?: HTMLOListElement): void {
  for (const card of Array.from(duplicateFrames?.querySelectorAll<HTMLElement>("[data-page-frame-id]") ?? [])) {
    const frameId = card.dataset.pageFrameId;
    const group = frameId ? canvas.querySelector<SVGGElement>(`[data-page-frame-id="${CSS.escape(frameId)}"]`) : undefined;
    if (!group || group.querySelector(".flow-page-source")) continue;
    const source = card.querySelector<HTMLInputElement>('[aria-label^="Name in this Flow for "]')?.getAttribute("aria-label")?.replace("Name in this Flow for ", "") ?? "Page";
    const status = card.querySelector<HTMLDetailsElement>("[data-example-status]")?.dataset.exampleStatus ?? "Incomplete";
    const provenance = document.createElementNS(canvas.namespaceURI, "text"), readiness = document.createElementNS(canvas.namespaceURI, "text");
    provenance.setAttribute("x", "14"); provenance.setAttribute("y", "54"); provenance.classList.add("flow-page-source"); provenance.textContent = source;
    readiness.setAttribute("x", "14"); readiness.setAttribute("y", "76"); readiness.classList.add("flow-readiness"); readiness.textContent = status;
    group.classList.add("flow-page-card"); group.append(provenance, readiness);
    group.setAttribute("aria-label", `${group.getAttribute("aria-label") ?? "Page frame"}. Source Page ${source}. ${status}.`);
  }
  for (const row of Array.from(outline?.querySelectorAll<HTMLElement>("[data-occurrence-id]") ?? [])) {
    const occurrenceId = row.dataset.occurrenceId;
    const group = occurrenceId ? canvas.querySelector<SVGGElement>(`[data-occurrence-id="${CSS.escape(occurrenceId)}"]`) : undefined;
    if (!group || group.querySelector(".flow-readiness")) continue;
    const status = row.querySelector<HTMLDetailsElement>("[data-example-status]")?.dataset.exampleStatus ?? "Incomplete";
    const readiness = document.createElementNS(canvas.namespaceURI, "text");
    readiness.setAttribute("x", "12"); readiness.setAttribute("y", "76"); readiness.classList.add("flow-readiness"); readiness.textContent = status;
    group.append(readiness); group.setAttribute("aria-label", `${group.getAttribute("aria-label") ?? "Event occurrence"}. ${status}.`);
  }
}
