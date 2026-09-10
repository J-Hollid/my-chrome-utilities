import assert from 'node:assert/strict';
export const identity='shop/main/202609100600';
export async function metadataNetwork(browser,native,{grant=true}={}) {
  const requests=[];
  const remove=browser.onEvent(message=>{
    if(message.method==='Fetch.requestPaused'&&message.sessionId===native)requests.push(message.params);
  });
  await browser.call('Fetch.enable',{patterns:[{urlPattern:'https://my.tealiumiq.com/*'}]},native);
  const manager=await browser.call('Target.createTarget',{url:'chrome://extensions',background:true});
  const settings=await browser.attach(manager.targetId);
  await browser.wait('metadata permission manager',()=>browser.evaluate(settings,'Boolean(chrome.developerPrivate?.addHostPermission)'));
  const allow=async()=>{
    await browser.evaluate(settings,`chrome.developerPrivate.addHostPermission(${JSON.stringify(browser.extensionId)},'https://my.tealiumiq.com/*')`);
    assert.equal(await browser.evaluate(native,"chrome.permissions.request({origins:['https://my.tealiumiq.com/*']})"),true);
  };
  if(grant)await allow();
  return {requests,allow,remove,
    async allowOrigin(origin) {
      await browser.evaluate(settings,`chrome.developerPrivate.addHostPermission(${JSON.stringify(browser.extensionId)},${JSON.stringify(origin)})`);
      assert.equal(await browser.evaluate(native,`chrome.permissions.request({origins:[${JSON.stringify(origin)}]})`),true);
    },
    async release(index,payload={title:'Published release',manage:{21:{title:'<b>Checkout analytics</b>'},22:{title:'Late metadata'},999:{title:'Not observed'}}},allowCancelled=false) {
      try {await browser.call('Fetch.fulfillRequest',{requestId:requests[index].requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(`window.__tealium_wc_getProfile(${JSON.stringify(payload)});`).toString('base64')},native);} catch(error) {if(!allowCancelled || !/Invalid InterceptionId/.test(error.message))throw Error(`Metadata response ${index}: ${error.message}`);}
    },
    async fail(index){await browser.call('Fetch.failRequest',{requestId:requests[index].requestId,errorReason:'Failed'},native);},
  };
}
