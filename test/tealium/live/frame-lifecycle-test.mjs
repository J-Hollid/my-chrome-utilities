import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';

const installed=await installedTealium({fixtureName:'frames'});
const {browser,native,websiteSession,doc}=installed;
try {
  await browser.wait('accessible child observed',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===2`));
  const oldKey=await browser.evaluate(native,`Array.from(${doc}.querySelectorAll('.tag')).find(row=>JSON.parse(row.dataset.key)[2]!==0).dataset.key`);
  await browser.evaluate(native,`(()=>{
    const w=${doc}.defaultView,original=w.chrome.scripting.executeScript.bind(w.chrome.scripting);
    w.chrome.scripting.executeScript=async options=>{
      const result=await original(options);
      if(options.func.name==='readTealiumPage'&&!w.heldFrameRead){w.heldFrameRead={result};await new Promise(resolve=>w.heldFrameRead.release=resolve);}
      return result;
    };
  })()`);
  await browser.wait('old frame read held',()=>browser.evaluate(native,`Boolean(${doc}.defaultView.heldFrameRead?.release)`));
  await browser.evaluate(websiteSession,"document.querySelector('iframe').src=document.querySelector('iframe').src");
  await browser.wait('old frame invalidated during pending read',()=>browser.evaluate(native,
    `!Array.from(${doc}.querySelectorAll('.tag')).some(row=>row.dataset.key===${JSON.stringify(oldKey)})`));
  await browser.evaluate(native,`(()=>{
    const w=${doc}.defaultView;w.staleFrameSeen=false;
    new MutationObserver(()=>{if(Array.from(${doc}.querySelectorAll('.tag')).some(row=>row.dataset.key===${JSON.stringify(oldKey)}))w.staleFrameSeen=true;}).observe(${doc}.querySelector('#rows'),{childList:true,subtree:true});
    w.heldFrameRead.release();
  })()`);
  await browser.wait('replacement child observed',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===2`));
  assert.equal(await browser.evaluate(native,`${doc}.defaultView.staleFrameSeen`),false);
  const keys=await browser.evaluate(native,`Array.from(${doc}.querySelectorAll('.tag')).map(row=>row.dataset.key)`);
  assert.equal(keys.includes(oldKey),false);
  console.log(JSON.stringify({tealiumFrameLifecycle:{sameUrlReplacement:true,pendingReadInvalidated:true,noStalePublication:true}}));
}finally{await installed.close();}
