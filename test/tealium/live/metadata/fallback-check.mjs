import assert from 'node:assert/strict';
import {installedTealium} from '../../installed.mjs';
import {metadataNetwork,identity} from './network-fixture.mjs';
export async function checkMetadataFallback() {
  let network;
  const installed=await installedTealium({beforeSelect:async(browser,native)=>{
    network=await metadataNetwork(browser,native,{grant:false});
    const page=await browser.attach((await browser.call('Target.getTargets')).targetInfos.find(t=>t.url.includes('/separate')).targetId);
    await browser.evaluate(page,`utag.cfg.utid=${JSON.stringify(identity)}`);
  }});
  const {browser,native,doc,website}=installed;
  try {
    await browser.wait('missing metadata access shown',()=>browser.evaluate(native,`!${doc}.querySelector('#names-access').hidden`));
    assert.equal(network.requests.length,0);
    await browser.evaluate(native,`(()=>{const w=${doc}.defaultView;w.permissionRequests=[];w.originalRequest=w.chrome.permissions.request.bind(w.chrome.permissions);w.chrome.permissions.request=options=>{w.permissionRequests.push(options);return Promise.resolve(false);};${doc}.querySelector('#names-access').click();})()`);
    assert.deepEqual(await browser.evaluate(native,`${doc}.defaultView.permissionRequests`),[{origins:['https://my.tealiumiq.com/*']}]);
    assert.equal(network.requests.length,0);
    await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
    await browser.call('Target.openDevTools',{targetId:website.targetId});
    await browser.wait('fallback permits source inspection',()=>browser.evaluate(native,`!${doc}.querySelector('#show-source').disabled`));
    await network.allow();
    await browser.evaluate(native,`${doc}.defaultView.chrome.permissions.request=${doc}.defaultView.originalRequest;${doc}.querySelector('#names-access').click()`);
    await browser.wait('grant retries automatically',()=>network.requests.length===1);
    await network.release(0,{title:null});
    await browser.wait('empty success unavailable',()=>browser.evaluate(native,`${doc}.querySelector('#names-status').textContent==='Names unavailable'`));
    const before=await browser.evaluate(native,`Number(${doc}.documentElement.dataset.observations)`);
    await browser.wait('failed lookup remains single across polls',()=>browser.evaluate(native,`Number(${doc}.documentElement.dataset.observations)>${before+1}`));
    assert.equal(network.requests.length,1);assert.match(await browser.evaluate(native,`${doc}.querySelector('#rows').textContent`),/Analytics/);
    await browser.evaluate(native,`${doc}.querySelector('#names-retry').click()`);
    await browser.wait('explicit failure fixture retry',()=>network.requests.length===2);await network.fail(1);
    await browser.wait('network failure unavailable',()=>browser.evaluate(native,`${doc}.querySelector('#names-status').textContent==='Names unavailable'`));
    await browser.evaluate(native,`${doc}.querySelector('#names-retry').click()`);
    await browser.wait('explicit successful retry',()=>network.requests.length===3);await network.release(2);
    await browser.wait('retry loads names',()=>browser.evaluate(native,`${doc}.querySelector('#tag-name').textContent==='<b>Checkout analytics</b>'`));
    assert.equal(await browser.evaluate(native,`${doc}.querySelector('#show-source').disabled`),false);
    assert.ok((await browser.evaluate(native,`${doc}.querySelector('#status').textContent`)).startsWith('Observing'));
    return {missingGrant:true,refusal:true,exactGrant:true,empty:true,failedRetry:true,fallback:true,source:true};
  }finally{network?.remove();await installed.close();}
}
