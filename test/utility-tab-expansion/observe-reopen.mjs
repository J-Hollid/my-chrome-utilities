export async function observeUtilityReopen(previous) {
  const until=async(predicate,label)=>{const end=performance.now()+8000;while(!predicate()){
    if(performance.now()>end)throw new Error(label);await new Promise(resolve=>setTimeout(resolve,25));}};
  await until(()=>document.querySelector('#workspace-tab-probe'),'Probe tab after open');
  if(!previous)document.querySelector('#workspace-tab-probe').click();
  else if(document.querySelector('#workspace-tab-probe').getAttribute('aria-selected')!=='true')throw new Error('Stored workspace not restored');
  await until(()=>document.querySelector('#workspace-panel-probe iframe')?.contentDocument?.documentElement?.dataset.ready==='true','Reopened Probe ready');
  const doc=document.querySelector('#workspace-panel-probe iframe').contentDocument;
  const state=()=>JSON.parse(doc.querySelector('#state').textContent);
  const {openIndexedDbProjectRepository}=await import('./data-layer-durable-project-repository.js');
  const repository=await openIndexedDbProjectRepository();
  const projects=await repository.listProjectMetadata();
  const projectBytes=JSON.stringify(await Promise.all(projects.map(async({projectId})=>(await repository.loadProject(projectId)).state)));
  if(!previous){
    doc.querySelector('#draft').value='saved on close';doc.querySelector('#draft').dispatchEvent(new Event('input'));doc.querySelector('#save').click();
    return {session:state().session,projectBytes};
  }
  if(doc.querySelector('#draft').value!=='saved on close'||previous.session===state().session)throw new Error('Reopening must restore only the saved draft in a new session');
  if(projectBytes!==previous.projectBytes)throw new Error('Utility reopen changed project data');
  doc.querySelector('#start').click();doc.querySelector('#event').click();doc.querySelector('#stop').click();
  if(state().events!==1||state().stops!==1)throw new Error('A reopened action has duplicate listeners');
  return {utilityReopen:{draft:true,workspace:true,projectBytes:true,listeners:true}};
}

export async function observeUtilityStartupException() {
  const until=async(predicate,label)=>{const end=performance.now()+6000;while(!predicate()){
    if(performance.now()>end)throw new Error(label);await new Promise(resolve=>setTimeout(resolve,25));}};
  document.querySelector('#workspace-tab-probe').click();
  await until(()=>document.querySelector('#workspace-panel-probe iframe')?.contentDocument?.readyState==='complete','Probe exception page loaded');
  if(document.querySelector('#workspace-panel-probe iframe').contentDocument.documentElement.dataset.ready==='true')throw new Error('The controlled exception did not occur');
  document.querySelector('#workspace-tab-hotkeys').click();
  if(document.querySelector('#workspace-panel-hotkeys').hidden)throw new Error('Utility exception blocked navigation');
  document.querySelector('#workspace-tab-data-layer').click();
  dataLayer.push({event:'after_probe_exception'});
  await until(()=>document.querySelector('#live-event-feed').textContent.includes('after_probe_exception'),'Capture after utility exception');
  document.querySelector('#open-palette').click();
  await until(()=>!document.querySelector('#palette').hidden,'Global command access');
  return {utilityException:{contained:true,capture:true,hotkeys:true,commands:true}};
}
