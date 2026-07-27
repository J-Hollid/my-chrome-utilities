export const authoring045Expression=`(async()=>{
  const pause=(ms=35)=>new Promise((resolve)=>setTimeout(resolve,ms));
  const waitFor=async(read,label)=>{
    for(let attempt=0;attempt<240;attempt+=1){
      const value=await read();
      if(value)return value;
      await pause();
    }
    throw new Error('authoring045 '+label);
  };
  const buttons=(root=document)=>[...(root?.querySelectorAll('button')??[])];
  const set=(control,value)=>{
    control.value=String(value);
    control.dispatchEvent(new Event('input',{bubbles:true}));
    control.dispatchEvent(new Event('change',{bubbles:true}));
  };
  const repository=await (await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
  const projectId=await repository.activeProjectId();
  const page=async()=>{
    const loaded=await repository.loadProject(projectId);
    return {loaded,record:loaded.state.project.collections.pages.find(({name})=>name==='Shipping')};
  };
  const openPage=async()=>{
    document.querySelector('#project-tree button[data-kind="pages"]').click();
    await pause();
    const route=await waitFor(
      ()=>[...document.querySelectorAll('#workspace-content .entity-row button')]
        .find(({textContent})=>textContent.trim().startsWith('Shipping')),
      'Shipping route',
    );
    route.click();
    const root=await waitFor(
      ()=>[...document.querySelectorAll('[aria-label="Effective schema at Shipping"]')]
        .find((candidate)=>candidate.isConnected&&!candidate.closest('[hidden]')),
      'Shipping workspace',
    );
    await pause(120);
    return root.isConnected?root:[...document.querySelectorAll('[aria-label="Effective schema at Shipping"]')]
      .find((candidate)=>candidate.isConnected&&!candidate.closest('[hidden]'));
  };
  const openDefinition=async()=>{
    const root=await openPage();
    const row=await waitFor(
      ()=>root?.querySelector('[data-effective-property-path="/lineOfCustomer"]'),
      'Shipping property',
    );
    row.querySelector('[aria-label^="Property actions"]').click();
    await pause();
    const menu=await waitFor(
      ()=>[...document.querySelectorAll(':modal [data-property-context-menu="true"]')]
        .find((candidate)=>!candidate.closest('[hidden]')),
      'property menu',
    );
    const control=buttons(menu).find(({textContent})=>textContent.trim()==='Definition');
    if(!control)throw new Error('authoring045 Definition action');
    control.click();
    return waitFor(
      ()=>[...document.querySelectorAll(':modal [data-focused-section="definition"]')]
        .find((candidate)=>!candidate.closest('[hidden]')),
      'Definition section',
    );
  };
  const confirm=async(section)=>{
    buttons(section.closest('[data-focused-property-editor="true"]'))
      .find(({textContent})=>textContent.trim()==='Review changes').click();
    const review=await waitFor(
      ()=>[...document.querySelectorAll(':modal [aria-label="Review changes"]')]
        .find((candidate)=>!candidate.closest('[hidden]')),
      'review',
    );
    buttons(review.closest('[data-focused-property-editor="true"]'))
      .find(({textContent})=>textContent.trim()==='Confirm changes').click();
    await pause();
  };
  for(let layer=0;layer<3&&document.querySelector(':modal');layer+=1){
    document.querySelector(':modal').dispatchEvent(new Event('cancel',{cancelable:true}));
    await pause();
  }
  const baseline=await page();
  const baselineSequence=baseline.loaded.draftSequence;
  const baselineLocal=JSON.stringify(baseline.record?.localSchemaContributions??[]);
  let definition=await openDefinition();
  set(definition.querySelector('[name="description"]'),'Shipping explicit facet reset');
  set(definition.querySelector('[name="ordinaryValue"]'),'retail, business, vip');
  await confirm(definition);
  const seeded=await waitFor(async()=>{
    const current=await page();
    const local=current.record?.localSchemaContributions?.find(({path})=>path==='/lineOfCustomer');
    return local?.documentation==='Shipping explicit facet reset'&&local.allowedValues?.join('|')==='retail|business|vip'
      ? current
      : undefined;
  },'seeded sparse facets');
  const beforeResetBytes={
    parent:JSON.stringify(seeded.loaded.state.project.collections.profiles),
    siblings:JSON.stringify(seeded.loaded.state.project.collections.pages.filter(({name})=>name!=='Shipping')),
    unrelated:JSON.stringify({
      events:seeded.loaded.state.project.collections.events,
      releases:seeded.loaded.state.project.releases,
    }),
  };
  definition=await openDefinition();
  const descriptionFacet=definition.querySelector('[data-definition-facet="description"]');
  const reset=buttons(descriptionFacet).find(({textContent})=>textContent.trim()==='Reset to parent');
  const targeted=reset?.getAttribute('aria-label')?.includes('Definition facet Description');
  if(!reset)throw new Error('authoring045 Description reset unavailable '+JSON.stringify({
    facets:[...definition.querySelectorAll('[data-definition-facet]')].map(({dataset,textContent})=>({
      facet:dataset.definitionFacet,
      text:textContent.trim(),
    })),
  }));
  reset.click();
  await pause();
  definition=[...document.querySelectorAll(':modal [data-focused-section="definition"]')]
    .find((candidate)=>!candidate.closest('[hidden]'));
  const allowedPreserved=definition.querySelector('[name="ordinaryValue"]')?.value==='retail, business, vip';
  await confirm(definition);
  let resetSaved;
  try{
    resetSaved=await waitFor(async()=>{
      const current=await page();
      const local=current.record?.localSchemaContributions?.find(({path})=>path==='/lineOfCustomer');
      return local&&!Object.hasOwn(local,'documentation')&&local.allowedValues?.join('|')==='retail|business|vip'
        ? current
        : undefined;
    },'Description-only reset');
  }catch(error){
    const current=await page();
    throw new Error(String(error)+' '+JSON.stringify({
      local:current.record?.localSchemaContributions?.find(({path})=>path==='/lineOfCustomer'),
      sequence:current.loaded.draftSequence,
      seededSequence:seeded.loaded.draftSequence,
    }));
  }
  const oneResetCommand=resetSaved.loaded.draftSequence===seeded.loaded.draftSequence+1;
  document.querySelector('#undo-project').click();
  const undone=await waitFor(async()=>{
    const current=await page();
    const local=current.record?.localSchemaContributions?.find(({path})=>path==='/lineOfCustomer');
    return local?.documentation==='Shipping explicit facet reset'&&local.allowedValues?.join('|')==='retail|business|vip'
      ? current
      : undefined;
  },'Undo Description reset');
  document.querySelector('#redo-project').click();
  const redone=await waitFor(async()=>{
    const current=await page();
    const local=current.record?.localSchemaContributions?.find(({path})=>path==='/lineOfCustomer');
    return local&&!Object.hasOwn(local,'documentation')&&local.allowedValues?.join('|')==='retail|business|vip'
      ? current
      : undefined;
  },'Redo Description reset');
  const immutable=
    JSON.stringify(redone.loaded.state.project.collections.profiles)===beforeResetBytes.parent
    &&JSON.stringify(redone.loaded.state.project.collections.pages.filter(({name})=>name!=='Shipping'))===beforeResetBytes.siblings
    &&JSON.stringify({
      events:redone.loaded.state.project.collections.events,
      releases:redone.loaded.state.project.releases,
    })===beforeResetBytes.unrelated;
  document.querySelector('#undo-project').click();
  await waitFor(async()=>{
    const current=await page();
    return current.record?.localSchemaContributions?.some(
      ({path,documentation})=>path==='/lineOfCustomer'&&documentation==='Shipping explicit facet reset',
    )?current:undefined;
  },'cleanup first Undo');
  document.querySelector('#undo-project').click();
  await waitFor(async()=>{
    const current=await page();
    return current.loaded.draftSequence>=baselineSequence
      &&JSON.stringify(current.record?.localSchemaContributions??[])===baselineLocal
      ? current
      : undefined;
  },'cleanup second Undo');
  return {
    resetPresent:Boolean(reset),
    targeted:Boolean(targeted),
    allowedPreserved,
    descriptionOnly:Boolean(resetSaved),
    oneResetCommand,
    undo:undone.record.localSchemaContributions.some(
      ({documentation})=>documentation==='Shipping explicit facet reset',
    ),
    redo:redone.record.localSchemaContributions.some(
      (local)=>!Object.hasOwn(local,'documentation')&&local.allowedValues?.join('|')==='retail|business|vip',
    ),
    immutable,
  };
})()`;

export const flowFacet003Expression=`(async()=>{
  const pause=(ms=35)=>new Promise((resolve)=>setTimeout(resolve,ms));
  const waitFor=async(read,label)=>{
    for(let attempt=0;attempt<240;attempt+=1){
      const value=await read();
      if(value)return value;
      await pause();
    }
    throw new Error('flow facet reset '+label);
  };
  const buttons=(root=document)=>[...(root?.querySelectorAll('button')??[])];
  for(let layer=0;layer<3&&document.querySelector(':modal');layer+=1){
    document.querySelector(':modal').dispatchEvent(new Event('cancel',{cancelable:true}));
    await pause();
  }
  const repository=await (await import('/data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
  const projectId=await repository.activeProjectId();
  const frameId=document.querySelector('[data-page-frame-id]')?.dataset.pageFrameId;
  const frameRecord=(loaded)=>Object.values(loaded.state.project.documentationFlowGraphs)
    .flatMap(({pageFrames})=>pageFrames??[])
    .find(({id})=>id===frameId);
  const before=await repository.loadProject(projectId);
  const beforeLocal=frameRecord(before)?.localSchemaContributions?.find(({path})=>path==='/shippingRoot');
  const workspace=[...document.querySelectorAll('.composed-schema-workspace')]
    .find((candidate)=>candidate.isConnected&&!candidate.closest('[hidden]'));
  const row=workspace?.querySelector('[data-flow-instance-effective-path="/shippingRoot"]');
  row?.querySelector('[aria-label^="Property actions"]')?.click();
  await pause();
  const menu=await waitFor(
    ()=>[...document.querySelectorAll(':modal [data-property-context-menu="true"]')]
      .find((candidate)=>!candidate.closest('[hidden]')),
    'property menu',
  );
  buttons(menu).find(({textContent})=>textContent.trim()==='Definition')?.click();
  const definition=await waitFor(
    ()=>[...document.querySelectorAll(':modal [data-focused-section="definition"]')]
      .find((candidate)=>!candidate.closest('[hidden]')),
    'Definition section',
  );
  const facet=definition.querySelector('[data-definition-facet="allowed-values"]');
  const reset=buttons(facet).find(({textContent})=>textContent.trim()==='Reset to parent');
  if(!reset)throw new Error('flow facet reset Allowed values action unavailable');
  reset.click();
  await pause();
  const focused=[...document.querySelectorAll(':modal [data-focused-property-editor="true"]')].at(-1);
  buttons(focused).find(({textContent})=>textContent.trim()==='Review changes')?.click();
  const review=await waitFor(
    ()=>[...document.querySelectorAll(':modal [aria-label="Review changes"]')].at(-1),
    'review',
  );
  const confirm=buttons(review.closest('[data-focused-property-editor="true"]'))
    .find(({textContent})=>textContent.trim()==='Confirm changes');
  confirm?.click();
  const saved=await waitFor(async()=>{
    const loaded=await repository.loadProject(projectId);
    const local=frameRecord(loaded)?.localSchemaContributions?.find(({path})=>path==='/shippingRoot');
    return local&&!Object.hasOwn(local,'allowedValues')&&local.documentation===beforeLocal?.documentation
      ? {loaded,local}
      : undefined;
  },'saved Allowed-only reset');
  return {
    reset:true,
    resetButton:Boolean(reset),
    resetConfirmed:Boolean(confirm),
    resetReview:Boolean(review),
    resetSave:Boolean(confirm),
    remaining:frameRecord(saved.loaded).localSchemaContributions,
  };
})()`;
