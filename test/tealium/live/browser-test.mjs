import {checkMetadataBrowser} from './metadata/browser-check.mjs';
import {checkMetadataFallback} from './metadata/fallback-check.mjs';
import assert from 'node:assert/strict';
import {tealiumBrowser} from '../browser.mjs';
import {tealiumFixtureServer} from '../detection/fixture-server.mjs';

const metadata=await checkMetadataBrowser(),metadataFallback=await checkMetadataFallback();
const fixture = await tealiumFixtureServer();
let browser;
try {
  browser = await tealiumBrowser(undefined, {native: true});
  const url = fixture.origin + '/separate';
  const website = await browser.call('Target.createTarget', {url});
  const websiteSession = await browser.attach(website.targetId);
  await browser.wait('separate runtime ready', () => browser.evaluate(websiteSession, 'Boolean(window.utag?.sender?.[21])'));
  const {targetInfos} = await browser.call('Target.getTargets', {filter: [{type: 'tab'}, {exclude: true}]});
  const websiteTab = targetInfos.find(target => target.url === url);
  await browser.call('Extensions.triggerAction', {id: browser.extensionId, targetId: websiteTab.targetId});
  const observedTargets = await browser.wait('native side panel target', async () =>
    (await browser.call('Target.getTargets', {filter: [{}]})).targetInfos.map(({targetId,type,url})=>({targetId,type,url})),
    targets => targets.some(target => target.url === browser.origin + '/side-panel.html'));
  const panel = observedTargets.find(target => target.url === browser.origin + '/side-panel.html');
  const native = await browser.attach(panel.targetId);
  await browser.wait('Tealium workspace tab', () => browser.evaluate(native, 'Boolean(document.querySelector("#workspace-tab-tealium"))'));
  await browser.evaluate(native, 'document.querySelector("#workspace-tab-tealium").click()');
  const doc = 'document.querySelector("iframe[title=Tealium]").contentDocument';
  await browser.wait('Live target ready', () => browser.evaluate(native,
    `Boolean(${doc}?.querySelector('#start') && !${doc}.querySelector('#start').disabled)`));
  await browser.evaluate(native, `${doc}.querySelector('#start').click()`);
  await browser.wait('rendered inventory row', () => browser.evaluate(native, `${doc}.querySelectorAll('.tag').length===1`));
  assert.match(await browser.evaluate(native, `${doc}.querySelector('#rows').textContent`), /Analytics/);
  const initial = await browser.evaluate(native, `({url:document.querySelector('iframe[title=Tealium]').src,
    count:${doc}.documentElement.dataset.observations, status:${doc}.querySelector('#status').textContent})`);
  await browser.evaluate(native, `${doc}.querySelector('.tag').click();${doc}.querySelector('#search').value='21';${doc}.querySelector('#search').dispatchEvent(new Event('input'))`);
  await browser.evaluate(native, 'document.querySelector("#workspace-tab-hotkeys").click()');
  await browser.evaluate(websiteSession, "utag.loader.cfg['22']={title:'Late tag'};utag.sender['22']={send:function lateTag(){return 'late22'}};");
  await browser.wait('hidden owner observes late tag', () => browser.evaluate(native, `${doc}.querySelector('#count').textContent==='1 / 2 tags'`));
  await browser.evaluate(native, 'document.querySelector("#workspace-tab-tealium").click()');
  assert.equal(await browser.evaluate(native, "document.querySelector('iframe[title=Tealium]').src"), initial.url);
  await browser.evaluate(native, "Array.from(document.querySelectorAll('#workspace-panel-tealium button')).find(button=>button.textContent.includes('full-width')).click()");
  const full = await browser.wait('full-width surface', async () =>
    (await browser.call('Target.getTargets')).targetInfos.find(target => target.url.includes('/tealium/live/index.html') && target.url.includes('surface=workbench')));
  const expanded = await browser.attach(full.targetId);
  await browser.wait('shared full-width inventory', () => browser.evaluate(expanded, 'document.querySelector("#count")?.textContent==="1 / 2 tags"'));
  await browser.evaluate(expanded, 'document.querySelector("#pause").click()');
  await browser.wait('owner acknowledges remote Pause', () => browser.evaluate(native, `${doc}.querySelector('#status').textContent==='Paused'`));
  assert.equal(await browser.evaluate(websiteSession, 'window.calls'), 0);
  await browser.call('Target.closeTarget', {targetId: full.targetId});
  assert.equal(await browser.evaluate(native, `${doc}.querySelector('#status').textContent`), 'Paused');
  console.log(JSON.stringify({metadata,metadataFallback,nativeSidePanel: true, activeTab: true, initial,
    retainedOwner: true, lateTag: true, fullWidth: true, remotePause: true, observationCalls: 0}));
} finally {await browser?.close(); await fixture.close();}
