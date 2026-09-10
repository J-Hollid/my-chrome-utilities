import assert from 'node:assert/strict';
import {metadataOwner} from '../../../../dist/tealium/live/metadata/owner.js';
import {parseMetadata} from '../../../../dist/tealium/live/metadata/request.js';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const row=(utid='shop/main/202609100600',uid='21',name='Local')=>({key:utid+uid,utid,uid,name,profile:'runtime',tabId:42,documentId:'doc',frameId:0,senderSource:'source',codeState:'Code registered'});
export async function metadataExamples() {
 const examples=[];
 for(const [uid,title] of [['115','Tealium AudienceStream Integration'],['21','Checkout analytics']]) {
  const live={sessionId:'s',status:'Observing',rows:[row(undefined,uid,`Tag ${uid}`)],selected:null};let resolve;
  const owner=metadataOwner(()=>live,()=>{},async()=>true,()=>new Promise(r=>resolve=r));owner.update();await flush();
  assert.equal(owner.view().rows[0].name,`Tag ${uid}`);resolve({title:'Publish title',names:{[uid]:title}});await flush();
  const actual=owner.view().rows[0];assert.equal(actual.name,title);assert.equal(actual.nameSource,'Tealium profile metadata');assert.equal(actual.senderSource,'source');assert.equal(actual.publishedTitle,'Publish title');
  examples.push({uid:actual.uid,title:actual.name});owner.dispose();
 }
 for(const [fixture,fallback] of [['host access unavailable','Tag 32'],['network failure','Local analytics'],['empty HTTP 200','Tag 52'],['malformed callback','Tag 21'],['timeout','Tag 61'],['response over size limit','Tag 71'],['matching title empty','Local consent']]) {
  const live={sessionId:'s',status:'Observing',rows:[row(undefined,'21',fallback)]};let attempts=0;
  const owner=metadataOwner(()=>live,()=>{},async()=>fixture!=='host access unavailable',async()=>{
   attempts++;if(fixture==='empty HTTP 200')return parseMetadata('window.__tealium_wc_getProfile({"title":null});');
   if(fixture==='malformed callback')return parseMetadata('evil({});');
   if(fixture==='matching title empty')return parseMetadata('window.__tealium_wc_getProfile({"title":"Release","manage":{"21":{"title":""}}});');
   throw Error(fixture);
  });owner.update();await flush();owner.update();await flush();assert.ok(attempts<=1);
  assert.equal(owner.view().rows[0].name,fallback);examples.push({fixture,fallback:owner.view().rows[0].name});owner.dispose();
 }
 for(const [boundary,other] of [['account','other/main/202609100600'],['profile','shop/other/202609100600'],['publish version','shop/main/202609100601']]) {
  const live={sessionId:'s',status:'Observing',rows:[row(),row(other)]};
  const owner=metadataOwner(()=>live,()=>{},async()=>true,async utid=>({title:utid,names:{21:utid,99:'Unobserved'}}));owner.update();await flush();
  assert.deepEqual(owner.view().rows.map(r=>r.name),live.rows.map(r=>r.utid));assert.equal(owner.view().rows.length,2);examples.push({boundary});owner.dispose();
 }
 for(const event of ['observation ends','the session is replaced','the document reloads','the frame is replaced','observation pauses']) {
  const live={sessionId:'s',status:'Observing',rows:[row()]};let resolve;
  const owner=metadataOwner(()=>live,()=>{},async()=>true,()=>new Promise(r=>{resolve=r;}));owner.update();await flush();const release=resolve;
  if(event==='observation ends')live.status='Ended';
  if(event==='observation pauses')live.status='Paused';
  if(event==='the session is replaced')live.sessionId='next';
  if(event==='the document reloads')live.rows=[{...row(),key:'new',documentId:'new'}];
  if(event==='the frame is replaced')live.rows=[{...row(),key:'new-frame',frameId:1,documentId:'new'}];
  owner.update();release({title:'Old',names:{21:'Late'}});await flush();assert.equal(owner.view().rows[0].name,'Local');examples.push({event});owner.dispose();
 }
 for(const decision of ['grant','decline']) {
  let granted=false,attempts=0;const live={sessionId:'s',status:'Observing',rows:[row()]};
  const owner=metadataOwner(()=>live,()=>{},async()=>granted,async()=>{attempts++;return {title:'Granted',names:{21:'Name'}};});
  owner.update();await flush();assert.equal(attempts,0);granted=decision==='grant';if(granted)owner.retry();await flush();assert.equal(attempts,granted?1:0);
  examples.push({decision,outcome:attempts?'retries automatically for the current identity':'retains fallback names without another prompt'});owner.dispose();
 }
 return examples;
}
