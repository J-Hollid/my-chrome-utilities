export type ValidationState = "Not checked" | "Valid" | `${number} issues`;
export type AdapterCapability = "inspect" | "save" | "validate" | "push";
export type ArtifactType =
  | "captured event"
  | "saved session"
  | "event template"
  | "test sequence"
  | "execution record";

export interface SourceAdapter {
  id: string;
  name: string;
  kind: string;
  destination: string;
  enabled: boolean;
  status: string;
  capabilities: readonly AdapterCapability[];
}

export interface SourceEvent {
  id: string;
  sessionId: string;
  sourceId: string;
  sourceKind: string;
  name: string;
  captureTime: string;
  sourceTime?: string;
  pageUrl: string;
  payload: unknown;
  rawInput: unknown;
  validation: ValidationState;
  provenance: string;
}

export interface EventTemplate {
  id: string;
  name: string;
  eventName: string;
  sourceId: string;
  destination: string;
  payload: unknown;
  version: number;
  originatingSessionId: string;
  originatingEventId: string;
  schemaId?: string;
}

export interface SavedSession {
  id: string;
  name: string;
  events: readonly SourceEvent[];
  sourceIds: readonly string[];
  pageScope: string;
  createdAt: string;
}

export interface SequenceStep {
  id: string;
  templateId: string;
  templateVersion: number;
  enabled: boolean;
  destination: string;
  payloadOverride?: unknown;
}

export interface TestSequence {
  id: string;
  name: string;
  steps: readonly SequenceStep[];
}

export interface NormalizedAdapterInput {
  name: string;
  payload: unknown;
  rawInput: unknown;
}

export interface CaptureMetadata {
  eventId: string;
  sessionId: string;
  captureTime: string;
  sourceTime?: string;
  pageUrl: string;
}

export interface SourceManager {
  sources: readonly SourceAdapter[];
  events: readonly SourceEvent[];
}

export interface ArtifactLifecycle {
  contentLifecycle: string;
  executionBehavior: string;
}

const artifactLifecycles: Record<ArtifactType, ArtifactLifecycle> = {
  "captured event": {
    contentLifecycle: "immutable",
    executionBehavior: "not directly executable",
  },
  "saved session": {
    contentLifecycle: "captured content immutable",
    executionBehavior: "not directly executable",
  },
  "event template": {
    contentLifecycle: "versioned edits",
    executionBehavior: "pushable when supported",
  },
  "test sequence": {
    contentLifecycle: "editable steps",
    executionBehavior: "runnable when ready",
  },
  "execution record": {
    contentLifecycle: "immutable",
    executionBehavior: "not executable",
  },
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function normalizeAdapterInput(
  _adapter: SourceAdapter,
  input: unknown,
): NormalizedAdapterInput {
  if (Array.isArray(input) && typeof input[0] === "string") {
    return {
      name: input[0],
      payload: clone(input[1]),
      rawInput: clone(input),
    };
  }

  if (typeof input === "object" && input !== null && !Array.isArray(input)) {
    const record = input as Record<string, unknown>;
    const { event, ...payload } = record;
    return {
      name: typeof event === "string" ? event : "unknown",
      payload: clone(payload),
      rawInput: clone(input),
    };
  }

  return { name: "unknown", payload: clone(input), rawInput: clone(input) };
}

export function adapterActions(adapter: SourceAdapter): readonly AdapterCapability[] {
  return [...adapter.capabilities];
}

export function artifactLifecycle(type: ArtifactType): ArtifactLifecycle {
  return { ...artifactLifecycles[type] };
}

export function createSourceManager(sources: readonly SourceAdapter[] = []): SourceManager {
  return { sources: clone(sources), events: [] };
}

export function addObservationSource(
  manager: SourceManager,
  source: SourceAdapter,
): SourceManager {
  const sources = manager.sources.filter(({ id }) => id !== source.id);
  return { ...manager, sources: [...sources, clone(source)] };
}

export function setObservationSourceEnabled(
  manager: SourceManager,
  sourceId: string,
  enabled: boolean,
): SourceManager {
  return {
    ...manager,
    sources: manager.sources.map((source) =>
      source.id === sourceId ? { ...source, enabled } : source,
    ),
  };
}

export function removeObservationSource(
  manager: SourceManager,
  sourceId: string,
): SourceManager {
  return {
    sources: manager.sources.filter(({ id }) => id !== sourceId),
    events: manager.events,
  };
}

export function captureSourceInput(
  manager: SourceManager,
  sourceId: string,
  input: unknown,
  metadata: CaptureMetadata,
): SourceManager {
  const source = manager.sources.find(({ id }) => id === sourceId);
  if (!source?.enabled || source.status !== "Connected") {
    return manager;
  }

  const normalized = normalizeAdapterInput(source, input);
  const event: SourceEvent = {
    id: metadata.eventId,
    sessionId: metadata.sessionId,
    sourceId: source.id,
    sourceKind: source.kind,
    name: normalized.name,
    captureTime: metadata.captureTime,
    ...(metadata.sourceTime ? { sourceTime: metadata.sourceTime } : {}),
    pageUrl: metadata.pageUrl,
    payload: normalized.payload,
    rawInput: normalized.rawInput,
    validation: "Not checked",
    provenance: `captured:${source.id}`,
  };
  return { ...manager, events: [...manager.events, event] };
}

export function sourceFeed(manager: SourceManager, sourceId?: string): SourceEvent[] {
  return eventFeed(manager.events, sourceId);
}

export function sourceSummaries(manager: SourceManager): SourceAdapter[] {
  return manager.sources.map((source) => clone(source));
}

export function normalizeSourceEvent(input: Omit<SourceEvent, "validation"> & { validation?: ValidationState }): SourceEvent {
  return { ...input, validation: input.validation ?? "Not checked" };
}

export function saveEventTemplate(event: SourceEvent, name: string, destination: string): EventTemplate {
  return {
    id: `template:${event.id}`,
    name,
    eventName: event.name,
    sourceId: event.sourceId,
    destination,
    payload: structuredClone(event.payload),
    version: 1,
    originatingSessionId: event.sessionId,
    originatingEventId: event.id,
  };
}

export function reviseTemplate(template: EventTemplate, payload: unknown): EventTemplate {
  return { ...template, payload: structuredClone(payload), version: template.version + 1 };
}

export function duplicateTemplate(template: EventTemplate, name: string): EventTemplate {
  return { ...template, id: `${template.id}:copy`, name, payload: structuredClone(template.payload) };
}

export function saveSession(id: string, name: string, events: readonly SourceEvent[], createdAt: string): SavedSession {
  return {
    id, name, events: events.map((event) => structuredClone(event)),
    sourceIds: [...new Set(events.map((event) => event.sourceId))],
    pageScope: events[0]?.pageUrl ?? "",
    createdAt,
  };
}

export function sequenceFromSession(session: SavedSession, name: string, templates: readonly EventTemplate[]): TestSequence {
  const templateForEvent = new Map(templates.map((template) => [template.originatingEventId, template]));
  return {
    id: `sequence:${session.id}`,
    name,
    steps: session.events.flatMap((event, index) => {
      const template = templateForEvent.get(event.id);
      return template ? [{ id: `step:${index + 1}`, templateId: template.id, templateVersion: template.version, enabled: true, destination: template.destination }] : [];
    }),
  };
}

export function eventFeed(events: readonly SourceEvent[], sourceId?: string): SourceEvent[] {
  return [...events]
    .filter((event) => !sourceId || event.sourceId === sourceId)
    .sort((left, right) => left.captureTime.localeCompare(right.captureTime));
}

export function runnableSteps(sequence: TestSequence, templates: readonly EventTemplate[], adapters: readonly SourceAdapter[]): SequenceStep[] {
  const adapterById = new Map(adapters.map((adapter) => [adapter.id, adapter]));
  const templateById = new Map(templates.map((template) => [template.id, template]));
  return sequence.steps.filter((step) => {
    const template = templateById.get(step.templateId);
    return step.enabled && !!template && adapterById.get(template.sourceId)?.capabilities.includes("push");
  });
}
