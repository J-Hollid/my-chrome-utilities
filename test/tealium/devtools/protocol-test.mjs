import {checkConnectionRecovery} from './connection-recovery-check.mjs';
import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
import {observeBridge} from './bridge-observer.mjs';
import {sourceNavigationPackage} from './fixture.mjs';
const fixture=await sourceNavigationPackage();
let installed;
try {
  await checkConnectionRecovery(fixture.extensionRoot, false);
  await checkConnectionRecovery(fixture.extensionRoot, true);
  installed=await installedTealium({extensionRoot:fixture.extensionRoot,fixtureName:'frames'});
  const {browser,native,doc,website,websiteSession}=installed;
  await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
  const key=await browser.evaluate(native,`${doc}.querySelector('#raw').textContent`);
  const other=await browser.call('Target.createTarget',{url:installed.fixture.origin+'/custom',background:true});
  await browser.call('Target.openDevTools',{targetId:other.targetId});
  const otherFront=await browser.wait('other website DevTools',async()=>
    (await browser.call('Target.getTargets')).targetInfos.find(t=>t.url.startsWith('devtools://')&&t.title.includes('/custom')));
  const otherSession=await browser.attach(otherFront.targetId);
  const editor=`(async()=>{const S=await import('./panels/sources/sources.js');const v=S.SourcesPanel.SourcesPanel.instance().sourcesView();return v.currentUISourceCode()?.url()??null;})()`;
  const otherBefore=await browser.evaluate(otherSession,editor);
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#show-source').disabled`),true);
  await browser.call('Target.openDevTools',{targetId:website.targetId});
  const front=await browser.wait('bound website DevTools',async()=>
    (await browser.call('Target.getTargets')).targetInfos.find(t=>t.url.startsWith('devtools://')&&t.title.includes('/frames')));
  const frontSession=await browser.attach(front.targetId);
  await browser.wait('matching bridge resolves selection',()=>browser.evaluate(native,`({enabled:!${doc}.querySelector('#show-source').disabled,status:${doc}.querySelector('#source-status').textContent,feedback:${doc}.querySelector('#feedback').textContent})`),value=>value.enabled);
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#raw').textContent`),key);
  await browser.evaluate(native,`${doc}.querySelector('#show-source').click()`);
  await browser.wait('correct editor receives owner action',()=>browser.evaluate(frontSession,editor),url=>url?.includes('/custom/utag.21.js?revision=7'));
  assert.equal(await browser.evaluate(otherSession,editor),otherBefore);
  const bridge=await observeBridge(browser,JSON.parse(key).tabId);
  await browser.evaluate(native,"Array.from(document.querySelectorAll('#workspace-panel-tealium button')).find(button=>button.textContent.includes('full-width')).click()");
  const full=await browser.wait('full-width source surface',async()=>
    (await browser.call('Target.getTargets')).targetInfos.find(t=>t.url.includes('/tealium/live/index.html')&&t.url.includes('surface=workbench')));
  const expanded=await browser.attach(full.targetId);
  await browser.wait('shared source selection ready',()=>browser.evaluate(expanded,'!document.querySelector("#show-source").disabled'));
  await browser.evaluate(expanded,'document.querySelector("#show-source").click()');
  await browser.wait('full-width action uses production bridge',()=>browser.evaluate(bridge,'openCalls.length===1'));
  assert.equal(await browser.evaluate(otherSession,editor),otherBefore);
  const rejects=await browser.evaluate(native,`(async()=>{
    const w=${doc}.defaultView,row=JSON.parse(${doc}.querySelector('#raw').textContent),port=w.chrome.runtime.connect({name:'tealium-live'});
    port.postMessage({type:'bind',tabId:row.tabId,sessionId:'controlled-current'});
    const results=[];
    for(const [name,override,sessionId] of [['session',{},'old'],['profile',{profile:'not-current'},'controlled-current'],['frame',{frameId:987654},'controlled-current'],['tag',{uid:'987654'},'controlled-current']]) {
      results.push(await new Promise(resolve=>{const listen=message=>{if(message.requestId!==name)return;port.onMessage.removeListener(listen);resolve({name,error:message.error});};port.onMessage.addListener(listen);port.postMessage({type:'source',requestId:name,sessionId,row:{...row,...override},open:true});}));
    }
    port.disconnect();
    const senderRejected=await new Promise(resolve=>{const unexpected=chrome.runtime.connect({name:'tealium-live'});unexpected.onDisconnect.addListener(()=>{void chrome.runtime.lastError;resolve(true);});});
    return {results,senderRejected};
  })()`);
  assert.equal(rejects.senderRejected,true);assert.equal(rejects.results.length,4);
  for(const result of rejects.results)assert.ok(result.error,JSON.stringify(result));
  assert.equal(await browser.evaluate(bridge,'openCalls.length'),1);
  const worker=(await browser.call('Target.getTargets')).targetInfos.find(target=>target.type==='service_worker'&&target.url.startsWith(browser.origin));
  const workerSession=await browser.attach(worker.targetId);
  await browser.evaluate(workerSession,`globalThis.actualScript=chrome.scripting.executeScript.bind(chrome.scripting);
    globalThis.heldValidation=[];chrome.scripting.executeScript=options=>options.target.documentIds?
      new Promise(resolve=>heldValidation.push(()=>actualScript(options).then(resolve))):actualScript(options)`);
  await browser.evaluate(native,`${doc}.querySelector('#show-source').click()`);
  await browser.wait('broker validation held',()=>browser.evaluate(workerSession,'heldValidation.length===1'));
  await browser.wait('whole source deadline feedback',()=>browser.evaluate(native,`${doc}.querySelector('#feedback').textContent.includes('did not finish')`));
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#raw').textContent`),key);
  assert.ok((await browser.evaluate(native,`${doc}.querySelector('#status').textContent`)).startsWith('Observing'));
  await browser.evaluate(workerSession,'chrome.scripting.executeScript=actualScript;heldValidation.forEach(release=>release())');
  await browser.evaluate(bridge,'new Promise(resolve=>setTimeout(resolve,100))');
  assert.equal(await browser.evaluate(bridge,'openCalls.length'),1,'Late validation cannot open the editor');
  await browser.evaluate(bridge,'globalThis.actualResources=chrome.devtools.inspectedWindow.getResources;chrome.devtools.inspectedWindow.getResources=()=>{}');
  await browser.evaluate(native,`${doc}.querySelector('#show-source').click()`);
  await browser.wait('bounded source load failure',()=>browser.evaluate(native,`${doc}.querySelector('#feedback').textContent.includes('did not finish')`));
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#inspector').hidden`),false);
  assert.ok((await browser.evaluate(native,`${doc}.querySelector('#status').textContent`)).startsWith('Observing'));
  await browser.evaluate(bridge,'chrome.devtools.inspectedWindow.getResources=actualResources');
  await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
  // Retry uses current page evidence; changing selection requests fresh resolution.
  await browser.evaluate(native,`${doc}.querySelector('#back').click();${doc}.querySelector('.tag').click()`);
  await browser.wait('source load retry resolves',()=>browser.evaluate(native,`!${doc}.querySelector('#show-source').disabled`));
  await browser.call('Target.closeTarget',{targetId:front.targetId});
  await browser.wait('closed bridge disables action',()=>browser.evaluate(native,`${doc}.querySelector('#show-source').disabled`));
  assert.ok((await browser.evaluate(native,`${doc}.querySelector('#status').textContent`)).startsWith('Observing'));
  console.log(JSON.stringify({tealiumProtocol:{preview:fixture.preview,otherTabDisabled:true,selectionRetained:true,correctEditor:true,otherEditorUnchanged:true,disconnectObserving:true,fullWidthAction:true,sourceFailureRetained:true,wholeDeadline:true,lateValidationRejected:true,retryResolved:true,rejects}}));
}finally{await installed?.close();await fixture.close();}
