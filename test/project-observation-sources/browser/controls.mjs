/** Browser-only driver: every operation uses installed controls and durable read-back. */
export async function installSourceControls() {
  const q=selector=>{const node=document.querySelector(selector);if(!node)throw new Error("Missing "+selector);return node;};
  const until=async(predicate,label)=>{
    globalThis.observationPhase=label;
    const deadline=performance.now()+10000;
    while(!predicate()){
      if(performance.now()>deadline)throw new Error(`Timed out: ${label}; ${document.querySelector('#observation-source-error')?.textContent}`);
      await new Promise(requestAnimationFrame);
    }
    return predicate();
  };
  const button=(host,text)=>{const node=[...host.querySelectorAll('button')].find(node=>node.textContent.trim()===text);if(!node)throw new Error('Missing button '+text);return node;};
  const input=(selector,value)=>{const node=q(selector);node.value=value;node.dispatchEvent(new Event('input',{bubbles:true}));};
  const row=id=>q(`.observation-source-row[data-source-id="${id}"]`);
  const rows=()=>[...document.querySelectorAll('.observation-source-row')].map(node=>({
    id:node.dataset.sourceId,name:node.querySelector('strong').textContent,path:node.querySelector('code').textContent,
    enabled:node.querySelector('input').checked,status:node.querySelector('output').textContent,
  }));
  const events=()=>[...q('#live-event-feed').querySelectorAll('[data-event-id]')].map(node=>({id:node.dataset.eventId,text:node.textContent}));
  const captured=()=>JSON.parse(localStorage.getItem('dataLayerTestingSession')??'{}').session?.timeline.filter(entry=>entry.type==='observed')??[];
  const {openIndexedDbProjectRepository}=await import('./data-layer-durable-project-repository.js');
  const repository=await openIndexedDbProjectRepository();
  const stored=async()=>{const projectId=await repository.activeProjectId();return projectId?(await repository.loadProject(projectId)).state:undefined;};
  const settleEdit=()=>until(()=>!document.querySelector('#observation-source-name'),'source save read-back');
  const edit=async(id,values)=>{
    button(row(id),'Edit').click();for(const [key,value] of Object.entries(values))input('#observation-source-'+key,value);
    q('#save-observation-source').click();await settleEdit();
  };
  const add=async(name,path)=>{
    q('#add-observation-source').click();input('#observation-source-name',name);input('#observation-source-path',path);
    q('#save-observation-source').click();await settleEdit();return rows().find(source=>source.path===path);
  };
  const enable=async(id,value)=>{
    if(row(id).querySelector('input').checked!==value)row(id).querySelector('input').click();
    await settleEdit();await until(()=>row(id).querySelector('input').checked===value,'enabled state');
  };
  const remove=async id=>{
    button(row(id),'Remove').click();button(q('[role="alertdialog"]'),'Confirm removal').click();
    await until(()=>!rows().some(source=>source.id===id),'confirmed removal');
  };
  const start=async()=>{
    q('#data-layer-view-live').click();q('#data-layer-settings').open=true;
    q('#choose-observation-target').click();await until(()=>!q('#start-data-layer-testing').disabled,'Start enabled');
    q('#start-data-layer-testing').click();await until(()=>!q('#end-data-layer-testing').hidden,'capture started');
  };
  const stop=async()=>{q('#end-data-layer-testing').click();await until(()=>q('#end-data-layer-testing').hidden,'capture stopped');};
  const saveSnapshot=async name=>{
    const key='my-chrome-utilities.saved-session-library.v1';
    const count=JSON.parse(localStorage.getItem(key)??'{}').sessions?.length??0;
    q('#save-live-session').click();input('#save-live-session-name',name);q('#confirm-save-live-session').click();
    await until(()=>(JSON.parse(localStorage.getItem(key)??'{}').sessions?.length??0)===count+1,'saved session read-back');
    return localStorage.getItem(key);
  };
  const filter=id=>{q('#live-source-filter').value=id;q('#live-source-filter').dispatchEvent(new Event('change',{bubbles:true}));};
  await until(()=>q('#side-panel-root').dataset.utilityShellReady==='true','installed runtime');
  q('#data-layer-view-live').click();q('#data-layer-settings').open=true;
  await until(()=>rows().length>0,'loaded sources');
  globalThis.sourceControls={q,until,button,input,row,rows,events,captured,repository,stored,edit,add,enable,remove,start,stop,filter,settleEdit,saveSnapshot};
}
