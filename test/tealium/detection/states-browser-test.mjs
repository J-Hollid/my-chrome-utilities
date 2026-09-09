import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';

const results=[];
for(const [name,expected,count] of [['absent','Not detected',0],['queue','Initializing',0],
  ['unsupported','Unsupported runtime',0],['mixed','Unsupported runtime',1],['configured','Detected',1],['failed','Detected',1]]) {
  const installed=await installedTealium({fixtureName:name,empty:count===0});
  const {browser,native,doc,websiteSession}=installed;
  try {
    const observed=await browser.evaluate(native,`({coverage:${doc}.querySelector('#coverage').textContent,rows:${doc}.querySelectorAll('.tag').length})`);
    assert.ok(observed.coverage.includes(expected),JSON.stringify(observed));assert.equal(observed.rows,count);
    if(name==='queue') {
      await browser.evaluate(websiteSession,`window.calls=0;window.utag={view(){calls++},link(){calls++},loader:{cfg:{21:{title:'Late tag'}}},sender:{21:{send(){calls++}}},cfg:{}};utag.o={'shop.main':utag};true;`);
      await browser.wait('early queue becomes rendered detected tag',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===1&&${doc}.querySelector('#coverage').textContent.startsWith('Detected')`));
      await browser.evaluate(websiteSession,`utag.loader.cfg[21].title='<img src=x onerror=run>';`);
      await browser.wait('markup-like title shown as text',()=>browser.evaluate(native,`${doc}.querySelector('.tag').textContent.includes('<img src=x onerror=run>')`));
      assert.equal(await browser.evaluate(native,`${doc}.querySelectorAll('img[onerror]').length`),0);
      assert.equal(await browser.evaluate(websiteSession,'window.calls'),0);
    }
    if(name==='mixed') {
      assert.ok(observed.coverage.includes('Partial coverage'));
      await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
      assert.equal(await browser.evaluate(native,`JSON.parse(${doc}.querySelector('#raw').textContent).frameId>0`),true);
    }
    if(name==='configured')assert.match(await browser.evaluate(native,`${doc}.querySelector('.tag').textContent`),/Configured/);
    if(name==='failed') {
      assert.equal(await browser.evaluate(websiteSession,"performance.getEntriesByType('resource').find(entry=>entry.name.endsWith('/failed-tag.js')).responseStatus"),404);
      assert.equal(await browser.evaluate(websiteSession,'window.calls'),0);
      assert.equal(await browser.evaluate(native,`JSON.parse(${doc}.querySelector('.tag').dataset.key)[4]`),'21');
    }
    results.push({fixture:name,state:expected,rows:count});
  }finally{await installed.close();}
}
console.log(JSON.stringify({tealiumDetectionStates:{results,lateInitialization:true,safeTitle:true,readOnly:true,failedRequestNotCode:true}}));
