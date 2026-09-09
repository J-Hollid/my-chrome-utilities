import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';

const installed=await installedTealium();
const {browser,native,websiteSession,doc}=installed;
try {
  await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
  const oldKey=await browser.evaluate(native,`${doc}.querySelector('.tag').dataset.key`);
  await browser.evaluate(native,`(()=>{
    const w=${doc}.defaultView,original=w.chrome.scripting.executeScript.bind(w.chrome.scripting);
    w.tealiumReadCalls=0;
    w.chrome.scripting.executeScript=async options=>{
      const result=await original(options);
      if(options.func.name==='readTealiumPage'&&!w.heldRead){
        w.tealiumReadCalls++;w.heldRead={result};await new Promise(resolve=>w.heldRead.release=resolve);
      }
      return result;
    };
  })()`);
  await browser.wait('production page read held',()=>browser.evaluate(native,`Boolean(${doc}.defaultView.heldRead?.release)`));
  const count=await browser.evaluate(native,`${doc}.documentElement.dataset.observations`);
  await browser.evaluate(native,`${doc}.querySelector('#pause').click();${doc}.defaultView.heldRead.release()`);
  await browser.wait('pause acknowledged',()=>browser.evaluate(native,`${doc}.querySelector('#status').textContent==='Paused'`));
  assert.equal(await browser.evaluate(native,`${doc}.documentElement.dataset.observations`),count);
  await browser.evaluate(websiteSession,"history.pushState({},'',location.pathname+'#same-document')");
  await browser.wait('same-document context',()=>browser.evaluate(native,`${doc}.querySelector('#target').textContent.includes('#same-document')`));
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('.tag').dataset.key`),oldKey);
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#inspector').hidden`),false);
  await browser.call('Page.reload',{},websiteSession);
  await browser.wait('same-URL reload invalidates rows while paused',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===0`));
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#inspector').hidden`),true);
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#status').textContent`),'Paused');
  await browser.evaluate(native,`${doc}.querySelector('#resume').click()`);
  await browser.wait('replacement document inventory',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===1`));
  const newKey=await browser.evaluate(native,`${doc}.querySelector('.tag').dataset.key`);
  assert.notEqual(newKey,oldKey);
  await browser.evaluate(native,`${doc}.querySelector('#end').click()`);
  assert.equal(await browser.evaluate(native,`${doc}.querySelectorAll('.tag').length`),1);
  await browser.evaluate(websiteSession,"utag.loader.cfg[22]={title:'After End'}");
  await browser.evaluate(native,`${doc}.querySelector('#start').click()`);
  await browser.wait('new Start reconciles current inventory',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===2`));
  await browser.call('Target.closeTarget',{targetId:installed.website.targetId});
  await browser.wait('target closure',()=>browser.evaluate(native,`${doc}.querySelector('#status').textContent==='Target closed'`));
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#start').disabled`),true);
  console.log(JSON.stringify({tealiumLifecycle:{pauseRace:true,sameDocument:true,reloadIdentity:true,pausedReload:true,endSnapshot:true,newStart:true,targetClosure:true}}));
}finally{await installed.close();}
