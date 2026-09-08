export async function seedObservationProject(options={}) {
  const {createSpecificationProject}=await import("./data-layer-specification-project.js");
  const {configureObservationSources}=await import("./data-layer-project-observation-sources/settings.js");
  const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js");
  const repository=await openIndexedDbProjectRepository();
  const fixtureId=crypto.randomUUID();
  let state=createSpecificationProject({name:"Retail",site:"retail.test",id:kind=>kind+":"+fixtureId});
  state.project.eventTransport.defaultPushPath=options.pushPath??"commandQueue";
  state=configureObservationSources(state,[
    {id:"marketing",name:"Marketing",path:"dataLayer",enabled:true},
    {id:"application",name:"Application",path:"event.history",enabled:true},
  ]);
  if(options.legacyPath) {
    delete state.project.eventTransport.observationSources;
    state.project.eventTransport.observationHistoryPath=options.legacyPath;
    state.project.collections.events=[{id:'event:'+fixtureId,name:'Legacy',eventName:'Legacy',sourceId:'event-history'}];
  }
  localStorage.setItem('my-chrome-utilities.event-template-library.v1',JSON.stringify([
    {id:'template:source-explicit',name:'Explicit destination',eventName:'explicit_saved',sourceId:'marketing',sourceName:'Marketing',
      destination:'analyticsQueue',tags:[],validation:'Not checked',payload:{value:10},version:1,provenance:'library-created'},
  ]));
  await repository.putProject(state,{active:true});
  return true;
}

export async function installObservationTarget() {
  const listeners=new Set();
  const target={id:771,windowId:1,active:true,title:"Observation fixture",url:"https://retail.test/"};
  globalThis.dataLayer=[{event:"M0"}];globalThis.event={history:[{event:"A0"}]};
  globalThis.commandQueue=[];globalThis.analyticsQueue=[];
  globalThis.checkoutQueue=[];globalThis.consent={log:[]};
  const updated=new Set(),removed=new Set(),permissionsRemoved=new Set();
  const fixture={target,calls:[],messages:[],holds:[],permission:true,updated,removed,permissionsRemoved};
  globalThis.observationFixture=fixture;
  const eventPort=set=>({addListener:listener=>set.add(listener),removeListener:listener=>set.delete(listener)});
  chrome.tabs.onUpdated=eventPort(updated);chrome.tabs.onRemoved=eventPort(removed);
  chrome.permissions.onRemoved=eventPort(permissionsRemoved);
  chrome.tabs.query=async()=>[target];chrome.tabs.get=async()=>target;
  chrome.runtime.onMessage.addListener=listener=>listeners.add(listener);
  chrome.runtime.onMessage.removeListener=listener=>listeners.delete(listener);
  chrome.runtime.sendMessage=async message=>{
    const delivery=()=>{for(const listener of [...listeners])listener(message,{tab:{id:771}});};
    fixture.messages.push({message,delivery,listeners:[...listeners]});delivery();
  };
  chrome.scripting.executeScript=async details=>{
    if(details.target.tabId!==771)throw new Error("Wrong target tab");
    if(!fixture.permission)throw new Error("Selected-origin permission removed");
    const call={name:details.func.name,args:details.args,target:details.target.tabId};fixture.calls.push(call);
    const result=details.func(...details.args);
    const hold=fixture.holds.find(item=>!item.entered&&item.path===details.args?.[1]&&call.name==='observationArrayHook'&&details.args[0]==='attach');
    if(hold) {hold.entered=true;await new Promise(resolve=>hold.release=resolve);}
    return [{result:await result}];
  };
  chrome.permissions.contains=async()=>fixture.permission;chrome.permissions.request=async()=>fixture.permission;
  return true;
}

export async function observeTwoInstalledSources() {
  const q=selector=>{const node=document.querySelector(selector);if(!node)throw new Error("Missing "+selector);return node;};
  const until=async(predicate,label)=>{
    const deadline=performance.now()+10000;
    while(!predicate()){if(performance.now()>deadline)throw new Error("Timed out: "+label+" "+q("#history-path-status").textContent);
      await new Promise(resolve=>requestAnimationFrame(resolve));}
  };
  await until(()=>q("#side-panel-root").dataset.utilityShellReady==="true","installed runtime");
  q("#data-layer-view-live").click();q("#data-layer-settings").open=true;
  await until(()=>document.querySelectorAll(".observation-source-row").length===2,"source configuration");
  q("#choose-observation-target").click();
  await until(()=>!q("#start-data-layer-testing").disabled,"source readiness");
  q("#start-data-layer-testing").click();
  await until(()=>document.querySelectorAll("#live-event-feed [data-event-id]").length>=2,"initial capture");
  const payload={event:"purchase",value:10};
  dataLayer.push(payload);event.history.push(payload);
  await until(()=>q("#live-event-feed").textContent.includes("purchase"),"live push");
  const feedText=q("#live-event-feed").textContent;
  const filter=q("#live-source-filter");filter.value="marketing";filter.dispatchEvent(new Event("change",{bubbles:true}));
  await until(()=>q("#live-source-filter-count").textContent.trim()==="2 events","source filter");
  const filtered=q("#live-event-feed").textContent;
  filter.value="";filter.dispatchEvent(new Event("change",{bubbles:true}));
  const rows=[...document.querySelectorAll(".observation-source-row")];
  const capturedNames=feedText.includes("Marketing")&&feedText.includes("Application");
  const samePayloadSeparate=feedText.split("purchase").length-1>=2;
  const filterCount=q("#live-source-filter-count").textContent.trim();
  return {capturedNames,samePayloadSeparate,filtered,filterCount,rows:rows.length,
    overflow:document.documentElement.scrollWidth>innerWidth,
    statuses:rows.map(row=>row.querySelector("output").textContent),feedText};
}
