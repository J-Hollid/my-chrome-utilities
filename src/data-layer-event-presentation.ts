import type { SourceEvent, ValidationState } from "./data-layer-source.js";

export interface CaptureContext {
  sessionId: string;
  sourceId: string;
  sourceKind: string;
  pageUrl: string;
  destination: string;
}

export interface SubscriptionState {
  current?: { pageUrl: string; historyPath: string; requestId: string };
  imported: ReadonlySet<string>;
  activeCount: number;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function inputName(raw: unknown): string {
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  if (
    raw !== null &&
    typeof raw === "object" &&
    typeof (raw as { event?: unknown }).event === "string"
  ) {
    return (raw as { event: string }).event;
  }
  return "Unknown event";
}

function inputPayload(raw: unknown): unknown {
  if (Array.isArray(raw)) return clone(raw[1]);
  if (raw !== null && typeof raw === "object") {
    const { event: _event, ...payload } = raw as Record<string, unknown>;
    return clone(payload);
  }
  return undefined;
}

export function canonicalCapturedEvent(
  context: CaptureContext,
  rawInput: unknown,
  captureTime: string,
  ordinal: number,
  sourceTime?: string,
): SourceEvent {
  return {
    id: `${context.sessionId}:${context.sourceId}:${context.pageUrl}:${ordinal}`,
    sessionId: context.sessionId,
    sourceId: context.sourceId,
    sourceKind: context.sourceKind,
    name: inputName(rawInput),
    captureTime,
    ...(sourceTime ? { sourceTime } : {}),
    pageUrl: context.pageUrl,
    payload: inputPayload(rawInput),
    rawInput: clone(rawInput),
    validation: "Not checked" as ValidationState,
    provenance: `captured:${context.sourceId}`,
  };
}

export function importExistingHistory(
  context: CaptureContext,
  inputs: readonly unknown[],
  captureTime: string,
  firstOrdinal = 1,
): SourceEvent[] {
  return inputs.map((input, index) =>
    canonicalCapturedEvent(context, input, captureTime, firstOrdinal + index),
  );
}

function importKey(pageUrl: string, historyPath: string, index: number): string {
  return JSON.stringify([pageUrl, historyPath, index]);
}

export function nextSubscription(
  state: SubscriptionState,
  pageUrl: string,
  historyPath: string,
  requestId: string,
): SubscriptionState {
  return {
    ...state,
    current: { pageUrl, historyPath, requestId },
    activeCount: 1,
  };
}

export function requestIsCurrent(
  state: SubscriptionState,
  requestId: string,
): boolean {
  return state.current?.requestId === requestId;
}

export function importedOnce(
  state: SubscriptionState,
  pageUrl: string,
  historyPath: string,
  index: number,
): boolean {
  return state.imported.has(importKey(pageUrl, historyPath, index));
}

export function markImported(
  state: SubscriptionState,
  pageUrl: string,
  historyPath: string,
  count: number,
): SubscriptionState {
  const imported = new Set(state.imported);
  for (let index = 0; index < count; index += 1) {
    imported.add(importKey(pageUrl, historyPath, index));
  }
  return { ...state, imported };
}

export function stopSubscription(state: SubscriptionState): SubscriptionState {
  const { current: _current, ...inactive } = state;
  return { ...inactive, activeCount: 0 };
}

export function compactCaptureTime(time: string): string {
  return time.includes("T") ? time.slice(11, 19) : time;
}

export function conciseValuePreview(value: unknown): string {
  if (value === undefined) return "";
  if (value === null || typeof value !== "object") return String(value);
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "";
  const [key, preview] = entries[0] as [string, unknown];
  return `${key} ${
    preview !== null && typeof preview === "object"
      ? JSON.stringify(preview)
      : String(preview)
  }`;
}
