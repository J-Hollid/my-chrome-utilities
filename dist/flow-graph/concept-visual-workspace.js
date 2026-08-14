import { attachFlowConceptVisual, flowConceptVisual, removeFlowConceptVisual } from "./concept-visuals.js";
import { createFlowConceptVisualEditor, openFlowConceptVisualViewer } from "./concept-visual-ui.js";
export function createFlowConceptVisualActions(options) {
    const saved = flowConceptVisual(options.project(), options.flowId, options.target), close = () => options.host.dispatchEvent(new CustomEvent("flow-close-item-editor", { bubbles: true })), openEditor = () => {
        const editor = createFlowConceptVisualEditor({ project: options.project, ...(saved ? { existing: { attachment: saved.attachment, raster: saved.asset } } : {}), save: (value) => { const next = attachFlowConceptVisual(options.state(), options.flowId, options.target, value, options.id); close(); options.persist(next, `Saved concept visual for ${options.label}; Undo available.`); }, cancel: close });
        options.host.dispatchEvent(new CustomEvent("flow-open-item-editor", { bubbles: true, detail: { title: `${saved ? "Edit" : "Add"} visual for ${options.label}`, content: editor.root, firstControl: editor.firstControl } }));
    }, view = () => { const current = flowConceptVisual(options.project(), options.flowId, options.target), invoker = document.activeElement, selector = options.target.kind === "page-frame" ? `g[data-page-frame-id="${CSS.escape(options.target.id)}"]:not([data-occurrence-id])` : `[data-occurrence-id="${CSS.escape(options.target.id)}"]`, fallback = document.querySelector(selector); if (current && invoker instanceof HTMLElement)
        openFlowConceptVisualViewer({ attachment: current.attachment, raster: current.asset }, invoker, fallback ?? undefined); };
    if (!saved)
        return [options.action("Add visual", openEditor)];
    return [options.action("View visual", view), options.action("Edit visual", openEditor), options.action("Replace visual", openEditor), options.action("Remove visual", () => options.persist(removeFlowConceptVisual(options.state(), options.flowId, options.target), `Removed concept visual from ${options.label}; Undo available.`))];
}
export function flowConceptVisualHeightExtension(project, flowId, target, mode, zoom) {
    return mode === "Thumbnails" && zoom >= .5 && Boolean(flowConceptVisual(project, flowId, target)) ? 104 : 0;
}
const svg = (name) => document.createElementNS("http://www.w3.org/2000/svg", name);
export function renderFlowConceptVisual(options) {
    const visual = flowConceptVisual(options.project, options.flowId, options.target);
    if (!visual || options.mode === "Hidden")
        return;
    const badge = svg("text");
    badge.dataset.flowVisualBadge = options.target.id;
    badge.setAttribute("x", "10");
    badge.setAttribute("y", "44");
    badge.textContent = "▧ Visual";
    badge.setAttribute("aria-label", `View visual: ${visual.attachment.description}`);
    if (options.mode !== "Thumbnails") {
        options.group.append(badge);
        return;
    }
    badge.dataset.flowVisualFallback = "true";
    badge.style.display = "none";
    const foreign = svg("foreignObject"), image = document.createElement("img");
    foreign.dataset.flowVisualThumbnail = options.target.id;
    foreign.setAttribute("x", "8");
    foreign.setAttribute("y", String(options.height - 96));
    foreign.setAttribute("width", String(options.width - 16));
    foreign.setAttribute("height", "88");
    image.src = visual.asset.bytes;
    image.alt = visual.attachment.description;
    Object.assign(image.style, { width: "100%", height: "100%", aspectRatio: "16 / 10", objectFit: "contain" });
    foreign.append(image);
    foreign.style.display = "";
    options.group.append(foreign, badge);
}
//# sourceMappingURL=concept-visual-workspace.js.map