import { assignableSchemas, canonicalLivePropertyPath, validateEvent, validateWithSchema,
  type SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { GuidedValidationDraft } from "../../data-layer-guided-validation.js";
import { schemaPropertyAt } from "./schema-model.js";
import type { GuidedCapturedEvent, SchemaGuidedValidationController } from "./guided-validation-controller.js";
import type { SchemaPropertyController } from "./property-controller.js";
import type { SchemaValidationController } from "./validation-controller.js";
import type { SchemaValidationRecord } from "./contracts.js";

export interface GuidedPublicPorts {
  guided:SchemaGuidedValidationController;
  validation:SchemaValidationController;
  property:SchemaPropertyController;
  schemas():readonly SchemaDefinition[];
  active():SchemaDefinition;
  activeSchemaId():string|undefined;
  root:HTMLElement|null;
  generation():number;
  openValidation(event:GuidedCapturedEvent,schema?:SchemaDefinition):void;
  closeValidation():void;
  draftProjection():GuidedValidationDraft|undefined;
  openProperty(event:GuidedCapturedEvent,schema:SchemaDefinition|undefined,path:string,restore:boolean):Promise<void>;
}

/** Projects validation and guidance operations for installed consumers. */
export function createGuidedPublicOperations<T extends object>(ports:GuidedPublicPorts, projections:T) {
  const guided=ports.guided, validation=ports.validation;
  return { ...projections,
    runGuidedValidation:async () => { const event=ports.root?.dataset.eventId; if (event) {
      const captured={id:event,sourceId:"",name:"",pageUrl:"",payload:{},rawInput:{}};
      ports.openValidation(captured,ports.activeSchemaId() ? ports.active() : undefined); } },
    openGuidedLiveProperty:async(event:GuidedCapturedEvent,path:string) => {
      guided.setPropertyReturn({kind:"capture",eventId:event.id,propertyPath:path,generation:ports.generation()});
      await ports.openProperty(event,guided.selected(event),path,false);
      guided.setPropertyReturn({kind:"capture",eventId:event.id,propertyPath:path,generation:ports.generation()}); },
    livePropertyDeclaration:(event:GuidedCapturedEvent,path:string) => { const schema=guided.selected(event);
      if (!schema?.workingDraft) return {}; const canonical=canonicalLivePropertyPath(path);
      return {destination:schema.name,alreadyDeclared:Boolean(schemaPropertyAt(schema.workingDraft.document,canonical))}; },
    liveValidationAvailable:(event:GuidedCapturedEvent) => { const schemas=ports.schemas(),manual=schemas.find(({id}) => id===validation.manualSchemaId(event.id));
      return Boolean(manual??validateEvent({sourceId:event.sourceId,eventName:event.name,payload:event.payload,rawInput:event.rawInput},schemas,event.pageUrl).schema); },
    validateLive:(event:GuidedCapturedEvent) => { const schemas=ports.schemas(),input={sourceId:event.sourceId,eventName:event.name,payload:event.payload,rawInput:event.rawInput};
      const manual=schemas.find(({id}) => id===validation.manualSchemaId(event.id)); return manual?validateWithSchema(input,manual,schemas):validateEvent(input,schemas,
        event.pageUrl); },
    liveSchemaChoices:() => assignableSchemas(ports.schemas()).map(({id,name,version}) => ({id,label:`${name} v${version}`})),
    closeGuided:ports.closeValidation, guidedDraft:ports.draftProjection,
    guidedState:() => ({selections:guided.selectionState(),selectedSchemaPropertyPath:ports.property.selectedPath,
      hasPropertyReturn:guided.hasPropertyReturn(),dialogListenerCount:guided.dialogListenerCount()}),
    recheckCaptured:(events:readonly GuidedCapturedEvent[]=[]) => validation.recheck(events),
    recordCapturedValidation:(record:SchemaValidationRecord) => { validation.addRecord(record); validation.render(); },
    reviewCapturedValidationContinuation:(record:SchemaValidationRecord,trigger:HTMLButtonElement) => validation.reviewContinuation(record,trigger),
    setManualSchemaOverride:(eventId:string,schemaId?:string) => validation.setManualOverride(eventId,schemaId),
  };
}
