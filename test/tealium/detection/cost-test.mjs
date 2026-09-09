import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
const installed=await installedTealium({fixtureName:'real'});
const {browser,native,doc,websiteSession}=installed;
try {
  await browser.evaluate(native,`${doc}.querySelector('#pause').click()`);
  await browser.evaluate(websiteSession,`(()=>{const runtime=utag.o['tealium.docs'];runtime.loader.cfg??={};for(let uid=200;uid<400;uid++)runtime.loader.cfg[uid]={title:'Representative tag '+uid};for(let index=0;index<200;index++){const script=document.createElement('script');script.type='application/json';script.id='fixture-resource-'+index;script.textContent='{}';document.head.append(script);}})()`);
  const scriptElements=await browser.evaluate(websiteSession,'document.scripts.length');
  const measured=await browser.evaluate(native,`(async()=>{
    const w=${doc}.defaultView,{readTarget}=await import('./tealium/detection/browser-target.js');
    const row=JSON.parse(${doc}.querySelector('.tag').dataset.key),tabId=row[0],reads=[],lifecycle=[];let inventory;
    for(let index=0;index<12;index++){
      let start=performance.now();inventory=await readTarget(tabId);reads.push(performance.now()-start);
      start=performance.now();await w.chrome.tabs.get(tabId);await w.chrome.scripting.executeScript({target:{tabId,allFrames:true},func:()=>location.href});lifecycle.push(performance.now()-start);
    }
    return {reads,lifecycle,tags:inventory.frames.flatMap(frame=>frame.observation.tags).length,resources:inventory.frames[0].observation.resources.length};
  })()`);
  assert.ok(measured.tags>=201);
  assert.equal(measured.reads.length,12);assert.ok(measured.reads.every(Number.isFinite));
  const stats=values=>({meanMs:values.reduce((sum,value)=>sum+value,0)/values.length,maxMs:Math.max(...values)});
  console.log(JSON.stringify({tealiumCost:{samples:12,tags:measured.tags,resources:measured.resources,scriptElements,inventory:stats(measured.reads),lifecycle:stats(measured.lifecycle),cadenceMs:1000}}));
}finally{await installed.close();}
