import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';

const installed=await installedTealium({fixtureName:'frames'});
const {browser,native,doc}=installed;
try {
  await browser.wait('accessible frames and partial coverage',()=>browser.evaluate(native,
    `${doc}.querySelectorAll('.tag').length===2&&${doc}.querySelector('#coverage').textContent.includes('Partial coverage')`));
  const before=await browser.evaluate(native,`({url:${doc}.querySelector('#target').textContent,keys:Array.from(${doc}.querySelectorAll('.tag')).map(row=>row.dataset.key)})`);
  await browser.evaluate(native,`(()=>{
    const w=${doc}.defaultView;w.permissionRequests=[];w.actualPermissionRequest=w.chrome.permissions.request.bind(w.chrome.permissions);
    // The consent choice is controlled; the grant itself is applied through
    // Chrome's own extension settings API, then confirmed by real page reads.
    w.chrome.permissions.request=options=>{w.permissionRequests.push(options);return new Promise(resolve=>w.permissionDecision=resolve);};
    ${doc}.querySelector('#frame-access button').click();
  })()`);
  const request=await browser.evaluate(native,`${doc}.defaultView.permissionRequests[0]`);
  assert.deepEqual(request,{origins:[installed.fixture.origin.replace('shop.example','frames.shop.example')+'/*']});
  await browser.evaluate(native,`${doc}.defaultView.permissionDecision(false)`);
  assert.equal(await browser.evaluate(native,`${doc}.querySelectorAll('.tag').length`),2);
  const manager=await browser.call('Target.createTarget',{url:'chrome://extensions',background:true});
  const settings=await browser.attach(manager.targetId);
  await browser.wait('Chrome extension settings API',()=>browser.evaluate(settings,'Boolean(chrome.developerPrivate?.addHostPermission)'));
  await browser.evaluate(native,`${doc}.querySelector('#frame-access button').click()`);
  await browser.evaluate(settings,`chrome.developerPrivate.addHostPermission(${JSON.stringify(browser.extensionId)},${JSON.stringify(request.origins[0])})`);
  const granted=await browser.evaluate(native,`${doc}.defaultView.actualPermissionRequest(${JSON.stringify(request)})`);
  assert.equal(granted,true,'Chrome activates the approved optional origin');
  await browser.evaluate(native,`${doc}.defaultView.permissionDecision(true)`);
  await browser.wait('Chrome grant expands frame coverage',()=>browser.evaluate(native,`(async()=>({rows:${doc}.querySelectorAll('.tag').length,status:${doc}.querySelector('#status').textContent,coverage:${doc}.querySelector('#coverage').textContent,grants:await ${doc}.defaultView.chrome.permissions.getAll()}))()`),value=>value.rows===3);
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#coverage').textContent.includes('Partial coverage')`),false);
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#target').textContent`),before.url);
  const keys=await browser.evaluate(native,`Array.from(${doc}.querySelectorAll('.tag')).map(row=>row.dataset.key)`);
  assert.equal(new Set(keys).size,3);
  console.log(JSON.stringify({tealiumFrameAccess:{before:2,after:3,declinedRetained:true,exactOrigin:request.origins[0],sameTarget:true,distinctRows:true,consentAdapter:true,realChromeGrant:true}}));
}finally{await installed.close();}
