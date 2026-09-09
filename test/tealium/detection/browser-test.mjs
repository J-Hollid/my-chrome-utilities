import assert from 'node:assert/strict';
import {tealiumBrowser} from '../browser.mjs';
import {tealiumFixtureServer} from './fixture-server.mjs';

const fixture = await tealiumFixtureServer();
let browser;
try {
  browser = await tealiumBrowser();
  const extension = await browser.call('Target.createTarget', {url: browser.origin + '/side-panel.html'});
  const extensionSession = await browser.attach(extension.targetId);
  const observations = [];
  for (const name of ['separate', 'real']) {
    const url = fixture.origin + '/' + name;
    const {targetId} = await browser.call('Target.createTarget', {url});
    const page = await browser.attach(targetId);
    await browser.wait('fixture runtime ready', () => browser.evaluate(page, 'Boolean(window.utag?.sender && Object.keys(utag.sender).length)'));
    const tabs = await browser.call('Target.getTargets', {filter: [{type: 'tab', exclude: false}, {exclude: true}]});
    const tabTarget = tabs.targetInfos.find(target => target.url === url);
    assert.ok(tabTarget, 'The website has a Chrome tab target');
    await browser.call('Extensions.triggerAction', {id: browser.extensionId, targetId: tabTarget.targetId});
    const result = await browser.evaluate(extensionSession, `(async()=>{
      const {readTarget}=await import('./tealium/detection/browser-target.js');
      const tabs=await chrome.tabs.query({});
      const target=tabs.find(tab=>tab.url===${JSON.stringify(url)});
      if(!target)throw Error('Granted website target is unavailable');
      return {tabId:target.id,inventory:await readTarget(target.id)};
    })()`);
    const tags = result.inventory.frames.flatMap(frame => frame.observation.tags);
    assert.ok(tags.some(tag => tag.uid === (name === 'real' ? '115' : '21')), JSON.stringify({name, result}));
    if (name === 'real') assert.ok(tags.some(tag => tag.profile === 'tealium.docs'));
    observations.push({fixture: name, tabId: result.tabId, tags: tags.map(tag => ({uid: tag.uid, profile: tag.profile, codeState: tag.codeState})),
      documents: result.inventory.frames.map(frame => frame.documentId)});
    await browser.call('Target.closeTarget', {targetId});
  }
  console.log(JSON.stringify({tealiumDetection: observations}));
} finally {await browser?.close(); await fixture.close();}
