import {
  applyCanonicalCommand,
  compactSchemaProjection,
  savedSchemaCanonicalDocument,
  savedSchemaFromCanonical,
  updateSchemaWorkingDraft,
  type CanonicalSchemaDocument,
  type SchemaDefinition,
} from "../../utilities/data-layer/schemas.js";
import type { CompactCanonicalEditorAdapter } from "./contracts.js";
import type { CanonicalInstalledViewPorts } from "./canonical-view-contracts.js";

/** Creates the durable Saved Schema adapter outside the installed DOM view. */
export function createCanonicalSavedAdapter(
  ports:CanonicalInstalledViewPorts,
  schema:SchemaDefinition,
  close:()=>void,
):CompactCanonicalEditorAdapter {
  const controller=ports.controller;
  const schemaId=schema.id;
  ports.setDraft(ports.editorDraft(schema));
  controller.setSavedDocument(savedSchemaCanonicalDocument(ports.draft()!,ports.createId));

  const storedSchema=():SchemaDefinition => {
    const stored=ports.schemas().find(({id}) => id===schemaId);
    if(!stored)throw new Error("The saved schema is unavailable.");
    return stored;
  };
  const project=(canonical:CanonicalSchemaDocument):SchemaDefinition => {
    const stored=ports.schemas().find(({id}) => id===schemaId);
    if(!stored){
      return compactSchemaProjection(canonical,{
        id:canonical.contributorId,
        name:canonical.contributorName,
        version:canonical.revision,
      });
    }
    const outer=ports.editorDraft(stored);
    const result=savedSchemaFromCanonical({...outer,name:canonical.contributorName},canonical);
    const {canonicalSchema:_canonical,...projection}=result;
    return projection;
  };
  const persistCanonical=(canonical:CanonicalSchemaDocument,change:string):void => {
    const stored=storedSchema();
    const source=ports.draft()?.id===schemaId?ports.draft()!:ports.editorDraft(stored);
    const projection=savedSchemaFromCanonical(source,canonical);
    const updated=updateSchemaWorkingDraft(ports.proposeName(stored,projection.name),{
      document:projection.document,
      assignments:projection.assignments,
      attachedRules:projection.attachedRules,
      parentSchemaId:projection.parentSchemaId,
      inheritedRuleOverrides:projection.inheritedRuleOverrides,
      documentation:projection.documentation,
      canonicalSchema:canonical,
    },change);
    ports.replaceSchemas(ports.schemas().map((candidate) => candidate.id===schemaId?updated:candidate));
    controller.setSavedDocument(canonical);
    ports.persistLibrary();
  };
  const persistProjection=(projection:SchemaDefinition,change?:string):boolean => {
    const stored=storedSchema();
    const canonical=controller.savedDocument;
    const updated=updateSchemaWorkingDraft(ports.proposeName(stored,projection.name),{
      document:projection.document,
      assignments:projection.assignments,
      attachedRules:projection.attachedRules,
      parentSchemaId:projection.parentSchemaId,
      inheritedRuleOverrides:projection.inheritedRuleOverrides,
      documentation:projection.documentation,
      ...(canonical?{canonicalSchema:{...canonical,contributorName:projection.name}}:{}),
    },change==="schema name"?undefined:change);
    if(JSON.stringify(updated)===JSON.stringify(stored))return false;
    ports.replaceSchemas(ports.schemas().map((candidate) => candidate.id===schemaId?updated:candidate));
    if(canonical)controller.setSavedDocument({...canonical,contributorName:projection.name});
    ports.persistLibrary();
    return true;
  };

  return {
    key:`saved:${schema.id}`,
    label:`${schema.name} · Saved schema working draft`,
    load:()=>controller.savedDocument!,
    projection:project,
    dispatch:(command) => {
      const result=applyCanonicalCommand(controller.savedDocument!,command);
      if(result.status==="applied"||result.status==="rebased"){
        if(command.kind==="select"||command.kind==="view")controller.setSavedDocument(result.document);
        else persistCanonical(result.document,`${command.kind} canonical property`);
      }
      return result;
    },
    stageProjectionCommand:(command) => {
      const result=applyCanonicalCommand(controller.savedDocument!,command);
      if(result.status==="applied"||result.status==="rebased")controller.setSavedDocument(result.document);
      return result;
    },
    restoreStagedProjection:(canonical) => controller.setSavedDocument(canonical),
    persistProjection,
    settle:()=>ports.settle?.(schema.id)??Promise.resolve(),
    settles:(command)=>command.kind!=="select"&&command.kind!=="view",
    settlementTarget:"durable Saved Schema Library",
    actions:[
      {label:"Publish schema",run:()=>ports.elements.save?.click()},
      {label:"Close editor",run:close},
    ],
  };
}
