import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
import {sourceNavigationPackage} from './fixture.mjs';
import {observeBridge} from './bridge-observer.mjs';
const fixture=await sourceNavigationPackage(),results=[];
try {
  for(const event of ['reload','child','session']) {
    const installed=await installedTealium({extensionRoot:fixture.extensionRoot,fixtureName:'frames'});
    const {browser,native,doc,website,websiteSession}=installed;
    try {
      const selector=event==='child'?'.tag:nth-child(2)':'.tag:first-child';
      await browser.evaluate(native,`${doc}.querySelector(${JSON.stringify(selector)}).click()`);
      const row=await browser.evaluate(native,`JSON.parse(${doc}.querySelector('#raw').textContent)`);
      await browser.call('Target.openDevTools',{targetId:website.targetId});
      await browser.wait('resolved current tag',()=>browser.evaluate(native,`!${doc}.querySelector('#show-source').disabled`));
      const bridge=await observeBridge(browser,row.tabId);
      await browser.evaluate(bridge,`(()=>{const original=chrome.devtools.inspectedWindow.getResources.bind(chrome.devtools.inspectedWindow);globalThis.held=null;chrome.devtools.inspectedWindow.getResources=callback=>original(resources=>{if(!held)held=()=>callback(resources);else callback(resources);});})()`);
      await browser.evaluate(native,`${doc}.querySelector('#show-source').click()`);
      await browser.wait('real resource callback held',()=>browser.evaluate(bridge,'typeof held==="function"'));
      if(event==='reload')await browser.call('Page.reload',{},websiteSession);
      if(event==='child')await browser.evaluate(websiteSession,"document.querySelector('iframe').contentWindow.location.reload()");
      if(event==='session')await browser.evaluate(native,`${doc}.querySelector('#end').click();${doc}.querySelector('#start').click()`);
      await browser.wait('old selection invalidated',()=>browser.evaluate(native,`${doc}.querySelector('#inspector').hidden`));
      await browser.evaluate(bridge,'held()');
      await browser.wait('current inventory ready',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===2`));
      await browser.evaluate(native,`${doc}.querySelector(${JSON.stringify(selector)}).click()`);
      await browser.wait('new selection source ready',()=>browser.evaluate(native,`!${doc}.querySelector('#show-source').disabled`));
      assert.equal(await browser.evaluate(bridge,'openCalls.length'),0,'The stale request cannot open a resource');
      await browser.evaluate(native,`${doc}.querySelector('#show-source').click()`);
      await browser.wait('current action opens once',()=>browser.evaluate(bridge,'openCalls.length===1'));
      const current=await browser.evaluate(native,`JSON.parse(${doc}.querySelector('#raw').textContent)`);
      if(event!=='session')assert.notEqual(current.documentId,row.documentId);
      results.push({event,staleOpened:0,currentOpened:1,realLifecycle:true});
    }finally{await installed.close();}
  }
  console.log(JSON.stringify({tealiumSourceLifecycle:{preview:fixture.preview,results}}));
}finally{await fixture.close();}
