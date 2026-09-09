import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
import {sourceNavigationPackage} from './fixture.mjs';
const fixture=await sourceNavigationPackage();
let installed;
try {
  installed=await installedTealium({extensionRoot:fixture.extensionRoot,fixtureName:'custom'});
  const {browser,native,doc,website,websiteSession}=installed;
  await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
  await browser.call('Target.openDevTools',{targetId:website.targetId});
  await browser.wait('resolved copy URL',()=>browser.evaluate(native,`!${doc}.querySelector('#copy-source').disabled`));
  const expected=await browser.evaluate(native,`${doc}.querySelector('#source-url').textContent`);
  await browser.evaluate(native,"Array.from(document.querySelectorAll('#workspace-panel-tealium button')).find(button=>button.textContent.includes('full-width')).click()");
  const full=await browser.wait('expanded copy surface',async()=>
    (await browser.call('Target.getTargets')).targetInfos.find(target=>target.url.includes('/tealium/live/index.html')&&target.url.includes('surface=workbench')));
  const expanded=await browser.attach(full.targetId);
  await browser.call('Target.activateTarget',{targetId:full.targetId});
  await browser.call('Browser.grantPermissions',{permissions:['clipboardReadWrite','clipboardSanitizedWrite'],origin:browser.origin});
  await browser.wait('expanded resolved source',()=>browser.evaluate(expanded,'!document.querySelector("#copy-source").disabled'));
  const requests=installed.fixture.hits.length;
  await browser.evaluate(expanded,'document.querySelector("#copy-source").click()');
  await browser.wait('copy success',()=>browser.evaluate(expanded,'document.querySelector("#feedback").textContent==="Source URL copied"'));
  assert.equal(await browser.evaluate(expanded,'navigator.clipboard.readText()'),expected);
  await browser.evaluate(expanded,"navigator.clipboard.writeText=async()=>{throw new DOMException('Controlled failure','NotAllowedError')};document.querySelector('#copy-source').click()");
  await browser.wait('copy failure feedback',()=>browser.evaluate(expanded,'document.querySelector("#feedback").textContent==="The source URL could not be copied"'));
  assert.equal(await browser.evaluate(expanded,'document.querySelector("#inspector").hidden'),false);
  assert.equal(await browser.evaluate(websiteSession,'window.calls'),0);
  assert.equal(installed.fixture.hits.length,requests,'Copy does not request page resources');
  console.log(JSON.stringify({tealiumClipboard:{preview:fixture.preview,url:expected,actualClipboard:true,controlledFailure:true,selectionRetained:true,noScriptRequests:true}}));
}finally{await installed?.close();await fixture.close();}
