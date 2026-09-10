import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
const results=[];
for(const [name,path] of [['real-custom','/custom/utag.js?revision=original'],['real','/scripts/payload.js?revision=original']]) {
  const installed=await installedTealium({fixtureName:name});
  const {browser,native,doc,websiteSession}=installed;
  try {
    await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
    const row=await browser.evaluate(native,`JSON.parse(${doc}.querySelector('#raw').textContent)`);
    assert.equal(row.uid,'115');assert.equal(row.profile,'tealium.docs');assert.equal(row.codeState,'Code registered');assert.equal(row.loadingSuppressed,true);
    assert.equal(row.account,'tealium');assert.equal(row.profileName,'docs');assert.equal(row.publishId,'202504230113');assert.equal(row.environment,null);
    assert.equal(await browser.evaluate(native,`${doc}.querySelector('[data-field=Account]').textContent`),'tealium');
    const resources=await browser.evaluate(websiteSession,"performance.getEntriesByType('resource').map(entry=>entry.name)");
    assert.ok(resources.some(url=>url.endsWith(path)));
    assert.equal(await browser.evaluate(native,`${doc}.querySelector('#inspector').textContent.includes('successful send')`),false);
    results.push({fixture:name,path,uid:row.uid,profile:row.profile,codeState:row.codeState,loadingSuppressed:row.loadingSuppressed,account:row.account,profileName:row.profileName,publishId:row.publishId,identity:true});
  }finally{await installed.close();}
}
console.log(JSON.stringify({tealiumRealRuntime:{results}}));
