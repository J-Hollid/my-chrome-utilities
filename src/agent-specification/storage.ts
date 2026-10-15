import type {AgentRequest, AgentReview, AgentTask} from "./types.js";

export interface StoredAgentSession {projectId:string; endpoint:string; request:AgentRequest; review:AgentReview; task?:AgentTask}
export class AgentSessionStore {
  private opening?:Promise<IDBDatabase>;
  private database():Promise<IDBDatabase> {
    return this.opening ??= new Promise((resolve,reject)=>{
      const request = indexedDB.open("twatility-agent-sessions",1);
      request.onupgradeneeded = ()=>request.result.createObjectStore("sessions",{keyPath:"projectId"});
      request.onsuccess = ()=>resolve(request.result);
      request.onerror = ()=>reject(request.error);
    });
  }
  async load(projectId:string):Promise<StoredAgentSession | undefined> {
    const db = await this.database();
    return new Promise((resolve,reject)=>{const request = db.transaction("sessions").objectStore("sessions").get(projectId);request.onsuccess = ()=>resolve(request.result as StoredAgentSession | undefined);request.onerror = ()=>reject(request.error);});
  }
  async save(value:StoredAgentSession):Promise<void> {
    const db = await this.database();
    await new Promise<void>((resolve,reject)=>{const transaction = db.transaction("sessions","readwrite");transaction.objectStore("sessions").put(structuredClone(value));transaction.oncomplete = ()=>resolve();transaction.onerror = ()=>reject(transaction.error);transaction.onabort = ()=>reject(transaction.error ?? new Error("The agent review could not be saved."));});
  }
}
