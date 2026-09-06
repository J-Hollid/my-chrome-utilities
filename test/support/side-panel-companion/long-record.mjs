import {key} from "./accessibility.mjs";
import assert from "node:assert/strict";
import {writeFile} from "node:fs/promises";
import path from "node:path";
import {measureCompanion} from "./measure.mjs";
import {wait} from "./chrome.mjs";

export async function verifyLongCompanionRecord(socket,evaluate,directory) {
  const identity="project-companion-"+"stable-identity-".repeat(8);
  await evaluate(socket,`(async()=>{
    const repository=await(await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
    const {createSpecificationProject}=await import('/data-layer-specification-project.js');
    let sequence=0;const state=createSpecificationProject({name:'A long measurement workspace '+ 'UnbrokenProjectName'.repeat(10),site:'long.example.com',id:kind=>kind==='project'?${JSON.stringify(identity)}:kind+':long:'+(++sequence)});
    await repository.putProjectMetadataOnly(state,{active:true,draftToken:'long-record',draftSequence:1,publishedRevision:0});
  })()`);
  await socket.call("Page.reload");
  let ready=false;
  for(let i=0;i<160&&!ready;i++) {
    ready=await evaluate(socket,`Boolean(document.querySelector('[data-project-id="${identity}"]'))`);
    if(!ready)await wait(25);
  }
  assert.ok(ready);
  const reports=[];
  for(const width of [360,420,512]) {
    await socket.call("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:false});
    await evaluate(socket,'document.getElementById("data-layer-view-projects").click()');
    await wait(250);
    const measured=await evaluate(socket,`(${measureCompanion.toString()})()`);
    assert.equal(measured.overflow,0);assert.equal(measured.workspaceOverflow,0);
    assert.deepEqual(measured.text.filter(item=>item.ratio<4.5),[]);
    const record=await evaluate(socket,`(()=>{
      const rows=[...document.querySelectorAll('#project-library-list > li')],row=rows.find(row=>row.dataset.projectId===${JSON.stringify(identity)});
      return {unique:new Set(rows.map(row=>row.dataset.projectId)).size===rows.length,
        active:rows.filter(row=>row.dataset.active==='true').length,
        fullIdentity:row.querySelector('code').textContent,disclosed:row.querySelector('details').open,
        nameContained:row.querySelector('h4').scrollWidth<=row.querySelector('h4').clientWidth};
    })()`);
    assert.deepEqual(record,{unique:true,active:1,fullIdentity:identity,disclosed:false,nameContained:true});
    const shot=await socket.call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
    await writeFile(path.join(directory,`companion-long-project-${width}.png`),Buffer.from(shot.data,"base64"));
    reports.push({width,...record});
  }
  await evaluate(socket,`document.querySelector('[data-project-id="${identity}"] summary').focus()`);
  await key(socket,"Enter");
  const disclosed=await evaluate(socket,`(()=>{
    const details=document.querySelector('[data-project-id="${identity}"] details'),code=details.querySelector('code');
    getSelection().selectAllChildren(code);
    const complete=details.open&&code.checkVisibility()&&getSelection().toString()===${JSON.stringify(identity)};
    getSelection().removeAllRanges();return complete;
  })()`);
  assert.equal(disclosed,true,"The entire long identifier must open by keyboard and remain selectable");
  await key(socket,"Enter");
  const filtered=await evaluate(socket,`(async()=>{
    const repository=await(await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
    const before=await repository.loadProject(${JSON.stringify(identity)}),input=document.getElementById('project-library-search');
    input.value='no matching project';input.dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('project-library-sort').value='last-saved';document.getElementById('project-library-sort').dispatchEvent(new Event('change',{bubbles:true}));
    const empty=document.querySelectorAll('#project-library-list > li').length===0&&document.getElementById('active-project-card').hidden;
    return {empty,active:await repository.activeProjectId(),unchanged:JSON.stringify((await repository.loadProject(${JSON.stringify(identity)})).state.project)===JSON.stringify(before.state.project)};
  })()`);
  assert.deepEqual(filtered,{empty:true,active:identity,unchanged:true});
  return {reports,filtered};
}
