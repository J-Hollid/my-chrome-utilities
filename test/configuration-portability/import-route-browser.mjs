import assert from "node:assert/strict";
import {evaluate} from "../support/side-panel-companion/chrome.mjs";

export async function verifyConfigurationImportRoutes(socket){
  const result=await evaluate(socket,`(async()=>{
    const pause=()=>new Promise(resolve=>setTimeout(resolve,25));
    const waitFor=async read=>{for(let attempt=0;attempt<160;attempt+=1){
      const value=read();if(value)return value;await pause();
    }throw new Error('Import review did not open');};
    const picker=document.querySelector('#import-complete-configuration-file');
    const select=async(value,name)=>{
      const transfer=new DataTransfer();
      transfer.items.add(new File([JSON.stringify(value)],name,{type:'application/json'}));
      Object.defineProperty(picker,'files',{configurable:true,value:transfer.files});
      picker.dispatchEvent(new Event('change',{bubbles:true}));
    };
    const repository=await (await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
    const loaded=await repository.loadProject('project-retail');
    await select({format:'my-chrome-utilities.specification-project-state',version:2,
      state:loaded.state,migrations:[]},'retail-studio.json');
    const project=await waitFor(()=>[...document.querySelectorAll('dialog[open]')].find(dialog=>
      dialog.querySelector('h4')?.textContent==='Review project import'));
    const projectReview=project.textContent.includes('Import as new project')&&
      !project.textContent.includes('Import was not committed');
    project.querySelector('[aria-label="Close import review"]').click();
    await select({version:1,schemas:[],rules:[]},'schema-library.json');
    const schema=await waitFor(()=>document.querySelector('#schema-import-review[open]'));
    const schemaReview=schema.textContent.includes('0 schemas')&&
      document.querySelector('#data-layer-panel-schemas')?.hidden===false;
    schema.querySelector('#cancel-schema-import').click();
    const durable=await import('/data-layer-durable-project-repository.js');
    const specification=await import('/data-layer-specification-project.js');
    const legacy=durable.createMemoryDurableProjectRepository();
    await legacy.putProject(specification.createSpecificationProject({name:'Legacy route',site:'legacy.example',
      id:kind=>kind==='project'?'project:legacy-route':kind+':legacy-route'}),{active:true});
    await select(await legacy.exportRepositoryRecoveryBundle(),'repository-recovery.json');
    const recovery=await waitFor(()=>document.querySelector('#complete-configuration-review[open]'));
    const recoveryReview=recovery.querySelector('#complete-configuration-review-summary')?.textContent
      .includes('Legacy recovery JSON: projects and saved schemas only');
    recovery.querySelector('#cancel-configuration-setup').click();
    const nativeCreate=URL.createObjectURL;let downloaded=false;
    URL.createObjectURL=function(blob){if(blob.type==='application/zip')downloaded=true;
      return nativeCreate.call(this,blob);};
    let exportCancellation=false,cancelStatus='',cancelVisible=false,afterClickStatus='',
      afterCancelStatus='',cancelDisabled=false,cancelCount=0;
    try{
      await waitFor(()=>!document.querySelector('#import-complete-configuration').disabled);
      document.querySelector('#export-complete-configuration').click();
      const cancel=document.querySelector('#cancel-complete-configuration-export');
      cancelDisabled=cancel.disabled;cancelCount=document.querySelectorAll('#cancel-complete-configuration-export').length;
      cancelVisible=!cancel.hidden;afterClickStatus=document.querySelector('#complete-configuration-status')?.textContent??'';
      cancel.click();
      afterCancelStatus=document.querySelector('#complete-configuration-status')?.textContent??'';
      for(let attempt=0;attempt<240&&!cancel.hidden;attempt+=1)await pause();
      cancelStatus=document.querySelector('#complete-configuration-status')?.textContent??'';
      exportCancellation=cancelVisible&&cancel.hidden&&!downloaded&&cancelStatus.includes('export cancelled');
    }finally{URL.createObjectURL=nativeCreate;}
    return{projectReview,schemaReview,recoveryReview,exportCancellation,cancelStatus,cancelVisible,
      afterClickStatus,afterCancelStatus,cancelDisabled,cancelCount,downloaded};
  })()`);
  assert.equal(result.exportCancellation,true,JSON.stringify(result));
  assert.deepEqual({projectReview:result.projectReview,schemaReview:result.schemaReview,
    recoveryReview:result.recoveryReview},{projectReview:true,schemaReview:true,recoveryReview:true},
    "configuration import routes existing files to the correct review controls");
}
