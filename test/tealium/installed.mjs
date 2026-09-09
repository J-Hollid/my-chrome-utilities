import {tealiumBrowser} from './browser.mjs';
import {tealiumFixtureServer} from './detection/fixture-server.mjs';

export async function installedTealium({extensionRoot, fixtureName = 'separate', beforeSelect, empty = false} = {}) {
  const fixture = await tealiumFixtureServer();
  let browser;
  try {
    browser = await tealiumBrowser(extensionRoot, {native: true});
    const url = fixture.origin + '/' + fixtureName;
    const website = await browser.call('Target.createTarget', {url});
    const websiteSession = await browser.attach(website.targetId);
    await browser.wait('fixture document ready', () => browser.evaluate(websiteSession,
      'document.readyState === "complete"'));
    const {targetInfos} = await browser.call('Target.getTargets', {filter: [{type: 'tab'}, {exclude: true}]});
    const websiteTab = targetInfos.find(target => target.url === url);
    await browser.call('Extensions.triggerAction', {id: browser.extensionId, targetId: websiteTab.targetId});
    const panel = await browser.wait('native side panel target', async () =>
      (await browser.call('Target.getTargets', {filter: [{}]})).targetInfos.find(target => target.url === browser.origin + '/side-panel.html'));
    const native = await browser.attach(panel.targetId);
    await browser.wait('Tealium workspace tab', () => browser.evaluate(native, 'Boolean(document.querySelector("#workspace-tab-tealium"))'));
    if(beforeSelect)await beforeSelect(browser,native);
    await browser.evaluate(native, 'document.querySelector("#workspace-tab-tealium").click()');
    const doc = 'document.querySelector("iframe[title=Tealium]").contentDocument';
    await browser.wait('Live target ready', () => browser.evaluate(native,
      `Boolean(${doc}?.querySelector('#start') && !${doc}.querySelector('#start').disabled)`));
    await browser.evaluate(native, `${doc}.querySelector('#start').click()`);
    await browser.wait('completed rendered observation', () => browser.evaluate(native,
      empty ? `Number(${doc}.documentElement.dataset.observations)>0` : `${doc}.querySelectorAll('.tag').length>0`));
    return {browser, fixture, website, websiteTab, websiteSession, panel, native, doc,
      close: async () => {await browser.close(); await fixture.close();}};
  } catch (error) {await browser?.close(); await fixture.close(); throw error;}
}
