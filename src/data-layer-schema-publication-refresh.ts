import type { LiveEvent, LiveObserverState } from "./data-layer-live-observer.js";
import {
  validateEvent,
  validateWithSchema,
  type SchemaDefinition,
  type ValidationResult,
  type ValidatableEvent,
} from "./data-layer-schema-verification.js";

export interface SchemaPublicationRefresh {
  state: LiveObserverState;
  revalidatedEventIds: readonly string[];
}

function validatableEvent(event: LiveEvent): ValidatableEvent {
  return {
    sourceId:event.sourceId,
    eventName:event.name,
    payload:event.payload,
    rawInput:event.rawInput,
  };
}

function validationDetails(result: ValidationResult): NonNullable<LiveEvent["validationDetails"]> {
  return {
    issues:result.issues,
    evaluations:result.evaluations ?? [],
    ...(result.schema ? { schema:result.schema } : {}),
    ...(result.documentation ? { documentation:result.documentation } : {}),
    ...(result.assignment ? { assignment:result.assignment } : {}),
  };
}

export function revalidateCurrentLiveSession(
  state: LiveObserverState,
  publishedSchemas: readonly SchemaDefinition[],
  manualSchemaOverrides: Readonly<Record<string, string>>,
): SchemaPublicationRefresh {
  const snapshot = structuredClone(publishedSchemas);
  const events = state.events.map((event) => {
    const input = validatableEvent(event);
    const manual = snapshot.find(({ id }) => id === manualSchemaOverrides[event.id]);
    const result = manual
      ? validateWithSchema(input, manual, snapshot)
      : validateEvent(input, snapshot, event.pageUrl);
    const { defectTriage:_staleTriage, ...captured } = event;
    return {
      ...captured,
      validation:result.state,
      validationDetails:validationDetails(result),
    };
  });
  return {
    state:{ ...state, events },
    revalidatedEventIds:events.map(({ id }) => id),
  };
}
