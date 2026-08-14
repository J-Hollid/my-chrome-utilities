import { saveStoredGraph, storedGraph } from "../data-layer-flow-graph.js";
import { transactProject } from "../data-layer-specification-project.js";
import { pruneUnreferencedFlowConceptVisualAssets } from "./concept-visual-references.js";
export const FLOW_CONCEPT_VISUAL_LIMITS = { sourceBytes: 5 * 1024 * 1024, dimension: 4096, pixels: 16_000_000, projectBytes: 25 * 1024 * 1024 };
export function validateFlowConceptVisualSource(input) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(input.mediaType))
        return { valid: false, diagnostic: "Choose a PNG, JPEG, or WebP image" };
    if (input.sourceByteLength > FLOW_CONCEPT_VISUAL_LIMITS.sourceBytes)
        return { valid: false, diagnostic: "The visual is too large" };
    if (input.width > FLOW_CONCEPT_VISUAL_LIMITS.dimension || input.height > FLOW_CONCEPT_VISUAL_LIMITS.dimension)
        return { valid: false, diagnostic: "The visual dimensions exceed 4096 pixels" };
    if (input.width * input.height > FLOW_CONCEPT_VISUAL_LIMITS.pixels)
        return { valid: false, diagnostic: "The visual exceeds 16 megapixels" };
    if ((input.projectStoredBytes ?? 0) + input.byteLength > FLOW_CONCEPT_VISUAL_LIMITS.projectBytes)
        return { valid: false, diagnostic: "This project has reached its 25 MiB visual limit" };
    return { valid: true };
}
export const flowConceptVisualAssets = (project) => project.conceptVisualAssets ?? [];
const assets = (project) => [...flowConceptVisualAssets(project)];
export const flowConceptVisualAttachment = (project, flowId, target) => {
    const graph = storedGraph(project, flowId);
    return (target.kind === "page-frame" ? graph.pageFrames : graph.occurrences).find(({ id }) => id === target.id)?.conceptVisual;
};
const withAttachment = (project, flowId, target, next) => {
    const graph = storedGraph(project, flowId), update = (item) => item.id === target.id ? { ...item, ...(next ? { conceptVisual: next } : {}), ...(!next && "conceptVisual" in item ? { conceptVisual: undefined } : {}) } : item;
    const changed = target.kind === "page-frame" ? { ...graph, pageFrames: graph.pageFrames.map(update) } : { ...graph, occurrences: graph.occurrences.map(update) };
    if (!(target.kind === "page-frame" ? graph.pageFrames : graph.occurrences).some(({ id }) => id === target.id))
        throw new Error(`Unknown Flow visual target ${target.id}.`);
    return pruneUnreferencedFlowConceptVisualAssets(saveStoredGraph(project, flowId, changed));
};
export function attachFlowConceptVisual(state, flowId, target, input, id) {
    const description = input.description.trim();
    if (!description)
        throw new Error("Description is required");
    return transactProject(state, "Save Flow concept visual", (project) => {
        const prior = flowConceptVisualAttachment(project, flowId, target), existing = assets(project).find(({ digest }) => digest === input.raster.digest), asset = existing ?? { id: id("concept-visual-asset"), ...structuredClone(input.raster) }, visualAssets = existing ? assets(project) : [...assets(project), asset], saved = { ...project, conceptVisualAssets: visualAssets };
        return withAttachment(saved, flowId, target, { id: prior?.id ?? id("concept-visual-attachment"), assetId: asset.id, description, ...(input.caption?.trim() ? { caption: input.caption.trim() } : {}), ...(input.sourceReference?.trim() ? { sourceReference: input.sourceReference.trim() } : {}) });
    });
}
export function flowConceptVisual(project, flowId, target) {
    const visual = flowConceptVisualAttachment(project, flowId, target), asset = visual && flowConceptVisualAssets(project).find(({ id }) => id === visual.assetId);
    return visual && asset ? { attachment: visual, asset } : undefined;
}
export function duplicateFlowConceptVisualAttachment(state, flowId, source, target, id) {
    const visual = flowConceptVisualAttachment(state.project, flowId, source);
    if (!visual)
        throw new Error("The source Flow item has no concept visual.");
    return transactProject(state, "Duplicate Flow concept visual", (project) => withAttachment(project, flowId, target, { ...structuredClone(visual), id: id("concept-visual-attachment") }));
}
export function removeFlowConceptVisual(state, flowId, target) {
    if (!flowConceptVisualAttachment(state.project, flowId, target))
        return state;
    return transactProject(state, "Remove Flow concept visual", (project) => withAttachment(project, flowId, target, undefined));
}
//# sourceMappingURL=concept-visuals.js.map