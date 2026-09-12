import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
import {observeBridge} from './bridge-observer.mjs';

export async function checkConnectionRecovery(extensionRoot, {beforeLive, surface, action}) {
  let installed;
  try {
    const fixtureName=action==='Go to u.extend'?'targets-definitions':'separate';
    const expectedResource=action==='Go to u.extend'
      ?'/targets/bundle.js?revision=source-targets':'/custom/utag.21.js?revision=7';
    installed = await installedTealium({extensionRoot, fixtureName,
      beforeSelect: beforeLive ? async browser => {
      const target = (await browser.call('Target.getTargets')).targetInfos.find(t =>
        t.url.includes(`/${fixtureName}`));
      await browser.call('Target.openDevTools', {targetId: target.targetId});
    } : undefined});
    const {browser, native, doc, website, websiteTab, websiteSession} = installed;
    if (!beforeLive) await browser.call('Target.openDevTools', {targetId: website.targetId});
    const accepted = () => browser.evaluate(native,
      `${doc}.querySelector('#source-status').textContent === 'Resolving the selected source'`);
    await browser.wait('initial quiet source connection', accepted);
    await browser.call('ServiceWorker.enable', {}, websiteSession);
    for (let shutdown = 0; shutdown < 8; shutdown++) {
      const quietWorker = (await browser.call('Target.getTargets')).targetInfos.find(t =>
        t.type === 'service_worker' && t.url.startsWith(browser.origin));
      assert.equal(quietWorker.attached, false, 'Worker debugger must remain detached');
      await browser.call('ServiceWorker.stopAllWorkers', {}, websiteSession);
      await browser.wait(`quiet worker ${shutdown + 1} terminated`, async () =>
        !(await browser.call('Target.getTargets')).targetInfos.some(t => t.targetId === quietWorker.targetId));
      await browser.wait(`quiet connection ${shutdown + 1} accepted`, accepted);
    }
    let control=native,controlDoc=doc;
    if(surface==='full-width page') {
      await browser.evaluate(native,"Array.from(document.querySelectorAll('#workspace-panel-tealium button')).find(button=>button.textContent.includes('full-width')).click()");
      const full=await browser.wait('full-width recovery surface',async()=>
        (await browser.call('Target.getTargets')).targetInfos.find(target=>
          target.url.includes('/tealium/live/index.html')&&target.url.includes('surface=workbench')));
      control=await browser.attach(full.targetId);controlDoc='document';
      await browser.wait('full-width recovery tags',()=>browser.evaluate(control,
        'document.querySelectorAll(".tag").length > 0'));
    }
    const actionId=action==='Go to u.extend'?'show-extend':'show-source';
    await browser.evaluate(control, `${controlDoc}.querySelector('.tag').click()`);
    const ready = () => browser.evaluate(control, `!${controlDoc}.querySelector('#${actionId}').disabled`);
    await browser.wait('initial source connection', ready);
    const selection = await browser.evaluate(control, `${controlDoc}.querySelector('#raw').textContent`);
    const bridge = await observeBridge(browser, JSON.parse(selection).tabId);
    await browser.evaluate(bridge, `globalThis.actualResources=chrome.devtools.inspectedWindow.getResources;
      globalThis.heldResources=[];chrome.devtools.inspectedWindow.getResources=callback=>heldResources.push(callback)`);
    await browser.evaluate(control, `${controlDoc}.querySelector('#${actionId}').click()`);
    await browser.wait('old source action held', () => browser.evaluate(bridge, 'heldResources.length > 0'));
    const worker = (await browser.call('Target.getTargets')).targetInfos.find(t => t.type === 'service_worker' && t.url.startsWith(browser.origin));
    assert.equal(worker.attached, false, 'Worker debugger must be detached before termination');
    await browser.call('ServiceWorker.stopAllWorkers', {}, websiteSession);
    await browser.wait('old worker terminated', async () => !(await browser.call('Target.getTargets')).targetInfos.some(t => t.targetId === worker.targetId));
    await browser.evaluate(bridge, 'chrome.devtools.inspectedWindow.getResources=actualResources;heldResources.forEach(callback=>actualResources(callback))');
    await browser.wait('same selection recovers after worker termination', ready);
    assert.equal(await browser.evaluate(control, `${controlDoc}.querySelector('#raw').textContent`), selection);
    assert.equal(await browser.evaluate(bridge, 'openCalls.length'), 0, 'Old source action is never replayed');
    await browser.evaluate(control, `${controlDoc}.querySelector('#${actionId}').click()`);
    await browser.wait('new explicit source action succeeds', () => browser.evaluate(control,
      `${controlDoc}.querySelector('#feedback').textContent === 'Source opened'`));
    assert.equal(await browser.evaluate(bridge, 'openCalls.length'), 1);
    const opened=await browser.evaluate(bridge,'openCalls[0]');
    assert.ok(opened[0].includes(expectedResource),JSON.stringify(opened));
    const websitePath=new URL(websiteTab.url).pathname;
    const front = (await browser.call('Target.getTargets')).targetInfos.find(t =>
      t.url.startsWith('devtools://') && t.title.includes(websitePath));
    const frontSession = await browser.attach(front.targetId);
    const editor = `(async()=>{const S=await import('./panels/sources/sources.js');const view=S.SourcesPanel.SourcesPanel.instance().sourcesView();return {url:view.currentUISourceCode()?.url(),content:view.currentSourceFrame()?.textEditor?.state?.doc?.toString()};})()`;
    await browser.wait('recovered action opens actual editor', () => browser.evaluate(frontSession, editor),
      value => value.url?.includes(expectedResource) && value.content?.length > 0);
    const evidence={caseIdentity:`${surface}:${action}`,beforeLive,surface,action,
      destination:opened[0],quietShutdowns:8,
      acceptedQuietConnections:8,workerDebuggerDetached:true,workerTerminated:true,
      selectionRetained:true,oldActionCancelled:true,explicitAction:true,actualEditor:true};
    console.log(JSON.stringify({tealiumConnectionRecovery:evidence}));
    return evidence;
  } finally {await installed?.close();}
}
