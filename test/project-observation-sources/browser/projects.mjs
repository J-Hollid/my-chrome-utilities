export async function installSourceProjectControls() {
  const c=sourceControls;
  async function switchTo(projectId,name) {
    c.q('#data-layer-view-projects').click();
    const row=await c.until(()=>document.querySelector(`#project-library-list [data-project-id="${projectId}"]`),'project row');
    if(row.dataset.active!=='true'){
      c.button(row,'Switch').click();
      const confirm=await c.until(()=>[...document.querySelectorAll('dialog[open] button')].find(button=>button.textContent.trim()==='Switch to '+name),'project confirmation');
      confirm.click();
    }
    await c.until(()=>c.q('#project-transport-context').textContent.includes(name),'project context');
    c.q('#data-layer-view-live').click();c.q('#data-layer-settings').open=true;
  }
  async function closeProject() {
    c.q('#data-layer-view-projects').click();
    c.button(c.q('#project-library-list [data-active="true"]'),'Close project').click();
    await c.until(()=>c.q('#project-transport-context').textContent==='No active project','closed project');
    await c.until(()=>c.q('#observation-source-settings').textContent.includes('Open project'),'source guidance');
  }
  async function importActiveProject(copyName) {
    c.q('#data-layer-view-projects').click();
    let exported;
    const picker=globalThis.showSaveFilePicker,create=URL.createObjectURL;
    Object.defineProperty(globalThis,'showSaveFilePicker',{value:undefined,configurable:true});
    URL.createObjectURL=blob=>{exported=blob;return create.call(URL,blob);};
    c.button(c.q('#project-library-list [data-active="true"]'),'Export').click();
    await c.until(()=>exported,'exported project archive');
    Object.defineProperty(globalThis,'showSaveFilePicker',{value:picker,configurable:true});URL.createObjectURL=create;
    const transfer=new DataTransfer();transfer.items.add(new File([exported],'observation-project.zip',{type:'application/zip'}));
    c.q('#import-library-project-file').files=transfer.files;
    c.q('#import-library-project-file').dispatchEvent(new Event('change',{bubbles:true}));
    const dialog=await c.until(()=>[...document.querySelectorAll('dialog[open]')].find(node=>node.textContent.includes('Review project import')),'import review');
    const input=dialog.querySelector('[aria-label="Unique target project name"]');input.value=copyName;
    c.button(dialog,'Import as new project').click();
    await c.until(()=>dialog.textContent.includes('Imported '+copyName+' atomically as inactive project'),'durable import');
    c.button(dialog,'Close import review').click();
    const row=await c.until(()=>[...document.querySelectorAll('#project-library-list [data-project-id]')].find(node=>node.textContent.includes(copyName)),'imported row');
    await switchTo(row.dataset.projectId,copyName);return row.dataset.projectId;
  }
  globalThis.sourceProjectControls={switchTo,closeProject,importActiveProject};
}

export async function observeProjectSwitch() {
  const c=sourceControls,p=sourceProjectControls;
  await c.start();await c.until(()=>c.captured().length===2,'Retail snapshots');dataLayer.push({event:'Retail1'});
  const original=c.captured(),retail=(await c.stored()).project,message=observationFixture.messages.at(-1);
  const saved=await c.saveSnapshot('Retail source evidence');
  const {createSpecificationProject}=await import('./data-layer-specification-project.js');
  const {configureObservationSources}=await import('./data-layer-project-observation-sources/settings.js');
  const suffix=crypto.randomUUID();
  const partner=configureObservationSources(createSpecificationProject({name:'Partner',site:'partner.test',id:kind=>kind+':'+suffix}),
    [{id:'partner',name:'Partner',path:'partnerQueue',enabled:true}]);
  await c.repository.putProject(partner,{active:false});globalThis.partnerQueue=[{event:'P0'}];
  await p.switchTo(partner.project.id,'Partner');await c.until(()=>c.rows().length===1&&c.rows()[0].id==='partner','Partner sources');
  await c.start();await c.until(()=>c.captured().some(event=>event.name==='P0'),'Partner capture');
  for(const listener of message.listeners)listener({...message.message,index:99,rawValue:{event:'staleRetail'}},{tab:{id:771}});
  dataLayer.push({event:'RetailAfterSwitch'});partnerQueue.push({event:'P1'});
  await c.until(()=>c.captured().some(event=>event.name==='P1'),'Partner live push');
  const partnerEvents=c.captured();
  await p.switchTo(retail.id,'Retail');await c.until(()=>c.rows().length===2,'Retail sources restored');
  const restored=c.rows(),storedRetail=(await c.repository.loadProject(retail.id)).state.project;
  await p.closeProject();
  const closed={sources:c.rows().length,guidance:c.q('#observation-source-settings').textContent,active:await c.repository.activeProjectId()};
  await p.switchTo(retail.id,'Retail');await c.until(()=>c.rows().length===2,'Retail reopened');
  return {original,partnerEvents,partnerId:partner.project.id,restored,storedRetail:storedRetail.eventTransport,
    expectedRetail:retail.eventTransport,closed,reopened:c.rows(),
    savedUnchanged:localStorage.getItem('my-chrome-utilities.saved-session-library.v1')===saved};
}

export async function observeSourcePortability(path,pushPath) {
  const c=sourceControls,p=sourceProjectControls;
  const first=await c.stored(),id=first.project.id,migrated=first.project.eventTransport.observationSources;
  await p.closeProject();await p.switchTo(id,'Retail');await c.until(()=>c.rows().length===1,'second migration load');
  const second=(await c.stored()).project.eventTransport.observationSources;
  await c.add('Application','event.history');
  const before=(await c.stored()).project,library=localStorage.getItem('my-chrome-utilities.event-template-library.v1');
  const copyId=await p.importActiveProject('Retail copy '+path);
  await c.until(()=>c.rows().length===2,'imported sources');
  globalThis.queue=[];queue.history=[{event:'Legacy'}];globalThis.dataLayer=[{event:'Legacy'}];event.history=[{event:'Added'}];
  await c.start();await c.until(()=>c.captured().length===2,'imported capture');
  const imported=(await c.stored()).project,source=(await c.repository.loadProject(id)).state.project;
  return {path,pushPath,migrated,second,copyId,imported:imported.eventTransport,original:source.eventTransport,
    expected:before.eventTransport,sourceUnchanged:JSON.stringify(source)===JSON.stringify(before),
    libraryUnchanged:localStorage.getItem('my-chrome-utilities.event-template-library.v1')===library,
    importedReferences:imported.collections.events.map(event=>event.sourceId),
    events:c.captured(),releases:source.releases};
}
