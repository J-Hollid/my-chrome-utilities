import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';

const installed=await installedTealium({beforeSelect:async(browser,native)=>{
  await browser.evaluate(native,`(async()=>{
    const {createSpecificationProject}=await import('./data-layer-specification-project.js');
    const {configureObservationSources}=await import('./data-layer-project-observation-sources/settings.js');
    const {openIndexedDbProjectRepository}=await import('./data-layer-durable-project-repository.js');
    const repository=await openIndexedDbProjectRepository(),id=crypto.randomUUID();
    const project=configureObservationSources(createSpecificationProject({name:'Tealium coexistence',site:'local fixture',id:kind=>kind+':'+id}),
      [{id:'marketing',name:'Marketing',path:'dataLayer',enabled:true}]);
    await repository.putProject(project,{active:true});return true;
  })()`);
  await browser.call('Page.reload',{},native);
  await browser.wait('reloaded installed shell',()=>browser.evaluate(native,'document.querySelector("#side-panel-root")?.dataset.utilityShellReady==="true"'));
}});
const {browser,native,websiteSession,doc}=installed;
try{
  await browser.evaluate(websiteSession,'window.dataLayer=[]');
  await browser.evaluate(native,`document.querySelector('#workspace-tab-data-layer').click();document.querySelector('#data-layer-view-live').click();document.querySelector('#choose-observation-target').click()`);
  await browser.wait('Data Layer target readiness',()=>browser.evaluate(native,'!document.querySelector("#start-data-layer-testing").disabled'));
  await browser.evaluate(native,'document.querySelector("#start-data-layer-testing").click()');
  for(let index=0;index<4;index++){
    await browser.evaluate(native,`document.querySelector('#workspace-tab-${index%2?'hotkeys':'tealium'}').click()`);
    await browser.evaluate(websiteSession,`dataLayer.push({event:'tealium_coexist_${index}'});utag.loader.cfg[${100+index}]={title:'Late ${index}'};`);
    await browser.wait('acknowledged capture '+index,()=>browser.evaluate(native,`document.querySelector('#live-event-feed').textContent.includes('tealium_coexist_${index}')`));
  }
  await browser.wait('Tealium late inventory',()=>browser.evaluate(native,`${doc}.querySelectorAll('.tag').length===5`));
  const events=await browser.evaluate(native,`Array.from(document.querySelectorAll('#live-event-feed [data-event-id]')).map(row=>row.textContent)`);
  assert.equal(events.length,4,JSON.stringify(events));
  for(let index=0;index<4;index++)assert.equal(events.filter(text=>text.includes('tealium_coexist_'+index)).length,1);
  assert.equal(await browser.evaluate(websiteSession,'window.calls'),0);
  console.log(JSON.stringify({tealiumDataLayerContinuity:{events:4,eachOnce:true,lateTags:4,trackingCalls:0,realChromeTransport:true}}));
}finally{await installed.close();}
