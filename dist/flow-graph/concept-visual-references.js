export function pruneUnreferencedFlowConceptVisualAssets(project) {
    const visualProject = project;
    if (!visualProject.conceptVisualAssets)
        return project;
    const referenced = new Set(Object.values(visualProject.documentationFlowGraphs ?? {}).flatMap((graph) => [...(graph.pageFrames ?? []), ...(graph.occurrences ?? [])].flatMap(({ conceptVisual }) => conceptVisual?.assetId ? [conceptVisual.assetId] : [])));
    const retained = visualProject.conceptVisualAssets.filter(({ id }) => referenced.has(id));
    return retained.length === visualProject.conceptVisualAssets.length ? project : { ...project, conceptVisualAssets: retained };
}
//# sourceMappingURL=concept-visual-references.js.map