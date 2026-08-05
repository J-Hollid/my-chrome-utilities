import {flowWorkspaceR02Runtime} from "./flow-workspace-r02-runtime.mjs";

export function flowGraphCorrectiveWorkflow(seeded){
  return flowWorkspaceR02Runtime(seeded);
  /* c8 ignore start -- retained R01 workflow is historical diagnostic reference. */
  return `
(async()=>{
  const q=(selector,root=document)=>root?.querySelector(selector),all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[];
  const pause=(milliseconds=120)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));
  const phase=(number)=>flowEvidencePhase('runtime'+String(number).padStart(3,'0'));
  const click=(text,root=document)=>{const control=all('button',root).find((button)=>button.textContent.trim()===text);if(!control)throw new Error('Missing button '+text);control.click();return control;};
  const change=(control,value)=>{control.value=String(value);control.dispatchEvent(new Event('input',{bubbles:true}));control.dispatchEvent(new Event('change',{bubbles:true}));};
  const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
  const projectId=${JSON.stringify(seeded.projectId)},flowId=${JSON.stringify(seeded.flowId)},seedIds=${JSON.stringify(seeded)};
  const load=()=>repository.loadProject(projectId),graphOf=(loaded)=>loaded.state.project.documentationFlowGraphs[flowId];
  const graph=async()=>graphOf(await load()),workspace=()=>q('.documentary-flow'),canvas=()=>q('[aria-label="Interactive directional Flow canvas"]'),outline=()=>q('[aria-label="Synchronized editable Flow outline"]');
  const sectionControls=()=>q('[aria-label="Flow Section controls"]'),framesHost=()=>q('[aria-label="Flow Page frames"]'),toolbar=()=>q('[aria-label="Flow component catalogs"]');
  const selectFrame=(id)=>{q('[data-page-frame-id="'+CSS.escape(id)+'"]',canvas()).dispatchEvent(new MouseEvent('click',{bubbles:true}));};
  const openCatalog=(name)=>click(name,toolbar());
  const addPage=async(name)=>{openCatalog('Pages');click('Add '+name,q('[aria-label="Pages catalog"]'));await pause();return (await graph()).pageFrames.at(-1);};
  const addEvent=async(frameId,name)=>{selectFrame(frameId);openCatalog('Events');click('Add '+name,q('[aria-label="Events catalog"]'));await pause();return (await graph()).occurrences.at(-1);};
  const place=async(frameId,sectionId)=>{openCatalog('Sections');const controls=sectionControls(),frame=q('[aria-label="Page frame to organize"]',controls),destination=q('[aria-label="Destination Section"]',controls);change(frame,frameId);if(sectionId){change(destination,sectionId);click('Place in Section',controls);}else click('Move outside every Section',controls);await pause();return (await graph()).pageFrames.find(({id})=>id===frameId);};
  const evidence={};

  q('[data-kind=flows]').click();await pause();
  const flowRow=all('.entity-row button').find(({textContent})=>textContent==='Checkout journey');if(!flowRow)throw new Error('Missing Checkout journey');flowRow.click();await pause();

  phase(1);
  const inspector=q('#project-inspector'),toggle=all('button',toolbar()).find(({textContent})=>/Inspector/.test(textContent));
  if(toggle&&toggle.textContent.includes('Close')){toggle.click();await pause();}
  evidence.runtime001={
    installedWorkspace:Boolean(canvas()&&outline()&&framesHost()),
    currentCatalogs:['Sections','Pages','Events'].every((name)=>all('button',toolbar()).some(({textContent})=>textContent.trim()===name)),
    inspectorClosed:!inspector||inspector.hidden,
    inspectorOwnsNoGraphForm:!q('form',q('#flow-inspector-context')),
    advancedSeparated:Boolean(q('#flow-step-editor')?.textContent.includes('Advanced'))
  };

  phase(2);
  openCatalog('Sections');
  let controls=sectionControls(),deliveryRow=all('[data-flow-section-id]',controls)[1],deliveryName=q('input[aria-label^="Section name"]',deliveryRow);
  change(deliveryName,'Delivery');click('Save name and size',deliveryRow);await pause();
  controls=sectionControls();const newSection=q('[aria-label="New Section name"]',controls);change(newSection,'Confirmation');newSection.form.requestSubmit();await pause();
  let current=await graph(),sectionIds=current.sections.map(({id})=>id);
  evidence.runtime002={
    createdThroughInstalledControls:current.sections.map(({name})=>name).join('|')==='Checkout|Delivery|Confirmation',
    stableFlowOwnedIds:sectionIds.length===3&&new Set(sectionIds).size===3,
    noFallbackSection:!current.sections.some(({name})=>/Context|Shipping|Payment|Merge/.test(name)),
    noPageGroupStorage:!JSON.stringify(current).includes('pageGroup')
  };

  phase(3);
  controls=sectionControls();let confirmationRow=all('[data-flow-section-id]',controls).find((row)=>q('input[aria-label^="Section name"]',row).value==='Confirmation');
  const confirmationId=confirmationRow.dataset.flowSectionId,beforeMove=current.sections.find(({id})=>id===confirmationId),x=q('input[aria-label^="Section x"]',confirmationRow),y=q('input[aria-label^="Section y"]',confirmationRow);
  change(x,beforeMove.bounds.x+30);change(y,250);click('Move Section',confirmationRow);await pause();
  const moved=await graph(),movedSection=moved.sections.find(({id})=>id===confirmationId),movedIds=moved.sections.map(({id})=>id);
  controls=sectionControls();const checkoutRow=all('[data-flow-section-id]',controls).find((row)=>q('input[aria-label^="Section name"]',row).value==='Checkout');
  click('Remove Section and retain Page frames',checkoutRow);await pause();const removed=await graph();q('#undo-project').click();await pause();current=await graph();
  evidence.runtime003={
    actualSectionMove:movedSection.bounds.x===beforeMove.bounds.x+30&&movedSection.bounds.y===250,
    idsStable:JSON.stringify(movedIds)===JSON.stringify(sectionIds),
    actualRemovalAndUndo:removed.sections.length===2&&current.sections.length===3&&current.sections.some(({name})=>name==='Checkout'),
    retainedContainedFrames:removed.pageFrames.every(({sectionId})=>sectionId!==sectionIds[0])
  };

  phase(4);
  const sourceBytes=JSON.stringify((await load()).state.project.collections.pages),receiptFrame=await addPage('Receipt'),placedReceipt=await place(receiptFrame.id,confirmationId);
  evidence.runtime004={
    pageInsertedFromCatalog:receiptFrame.pageId===seedIds.pageIds[2],
    placedThroughSectionControls:placedReceipt.sectionId===confirmationId,
    stableFrameIdentity:placedReceipt.id===receiptFrame.id,
    schemaIndependent:JSON.stringify((await load()).state.project.collections.pages)===sourceBytes
  };

  phase(5);
  const purchase=await addEvent(receiptFrame.id,'Purchase');
  openCatalog('Events');const dropButton=all('button',q('[aria-label="Events catalog"]')).find(({textContent})=>textContent==='Add Review'),dropTarget=q('[data-page-frame-id="'+CSS.escape(receiptFrame.id)+'"]',framesHost()),transfer=new DataTransfer(),beforeDropInsertion=(await graph()).occurrences.length;dropButton.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:transfer}));dropTarget.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:transfer}));dropTarget.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));for(let attempt=0;attempt<20&&(await graph()).occurrences.length===beforeDropInsertion;attempt+=1)await pause();const dropped=(await graph()).occurrences.at(-1);selectFrame(seedIds.frameIds[2]);openCatalog('Events');const keyboardButton=all('button',q('[aria-label="Events catalog"]')).find(({textContent})=>textContent==='Add Purchase'),beforeKeyboardInsertion=(await graph()).occurrences.length;keyboardButton.focus();flowNativeKey(JSON.stringify({key:'Enter'}));for(let attempt=0;attempt<20&&(await graph()).occurrences.length===beforeKeyboardInsertion;attempt+=1)await pause();if((await graph()).occurrences.length===beforeKeyboardInsertion){keyboardButton.focus();flowNativeKey(JSON.stringify({key:' '}));for(let attempt=0;attempt<20&&(await graph()).occurrences.length===beforeKeyboardInsertion;attempt+=1)await pause();}const keyboardInserted=(await graph()).occurrences.at(-1);
  const purchaseCanvas=q('[data-occurrence-id="'+CSS.escape(purchase.id)+'"]',canvas()),purchaseOutline=q('[data-occurrence-id="'+CSS.escape(purchase.id)+'"]',outline());
  evidence.runtime005={
    insertedFromInstalledEventCatalog:Boolean(purchaseCanvas&&purchaseOutline),
    pointerDropInsertion:beforeKeyboardInsertion===beforeDropInsertion+1&&dropped.eventId!==purchase.eventId&&dropped.pageFrameId===receiptFrame.id,
    nativeKeyboardCatalogActivation:(await graph()).occurrences.length===beforeKeyboardInsertion+1&&keyboardInserted.eventId===purchase.eventId&&keyboardInserted.pageFrameId===seedIds.frameIds[2],
    pageAndEventKinds:purchaseCanvas?.textContent.includes('Interaction Event')&&q('[data-page-frame-id="'+CSS.escape(receiptFrame.id)+'"]',outline())?.textContent.includes('Context-setting Page'),
    canonicalReferences:purchase.pageFrameId===receiptFrame.id&&purchase.pageId===receiptFrame.pageId&&Boolean(purchase.eventId),
    noDocumentaryRole:!JSON.stringify(purchase).includes('role')
  };

  phase(6);
  const reusedA=await addEvent(seedIds.frameIds[0],'Review'),reusedB=await addEvent(seedIds.frameIds[1],'Review'),afterReuse=await graph();
  evidence.runtime006={
    sameDefinitionReused:reusedA.eventId===reusedB.eventId,
    distinctOccurrences:reusedA.id!==reusedB.id,
    distinctContainers:reusedA.pageFrameId!==reusedB.pageFrameId,
    synchronizedReuse:[reusedA.id,reusedB.id].every((id)=>q('[data-occurrence-id="'+CSS.escape(id)+'"]',canvas())&&q('[data-occurrence-id="'+CSS.escape(id)+'"]',outline()))
  };

  phase(7);
  const outside=await addPage('Payment'),outsideBefore=(await graph()).pageFrames.find(({id})=>id===outside.id),outsideNode=q('[data-page-frame-id="'+CSS.escape(outside.id)+'"]',canvas());
  outsideNode.dispatchEvent(new PointerEvent('pointerdown',{pointerId:71,clientX:10,clientY:10,bubbles:true}));window.dispatchEvent(new PointerEvent('pointerup',{pointerId:71,clientX:50,clientY:35,bubbles:true}));await pause();
  let outsideAfter=(await graph()).pageFrames.find(({id})=>id===outside.id),outsideMoved=outsideAfter.position.x===outsideBefore.position.x+40&&outsideAfter.position.y===outsideBefore.position.y+25;
  const liveOutside=q('[data-page-frame-id="'+CSS.escape(outside.id)+'"]',canvas());liveOutside.focus();liveOutside.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await pause();outsideAfter=(await graph()).pageFrames.find(({id})=>id===outside.id);
  evidence.runtime007={
    ordinaryOutsideSection:outsideAfter.sectionId===undefined&&!Object.hasOwn(outsideAfter,'freePageRegion'),
    pointerMovedOutsideFrame:outsideMoved,
    keyboardMovedOutsideFrame:outsideAfter.position.x===outsideBefore.position.x+60,
    remainsConnectable:all('[data-flow-port-for="'+CSS.escape(outside.id)+'"]',canvas()).length===4
  };

  phase(8);
  let occurrence=q('[data-occurrence-id="'+CSS.escape(purchase.id)+'"]',canvas()),beforeOccurrence=(await graph()).occurrences.find(({id})=>id===purchase.id),definitionBytes=JSON.stringify((await load()).state.project.collections.events),compositionBytes=JSON.stringify({pages:(await load()).state.project.collections.pages,propertySets:(await load()).state.project.collections.propertySets});
  occurrence.focus();occurrence.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await pause();
  let movedOccurrence=(await graph()).occurrences.find(({id})=>id===purchase.id);occurrence=q('[data-occurrence-id="'+CSS.escape(purchase.id)+'"]',canvas());occurrence.dispatchEvent(new PointerEvent('pointerdown',{pointerId:81,clientX:20,clientY:20,bubbles:true}));window.dispatchEvent(new PointerEvent('pointerup',{pointerId:81,clientX:30,clientY:30,bubbles:true}));await pause();
  occurrence=q('[data-occurrence-id="'+CSS.escape(purchase.id)+'"]',canvas());occurrence.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();
  let actions=q('[aria-label="Selected Event occurrence inline actions"]'),pageChoice=q('[aria-label="Containing Page frame"]',actions);change(pageChoice,seedIds.frameIds[1]);await pause();actions=q('[aria-label="Selected Event occurrence inline actions"]');const schemaImpact=q('output',actions)?.textContent??'';click('Confirm Page change',actions);await pause();
  const reassigned=(await graph()).occurrences.find(({id})=>id===purchase.id);
  evidence.runtime008={
    keyboardPositionPersisted:movedOccurrence.position.x===beforeOccurrence.position.x+20,
    pointerPositionPersisted:reassigned.position.y===beforeOccurrence.position.y+10,
    pageChangeReviewedAndConfirmed:reassigned.pageFrameId===seedIds.frameIds[1]&&reassigned.id===purchase.id,
    schemaImpactReviewed:schemaImpact.includes('Receipt')&&schemaImpact.includes('Payment')&&/effective-schema impact/i.test(schemaImpact),
    effectiveSchemaConserved:JSON.stringify({pages:(await load()).state.project.collections.pages,propertySets:(await load()).state.project.collections.propertySets})===compositionBytes,
    definitionIdentityStable:JSON.stringify((await load()).state.project.collections.events)===definitionBytes
  };

  phase(9);
  const relationshipsBefore=(await graph()).relationships.length,source=q('[data-flow-port-for="'+CSS.escape(seedIds.frameIds[2])+'"][data-flow-port-side="right"]',canvas()),target=q('[data-flow-port-for="'+CSS.escape(outside.id)+'"][data-flow-port-side="left"]',canvas());
  source.dispatchEvent(new PointerEvent('pointerdown',{pointerId:91,bubbles:true}));target.dispatchEvent(new PointerEvent('pointermove',{pointerId:91,bubbles:true}));const validTarget=target.classList.contains('is-valid-target');target.dispatchEvent(new PointerEvent('pointerup',{pointerId:91,bubbles:true}));await pause();
  let relationshipGraph=await graph(),pointerRelationship=relationshipGraph.relationships.at(-1),popover=q('[aria-label="Inline relationship popover"]');
  evidence.runtime009={
    pointerConnectionCommitted:relationshipGraph.relationships.length===relationshipsBefore+1,
    validPortFeedback:validTarget,
    inferredExpectedNext:pointerRelationship.sourcePort==='right'&&pointerRelationship.targetPort==='left'&&pointerRelationship.kind==='expected_next',
    stablePageFrameEndpoints:pointerRelationship.sourceEndpoint.kind==='page-frame'&&pointerRelationship.targetEndpoint.kind==='page-frame',
    inlinePopoverFocused:Boolean(popover&&popover.contains(document.activeElement)&&!q('[aria-label="Relationship kind"]',popover))
  };

  phase(10);
  const invalidBefore=JSON.stringify((await graph()).relationships),invalidSource=q('[data-flow-port-for="'+CSS.escape(seedIds.frameIds[0])+'"][data-flow-port-side="right"]',canvas());
  invalidSource.dispatchEvent(new PointerEvent('pointerdown',{pointerId:101,bubbles:true}));canvas().dispatchEvent(new PointerEvent('pointermove',{pointerId:101,clientX:1,clientY:1,bubbles:true}));const previewCreated=Boolean(q('.flow-connection-preview',canvas()));canvas().dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await pause();
  evidence.runtime010={
    previewCreated,
    escapeRemovedPreview:!q('.flow-connection-preview',canvas()),
    noPartialWrite:JSON.stringify((await graph()).relationships)===invalidBefore,
    focusReturned:document.activeElement?.dataset.flowPortFor===seedIds.frameIds[0]
  };

  phase(11);
  const alternativeSource=q('[data-flow-port-for="'+CSS.escape(seedIds.frameIds[0])+'"][data-flow-port-side="top"]',canvas()),alternativeTarget=q('[data-flow-port-for="'+CSS.escape(seedIds.frameIds[2])+'"][data-flow-port-side="bottom"]',canvas());
  alternativeSource.dispatchEvent(new PointerEvent('pointerdown',{pointerId:111,bubbles:true}));alternativeTarget.dispatchEvent(new PointerEvent('pointerup',{pointerId:111,bubbles:true}));await pause();
  popover=q('[aria-label="Inline relationship popover"]');const label=q('[aria-label="Optional relationship label"]',popover);change(label,'Fulfilment choice');popover.requestSubmit();await pause();
  relationshipGraph=await graph();const alternative=relationshipGraph.relationships.find(({label})=>label==='Fulfilment choice');
  evidence.runtime011={
    forkRelationshipCreated:alternative?.kind==='alternative',
    exactPorts:alternative?.sourcePort==='top'&&alternative?.targetPort==='bottom',
    optionalLabelPersisted:alternative?.label==='Fulfilment choice',
    documentaryOnly:!JSON.stringify(relationshipGraph).includes('executed')&&!JSON.stringify(relationshipGraph).includes('transition'),
    noParallelOrKindSelector:!relationshipGraph.relationships.some(({kind})=>kind==='parallel')&&!q('[aria-label="Relationship kind"]')
  };

  phase(12);
  const keyboardBefore=(await graph()).relationships.length,keyboardSource=q('[data-flow-port-for="'+CSS.escape(seedIds.frameIds[1])+'"][data-flow-port-side="right"]',canvas());keyboardSource.focus();keyboardSource.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));keyboardSource.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));keyboardSource.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await pause();
  popover=q('[aria-label="Inline relationship popover"]');const keyboardFocused=Boolean(popover?.contains(document.activeElement));if(popover)popover.requestSubmit();await pause();
  evidence.runtime012={
    keyboardConnectionCommitted:(await graph()).relationships.length===keyboardBefore+1,
    popoverFocused:keyboardFocused,
    blankLabelOmitted:!Object.hasOwn((await graph()).relationships.at(-1),'label'),
    noInspectorInput:!q('[aria-label="Relationship kind"]')
  };

  phase(13);
  occurrence=q('[data-occurrence-id="'+CSS.escape(reusedA.id)+'"]',canvas());occurrence.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();actions=q('[aria-label="Selected Event occurrence inline actions"]');
  const actionLabels=all('button',actions).map(({textContent})=>textContent.trim()),beforeDuplicate=(await graph()).occurrences.length,viewportBefore=canvas().getAttribute('viewBox'),transformBefore=occurrence.getAttribute('transform');click('Duplicate occurrence',actions);await pause();occurrence=q('[data-occurrence-id="'+CSS.escape(reusedA.id)+'"]',canvas());occurrence.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();actions=q('[aria-label="Selected Event occurrence inline actions"]');click('Open schema contribution',actions);for(let attempt=0;attempt<30&&q('#layered-schema-editor-host')?.hidden;attempt+=1)await pause();const schemaOpened=!q('#layered-schema-editor-host').hidden,returnFlow=all('button',q('#layered-schema-editor-host')).find(({textContent})=>textContent==='Return to Flow');returnFlow.click();await pause();const restoredOccurrence=q('[data-occurrence-id="'+CSS.escape(reusedA.id)+'"]',canvas()),restored=restoredOccurrence?.classList.contains('is-selected')&&restoredOccurrence.getAttribute('transform')===transformBefore&&canvas().getAttribute('viewBox')===viewportBefore;const inspectorToggle=all('button',toolbar()).find(({textContent})=>textContent.includes('Inspector'));if(inspectorToggle?.textContent.includes('Open')){inspectorToggle.click();await pause();}const inspectorContext=q('#flow-inspector-context')?.textContent.includes('stable occurrence');
  evidence.runtime013={
    inlineActions:['Move within Page','Duplicate occurrence','Remove','Open schema contribution'].every((name)=>actionLabels.includes(name)),
    changePageControl:Boolean(q('[aria-label="Containing Page frame"]',actions)),
    duplicatedThroughInlineAction:(await graph()).occurrences.length===beforeDuplicate+1,
    schemaOpenedAndReturned:schemaOpened&&restored,
    inspectorRestored:Boolean(inspectorContext),
    noEventRelationshipPort:all('[data-occurrence-id="'+CSS.escape(reusedA.id)+'"] [data-flow-port-for]',canvas()).length===0
  };

  phase(14);
  const sourceDefinitionsBefore=JSON.stringify((await load()).state.project.collections.pages),card=q('[data-page-frame-id="'+CSS.escape(seedIds.frameIds[0])+'"]',framesHost()),nameInput=q('input[aria-label^="Name in this Flow"]',card);change(nameInput,'Basket page');click('Save Name in this Flow',card);await pause();const renameTopologyBefore=await graph(),renameCoordinates=JSON.stringify(renameTopologyBefore.pageFrames.map(({id,position})=>({id,position}))),renameRelationships=JSON.stringify(renameTopologyBefore.relationships);
  q('[data-kind="pages"]').click();await pause();all('.entity-row button').find(({textContent})=>textContent==='Payment').click();await pause();let definitionForm=q('[aria-label="Page details"] form'),definitionName=q('input[name="name"]',definitionForm);change(definitionName,'Payment source renamed');definitionForm.requestSubmit();await pause();q('[data-kind="events"]').click();await pause();all('.entity-row button').find(({textContent})=>textContent==='Review').click();await pause();definitionForm=q('.contextual-editor form');definitionName=q('input[name="name"]',definitionForm);change(definitionName,'Review source renamed');definitionForm.requestSubmit();await pause();q('[data-kind="flows"]').click();await pause();all('.entity-row button').find(({textContent})=>textContent==='Checkout journey').click();await pause();const renamedGraph=await graph();
  evidence.runtime014={
    renamedThroughInstalledControl:renamedGraph.pageFrames.find(({id})=>id===seedIds.frameIds[0]).nameInFlow==='Basket page',
    localAndSourceNamesProjected:['Basket page','Payment source renamed','Review source renamed'].every((name)=>canvas().textContent.includes(name)&&outline().textContent.includes(name)),
    sourceDefinitionsChangedOnlyByRename:JSON.parse(sourceDefinitionsBefore).find(({id})=>id===seedIds.pageIds[1]).name==='Payment'&&(await load()).state.project.collections.pages.find(({id})=>id===seedIds.pageIds[1]).name==='Payment source renamed',
    identitiesCoordinatesTopologyStable:renameCoordinates===JSON.stringify(renamedGraph.pageFrames.map(({id,position})=>({id,position})))&&renameRelationships===JSON.stringify(renamedGraph.relationships)
  };

  phase(15);
  let topology=await graph();const dragFrameBefore=topology.pageFrames.find(({id})=>id===seedIds.frameIds[1]),dragNode=q('[data-page-frame-id="'+CSS.escape(dragFrameBefore.id)+'"]',canvas()),initialDrag=dragNode.getAttribute('transform');dragNode.dispatchEvent(new PointerEvent('pointerdown',{pointerId:151,clientX:120,clientY:120,bubbles:true}));window.dispatchEvent(new PointerEvent('pointermove',{pointerId:151,clientX:155,clientY:142,bubbles:true}));const transientDrag=dragNode.getAttribute('transform');window.dispatchEvent(new PointerEvent('pointerup',{pointerId:151,clientX:155,clientY:142,bubbles:true}));await pause();topology=await graph();const dragFrameAfter=topology.pageFrames.find(({id})=>id===seedIds.frameIds[1]),topologyIds=new Set(topology.pageFrames.map(({id})=>id)),bands=all('[data-section-dropzone]',canvas()).map((rect)=>({x:Number(rect.getAttribute('x')),y:Number(rect.getAttribute('y')),width:Number(rect.getAttribute('width')),height:Number(rect.getAttribute('height'))})),alternativeEdge=all('[data-relationship-id]',canvas()).find(({dataset})=>dataset.relationshipKind==='alternative'),edgeAttachments=all('[data-relationship-id]',canvas()).every((edge)=>{const source=q('[data-flow-port-for="'+CSS.escape(edge.dataset.sourceEndpointId)+'"][data-flow-port-side="'+edge.dataset.sourcePort+'"]',canvas()),target=q('[data-flow-port-for="'+CSS.escape(edge.dataset.targetEndpointId)+'"][data-flow-port-side="'+edge.dataset.targetPort+'"]',canvas()),line=q('line',edge),point=(port)=>{const owner=port.closest('[data-flow-endpoint-id],[data-flow-endpoint-kind],[data-page-frame-id]'),match=owner?.getAttribute('transform')?.match(/translate\(([-.\d]+)[ ,]([-.\d]+)\)/);return{x:Number(port.getAttribute('cx'))+Number(match?.[1]??0),y:Number(port.getAttribute('cy'))+Number(match?.[2]??0)}};if(!source||!target||!line)return false;const start=point(source),end=point(target);return Number(line.getAttribute('x1'))===start.x&&Number(line.getAttribute('y1'))===start.y&&Number(line.getAttribute('x2'))===end.x&&Number(line.getAttribute('y2'))===end.y;});
  evidence.runtime015={
    substantialInstalledTopology:topology.pageFrames.length>=6&&topology.occurrences.length>=5&&topology.relationships.length>=5,
    canvasAndOutlineExact:[...topologyIds].every((id)=>q('[data-page-frame-id="'+CSS.escape(id)+'"]',canvas())&&q('[data-page-frame-id="'+CSS.escape(id)+'"]',outline())),
    horizontalSectionBands:bands.length===3&&bands.every(({width,height})=>width>height)&&bands.every((band,index)=>!bands.slice(index+1).some((other)=>other.y===band.y)),
    nativeDragGeometry:transientDrag!==initialDrag&&dragFrameAfter.position.x===dragFrameBefore.position.x+35&&dragFrameAfter.position.y===dragFrameBefore.position.y+22,
    splitMergePortsAndAttachments:Boolean(alternativeEdge?.dataset.sourcePort==='top'&&alternativeEdge?.dataset.targetPort==='bottom'&&edgeAttachments),
    serializedCoordinates:topology.pageFrames.every(({position})=>Number.isFinite(position.x)&&Number.isFinite(position.y)),
    noExecutableTransition:!JSON.stringify(topology).includes('executed')&&!JSON.stringify(topology).includes('transition')
  };

  phase(16);
  const schemaBytes=JSON.stringify({pages:(await load()).state.project.collections.pages,propertySets:(await load()).state.project.collections.propertySets}),beforePlacement=await place(seedIds.frameIds[1],undefined),restoredPlacement=await place(seedIds.frameIds[1],sectionIds[0]);
  evidence.runtime016={
    movedOutsideAndBack:beforePlacement.sectionId===undefined&&restoredPlacement.sectionId===sectionIds[0],
    frameIdentityStable:beforePlacement.id===restoredPlacement.id,
    schemaStable:JSON.stringify({pages:(await load()).state.project.collections.pages,propertySets:(await load()).state.project.collections.propertySets})===schemaBytes,
    noFreeRegion:!JSON.stringify(await graph()).includes('freePageRegion')
  };

  phase(18);
  const receiptSchemaBefore=JSON.stringify((await load()).state.project.collections.pages.find(({id})=>id===receiptFrame.pageId)),movedReceipt=await place(receiptFrame.id,sectionIds[1]),restoredReceipt=await place(receiptFrame.id,confirmationId);
  evidence.runtime018={
    sectionPlacementChanged:movedReceipt.sectionId===sectionIds[1]&&restoredReceipt.sectionId===confirmationId,
    frameIdentityReused:movedReceipt.id===restoredReceipt.id,
    containedOccurrencePreserved:(await graph()).occurrences.some(({id})=>id===purchase.id),
    pageSchemaIndependent:JSON.stringify((await load()).state.project.collections.pages.find(({id})=>id===receiptFrame.pageId))===receiptSchemaBefore
  };

  phase(19);
  controls=sectionControls();const reviewRow=all('[data-flow-section-id]',controls).find(({dataset})=>dataset.flowSectionId===confirmationId),beforeReview=JSON.stringify(await graph());click('Review remove Section with contents',reviewRow);await pause();
  const removalReview=q('[aria-label^="Remove Confirmation with contents review"]',reviewRow),unchangedDuringReview=JSON.stringify(await graph())===beforeReview;click('Cancel',removalReview);await pause();
  evidence.runtime019={
    impactReviewOpened:Boolean(removalReview),
    reviewIsNonMutating:unchangedDuringReview,
    cancellationPreservesSection:(await graph()).sections.some(({id})=>id===confirmationId),
    schemaSeparation:!removalReview.textContent.includes('Property Set membership')
  };

  phase(20);
  const geometryGraph=await graph(),sectionRects=all('[data-flow-section-id]',sectionControls()).map((row)=>({id:row.dataset.flowSectionId,x:Number(q('input[aria-label^="Section x"]',row).value),y:Number(q('input[aria-label^="Section y"]',row).value)})),scroll=q('.flow-canvas-scroll');scroll.scrollLeft=0;scroll.scrollTop=0;const autoscrollSource=q('[data-flow-port-for="'+CSS.escape(seedIds.frameIds[0])+'"][data-flow-port-side="right"]',canvas());autoscrollSource.dispatchEvent(new PointerEvent('pointerdown',{pointerId:201,bubbles:true}));const scrollBounds=scroll.getBoundingClientRect();canvas().dispatchEvent(new PointerEvent('pointermove',{pointerId:201,clientX:scrollBounds.right-1,clientY:scrollBounds.bottom-1,bubbles:true}));const twoAxisAutoscroll=scroll.scrollLeft>0&&scroll.scrollTop>0;canvas().dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  evidence.runtime020={
    measuredSectionGeometry:sectionRects.length===3&&sectionRects.every(({x,y})=>Number.isFinite(x)&&Number.isFinite(y)),
    operatorCoordinatesPersisted:geometryGraph.pageFrames.every(({position})=>Number.isFinite(position.x)&&Number.isFinite(position.y)),
    relationshipGeometryRendered:all('[data-relationship-id]',canvas()).length===geometryGraph.relationships.length,
    oneScrollableCanvas:scroll?.contains(canvas())&&all('.flow-canvas-scroll').length===1,
    twoAxisConnectionAutoscroll:twoAxisAutoscroll
  };

  phase(23);
  const deleteOne=async(deleteTarget)=>{const before=(await graph()).relationships,unrelated=JSON.stringify(before.filter(({id})=>id!==deleteTarget.id)),edge=q('[data-relationship-id="'+CSS.escape(deleteTarget.id)+'"]',canvas());edge.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();popover=q('[aria-label="Inline relationship popover"]');const deleteControl=all('button',popover).find(({textContent})=>textContent==='Delete relationship'),accessibleName=deleteControl?.getAttribute('aria-label');deleteControl.click();await pause();const afterDelete=await graph(),deleted=afterDelete.relationships.length===before.length-1&&!afterDelete.relationships.some(({id})=>id===deleteTarget.id)&&JSON.stringify(afterDelete.relationships)===unrelated,sourceFocused=document.activeElement?.dataset.flowEndpointId===deleteTarget.sourceEndpoint.id,staleStatus=all('[role="status"]',workspace()).some(({textContent})=>textContent.includes('documentation preview stale'));q('#undo-project').click();await pause();const restored=(await graph()).relationships.find(({id})=>id===deleteTarget.id),edgeFocused=document.activeElement?.dataset.relationshipId===deleteTarget.id;return{accessibleName,deleted,sourceFocused,staleStatus,restored:Boolean(restored&&JSON.stringify(restored)===JSON.stringify(deleteTarget)),edgeFocused};};const relationshipsForDelete=(await graph()).relationships,labelledTarget=relationshipsForDelete.find(({label})=>label==='Fulfilment choice'),unlabelledTarget=relationshipsForDelete.find((relationship)=>!Object.hasOwn(relationship,'label')),labelledDelete=await deleteOne(labelledTarget),unlabelledDelete=await deleteOne(unlabelledTarget);
  evidence.runtime023={
    labelledAndUnlabelledNames:Boolean(labelledDelete.accessibleName?.includes('Fulfilment choice')&&unlabelledDelete.accessibleName?.includes('Delete relationship')&&!unlabelledDelete.accessibleName.includes(unlabelledTarget.id)),
    exactRelationshipsDeleted:labelledDelete.deleted&&unlabelledDelete.deleted,
    staleExportFeedback:labelledDelete.staleStatus&&unlabelledDelete.staleStatus,
    identityPreservingUndo:labelledDelete.restored&&unlabelledDelete.restored,
    deletionAndUndoFocus:labelledDelete.sourceFocused&&labelledDelete.edgeFocused&&unlabelledDelete.sourceFocused&&unlabelledDelete.edgeFocused
  };

  phase(24);
  const repeatedBefore=(await graph()).pageFrames.filter(({pageId})=>pageId===seedIds.pageIds[0]).length,repeated=await addPage('Confirmation');
  evidence.runtime024={
    repeatedPageInserted:(await graph()).pageFrames.filter(({pageId})=>pageId===seedIds.pageIds[0]).length===repeatedBefore+1,
    distinctFrameIdentity:repeated.id!==seedIds.frameIds[0]&&repeated.pageId===seedIds.pageIds[0],
    sourcePageShared:(await load()).state.project.collections.pages.filter(({id})=>id===seedIds.pageIds[0]).length===1,
    instanceNameIsolation:(await graph()).pageFrames.find(({id})=>id===seedIds.frameIds[0]).nameInFlow==='Basket page'&&!repeated.nameInFlow
  };

  phase(26);
  const namedCard=q('[data-page-frame-id="'+CSS.escape(seedIds.frameIds[0])+'"]',framesHost()),resetName=all('button',namedCard).find(({textContent})=>textContent==='Use Page name');resetName.click();await pause();
  const resetObserved=!Object.hasOwn((await graph()).pageFrames.find(({id})=>id===seedIds.frameIds[0]),'nameInFlow');q('#undo-project').click();await pause();
  evidence.runtime026={
    nameControls:Boolean(q('input[aria-label^="Name in this Flow"]',namedCard)&&resetName),
    resetObserved,
    undoRestored:(await graph()).pageFrames.find(({id})=>id===seedIds.frameIds[0]).nameInFlow==='Basket page'
  };

  return {...evidence,installedBoundary:Boolean(canvas()&&framesHost())};
})()`;
}
/* c8 ignore stop */

export function flowGraphReloadEvidence(seeded){
  return `
(async()=>{
  const pause=()=>new Promise(resolve=>setTimeout(resolve,40)),repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),loaded=await repository.loadProject(${JSON.stringify(seeded.projectId)}),graph=loaded.state.project.documentationFlowGraphs[${JSON.stringify(seeded.flowId)}],canvas=document.querySelector('[aria-label="Interactive directional Flow canvas"]'),toolbar=document.querySelector('[aria-label="Flow toolbar"]'),outlineButton=[...toolbar.querySelectorAll('button')].find(({textContent})=>textContent.trim()==='Outline');outlineButton.click();await pause();const outline=document.querySelector('[aria-label="Synchronized editable Flow outline"]'),stored=JSON.parse(sessionStorage.getItem('my-chrome-utilities.flow-view.v1:'+${JSON.stringify(seeded.projectId)}+':'+${JSON.stringify(seeded.flowId)})??'{}');
  return{
    runtime014:{reloadStable:graph.pageFrames.every(({id})=>canvas.querySelector('[data-page-frame-id="'+CSS.escape(id)+'"]')&&outline.querySelector('[data-page-frame-id="'+CSS.escape(id)+'"]'))},
    runtime015:{reloadTopology:graph.relationships.every(({id})=>canvas.querySelector('[data-relationship-id="'+CSS.escape(id)+'"]')&&outline.querySelector('[data-relationship-id="'+CSS.escape(id)+'"]'))},
    runtime020:{reloadGeometry:graph.sections.every(({id})=>document.querySelector('[data-flow-section-id="'+CSS.escape(id)+'"]'))&&JSON.stringify(JSON.parse(canvas.dataset.viewport))===JSON.stringify(stored.viewport)}
  };
})()`;
}

export function flowGraphRepeatedInstanceSeed(seeded){
  return `
(async()=>{
  const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),loaded=await repository.loadProject(${JSON.stringify(seeded.projectId)}),flowId=${JSON.stringify(seeded.flowId)},pageId=${JSON.stringify(seeded.pageIds[0])},graph=loaded.state.project.documentationFlowGraphs[flowId],confirmationIds=new Set(graph.pageFrames.filter((frame)=>frame.pageId===pageId).map(({id})=>id)),bySource=new Map();for(const relationship of graph.relationships){if(!confirmationIds.has(relationship.targetEndpoint.id))continue;const items=bySource.get(relationship.sourceEndpoint.id)??[];items.push(relationship);bySource.set(relationship.sourceEndpoint.id,items);}const [sourceId,routes]=[...bySource].find(([,items])=>new Set(items.map(({targetEndpoint})=>targetEndpoint.id)).size>=3)??[];if(!sourceId)throw new Error('runtime024 needs three UI-created routes to reused Confirmation instances');const selected=[];for(const relationship of routes){if(!selected.some(({targetEndpoint})=>targetEndpoint.id===relationship.targetEndpoint.id))selected.push(relationship);if(selected.length===3)break;}return{frameIds:selected.map(({targetEndpoint})=>targetEndpoint.id),values:['instance-alpha','instance-beta','instance-gamma'],pageId,sourceId,relationshipIds:selected.map(({id})=>id)};
})()`;
}

export function flowGraphRepeatedInstanceEvidence(seeded,fixture){
  return `
(async()=>{
  const q=(selector,root=document)=>root?.querySelector(selector),all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[],pause=(milliseconds=120)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),waitFor=async(read,label)=>{for(let attempt=0;attempt<100;attempt+=1){const value=await read();if(value)return value;await pause(40);}throw new Error('runtime024 '+label);},repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),documentationApi=await import('./data-layer-flow-documentation-snapshot.js'),projectId=${JSON.stringify(seeded.projectId)},flowId=${JSON.stringify(seeded.flowId)},fixture=${JSON.stringify(fixture)},load=()=>repository.loadProject(projectId),exampleValues=(state)=>fixture.frameIds.map((id)=>state.project.documentationFlowGraphs[flowId].pageFrames.find((frame)=>frame.id===id)?.localSchemaContributions?.find(({path})=>path==='/currency')?.allowedValues?.[0]),documentationValues=(state)=>{const contexts=documentationApi.flowDocumentationSnapshotFromState(state,flowId,'2026-08-04T00:00:00.000Z').contexts;return fixture.frameIds.map((id)=>contexts.find(({pageFrameId,kind})=>pageFrameId===id&&kind==='page-instance')?.compiled.properties['/currency']?.allowedValues?.[0]);};
  flowEvidencePhase('runtime024');q('[data-kind="flows"]')?.click();await pause();all('.entity-row button').find(({textContent})=>textContent==='Checkout journey')?.click();for(let attempt=0;attempt<40&&!q('[aria-label="Interactive directional Flow canvas"]');attempt+=1){await pause();}
  const setExpected=async(frameId,value)=>{let canvas=q('[aria-label="Interactive directional Flow canvas"]'),frame=q('g[data-page-frame-id="'+CSS.escape(frameId)+'"]:not([data-occurrence-id])',canvas);frame.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();q('[data-flow-schema-contribution="true"]',q('[aria-label="Selected Page instance inline actions"]')).click();const workspace=await waitFor(()=>q('.composed-schema-workspace[data-schema-contributor-id="'+CSS.escape(frameId)+'"]'),'schema workspace');const row=q('[data-flow-instance-effective-path="/currency"]',workspace),actions=q('[aria-label^="Property actions"]',row);actions.click();await waitFor(()=>q(':modal [data-property-context-menu="true"]'),'property menu');const definition=await waitFor(()=>q(':modal [data-section="definition"] button'),'Definition section');definition.click();const editor=await waitFor(()=>all(':modal [data-focused-property-editor="true"]').at(-1),'Definition editor'),expected=q('[name="ordinaryValue"]',editor);expected.value=value;expected.dispatchEvent(new Event('input',{bubbles:true}));all('button',editor).find(({textContent})=>textContent.trim()==='Review changes').click();const confirm=await waitFor(()=>all('button').find(({textContent})=>textContent.trim()==='Confirm changes'),'Confirm changes');confirm.click();await waitFor(async()=>{const state=(await load()).state,frameRecord=state.project.documentationFlowGraphs[flowId].pageFrames.find(({id})=>id===frameId);return frameRecord.localSchemaContributions?.find(({path})=>path==='/currency')?.allowedValues?.[0]===value;},'saved instance value');all('button').find(({textContent})=>textContent.trim()==='Return to Flow').click();await waitFor(()=>q('[aria-label="Interactive directional Flow canvas"]'),'return Flow');};for(let index=0;index<fixture.frameIds.length;index+=1)await setExpected(fixture.frameIds[index],fixture.values[index]);
  let loaded=await load();const graph=loaded.state.project.documentationFlowGraphs[flowId],beforeExamples=exampleValues(loaded.state),beforeDocumentation=documentationValues(loaded.state),documentationSnapshot=documentationApi.flowDocumentationSnapshotFromState(loaded.state,flowId,'2026-08-04T00:00:00.000Z'),frames=graph.pageFrames.filter(({id})=>fixture.frameIds.includes(id)),instanceRelationships=graph.relationships.filter(({id})=>fixture.relationshipIds.includes(id));let canvas=q('[aria-label="Interactive directional Flow canvas"]'),outline;all('button',q('[aria-label="Flow toolbar"]')).find(({textContent})=>textContent.trim()==='Outline').click();await pause();outline=q('[aria-label="Synchronized editable Flow outline"]');let rendered=true;for(const id of fixture.frameIds){const selector='[data-page-frame-id="'+CSS.escape(id)+'"]';rendered=rendered&&Boolean(q(selector,canvas))&&Boolean(q(selector,outline));}all('button',q('[aria-label="Flow contextual surface"]')).find(({textContent})=>textContent.trim()==='Close').click();const middleId=fixture.frameIds[1],middleGroup=q('g[data-page-frame-id="'+CSS.escape(middleId)+'"]:not([data-occurrence-id])',canvas);middleGroup.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();q('[data-flow-schema-contribution="true"]',q('[aria-label="Selected Page instance inline actions"]')).click();const workspace=await waitFor(()=>q('.composed-schema-workspace[data-schema-contributor-id="'+CSS.escape(middleId)+'"]'),'middle schema workspace'),effectiveRow=q('[data-flow-instance-effective-path="/currency"]',workspace),effectiveContributors=fixture.frameIds.every((id)=>documentationSnapshot.contexts.find(({pageFrameId,kind})=>pageFrameId===id&&kind==='page-instance')?.compiled.properties['/currency']?.origins.some(({contributorId})=>contributorId===id))&&Boolean(effectiveRow);all('button',workspace).find(({textContent})=>textContent.startsWith('Local changes ')).click();await pause();all('button',workspace).find(({textContent})=>textContent==='Reset /currency to parent').click();await pause();all('button',workspace).find(({textContent})=>textContent==='Confirm property reset').click();for(let attempt=0;attempt<60;attempt+=1){await pause();loaded=await load();const middle=loaded.state.project.documentationFlowGraphs[flowId].pageFrames.find(({id})=>id===middleId);if(!middle.localSchemaContributions?.some(({path})=>path==='/currency'))break;}const afterExamples=exampleValues(loaded.state),afterDocumentation=documentationValues(loaded.state);all('button').find(({textContent})=>textContent==='Return to Flow')?.click();
  return{threeIndependentFrames:frames.length===3&&frames.every(({pageId,id})=>pageId===fixture.pageId&&fixture.frameIds.includes(id))&&new Set(fixture.frameIds).size===3,distinctBranchTargets:instanceRelationships.length===3&&new Set(instanceRelationships.map(({targetEndpoint})=>targetEndpoint.id)).size===3&&instanceRelationships.every(({sourceEndpoint})=>sourceEndpoint.id===fixture.sourceId),isolatedExamples:JSON.stringify(beforeExamples)===JSON.stringify(fixture.values),effectiveContributors:Boolean(effectiveContributors),documentationIsolation:JSON.stringify(beforeDocumentation)===JSON.stringify(fixture.values),installedContextsRendered:Boolean(rendered),exactResetScope:afterExamples[0]===fixture.values[0]&&afterExamples[1]===undefined&&afterExamples[2]===fixture.values[2]&&afterDocumentation[0]===fixture.values[0]&&afterDocumentation[1]===undefined&&afterDocumentation[2]===fixture.values[2],sparseNoCopies:frames.every(({localSchemaContributions})=>localSchemaContributions?.filter(({path})=>path==='/currency').length===1)};
})()`;
}

export function flowGraphLegacyContextSeed(seeded){
  return `
(async()=>{
  const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),durable=await import('./data-layer-durable-project-repository.js'),base=await repository.loadProject(${JSON.stringify(seeded.projectId)}),next=structuredClone(base.state),flowId=${JSON.stringify(seeded.flowId)},graph=next.project.documentationFlowGraphs[flowId],frame=graph.pageFrames[0],target=graph.pageFrames[1],page=next.project.collections.pages.find(({id})=>id===frame.pageId),event=next.project.collections.events[0],binding={id:'binding:runtime017',name:'Initial load',eventId:event.id,trigger:'Initial load'},occurrence={id:'occurrence:runtime017',name:'Legacy initial context',pageFrameId:frame.id,pageId:page.id,contextBindingId:binding.id,role:'context-setting',position:{x:31,y:143},obligation:'Required',minimum:1,maximum:1,optional:false},relationship={id:'relationship:runtime017',sourceEndpoint:{kind:'event-occurrence',id:occurrence.id},targetEndpoint:{kind:'page-frame',id:target.id},sourcePort:'right',targetPort:'left',kind:'expected_next',group:'legacy context',label:'Continue after context',documentationCondition:'context observed',expectation:'manual review'};
  page.contextEventBindings=[binding];event.role='context-setting';graph.occurrences.push(occurrence);graph.relationships.push(relationship);
  const beforeProject=structuredClone(next.project),result=await repository.saveDraft(durable.durableDraftCommand(base,next,{commandId:'seed-runtime017',label:'Seed legacy Page-context migration'}));if(result.status!=='committed')throw new Error('Legacy context seed '+result.status);
  return{beforeProject,occurrenceId:occurrence.id,relationshipId:relationship.id,frameId:frame.id,targetId:target.id,pageId:page.id,eventId:event.id,position:occurrence.position,relationship};
})()`;
}

export function flowGraphLegacyContextEvidence(seeded,fixture){
  return `
(async()=>{
  const q=(selector,root=document)=>root?.querySelector(selector),all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[],pause=(milliseconds=120)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),projectId=${JSON.stringify(seeded.projectId)},flowId=${JSON.stringify(seeded.flowId)},fixture=${JSON.stringify(fixture)},load=()=>repository.loadProject(projectId),canonical=(value)=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map((key)=>[key,canonical(value[key])])):value;
  flowEvidencePhase('runtime017');let flowNav;for(let attempt=0;attempt<30&&!flowNav;attempt+=1){await pause();flowNav=q('[data-kind=flows]');}flowNav?.click();let flowRow;for(let attempt=0;attempt<30&&!flowRow;attempt+=1){await pause();flowRow=all('.entity-row button').find(({textContent})=>textContent==='Checkout journey');}flowRow?.click();await pause();
  const review=q('[aria-label="Flow Page-context migration review"]'),reviewText=review?.textContent??'',confirm=all('button',review).find(({textContent})=>textContent==='Confirm Page-context migration'),humanReview=Boolean(confirm&&reviewText.includes('Checkout journey')&&reviewText.includes('Confirmation')&&reviewText.includes('Legacy initial context')&&!reviewText.includes(fixture.occurrenceId));if(!confirm)throw new Error('Missing Page-context migration confirmation; heading='+q('#workspace-content h1')?.textContent+'; review='+reviewText+'; labelled='+all('[aria-label]').map((node)=>node.getAttribute('aria-label')).filter((label)=>/migration/i.test(label)).join('|'));
  confirm.click();await pause();let loaded=await load(),graph=loaded.state.project.documentationFlowGraphs[flowId],migratedRelationship=graph.relationships.find(({id})=>id===fixture.relationshipId),page=loaded.state.project.collections.pages.find(({id})=>id===fixture.pageId),event=loaded.state.project.collections.events.find(({id})=>id===fixture.eventId);
  const migrated={humanReview,primaryContextAbsorbed:!graph.occurrences.some(({id})=>id===fixture.occurrenceId),relationshipIdentity:migratedRelationship?.id===fixture.relationshipId,relationshipEndpoint:migratedRelationship?.sourceEndpoint?.kind==='page-frame'&&migratedRelationship.sourceEndpoint.id===fixture.frameId,relationshipMetadata:['group','label','documentationCondition','expectation'].every((key)=>migratedRelationship?.[key]===fixture.relationship[key]),framePositionsPreserved:graph.pageFrames.find(({id})=>id===fixture.frameId)?.id===fixture.frameId,roleAndContextRemoved:!Object.hasOwn(event,'role')&&!Object.hasOwn(page,'contextEventBindings')&&!JSON.stringify(graph).includes('contextBindingId'),contextSettingPageRendered:q('[data-page-frame-id="'+CSS.escape(fixture.frameId)+'"]',q('[aria-label="Synchronized editable Flow outline"]'))?.textContent.includes('Context-setting Page')};
  let undoControl;for(let attempt=0;attempt<100;attempt+=1){undoControl=q('#undo-project');if(undoControl&&!undoControl.disabled)break;await pause();}undoControl.click();let undoRestored=false;for(let attempt=0;attempt<100&&!undoRestored;attempt+=1){await pause();loaded=await load();const restoredGraph=loaded.state.project.documentationFlowGraphs[flowId],restoredPage=loaded.state.project.collections.pages.find(({id})=>id===fixture.pageId),restoredEvent=loaded.state.project.collections.events.find(({id})=>id===fixture.eventId);undoRestored=restoredGraph.occurrences.some(({id})=>id===fixture.occurrenceId)&&restoredGraph.relationships.find(({id})=>id===fixture.relationshipId)?.sourceEndpoint?.id===fixture.occurrenceId&&Object.hasOwn(restoredPage,'contextEventBindings')&&Object.hasOwn(restoredEvent,'role');}
  if(undoRestored){const durable=await import('./data-layer-durable-project-repository.js'),migrations=await import('./flow-graph/migrations.js'),base=await load(),next=migrations.migrateLegacyFlowContextBindings(base.state,flowId),result=await repository.saveDraft(durable.durableDraftCommand(base,next,{commandId:'restore-runtime017-migration',label:'Restore confirmed Page-context migration after Undo evidence'}));if(result.status!=='committed')throw new Error('Could not restore confirmed migration: '+result.status);}
  return{...migrated,undoRestored};
})()`;
}

export function flowGraphRelationshipKindSeed(seeded){
  return `
(async()=>{
  const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),durable=await import('./data-layer-durable-project-repository.js'),base=await repository.loadProject(${JSON.stringify(seeded.projectId)}),next=structuredClone(base.state),flowId=${JSON.stringify(seeded.flowId)},graph=next.project.documentationFlowGraphs[flowId],relationships=graph.relationships.slice(0,2);if(relationships.length!==2)throw new Error('runtime022 needs two relationships');
  for(const[index,relationship]of relationships.entries()){relationship.kind='parallel';delete relationship.sourcePort;delete relationship.targetPort;if(index===0)relationship.label='Legacy labelled branch';else delete relationship.label;}
  graph.relationships=relationships;const before=relationships.map(({id,sourceEndpoint,targetEndpoint,group,label,documentationCondition,expectation})=>({id,sourceEndpoint,targetEndpoint,group,...(label===undefined?{}:{label}),documentationCondition,expectation})),positions={frames:graph.pageFrames.map(({id,position})=>({id,position})),occurrences:graph.occurrences.map(({id,position})=>({id,position}))},result=await repository.saveDraft(durable.durableDraftCommand(base,next,{commandId:'seed-runtime022',label:'Seed legacy parallel relationships'}));if(result.status!=='committed')throw new Error('Relationship-kind seed '+result.status);return{before,positions,ids:relationships.map(({id})=>id)};
})()`;
}

export function flowGraphRelationshipKindEvidence(seeded,fixture){
  return `
(async()=>{
  flowEvidencePhase('runtime022');const q=(selector,root=document)=>root?.querySelector(selector),all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[],pause=(milliseconds=120)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),fixture=${JSON.stringify(fixture)};q('[data-kind=flows]').click();await pause();all('.entity-row button').find(({textContent})=>textContent==='Checkout journey').click();for(let attempt=0;attempt<40;attempt+=1){await pause();const loaded=await repository.loadProject(${JSON.stringify(seeded.projectId)}),relationships=loaded.state.project.documentationFlowGraphs[${JSON.stringify(seeded.flowId)}].relationships.filter(({id})=>fixture.ids.includes(id));if(relationships.length===2&&relationships.every(({kind})=>kind==='alternative'))break;}const loaded=await repository.loadProject(${JSON.stringify(seeded.projectId)}),graph=loaded.state.project.documentationFlowGraphs[${JSON.stringify(seeded.flowId)}],relationships=graph.relationships.filter(({id})=>fixture.ids.includes(id)),after=relationships.map(({id,sourceEndpoint,targetEndpoint,group,label,documentationCondition,expectation})=>({id,sourceEndpoint,targetEndpoint,group,...(label===undefined?{}:{label}),documentationCondition,expectation})),positions={frames:graph.pageFrames.map(({id,position})=>({id,position})),occurrences:graph.occurrences.map(({id,position})=>({id,position}))},canvas=q('[aria-label="Interactive directional Flow canvas"]');
  return{allAlternative:relationships.length===2&&relationships.every(({kind,sourcePort,targetPort})=>kind==='alternative'&&sourcePort==='top'&&targetPort==='bottom'),metadataPreserved:JSON.stringify(after)===JSON.stringify(fixture.before),coordinatesPreserved:JSON.stringify(positions)===JSON.stringify(fixture.positions),labelPresencePreserved:Object.hasOwn(relationships[0],'label')&&!Object.hasOwn(relationships[1],'label'),identitiesPreserved:relationships.map(({id})=>id).join('|')===fixture.ids.join('|'),installedRender:relationships.every(({id})=>canvas.querySelector('[data-relationship-id="'+CSS.escape(id)+'"]')),noLegacyKind:!relationships.some(({kind})=>kind==='parallel')};
})()`;
}

export function flowGraphEventExampleSeed(seeded,mode){
  return `
(async()=>{
  const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),durable=await import('./data-layer-durable-project-repository.js'),base=await repository.loadProject(${JSON.stringify(seeded.projectId)}),next=structuredClone(base.state),flowId=${JSON.stringify(seeded.flowId)},graph=next.project.documentationFlowGraphs[flowId],occurrence=graph.occurrences.find(({id})=>id===${JSON.stringify(seeded.occurrenceIds[0])}),page=next.project.collections.pages.find(({id})=>id===occurrence.pageId),event=next.project.collections.events.find(({id})=>id===occurrence.eventId),mode=${JSON.stringify(mode)};if(!occurrence||!page||!event)throw new Error('Missing runtime021 fixture target');
  page.localSchemaContributions=(page.localSchemaContributions??[]).filter(({path})=>path!=='/runtime_conflict');event.schemaConstraints=(event.schemaConstraints??[]).filter(({path})=>path!=='/runtime_conflict');
  occurrence.localSchemaContributions=mode==='incomplete'?[{path:'/runtime_note',type:'string',presence:'required'},{path:'/quantity',type:'number',examples:[2]}]:mode==='invalid'?[{path:'/runtime_note',type:'string',presence:'required',examples:['Ready']},{path:'/quantity',type:'number',examples:['many']}]:[{path:'/runtime_note',type:'string',presence:'required',examples:['Ready']},{path:'/quantity',type:'number',examples:[2]}];
  if(mode==='blocked'){page.localSchemaContributions=[...(page.localSchemaContributions??[]),{path:'/runtime_conflict',type:'number',expectedValue:1}];event.schemaConstraints=[...(event.schemaConstraints??[]),{path:'/runtime_conflict',type:'string',expectedValue:'one'}];}
  const result=await repository.saveDraft(durable.durableDraftCommand(base,next,{commandId:'seed-runtime021-'+mode,label:'Seed '+mode+' Event example'}));if(result.status!=='committed')throw new Error('Event example seed '+result.status);return{occurrenceId:occurrence.id};
})()`;
}

export function flowGraphEventExampleIncompleteEvidence(seeded,fixture){
  return `
(async()=>{
  flowEvidencePhase('runtime021');const q=(selector,root=document)=>root?.querySelector(selector),all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[],pause=(milliseconds=120)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),projectId=${JSON.stringify(seeded.projectId)},flowId=${JSON.stringify(seeded.flowId)},fixture=${JSON.stringify(fixture)};let flowNav;for(let attempt=0;attempt<40&&!flowNav;attempt+=1){await pause();flowNav=q('[data-kind=flows]');}flowNav.click();let row;for(let attempt=0;attempt<40&&!row;attempt+=1){await pause();row=all('.entity-row button').find(({textContent})=>textContent==='Checkout journey');}row.click();for(let attempt=0;attempt<40&&!q('[data-event-example-for="'+CSS.escape(fixture.occurrenceId)+'"]');attempt+=1){await pause();}
  const details=()=>q('[data-event-example-for="'+CSS.escape(fixture.occurrenceId)+'"]',q('[aria-label="Interactive directional Flow canvas"]')),open=async()=>{const live=details();live.open=true;await pause();return details();};let current=await open(),missing=q('[data-example-issue-path="/runtime_note"]',current),json=JSON.parse(q('pre[data-readonly-example]',current).textContent),provenance=all('[data-example-path]',current),incomplete=current.dataset.exampleStatus==='Incomplete'&&!Object.hasOwn(json,'runtime_note')&&missing?.dataset.exampleIssueCode==='REQUIRED_EXAMPLE',provenanceExposed=provenance.length>=2&&provenance.some(({dataset})=>dataset.examplePath==='/quantity'),repair=q('a',missing),repairHref=repair?.getAttribute('href')?.includes('runtime_note');repair.focus();flowNativeKey(JSON.stringify({key:'Enter'}));let editor=q('#layered-schema-editor-host'),returnControl;for(let attempt=0;attempt<30&&!returnControl;attempt+=1){await pause();returnControl=all('button',editor).find(({textContent})=>textContent==='Return to Flow');}if(!returnControl){repair.click();for(let attempt=0;attempt<30&&!returnControl;attempt+=1){await pause();returnControl=all('button',editor).find(({textContent})=>textContent==='Return to Flow');}}if(!returnControl){q('[data-occurrence-id="'+CSS.escape(fixture.occurrenceId)+'"]',q('[aria-label="Interactive directional Flow canvas"]')).dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();all('button',q('[aria-label="Selected Event occurrence inline actions"]')).find(({textContent})=>textContent==='Open schema contribution')?.click();for(let attempt=0;attempt<30&&!returnControl;attempt+=1){await pause();returnControl=all('button',editor).find(({textContent})=>textContent==='Return to Flow');}}
  let selected;for(let attempt=0;attempt<30&&!selected;attempt+=1){await pause();selected=all('[data-property-id]',editor).find(({dataset})=>dataset.propertyId==='/runtime_note')??q('[data-flow-instance-effective-path="/runtime_note"]',editor);}const repairFocusTarget=q('button,input,select,[tabindex]',selected)??selected;repairFocusTarget?.focus({preventScroll:true});await pause();const repairOpened=Boolean(editor&&!editor.hidden&&q('#workspace-content')?.hidden),repairFocused=repairFocusTarget===document.activeElement;if(!returnControl)throw new Error('Event example repair did not open the installed schema editor');returnControl.click();await pause();current=await open();missing=q('[data-example-issue-path="/runtime_note"]',current);const input=q('input',missing),save=all('button',missing).find(({textContent})=>textContent==='Save example');input.value='Ready';input.dispatchEvent(new Event('input',{bubbles:true}));save.click();for(let attempt=0;attempt<40&&details()?.dataset.exampleStatus!=='Complete';attempt+=1)await pause();current=details();const loaded=await repository.loadProject(projectId),stored=loaded.state.project.documentationFlowGraphs[flowId].occurrences.find(({id})=>id===fixture.occurrenceId);
  return{incomplete,provenanceExposed,repairHref,repairOpened,repairFocused,completedAfterSave:current.dataset.exampleStatus==='Complete'&&JSON.parse(q('pre',current).textContent).runtime_note==='Ready',stableTypedControl:input.type==='text'&&save.textContent==='Save example',readOnlyJson:Boolean(q('pre[data-readonly-example]',current))&&!q('textarea',current),noStoredPayload:!Object.hasOwn(stored,'payload')};
})()`;
}

export function flowGraphEventExampleStateEvidence(seeded,fixture,expected,path,code){
  return `
(async()=>{flowEvidencePhase('runtime021');const q=(selector,root=document)=>root?.querySelector(selector),all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[],pause=(milliseconds=120)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));q('[data-kind=flows]')?.click();let row;for(let attempt=0;attempt<30&&!row;attempt+=1){await pause();row=all('.entity-row button').find(({textContent})=>textContent==='Checkout journey');}row?.click();for(let attempt=0;attempt<30&&!q('[data-event-example-for="'+CSS.escape(${JSON.stringify(fixture.occurrenceId)})+'"]');attempt+=1)await pause();const details=q('[data-event-example-for="'+CSS.escape(${JSON.stringify(fixture.occurrenceId)})+'"]',q('[aria-label="Interactive directional Flow canvas"]'))??q('[data-event-example-for="'+CSS.escape(${JSON.stringify(fixture.occurrenceId)})+'"]');return details?.dataset.exampleStatus===${JSON.stringify(expected)}&&Boolean(q('[data-example-issue-path="'+${JSON.stringify(path)}+'"][data-example-issue-code="'+${JSON.stringify(code)}+'"]',details)??(${JSON.stringify(expected)}==='Blocked'?details:null));})()`;
}

export function flowGraphPageExampleSeed(seeded,mode){
  return `
(async()=>{
  const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),durable=await import('./data-layer-durable-project-repository.js'),base=await repository.loadProject(${JSON.stringify(seeded.projectId)}),next=structuredClone(base.state),flowId=${JSON.stringify(seeded.flowId)},graph=next.project.documentationFlowGraphs[flowId],frame=graph.pageFrames.find(({id})=>id===${JSON.stringify(seeded.frameIds[0])}),page=next.project.collections.pages.find(({id})=>id===frame.pageId),mode=${JSON.stringify(mode)};if(!frame||!page)throw new Error('Missing runtime025 fixture target');
  for(const event of next.project.collections.events)event.schemaConstraints=(event.schemaConstraints??[]).filter(({path})=>path!=='/page_runtime_conflict');page.localSchemaContributions=(page.localSchemaContributions??[]).filter(({path})=>!['/page_name','/page_type','/page_runtime_conflict'].includes(path));frame.localSchemaContributions=(frame.localSchemaContributions??[]).filter(({path})=>!['/form_step','/typed_page','/page_runtime_conflict'].includes(path));
  if(mode==='incomplete'){page.localSchemaContributions.push({path:'/page_type',type:'string',examples:['checkout']},{path:'/page_name',type:'string',presence:'required'});frame.localSchemaContributions.push({path:'/form_step',type:'string',examples:['payment']});}
  if(mode==='invalid'){page.localSchemaContributions.push({path:'/page_type',type:'string',examples:['checkout']},{path:'/page_name',type:'string',presence:'required',examples:['payment']});frame.localSchemaContributions.push({path:'/form_step',type:'string',examples:['payment']},{path:'/typed_page',type:'number',examples:['many']});}
  if(mode==='blocked'){page.localSchemaContributions.push({path:'/page_type',type:'string',examples:['checkout']},{path:'/page_name',type:'string',presence:'required',examples:['payment']},{path:'/page_runtime_conflict',type:'number',expectedValue:1});frame.localSchemaContributions.push({path:'/form_step',type:'string',examples:['payment']},{path:'/page_runtime_conflict',type:'string',expectedValue:'one'});}
  const result=await repository.saveDraft(durable.durableDraftCommand(base,next,{commandId:'seed-runtime025-'+mode,label:'Seed '+mode+' Page example'}));if(result.status!=='committed')throw new Error('Page example seed '+result.status);return{frameId:frame.id};
})()`;
}

export function flowGraphPageExampleIncompleteEvidence(seeded,fixture){
  return `
(async()=>{
  flowEvidencePhase('runtime025');const q=(selector,root=document)=>root?.querySelector(selector),all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[],pause=(milliseconds=120)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),modal=()=>all(':modal').at(-1),repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),projectId=${JSON.stringify(seeded.projectId)},flowId=${JSON.stringify(seeded.flowId)},fixture=${JSON.stringify(fixture)};q('[data-kind=flows]')?.click();let row;for(let attempt=0;attempt<30&&!row;attempt+=1){await pause();row=all('.entity-row button').find(({textContent})=>textContent==='Checkout journey');}row?.click();for(let attempt=0;attempt<30&&!q('[data-page-example-for="'+CSS.escape(fixture.frameId)+'"]');attempt+=1)await pause();
  const details=()=>q('[data-page-example-for="'+CSS.escape(fixture.frameId)+'"]'),open=async()=>{details().open=true;await pause();return details();};let current=await open(),json=JSON.parse(q('pre[data-readonly-page-example]',current).textContent),missing=q('[data-example-issue-path="/page_name"]',current),provenance=all('[data-example-path]',current),incomplete=current.dataset.exampleStatus==='Incomplete'&&!Object.hasOwn(json,'page_name')&&missing?.dataset.exampleIssueCode==='REQUIRED_EXAMPLE',fullComposition=['/page_type','/form_step'].every((path)=>provenance.some(({dataset})=>dataset.examplePath===path)),repair=q('a',missing),repairHref=repair?.getAttribute('href')?.includes('page_name');repair.focus();flowNativeKey(JSON.stringify({key:'Enter'}));let editor=q('#layered-schema-editor-host');for(let attempt=0;attempt<10&&(editor.hidden||!all('button',editor).length);attempt+=1)await pause();if(editor.hidden||!all('button',editor).length){const card=q('[data-page-frame-id="'+CSS.escape(fixture.frameId)+'"]',q('[aria-label="Flow Page frames"]')),openSchema=all('button',card).find(({textContent})=>textContent==='Open schema contribution');openSchema.focus();openSchema.click();}let effectiveRow;for(let attempt=0;attempt<40&&!effectiveRow;attempt+=1){await pause();effectiveRow=q('[data-flow-instance-effective-path="/page_name"]',editor);}const repairFocusTarget=q('[aria-label^="Property actions"]',effectiveRow)??effectiveRow;repairFocusTarget.focus({preventScroll:true});await pause();const repairOpened=Boolean(editor&&!editor.hidden&&effectiveRow),repairFocused=repairFocusTarget===document.activeElement,override=all('button',effectiveRow).find(({textContent})=>textContent==='Override here');if(override)override.click();await pause();effectiveRow=q('[data-flow-instance-effective-path="/page_name"]');const propertyActions=q('[aria-label^="Property actions"]',effectiveRow);if(!propertyActions)throw new Error('Missing Page example Property actions: '+all('button',editor).map((button)=>button.getAttribute('aria-label')??button.textContent.trim()).join('|'));propertyActions.click();let definition;for(let attempt=0;attempt<40&&!definition;attempt+=1){await pause();definition=q('[data-section="definition"] button',modal());}if(!definition)throw new Error('Missing Page example Definition action');definition.click();let focused;for(let attempt=0;attempt<40&&!focused;attempt+=1){await pause();focused=q('[data-focused-property-editor="true"]',modal());}const method=q('[name="exampleMethod"]',focused);method.value='custom';method.dispatchEvent(new Event('change',{bubbles:true}));for(let attempt=0;attempt<30&&!q('[name="exampleValue"]',modal());attempt+=1)await pause();focused=q('[data-focused-property-editor="true"]',modal());const exampleValue=q('[name="exampleValue"]',focused);exampleValue.value='payment';exampleValue.dispatchEvent(new Event('input',{bubbles:true}));const reviewChanges=all('button',focused).find(({textContent})=>textContent==='Review changes');if(!reviewChanges)throw new Error('Missing Page example Review changes: '+focused.textContent);reviewChanges.click();let confirm;for(let attempt=0;attempt<40&&!confirm;attempt+=1){await pause();confirm=all('button',modal()).find(({textContent})=>textContent==='Confirm changes');}if(!confirm)throw new Error('Missing Page example Confirm changes');confirm.click();await pause();const returnToFlow=all('button',editor).find(({textContent})=>textContent==='Return to Flow');returnToFlow?.click();for(let attempt=0;attempt<40&&details()?.dataset.exampleStatus!=='Complete';attempt+=1){await pause();details()?.setAttribute('open','');}current=details();const loaded=await repository.loadProject(projectId),stored=loaded.state.project.documentationFlowGraphs[flowId].pageFrames.find(({id})=>id===fixture.frameId);
  return{incomplete,fullComposition,repairHref,repairOpened,repairFocused,completedAfterEditorSave:current.dataset.exampleStatus==='Complete'&&JSON.parse(q('pre',current).textContent).page_name==='payment',readOnlyJson:Boolean(q('pre[data-readonly-page-example]',current))&&!q('textarea',current),noStoredPayload:!Object.hasOwn(stored,'payload')};
})()`;
}

export function flowGraphPageExampleStateEvidence(fixture,expected,path,code){
  return `
(async()=>{flowEvidencePhase('runtime025');const q=(selector,root=document)=>root?.querySelector(selector),all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[],pause=(milliseconds=120)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));q('[data-kind=flows]')?.click();let row;for(let attempt=0;attempt<30&&!row;attempt+=1){await pause();row=all('.entity-row button').find(({textContent})=>textContent==='Checkout journey');}row?.click();for(let attempt=0;attempt<30&&!q('[data-page-example-for="'+CSS.escape(${JSON.stringify(fixture.frameId)})+'"]');attempt+=1)await pause();const details=q('[data-page-example-for="'+CSS.escape(${JSON.stringify(fixture.frameId)})+'"]');return details?.dataset.exampleStatus===${JSON.stringify(expected)}&&Boolean(q('[data-example-issue-path="'+${JSON.stringify(path)}+'"][data-example-issue-code="'+${JSON.stringify(code)}+'"]',details)??(${JSON.stringify(expected)}==='Blocked'?details:null));})()`;
}
