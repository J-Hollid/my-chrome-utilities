export function flowWheelZoomFactor(input) {
    if (!input.canvasTarget || input.deltaY === 0)
        return undefined;
    return input.deltaY < 0 ? 1.1 : .9;
}
//# sourceMappingURL=workspace-wheel-zoom.js.map