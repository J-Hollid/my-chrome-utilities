import type {SpecificationProject} from "../data-layer-specification-project.js";

interface ReferencedVisual {assetId?:string}
interface VisualRecord {conceptVisual?:ReferencedVisual}
interface VisualGraph {pageFrames?:VisualRecord[];occurrences?:VisualRecord[]}
interface VisualAsset {id:string}
type ProjectWithVisuals=SpecificationProject&{
  conceptVisualAssets?:VisualAsset[];
  documentationFlowGraphs?:Record<string,VisualGraph>;
};

export function pruneUnreferencedFlowConceptVisualAssets(project:SpecificationProject):SpecificationProject{
  const visualProject=project as ProjectWithVisuals;
  if(!visualProject.conceptVisualAssets)return project;
  const referenced=new Set(Object.values(visualProject.documentationFlowGraphs??{}).flatMap((graph)=>
    [...(graph.pageFrames??[]),...(graph.occurrences??[])].flatMap(({conceptVisual})=>conceptVisual?.assetId?[conceptVisual.assetId]:[])));
  const retained=visualProject.conceptVisualAssets.filter(({id})=>referenced.has(id));
  return retained.length===visualProject.conceptVisualAssets.length?project:{...project,conceptVisualAssets:retained};
}
