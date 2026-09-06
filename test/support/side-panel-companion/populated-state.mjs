import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import path from "node:path";
import {observeCompanionViews} from "./observations.mjs";

export async function observePopulatedCompanion(socket,evaluate,directory,waitForProjects) {
  await evaluate(socket,`(${seedPopulatedState.toString()})()`);
  await socket.call("Page.reload");
  await waitForProjects(socket);
  const populated=await evaluate(socket,`({
    templates:document.querySelectorAll('#event-template-list > li').length,
    sessions:document.querySelectorAll('#saved-session-list > li').length,
    defects:document.querySelectorAll('#defect-library-list > li').length,
    schemas:document.querySelectorAll('#schema-list [role="treeitem"]').length,
    hotkeys:document.querySelectorAll('#hotkey-editor-commands button').length,
    events:document.querySelectorAll('#live-event-feed > li').length
  })`);
  assert.ok(Object.values(populated).every(count=>count>0),JSON.stringify(populated));
  const destination=path.join(directory,"populated");
  await mkdir(destination,{recursive:true});
  const views=await observeCompanionViews(socket,evaluate,destination);
  return {populated,views};
}

async function seedPopulatedState() {
  const defects=await import("/data-layer-defect-library.js");
  const sessions=await import("/data-layer-saved-sessions.js");
  const repository=await (await import("/data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  await repository.saveSavedSchema({schema:{id:"schema:companion",name:"Purchase payload",version:1,published:true,
    document:{type:"object",properties:{event:{type:"string"}}},assignments:[],attachedRules:[]},label:"Seed companion schema"});
  const template={id:"template:companion",name:"Purchase template",eventName:"purchase",sourceId:"history",sourceName:"Event history",
    destination:"dataLayer",tags:[],validation:"Valid",payload:{event:"purchase",currency:"EUR"},version:1,provenance:"saved",
    originatingSessionId:"session:companion",originatingEventId:"event:companion"};
  localStorage.setItem("my-chrome-utilities.event-template-library.v1",JSON.stringify([template]));
  const event={id:"event:companion",name:"purchase",sourceId:"history",sourceName:"Event history",captureTime:"2026-09-06T12:00:00Z",
    pageUrl:"https://retail.example.com/checkout",payload:template.payload,rawInput:template.payload,validation:"Not checked"};
  const saved=sessions.saveCompletedSession(sessions.createSavedSessionLibrary(),{
    id:"session:companion",pageScope:event.pageUrl,startedAt:event.captureTime,endedAt:event.captureTime,events:[event]},"Checkout evidence");
  localStorage.setItem("my-chrome-utilities.saved-session-library.v1",sessions.serializeSavedSessionLibrary(saved));
  const defect=defects.createMissingEventDefect({id:"defect:companion",now:event.captureTime,report:{summary:"Expected confirmation event was missing"}});
  localStorage.setItem(defects.DEFECT_LIBRARY_STORAGE_KEY,defects.serializeDefectLibrary({defects:[defect]}));
  localStorage.setItem("dataLayerTestingSession",JSON.stringify({session:{id:"session:companion",status:"ended",freshBoundary:true,
    tabId:1,historyPath:"dataLayer",startUrl:event.pageUrl,currentUrl:event.pageUrl,timeline:[{...event,type:"observed",url:event.pageUrl,
      timestamp:event.captureTime,observerPath:"dataLayer",sessionId:"session:companion",sourceKind:"Data layer",rawValue:event.rawInput}]}}));
}
