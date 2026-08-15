export const FLOW_CONCEPT_VISUAL_MAX_VIEWER_SCALE = 4;
export const flowConceptVisualFitScale = (raster, viewport) => Math.min(1, viewport.width / raster.width, viewport.height / raster.height);
export const flowConceptVisualViewerPanLimit = ({ raster, viewport }, scale) => ({ x: Math.max(0, (raster.width * scale - viewport.width) / 2), y: Math.max(0, (raster.height * scale - viewport.height) / 2) });
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
export const clampedFlowConceptVisualViewerState = ({ raster, viewport }, state) => { const limit = flowConceptVisualViewerPanLimit({ raster, viewport }, state.scale); return { scale: state.scale, x: clamp(state.x, -limit.x, limit.x), y: clamp(state.y, -limit.y, limit.y) }; };
export const flowConceptVisualPan = (geometry, delta) => clampedFlowConceptVisualViewerState(geometry, { ...geometry.state, x: geometry.state.x + delta.x, y: geometry.state.y + delta.y });
export const flowConceptVisualZoomAt = (geometry, requestedScale, anchor) => {
    const { raster, viewport, state } = geometry, scale = clamp(requestedScale, flowConceptVisualFitScale(raster, viewport), FLOW_CONCEPT_VISUAL_MAX_VIEWER_SCALE), oldLeft = (viewport.width - raster.width * state.scale) / 2 + state.x, oldTop = (viewport.height - raster.height * state.scale) / 2 + state.y, imageX = (anchor.x - oldLeft) / state.scale, imageY = (anchor.y - oldTop) / state.scale, newLeft = anchor.x - imageX * scale, newTop = anchor.y - imageY * scale;
    return clampedFlowConceptVisualViewerState(geometry, { scale, x: newLeft - (viewport.width - raster.width * scale) / 2, y: newTop - (viewport.height - raster.height * scale) / 2 });
};
//# sourceMappingURL=concept-visual-viewer-state.js.map