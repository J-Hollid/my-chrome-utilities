import type { PropertyEditorState } from "./data-layer-event-library-editor.js";
import type { ObservationTarget } from "./data-layer-observation-targets.js";
import type { JsonValue } from "./data-layer-event-library-editor.js";

export interface PushDraftReviewChange {
  path: string;
  previous: string;
  pushed: string;
  change: "added" | "removed" | "changed";
}

export interface PushDraftReview {
  editor: PropertyEditorState;
  target: ObservationTarget;
  summary: string;
  confirmLabel: string;
  rows: readonly (readonly [string, string])[];
  changes: readonly PushDraftReviewChange[];
}

const absent = "Not present";
const display = (value: unknown): string => value === undefined ? absent : typeof value === "string" ? value : JSON.stringify(value);

function changesBetween(
  previous: unknown,
  pushed: unknown,
  path = "",
): PushDraftReviewChange[] {
  if (previous === pushed) return [];
  const previousRecord = previous !== null && typeof previous === "object";
  const pushedRecord = pushed !== null && typeof pushed === "object";
  if (previousRecord || pushedRecord) {
    const array = Array.isArray(previous) || Array.isArray(pushed);
    const previousEntries = Array.isArray(previous)
      ? Array.from({ length: previous.length }, (_, index) => String(index))
      : previousRecord ? Object.keys(previous as Record<string, unknown>) : [];
    const pushedEntries = Array.isArray(pushed)
      ? Array.from({ length: pushed.length }, (_, index) => String(index))
      : pushedRecord ? Object.keys(pushed as Record<string, unknown>) : [];
    const keys = [...new Set([...previousEntries, ...pushedEntries])];
    return keys.flatMap((key) => changesBetween(
      previousRecord ? (previous as Record<string, unknown>)[key] : undefined,
      pushedRecord ? (pushed as Record<string, unknown>)[key] : undefined,
      path ? (array ? `${path}[${key}]` : `${path}.${key}`) : key,
    ));
  }
  return [{ path, previous: display(previous), pushed: display(pushed), change: previous === undefined ? "added" : pushed === undefined ? "removed" : "changed" }];
}

export function createPushDraftReview(
  editor: PropertyEditorState,
  target: ObservationTarget,
): PushDraftReview {
  const reviewedEditor = structuredClone(editor);
  const reviewedTarget = structuredClone(target);
  const saved = reviewedEditor.savedTemplate ?? reviewedEditor.template;
  const identityAndExecution = [
    ...(saved.name === reviewedEditor.template.name ? [] : [["Template name", `${saved.name} → ${reviewedEditor.template.name}`] as const]),
    ...(saved.eventName === reviewedEditor.template.eventName ? [] : [["Event name", `${saved.eventName} → ${reviewedEditor.template.eventName}`] as const]),
    ...(saved.destination === reviewedEditor.template.destination ? [] : [["Destination", `${saved.destination} → ${reviewedEditor.template.destination}`] as const]),
  ];
  return {
    editor: reviewedEditor,
    target: reviewedTarget,
    summary: `${reviewedEditor.template.eventName}; ${reviewedTarget.title}; ${reviewedTarget.pageUrl}; ${reviewedEditor.template.destination}; version ${reviewedEditor.template.version}; ${reviewedEditor.template.validation}.`,
    confirmLabel: `Push ${reviewedEditor.template.eventName} to the active target`,
    rows: [["Event", reviewedEditor.template.eventName], ["Target title", reviewedTarget.title], ["Target URL", reviewedTarget.pageUrl], ["Destination", reviewedEditor.template.destination], ["Version", String(reviewedEditor.template.version)], ["Validation", reviewedEditor.template.validation], ...identityAndExecution],
    changes: changesBetween(reviewedEditor.template.payload as JsonValue, reviewedEditor.draft),
  };
}
