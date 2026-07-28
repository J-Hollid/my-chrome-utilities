export const authoringConceptRuntimeExpression=String.raw`(async()=>{
  const pause=(ms=45)=>new Promise((resolve)=>setTimeout(resolve,ms));
  const waitFor=async(read,label)=>{for(let attempt=0;attempt<300;attempt+=1){const value=await read();if(value)return value;await pause();}throw new Error('installed Concept runtime: '+label);};
  const buttons=(root=document)=>[...(root?.querySelectorAll('button')??[])];
  const set=(control,value)=>{if(!control)throw new Error('missing control for '+value);control.value=String(value);control.dispatchEvent(new Event('input',{bubbles:true}));control.dispatchEvent(new Event('change',{bubbles:true}));};
  const closeLayers=async()=>{for(let count=0;count<4&&document.querySelector(':modal');count+=1){document.querySelector(':modal').dispatchEvent(new Event('cancel',{cancelable:true}));await pause();}};
  const [{durableDraftCommand,openIndexedDbProjectRepository},canonical,project,portable,layered]=await Promise.all([
    import('/data-layer-durable-project-repository.js'),
    import('/data-layer-canonical-schema.js'),
    import('/data-layer-layered-schema-project.js'),
    import('/data-layer-specification-repository.js'),
    import('/data-layer-layered-schema.js'),
  ]);
  await closeLayers();
  const repository=await openIndexedDbProjectRepository(),projectId=await repository.activeProjectId(),beforeSeed=await repository.loadProject(projectId),seedState=structuredClone(beforeSeed.state),profile=seedState.project.collections.profiles.find(({name})=>name==='Sitewide'),cart=seedState.project.collections.pages.find(({name})=>name==='Cart');
  if(!profile?.canonicalSchema||!cart)throw new Error('Sitewide and Cart Concept prerequisites unavailable');
  const rows=canonical.canonicalTableRows(profile.canonicalSchema),products=rows.find(({path})=>path==='/products'),productName=rows.find(({path})=>path==='/products/*/name'),productId=rows.find(({path})=>path==='/products/*/id'),line=rows.find(({path})=>path==='/lineOfCustomer'),pageType=rows.find(({path})=>path==='/page_type'),revisionProbe=rows.find(({path})=>path==='/profileRevisionProbe');
  if(!products||!productName||!productId||!line||!pageType||!revisionProbe)throw new Error('recursive Concept fixtures unavailable');
  profile.canonicalSchema.nodes[products.id].concept=' ecommerce ';
  profile.canonicalSchema.nodes[line.id].concept='Page';
  delete profile.canonicalSchema.nodes[productName.id].concept;
  delete profile.canonicalSchema.nodes[productId.id].concept;
  profile.canonicalSchema.nodes[pageType.id].concept='Acquisition';
  profile.canonicalSchema.nodes[revisionProbe.id].concept=' PAGE ';
  cart.localSchemaContributions=(cart.localSchemaContributions??[]).filter(({path})=>path!=='/products');
  const seeded=await repository.saveDraft(durableDraftCommand(beforeSeed,seedState,{commandId:'authoring060:seed:'+crypto.randomUUID(),label:'Seed installed Concept workflow'}));
  if(seeded.status==='conflict')throw new Error('Concept seed conflicted');
  await pause(180);

  document.querySelector('#project-tree button[data-kind="profiles"]')?.click();
  const sitewideRoute=await waitFor(()=>buttons(document.querySelector('#workspace-content')).find(({textContent})=>textContent.trim().startsWith('Sitewide')),'Sitewide route');
  sitewideRoute.click();
  const canonicalHost=await waitFor(()=>document.querySelector('[data-project-entity-kind="profiles"] [aria-label="Builder canonical schema editor"]'),'Sitewide canonical contribution');
  const editor=()=>canonicalHost.isConnected?canonicalHost:document.querySelector('[data-project-entity-kind="profiles"] [aria-label="Builder canonical schema editor"]');
  const tableButton=await waitFor(()=>buttons(editor()).find(({textContent})=>textContent.trim()==='Table'),'canonical Table control');
  tableButton.click();
  const table=await waitFor(()=>editor().querySelector('table'),'canonical Table');
  const conceptControl=(path)=>table.querySelector('[aria-label="concept for '+CSS.escape(path)+'"]')??table.querySelector('[data-inline-schema-path="'+CSS.escape(path)+'"][data-inline-schema-facet="concept"]');
  const productsConcept=await waitFor(()=>conceptControl('/products'),'products Concept control');
  const datalist=table.querySelector('#'+CSS.escape(productsConcept.getAttribute('list'))),suggestions=[...datalist.querySelectorAll('option')].map(({value})=>value);
  const suggestionEvidence=suggestions.join('|')==='Acquisition|ecommerce|Page'&&new Set(suggestions.map((value)=>value.toLocaleLowerCase())).size===suggestions.length;
  const childNonInheritance=conceptControl('/products/*/name').value===''&&conceptControl('/products/*/id').value==='';
  const sort=editor().querySelector('[aria-label="Sort schema properties"]');set(sort,'concept');const sortedPaths=[...editor().querySelectorAll('[aria-label="Canonical property table"] tbody tr')].map((row)=>row.querySelector('[data-schema-table-cell="path"]')?.textContent.replace(' ·','').trim()).filter(Boolean),sortEvidence=sortedPaths.indexOf('page_type')<sortedPaths.indexOf('products')&&sortedPaths.indexOf('products')<sortedPaths.indexOf('lineOfCustomer')&&sortedPaths.indexOf('lineOfCustomer')<sortedPaths.indexOf('profileRevisionProbe')&&sortedPaths.indexOf('products[].id')<sortedPaths.indexOf('products[].name');

  let lineAction=editor().querySelector('[aria-label="Property actions for /lineOfCustomer"]');lineAction.click();
  let menu=await waitFor(()=>document.querySelector(':modal [data-property-context-menu="true"]'),'canonical property menu');
  buttons(menu).find(({textContent})=>textContent.trim()==='Definition').click();
  let focused=await waitFor(()=>document.querySelector(':modal [data-focused-property-editor="true"]'),'canonical focused Definition');
  const focusedSuggestions=[...focused.querySelectorAll('datalist option')].map(({value})=>value),focusedControl=focused.querySelector('[name="concept"]'),beforeFocused=await repository.loadProject(projectId);set(focusedControl,'Cancelled Concept');buttons(focused).find(({textContent})=>textContent.trim()==='Cancel').click();await pause();
  document.querySelector(':modal')?.dispatchEvent(new Event('cancel',{cancelable:true}));await pause();
  const cancelled=JSON.stringify((await repository.loadProject(projectId)).state.project)===JSON.stringify(beforeFocused.state.project);

  lineAction=editor().querySelector('[aria-label="Property actions for /lineOfCustomer"]');lineAction.click();menu=await waitFor(()=>document.querySelector(':modal [data-property-context-menu="true"]'),'reopened canonical menu');buttons(menu).find(({textContent})=>textContent.trim()==='Definition').click();focused=await waitFor(()=>document.querySelector(':modal [data-focused-property-editor="true"]'),'reopened canonical Definition');set(focused.querySelector('[name="concept"]'),'Behavior');buttons(focused).find(({textContent})=>textContent.trim()==='Review changes').click();const review=await waitFor(()=>document.querySelector('[aria-label="Review changes"]'),'canonical Concept review'),reviewed=review.textContent.includes('Edited concept'),confirm=await waitFor(()=>buttons(document).filter(({textContent})=>textContent.trim()==='Confirm changes').at(-1),'canonical Concept confirmation');confirm.click();
  const focusedSaved=await waitFor(async()=>{const loaded=await repository.loadProject(projectId),node=loaded.state.project.collections.profiles.find(({id})=>id===profile.id)?.canonicalSchema?.nodes[line.id];return node?.concept==='Behavior'?loaded:undefined;},'focused Concept persistence');

  document.querySelector('#project-tree button[data-kind="pages"]')?.click();
  const cartRoute=await waitFor(()=>buttons(document.querySelector('#workspace-content')).find(({textContent})=>textContent.trim().startsWith('Cart')),'Cart route');
  cartRoute.click();
  const workspace=await waitFor(()=>document.querySelector('[aria-label="Effective schema at Cart"]'),'Cart composed schema');
  const row=await waitFor(()=>workspace.querySelector('[data-effective-property-path="/products"]'),'Cart products row'),inline=row.querySelector('[data-inline-schema-facet="concept"]'),inherited=inline?.value==='ecommerce';
  const beforeInline=await repository.loadProject(projectId);inline.focus();inline.value='Checkout';inline.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
  const inlineSaved=await waitFor(async()=>{const loaded=await repository.loadProject(projectId),local=loaded.state.project.collections.pages.find(({id})=>id===cart.id)?.localSchemaContributions?.find(({path})=>path==='/products');return local?.concept==='Checkout'?{loaded,local}:undefined;},'inline sparse Concept override');
  const sparse=Object.keys(inlineSaved.local).sort().join('|')==='concept|path'&&inlineSaved.loaded.draftSequence===beforeInline.draftSequence+1;
  const reset=await waitFor(()=>document.querySelector('[aria-label="Effective schema at Cart"] [aria-label="Reset Concept to parent for /products"]'),'inline Concept reset');reset.click();
  const resetSaved=await waitFor(async()=>{const loaded=await repository.loadProject(projectId),local=loaded.state.project.collections.pages.find(({id})=>id===cart.id)?.localSchemaContributions?.find(({path})=>path==='/products');return !local?loaded:undefined;},'Concept reset persistence');await pause(180);const resetRendered=document.querySelector('[aria-label="Effective schema at Cart"] [data-effective-property-path="/products"] [data-inline-schema-facet="concept"]')?.value,resetEvidence=resetSaved.draftSequence===inlineSaved.loaded.draftSequence+1;

  const savedProfile=focusedSaved.state.project.collections.profiles.find(({id})=>id===profile.id).canonicalSchema,json=canonical.canonicalJsonSchemaDocument(savedProfile),roundTrip=canonical.canonicalSchemaFromJsonSchema({id:'schema:authoring063:roundtrip',contributorId:profile.id,contributorName:'Sitewide round trip',sourceIdentity:'authoring063',sourceRevision:1,document:json,idFactory:(kind)=>kind+':authoring063:'+crypto.randomUUID()}),roundRows=canonical.canonicalTableRows(roundTrip),roundProducts=roundRows.find(({path})=>path==='/products'),roundChild=roundRows.find(({path})=>path==='/products/*/name');
  const roundTripEvidence=json.properties.products['x-concept']==='ecommerce'&&json.properties.products.items.properties.name['x-concept']===undefined&&roundProducts?.node.concept==='ecommerce'&&roundChild?.node.concept===undefined;
  const constraints=canonical.canonicalConstraints(savedProfile),withoutConcept=constraints.map(({concept,...constraint})=>constraint),context={eventId:'event:authoring063',eventRole:'interaction'},compiled=layered.compileLayeredSchema([{id:profile.id,name:'Sitewide',scope:'Shared Profile',constraints}],context),plain=layered.compileLayeredSchema([{id:profile.id,name:'Sitewide',scope:'Shared Profile',constraints:withoutConcept}],context),shape=(value)=>JSON.stringify({properties:Object.fromEntries(Object.entries(value.properties).map(([path,item])=>[path,{type:item.type,presence:item.presence,allowedValues:item.allowedValues,patterns:item.patterns}])),conflicts:value.conflicts}),annotationOnly=shape(compiled)===shape(plain);
  const restored=portable.restoreCanonicalProjectState(portable.serializeCanonicalProjectState(resetSaved.state,resetSaved.draftSequence)),restoredProfile=restored.project.collections.profiles.find(({id})=>id===profile.id),portability=restoredProfile.canonicalSchema.nodes[line.id].concept==='Behavior'&&!restored.project.collections.pages.find(({id})=>id===cart.id).localSchemaContributions.some(({path})=>path==='/products');
  return{
    authoring060:Boolean(suggestionEvidence&&childNonInheritance&&sortEvidence&&productsConcept.getAttribute('role')==='combobox'),
    authoring061:Boolean(inherited&&sparse&&resetEvidence&&portability),
    authoring062:Boolean(cancelled&&reviewed&&focusedSuggestions.join('|')===suggestions.join('|')&&focusedSaved.draftSequence===beforeFocused.draftSequence+1),
    authoring063:Boolean(roundTripEvidence&&annotationOnly),
    diagnostic:{suggestions,sortedPaths,childNonInheritance,inherited,sparse,resetEvidence,resetRendered,cancelled,reviewed,roundTripEvidence,annotationOnly,portability},
  };
})()`;
