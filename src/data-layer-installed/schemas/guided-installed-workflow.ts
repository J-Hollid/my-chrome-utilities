import {
  createGuidedValidationFlow,
  type PublishedGuidedValidation,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import type { GuidedCapturedEvent, SchemaGuidedValidationController } from "./guided-validation-controller.js";
import { schemaEditorDraft } from "./schema-model.js";

export interface SchemaGuidedInstalledWorkflowPorts {
  controller:SchemaGuidedValidationController;
  root:HTMLElement | null;
  schemas():readonly SchemaDefinition[];
  generation():number;
  result:HTMLElement | null;
  saved?(message:string):void;
  restoreCapture(eventId:string,propertyPath?:string):void;
  openDraft(schema:SchemaDefinition):void;
  openRevisionReview():void;
}

/** Owns the installed open, save, and return sequence for guided validation. */
export class SchemaGuidedInstalledWorkflow {
  readonly flow:ReturnType<typeof createGuidedValidationFlow>;
  readonly #ports:SchemaGuidedInstalledWorkflowPorts;

  constructor(ports:SchemaGuidedInstalledWorkflowPorts) {
    this.#ports=ports;
    this.flow=createGuidedValidationFlow(ports.root, {
      schemaCandidates:() => ports.schemas().map((schema) => this.candidate(schema)),
      publish:(result) => ports.controller.persistPublished(result),
      close:() => this.close(),
      saved:(result) => this.finishSave(result),
    });
  }

  candidate(schema:SchemaDefinition):ReturnType<SchemaGuidedValidationController["uiCandidate"]> {
    return this.#ports.controller.uiCandidate(schema,schema.workingDraft ? schemaEditorDraft(schema) : schema);
  }

  async openEvent(event:GuidedCapturedEvent,schema?:SchemaDefinition):Promise<void> {
    const captured=structuredClone(event), controller=this.#ports.controller;
    const selected=schema ?? controller.selected(captured) ?? controller.candidates(captured)[0]?.schema;
    if (selected) controller.select(captured,selected.id);
    controller.propertyReturn=undefined;
    this.show(captured.id,selected?.id);
    this.flow.open(controller.uiEvent(captured),selected ? this.candidate(selected) : undefined);
  }

  async openProperty(event:GuidedCapturedEvent,schema:SchemaDefinition|undefined,propertyPath:string,returnToSchema=true):Promise<void> {
    const captured=structuredClone(event), controller=this.#ports.controller;
    if (schema) controller.select(captured,schema.id);
    this.show(captured.id,schema?.id);
    this.flow.openProperty(controller.uiEvent(captured),propertyPath,schema ? this.candidate(schema) : undefined);
    if (returnToSchema) controller.propertyReturn=schema
      ? { kind:"schema",schemaId:schema.id,propertyPath,generation:this.#ports.generation() }
      : undefined;
  }

  continuation(event:GuidedCapturedEvent) {
    const controller=this.#ports.controller, schema=controller.selected(event);
    return schema?.workingDraft ? {
      schemaId:schema.id,schemaName:schema.name,schemaVersion:schema.version,
      pendingChanges:schema.workingDraft.pendingChanges.length,
      addProperty:() => this.flow.open(controller.uiEvent(event),this.candidate(schema)),
      review:() => this.#ports.openDraft(schema),
      publish:() => { this.#ports.openDraft(schema); this.#ports.openRevisionReview(); },
      useDifferent:() => controller.openContinuationPicker(event),
    } : undefined;
  }

  persistAndFinish(result:PublishedGuidedValidation):Promise<void> {
    return this.#ports.controller.persistPublished(result).then(() => this.finishSave(result));
  }

  close():void {
    const root=this.#ports.root;
    if (root) { root.hidden=true; root.removeAttribute("data-event-id"); root.removeAttribute("data-schema-id"); }
    this.#ports.controller.restorePropertyReturn();
  }

  openDraft(schema:SchemaDefinition):void { this.#ports.openDraft(schema); }

  private show(eventId:string,schemaId?:string):void {
    const root=this.#ports.root;
    if (!root) return;
    root.hidden=false; root.dataset.eventId=eventId; root.dataset.schemaId=schemaId ?? "";
  }

  private finishSave(result:PublishedGuidedValidation):void {
    const ports=this.#ports, controller=ports.controller;
    controller.select({ sourceId:result.assignment.sourceId,name:result.assignment.eventName },result.schema.id);
    const message=result.destination.kind === "new" ? `Draft ${result.schema.name} was created.` : `Validation was added to ${result.schema.name} draft.`;
    ports.saved?.(message);
    if (controller.propertyReturn?.generation === ports.generation() && controller.propertyReturn.kind === "capture") {
      const snapshot=controller.propertyReturn; controller.propertyReturn=undefined;
      ports.restoreCapture(snapshot.eventId,snapshot.propertyPath);
    } else if (controller.propertyReturn?.generation === ports.generation() && controller.propertyReturn.kind === "schema" && controller.propertyReturn.schemaId === result.schema.id) {
      controller.restorePropertyReturn();
    }
    if (ports.result) ports.result.textContent=message;
  }
}
