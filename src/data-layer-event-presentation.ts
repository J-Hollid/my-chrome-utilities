import type { SourceEvent, ValidationState } from "./data-layer-source.js";

export interface CaptureContext { sessionId: string; sourceId: string; sourceKind: string; pageUrl: string; destination: string; }
export interface SubscriptionState { current?: { pageUrl: string; historyPath: string; requestId: string }; imported: ReadonlySet<string>; activeCount: number; }

function clone<T>(value: T): T { return structuredClone(value); }
function inputName(raw: unknown): string {
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  if (raw && typeof raw === "object" && typeof (raw as { event?: unknown }).event === "string") return (raw as { event: string }).event;
  return "Unknown event";
}
function inputPayload(raw: unknown): unknown {
  if (Array.isArray(raw)) return clone(raw[1]);
  if (raw && typeof raw === "object") { const { event: _event, ...payload } = raw as Record<string, unknown>; return clone(payload); }
  return undefined;
}

export function canonicalCapturedEvent(context: CaptureContext, rawInput: unknown, captureTime: string, ordinal: number, sourceTime?: string): SourceEvent {
  return { id: `${context.sessionId}:${context.sourceId}:${context.pageUrl}:${ordinal}`, sessionId: context.sessionId, sourceId: context.sourceId, sourceKind: context.sourceKind, name: inputName(rawInput), captureTime, ...(sourceTime ? { sourceTime } : {}), pageUrl: context.pageUrl, payload: inputPayload(rawInput), rawInput: clone(rawInput), validation: "Not checked" as ValidationState, provenance: `captured:${context.sourceId}` };
}

export function importExistingHistory(context: CaptureContext, inputs: readonly unknown[], captureTime: string): SourceEvent[] {
  return inputs.map((input, index) => canonicalCapturedEvent(context, input, captureTime, index + 1));
}

export function nextSubscription(state: SubscriptionState, pageUrl: string, historyPath: string, requestId: string): SubscriptionState {
  return { ...state, current: { pageUrl, historyPath, requestId }, activeCount: 1 };
}
export function requestIsCurrent(state: SubscriptionState, requestId: string): boolean { return state.current?.requestId === requestId; }
export function importedOnce(state: SubscriptionState, pageUrl: string, historyPath: string, index: number): boolean { return state.imported.has(`${pageUrl}:${historyPath}:${index}`); }
export function markImported(state: SubscriptionState, pageUrl: string, historyPath: string, count: number): SubscriptionState { const imported = new Set(state.imported); for (let index=0; index<count; index += 1) imported.add(`${pageUrl}:${historyPath}:${index}`); return { ...state, imported }; }
export function stopSubscription(state: SubscriptionState): SubscriptionState { const { current: _current, ...inactive } = state; return { ...inactive, activeCount: 0 }; }
export function compactCaptureTime(time: string): string { return time.includes("T") ? time.slice(11, 19) : time; }
