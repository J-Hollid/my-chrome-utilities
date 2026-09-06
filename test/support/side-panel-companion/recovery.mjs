import assert from "node:assert/strict";
import {measureCompanion} from "./measure.mjs";

export async function verifyCompanionRecovery(socket,evaluate) {
  await evaluate(socket,`(${openFailure.toString()})()`);
  try {
    const measured=await evaluate(socket,`(${measureCompanion.toString()})()`);
    assert.deepEqual(measured.text.filter(text=>text.ratio<4.5),[],"Failed storage and disabled recovery controls must remain readable");
    const result=await evaluate(socket,`(${exerciseFailure.toString()})()`);
    assert.deepEqual(result,{error:true,retry:1,exported:1,rejected:0,success:true,focus:true,unchanged:true});
    return result;
  } finally {
    await evaluate(socket,`(()=>{const state=globalThis.companionRecovery;if(state){state.copy.querySelector('dialog[open]')?.close();state.copy.replaceWith(state.original);delete globalThis.companionRecovery;}})()`);
  }
}

async function openFailure() {
  document.getElementById("data-layer-view-projects").click();
  const original=document.getElementById("durable-project-repository"),copy=original.cloneNode(true);
  original.replaceWith(copy);
  const repository=await (await import("/data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  const {mountDurableProjectRepositoryUi}=await import("/data-layer-durable-project-repository-ui.js");
  const ui=await mountDurableProjectRepositoryUi(copy,indexedDB,repository);
  const state={original,copy,repository,retry:0,exported:0,rejected:0,before:await repository.loadProject("project-retail")};
  globalThis.companionRecovery=state;
  const origin=copy.querySelector("#open-storage-recovery");origin.focus();
  await ui.reportSaveFailure({projectId:"project-retail",projectName:"Retail website",command:{label:"Save fixture metadata"},
    originControl:origin,retry:async()=>{state.retry++;},reject:async()=>{state.rejected++;},exportUnsaved:()=>{state.exported++;}},
    new Error("Controlled storage failure"));
}

async function exerciseFailure() {
  const state=globalThis.companionRecovery,q=selector=>state.copy.querySelector(selector);
  const error=q("#durable-repository-status").textContent.includes("Controlled storage failure")&&q("#durable-storage-recovery").open
    &&["#retry-durable-save","#reject-durable-save","#export-unsaved-draft"].every(selector=>!q(selector).disabled);
  q("#export-unsaved-draft").click();q("#retry-durable-save").click();
  for(let i=0;i<100&&!q("#retry-durable-save").disabled;i++) await new Promise(resolve=>setTimeout(resolve,10));
  const success=q("#retry-durable-save").disabled&&q("#durable-recovery-result").textContent.includes("saved.");
  q("#close-storage-recovery").click();
  return {error,retry:state.retry,exported:state.exported,rejected:state.rejected,success,
    focus:document.activeElement===q("#open-storage-recovery"),
    unchanged:JSON.stringify(await state.repository.loadProject("project-retail"))===JSON.stringify(state.before)};
}
