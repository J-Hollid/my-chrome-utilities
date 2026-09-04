import { applyCanonicalCommand, mountCanonicalSchemaEditor, type AssignmentConditionTarget, type CanonicalSchemaDocument,
  type PromotableReusableRule, type SchemaDefinition, type SchemaPropertyType, type SchemaRelationshipTreeNode } from "../../utilities/data-layer/schemas.js";
import type { AssignmentDataConditionEditorState } from "../../data-layer-schema-assignment-data-conditions-ui.js";
import type { LocalRulePromotionDialogController } from "../../data-layer-local-rule-promotion-ui.js";

export interface SchemasInstalledPorts {
  root:ParentNode; storage:Pick<Storage,"getItem"|"setItem"|"removeItem">; relationshipViewStorage:Pick<Storage,"getItem"|"setItem">;
  changed(schemas:readonly SchemaDefinition[]):void; subscribe(listener:(activeProjectId:string|undefined)=>void):()=>void; blocked?():boolean;
  createRuleId():string; capturedAssignmentValue(target:AssignmentConditionTarget):unknown;
  renderAssignmentConditions(root:HTMLElement,state:AssignmentDataConditionEditorState,changed:(state:AssignmentDataConditionEditorState)=>void):void;
  localRulePromotionDialog:LocalRulePromotionDialogController; subscribeSchemaPersistence(listener:(event:SchemaPersistenceEvent)=>void|Promise<void>):()=>void;
  downloadSchema(value:unknown,filename:string):void; relationshipTree(schemas:readonly SchemaDefinition[]):{ projectId:string; nodes:readonly SchemaRelationshipTreeNode[] };
  openProjectLibrary(create:boolean):void; openContributor(key:string):void; openContributorInStudio(key:string):void;
  adoptSavedSchema(schema:SchemaDefinition,trigger:HTMLButtonElement):void;
  renderSchemaSpecification(root:HTMLElement,schema:SchemaDefinition,schemas:readonly SchemaDefinition[],surface:`published:${number}`|`historical:${number}`|"working-draft",close:()=>void):void;
  reportMissingSchemaEvent(schemaId:string):void; showSchemasView():void; scheduleFrame(callback:()=>void):void;
  restoreGuidedCapture(eventId:string,propertyPath?:string,focusAction?:"validation"|"declaration"):void; guidedSaved?(message:string):void;
  activeProjectId():string|undefined; ensureProjectSchemaContributors(projectId:string,route:Readonly<{ collectionKinds:readonly string[]; includeFlowGraphs:boolean }>):Promise<{ name:string }>;
  settleCanonical?(schemaId:string):Promise<void>; mountLayeredProfileEditor():{ dispose():void }|undefined; canonicalConceptSuggestions():readonly string[];
  createCanonicalTableEditor?(options:Parameters<typeof mountCanonicalSchemaEditor>[0]):ReturnType<typeof mountCanonicalSchemaEditor>;
  revalidateCurrentLive?(schemas:readonly SchemaDefinition[],manualOverrides:Readonly<Record<string,string>>):number;
  prepareCapturedValidationContinuation?(record:SchemaValidationRecord):Promise<CapturedValidationContinuation>;
}
export interface SchemaSourceDraftInput { name:string; sourceId:string; eventName:string; payload:unknown; label:string }
export interface SchemaValidationRecord { eventId:string; eventName:string; state:string; checkedAt:string; schemaId?:string; schemaName?:string; schemaVersion?:number;
  target?:string; assignmentId?:string; assignmentName?:string; assignmentEvidence?:string;
  evaluated?:{ resultIdentity:string; winner?:{ schemaId:string; schemaRevision:number }; issueDetails:readonly { code:string; path?:string }[] }; issueCodes:readonly string[] }
export interface CapturedValidationContinuation { projectName:string; summary:string; review:string; suggestedName:string;
  events:readonly { id:string; name:string }[]; pages:readonly { id:string; name:string }[]; flowSteps:readonly { id:string; name:string }[]; profiles:readonly { id:string; name:string }[];
  commit(input:{ destination:"fixture"|"profile"; name:string; eventId:string; pageId?:string; flowStepId?:string; profileId?:string }):Promise<{ entityName:string; kind:"fixtures"|"profiles" }> }
export type SchemaPersistenceEvent={ type:"saved"|"retried"; schemaId:string }|{ type:"failed"|"rejected"; schemaId:string; error:unknown };
export interface ReusableSchemaRuleRevision { name:string; kind:string; version:number; enabled?:boolean; applicableType?:SchemaPropertyType; operator?:string; parameters?:string; severity?:string; message?:string; examples?:string }
export interface ReusableSchemaRule { id:string; name:string; kind:string; version:number; enabled:boolean; applicableType?:SchemaPropertyType; operator?:string; parameters?:string;
  severity?:string; message?:string; examples?:string; attachments?:readonly string[]; revisionHistory?:readonly ReusableSchemaRuleRevision[];
  allowedValues?:readonly (string|number|boolean|null)[]; comparison?:Exclude<NonNullable<SchemaDefinition["attachedRules"]>[number]["comparison"],undefined>;
  limit?:number; conditionGroup?:NonNullable<PromotableReusableRule["conditionGroup"]>; description?:string }
export type CompactCanonicalCommand=Parameters<typeof applyCanonicalCommand>[1];
export type CompactCanonicalCommandResult=ReturnType<typeof applyCanonicalCommand>;
export interface CompactCanonicalEditorAdapter { key:string; label:string; load():CanonicalSchemaDocument; dispatch(command:CompactCanonicalCommand):CompactCanonicalCommandResult;
  settle?():Promise<void>; settles?(command:CompactCanonicalCommand):boolean; settlementTarget?:string; projection?(canonical:CanonicalSchemaDocument):SchemaDefinition;
  persistProjection?(projection:SchemaDefinition,change?:string):boolean; stageProjectionCommand?(command:CompactCanonicalCommand):CompactCanonicalCommandResult;
  restoreStagedProjection?(canonical:CanonicalSchemaDocument):void; onSettlementCommitted?():void; onUndo?():void|string|Promise<void|string>; onRedo?():void|string|Promise<void|string>;
  renderContext?(host:HTMLElement):void; actions?:readonly { label:string; run():void }[];
  migration?:{ summary:string; conflicts:readonly { id:string; label:string; choices:readonly { id:string; label:string }[] }[]; resolve(conflictId:string,choiceId:string):void; cancel():void; confirm():Promise<void> } }
export interface CompactCanonicalProjectionPersistenceRequest { adapter:CompactCanonicalEditorAdapter; projection:SchemaDefinition; change?:string }
export interface CompactCanonicalProjectionWorker { adapter:CompactCanonicalEditorAdapter; promise:Promise<boolean>; settlement:number }
