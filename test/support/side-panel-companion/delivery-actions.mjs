import assert from "node:assert/strict";
import {writeFile} from "node:fs/promises";
import path from "node:path";
import {targetSocket,wait} from "./chrome.mjs";

export async function verifyCompanionDelivery(socket,evaluate,port,directory) {
  const snapshot="(async()=>{const repository=await(await import(\"/data-layer-durable-project-repository.js\")).openIndexedDbProjectRepository();return JSON.stringify((await repository.loadProject(\"project-retail\")).state.project);})()";
  const storedBefore=await evaluate(socket,snapshot);
  const archive=await evaluate(socket,`(${exportAndReview.toString()})()`);
  assert.ok(archive.bytes>0&&archive.bytes<5*1024*1024);
  assert.deepEqual({...archive,bytes:0},{bytes:0,closed:1,review:true,cancelled:true,unchanged:true});
  const before=await socket.call("Target.getTargets");
  await evaluate(socket,`(()=>{const row=document.querySelector('#project-library-list > li[data-active=true]');
    const open=[...row.querySelectorAll('button')].find(button=>button.textContent==='Open in Specification Studio');open.focus();open.click();})()`);
  let target;
  for(let i=0;i<100&&!target;i++) {
    const targets=await fetch(`http://127.0.0.1:${port}/json/list`).then(response=>response.json());
    target=targets.find(item=>item.type==="page"&&item.url.includes("specification-builder.html?project=project-retail")&&!before.targetInfos.some(old=>old.targetId===item.id));
    if(!target)await wait(25);
  }
  assert.ok(target,"Open in Specification Studio must open the selected stable project");
  const studio=await targetSocket(target.webSocketDebuggerUrl);
  try {
    await studio.call("Emulation.setDeviceMetricsOverride",{width:1280,height:900,deviceScaleFactor:1,mobile:false});
    let ready=false;
    for(let i=0;i<160&&!ready;i++) {
      ready=await evaluate(studio,'document.documentElement.dataset.specificationStudioInitialization === "complete"');
      if(!ready)await wait(25);
    }
    assert.ok(ready,"Studio must finish loading the same saved project");
    const report=await evaluate(studio,`({project:new URL(location.href).searchParams.get('project'),
      paper:getComputedStyle(document.body).backgroundColor,ink:getComputedStyle(document.body).color,
      sidePanelSheets:[...document.styleSheets].filter(sheet=>sheet.href?.includes('side-panel-brand')).length})`);
    assert.equal(report.project,"project-retail");assert.equal(report.sidePanelSheets,0);
    assert.equal(await evaluate(studio,snapshot),storedBefore,"Studio opening must preserve the stored project snapshot");
    const shot=await studio.call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
    await writeFile(path.join(directory,"companion-studio-1280.png"),Buffer.from(shot.data,"base64"));
    return {archive,studio:report};
  } finally {
    studio.close();await socket.call("Target.closeTarget",{targetId:target.id});
  }
}

async function exportAndReview() {
  const repository=await (await import("/data-layer-durable-project-repository.js")).openIndexedDbProjectRepository();
  const before=await repository.loadProject("project-retail"),picker=Object.getOwnPropertyDescriptor(globalThis,"showSaveFilePicker");
  const chunks=[];let bytes=0,closed=0;
  const until=async(predicate)=>{for(let i=0;i<200&&!predicate();i++)await new Promise(resolve=>setTimeout(resolve,10));if(!predicate())throw Error("Project export/import did not settle");};
  const row=document.querySelector('#project-library-list > li[data-active=true]');
  const control=[...row.querySelectorAll('button')].find(button=>button.textContent==='Export');
  try {
    Object.defineProperty(globalThis,"showSaveFilePicker",{configurable:true,value:async()=>({createWritable:async()=>({
      write:async chunk=>{bytes+=chunk.byteLength;if(bytes>5*1024*1024)throw Error("Fixture export limit");chunks.push(Uint8Array.from(chunk));},close:async()=>{closed++;}})})});
    control.focus();control.click();
    await until(()=>document.getElementById('project-library-status').textContent.startsWith('Exported '));
    const transfer=new DataTransfer();transfer.items.add(new File(chunks,'companion-project.zip',{type:'application/zip'}));
    const input=document.getElementById('import-library-project-file');
    Object.defineProperty(input,'files',{configurable:true,value:transfer.files});input.dispatchEvent(new Event('change',{bubbles:true}));
    await until(()=>Boolean(document.querySelector('dialog[open]')));
    const dialog=document.querySelector('dialog[open]'),review=dialog.textContent.includes(before.state.project.name);
    [...dialog.querySelectorAll('button')].find(button=>button.textContent==='Close import review').click();await until(()=>!dialog.isConnected);
    Object.defineProperty(globalThis,"showSaveFilePicker",{configurable:true,value:async()=>{throw new DOMException('Controlled picker cancellation','AbortError');}});
    control.focus();control.click();await until(()=>document.getElementById('project-library-status').textContent.includes('Controlled picker cancellation'));
    return {bytes,closed,review,cancelled:document.activeElement===control,
      unchanged:JSON.stringify((await repository.loadProject('project-retail')).state.project)===JSON.stringify(before.state.project)};
  } finally {
    if(picker)Object.defineProperty(globalThis,'showSaveFilePicker',picker);else delete globalThis.showSaveFilePicker;
  }
}
