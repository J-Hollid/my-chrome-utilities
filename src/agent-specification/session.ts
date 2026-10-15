import type {ProjectState} from "../data-layer-specification-project.js";
import type {ProjectAssetBodyStore} from "../project-asset-body-contribution.js";
import type {AgentRequest,AgentReview,AgentTask,TemplatePlan} from "./types.js";
import {AgentSessionStore,type StoredAgentSession} from "./storage.js";
import {CompanionClient} from "./client.js";
import {mergeProposalRevision} from "./review.js";
import {applyAcceptedChanges} from "./apply.js";
import {projectAgentContext} from "./context.js";
import {stageTemplate,templatePreviewContext} from "./templates.js";
import {stableJson} from "./contract.js";

export interface AgentWorkspaceHost {
  read():Promise<{state:ProjectState;revision:number}>;
  commit(state:ProjectState):Promise<void>;
  assetBodies:ProjectAssetBodyStore;
}
export class AgentSession {
  readonly storage=new AgentSessionStore();
  value:StoredAgentSession | undefined;
  constructor(readonly host:AgentWorkspaceHost) {}
  async load(projectId:string):Promise<void> {this.value=await this.storage.load(projectId);}
  async save():Promise<void> {if(this.value)await this.storage.save(this.value);}
  require():StoredAgentSession {if(!this.value)throw new Error("Create an agent task first.");return this.value;}
  async start(client:CompanionClient,request:AgentRequest,selectedProperties:Record<string,string[]>):Promise<AgentTask> {
    const {state,revision}=await this.host.read();
    if(state.project.id!==request.projectId||revision!==request.baseRevision)throw new Error("The project changed. Open the agent control again.");
    this.value={projectId:state.project.id,endpoint:client.endpoint,request,review:{taskId:request.id,projectId:request.projectId,baseRevision:revision,baseProject:structuredClone(state.project),proposal:{summary:"",changes:[],templates:[],coverage:[],questions:[]},decisions:{},permittedIds:request.permittedIds,selectedProperties,allowNewDefinitions:request.allowNewDefinitions,sourceKey:request.sourceKey,appliedIds:[],updatedAt:new Date().toISOString()}};
    await this.save(); // Save the identity before sending. Retry is idempotent after a lost response.
    return this.receive(await client.create(request));
  }
  async receive(task:AgentTask):Promise<AgentTask> {
    const value=this.require();
    if(task.id!==value.request.id)throw new Error("The companion returned a different task.");
    if(value.task && task.revision<value.task.revision)return value.task;
    if(task.status==="completed"&&task.proposal && (value.task?.status!=="completed"||value.task.revision!==task.revision)) value.review=mergeProposalRevision(value.review,task.proposal);
    value.task=task;await this.save();return task;
  }
  async review(review:AgentReview):Promise<void> {this.require().review=review;await this.save();}
  async revise(client:CompanionClient,feedback:string):Promise<AgentTask> {
    const value=this.require(),{state,revision}=await this.host.read();
    if(state.project.id!==value.projectId)throw new Error("Open the task's project first.");
    if(!feedback.trim())throw new Error("Enter feedback for the agent.");
    if(stableJson(state.project)!==stableJson(value.review.baseProject)) {
      value.review.baseProject=structuredClone(state.project);value.review.baseRevision=revision;
      for(const [id,item] of Object.entries(value.review.decisions))if(item.decision==="accepted"&&!value.review.appliedIds.includes(id))item.decision="pending";
    }
    const flow=(value.request.context.flow as {id?:string}|undefined)?.id??"";
    const context=projectAgentContext(state.project,value.review.permittedIds,flow,value.review.selectedProperties??{});
    value.request.context=context;await this.save();
    return this.receive(await client.revise(value.review,value.task?.revision??1,feedback,context));
  }
  async apply():Promise<number> {
    const value=this.require(),{state}=await this.host.read();
    if(value.task&&["running","queued"].includes(value.task.status))throw new Error("Wait for the agent task to finish before applying changes.");
    const result=applyAcceptedChanges(state,value.review);
    await this.host.commit(result.state);
    const current=await this.host.read();
    value.review.appliedIds=[...new Set([...value.review.appliedIds,...result.applied])];value.review.baseProject=structuredClone(current.state.project);value.review.baseRevision=current.revision;
    await this.save();return result.applied.length;
  }
  async template(client:CompanionClient,plan:TemplatePlan,action:"preview"|"download"|"save"):Promise<Blob|unknown> {
    const value=this.require(),{state,revision}=await this.host.read();
    if(state.project.id!==value.projectId)throw new Error("Open the task's project first.");
    const generated=await client.template(value.request.id,plan,action==="preview"?templatePreviewContext(state,plan,revision):undefined);
    if(action==="preview")return generated;
    const blob=await client.artifact(value.request.id,plan.id);
    if(action==="download")return blob;
    if(value.review.decisions[plan.id]?.decision!=="accepted")throw new Error("Accept the template before saving it.");
    if(stableJson(state.project)!==stableJson(value.review.baseProject))throw new Error("The project changed. Send feedback to refresh this proposal before saving.");
    await this.host.commit(await stageTemplate(state,plan,blob,this.host.assetBodies));
    const current=await this.host.read();value.review.appliedIds.push(plan.id);value.review.baseProject=structuredClone(current.state.project);value.review.baseRevision=current.revision;await this.save();
    return {saved:true};
  }
}
