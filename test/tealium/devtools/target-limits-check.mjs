import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
export async function checkTargetLimits(extensionRoot) {
 const results=[];
 for(const [fixture,send,detail] of [['targets-shared',false,'Multiple possible'],['targets-unreadable',true,'Unique registered'],['separate',true,'Unique registered']]) {
  const installed=await installedTealium({extensionRoot,fixtureName:fixture});
  const {browser,native,doc,website,websiteSession}=installed;
  try{
   await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
   await browser.call('Target.openDevTools',{targetId:website.targetId});
   await browser.wait('destination limit shown',()=>browser.evaluate(native,`${doc}.querySelector('#source-status').textContent.includes(${JSON.stringify(detail)})`));
   assert.equal(await browser.evaluate(native,`${doc}.querySelector('#show-source').disabled`),!send);
   assert.equal(await browser.evaluate(native,`${doc}.querySelector('#show-extend').disabled`),true);
   if(send)assert.equal(await browser.evaluate(native,`${doc}.querySelector('#extend-status').textContent`),'u.extend unavailable');
   assert.equal(await browser.evaluate(websiteSession,'window.calls'),0);
   results.push({fixture,send,extend:false,noExecution:true});
  }finally{await installed.close();}
 }
 return results;
}
