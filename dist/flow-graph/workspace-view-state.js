import { flowWorkspaceKey, initialFlowWorkspaceView, } from "./workspace.js";
const viewByWorkspace = new Map();
const invokingFocusByWorkspace = new Map();
function storageKey(projectId, flowId) {
    return `my-chrome-utilities.flow-view.v1:${projectId}:${flowId}`;
}
function readStoredView(projectId, flowId) {
    try {
        const stored = sessionStorage.getItem(storageKey(projectId, flowId));
        return stored ? JSON.parse(stored) : undefined;
    }
    catch {
        return undefined;
    }
}
export function flowWorkspaceView(projectId, flowId) {
    const key = flowWorkspaceKey(projectId, flowId);
    const memory = viewByWorkspace.get(key);
    if (memory)
        return memory;
    const stored = readStoredView(projectId, flowId);
    const initial = initialFlowWorkspaceView();
    const restored = {
        ...initial,
        ...(stored ?? {}),
        camera: stored?.viewport ?? stored?.camera ?? initial.camera,
    };
    viewByWorkspace.set(key, restored);
    return restored;
}
export function saveFlowWorkspaceView(projectId, flowId, view) {
    const key = flowWorkspaceKey(projectId, flowId);
    viewByWorkspace.set(key, view);
    try {
        const prior = JSON.parse(sessionStorage.getItem(storageKey(projectId, flowId)) ?? "{}");
        sessionStorage.setItem(storageKey(projectId, flowId), JSON.stringify({
            ...prior,
            viewport: view.camera,
            minimap: view.minimap,
            surface: view.surface,
            focusCanvas: view.focusCanvas,
        }));
    }
    catch {
        // Session UI state is best-effort and never enters project bytes.
    }
}
export function rememberFlowInvoker(projectId, flowId, invoker) {
    invokingFocusByWorkspace.set(flowWorkspaceKey(projectId, flowId), invoker);
}
export function restoreFlowInvoker(projectId, flowId) {
    const key = flowWorkspaceKey(projectId, flowId);
    invokingFocusByWorkspace.get(key)?.focus({ preventScroll: true });
    invokingFocusByWorkspace.delete(key);
}
//# sourceMappingURL=workspace-view-state.js.map