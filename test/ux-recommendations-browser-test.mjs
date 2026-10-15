import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {headlessChromeArguments,resolveChromeExecutable,stopHeadlessChrome,removeChromeProfile} from './support/headless-chrome.mjs';
import {pageSocket,evaluate,extensionId,wait} from './support/side-panel-companion/chrome.mjs';

const evidence=path.resolve(process.env.BRAND_EVIDENCE_DIR??'docs/ux-implementation-2026-09-26/evidence/tasks');
const profile=await mkdtemp(path.join(os.tmpdir(),'twatility-ux-'));
const args=headlessChromeArguments(profile,path.resolve('dist'));
args.splice(-1,0,`--load-extension=${path.resolve('dist')}`);
const chrome=spawn(resolveChromeExecutable(),args,{stdio:['ignore','ignore','pipe'],windowsHide:true});
let socket;
const results=[];
try {
  const port=await new Promise((resolve,reject)=>{
    let stderr='';const timeout=setTimeout(()=>reject(Error(stderr||'Chrome start timeout')),15000);
    chrome.stderr.on('data',chunk=>{stderr+=chunk;const match=stderr.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);if(match){clearTimeout(timeout);resolve(Number(match[1]));}});
    chrome.once('error',reject);
  });
  await mkdir(evidence,{recursive:true});
  const id=await extensionId(port),base=`chrome-extension://${id}/`;
  async function ready(expression,label) {
    for(let i=0;i<150;i++){if(await evaluate(socket,expression))return;await wait(40);}
    throw Error('Not ready: '+label);
  }
  async function open(url,width=420,height=900) {
    socket?.close();socket=await pageSocket(port,url);
    await socket.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await ready('document.readyState==="complete"','document');
  }
  async function shot(name) {
    await wait(220);
    await evaluate(socket,'document.fonts.ready.then(()=>true)');
    const report=await evaluate(socket,'({width:innerWidth,overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1})');
    assert.equal(report.overflow,false,name+' page overflow');
    const {data}=await socket.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await writeFile(path.join(evidence,name+'.png'),Buffer.from(data,'base64'));results.push({name,...report});
  }
  await open(base+'side-panel.html',360,800);
  await ready('!!document.querySelector("#workspace-tab-tealium")','utilities');
  assert.deepEqual(await evaluate(socket,'[...document.querySelectorAll(".utility-name")].map(e=>({name:e.textContent,visible:e.getBoundingClientRect().height>0}))'),[
    {name:'Data Layer',visible:true},{name:'Hotkeys',visible:true},{name:'Tealium',visible:true},
  ]);
  await ready('!document.querySelector("#data-layer-startup-status")','Data Layer startup');
  await shot('live-360');
  await evaluate(socket,'document.querySelector("#data-layer-view-library").click()');
  await ready('document.querySelector("#clear-event-library").hidden','Library loaded');
  assert.equal(await evaluate(socket,'document.querySelector("#event-template-empty-state h4").textContent'),'No event templates yet');
  await shot('library-empty-360');
  await evaluate(socket,'document.querySelector("#data-layer-view-defects").click()');
  await wait(200);
  await evaluate(socket,'document.querySelector("#defect-advanced-filters").open=true;const status=document.querySelector("#defect-library-status");status.value="Reported";status.dispatchEvent(new Event("change",{bubbles:true}))');
  assert.equal(await evaluate(socket,'document.querySelector("#defect-filter-count").textContent'),'(1 active)');
  await evaluate(socket,'document.querySelector("#clear-defect-filters").click()');
  assert.equal(await evaluate(socket,'document.querySelector("#defect-filter-count").textContent'),'(0 active)');
  await shot('defect-filters-360');
  await evaluate(socket,'document.querySelector("#workspace-tab-hotkeys").click();document.querySelector("#hotkey-editor-filter").value="Show Library";document.querySelector("#hotkey-editor-filter").dispatchEvent(new Event("input"))');
  await ready('document.querySelector("#hotkey-editor-commands input")','shortcut');
  await evaluate(socket,'[...document.querySelectorAll("#hotkey-editor-commands button")].find(b=>b.textContent==="Record keys").click()');
  for(const key of ['z','x']) {
    await socket.call('Input.dispatchKeyEvent',{type:'keyDown',key,code:'Key'+key.toUpperCase()});
    await socket.call('Input.dispatchKeyEvent',{type:'keyUp',key,code:'Key'+key.toUpperCase()});
  }
  assert.equal(await evaluate(socket,'document.querySelector("#hotkey-editor-commands input").value'),'z x');
  await socket.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await socket.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await evaluate(socket,'[...document.querySelectorAll("#hotkey-editor-commands button")].find(b=>b.textContent==="Save").click()');
  assert.equal(await evaluate(socket,'document.querySelector("#hotkey-editor-commands input").value'),'z x');
  await shot('shortcut-recorded-360');
  await evaluate(socket,'document.querySelector("#open-palette").click()');
  assert.equal(await evaluate(socket,'document.querySelector("#palette-results li:last-child").dataset.category'),'Development');
  await shot('commands-360');
  await socket.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await evaluate(socket,'document.querySelector("#workspace-tab-tealium").click()');
  const doc='document.querySelector("iframe[title=Tealium]")?.contentDocument';
  await ready(`!!${doc}?.querySelector('#status')`,'Tealium');
  await wait(300);
  assert.equal(await evaluate(socket,`${doc}.querySelector('.filters').hidden`),true);
  await shot('tealium-setup-360');

  await evaluate(socket,`(async()=>{
    const {createSpecificationProject}=await import('./data-layer-specification-project.js');
    const {openIndexedDbProjectRepository}=await import('./data-layer-durable-project-repository.js');
    const {createProjectDocumentationTheme,createProjectDocumentationSet}=await import('./data-layer-project-documentation-records.js');
    let sequence=0;const state=createSpecificationProject({name:'UX review',description:'Local fixture',site:'example.test',id:kind=>kind==='project'?'project:ux':kind+':ux:'+ ++sequence});
    const theme=createProjectDocumentationTheme({id:'theme:ux',name:'Paper report'});
    const set=createProjectDocumentationSet({id:'set:ux',name:'Review report',themeId:theme.id,sections:[{id:'section:ux',kind:'overview',name:'Overview',selected:true},{id:'matrix:ux',kind:'matrix',name:'Capture matrix',selected:true}]});
    state.project.documentation={themes:[theme],sets:[set]};
    await (await openIndexedDbProjectRepository()).putProjectMetadataOnly(state,{active:true,draftToken:'ux-token',draftSequence:1,publishedRevision:0,navigation:{kind:'pages'}});
  })()`);
  await open(base+'specification-builder.html?project=project%3Aux&view=documentation',1280,900);
  await ready('!!document.querySelector(".documentation-primary-tabs")','Documentation');
  await evaluate(socket,'document.querySelector("[aria-controls=documentation-theme-panel]").click()');
  await ready('!!document.querySelector(".documentation-theme-layout")','theme layout');
  await evaluate(socket,'document.querySelector("[data-theme-group=Brand]").open=true;const control=document.querySelector("[name=clientName]");control.value="Review client";control.dispatchEvent(new Event("input",{bubbles:true}))');
  assert.equal(await evaluate(socket,'document.querySelector("[data-theme-save-state]").textContent'),'Unsaved theme changes');
  assert.match(await evaluate(socket,`document.querySelector('[aria-label="Theme preview"]>p').textContent`),/out of date/);
  await evaluate(socket,'[...document.querySelectorAll(".theme-actions button")].find(b=>b.textContent==="Preview theme changes").click()');
  assert.match(await evaluate(socket,'document.querySelector("[data-theme-sample]").textContent'),/Review client/);
  await evaluate(socket,'document.querySelector(".documentation-theme-layout").scrollIntoView({block:"start"})');
  await shot('theme-preview-1280');
  await evaluate(socket,'[...document.querySelectorAll(".theme-actions button")].find(b=>b.textContent==="Save theme").click()');
  await ready(`(async()=>{const repo=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();return(await repo.loadProject('project:ux')).state.project.documentation.themes[0].clientName==='Review client';})()`,'saved theme');
  await socket.call('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:false});
  await ready('!document.querySelector("#studio-navigation").open','narrow navigation');
  await evaluate(socket,'document.querySelector(".documentation-theme-layout").scrollIntoView({block:"start"})');
  await shot('theme-preview-360');
  await evaluate(socket,`(()=>{
    localStorage.setItem('my-chrome-utilities.event-template-library.v1',JSON.stringify([{id:'template:ux',name:'Purchase template',eventName:'purchase',sourceId:'history',sourceName:'History',destination:'dataLayer',tags:[],validation:'Not checked',payload:{event:'purchase'},version:1,provenance:'captured'}]));
    localStorage.setItem('my-chrome-utilities.saved-session-library.v1',JSON.stringify({sessions:[{id:'saved:ux',name:'Checkout review',pageScope:'https://example.test/checkout',startedAt:'2026-09-26T10:00:00Z',endedAt:'2026-09-26T10:01:00Z',events:[],immutable:true}]}));
  })()`);
  await open(base+'side-panel.html',420,900);
  await ready('!!document.querySelector("#workspace-tab-tealium")&&!document.querySelector("#data-layer-startup-status")','populated workspace');
  await evaluate(socket,'document.querySelector("#workspace-tab-data-layer").click();document.querySelector("#data-layer-view-library").click()');
  await ready('!!document.querySelector(".event-template-row .record-actions")','saved template');
  assert.equal(await evaluate(socket,'document.querySelector(".event-template-row details").open'),false);
  await shot('library-populated-420');
  await evaluate(socket,'document.querySelector(".event-template-row summary").click();[...document.querySelectorAll(".event-template-row details button")].find(b=>b.textContent==="Duplicate").click()');
  await ready('document.querySelectorAll(".event-template-row").length===2','duplicate template');
  await evaluate(socket,'document.querySelector("#data-layer-view-sessions").click()');
  await ready('!!document.querySelector("#saved-session-list .record-actions")','saved session');
  assert.equal(await evaluate(socket,'document.querySelector("#saved-session-list details").open'),false);
  await shot('sessions-populated-420');
  await evaluate(socket,'document.querySelector("#saved-session-list .record-actions>button").click()');
  await ready('!document.querySelector("#saved-session-live-banner").hidden','open saved feed');
  await writeFile(path.join(evidence,'report.json'),JSON.stringify({results,checks:['visible utility labels','empty and populated Library, Duplicate action','saved-session opening','filter count and reset','native shortcut recording and save','command grouping','Tealium setup','theme dirty / preview / durable save','narrow navigation'],limits:'Local fixture data; no real website or vendor delivery.'},null,2));
  console.log('UX recommendation browser checks passed');
} finally {
  socket?.close();await stopHeadlessChrome(chrome);await removeChromeProfile(profile,{targetId:'ux-recommendations'});
}
