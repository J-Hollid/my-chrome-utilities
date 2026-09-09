import assert from 'node:assert/strict';
import {verificationDigest} from '../../../scripts/verification-evidence.mjs';
import {installedTealium} from '../installed.mjs';
const installed=await installedTealium();
const {browser,native,doc,panel}=installed;
try {
  const open=async()=>{
    await browser.evaluate(native,"Array.from(document.querySelectorAll('#workspace-panel-tealium button')).find(button=>button.textContent.includes('full-width')).click()");
    const target=await browser.wait('expanded surface',async()=>
      (await browser.call('Target.getTargets')).targetInfos.find(t=>t.url.includes('/tealium/live/index.html')&&t.url.includes('surface=workbench')));
    const session=await browser.attach(target.targetId);
    await browser.wait('expanded observation',()=>browser.evaluate(session,'document.querySelector("#status")?.textContent.startsWith("Observing")'));
    return {target,session};
  };
  const first=await open();
  await browser.call('Target.closeTarget',{targetId:first.target.targetId});
  const count=await browser.evaluate(native,`Number(${doc}.documentElement.dataset.observations)`);
  await browser.wait('owner continues after expanded closure',()=>browser.evaluate(native,`Number(${doc}.documentElement.dataset.observations)>${count}`));
  await browser.evaluate(native,`${doc}.querySelector('#end').click()`);
  assert.equal(await browser.evaluate(native,`${doc}.querySelectorAll('.tag').length`),1);
  await browser.evaluate(native,`(()=>{const w=${doc}.defaultView,run=w.chrome.scripting.executeScript.bind(w.chrome.scripting);
    w.chrome.scripting.executeScript=options=>new Promise(resolve=>{w.releaseReset=()=>{w.chrome.scripting.executeScript=run;run(options).then(resolve);};});})()`);
  await browser.evaluate(native,"Array.from(document.querySelectorAll('#workspace-panel-tealium button')).find(button=>button.textContent==='Reset Tealium').click()");
  await browser.wait('explicit reset clears final snapshot',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===0&&${doc}.querySelector('#status').textContent==='Ready'`));
  await browser.wait('reset probe is held',()=>browser.evaluate(native,`typeof ${doc}.defaultView.releaseReset==='function'`));
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#start').disabled`),true);
  await browser.evaluate(native,`${doc}.querySelector('#start').click()`);
  const pre=await browser.evaluate(native,`${doc}.querySelector('#status').textContent`);
  assert.equal(pre,'Ready','The old immediate click cannot start while access is pending');
  await browser.evaluate(native,`${doc}.defaultView.releaseReset()`);
  await browser.wait('reset access probe enables Start' ,()=>browser.evaluate(native,`!${doc}.querySelector('#start').disabled`));
  await browser.evaluate(native,`${doc}.querySelector('#start').click()`);
  const second=await open();
  const post=await browser.evaluate(second.session,'document.querySelector("#status").textContent');
  const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
  if(context?.causalCategory==='other:reset access readiness') {
    const fixture={id:'tealium-reset-access-readiness-v1',causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{heldResetProbe:true,oldAction:'click Start at Ready',newAction:'wait for enabled Start'},
      expectedPreRepairFailure:pre,expectedRepairResult:post};
    const fixtureDigest=verificationDigest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
      failureDigest:context.failureDigest,fixture,preRepairResult:{status:'failed',fixtureDigest,observed:pre},
      repairResult:{status:'passed',fixtureDigest,observed:post}}}));
  }
  await browser.call('Target.closeTarget',{targetId:panel.targetId});
  await browser.wait('surviving surface reports owner Ended',()=>browser.evaluate(second.session,'document.querySelector("#status").textContent==="Ended"'));
  assert.equal(await browser.evaluate(second.session,'document.querySelector("#start").disabled'),true);
  console.log(JSON.stringify({tealiumClosure:{expandedContinues:true,resetClearsSnapshot:true,ownerEnded:true,survivingSurfaceDisabled:true}}));
}finally{await installed.close();}
