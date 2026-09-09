export async function observeBridge(browser,tabId) {
  const targets=(await browser.call('Target.getTargets',{filter:[{}]})).targetInfos;
  for(const target of targets.filter(t=>t.url.endsWith('/tealium/devtools/index.html'))) {
    const session=await browser.attach(target.targetId);
    if(await browser.evaluate(session,'chrome.devtools.inspectedWindow.tabId')!==tabId)continue;
    await browser.evaluate(session,`(()=>{const original=chrome.devtools.panels.openResource.bind(chrome.devtools.panels);
      globalThis.openCalls=[];chrome.devtools.panels.openResource=(...args)=>{openCalls.push(args.slice(0,3));return original(...args);};})()`);
    return session;
  }
  throw Error('The matching production DevTools page was not found');
}
