import type {SpecificationProject} from "../data-layer-specification-project.js";
import type {ProjectAssetBodyStore} from "../project-asset-body-contribution.js";
import {flowConceptVisualAssets} from "../flow-graph/concept-visuals.js";
import {record} from "./contract.js";
import type {AgentFile} from "./types.js";

export async function agentFile(blob:Blob, name:string, id=crypto.randomUUID() as string):Promise<AgentFile> {
  if (blob.size>10*1024*1024) throw new Error(`${name}: file exceeds 10 MiB.`);
  const bytes=new Uint8Array(await blob.arrayBuffer());
  let binary="";for(let offset=0;offset<bytes.length;offset+=8192) binary+=String.fromCharCode(...bytes.subarray(offset,offset+8192));
  return {id,name,mediaType:blob.type,base64:btoa(binary)};
}
export async function flowAgentFiles(project:SpecificationProject, flowId:string, bodies:ProjectAssetBodyStore):Promise<AgentFile[]> {
  const graph=(project.documentationFlowGraphs as Record<string,unknown> | undefined)?.[flowId];
  if (!record(graph)) return [];
  const referenced=new Set<string>();
  for (const items of [graph.pageFrames,graph.occurrences]) if (Array.isArray(items)) for (const item of items) {
    if (record(item) && record(item.conceptVisual) && typeof item.conceptVisual.assetId==="string") referenced.add(item.conceptVisual.assetId);
  }
  const files:AgentFile[]=[];
  for (const asset of flowConceptVisualAssets(project).filter(asset=>referenced.has(asset.id))) {
    const blob=asset.bytes?.startsWith("data:") ? await fetch(asset.bytes).then(response=>response.blob())
      : await bodies.loadProjectAssetBody({projectId:project.id,namespace:"flow-visual",digest:asset.digest});
    files.push(await agentFile(blob,`Flow screenshot ${asset.id}`,`flow-${asset.digest.replace(/^sha256:/u,"")}`));
  }
  return files;
}
