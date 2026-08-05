import { tidyFlowItems } from "./workspace.js";
import { FLOW_PAGE_FRAME_SELECTOR, flowControl, renderedElementBounds, svgTranslation } from "./workspace-dom.js";
export function createFlowTidyPanel(options) {
    const { canvas, root } = options;
    const panel = document.createElement("section"), scope = document.createElement("select"), direction = document.createElement("select"), preview = flowControl("Preview Tidy", previewTidy), cancel = flowControl("Cancel Tidy", cancelTidy), explanation = document.createElement("p");
    let placements = [];
    explanation.textContent = "Tidy previews presentation coordinates and routed edges only. Endpoints, kinds, containment, schemas, and documentation order stay unchanged.";
    scope.setAttribute("aria-label", "Tidy scope");
    scope.append(new Option("Selection", "selection"));
    for (const section of Array.from(canvas.querySelectorAll("g[data-flow-section-id]")).filter((candidate) => candidate.querySelector(":scope > [data-section-dropzone]"))) {
        const id = section.dataset.flowSectionId;
        if (!id)
            continue;
        const name = section.querySelector("text")?.textContent?.trim() || id;
        scope.append(new Option(`Section ${name}`, `section:${id}`));
    }
    direction.setAttribute("aria-label", "Tidy arrangement");
    direction.append(new Option("Horizontally", "horizontal"), new Option("Vertically", "vertical"));
    function chosenItems() {
        const selector = scope.value.startsWith("section:")
            ? `${FLOW_PAGE_FRAME_SELECTOR}[data-flow-section-id="${CSS.escape(scope.value.slice(8))}"]`
            : `${FLOW_PAGE_FRAME_SELECTOR}.is-selected,${FLOW_PAGE_FRAME_SELECTOR}[aria-pressed="true"]`;
        return Array.from(canvas.querySelectorAll(selector)).map((item) => ({
            id: item.dataset.pageFrameId, position: svgTranslation(item), item, transform: item.getAttribute("transform") ?? "",
        }));
    }
    function clearPreview() {
        for (const item of Array.from(canvas.querySelectorAll("[data-tidy-transform]"))) {
            item.setAttribute("transform", item.dataset.tidyTransform ?? "");
            delete item.dataset.tidyTransform;
        }
        canvas.querySelectorAll("[data-tidy-edge-preview]").forEach((edge) => edge.remove());
        placements = [];
        panel.querySelector("[data-tidy-confirm]")?.remove();
    }
    function edgePreviews() {
        const byId = new Map(Array.from(canvas.querySelectorAll(FLOW_PAGE_FRAME_SELECTOR)).map((item) => [item.dataset.pageFrameId, item]));
        for (const edge of Array.from(canvas.querySelectorAll("[data-relationship-id]"))) {
            const source = byId.get(edge.dataset.sourceEndpointId ?? ""), target = byId.get(edge.dataset.targetEndpointId ?? "");
            const sourceBounds = source && renderedElementBounds(source), targetBounds = target && renderedElementBounds(target);
            if (!sourceBounds || !targetBounds)
                continue;
            const previewEdge = document.createElementNS("http://www.w3.org/2000/svg", "line");
            previewEdge.dataset.tidyEdgePreview = edge.dataset.relationshipId ?? "preview";
            previewEdge.classList.add("flow-tidy-edge-preview");
            previewEdge.setAttribute("x1", String(sourceBounds.x + sourceBounds.width / 2));
            previewEdge.setAttribute("y1", String(sourceBounds.y + sourceBounds.height / 2));
            previewEdge.setAttribute("x2", String(targetBounds.x + targetBounds.width / 2));
            previewEdge.setAttribute("y2", String(targetBounds.y + targetBounds.height / 2));
            canvas.append(previewEdge);
        }
    }
    function previewTidy() {
        clearPreview();
        const items = chosenItems();
        if (!items.length) {
            scope.setCustomValidity("Select Page instances or choose a Section before Tidy.");
            scope.reportValidity();
            return;
        }
        scope.setCustomValidity("");
        const origin = {
            x: Math.min(...items.map(({ position }) => position.x)),
            y: Math.min(...items.map(({ position }) => position.y)),
            gap: direction.value === "horizontal" ? 260 : 190,
        };
        placements = tidyFlowItems(items, direction.value, origin);
        for (const placement of placements) {
            const entry = items.find(({ id }) => id === placement.id);
            entry.item.dataset.tidyTransform = entry.transform;
            entry.item.setAttribute("transform", `translate(${placement.position.x} ${placement.position.y})`);
        }
        edgePreviews();
        const confirm = flowControl("Confirm Tidy", () => {
            root.dispatchEvent(new CustomEvent("flow-tidy-confirm", { bubbles: true, detail: { scope: scope.value, direction: direction.value, placements } }));
            options.closeSurface();
        });
        confirm.dataset.tidyConfirm = "true";
        panel.append(confirm);
    }
    function cancelTidy() {
        clearPreview();
        options.closeSurface();
    }
    panel.setAttribute("aria-label", "Tidy Flow presentation");
    panel.append(explanation, scope, direction, preview, cancel);
    return panel;
}
//# sourceMappingURL=workspace-tidy-ui.js.map