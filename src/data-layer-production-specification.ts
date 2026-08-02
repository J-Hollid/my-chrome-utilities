import type {DurableProductionSchemaEvidence,DurableProductionSchemaInput,ProductionSpecificationRepository} from "./data-layer-production-model.js";
import {compileSpecificationProject,createCanonicalProjectEnvelope,evaluateSpecificationObservation,type ExecutableSpecificationPlan,type SpecificationEvaluationResult} from "./data-layer-specification-engine.js";

const canonical=(value:unknown):unknown=>Array.isArray(value)?value.map(canonical):value&&typeof value==="object"?Object.fromEntries(Object.keys(value as Record<string,unknown>).sort().map(key=>[key,canonical((value as Record<string,unknown>)[key])])):value;
const same=(left:unknown,right:unknown):boolean=>JSON.stringify(canonical(left))===JSON.stringify(canonical(right));

export function publishableProductionSchemas(plan:Pick<ExecutableSpecificationPlan,"schemas"|"assignments">):DurableProductionSchemaInput[]{
  const targets=new Map<string,DurableProductionSchemaInput>();
  for(const schema of Object.values(plan.schemas)){
    const candidate={schemaId:schema.schemaId,effectiveSchema:structuredClone(schema.document)},prior=targets.get(schema.schemaId);
    if(prior&&!same(prior.effectiveSchema,candidate.effectiveSchema))throw new Error(`Publishable target ${schema.schemaId} has conflicting effective exported schemas.`);
    targets.set(schema.schemaId,candidate);
  }
  return[...targets.values()].sort((left,right)=>left.schemaId.localeCompare(right.schemaId));
}

export interface DeveloperProductionSchemaExport{projectId:string;projectRevision:number;schemas:{evidence:DurableProductionSchemaEvidence;effectiveSchema:unknown}[];}
export async function developerProductionSchemaExport(repository:ProductionSpecificationRepository,projectId:string):Promise<DeveloperProductionSchemaExport>{
  const manifest=await repository.currentProductionManifest(projectId);if(!manifest)throw new Error(`Project ${projectId} has no production manifest. Publish reviewed production content before developer export.`);
  const schemas=await Promise.all(manifest.schemas.map(async entry=>{const evidence:DurableProductionSchemaEvidence={projectId,projectRevision:manifest.projectRevision,schemaId:entry.schemaId,schemaRevision:entry.schemaRevision,fingerprint:entry.fingerprint},snapshot=await repository.loadProductionSchema(evidence);return{evidence,effectiveSchema:structuredClone(snapshot.effectiveSchema)};}));
  return{projectId,projectRevision:manifest.projectRevision,schemas};
}

export async function loadProductionSpecificationPlan(repository:ProductionSpecificationRepository,projectId:string):Promise<{plan:ExecutableSpecificationPlan;evidenceBySchemaKey:Record<string,DurableProductionSchemaEvidence>}>{
  const published=await repository.loadCurrentPublishedProject(projectId);if(!published)throw new Error(`Project ${projectId} has no production Project revision.`);const compiled=compileSpecificationProject({...createCanonicalProjectEnvelope(published.project,`production:${published.revision}`),revision:published.revision});if(compiled.status==="blocked")throw new Error(`Production Project ${projectId}:${published.revision} cannot compile: ${compiled.diagnostics.map(({field})=>field).join(", ")}.`);const plan=structuredClone(compiled.plan),evidenceBySchemaKey:Record<string,DurableProductionSchemaEvidence>={};
  for(const[key,schema]of Object.entries(plan.schemas)){const evidence=await repository.productionSchemaEvidence(projectId,schema.schemaId),snapshot=await repository.loadProductionSchema(evidence);schema.document=structuredClone(snapshot.effectiveSchema) as Record<string,unknown>;schema.revision=evidence.schemaRevision;evidenceBySchemaKey[key]=evidence;}
  for(const assignment of plan.assignments)assignment.schemaRevision=plan.schemas[assignment.schemaKey]?.revision??assignment.schemaRevision;plan.revision=published.revision;if(published.project.currentRelease)plan.releaseId=published.project.currentRelease;return{plan,evidenceBySchemaKey};
}

export async function evaluateProductionSpecificationObservation(repository:ProductionSpecificationRepository,projectId:string,observation:Record<string,unknown>):Promise<{result:SpecificationEvaluationResult;evidence?:DurableProductionSchemaEvidence}>{const{plan,evidenceBySchemaKey}=await loadProductionSpecificationPlan(repository,projectId),result=evaluateSpecificationObservation(plan,observation),assignment=result.winner?plan.assignments.find(({assignmentId})=>assignmentId===result.winner!.assignmentId):undefined;return{result,...(assignment?{evidence:evidenceBySchemaKey[assignment.schemaKey]}:{})};}
