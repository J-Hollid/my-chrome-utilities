import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
import {observeBridge} from './bridge-observer.mjs';

export async function checkConnectionRecovery(extensionRoot, beforeLive) {
  let installed;
  try {
    installed = await installedTealium({extensionRoot, beforeSelect: beforeLive ? async browser => {
      const target = (await browser.call('Target.getTargets')).targetInfos.find(t => t.url.includes('/separate'));
      await browser.call('Target.openDevTools', {targetId: target.targetId});
    } : undefined});
    const {browser, native, doc, website, websiteSession} = installed;
    await browser.evaluate(native, `${doc}.querySelector('.tag').click()`);
    if (!beforeLive) await browser.call('Target.openDevTools', {targetId: website.targetId});
    const ready = () => browser.evaluate(native, `!${doc}.querySelector('#show-source').disabled`);
    await browser.wait('initial source connection', ready);
    const selection = await browser.evaluate(native, `${doc}.querySelector('#raw').textContent`);
    const bridge = await observeBridge(browser, JSON.parse(selection).tabId);
    await browser.evaluate(bridge, `globalThis.actualResources=chrome.devtools.inspectedWindow.getResources;
      globalThis.heldResources=[];chrome.devtools.inspectedWindow.getResources=callback=>heldResources.push(callback)`);
    await browser.evaluate(native, `${doc}.querySelector('#show-source').click()`);
    await browser.wait('old source action held', () => browser.evaluate(bridge, 'heldResources.length > 0'));
    const worker = (await browser.call('Target.getTargets')).targetInfos.find(t => t.type === 'service_worker' && t.url.startsWith(browser.origin));
    assert.equal(worker.attached, false, 'Worker debugger must be detached before termination');
    await browser.call('ServiceWorker.enable', {}, websiteSession);
    await browser.call('ServiceWorker.stopAllWorkers', {}, websiteSession);
    await browser.wait('old worker terminated', async () => !(await browser.call('Target.getTargets')).targetInfos.some(t => t.targetId === worker.targetId));
    await browser.evaluate(bridge, 'chrome.devtools.inspectedWindow.getResources=actualResources;heldResources.forEach(callback=>actualResources(callback))');
    await browser.wait('same selection recovers after worker termination', ready);
    assert.equal(await browser.evaluate(native, `${doc}.querySelector('#raw').textContent`), selection);
    assert.equal(await browser.evaluate(bridge, 'openCalls.length'), 0, 'Old source action is never replayed');
    await browser.evaluate(native, `${doc}.querySelector('#show-source').click()`);
    await browser.wait('new explicit source action succeeds', () => browser.evaluate(native, `${doc}.querySelector('#feedback').textContent === 'Source opened'`));
    assert.equal(await browser.evaluate(bridge, 'openCalls.length'), 1);
    const front = (await browser.call('Target.getTargets')).targetInfos.find(t => t.url.startsWith('devtools://') && t.title.includes('/separate'));
    const frontSession = await browser.attach(front.targetId);
    const editor = `(async()=>{const S=await import('./panels/sources/sources.js');const view=S.SourcesPanel.SourcesPanel.instance().sourcesView();return {url:view.currentUISourceCode()?.url(),content:view.currentSourceFrame()?.textEditor?.state?.doc?.toString()};})()`;
    await browser.wait('recovered action opens actual editor', () => browser.evaluate(frontSession, editor), value => value.url?.includes('/custom/utag.21.js?revision=7') && value.content?.length > 0);
    console.log(JSON.stringify({tealiumConnectionRecovery:{beforeLive,workerDebuggerDetached:true,workerTerminated:true,selectionRetained:true,oldActionCancelled:true,explicitAction:true,actualEditor:true}}));
  } finally {await installed?.close();}
}
