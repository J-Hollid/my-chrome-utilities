import {
  createEditableTemplate,
  type EditableEventTemplate,
} from "./data-layer-event-library-editor.js";
import type { LiveEvent } from "./data-layer-live-observer.js";
import type { ValidationState } from "./data-layer-source.js";

export interface LiveInspectorActions {
  copyPayload(event: LiveEvent): Promise<void>;
  saveToLibrary(event: LiveEvent): void;
  createSchema?(event: LiveEvent): void;
  createValidation?(event: LiveEvent): void;
  draftContinuation?(event: LiveEvent): LiveDraftContinuation | undefined;
  startDefectReport?(event: LiveEvent): void;
  validationAvailability(event: LiveEvent): { enabled: boolean; reason?: string };
  validate(event: LiveEvent): void;
  manualSchemaChoices(event: LiveEvent): readonly { id: string; label: string }[];
  selectManualSchema(eventId: string, schemaId: string | undefined): void;
}

export interface LiveDraftContinuation {
  schemaId: string;
  schemaName: string;
  schemaVersion: number;
  pendingChanges: number;
  addProperty(): void;
  review(): void;
  publish(): void;
  useDifferent(): void;
}

export interface LiveInspectorActionEffects {
  currentPageUrl(): string;
  writeClipboard(text: string): Promise<void>;
  storeTemplate(template: EditableEventTemplate): void;
  createSchema?(event: LiveEvent): void;
  createValidation?(event: LiveEvent): void;
  draftContinuation?(event: LiveEvent): LiveDraftContinuation | undefined;
  startDefectReport?(event: LiveEvent): void;
  onTemplateSaved?(template: EditableEventTemplate): void;
  validationAvailable?(event: LiveEvent): boolean;
  validationState(event: LiveEvent): ValidationState;
  updateValidation(eventId: string, state: ValidationState): void;
  manualSchemaChoices?(event: LiveEvent): readonly { id: string; label: string }[];
  selectManualSchema?(eventId: string, schemaId: string | undefined): void;
}

export type LiveInspectorFeedback = (message: string) => void;

export function createLiveInspectorActions(
  effects: LiveInspectorActionEffects,
): LiveInspectorActions {
  return {
    async copyPayload(event) {
      await effects.writeClipboard(JSON.stringify(event.payload));
    },
    saveToLibrary(event) {
      const template = createEditableTemplate({
        id: event.id,
        sessionId: event.sessionId ?? "live",
        sourceId: event.sourceId,
        sourceKind: event.sourceKind ?? "page",
        name: event.name,
        captureTime: event.captureTime,
        pageUrl: event.pageUrl ?? effects.currentPageUrl(),
        payload: event.payload,
        rawInput: event.rawInput ?? event,
        validation: event.validation ?? "Not checked",
        provenance: event.provenance ?? "live",
      }, {
        name: event.name,
        destination: event.destination ?? "event.history",
        sourceName: event.sourceName ?? event.sourceId,
      });
      effects.storeTemplate(template);
      effects.onTemplateSaved?.(template);
    },
    ...(effects.createSchema ? { createSchema(event: LiveEvent) { effects.createSchema?.(event); } } : {}),
    ...(effects.createValidation ? { createValidation(event: LiveEvent) { effects.createValidation?.(event); } } : {}),
    ...(effects.draftContinuation ? { draftContinuation(event: LiveEvent) { return effects.draftContinuation?.(event); } } : {}),
    ...(effects.startDefectReport ? { startDefectReport(event: LiveEvent) { effects.startDefectReport?.(event); } } : {}),
    validationAvailability(event) {
      return effects.validationAvailable?.(event) === false
        ? { enabled: false, reason: "Select a schema to validate" }
        : { enabled: true };
    },
    validate(event) {
      const previous = event.validation ?? "Not checked";
      const next = effects.validationState(event);
      if (next === previous) {
        throw new Error("Validation did not change the event state.");
      }
      effects.updateValidation(event.id, next);
    },
    manualSchemaChoices(event) { return effects.manualSchemaChoices?.(event) ?? []; },
    selectManualSchema(eventId, schemaId) { effects.selectManualSchema?.(eventId, schemaId); },
  };
}

export async function runLiveInspectorAction(
  label: string,
  event: LiveEvent,
  action: (event: LiveEvent) => void | Promise<void>,
  report: LiveInspectorFeedback,
): Promise<void> {
  report("");
  try {
    await action(event);
    report(`${label} completed for ${event.name}.`);
  } catch {
    report(`${label} failed for ${event.name}.`);
  }
}
