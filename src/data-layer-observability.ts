import {
  eventFeed,
  type SourceAdapter,
  type SourceEvent,
} from "./data-layer-source.js";

export * from "./data-layer-source.js";

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

export function saveEventTemplate(
  event: SourceEvent,
  name: string,
  destination: string,
): EventTemplate {
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

export function reviseTemplate(
  template: EventTemplate,
  payload: unknown,
): EventTemplate {
  return {
    ...template,
    payload: structuredClone(payload),
    version: template.version + 1,
  };
}

export function duplicateTemplate(
  template: EventTemplate,
  name: string,
): EventTemplate {
  return {
    ...template,
    id: `${template.id}:copy`,
    name,
    payload: structuredClone(template.payload),
  };
}

export function saveSession(
  id: string,
  name: string,
  events: readonly SourceEvent[],
  createdAt: string,
): SavedSession {
  return {
    id,
    name,
    events: events.map((event) => structuredClone(event)),
    sourceIds: [...new Set(events.map((event) => event.sourceId))],
    pageScope: events[0]?.pageUrl ?? "",
    createdAt,
  };
}

export function sequenceFromSession(
  session: SavedSession,
  name: string,
  templates: readonly EventTemplate[],
): TestSequence {
  const templateForEvent = new Map(
    templates.map((template) => [template.originatingEventId, template]),
  );
  return {
    id: `sequence:${session.id}`,
    name,
    steps: session.events.flatMap((event, index) => {
      const template = templateForEvent.get(event.id);
      return template
        ? [
            {
              id: `step:${index + 1}`,
              templateId: template.id,
              templateVersion: template.version,
              enabled: true,
              destination: template.destination,
            },
          ]
        : [];
    }),
  };
}

export function runnableSteps(
  sequence: TestSequence,
  templates: readonly EventTemplate[],
  adapters: readonly SourceAdapter[],
): SequenceStep[] {
  const adapterById = new Map(adapters.map((adapter) => [adapter.id, adapter]));
  const templateById = new Map(
    templates.map((template) => [template.id, template]),
  );
  return sequence.steps.filter((step) => {
    const template = templateById.get(step.templateId);
    return (
      step.enabled &&
      !!template &&
      adapterById.get(template.sourceId)?.capabilities.includes("push")
    );
  });
}
