import {
  createEditableTemplate,
  type EditableEventTemplate,
} from "./data-layer-event-library-editor.js";
import type { LiveEvent } from "./data-layer-live-observer.js";
import type { ValidationState } from "./data-layer-source.js";
import type { ValidationEvaluation } from "./data-layer-validation-model.js";
import type { OccurrenceExpectationMode } from "./data-layer-event-occurrence-defect-report.js";

export interface LiveInspectorActions {
  copyPayload(event: LiveEvent): Promise<void>;
  saveToLibrary(event: LiveEvent): void;
  createSchema?(event: LiveEvent): void;
  createValidation?(event: LiveEvent): void;
  addPropertyValidation?(event: LiveEvent, path: string, trigger: HTMLButtonElement): void;
  addPropertyToSchema?(event: LiveEvent, path: string, trigger: HTMLButtonElement): void;
  propertyDeclaration?(event: LiveEvent, path: string): { destination?: string; alreadyDeclared?: boolean };
  expandAllowedValue?(event: LiveEvent, evaluation: ValidationEvaluation, trigger: HTMLButtonElement): void;
  draftContinuation?(event: LiveEvent): LiveDraftContinuation | undefined;
  startDefectReport?(event: LiveEvent): void;
  startOccurrenceDefectReport?(event: LiveEvent, mode: OccurrenceExpectationMode): void;
  openReportedDefect?(defectId: string, event: LiveEvent, issueIndex: number, trigger: HTMLButtonElement): void;
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
  addPropertyValidation?(event: LiveEvent, path: string, trigger: HTMLButtonElement): void;
  addPropertyToSchema?(event: LiveEvent, path: string, trigger: HTMLButtonElement): void;
  propertyDeclaration?(event: LiveEvent, path: string): { destination?: string; alreadyDeclared?: boolean };
  expandAllowedValue?(event: LiveEvent, evaluation: ValidationEvaluation, trigger: HTMLButtonElement): void;
  draftContinuation?(event: LiveEvent): LiveDraftContinuation | undefined;
  startDefectReport?(event: LiveEvent): void;
  startOccurrenceDefectReport?(event: LiveEvent, mode: OccurrenceExpectationMode): void;
  openReportedDefect?(defectId: string, event: LiveEvent, issueIndex: number, trigger: HTMLButtonElement): void;
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
    ...(effects.addPropertyValidation ? { addPropertyValidation(event: LiveEvent, path: string, trigger: HTMLButtonElement) { effects.addPropertyValidation?.(event, path, trigger); } } : {}),
    ...(effects.addPropertyToSchema ? { addPropertyToSchema(event: LiveEvent, path: string, trigger: HTMLButtonElement) { effects.addPropertyToSchema?.(event, path, trigger); } } : {}),
    ...(effects.propertyDeclaration ? { propertyDeclaration(event: LiveEvent, path: string) { return effects.propertyDeclaration?.(event, path) ?? {}; } } : {}),
    ...(effects.expandAllowedValue ? { expandAllowedValue(event: LiveEvent, evaluation: ValidationEvaluation, trigger: HTMLButtonElement) { effects.expandAllowedValue?.(event, evaluation, trigger); } } : {}),
    ...(effects.draftContinuation ? { draftContinuation(event: LiveEvent) { return effects.draftContinuation?.(event); } } : {}),
    ...(effects.startDefectReport ? { startDefectReport(event: LiveEvent) { effects.startDefectReport?.(event); } } : {}),
    ...(effects.startOccurrenceDefectReport ? { startOccurrenceDefectReport(event: LiveEvent, mode: OccurrenceExpectationMode) { effects.startOccurrenceDefectReport?.(event, mode); } } : {}),
    ...(effects.openReportedDefect ? { openReportedDefect(defectId: string, event: LiveEvent, issueIndex: number, trigger: HTMLButtonElement) { effects.openReportedDefect?.(defectId, event, issueIndex, trigger); } } : {}),
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
