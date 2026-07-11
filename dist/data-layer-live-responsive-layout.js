export function liveResponsiveLayout(state, width) {
    if (!state.inspectorEventId)
        return "feed-only";
    return width >= 700 ? "wide-detail" : "narrow-detail";
}
//# sourceMappingURL=data-layer-live-responsive-layout.js.map