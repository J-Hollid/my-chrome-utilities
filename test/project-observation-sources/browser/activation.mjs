export async function observeSourceActivation(input) {
  const c=sourceControls,f=observationFixture;
  globalThis.dataLayer=[{event:input.marketing_before}];globalThis.event={history:[{event:input.application_before}]};
  const calls=[];
  for(const [name,array] of [['Marketing',dataLayer],['Application',event.history]]){
    array.push=function(...items){calls.push({name,receiver:this===array,args:structuredClone(items)});return Array.prototype.push.apply(this,items);};
  }
  const hold={path:'event.history'};f.holds.push(hold);
  await c.start();await c.until(()=>hold.entered,'second source snapshot before activation');
  const push=receipt=>receipt.split(', ').map(item=>{
    const [source,name]=item.split(':'),array=source==='Marketing'?dataLayer:event.history;
    const length=array.length,result=array.push({event:name});return result===length+1;
  });
  const handoffResults=push(input.handoff);
  hold.release();await c.until(()=>c.captured().length===4,'buffered activation entries');
  const NativeDate=Date;
  globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-09-08T00:00:00.000Z']));}static now(){return 1788825600000;}};
  const liveResults=push(input.live);globalThis.Date=NativeDate;
  await c.until(()=>c.captured().length===6,'live entries');
  const captured=c.captured();
  return {input,order:captured.map(event=>`${event.sourceName}:${event.name}`),
    rendered:c.events().map(event=>event.id),ids:captured.map(event=>event.id),
    sourceIds:captured.map(event=>event.sourceId),sequences:captured.map(event=>event.captureSequence),
    captureTimes:captured.slice(-2).map(event=>event.captureTime),calls,
    results:[...handoffResults,...liveResults],subscriptions:globalThis.__twaObservationArrays.channels.size,
    targets:[...new Set(f.calls.map(call=>call.target))]};
}

export async function observeUnavailableSource(value,eventName='A1') {
  const c=sourceControls;
  dataLayer.length=0;
  if(value==='absent')delete event.history;else event.history=17;
  await c.start();
  dataLayer.push({event:'M1'});
  const status=value==='absent'?'Waiting for path':'Not an array';
  await c.until(()=>c.row('application').querySelector('output').textContent===status&&c.captured().length===1,'one ready source');
  const before=c.captured()[0];
  const oldChannels=[...globalThis.__twaObservationArrays.channels.keys()];
  event.history=[{event:eventName}];
  await c.until(()=>c.captured().length===2&&c.rows().every(source=>source.status==='Ready'),'late source retry');
  return {value,event:eventName,status,ids:c.captured().map(event=>event.id),names:c.captured().map(event=>event.name),
    firstUnchanged:c.captured()[0].id===before.id,channelsUnchanged:oldChannels.every(id=>globalThis.__twaObservationArrays.channels.has(id)),
    subscriptions:globalThis.__twaObservationArrays.channels.size};
}
