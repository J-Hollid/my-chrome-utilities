import type {SpecificationProject} from "../data-layer-specification-project.js";
import {canonicalTableRows, type CanonicalSchemaDocument} from "../data-layer-canonical-schema.js";
import {agentKinds} from "./types.js";

export function projectAgentContext(project:SpecificationProject, permittedIds:readonly string[], flowId:string, selectedProperties:Record<string,string[]>):Record<string,unknown> {
  const allowed = new Set(permittedIds);
  const collections = Object.fromEntries(agentKinds.map(kind=>[kind, project.collections[kind].filter(item=>allowed.has(item.id)).map(entity=>{
    const copy = structuredClone(entity);
    delete copy.conceptVisual;delete copy.visualAssets;
    return copy;
  })]));
  const graphs = project.documentationFlowGraphs as Record<string,unknown> | undefined;
  return {projectId:project.id, name:project.name, description:project.description, site:project.site,
    namingConventions:project.namingConventions, eventTransport:project.eventTransport,
    collections, selectedProperties,
    ...(flowId && graphs?.[flowId] ? {flow:{id:flowId,graph:graphs[flowId]}} : {}),
    importHistory:project.agentHistory ?? {mappings:[],applied:[]}};
}
export function profileProperties(project:SpecificationProject, id:string):{id:string; path:string; type:string}[] {
  const document = project.collections.profiles.find(profile=>profile.id === id)?.canonicalSchema as CanonicalSchemaDocument | undefined;
  return document ? canonicalTableRows(document).map(row=>({id:row.node.id, path:row.path, type:row.node.type})) : [];
}
