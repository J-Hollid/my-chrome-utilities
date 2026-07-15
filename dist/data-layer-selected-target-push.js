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
async function executePreparedTargetPush(prepared, target, pushToPage, feedback) {
    try {
        await pushToPage({
            tabId: target.tabId,
            destination: prepared.destination,
            eventName: prepared.eventName,
            payload: structuredClone(prepared.payload),
        });
        return {
            success: true,
            result: feedback.success,
            summary: summary(target, prepared.destination, feedback.success),
        };
    }
    catch (error) {
        const result = feedback.failure(error);
        return {
            success: false,
            result,
            summary: summary(target, prepared.destination, result),
        };
    }
}
export async function pushSavedTemplateToSelectedTarget(template, target, pushToPage) {
    if (!target) {
        const result = "Select a target before pushing";
        return { success: false, result, summary: result };
    }
    if (target.accessState !== "Ready") {
        const result = `Request access for ${target.title}`;
        return { success: false, result, summary: result };
    }
    const pathError = pushDestinationPathError(template.destination);
    if (pathError) {
        const result = `Invalid push destination path ${template.destination}`;
        return { success: false, result, summary: result };
    }
    return executePreparedTargetPush({
        destination: template.destination,
        eventName: template.eventName,
        payload: template.payload,
    }, target, pushToPage, {
        success: `Pushed ${template.name} to ${target.title}`,
        failure: () => `Push to ${target.title} failed`,
    });
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
    return executePreparedTargetPush({
        destination,
        eventName: editor.template.eventName,
        payload: editor.draft,
    }, target, pushToPage, {
        success: "Pushed",
        failure: (error) => error instanceof Error ? error.message : "Push failed",
    });
}
//# sourceMappingURL=data-layer-selected-target-push.js.map