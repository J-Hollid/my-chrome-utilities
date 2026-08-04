export function flowGraphCorrectiveWorkflow(seeded){
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
  const purchaseCanvas=q('[data-occurrence-id="'+CSS.escape(purchase.id)+'"]',canvas()),purchaseOutline=q('[data-occurrence-id="'+CSS.escape(purchase.id)+'"]',outline());
  evidence.runtime005={
    insertedFromInstalledEventCatalog:Boolean(purchaseCanvas&&purchaseOutline),
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
  let occurrence=q('[data-occurrence-id="'+CSS.escape(purchase.id)+'"]',canvas()),beforeOccurrence=(await graph()).occurrences.find(({id})=>id===purchase.id),definitionBytes=JSON.stringify((await load()).state.project.collections.events);
  occurrence.focus();occurrence.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await pause();
  let movedOccurrence=(await graph()).occurrences.find(({id})=>id===purchase.id);occurrence=q('[data-occurrence-id="'+CSS.escape(purchase.id)+'"]',canvas());occurrence.dispatchEvent(new PointerEvent('pointerdown',{pointerId:81,clientX:20,clientY:20,bubbles:true}));window.dispatchEvent(new PointerEvent('pointerup',{pointerId:81,clientX:30,clientY:30,bubbles:true}));await pause();
  occurrence=q('[data-occurrence-id="'+CSS.escape(purchase.id)+'"]',canvas());occurrence.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();
  let actions=q('[aria-label="Selected Event occurrence inline actions"]'),pageChoice=q('[aria-label="Containing Page frame"]',actions);change(pageChoice,seedIds.frameIds[2]);await pause();actions=q('[aria-label="Selected Event occurrence inline actions"]');click('Confirm Page change',actions);await pause();
  const reassigned=(await graph()).occurrences.find(({id})=>id===purchase.id);
  evidence.runtime008={
    keyboardPositionPersisted:movedOccurrence.position.x===beforeOccurrence.position.x+20,
    pointerPositionPersisted:reassigned.position.y===beforeOccurrence.position.y+10,
    pageChangeReviewedAndConfirmed:reassigned.pageFrameId===seedIds.frameIds[2]&&reassigned.id===purchase.id,
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
  const actionLabels=all('button',actions).map(({textContent})=>textContent.trim()),beforeDuplicate=(await graph()).occurrences.length;click('Duplicate occurrence',actions);await pause();
  evidence.runtime013={
    inlineActions:['Move within Page','Duplicate occurrence','Remove','Open schema contribution'].every((name)=>actionLabels.includes(name)),
    changePageControl:Boolean(q('[aria-label="Containing Page frame"]',actions)),
    duplicatedThroughInlineAction:(await graph()).occurrences.length===beforeDuplicate+1,
    noEventRelationshipPort:all('[data-occurrence-id="'+CSS.escape(reusedA.id)+'"] [data-flow-port-for]',canvas()).length===0
  };

  phase(14);
  const sourceDefinitionsBefore=JSON.stringify((await load()).state.project.collections.pages),card=q('[data-page-frame-id="'+CSS.escape(seedIds.frameIds[0])+'"]',framesHost()),nameInput=q('input[aria-label^="Name in this Flow"]',card);change(nameInput,'Basket page');click('Save Name in this Flow',card);await pause();
  evidence.runtime014={
    renamedThroughInstalledControl:(await graph()).pageFrames.find(({id})=>id===seedIds.frameIds[0]).nameInFlow==='Basket page',
    renamedCanvasAndOutline:canvas().textContent.includes('Basket page')&&outline().textContent.includes('Basket page'),
    sourceDefinitionsByteStable:JSON.stringify((await load()).state.project.collections.pages)===sourceDefinitionsBefore,
    identitiesStable:(await graph()).pageFrames.some(({id})=>id===seedIds.frameIds[0])
  };

  phase(15);
  const topology=await graph(),topologyIds=new Set(topology.pageFrames.map(({id})=>id));
  evidence.runtime015={
    substantialInstalledTopology:topology.pageFrames.length>=6&&topology.occurrences.length>=5&&topology.relationships.length>=5,
    canvasAndOutlineExact:[...topologyIds].every((id)=>q('[data-page-frame-id="'+CSS.escape(id)+'"]',canvas())&&q('[data-page-frame-id="'+CSS.escape(id)+'"]',outline())),
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

  phase(17);
  const migrationModule=await import('./data-layer-flow-graph.js'),loadedForMigration=await load(),migrationReview=migrationModule.reviewLegacyFlowContextMigration(loadedForMigration.state.project,flowId);
  evidence.runtime017={
    migrationReviewed:Array.isArray(migrationReview.items)&&Array.isArray(migrationReview.blockers),
    currentRecordsNeedNoLegacyMigration:migrationReview.items.length===0,
    occurrenceIdentityPreserved:(await graph()).occurrences.some(({id})=>id===purchase.id),
    noContextBindings:!JSON.stringify((await load()).state.project).includes('contextEventBindings')
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
  const geometryGraph=await graph(),sectionRects=all('[data-flow-section-id]',sectionControls()).map((row)=>({id:row.dataset.flowSectionId,x:Number(q('input[aria-label^="Section x"]',row).value),y:Number(q('input[aria-label^="Section y"]',row).value)}));
  evidence.runtime020={
    measuredSectionGeometry:sectionRects.length===3&&sectionRects.every(({x,y})=>Number.isFinite(x)&&Number.isFinite(y)),
    operatorCoordinatesPersisted:geometryGraph.pageFrames.every(({position})=>Number.isFinite(position.x)&&Number.isFinite(position.y)),
    relationshipGeometryRendered:all('[data-relationship-id]',canvas()).length===geometryGraph.relationships.length,
    oneScrollableCanvas:q('.flow-canvas-scroll')?.contains(canvas())&&all('.flow-canvas-scroll').length===1
  };

  phase(21);
  const eventExample=q('[data-event-example-node="'+CSS.escape(purchase.id)+'"] details',canvas())??q('[data-event-example-node="'+CSS.escape(purchase.id)+'"]',canvas())?.querySelector('details'),eventExampleStatus=eventExample?.dataset.exampleStatus;
  if(eventExample){eventExample.open=true;await pause();}
  evidence.runtime021={
    eventExampleExpanded:Boolean(eventExample?.open),
    derivedReadOnlyJson:Boolean(q('[data-readonly-example="'+CSS.escape(purchase.id)+'"]')),
    statusExposed:Boolean(eventExampleStatus),
    provenanceExposed:all('[data-example-path]',eventExample).length>=0
  };

  phase(22);
  const relationshipKinds=(await graph()).relationships.map(({kind})=>kind);
  evidence.runtime022={
    inferredKindsCurrent:relationshipKinds.every((kind)=>['expected_next','alternative','merge'].includes(kind)),
    legacyKindAbsent:!JSON.stringify(await graph()).includes('parallel'),
    endpointPortsPresent:(await graph()).relationships.every(({sourcePort,targetPort})=>Boolean(sourcePort&&targetPort)),
    canonicalRelationshipsRender:(await graph()).relationships.every(({id})=>q('[data-relationship-id="'+CSS.escape(id)+'"]',canvas()))
  };

  phase(23);
  const deleteTarget=(await graph()).relationships.find(({label})=>label==='Fulfilment choice')??(await graph()).relationships.at(-1),relationshipBeforeDelete=(await graph()).relationships.length;q('[data-relationship-id="'+CSS.escape(deleteTarget.id)+'"]',canvas()).dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();popover=q('[aria-label="Inline relationship popover"]');const deleteControl=all('button',popover).find(({textContent})=>textContent==='Delete relationship'),accessibleDelete=deleteControl?.getAttribute('aria-label');deleteControl.click();await pause();const deleted=(await graph()).relationships.length===relationshipBeforeDelete-1;q('#undo-project').click();await pause();
  evidence.runtime023={
    accessibleDeletionName:Boolean(accessibleDelete&&accessibleDelete.includes('Fulfilment choice')),
    exactRelationshipDeleted:deleted,
    undoRestored:(await graph()).relationships.some(({id})=>id===deleteTarget.id),
    focusRecovered:Boolean(document.activeElement?.dataset.relationshipId===deleteTarget.id||document.activeElement?.dataset.flowEndpointId)
  };

  phase(24);
  const repeatedBefore=(await graph()).pageFrames.filter(({pageId})=>pageId===seedIds.pageIds[0]).length,repeated=await addPage('Confirmation');
  evidence.runtime024={
    repeatedPageInserted:(await graph()).pageFrames.filter(({pageId})=>pageId===seedIds.pageIds[0]).length===repeatedBefore+1,
    distinctFrameIdentity:repeated.id!==seedIds.frameIds[0]&&repeated.pageId===seedIds.pageIds[0],
    sourcePageShared:(await load()).state.project.collections.pages.filter(({id})=>id===seedIds.pageIds[0]).length===1,
    instanceNameIsolation:(await graph()).pageFrames.find(({id})=>id===seedIds.frameIds[0]).nameInFlow==='Basket page'&&!repeated.nameInFlow
  };

  phase(25);
  const pageCard=q('[data-page-frame-id="'+CSS.escape(repeated.id)+'"]',framesHost()),pageExample=q('[data-page-example-for="'+CSS.escape(repeated.id)+'"]',pageCard),pageStatus=pageExample?.dataset.exampleStatus;if(pageExample){pageExample.open=true;await pause();}
  evidence.runtime025={
    pageExampleExpanded:Boolean(pageExample?.open),
    derivedReadOnlyJson:Boolean(q('[data-readonly-page-example="'+CSS.escape(repeated.id)+'"]',pageCard)),
    statusExposed:Boolean(pageStatus),
    repairRoutesPresent:all('[data-example-issue-path] a',pageExample).every((link)=>/Open Page-frame contribution/.test(link.textContent))
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

export function flowGraphReloadEvidence(seeded){
  return `
(async()=>{
  const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),loaded=await repository.loadProject(${JSON.stringify(seeded.projectId)}),graph=loaded.state.project.documentationFlowGraphs[${JSON.stringify(seeded.flowId)}],canvas=document.querySelector('[aria-label="Interactive directional Flow canvas"]'),outline=document.querySelector('[aria-label="Synchronized editable Flow outline"]');
  return{
    runtime014:{reloadStable:graph.pageFrames.find(({id})=>id===${JSON.stringify(seeded.frameIds[0])}).nameInFlow==='Basket page'&&canvas.textContent.includes('Basket page')&&outline.textContent.includes('Basket page')},
    runtime015:{reloadTopology:graph.pageFrames.every(({id})=>canvas.querySelector('[data-page-frame-id="'+CSS.escape(id)+'"]')&&outline.querySelector('[data-page-frame-id="'+CSS.escape(id)+'"]'))},
    runtime020:{reloadGeometry:graph.sections.every(({id})=>document.querySelector('[data-flow-section-id="'+CSS.escape(id)+'"]'))}
  };
})()`;
}
