import {installProjectDocumentationWorkspaceContribution} from "../project-documentation/workspace-contribution.js";
import type {DurableProjectRuntime} from "../data-layer-durable-project-runtime.js";
import {transactProject,type ProjectState,type ProjectEntityKind} from "../data-layer-specification-project.js";
import type {ProjectAssetBodyStore} from "../project-asset-body-contribution.js";
import {installAgentWorkspace} from "./workspace.js";

interface StudioHost {
  runtime:DurableProjectRuntime;
  state():ProjectState|undefined;
  revision():number;
  persist(state:ProjectState):void;
  restore():void;
  openEntity(kind:ProjectEntityKind,id:string):void;
}
export function installStudioContributions(host:StudioHost) {
  const runtime=host.runtime,assetBodies:ProjectAssetBodyStore={
    storeProjectAssetBody:async(identity,body)=>runtime.stageProjectAssetBody(identity,body),
    loadProjectAssetBody:identity=>runtime.repository.loadProjectAssetBody(identity),
    deleteProjectAssetBody:async identity=>runtime.discardStagedProjectAssetBody(identity),
  };
  installAgentWorkspace({assetBodies,read:async()=>{
    const projectId=host.state()?.project.id;if(!projectId)throw new Error("Create or open a project first.");
    await runtime.settled("project");await runtime.refreshProject(projectId);host.restore();
    const loaded=await runtime.repository.loadProject(projectId);
    return {state:structuredClone(loaded.state),revision:loaded.draftSequence};
  },commit:async state=>{
    if(host.state()?.project.id!==state.project.id)throw new Error("The active project changed.");
    const label=state.history.undo.at(-1)?.label??"Agent project edit";
    const before=new Set(runtime.historyInspection(state.project.id).undo.map(item=>item.commandId));
    host.persist(state);await runtime.settledProjectCommand(state.project.id,label);
    if(!runtime.historyInspection(state.project.id).undo.some(item=>item.label===label&&!before.has(item.commandId)))throw new Error("The agent change was not saved. Check Studio save recovery.");
  }});
  return installProjectDocumentationWorkspaceContribution({assetBodies,state:host.state,revision:host.revision,
    save:(documentation,label)=>{const state=host.state();if(state)host.persist(transactProject(state,label,project=>({...project,documentation:structuredClone(documentation)})));},
    openRepair:target=>{
      host.openEntity(target.kind,target.id);
      if(!target.path)return;
      const route=new URL(location.href);route.searchParams.set("kind",target.kind);route.searchParams.set("entity",target.id);route.searchParams.set("field",target.path);history.replaceState(null,"",route);
      const focusPath=(attempt=0):void=>{
        const candidate=document.querySelector<HTMLElement>(`[data-property-id="${CSS.escape(target.path!)}"],[data-flow-instance-effective-path="${CSS.escape(target.path!)}"]`);
        if(candidate){candidate.click();candidate.focus({preventScroll:true});return;}
        if(attempt<8)setTimeout(()=>focusPath(attempt+1),25);
      };queueMicrotask(focusPath);
    },
  });
}
