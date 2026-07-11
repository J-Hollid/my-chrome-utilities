const pathSegment = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const unsafePathSegments = new Set(["__proto__", "constructor", "prototype"]);
export function pushDestinationPathError(path) {
    const segments = path.split(".");
    if (!path.trim() ||
        segments.some((segment) => !pathSegment.test(segment) || unsafePathSegments.has(segment))) {
        return "Invalid push destination path.";
    }
    return undefined;
}
function summary(target, destination, result) {
    return `${target.title}; ${target.pageUrl}; ${destination}; ${result}.`;
}
export async function pushTemplateToSelectedTarget(editor, target, pushToPage) {
    const destination = editor.template.destination;
    if (!target || target.accessState !== "Ready") {
        const result = "A ready observation target must be selected.";
        return { success: false, result, summary: result };
    }
    const pathError = pushDestinationPathError(destination);
    if (pathError) {
        return {
            success: false,
            result: pathError,
            fieldError: pathError,
            summary: summary(target, destination, pathError),
        };
    }
    if (editor.jsonError) {
        return {
            success: false,
            result: editor.jsonError,
            summary: summary(target, destination, editor.jsonError),
        };
    }
    try {
        await pushToPage({
            tabId: target.tabId,
            destination,
            payload: structuredClone(editor.draft),
        });
        return { success: true, result: "Pushed", summary: summary(target, destination, "Pushed") };
    }
    catch (error) {
        const result = error instanceof Error ? error.message : "Push failed";
        return { success: false, result, summary: summary(target, destination, result) };
    }
}
//# sourceMappingURL=data-layer-selected-target-push.js.map