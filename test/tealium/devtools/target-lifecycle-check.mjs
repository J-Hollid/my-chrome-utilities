import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
import {observeBridge} from './bridge-observer.mjs';
export async function checkTargetLifecycle(extensionRoot) {
 const results=[];
 for(const change of ['extensions','end']) {
  const installed=await installedTealium({extensionRoot,fixtureName:'targets-definitions'});
  const {browser,native,doc,website,websiteSession}=installed;
  try {
   await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
   const row=await browser.evaluate(native,`JSON.parse(${doc}.querySelector('#raw').textContent)`);
   await browser.call('Target.openDevTools',{targetId:website.targetId});
   await browser.wait('extension action available',()=>browser.evaluate(native,`!${doc}.querySelector('#show-extend').disabled`));
   const bridge=await observeBridge(browser,row.tabId);
   await browser.evaluate(bridge,`(()=>{const original=chrome.devtools.inspectedWindow.getResources.bind(chrome.devtools.inspectedWindow);globalThis.held=null;chrome.devtools.inspectedWindow.getResources=callback=>original(resources=>{if(!held)held=()=>callback(resources);else callback(resources);});})()`);
   await browser.evaluate(native,`${doc}.querySelector('#show-extend').click()`);
   await browser.wait('extension action held',()=>browser.evaluate(bridge,'typeof held==="function"'));
   if(change==='extensions') {
    await browser.evaluate(websiteSession,"utag.sender[21].extend=[function replacementExtension(){window.calls++}]");
    await browser.wait('changed extension observed',()=>browser.evaluate(native,`${doc}.querySelector('#raw').textContent.includes('replacementExtension')`));
   } else await browser.evaluate(native,`${doc}.querySelector('#end').click()`);
   await browser.evaluate(bridge,'held()');
   if(change==='end') {
    await browser.evaluate(native,`${doc}.querySelector('#start').click()`);
    await browser.wait('new session rows',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===2`));
    await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
   }
   await browser.wait('current extension destination ready',()=>browser.evaluate(native,`!${doc}.querySelector('#show-extend').disabled`));
   assert.equal(await browser.evaluate(bridge,'openCalls.length'),0,'A cancelled extension action cannot open or replay');
   await browser.evaluate(native,`${doc}.querySelector('#show-extend').click()`);
   await browser.wait('new extension action opens once',()=>browser.evaluate(bridge,'openCalls.length===1'));
   const front=(await browser.call('Target.getTargets')).targetInfos.find(t=>t.url.startsWith('devtools://')&&t.title.includes('/targets-definitions'));
   const session=await browser.attach(front.targetId);
   await browser.wait('current actual editor',()=>browser.evaluate(session,`(async()=>{const S=await import('./panels/sources/sources.js');const v=S.SourcesPanel.SourcesPanel.instance().sourcesView();return {url:v.currentUISourceCode()?.url(),text:v.currentSourceFrame()?.textEditor?.state?.doc?.toString()};})()`),v=>v.url?.includes('/targets/bundle.js?revision=source-targets')&&v.text?.length>0);
   assert.equal(await browser.evaluate(websiteSession,'window.calls'),0);
   results.push({change,action:'Go to u.extend',oldOpened:0,newOpened:1,actualEditor:true});
  }finally{await installed.close();}
 }
 return results;
}
