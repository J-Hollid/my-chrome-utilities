import {
  flowWorkspaceKey,
  initialFlowWorkspaceView,
  type FlowWorkspaceView,
} from "./workspace.js";

export interface StoredFlowWorkspaceView extends FlowWorkspaceView {
  viewport?: FlowWorkspaceView["camera"];
}

const viewByWorkspace = new Map<string, FlowWorkspaceView>();
const invokingFocusByWorkspace = new Map<string, HTMLElement>();

function storageKey(projectId: string, flowId: string): string {
  return `my-chrome-utilities.flow-view.v1:${projectId}:${flowId}`;
}

function readStoredView(projectId: string, flowId: string): StoredFlowWorkspaceView | undefined {
  try {
    const stored = sessionStorage.getItem(storageKey(projectId, flowId));
    return stored ? JSON.parse(stored) as StoredFlowWorkspaceView : undefined;
  } catch {
    return undefined;
  }
}

export function flowWorkspaceView(projectId: string, flowId: string): FlowWorkspaceView {
  const key = flowWorkspaceKey(projectId, flowId);
  const memory = viewByWorkspace.get(key);
  if (memory) return memory;
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

export function saveFlowWorkspaceView(projectId: string, flowId: string, view: FlowWorkspaceView): void {
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
  } catch {
    // Session UI state is best-effort and never enters project bytes.
  }
}

export function rememberFlowInvoker(projectId: string, flowId: string, invoker: HTMLElement): void {
  invokingFocusByWorkspace.set(flowWorkspaceKey(projectId, flowId), invoker);
}

export function restoreFlowInvoker(projectId: string, flowId: string): void {
  const key = flowWorkspaceKey(projectId, flowId);
  invokingFocusByWorkspace.get(key)?.focus({ preventScroll: true });
  invokingFocusByWorkspace.delete(key);
}

