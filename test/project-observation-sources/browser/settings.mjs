export async function observeSourceSettings() {
  const c=sourceControls;
  await c.start();await c.until(()=>c.events().length===2,'two snapshots');
  const original=(await c.stored()).project.eventTransport.observationSources;
  const cases=[['Duplicate','window.dataLayer','Observation path already added'],
    ['Duplicate','event.history','Observation path already added'],['Invalid','queue..history','Enter a valid array path'],
    ['Invalid','__proto__.history','Enter a valid array path'],['','newQueue','Enter a source name'],
    ['Invalid','','Enter a valid array path']];
  const invalid=[];
  for(const [name,path,error] of cases){
    c.q('#add-observation-source').click();c.input('#observation-source-name',name);c.input('#observation-source-path',path);
    c.q('#save-observation-source').click();await c.until(()=>c.q('#observation-source-error').textContent===error,'validation error');
    const field=name?'path':'name',input=c.q('#observation-source-'+field);
    invalid.push({name,path,error:c.q('#observation-source-error').textContent,
      associated:input.getAttribute('aria-invalid')==='true'&&input.getAttribute('aria-describedby')==='observation-source-error',
      unchanged:JSON.stringify((await c.stored()).project.eventTransport.observationSources)===JSON.stringify(original),
      subscriptions:globalThis.__twaObservationArrays.channels.size});
    c.button(c.q('form[aria-label="Observation source"]'),'Cancel').click();
  }
  const nativePut=IDBObjectStore.prototype.put;let failedWrites=0;
  IDBObjectStore.prototype.put=function(value,...args){
    if(this.name==='projectRoots'&&value.project?.eventTransport?.observationSources?.some(source=>source.path==='analyticsQueue')){
      failedWrites++;throw new DOMException('Controlled durable source write failed','QuotaExceededError');
    }
    return nativePut.call(this,value,...args);
  };
  c.button(c.row('marketing'),'Edit').click();c.input('#observation-source-path','analyticsQueue');c.q('#save-observation-source').click();
  await c.until(()=>c.q('#observation-source-error').textContent.includes('Controlled durable'),'failed write');
  dataLayer.push({event:'beforeRetry'});analyticsQueue.push({event:'uncommitted'});
  await c.until(()=>c.events().some(event=>event.text.startsWith('beforeRetry ')),'old source still active');
  const failed={failedWrites,edit:c.q('#observation-source-path').value,retry:c.q('#save-observation-source').textContent,
    oldActive:!c.events().some(event=>event.text.startsWith('uncommitted ')),
    committed:(await c.stored()).project.eventTransport.observationSources};
  IDBObjectStore.prototype.put=nativePut;c.q('#save-observation-source').click();await c.settleEdit();
  await c.until(()=>c.events().some(event=>event.text.startsWith('uncommitted ')),'retry attaches saved source');
  dataLayer.push({event:'afterRetryOld'});analyticsQueue.push({event:'afterRetryNew'});
  await c.until(()=>c.events().some(event=>event.text.startsWith('afterRetryNew ')),'new source push');
  const retried={sources:(await c.stored()).project.eventTransport.observationSources,
    oldDetached:!c.events().some(event=>event.text.startsWith('afterRetryOld ')),
    attachedOnce:c.events().filter(event=>event.text.startsWith('uncommitted ')).length===1,
    subscriptions:globalThis.__twaObservationArrays.channels.size};
  await c.enable('marketing',false);await c.enable('application',false);
  await c.until(()=>c.q('#observation-source-readiness').textContent==='Enable an observation source','disabled guidance');
  const disabled={startDisabled:c.q('#start-data-layer-testing').disabled,guidance:c.q('#observation-source-readiness').textContent};
  await c.remove('marketing');await c.remove('application');
  const empty=(await c.stored()).project.eventTransport.observationSources;
  return {invalid,failed,retried,disabled,empty};
}
