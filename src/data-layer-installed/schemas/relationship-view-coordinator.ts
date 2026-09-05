import { duplicateSchemaRevision, schemaRevisionChoices, type SchemaDefinition } from "../../utilities/data-layer/schemas.js";
import type { SchemaCanonicalEditorController } from "./canonical-editor-controller.js";
import type { SchemaEditorRouteController } from "./editor-route-controller.js";
import type { SchemaLibraryController } from "./library-controller.js";
import { createSchemaRelationshipTreeController } from "./relationship-tree-controller.js";
import type { SchemaRelationshipTreeNode } from "../../schema-relationship-tree.js";

type SchemaRelationshipTreeController=ReturnType<typeof createSchemaRelationshipTreeController>;
interface RelationshipProjection { projectId:string; nodes:readonly SchemaRelationshipTreeNode[] }
export interface SchemaRelationshipViewPorts {
  controller:SchemaRelationshipTreeController; library:SchemaLibraryController; route:SchemaEditorRouteController;
  canonical:SchemaCanonicalEditorController; list:HTMLElement|null; detail:HTMLElement|null;
  mounted():boolean; relationship(schemas:readonly SchemaDefinition[]):RelationshipProjection;
  renderDraft():void; renderAssignments():void; persist():void; openSaved(schema:SchemaDefinition):void;
  adopt(schema:SchemaDefinition,trigger:HTMLButtonElement):void; build(schema:SchemaDefinition,trigger:HTMLButtonElement):void;
  openContributor(key:string):void; openContributorInStudio(key:string):void; openProject(create:boolean):void; reportMissing(schemaId:string):void;
}

/** Owns relationship-tree rendering, navigation, and route coordination. */
export class SchemaRelationshipViewCoordinator {
  readonly #ports:SchemaRelationshipViewPorts;
  constructor(ports:SchemaRelationshipViewPorts){this.#ports=ports;}
  render():void {
    const p=this.#ports;if(!p.mounted())return;const relationship=p.relationship(p.library.schemas),reference=p.route.invokingReference();
    p.controller.render({projectId:relationship.projectId,nodes:relationship.nodes,schemas:p.library.schemas,
      ...(p.library.activeSchemaId?{activeSchemaId:p.library.activeSchemaId}:{}),...(reference?{invokingReference:reference}:{}),
      historyCount:(schema)=>schemaRevisionChoices(schema).length,
      editSaved:(schema,trigger,key)=>{p.route.open(trigger,key);p.library.select(schema.id,schema);this.render();p.openSaved(schema);},
      duplicateSaved:(schema)=>{p.library.replaceSchemas([...p.library.schemas,duplicateSchemaRevision(schema,schema.version,p.library.schemas)]);p.persist();this.render();},
      adoptSaved:(schema,trigger)=>p.adopt(structuredClone(schema),trigger),buildSpecification:p.build,
      exportSaved:(schema,trigger)=>p.library.openExportChoices(trigger,schema),reportMissing:(schema)=>p.reportMissing(schema.id),
      deleteSaved:(schema)=>p.library.requestDeletion(schema.id),openContributor:(key,trigger,referenceKey)=>{
        p.route.open(trigger,referenceKey);const scroll=p.canonical.editorKey()===key?p.detail?.scrollTop:undefined;
        p.openContributor(key);if(p.detail&&scroll!==undefined)p.detail.scrollTop=scroll;this.render();},
      openContributorInStudio:p.openContributorInStudio,openProject:p.openProject,rerender:()=>this.render()});
    p.renderDraft();p.renderAssignments();
  }
  update():void{this.#ports.controller.update();this.render();}
  persistScroll():void{this.#ports.controller.persistScroll();}
  navigate(event:KeyboardEvent):void {
    const target=event.target as HTMLButtonElement|null,controls=Array.from(this.#ports.list?.querySelectorAll<HTMLButtonElement>("li[role=treeitem] > button:first-of-type")??[]),
      current=target?controls.indexOf(target):-1;
    if(current<0||!target)return;if(["ArrowDown","ArrowUp","Home","End"].includes(event.key)){
      event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?controls.length-1:Math.max(0,Math.min(controls.length-1,current+(event.key==="ArrowDown"?1:-1)));
      controls[next]?.focus({preventScroll:false});}
    if(event.key==="ArrowRight"||event.key==="ArrowLeft"){const row=target.closest<HTMLElement>('[role="treeitem"][aria-expanded]');if(!row)return;
      const expanded=row.getAttribute("aria-expanded")==="true";if((event.key==="ArrowRight"&&!expanded)||(event.key==="ArrowLeft"&&expanded)){event.preventDefault();
        target.click();}}
  }
}
