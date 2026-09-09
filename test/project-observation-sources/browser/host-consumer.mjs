export async function observeSourceHostContinuity() {
  const check=(value,message)=>{if(!value)throw new Error(message);};
  const until=async(predicate,message)=>{
    const deadline=performance.now()+10000;
    while(!predicate()) {
      if(performance.now()>deadline)throw new Error(message);
      await new Promise(resolve=>requestAnimationFrame(resolve));
    }
  };
  const q=selector=>document.querySelector(selector);
  await until(()=>q('#side-panel-root')?.dataset.utilityShellReady==='true','Host ready');
  q('#data-layer-view-live').click();
  q('#choose-observation-target').click();
  await until(()=>!q('#start-data-layer-testing').disabled,'Selected source target ready');
  q('#start-data-layer-testing').click();
  await until(()=>q('#live-event-feed')?.querySelectorAll('[data-event-id]').length===2,'Initial source events acknowledged');
  const {DATA_LAYER_SESSION_STORAGE_KEY}=await import('./utilities/data-layer/capture.js');
  const session=()=>JSON.parse(localStorage.getItem(DATA_LAYER_SESSION_STORAGE_KEY)).session.id;
  const originalSession=session();
  const channels=globalThis.__twaObservationArrays.channels;
  const originalChannels=[...channels.entries()];
  const fixture=globalThis.observationFixture;
  const attaches=()=>fixture.calls.filter(call=>call.name==='observationArrayHook'&&call.args[0]==='attach').length;
  const originalAttaches=attaches();
  check(originalChannels.length===2,'Exactly two selected source subscriptions');
  check(originalAttaches===2,'Each selected source attaches once');
  check(fixture.calls.every(call=>call.target===771),'Source calls use the selected target');
  const wrappers=[dataLayer.push,event.history.push];
  const probe=q('#workspace-tab-probe'),dataLayerTab=q('#workspace-tab-data-layer');
  probe.click();
  await until(()=>q('#workspace-panel-probe iframe')?.contentDocument?.documentElement?.dataset.ready==='true','Probe ready acknowledgement');
  const frame=q('#workspace-panel-probe iframe');
  const probeState=()=>JSON.parse(frame.contentDocument.querySelector('#state').textContent);
  const probeSession=probeState().session;
  check(probeState().target===771,'Probe shares the selected target');
  const expected=[];
  for(const [index,tab] of [probe,dataLayerTab,probe,dataLayerTab].entries()) {
    tab.click();
    check(tab.getAttribute('aria-selected')==='true','Requested utility shown');
    for(const [source,array] of [['marketing',dataLayer],['application',event.history]]) {
      const name=`host_ack_${index}_${source}`;
      expected.push(name);
      array.push({event:name,hostSequence:index});
      await until(()=>[...q('#live-event-feed').querySelectorAll('[data-event-id]')]
        .some(row=>row.textContent.includes(name)),'Source event acknowledged: '+name);
    }
    const rows=[...q('#live-event-feed').querySelectorAll('[data-event-id]')];
    check(rows.length===2+expected.length,'No lost or duplicate source events');
    for(const name of expected) {
      const matching=rows.filter(row=>row.textContent.includes(name));
      check(matching.length===1,'Exactly one row per controlled event: '+name);
      check(matching[0].textContent.includes(name.endsWith('marketing')?'Marketing':'Application'),'Source identity retained');
    }
    check(session()===originalSession,'Capture session retained');
    check(probeState().session===probeSession&&probeState().target===771,'Probe session and target retained');
    check(channels.size===originalChannels.length&&originalChannels.every(([id,entry])=>channels.get(id)===entry),'Source subscriptions unchanged');
    check(attaches()===originalAttaches,'Host visibility adds no source attachment');
    check(dataLayer.push===wrappers[0]&&event.history.push===wrappers[1],'Host visibility retains source wrappers');
  }
  for(const listener of [...fixture.removed])listener(771,{windowId:1,isWindowClosing:false});
  await until(()=>channels.size===0,'Selected target disposal acknowledged');
  check(probeState().target===771,'Target closure does not silently retarget');
  const before=q('#live-event-feed').querySelectorAll('[data-event-id]').length;
  dataLayer.push({event:'after_host_target_closed'});
  check(q('#live-event-feed').querySelectorAll('[data-event-id]').length===before,'Disposed target adds no event');
  return {sourceHostContinuity:{events:expected.length,target:771,session:true,subscriptions:2,
    stableAttachments:true,hiddenAndReturned:true,disposed:true}};
}
