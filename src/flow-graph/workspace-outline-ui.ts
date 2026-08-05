import { itemIdentity } from "./workspace-dom.js";
import { flowOutlineProjection } from "./workspace-outline-model.js";

interface OutlineOptions {
  outline: HTMLOListElement;
  canvas: SVGSVGElement;
  reveal: (target: SVGGraphicsElement) => void;
}

function canvasSelector(row: HTMLElement): string | undefined {
  if (row.dataset.flowSectionId) return `[data-section-dropzone="${CSS.escape(row.dataset.flowSectionId)}"]`;
  if (row.dataset.occurrenceId) return `[data-occurrence-id="${CSS.escape(row.dataset.occurrenceId)}"]`;
  if (row.dataset.pageFrameId) return `[data-page-frame-id="${CSS.escape(row.dataset.pageFrameId)}"]`;
  if (row.dataset.relationshipId) return `[data-relationship-id="${CSS.escape(row.dataset.relationshipId)}"]`;
  return undefined;
}

export function prepareFlowOutline(options: OutlineOptions): HTMLElement {
  const { outline, canvas } = options;
  const panel = document.createElement("section");
  const search = document.createElement("input");
  const results = document.createElement("ol");
  const rows = Array.from(outline.children).filter((row): row is HTMLLIElement => row instanceof HTMLLIElement);
  const sections = rows.filter(({ dataset }) => dataset.flowSectionId);
  const frames = rows.filter(({ dataset }) => dataset.pageFrameId && !dataset.occurrenceId);
  const occurrences = rows.filter(({ dataset }) => dataset.occurrenceId);
  const relationships = rows.filter(({ dataset }) => dataset.relationshipId);
  const tree = document.createElement("ol");

  const projection = flowOutlineProjection({
    sections: sections.map((row) => ({ id: row.dataset.flowSectionId! })),
    frames: frames.map((row) => ({ id: row.dataset.pageFrameId!, ...(row.dataset.flowSectionId ? { sectionId: row.dataset.flowSectionId } : {}) })),
    occurrences: occurrences.map((row) => ({ id: row.dataset.occurrenceId!, ...(row.dataset.containingPageFrameId ? { pageFrameId: row.dataset.containingPageFrameId } : {}) })),
    relationships: relationships.map((row) => ({ id: row.dataset.relationshipId! })),
  });
  const rowByFrameId = new Map(frames.map((row) => [row.dataset.pageFrameId!, row]));
  const rowByOccurrenceId = new Map(occurrences.map((row) => [row.dataset.occurrenceId!, row]));

  const appendFrame = (target: HTMLOListElement, frameId: string, occurrenceIds: readonly string[]): void => {
    const frame = rowByFrameId.get(frameId);
    if (!frame) return;
    const children = document.createElement("ol");
    for (const occurrenceId of occurrenceIds) {
      const occurrence = rowByOccurrenceId.get(occurrenceId);
      if (occurrence) children.append(occurrence);
    }
    if (children.children.length) frame.append(children);
    target.append(frame);
  };

  for (const projectedSection of projection.sections) {
    const section = sections.find((row) => row.dataset.flowSectionId === projectedSection.id);
    if (!section) continue;
    const nested = document.createElement("ol");
    for (const frame of projectedSection.frames) appendFrame(nested, frame.id, frame.occurrenceIds);
    section.append(nested);
    tree.append(section);
  }
  const outside = document.createElement("li"), outsideHeading = document.createElement("span"), outsideRows = document.createElement("ol");
  outsideHeading.textContent = "Outside Sections";
  for (const frameId of projection.outsideFrameIds) {
    const occurrenceIds = occurrences.filter((row) => row.dataset.containingPageFrameId === frameId).map((row) => row.dataset.occurrenceId!);
    appendFrame(outsideRows, frameId, occurrenceIds);
  }
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
  const renderResults = (): void => {
    const term = search.value.trim().toLowerCase();
    results.replaceChildren();
    results.hidden = !term;
    if (!term) return;
    for (const row of rows.filter((candidate) => candidate.textContent?.toLowerCase().includes(term))) {
      const selector = canvasSelector(row);
      if (!selector) continue;
      const item = document.createElement("li"), activate = document.createElement("button");
      activate.type = "button";
      activate.textContent = row.textContent?.trim() ?? itemIdentity(row) ?? "Flow item";
      for (const key of ["flowSectionId", "pageFrameId", "occurrenceId", "relationshipId"] as const) {
        if (row.dataset[key]) activate.dataset[key] = row.dataset[key]!;
      }
      activate.addEventListener("click", () => {
        row.querySelector<HTMLButtonElement>("button")?.click();
        setTimeout(() => {
          const liveCanvas = document.querySelector<SVGSVGElement>('[aria-label="Interactive directional Flow canvas"]');
          liveCanvas?.dispatchEvent(new CustomEvent("flow-reveal-item", { detail: { selector } }));
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
