export type ObservationTargetAccessState =
  | "Ready"
  | "Permission required"
  | "Restricted"
  | "Closed";

export type ObservationTargetSessionState =
  | "Detached"
  | "Attached"
  | "Target unavailable";

export interface ObservationTarget {
  id: string;
  tabId: number;
  windowId: number;
  pageUrl: string;
  title: string;
  origin: string;
  accessState: ObservationTargetAccessState;
  activeTab?: boolean;
  currentWindow?: boolean;
  priorSession?: boolean;
}

export interface ObservationTargetState {
  targets: readonly ObservationTarget[];
  selectedTargetId?: string | undefined;
  attachedTargetId?: string | undefined;
  recentTargetId?: string | undefined;
  sessionState: ObservationTargetSessionState;
}

export interface TargetOperationResult {
  state: ObservationTargetState;
  result: string;
}

const accessExplanations: Record<ObservationTargetAccessState, string> = {
  Ready: "Page can be observed",
  "Permission required": "Site access is required",
  Restricted: "Chrome pages cannot be observed",
  Closed: "The browser tab is no longer available",
};

export function observationTargetId(tabId: number, windowId: number): string {
  return `tab:${tabId}:window:${windowId}`;
}

export function targetAccessForUrl(pageUrl: string): ObservationTargetAccessState {
  try {
    const { protocol } = new URL(pageUrl);
    return protocol === "http:" || protocol === "https:"
      ? "Ready"
      : "Restricted";
  } catch {
    return "Closed";
  }
}

export function targetAccessExplanation(
  accessState: ObservationTargetAccessState,
  pageUrl?: string,
): string {
  if (accessState === "Restricted" && pageUrl?.startsWith("chrome-extension:")) {
    return "Extension pages cannot be observed";
  }
  return accessExplanations[accessState];
}

export function createObservationTarget(
  target: Omit<ObservationTarget, "id" | "origin" | "accessState"> &
    Partial<Pick<ObservationTarget, "id" | "origin" | "accessState">>,
): ObservationTarget {
  const accessState = target.accessState ?? targetAccessForUrl(target.pageUrl);
  let origin = target.origin;
  if (!origin) {
    try {
      origin = new URL(target.pageUrl).origin;
    } catch {
      origin = "";
    }
  }
  return {
    ...target,
    id: target.id ?? observationTargetId(target.tabId, target.windowId),
    origin,
    accessState,
  };
}

export function createObservationTargetState(
  targets: readonly ObservationTarget[] = [],
): ObservationTargetState {
  return { targets: [...targets], sessionState: "Detached" };
}

export function selectedObservationTarget(
  state: ObservationTargetState,
): ObservationTarget | undefined {
  return state.targets.find(({ id }) => id === state.selectedTargetId);
}

export function attachedObservationTarget(
  state: ObservationTargetState,
): ObservationTarget | undefined {
  return state.targets.find(({ id }) => id === state.attachedTargetId);
}

export function registerObservationTarget(
  state: ObservationTargetState,
  target: ObservationTarget,
): ObservationTargetState {
  const existing = state.targets.find(({ id }) => id === target.id);
  return {
    ...state,
    targets: existing
      ? state.targets.map((candidate) => candidate.id === target.id ? target : candidate)
      : [...state.targets, target],
  };
}

export function selectObservationTarget(
  state: ObservationTargetState,
  targetId: string,
): ObservationTargetState {
  if (!state.targets.some(({ id }) => id === targetId)) return state;
  return { ...state, selectedTargetId: targetId };
}

export function orderedObservationTargets(
  state: ObservationTargetState,
): ObservationTarget[] {
  const selected = selectedObservationTarget(state);
  const active = state.targets.find(({ activeTab }) => activeTab);
  const recent = state.targets.find(({ id }) => id === state.recentTargetId);
  const first = [selected, active, recent].filter(
    (target): target is ObservationTarget => target !== undefined,
  );
  const firstIds = new Set(first.map(({ id }) => id));
  return [...first, ...state.targets.filter(({ id }) => !firstIds.has(id))];
}

export function findObservationTargets(
  state: ObservationTargetState,
  query: string,
): ObservationTarget[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return orderedObservationTargets(state);
  return orderedObservationTargets(state).filter((target) =>
    [target.title, target.pageUrl, target.origin, `${target.windowId}`]
      .some((value) => value.toLowerCase().includes(needle)),
  );
}

export function attachSelectedObservationTarget(
  state: ObservationTargetState,
): TargetOperationResult {
  const target = selectedObservationTarget(state);
  if (!target) return { state, result: "Selection required" };
  if (target.accessState !== "Ready") return { state, result: target.accessState };
  if (state.attachedTargetId && state.attachedTargetId !== target.id) {
    return { state, result: "End current session before attaching selected target" };
  }
  return {
    state: { ...state, attachedTargetId: target.id, recentTargetId: target.id, sessionState: "Attached" },
    result: "Attached",
  };
}

export function endAndAttachObservationTarget(
  state: ObservationTargetState,
  targetId: string,
): TargetOperationResult {
  const selected = selectObservationTarget(state, targetId);
  const target = selectedObservationTarget(selected);
  if (!target) return { state, result: "Selection required" };
  if (target.accessState !== "Ready") return { state: selected, result: target.accessState };
  return {
    state: { ...selected, attachedTargetId: target.id, recentTargetId: target.id, sessionState: "Attached" },
    result: "Attached",
  };
}

export function detachObservationTarget(
  state: ObservationTargetState,
): ObservationTargetState {
  const target = attachedObservationTarget(state);
  return {
    ...state,
    attachedTargetId: undefined,
    recentTargetId: target?.id ?? state.recentTargetId,
    sessionState: "Detached",
  };
}

export function updateObservationTargetAccess(
  state: ObservationTargetState,
  targetId: string,
  accessState: ObservationTargetAccessState,
): ObservationTargetState {
  const wasAttached = state.attachedTargetId === targetId;
  return {
    ...state,
    targets: state.targets.map((target) => target.id === targetId
      ? { ...target, accessState }
      : target),
    ...(wasAttached && accessState !== "Ready"
      ? { attachedTargetId: undefined, sessionState: accessState === "Closed" ? "Target unavailable" : "Detached" }
      : {}),
  };
}

export function navigateObservationTarget(
  state: ObservationTargetState,
  tabId: number,
  pageUrl: string,
): ObservationTargetState {
  return {
    ...state,
    targets: state.targets.map((target) => target.tabId === tabId
      ? createObservationTarget({ ...target, pageUrl, accessState: targetAccessForUrl(pageUrl) })
      : target),
  };
}

export function closeObservationTarget(
  state: ObservationTargetState,
  tabId: number,
): ObservationTargetState {
  const target = state.targets.find((candidate) => candidate.tabId === tabId);
  return target
    ? updateObservationTargetAccess(state, target.id, "Closed")
    : state;
}
