export async function observeRetainedUtility(commonCheck) {
  const check=(condition,message)=>{if(!condition)throw new Error(message);};
  const until=async(predicate,message)=>{
    const end=performance.now()+6000;
    while(!predicate()){if(performance.now()>end)throw new Error(message);await new Promise(resolve=>setTimeout(resolve,25));}
  };
  await until(()=>document.querySelector('#workspace-tab-probe'),'Probe registration');
  check(!document.querySelector('#workspace-panel-probe iframe'),'Probe must be lazy');
  const hostButton=document.querySelector('#workspace-tab-data-layer');
  const styleControl=document.querySelector('#workspace-tab-hotkeys');
  const color=getComputedStyle(styleControl).color;
  const tab=document.querySelector('#workspace-tab-probe'), tabs=document.querySelector('#workspace-tabs');
  tabs.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));
  check(tab.getAttribute('aria-selected')==='true','Keyboard selects Probe');
  await until(()=>document.querySelector('#workspace-panel-probe iframe')?.contentDocument?.documentElement.dataset.ready==='true','Probe ready');
  const frame=document.querySelector('#workspace-panel-probe iframe'), doc=frame.contentDocument;
  const read=()=>JSON.parse(doc.querySelector('#state').textContent);
  const common=commonCheck(doc);
  const before=read();
  const switches=innerWidth===800?8:4, scroll=innerWidth===800?480:240;
  check(before.target===771,'The selected website target is bound');
  check(getComputedStyle(styleControl).color===color&&getComputedStyle(doc.querySelector('button')).color==='rgb(170, 0, 170)','Isolated style');
  check(document.querySelectorAll('#workspace-tab-data-layer').length===1,'Isolated duplicate ID');
  const draft=doc.querySelector('#draft');draft.value='unsaved alpha';draft.dispatchEvent(new Event('input'));
  doc.querySelector('#filter').value='changed';doc.querySelector('#selection').value='B';doc.querySelector('#scroll').scrollTop=scroll;
  doc.querySelector('#start').click();
  const captureStatus=document.querySelector('#live-session-status').textContent;
  const {DATA_LAYER_SESSION_STORAGE_KEY}=await import('./utilities/data-layer/capture.js');
  const captureSession=JSON.parse(localStorage.getItem(DATA_LAYER_SESSION_STORAGE_KEY)).session.id;
  for(let i=0;i<switches;i++){
    hostButton.click();check(frame.isConnected,'Hidden page retained');doc.querySelector('#event').click();tab.click();
    dataLayer.push({event:'probe_switch_'+i});
  }
  check(frame.contentDocument===doc&&read().session===before.session,'Same document and session');
  check(draft.value==='unsaved alpha'&&doc.querySelector('#filter').value==='changed'&&doc.querySelector('#selection').value==='B'&&doc.querySelector('#scroll').scrollTop===scroll,'Retained working state');
  check(read().events===before.events+switches&&read().running,'Hidden job continues once per event');
  hostButton.click();
  await until(()=>document.querySelector('#live-event-feed').textContent.includes('probe_switch_'+(switches-1)),'Capture continues across switches');
  check(document.querySelector('#live-session-status').textContent===captureStatus,'Capture session remains active');
  check(JSON.parse(localStorage.getItem(DATA_LAYER_SESSION_STORAGE_KEY)).session.id===captureSession,'Capture session identity is unchanged');
  for(let i=0;i<switches;i++)check(document.querySelector('#live-event-feed').textContent.split('probe_switch_'+i).length===2,'Each target event is captured once');
  tab.click();
  const panel=document.querySelector('#workspace-panel-probe');
  await until(()=>!panel.querySelector('button').disabled,'Launcher ready');
  let workbench;
  const open=window.open.bind(window);window.open=(...args)=>{workbench=open(...args);return workbench;};
  panel.querySelector('button').click();
  await until(()=>workbench?.document?.documentElement.dataset.ready==='true','Workbench ready');
  const remote=()=>JSON.parse(workbench.document.querySelector('#state').textContent);
  await until(()=>remote().owner===read().owner,'Shared job owner');
  check(!remote().ownsWork&&remote().session===before.session&&remote().target===before.target,'Same bound session in workbench');
  const remoteDraft=workbench.document.querySelector('#draft');remoteDraft.value='shared workbench draft';remoteDraft.dispatchEvent(new Event('input'));
  await until(()=>draft.value==='shared workbench draft','Workbench edits use the owner draft');
  remoteDraft.value='unsaved alpha';remoteDraft.dispatchEvent(new Event('input'));
  await until(()=>draft.value==='unsaved alpha','Workbench draft acknowledgement');
  workbench.document.querySelector('#event').click();
  await until(()=>read().events===before.events+switches+1&&remote().events===read().events,'One forwarded event');
  workbench.close();window.open=open;
  check(read().running,'Closing workbench preserves owned job');
  const confirm=window.confirm;
  let confirmations=0;
  window.confirm=()=>{confirmations++;return false;};
  panel.querySelectorAll('button')[1].click();
  check(confirmations===1&&read().running&&draft.value==='unsaved alpha','Cancel reset retains draft and job');
  window.confirm=()=>true;
  panel.querySelectorAll('button')[1].click();
  await until(()=>!read().running&&draft.value==='','Confirmed reset');
  check(read().stops===before.stops+1,'Reset stops only the owned job once');
  window.confirm=confirm;
  draft.value='saved draft';draft.dispatchEvent(new Event('input'));
  doc.querySelector('#save').click();
  doc.querySelector('#start').click();doc.querySelector('#stop').click();
  check(!read().running&&read().stops===before.stops+2,'Explicit stop once');
  doc.querySelector('#start').click();
  for(const listener of observationFixture.removed)listener(771);
  await until(()=>read().unavailable&&!read().running,'Target closure stops owned work');
  check(read().target===771&&panel.querySelector('button').disabled,'Target closure cannot retarget');
  check(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');
  return {utilityRetainedPage:{[innerWidth]:{common,lazy:true,retained:true,isolated:true,jobOwner:true,launcher:true,reset:true,targetClosure:true,captureEvents:switches,width:innerWidth,events:read().events}}};
}

export async function observeStartupIsolation() {
  const until=async(predicate,message)=>{const end=performance.now()+6000;while(!predicate()){
    if(performance.now()>end)throw new Error(message);await new Promise(resolve=>setTimeout(resolve,25));}};
  await until(()=>document.querySelector('#workspace-tab-probe'),'Independent navigation');
  document.querySelector('#workspace-tab-probe').click();
  await until(()=>document.querySelector('#workspace-panel-probe iframe')?.contentDocument?.documentElement.dataset.ready==='true','Independent utility readiness');
  const status=document.querySelector('#data-layer-startup-status');
  if(!status||!status.textContent)throw new Error('Data Layer startup status must remain visible in its workspace');
  if(localStorage.getItem('probe.startup')==='failed'){
    await until(()=>typeof globalThis.probeStorageRequest?.onerror==='function','Storage failure boundary');
    globalThis.probeStorageRequest.onerror();
    await until(()=>document.querySelector('#durable-repository-status').textContent.includes('Controlled Data Layer storage failure'),'Visible Data Layer failure');
    if(document.querySelector('#workspace-panel-probe').hidden)throw new Error('Data Layer failure hid the selected utility');
    document.querySelector('#workspace-tab-data-layer').click();
    if(document.querySelector('#workspace-panel-data-layer').hidden||document.querySelector('#data-layer-panel-projects').hidden)throw new Error('Data Layer recovery must be reachable');
    document.querySelector('#workspace-tab-probe').click();
  }
  return {utilityStartup:{[localStorage.getItem('probe.startup')]:{independent:true,status:status.textContent}}};
}
