import type {ProjectEntityKind, SpecificationProject} from "../data-layer-specification-project.js";

export const agentKinds = ["profiles", "propertySets", "pages", "events", "applicabilitySets", "flows", "fixtures", "assignments"] as const;
export type AgentMode = "page" | "event" | "propertySet" | "flow" | "import" | "template" | "both";
export type ReviewDecision = "pending" | "accepted" | "rejected" | "needs-information";
export interface SourceReference {fileId:string; sheet:string; range:string}
export interface AgentChange {
  id:string;
  kind:ProjectEntityKind;
  action:"create" | "update" | "reuse";
  targetId:string | null;
  name:string;
  recordJson:string;
  reason:string;
  sources:SourceReference[];
  dependsOn:string[];
  questions:string[];
}
export interface TemplatePlan {
  id:string; name:string; kind:"overview" | "flow" | "matrix" | "profile";
  fileId:string; sheet:string; prototypeJson:string; limitations:string[];
}
export interface AgentProposal {
  summary:string;
  changes:AgentChange[];
  templates:TemplatePlan[];
  coverage:{fileId:string; sheet:string; range:string; status:"mapped" | "excluded" | "unresolved"; reason:string}[];
  questions:string[];
}
export interface ReviewItem {decision:ReviewDecision; feedback:string}
export interface AgentReview {
  taskId:string; projectId:string; baseRevision:number; baseProject:SpecificationProject;
  proposal:AgentProposal; decisions:Record<string, ReviewItem>;
  permittedIds:string[]; selectedProperties?:Record<string,string[]>; allowNewDefinitions:boolean; sourceKey:string;
  appliedIds:string[]; updatedAt:string;
}
export interface AgentFile {id:string; name:string; mediaType:string; base64:string}
export interface AgentRequest {
  id:string; projectId:string; baseRevision:number; mode:AgentMode; description:string;
  sourceKey:string; allowNewDefinitions:boolean; permittedIds:string[];
  context:Record<string, unknown>; files:AgentFile[];
}
export interface AgentTask {
  id:string; projectId:string; status:"queued" | "running" | "completed" | "failed" | "stopped";
  stage:string; messages:string[]; error?:string; proposal?:AgentProposal;
  revision:number; updatedAt:string;
  workbook?:{files:unknown[]; findings:string[]};
}
export interface AgentImportMapping {
  key:string; kind:ProjectEntityKind; targetId:string; sourceRecord:string; targetRecord:string;
}
export interface AgentProjectHistory {mappings:AgentImportMapping[]; applied:string[]}
