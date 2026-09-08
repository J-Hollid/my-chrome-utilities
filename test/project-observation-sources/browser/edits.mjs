export async function observeSourceEdit(input) {
  const c=sourceControls,f=observationFixture;
  globalThis.dataLayer=[];globalThis.event={history:[]};
  if(input.path){const parts=input.path.split('.');let owner=globalThis;for(const part of parts.slice(0,-1))owner=owner[part]??={};owner[parts.at(-1)]=[];}
  await c.start();await c.until(()=>globalThis.__twaObservationArrays?.channels.size===2,'source attachment');
  dataLayer.push({event:input.first});event.history.push({event:'A1'});
  const original=c.captured(),message=f.messages.find(item=>item.message.rawValue.event===input.first);
  const applicationChannel=f.calls.find(call=>call.name==='observationArrayHook'&&call.args[0]==='attach'&&call.args[1]==='event.history').args[2];
  if(input.action==='disable')await c.enable('marketing',false);
  if(input.action==='confirmed removal')await c.remove('marketing');
  if(input.action==='change path')await c.edit('marketing',{name:input.name,path:input.path});
  for(const listener of message.listeners)listener({...message.message,index:99,rawValue:{event:'staleEdit'}},{tab:{id:771}});
  const later=input.later??'Later';
  for(const name of later.split(', '))dataLayer.push({event:name});
  event.history.push({event:'A2'});await c.until(()=>c.captured().some(event=>event.name==='A2'),'Application continues');
  const whileChanged=c.captured(),status=c.rows().find(source=>source.id==='marketing')?.status;
  if(input.action==='disable'){
    await c.enable('marketing',true);await c.enable('marketing',true);
    await c.until(()=>later.split(', ').every(name=>c.captured().some(event=>event.name===name)),'catchup snapshot');
  }
  if(input.path){let array=globalThis;for(const part of input.path.split('.'))array=array[part];array.push({event:'NewPath'});
    await c.until(()=>c.captured().some(event=>event.name==='NewPath'),'edited source push');}
  const resumed=c.captured(),configuration=c.rows();
  if(input.action==='disable'){await c.remove('marketing');dataLayer.push({event:'afterRemoval'});}
  return {input,original,whileChanged,resumed,configuration,status,
    applicationUnchanged:globalThis.__twaObservationArrays.channels.has(applicationChannel),
    staleRejected:!c.captured().some(event=>['staleEdit','afterRemoval'].includes(event.name)),
    retained:c.captured().find(event=>event.id===original[0].id),pushDefault:(await c.stored()).project.eventTransport.defaultPushPath};
}

export async function observeReceiptFilter(input) {
  const c=sourceControls;
  globalThis.dataLayer=[];globalThis.event={history:[]};
  await c.start();await c.until(()=>globalThis.__twaObservationArrays?.channels.size===2,'source attachment');
  for(const receipt of input.receipt_order.split(', ')){
    const [source,name]=receipt.split(':');(source==='Marketing'?dataLayer:event.history).push({event:name});
  }
  const captured=c.captured(),all=c.events();c.filter(input.selected_source.toLowerCase());
  const selected=c.events(),count=c.q('#live-source-filter-count').textContent;
  c.filter('');
  return {input,captured,all,selected,count,cleared:c.events(),unchanged:JSON.stringify(c.captured())===JSON.stringify(captured)};
}
