import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
import {sourceNavigationPackage} from '../devtools/fixture.mjs';
const packaged=await sourceNavigationPackage();
const installed=await installedTealium({extensionRoot:packaged.extensionRoot});
const {browser,native,doc,websiteSession}=installed;
try {
  const url=installed.fixture.origin.replace('shop.example','frames.shop.example')+'/separate';
  await browser.evaluate(native,`(()=>{const w=${doc}.defaultView;w.tabChanges=[];w.chrome.tabs.onUpdated.addListener((id,change,tab)=>w.tabChanges.push({id,change,url:tab.url}));})()`);
  await browser.call('Page.navigate',{url},websiteSession);
  const state=await browser.wait('navigation access loss',()=>browser.evaluate(native,
    `({status:${doc}.querySelector('#status').textContent,url:${doc}.querySelector('#target').textContent,requestDisabled:${doc}.querySelector('#access').disabled})`),value=>value.status.startsWith('Permission required'));
  const changes=await browser.evaluate(native,`${doc}.defaultView.tabChanges`);
  assert.equal(state.url,url,JSON.stringify({state,changes}));
  assert.equal(state.requestDisabled,false);
  await browser.evaluate(native,`(()=>{const w=${doc}.defaultView;w.requests=[];w.actualRequest=w.chrome.permissions.request.bind(w.chrome.permissions);w.chrome.permissions.request=request=>{w.requests.push(request);return new Promise(resolve=>w.decide=resolve);};${doc}.querySelector('#access').click();})()`);
  let request=await browser.evaluate(native,`${doc}.defaultView.requests[0]`);
  assert.deepEqual(request,{origins:[new URL(url).origin+'/*']});
  await browser.evaluate(native,`${doc}.defaultView.decide(false)`);
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#status').textContent`),'Permission required');
  const manager=await browser.call('Target.createTarget',{url:'chrome://extensions',background:true});
  const settings=await browser.attach(manager.targetId);
  await browser.wait('extension permission settings',()=>browser.evaluate(settings,'Boolean(chrome.developerPrivate?.addHostPermission)'));
  const grant=async()=>{
    await browser.evaluate(native,`${doc}.querySelector('#access').click()`);
    await browser.evaluate(settings,`chrome.developerPrivate.addHostPermission(${JSON.stringify(browser.extensionId)},${JSON.stringify(request.origins[0])})`);
    assert.equal(await browser.evaluate(native,`${doc}.defaultView.actualRequest(${JSON.stringify(request)})`),true);
    await browser.evaluate(native,`${doc}.defaultView.decide(true)`);
  };
  await grant();
  await browser.wait('same target resumes after grant',()=>browser.evaluate(native,`${doc}.querySelector('#status').textContent.startsWith('Observing')&&${doc}.querySelectorAll('.tag').length===1`));
  await browser.call('Target.openDevTools',{targetId:installed.website.targetId});
  await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
  await browser.wait('source ready before real grant loss',()=>browser.evaluate(native,`!${doc}.querySelector('#show-source').disabled`));
  const selection=await browser.evaluate(native,`${doc}.querySelector('#raw').textContent`);
  await browser.evaluate(native,`${doc}.defaultView.chrome.permissions.remove(${JSON.stringify(request)})`);
  await browser.wait('observing grant revoked',()=>browser.evaluate(native,`${doc}.querySelector('#status').textContent.startsWith('Permission required')`));
  await grant();
  await browser.wait('revoked grant restored',()=>browser.evaluate(native,`${doc}.querySelector('#status').textContent.startsWith('Observing')`));
  await browser.wait('same selection resolves after real grant recovery',()=>browser.evaluate(native,`!${doc}.querySelector('#show-source').disabled`));
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#raw').textContent`),selection);

  await browser.evaluate(native,`${doc}.querySelector('#pause').click()`);
  await browser.evaluate(native,`${doc}.defaultView.chrome.permissions.remove(${JSON.stringify(request)})`);
  await browser.wait('paused target loses grant',()=>browser.evaluate(native,`${doc}.querySelector('#status').textContent.startsWith('Permission required')`));
  await grant();
  await browser.wait('grant preserves paused intent',()=>browser.evaluate(native,`${doc}.querySelector('#status').textContent.startsWith('Paused')`));
  const pausedUrl=url.replace('frames.shop.example','tags.shop.example');
  await browser.call('Page.navigate',{url:pausedUrl},websiteSession);
  await browser.wait('paused navigation hides an unavailable current address',()=>browser.evaluate(native,`({status:${doc}.querySelector('#status').textContent,url:${doc}.querySelector('#target').textContent,disabled:${doc}.querySelector('#access').disabled})`),state=>state.status.startsWith('Permission required')&&state.disabled&&!state.url.includes('/separate'));
  // Chrome does not expose the new address after this optional-origin grant.
  // A new real extension action supplies activeTab; no address is guessed.
  await browser.call('Extensions.triggerAction',{id:browser.extensionId,targetId:installed.websiteTab.targetId});
  await browser.evaluate(native,`${doc}.querySelector('#retry').click()`);
  await browser.wait('new activeTab grant preserves paused intent',()=>browser.evaluate(native,`${doc}.querySelector('#status').textContent==='Paused'&&${doc}.querySelector('#target').textContent===${JSON.stringify(pausedUrl)}`));
  await browser.evaluate(native,`${doc}.querySelector('#end').click()`);
  await browser.evaluate(native,`${doc}.defaultView.chrome.permissions.remove(${JSON.stringify(request)})`);
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#status').textContent`),'Ended');
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#target').textContent`),pausedUrl);
  console.log(JSON.stringify({tealiumAccessRecovery:{pinnedNavigation:true,exactRecoveryUrl:true,declined:true,observingRecovered:true,pausedRecovered:true,observingRevoked:true,pausedNavigation:true,endedNotResumed:true,unknownAddressNotGuessed:true,activeTabRecovery:true,realChromeGrant:true,devtoolsGrantRecovery:true,selectionRetained:true,request,state}}));
}finally{await installed.close();await packaged.close();}
