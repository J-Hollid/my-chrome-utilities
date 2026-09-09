import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';

const installed=await installedTealium({beforeSelect:async(browser,native)=>{
  await browser.call('Page.addScriptToEvaluateOnNewDocument',{source:"indexedDB.open=()=>{throw Error('Controlled Data Layer startup failure')};"},native);
  await browser.call('Page.reload',{},native);
  await browser.wait('independent utility shell',()=>browser.evaluate(native,'Boolean(document.querySelector("#workspace-tab-tealium"))'));
  await browser.evaluate(native,'document.querySelector("#workspace-tab-hotkeys").click();document.querySelector("#workspace-tab-hotkeys").focus()');
  await browser.call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39},native);
  await browser.wait('keyboard selects Tealium',()=>browser.evaluate(native,'document.querySelector("#workspace-tab-tealium").getAttribute("aria-selected")==="true"'));
}});
try{
  const {browser,native,doc}=installed;
  assert.match(await browser.evaluate(native,`${doc}.querySelector('#rows').textContent`),/Analytics/);
  const failure=await browser.evaluate(native,'document.querySelector("#workspace-panel-data-layer").textContent');
  assert.match(failure,/fail|unavailable|could not/i);
  console.log(JSON.stringify({tealiumStartup:{dataLayerFailureRetained:true,keyboardSelection:true,nativeTargetSetup:true,observedTag:true}}));
}finally{await installed.close();}
