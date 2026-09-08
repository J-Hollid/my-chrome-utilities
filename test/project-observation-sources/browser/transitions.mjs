export async function observeSourceTransition(transition) {
  const c=sourceControls,f=observationFixture;
  await c.start();await c.until(()=>c.captured().length===2,'initial snapshots');
  dataLayer.push({event:'M1'});event.history.push({event:'A1'});
  const original=c.captured(),message=f.messages.find(item=>item.message.rawValue.event==='M1');
  const oldArray=dataLayer;
  if(transition==='replacement of the dataLayer array on the page')globalThis.dataLayer=[{event:'R0'}];
  else {
    const url=transition==='selected target navigation to another page'?'https://retail.test/checkout':f.target.url;
    f.target.url=url;
    for(const callback of f.updated)callback(771,{status:'loading',...(url.endsWith('/checkout')?{url}:{})},f.target);
    globalThis.dataLayer=[{event:'R0'}];globalThis.event={history:[{event:'S0'}]};
    for(const callback of f.updated)callback(771,{status:'complete'},f.target);
  }
  await c.until(()=>c.captured().some(entry=>entry.name==='R0'),'replacement snapshot');
  const stale={...message.message,index:99,rawValue:{event:'staleGeneration'}};
  for(const listener of message.listeners)listener(stale,{tab:{id:771}});
  oldArray.push({event:'oldArrayAfterReplacement'});dataLayer.push({event:'R1'});event.history.push({event:'S1'});
  await c.until(()=>c.captured().some(entry=>entry.name==='R1')&&c.captured().some(entry=>entry.name==='S1'),'replacement live push');
  const current=c.captured(),replacement=current.find(entry=>entry.name==='R0');
  return {transition,names:current.map(entry=>entry.name),
    original:original.map(entry=>({id:entry.id,pageLoadId:entry.pageLoadId})),
    retained:current.slice(0,original.length).map(entry=>({id:entry.id,pageLoadId:entry.pageLoadId})),
    replacementPageLoad:replacement.pageLoadId,subscriptions:globalThis.__twaObservationArrays.channels.size,
    targets:[...new Set(f.calls.map(call=>call.target))]};
}

export async function observeSourceDisposal(action) {
  const c=sourceControls,f=observationFixture;
  await c.start();await c.until(()=>c.captured().length===2,'initial snapshots');
  dataLayer.push({event:'M1'});event.history.push({event:'A1'});
  const original=c.captured(),message=f.messages.find(item=>item.message.rawValue.event==='M1');
  const saved=await c.saveSnapshot('Before disposal');
  const replacement=function(...items){return Array.prototype.push.apply(this,items);};dataLayer.push=replacement;
  if(action==='Stop testing')await c.stop();
  if(action==='selected target closure')for(const callback of f.removed)callback(771,{windowId:1,isWindowClosing:false});
  if(action==='selected-origin permission removal'){
    f.permission=false;for(const callback of f.permissionsRemoved)callback({origins:['https://retail.test/*']});
  }
  for(const listener of message.listeners)listener({...message.message,index:99,rawValue:{event:'disposedCallback'}},{tab:{id:771}});
  dataLayer.push({event:'disposedPush'});event.history.push({event:'disposedPush'});
  return {action,original,current:c.captured(),newerPushPreserved:dataLayer.push===replacement,
    savedUnchanged:localStorage.getItem('my-chrome-utilities.saved-session-library.v1')===saved};
}

export async function observeArrayRelation(relation) {
  const c=sourceControls;
  globalThis.dataLayer=[];globalThis.event={history:relation==='the same array'?dataLayer:[]};
  const calls=[];
  for(const array of new Set([dataLayer,event.history]))array.push=function(...args){
    calls.push({receiver:this===array,args:structuredClone(args)});return Array.prototype.push.apply(this,args);
  };
  await c.start();await c.until(()=>globalThis.__twaObservationArrays?.channels.size===2,'two effective subscriptions');
  const results=[];
  for(const array of new Set([dataLayer,event.history]))results.push(array.push({event:'purchase',value:10}));
  await c.until(()=>c.captured().length===2,'one entry per source');
  const original=c.captured();await c.enable('marketing',false);await c.enable('marketing',true);await c.enable('marketing',true);
  await c.until(()=>globalThis.__twaObservationArrays.channels.size===2,'reenabled subscription');
  const resumed=c.captured(),initialCalls=calls.length;
  await c.enable('marketing',false);event.history.push({event:'A2'});
  await c.until(()=>c.captured().some(entry=>entry.name==='A2'),'unaffected source');
  return {relation,original,resumed,results,initialCalls,receivers:calls.every(call=>call.receiver),
    last:c.captured().at(-1),subscriptions:globalThis.__twaObservationArrays.channels.size};
}
