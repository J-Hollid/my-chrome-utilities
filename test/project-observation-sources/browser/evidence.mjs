export async function observeSourceEvidence(payload,source) {
  const c=sourceControls;
  globalThis.dataLayer=[];globalThis.event={history:[]};
  await c.start();await c.until(()=>globalThis.__twaObservationArrays?.channels.size===2,'source attachment');
  dataLayer.push(payload);event.history.push(payload);await c.until(()=>c.captured().length===2,'equal payload capture');
  const original=c.captured();c.filter(source.toLowerCase());
  const filtered=c.events(),count=c.q('#live-source-filter-count').textContent;
  c.q('#live-event-feed [data-event-id]').click();
  const inspector=c.q('[data-observation-source-details]').textContent;
  c.q('#save-live-session').click();c.input('#save-live-session-name','Source evidence');c.q('#confirm-save-live-session').click();
  await c.until(()=>JSON.parse(localStorage.getItem('my-chrome-utilities.saved-session-library.v1')??'{}').sessions?.length===1,'saved session');
  const saved=JSON.parse(localStorage.getItem('my-chrome-utilities.saved-session-library.v1')).sessions[0];
  const {openSavedSessionLiveFeed}=await import('./data-layer-saved-session-live-feed.js');
  const restored=openSavedSessionLiveFeed({view:'Live',status:'Live',pageUrl:'https://retail.test/',sources:[],events:[],listVisible:true},saved).savedView.events;
  c.q('#live-inspector-action-report-unexpected-event').click();
  c.q('[data-occurrence-acknowledgement]').click();c.q('[data-occurrence-override]').click();
  c.button(c.q('#live-event-inspector'),'Confirm expectation').click();c.button(c.q('#live-event-inspector'),'Save defect').click();
  await c.until(()=>JSON.parse(localStorage.getItem('my-chrome-utilities.defect-library.v1')??'{}').defects?.length===1,'saved defect evidence');
  const defect=JSON.parse(localStorage.getItem('my-chrome-utilities.defect-library.v1')).defects[0];
  c.button(c.q('#live-event-inspector'),'Back to Live feed').click();c.filter('');
  const state=await c.stored(),project=state.project;
  project.collections.profiles=[{id:'profile:marketing-only',name:'Marketing only',requirements:[{path:'/required_marker',type:'string',required:true}]}];
  project.collections.events=[{id:'event:source-test',name:payload.event,eventName:payload.event}];
  project.collections.assignments=[{id:'assignment:marketing-only',name:'Marketing only',targetId:'profile:marketing-only',targetKind:'Shared Profile',
    eventId:'event:source-test',sourceId:'marketing',target:'payload',priority:1}];
  const {createCanonicalProjectEnvelope,compileSpecificationProject,evaluateSpecificationObservation}=await import('./data-layer-specification-engine.js');
  const compiled=compileSpecificationProject(createCanonicalProjectEnvelope(project));
  if(compiled.status!=='compiled')throw new Error('Source Assignment fixture failed to compile: '+JSON.stringify(compiled));
  const evaluations=original.map(event=>evaluateSpecificationObservation(compiled.plan,{sourceId:event.sourceId,eventName:event.name,payload:event.payload}));
  return {payload,source,original,filtered,count,inspector,saved:saved.events,restored,defect,
    cleared:c.events(),unchanged:JSON.stringify(c.captured())===JSON.stringify(original),
    assignment:evaluations.map(result=>({winner:result.winner?.assignmentId,issues:result.issues,rejected:result.candidates[0].rejectionReasons}))};
}
