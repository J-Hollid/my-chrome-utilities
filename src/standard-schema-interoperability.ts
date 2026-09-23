import type {SpecificationProject} from "./data-layer-specification-project.js";
import type {ProductionSpecificationRepository} from "./data-layer-production-model.js";
import {developerProductionSchemaExport} from "./data-layer-production-specification.js";
import type {CanonicalSchemaDocument} from "./data-layer-canonical-schema.js";

export interface UnsupportedStandardSchemaRule {
  contributorId:string;
  propertyId:string;
  ruleId:string;
  reason:string;
}

export function unsupportedStandardSchemaRules(project:SpecificationProject):UnsupportedStandardSchemaRule[]{
  const unsupported:UnsupportedStandardSchemaRule[]=[];
  for(const entries of Object.values(project.collections))for(const entity of entries??[]){
    const document=(entity as {canonicalSchema?:CanonicalSchemaDocument}).canonicalSchema;
    if(!document)continue;
    for(const node of Object.values(document.nodes))for(const rule of node.rules){
      if(rule.enabled===false)continue;
      const reasons=[...(rule.kind==="custom"?["custom behavior has no standard JSON Schema equivalent"]:[]),
      ...(rule.kind==="reusable"?["reusable rule identity and linkage are not portable in standard JSON Schema"]:[]),
      ...(rule.severity==="warning"?["standard JSON Schema cannot preserve warning severity"]:[])];
      if(reasons.length)unsupported.push({contributorId:entity.id,propertyId:node.id,
        ruleId:rule.id,reason:reasons.join("; ")});
    }
  }
  return unsupported;
}

export async function exportExternalStandardSchema(input:{
  repository:ProductionSpecificationRepository;projectId:string;
  download:(name:string,contents:string)=>void;
}):Promise<string>{
  const production=await developerProductionSchemaExport(input.repository,input.projectId),
    published=await input.repository.loadCurrentPublishedProject(input.projectId);
  if(!published||published.revision!==production.projectRevision)throw new DOMException(
    "The published project changed during external schema export. Retry the export.","InvalidStateError");
  const unsupportedRules=unsupportedStandardSchemaRules(published.project);
  input.download("specification.schema.json",JSON.stringify({
    $schema:"https://json-schema.org/draft/2020-12/schema",
    oneOf:production.schemas.map(({effectiveSchema})=>effectiveSchema),
  }));
  input.download("specification.manifest.json",JSON.stringify({
    format:"my-chrome-utilities.production-schema-manifest",version:1,
    purpose:"external JSON Schema interoperability",configurationBackup:false,
    projectId:production.projectId,projectRevision:production.projectRevision,
    schemas:production.schemas.map(({evidence})=>evidence),unsupportedRules,
    excludedContent:["project Drafts and Published history","Flows and fixtures","image and Excel bodies",
      "saved libraries and utility preferences"],
  }));
  return `Exported external JSON Schema and its manifest. This is not a configuration backup. `+
    `${unsupportedRules.length} unsupported rule${unsupportedRules.length===1?"":"s"} reported in the manifest.`;
}
