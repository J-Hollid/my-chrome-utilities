import assert from 'node:assert/strict';
export async function inspectContinuity(installed) {
 const {browser,native,websiteSession,doc}=installed;
 await browser.evaluate(websiteSession,'window.dataLayer=[]');
 await browser.evaluate(native,`document.querySelector('#workspace-tab-data-layer').click();document.querySelector('#data-layer-view-live').click();document.querySelector('#choose-observation-target').click()`);
 await browser.wait('icon capture target ready',()=>browser.evaluate(native,'!document.querySelector("#start-data-layer-testing").disabled'));
 await browser.evaluate(native,'document.querySelector("#start-data-layer-testing").click()');
 await browser.wait('icon capture subscribed',()=>browser.evaluate(websiteSession,'globalThis.__twaObservationArrays?.channels.size===1'));
 await browser.evaluate(native,`document.querySelector('#workspace-tab-tealium').click();${doc}.querySelector('.tag').click()`);
 const identity=`(async()=>{const {DATA_LAYER_SESSION_STORAGE_KEY}=await import('./utilities/data-layer/capture.js');const frame=document.querySelector('iframe[title=Tealium]');return {capture:JSON.parse(localStorage.getItem(DATA_LAYER_SESSION_STORAGE_KEY)).session.id,live:frame.src,selection:${doc}.querySelector('#raw').textContent};})()`;
 const before=await browser.evaluate(native,identity);
 for(const [i,id]of ['data-layer','hotkeys','tealium'].entries()) {
  await browser.evaluate(native,`document.querySelector('#workspace-tab-${id}').click()`);
  await browser.evaluate(websiteSession,`dataLayer.push({event:'icon_navigation_${i}'})`);
  await browser.wait('icon capture event '+i,()=>browser.evaluate(native,`document.querySelector('#live-event-feed').textContent.includes('icon_navigation_${i}')`));
 }
 assert.deepEqual(await browser.evaluate(native,identity),before);
 const events=await browser.evaluate(native,`[...document.querySelectorAll('#live-event-feed [data-event-id]')].map(x=>x.textContent)`);
 for(let i=0;i<3;i++)assert.equal(events.filter(x=>x.includes('icon_navigation_'+i)).length,1);
 const worker=(await browser.call('Target.getTargets')).targetInfos.find(t=>t.type==='service_worker'&&t.url.startsWith(browser.origin));
 const workerSession=await browser.attach(worker.targetId);
 assert.equal(await browser.evaluate(workerSession,'typeof chrome.sidePanel.close'),'function');
 const target=Number(new URL(before.live).searchParams.get('target'));
 await browser.evaluate(workerSession,`(async()=>{const tab=await chrome.tabs.get(${target});await chrome.sidePanel.close({windowId:tab.windowId});})()`);
 await browser.call('Target.detachFromTarget',{sessionId:workerSession});
 await browser.call('Extensions.triggerAction',{id:browser.extensionId,targetId:installed.websiteTab.targetId});
 const targets=await browser.wait('reopened icon host',async()=> (await browser.call('Target.getTargets',{filter:[{}]})).targetInfos,ts=>ts.some(t=>t.type!=='tab'&&t.url===browser.origin+'/side-panel.html'));
 const panel=targets.find(t=>t.type!=='tab'&&t.url===browser.origin+'/side-panel.html');
 const reopened=await browser.attach(panel.targetId);
 await browser.wait('restored icon selection',()=>browser.evaluate(reopened,'document.querySelector("#workspace-tab-tealium")?.getAttribute("aria-selected")==="true"'));
 assert.equal(await browser.evaluate(reopened,'document.querySelector("#workspace-panel-tealium").hidden'),false);
 return {sameCapture:true,sameLive:true,sameTarget:true,selection:true,eachOnce:true,reopened:true};
}
