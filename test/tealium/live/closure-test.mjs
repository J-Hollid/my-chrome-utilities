import assert from 'node:assert/strict';
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
  await browser.evaluate(native,"Array.from(document.querySelectorAll('#workspace-panel-tealium button')).find(button=>button.textContent==='Reset Tealium').click()");
  await browser.wait('explicit reset clears final snapshot',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===0&&${doc}.querySelector('#status').textContent==='Ready'`));
  await browser.evaluate(native,`${doc}.querySelector('#start').click()`);
  const second=await open();
  await browser.call('Target.closeTarget',{targetId:panel.targetId});
  await browser.wait('surviving surface reports owner Ended',()=>browser.evaluate(second.session,'document.querySelector("#status").textContent==="Ended"'));
  assert.equal(await browser.evaluate(second.session,'document.querySelector("#start").disabled'),true);
  console.log(JSON.stringify({tealiumClosure:{expandedContinues:true,resetClearsSnapshot:true,ownerEnded:true,survivingSurfaceDisabled:true}}));
}finally{await installed.close();}
