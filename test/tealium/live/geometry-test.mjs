import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';

const installed = await installedTealium();
const {browser, native, websiteSession, doc} = installed;
const geometryProgram=reference=>`(async()=>{
  const d=${reference},w=d.defaultView;
  await new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve)));
  const pane=id=>{const e=d.getElementById(id),r=e.getBoundingClientRect();return {width:r.width,visible:w.getComputedStyle(e).display!=='none',overflow:w.getComputedStyle(e).overflowY,scroll:e.scrollHeight,client:e.clientHeight};};
  return {width:d.getElementById('working').clientWidth,list:pane('list'),inspector:pane('inspector'),
    bodyWidth:d.body.scrollWidth,viewport:d.documentElement.clientWidth,outerScroll:d.documentElement.scrollHeight>d.documentElement.clientHeight,
    back:w.getComputedStyle(d.getElementById('back')).display!=='none'};
})()`;
function check(geometry,width){
  assert.equal(geometry.width,width);assert.equal(geometry.list.visible,width>=720);
  assert.equal(geometry.inspector.visible,true);assert.ok(geometry.inspector.client>=100,JSON.stringify(geometry));
  if(width>=720){assert.ok(geometry.list.client>=100,JSON.stringify(geometry));assert.ok(geometry.inspector.width>=360);}
  assert.equal(geometry.back,width<720);assert.ok(geometry.bodyWidth<=geometry.viewport);assert.equal(geometry.outerScroll,false);
}
try {
  await browser.evaluate(websiteSession, `utag.cfg.account='account-'.repeat(60);for(let uid=100;uid<200;uid++)utag.loader.cfg[uid]={title:'Tag '+uid};`);
  await browser.wait('long inventory reconciled', () => browser.evaluate(native, `${doc}.querySelectorAll('.tag').length===101`));
  await browser.evaluate(native, `${doc}.querySelector('.tag').click()`);
  const results=[];
  for(const width of [360,520,720,900]) {
    await browser.evaluate(native, `document.querySelector('iframe[title=Tealium]').style.width='${width+24}px'`);
    const geometry=await browser.evaluate(native,geometryProgram(doc));check(geometry,width);
    results.push(geometry);
  }
  await browser.evaluate(native, `${doc}.querySelector('#list').scrollTop=800;${doc}.querySelector('#search').focus()`);
  const before=await browser.evaluate(native, `${doc}.querySelector('#list').scrollTop`);
  await browser.evaluate(websiteSession, `utag.loader.cfg['205']={title:'A new tag'};`);
  await browser.wait('new row while scrolled', () => browser.evaluate(native, `${doc}.querySelectorAll('.tag').length===102`));
  assert.equal(await browser.evaluate(native, `${doc}.querySelector('#list').scrollTop`),before);
  assert.equal(await browser.evaluate(native, `${doc}.activeElement.id`),'search');
  await browser.evaluate(native, `${doc}.querySelector('#back').click()`);
  const back=await browser.wait('Back returns row focus', () => browser.evaluate(native, `${doc}.activeElement.classList.contains('tag')`));
  assert.equal(back,true);
  const empty=await browser.evaluate(native, `({hidden:${doc}.querySelector('#inspector').hidden,width:${doc}.querySelector('#list').getBoundingClientRect().width,total:${doc}.querySelector('#working').clientWidth})`);
  assert.equal(empty.hidden,true);assert.equal(empty.width,empty.total);
  await browser.evaluate(native,`${doc}.querySelector('.tag').click();Array.from(document.querySelectorAll('#workspace-panel-tealium button')).find(button=>button.textContent.includes('full-width')).click()`);
  const full=await browser.wait('expanded geometry surface',async()=>
    (await browser.call('Target.getTargets')).targetInfos.find(target=>target.url.includes('/tealium/live/index.html')&&target.url.includes('surface=workbench')));
  const expanded=await browser.attach(full.targetId),fullWidth=[];
  await browser.wait('expanded selected inspector',()=>browser.evaluate(expanded,'document.querySelector("#inspector")?.hidden===false'));
  for(const width of [360,520,720,900]){
    await browser.call('Emulation.setDeviceMetricsOverride',{width:width+24,height:900,deviceScaleFactor:1,mobile:false},expanded);
    const geometry=await browser.evaluate(expanded,geometryProgram('document'));check(geometry,width);fullWidth.push(geometry);
  }
  console.log(JSON.stringify({tealiumGeometry:{native:results,fullWidth},stableScroll:true,stableFocus:true,backFocus:true,noEmptyInspector:true}));
} finally {await installed.close();}
