export const GUIDED_CONTINUATION_STORAGE_KEY = "my-chrome-utilities.guided-validation-continuations.v1";

export interface GuidedContinuationEvent {
  sourceId: string;
  name: string;
}

export interface GuidedContinuationSchema {
  id: string;
  name: string;
  version: number;
  workingDraft?: { pendingChanges: readonly string[] };
}

export type GuidedContinuationSelections = Readonly<Record<string, string>>;

export function continuationEventKey(event: GuidedContinuationEvent): string {
  return `${event.sourceId}\u0000${event.name}`;
}

export function restoreGuidedContinuationSelections(serialized: string | null): GuidedContinuationSelections {
  if (!serialized) return {};
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  } catch {
    return {};
  }
}

export function selectGuidedContinuation(
  selections: GuidedContinuationSelections,
  event: GuidedContinuationEvent,
  schemaId: string,
): GuidedContinuationSelections {
  return { ...selections, [continuationEventKey(event)]:schemaId };
}

export function selectedGuidedContinuation<T extends GuidedContinuationSchema>(
  selections: GuidedContinuationSelections,
  event: GuidedContinuationEvent,
  schemas: readonly T[],
): T | undefined {
  const schemaId = selections[continuationEventKey(event)];
  return schemas.find((schema) => schema.id === schemaId && Boolean(schema.workingDraft));
}
