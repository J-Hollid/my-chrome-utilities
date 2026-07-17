export function scopedUtilityModulePath(scope) {
    switch (scope.utilityId) {
        case "command-palette":
            return "./utilities/command-palette/index.js";
        case "hotkeys":
            return "./utilities/hotkeys/index.js";
        case "data-layer":
            return "./utilities/data-layer/index.js";
        default:
            throw new Error(`Unknown utility scope: ${scope.utilityId}`);
    }
}
//# sourceMappingURL=utility-bootstrap.js.map