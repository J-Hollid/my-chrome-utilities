import type {AgentRequest, AgentTask, AgentReview, TemplatePlan, AgentFile} from "./types.js";

export function companionEndpoint(input:string):string {
  const url = new URL(input.trim());
  if (url.username || url.password || url.search || url.hash) throw new Error("Use an endpoint URL without credentials, query, or fragment.");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) throw new Error("Use HTTP for localhost or HTTPS for a remote companion.");
  return url.href.replace(/\/$/u, "");
}
export class CompanionClient {
  readonly endpoint:string;
  constructor(endpoint:string, private token:string) {this.endpoint = companionEndpoint(endpoint);}
  async request<T>(path:string, body?:unknown):Promise<T> {
    const response = await fetch(this.endpoint + path, {method:body === undefined ? "GET" : "POST",
      headers:{Authorization:`Bearer ${this.token}`, ...(body === undefined ? {} : {"Content-Type":"application/json"})},
      ...(body === undefined ? {} : {body:JSON.stringify(body)}), signal:AbortSignal.timeout(120000), credentials:"omit", redirect:"error"});
    if (!response.ok) {const error = await response.json().catch(()=>({error:`Companion returned HTTP ${response.status}`})) as {error:string};throw new Error(error.error);}
    return response.json() as Promise<T>;
  }
  health():Promise<{protocol:number; service:string; auth:string; server:string; plan:string | null; limits?:unknown}> {return this.request("/v1/health");}
  inspect(files:AgentFile[]):Promise<unknown> {return this.request("/v1/inspect", {files});}
  create(request:AgentRequest):Promise<AgentTask> {return this.request("/v1/tasks", request);}
  task(id:string):Promise<AgentTask> {return this.request(`/v1/tasks/${encodeURIComponent(id)}`);}
  stop(id:string):Promise<AgentTask> {return this.request(`/v1/tasks/${encodeURIComponent(id)}/stop`, {});}
  revise(review:AgentReview, revision:number, feedback:string, context:unknown):Promise<AgentTask> {return this.request(`/v1/tasks/${encodeURIComponent(review.taskId)}/revise`, {review, revision, feedback, context});}
  sources(id:string):Promise<unknown> {return this.request(`/v1/tasks/${encodeURIComponent(id)}/sources`);}
  template(id:string, plan:TemplatePlan, context?:unknown):Promise<{previewCells:{address:string; value:unknown}[]}> {return this.request(`/v1/tasks/${encodeURIComponent(id)}/template`, {plan, ...(context ? {context} : {})});}
  async artifact(id:string, artifactId:string):Promise<Blob> {
    const response = await fetch(`${this.endpoint}/v1/tasks/${encodeURIComponent(id)}/artifacts/${encodeURIComponent(artifactId)}`,
      {headers:{Authorization:`Bearer ${this.token}`}, credentials:"omit", redirect:"error", signal:AbortSignal.timeout(30000)});
    if (!response.ok) throw new Error("The workbook artifact is unavailable.");
    return response.blob();
  }
}
export async function requestCompanionPermission(endpoint:string):Promise<void> {
  if (typeof chrome === "undefined" || !chrome.permissions) return;
  const url = new URL(companionEndpoint(endpoint)), origins = [`${url.protocol}//${url.hostname}/*`];
  if (!await chrome.permissions.request({origins})) throw new Error("Allow access to this companion address to connect.");
}
