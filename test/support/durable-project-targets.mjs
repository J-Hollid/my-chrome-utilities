import { runBrowserTargetSession } from "./browser-target-session.mjs";

const projectPrelude = `
  const projects=await import('./data-layer-specification-project.js');
  const durable=await import('./data-layer-durable-project-repository.js');
  const repository=await durable.openIndexedDbProjectRepository();
  const state=projects.createSpecificationProject({name:'Target shop',site:'target.example',id:(kind)=>kind==='project'?'project:target':kind+':target'});
`;

const definitions = {
  DURABLE_REPOSITORY_STORAGE_TARGET:{
    pagePath:"side-panel.html",
    expression:()=>`${projectPrelude}
      await repository.putProject(state,{draftSequence:3,active:true});
      const loaded=await repository.loadProject('project:target');
      const metadata=await repository.listProjectMetadata();
      return{durableRepositoryStorage:{installedBoundary:location.protocol==='chrome-extension:',indexedDb:(await indexedDB.databases()).some(({name})=>name==='my-chrome-utilities.project-repository'),roundTrip:loaded.state.project.name==='Target shop'&&loaded.draftSequence===3,metadata:metadata.length===1&&metadata[0].projectId==='project:target',noCanonicalWebStorage:!Object.keys(localStorage).some(key=>key.startsWith('my-chrome-utilities.specification-project'))},durableRepositoryStorageIsolation:{revisionExecuted:false}};`,
  },
  DURABLE_REPOSITORY_REVISION_TARGET:{
    pagePath:"side-panel.html",
    expression:()=>`${projectPrelude}
      await repository.putProject(state,{draftSequence:1,active:true});
      const before=await repository.loadProject('project:target');
      const next=projects.transactProject(before.state,'Rename target',project=>({...project,name:'Target shop revised'}));
      const command=durable.durableDraftCommand(before,next,{commandId:'target:revision',label:'Rename target'});
      const saved=await repository.saveDraft(command),after=await repository.loadProject('project:target');
      const exported=await repository.exportProject('project:target');
      return{durableRepositoryRevision:{installedBoundary:location.protocol==='chrome-extension:',committed:saved.status==='committed',revision:after.draftSequence===2,content:after.state.project.name==='Target shop revised',portable:exported.sourceProjectId==='project:target'&&!Object.hasOwn(exported,'history')},durableRepositoryRevisionIsolation:{storageRoundTripExecuted:false}};`,
  },
  DURABLE_RENDERER_CORPUS_TARGET:{
    pagePath:"side-panel.html",
    expression:()=>`${projectPrelude}
      state.project.collections.pages=Array.from({length:500},(_,index)=>({id:'page:'+index,name:'Page '+index}));
      await repository.putProject(state,{active:true});
      for(let attempt=0;attempt<400&&!document.querySelector('#active-project-card');attempt+=1)await new Promise(resolve=>setTimeout(resolve,25));
      document.querySelector('#data-layer-view-projects')?.click();
      const card=document.querySelector('#active-project-card'),nodes=document.querySelectorAll('*').length;
      return{durableRendererCorpus:{installedBoundary:location.protocol==='chrome-extension:',projectVisible:Boolean(card?.textContent.includes('Target shop')),boundedNodes:nodes<20000,corpusStored:(await repository.loadProject('project:target')).state.project.collections.pages.length===500},durableRendererCorpusIsolation:{historyExecuted:false}};`,
  },
  DURABLE_RENDERER_HISTORY_TARGET:{
    pagePath:"side-panel.html",
    expression:()=>`${projectPrelude}
      await repository.putProject(state,{draftSequence:1,active:true});
      const history=durable.createPageProjectHistory(),before=await repository.loadProject('project:target');
      const next=projects.transactProject(before.state,'History target',project=>({...project,description:'changed'}));
      const command=durable.durableDraftCommand(before,next,{commandId:'target:history',label:'History target'});history.push(command);
      await repository.saveDraft(command);const undo=history.undo(await repository.loadProject('project:target'));await repository.saveDraft(undo);
      const redo=history.redo(await repository.loadProject('project:target'));await repository.saveDraft(redo);
      const reopened=durable.createPageProjectHistory();
      return{durableRendererHistory:{installedBoundary:location.protocol==='chrome-extension:',undoRedo:history.snapshot().undo.length===1&&(await repository.loadProject('project:target')).state.project.description==='changed',reloadEmpty:reopened.snapshot().undo.length===0&&reopened.snapshot().redo.length===0,noStoredHistory:!(await indexedDB.databases()).some(({name})=>name==='history')},durableRendererHistoryIsolation:{corpusExecuted:false}};`,
  },
};

await runBrowserTargetSession({ definitions });
