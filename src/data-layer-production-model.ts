import type {SpecificationProject} from "./data-layer-specification-project.js";

export interface DurableProductionSchemaInput {schemaId:string;effectiveSchema:unknown;priorRevision?:number;}
export interface DurableProductionSchemaEntry {schemaId:string;schemaRevision:number;fingerprint:string;snapshotKey:string;}
export interface DurableProductionManifest {projectId:string;projectRevision:number;projectFingerprint:string;publicationId:string;publishedAt:string;schemas:DurableProductionSchemaEntry[];}
export interface DurableProductionSchemaSnapshot {projectId:string;schemaId:string;schemaRevision:number;fingerprint:string;effectiveSchema:unknown;createdAt:string;}
export interface DurableProductionSchemaEvidence {projectId:string;projectRevision:number;schemaId:string;schemaRevision:number;fingerprint:string;}
export type DurablePublishResult=
  |{status:"published";draftToken:string;publishedRevision:number;manifest:DurableProductionManifest}
  |{status:"no-changes";draftToken:string;publishedRevision:number;manifest:DurableProductionManifest};

export interface ProductionSpecificationRepository {
  currentProductionManifest(projectId:string):Promise<DurableProductionManifest|undefined>;
  loadCurrentPublishedProject(projectId:string):Promise<{revision:number;project:SpecificationProject}|undefined>;
  productionSchemaEvidence(projectId:string,schemaId:string):Promise<DurableProductionSchemaEvidence>;
  loadProductionSchema(evidence:DurableProductionSchemaEvidence):Promise<DurableProductionSchemaSnapshot>;
}
