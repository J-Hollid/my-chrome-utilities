import type {ProjectState} from "../data-layer-specification-project.js";

/** Adapts old Studio JSON to the Projects import envelope before review. */
export function normalizeProjectJsonImport(value:Record<string,unknown>):Record<string,unknown>{
  if(value.format!=="my-chrome-utilities.specification-project-state")return value;
  if(value.version!==1&&value.version!==2)throw new DOMException(
    "Use a supported Specification Studio project version 1 or 2.","NotSupportedError");
  const state=value.state as Partial<ProjectState>|undefined;
  if(!state?.project||typeof state.project!=="object")throw new DOMException(
    "The Studio project file has no project state.","DataError");
  const project=structuredClone(state.project);
  return{format:"my-chrome-utilities.durable-project-bundle",version:2,
    sourceProjectId:project.id,sourceName:project.name,project,
    ...(state.draft?{draft:structuredClone(state.draft)}:{}),
    migrations:["Studio project JSON to Projects import"]};
}
