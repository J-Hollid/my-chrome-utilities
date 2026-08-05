export function flowWorkspaceR02Runtime(seeded) {
  return `
(async()=>{
  const q=(selector,root=document)=>root?.querySelector(selector);
  const all=(selector,root=document)=>root?[...root.querySelectorAll(selector)]:[];
  const pause=(milliseconds=60)=>new Promise(resolve=>setTimeout(resolve,milliseconds));
  const waitFor=async(read,description,attempts=100)=>{for(let attempt=0;attempt<attempts;attempt+=1){const value=await read();if(value)return value;await pause(25);}throw new Error('Timed out waiting for '+description);};
  const button=(text,root=document)=>all('button',root).find(candidate=>candidate.textContent.trim()===text);
  const click=(text,root=document)=>{const found=button(text,root);if(!found)throw new Error('Missing Flow control '+text);found.click();return found;};
  const pointer=(target,type,values={})=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:values.pointerId??41,pointerType:values.pointerType??'mouse',button:values.button??0,clientX:values.clientX??0,clientY:values.clientY??0}));
  const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository();
  const projectId=${JSON.stringify(seeded.projectId)},flowId=${JSON.stringify(seeded.flowId)};
  const load=()=>repository.loadProject(projectId),graph=async()=>(await load()).state.project.documentationFlowGraphs[flowId];
  let workspace,toolbar,viewport,canvas;
  const refresh=()=>{workspace=q('.documentary-flow');toolbar=q('[aria-label="Flow toolbar"]');viewport=q('[aria-label="Flow canvas viewport"]');canvas=q('[aria-label="Interactive directional Flow canvas"]');};
  refresh();
  if(!canvas){q('[data-kind="flows"]')?.click();await waitFor(()=>all('.entity-row button').find(item=>item.textContent==='Checkout journey'),'Flow row').then(item=>item.click());await waitFor(()=>q('[aria-label="Flow toolbar"]'),'Flow toolbar');refresh();}
  if(!workspace||!toolbar||!viewport||!canvas)throw new Error('Incomplete installed Flow workspace');
  const evidence={},surface=()=>q('[aria-label="Flow contextual surface"]'),surfaceOpen=()=>Boolean(surface()&&!surface().hidden),snapshot=async()=>structuredClone(await graph());
  const initial=await snapshot(),initialDefinitions=JSON.stringify((await load()).state.project.collections.pages),outerBefore=document.documentElement.scrollWidth;

  const skip=button('Skip to canvas',toolbar);skip.click();
  const skipped=document.activeElement===canvas||(skip.textContent.trim()==='Skip to canvas'&&canvas.getAttribute('tabindex')==='0');
  const cameraBeforeFocus=canvas.dataset.viewport;
  click('Focus Canvas',toolbar);await pause();
  const focused=document.body.classList.contains('flow-focus-canvas');
  click('Exit Focus Canvas',toolbar);await pause();refresh();
  evidence.runtime001={bounded:viewport.getBoundingClientRect().height<=innerHeight&&viewport.getBoundingClientRect().width<=innerWidth,oneToolbar:all('[aria-label="Flow toolbar"]').length===1,closedDepth:!surfaceOpen(),focusCanvas:focused&&!document.body.classList.contains('flow-focus-canvas'),stateConserved:cameraBeforeFocus===canvas.dataset.viewport,advancedSeparated:Boolean(q('#flow-step-editor')?.textContent.includes('Advanced')),skipLink:skipped};

  const canvasRect=canvas.getBoundingClientRect(),release={x:canvasRect.left+Math.min(520,canvasRect.width*.62),y:canvasRect.top+Math.min(360,canvasRect.height*.58)};
  canvas.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,clientX:release.x,clientY:release.y}));
  await waitFor(()=>surfaceOpen(),'Add surface from canvas release');
  const addSurface=surface(),surfaceRect=addSurface.getBoundingClientRect(),paletteViewportRect=viewport.getBoundingClientRect(),catalog=q('[aria-label="Pages catalog"]',addSurface),eventPalette=q('[aria-label="Events catalog"]',addSurface),pageChoice=q('button[data-component-kind="page"]',catalog),beforeAdd=await snapshot(),palettePresent=Boolean(catalog&&eventPalette);
  if(!pageChoice)throw new Error('No Page catalog choice');
  pageChoice.click();
  await waitFor(async()=>(await graph()).pageFrames.length===beforeAdd.pageFrames.length+1,'positioned Page insertion');
  const afterAdd=await snapshot(),addedFrame=afterAdd.pageFrames.find(item=>!beforeAdd.pageFrames.some(before=>before.id===item.id));
  const currentCamera=JSON.parse(canvas.dataset.viewport),expectedPoint={x:Math.round(currentCamera.x+(release.x-canvasRect.left)/currentCamera.zoom),y:Math.round(currentCamera.y+(release.y-canvasRect.top)/currentCamera.zoom)};
  evidence.runtime002={constantChrome:all('[aria-label="Flow toolbar"]').length===1,palette:palettePresent,boundedResults:!q('[aria-label="Flow Section controls"]')&&!q('[aria-label="Flow Page frames"]'),paletteBottomContained:surfaceRect.bottom<=paletteViewportRect.bottom+2,paletteRightContained:surfaceRect.right<=paletteViewportRect.right+2,invocationLocation:Math.abs(surfaceRect.left-release.x)<=surfaceRect.width,canonicalReused:JSON.stringify((await load()).state.project.collections.pages)===initialDefinitions,exactPlacement:Boolean(addedFrame&&Math.abs(addedFrame.position.x-expectedPoint.x)<=2&&Math.abs(addedFrame.position.y-expectedPoint.y)<=2),noCanonicalCreate:!/Create Page|Create Event/.test(addSurface.textContent)};

  refresh();
  const firstPage=q('g[data-page-frame-id]',canvas);firstPage.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();refresh();
  click('Add Event',q('[aria-label="Selected Page instance inline actions"]'));
  const eventCatalog=q('[aria-label="Events catalog"]',surface()),eventChoice=q('button[data-component-kind="event"]',eventCatalog),beforeEvents=await snapshot();
  pointer(eventChoice,'pointerdown',{clientX:20,clientY:20});eventChoice.click();
  await waitFor(async()=>(await graph()).occurrences.length===beforeEvents.occurrences.length+1,'Event insertion');
  const afterEvent=await snapshot(),eventDefinitions=(await load()).state.project.collections.events,newOccurrence=afterEvent.occurrences.find(item=>!beforeEvents.occurrences.some(before=>before.id===item.id));
  evidence.runtime005={contained:Boolean(newOccurrence?.pageFrameId===firstPage.dataset.pageFrameId),portless:!q('[data-flow-port-for="'+CSS.escape(newOccurrence?.id??'')+'"]',canvas),stableReferences:Boolean(newOccurrence?.id&&newOccurrence.eventId&&newOccurrence.pageFrameId),noRoles:!Object.hasOwn(newOccurrence??{},'role')&&!Object.hasOwn(newOccurrence??{},'contextBindingId')};
  evidence.runtime006={reusableEvents:afterEvent.occurrences.some(item=>item.eventId===newOccurrence?.eventId),canonicalEvents:afterEvent.occurrences.every(item=>eventDefinitions.some(entity=>entity.id===item.eventId)),independentOccurrences:new Set(afterEvent.occurrences.map(item=>item.id)).size===afterEvent.occurrences.length,pointerInsertion:Boolean(newOccurrence)};

  refresh();if(!surfaceOpen())click('Add',toolbar);const name=q('[aria-label="New Section name"]',surface());name.value='Runtime drawn';click('Draw Section',surface());
  const drawBox=canvas.getBoundingClientRect(),drawStart={x:drawBox.left+80,y:drawBox.top+90},drawEnd={x:drawStart.x+310,y:drawStart.y+190},beforeDraw=await snapshot();
  pointer(canvas,'pointerdown',{pointerId:51,...drawStart});pointer(canvas,'pointermove',{pointerId:51,...drawEnd});const previewedSection=Boolean(q('.flow-section-draw-preview',canvas));pointer(canvas,'pointerup',{pointerId:51,...drawEnd});
  await waitFor(async()=>(await graph()).sections.length===beforeDraw.sections.length+1,'drawn Section');
  const afterDraw=await snapshot(),drawn=afterDraw.sections.find(item=>!beforeDraw.sections.some(before=>before.id===item.id));refresh();
  evidence.runtime003={twoDimensional:Boolean(drawn&&['x','y','width','height'].every(key=>Number.isFinite(drawn.bounds[key]))),explicitContainment:afterDraw.pageFrames.filter(item=>item.sectionId).every(item=>afterDraw.sections.some(section=>section.id===item.sectionId)),noRawGeometry:!q('[aria-label^="Section x"]')&&!q('[aria-label^="Section width"]'),drawPreview:previewedSection};

  let drawnGroup=q('g[data-flow-section-id="'+CSS.escape(drawn.id)+'"]',canvas);drawnGroup.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();refresh();
  let sectionActions=q('[aria-label^="Selected Section"]');
  click('Rename',sectionActions);const rename=q('[aria-label^="Rename Section"]',sectionActions);rename.value='Runtime renamed';click('Save Section name',sectionActions);
  await waitFor(async()=>(await graph()).sections.some(item=>item.id===drawn.id&&item.name==='Runtime renamed'),'Section rename');refresh();
  drawnGroup=q('g[data-flow-section-id="'+CSS.escape(drawn.id)+'"]',canvas);const beforeMove=(await snapshot()).sections.find(item=>item.id===drawn.id).bounds;
  pointer(drawnGroup,'pointerdown',{pointerId:52,clientX:100,clientY:100});pointer(drawnGroup,'pointermove',{pointerId:52,clientX:140,clientY:125});pointer(drawnGroup,'pointerup',{pointerId:52,clientX:140,clientY:125});
  await waitFor(async()=>{const item=(await graph()).sections.find(candidate=>candidate.id===drawn.id);return item?.bounds.x===beforeMove.x+40&&item?.bounds.y===beforeMove.y+25;},'Section move');refresh();
  drawnGroup=q('g[data-flow-section-id="'+CSS.escape(drawn.id)+'"]',canvas);const resize=q('[data-section-resize-for="'+CSS.escape(drawn.id)+'"]',drawnGroup),beforeResize=(await snapshot()).sections.find(item=>item.id===drawn.id).bounds;
  pointer(resize,'pointerdown',{pointerId:53,clientX:200,clientY:200});pointer(resize,'pointermove',{pointerId:53,clientX:245,clientY:230});pointer(resize,'pointerup',{pointerId:53,clientX:245,clientY:230});
  await waitFor(async()=>{const item=(await graph()).sections.find(candidate=>candidate.id===drawn.id);return item?.bounds.width===beforeResize.width+45&&item?.bounds.height===beforeResize.height+30;},'Section resize');
  const manipulated=(await snapshot()).sections.find(item=>item.id===drawn.id);
  evidence.runtime007={sectionOwned:drawn.id.startsWith('flow-section'),rename:manipulated.name==='Runtime renamed',move:manipulated.bounds.x===beforeMove.x+40&&manipulated.bounds.y===beforeMove.y+25,resize:manipulated.bounds.width===beforeResize.width+45&&manipulated.bounds.height===beforeResize.height+30,undoAvailable:Boolean(q('#undo-project'))};

  refresh();drawnGroup=q('g[data-flow-section-id="'+CSS.escape(drawn.id)+'"]',canvas);drawnGroup.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();sectionActions=q('[aria-label^="Selected Section"]');click('Remove Section',sectionActions);
  await waitFor(async()=>!(await graph()).sections.some(item=>item.id===drawn.id),'Section removal');q('#undo-project').click();
  await waitFor(async()=>(await graph()).sections.some(item=>item.id===drawn.id),'Section removal Undo');
  const afterSectionUndo=await snapshot();
  evidence.runtime008={freePositions:afterSectionUndo.occurrences.every(item=>Number.isFinite(item.position?.x)&&Number.isFinite(item.position?.y)),containedFrames:afterSectionUndo.occurrences.every(item=>afterSectionUndo.pageFrames.some(frame=>frame.id===item.pageFrameId)),removeRetains:afterSectionUndo.pageFrames.length===afterEvent.pageFrames.length,undoRestores:afterSectionUndo.sections.some(item=>item.id===drawn.id)};

  refresh();const pageGroups=all('g[data-page-frame-id]',canvas).filter(item=>!item.dataset.occurrenceId),occurrenceGroups=all('[data-occurrence-id]',canvas),ports=all('[data-flow-port-for]',canvas),postSection=await snapshot();
  evidence.runtime004={stableInstances:new Set(postSection.pageFrames.map(item=>item.id)).size===postSection.pageFrames.length,repeatedPage:postSection.pageFrames.some((item,index,list)=>list.some((other,otherIndex)=>index!==otherIndex&&item.pageId===other.pageId)),contextPages:postSection.occurrences.every(item=>postSection.pageFrames.some(frame=>frame.id===item.pageFrameId)),definitionsConserved:JSON.stringify((await load()).state.project.collections.pages)===initialDefinitions};
  evidence.runtime009={fourPorts:pageGroups.every(group=>['left','right','top','bottom'].every(side=>q('[data-flow-port-for="'+CSS.escape(group.dataset.pageFrameId)+'"][data-flow-port-side="'+side+'"]',canvas))),pageOnly:occurrenceGroups.every(group=>!q('[data-flow-port-for="'+CSS.escape(group.dataset.occurrenceId)+'"]',canvas)),semanticKinds:postSection.relationships.every(item=>['expected_next','alternative','merge'].includes(item.kind))};

  const source=postSection.pageFrames[0],sourcePort=q('[data-flow-port-for="'+CSS.escape(source.id)+'"][data-flow-port-side="right"]',canvas),beforeDrop=await snapshot(),dropRect=canvas.getBoundingClientRect(),dropPoint={x:dropRect.left+dropRect.width*.72,y:dropRect.top+dropRect.height*.68};
  pointer(sourcePort,'pointerdown',{pointerId:61,clientX:dropRect.left+30,clientY:dropRect.top+30});pointer(canvas,'pointerup',{pointerId:61,...dropPoint});await waitFor(()=>surfaceOpen(),'empty connection Add surface');
  const dropSurface=surface(),dropSurfaceRect=dropSurface.getBoundingClientRect(),dropChoice=q('button[data-component-kind="page"]',q('[aria-label="Pages catalog"]',dropSurface));dropChoice.click();
  await waitFor(async()=>{const value=await graph();return value.pageFrames.length===beforeDrop.pageFrames.length+1&&value.relationships.length===beforeDrop.relationships.length+1;},'atomic empty connection drop');
  const dropped=await snapshot(),dropFrame=dropped.pageFrames.find(item=>!beforeDrop.pageFrames.some(before=>before.id===item.id)),dropEdge=dropped.relationships.find(item=>!beforeDrop.relationships.some(before=>before.id===item.id));q('#undo-project').click();
  await waitFor(async()=>{const value=await graph();return value.pageFrames.length===beforeDrop.pageFrames.length&&value.relationships.length===beforeDrop.relationships.length;},'empty drop Undo');
  evidence.runtime010={installedAtomic:Boolean(dropFrame&&dropEdge?.sourceEndpoint.id===source.id&&dropEdge.targetEndpoint.id===dropFrame.id),oneUndo:true,releaseLocation:Math.abs(dropSurfaceRect.left-dropPoint.x)<=dropSurfaceRect.width,canonicalPageStable:JSON.stringify((await load()).state.project.collections.pages)===initialDefinitions};
  evidence.runtime011={directed:postSection.relationships.every(item=>item.sourceEndpoint.kind==='page-frame'&&item.targetEndpoint.kind==='page-frame'),noParallel:postSection.relationships.every(item=>item.kind!=='parallel'),documentary:workspace.textContent.includes('Documentary journey expectations')};
  evidence.runtime012={keyboardPorts:ports.every(port=>port.getAttribute('tabindex')==='0'),inferredKinds:postSection.relationships.every(item=>['expected_next','alternative','merge'].includes(item.kind)),noKindSelector:!q('[aria-label="Relationship kind"]')};

  refresh();const compactPage=all('g[data-page-frame-id]',canvas).find(item=>!item.dataset.occurrenceId);compactPage.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();refresh();const pageActions=q('[aria-label="Selected Page instance inline actions"]');click('Details',pageActions);await pause();
  evidence.runtime013={singleCards:!q('[aria-label="Flow Page frames"]'),compact:Boolean(q('.flow-page-source',compactPage)&&q('.flow-readiness',compactPage)),pageActions:['Rename in Flow','Add Event','Connect','Duplicate','Details','Open schema contribution','Remove'].every(label=>all('button',pageActions).some(item=>item.textContent.includes(label))),contextualDepth:surfaceOpen()};
  evidence.runtime014={humanNames:pageGroups.every(group=>Boolean(group.textContent.trim())),stableIds:pageGroups.every(group=>postSection.pageFrames.some(item=>item.id===group.dataset.pageFrameId)),reloadState:postSection.pageFrames.every(item=>Number.isFinite(item.position.y))};
  evidence.runtime015={canvasFirst:Boolean(toolbar.compareDocumentPosition(viewport)&Node.DOCUMENT_POSITION_FOLLOWING),noFormsBefore:!all('form,select',workspace).some(control=>control.compareDocumentPosition(viewport)&Node.DOCUMENT_POSITION_FOLLOWING),detailsOwnExamples:Boolean(q('[data-example-status]',surface())),noStoredExamples:!postSection.pageFrames.some(item=>Object.hasOwn(item,'exampleJson'))};
  click('Close',surface());

  const cameras=[];const remember=()=>cameras.push(canvas.dataset.viewport);
  remember();click('Zoom in',toolbar);remember();click('Zoom out',toolbar);click('100 percent',toolbar);
  viewport.focus();viewport.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'ArrowRight'}));remember();
  pointer(viewport,'pointerdown',{pointerId:71,button:1,clientX:240,clientY:240});pointer(viewport,'pointermove',{pointerId:71,button:1,clientX:280,clientY:270});pointer(viewport,'pointerup',{pointerId:71,button:1,clientX:280,clientY:270});remember();
  pointer(viewport,'pointerdown',{pointerId:72,pointerType:'touch',clientX:260,clientY:260});pointer(viewport,'pointermove',{pointerId:72,pointerType:'touch',clientX:295,clientY:285});pointer(viewport,'pointerup',{pointerId:72,pointerType:'touch',clientX:295,clientY:285});remember();
  pointer(viewport,'pointerdown',{pointerId:73,pointerType:'touch',clientX:260,clientY:260});pointer(viewport,'pointerdown',{pointerId:74,pointerType:'touch',clientX:320,clientY:260});pointer(viewport,'pointermove',{pointerId:74,pointerType:'touch',clientX:360,clientY:260});pointer(viewport,'pointerup',{pointerId:73,pointerType:'touch'});pointer(viewport,'pointerup',{pointerId:74,pointerType:'touch'});remember();
  viewport.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-80,clientX:300,clientY:260}));remember();
  click('Fit Flow',toolbar);click('Minimap',toolbar);const minimap=q('[aria-label="Flow minimap"]'),minimapButton=q('[aria-label="Navigate complete Flow bounds"]',minimap),beforeMinimap=canvas.dataset.viewport,minimapRect=minimapButton.getBoundingClientRect();minimapButton.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:minimapRect.left+minimapRect.width*.8,clientY:minimapRect.top+minimapRect.height*.7}));const afterMinimap=canvas.dataset.viewport;
  evidence.runtime016={cameraChanged:new Set(cameras).size>=5,controls:['Zoom in','Zoom out','100 percent','Fit Flow','Fit selection','Minimap'].every(label=>all('button',toolbar).some(item=>item.textContent.trim()===label)),minimapVisible:!minimap.hidden,minimapNavigates:beforeMinimap!==afterMinimap,canonicalStill:JSON.stringify((await graph()).relationships)===JSON.stringify(postSection.relationships)};
  const pageDefinitions=(await load()).state.project.collections.pages;
  evidence.runtime017={currentModel:postSection.occurrences.every(item=>!Object.hasOwn(item,'role')&&!Object.hasOwn(item,'contextBindingId')),pageContext:postSection.pageFrames.every(item=>pageDefinitions.some(page=>page.id===item.pageId)),stableOccurrenceIds:new Set(postSection.occurrences.map(item=>item.id)).size===postSection.occurrences.length};

  click('Outline',toolbar);await pause();const outline=q('[aria-label="Synchronized editable Flow outline"]',surface()),search=q('[aria-label="Search Flow Outline"]',surface());search.value='Payment';search.dispatchEvent(new Event('input',{bubbles:true}));const result=q('[aria-label="Flow Outline search results"] button',surface()),beforeOutline=canvas.dataset.viewport;result?.click();await pause(120);refresh();
  evidence.runtime018={onDemand:Boolean(outline&&surfaceOpen()),sameIdentities:(await graph()).pageFrames.every(item=>q('[data-page-frame-id="'+CSS.escape(item.id)+'"]',outline)),relationships:(await graph()).relationships.every(item=>q('[data-relationship-id="'+CSS.escape(item.id)+'"]',outline)),searchResult:Boolean(result),reveal:canvas.dataset.viewport!==beforeOutline&&Boolean(canvas.querySelector('.is-selected'))};click('Close',surface());

  const tidyBase=await snapshot();click('Tidy',toolbar);const tidySurface=surface(),scope=q('[aria-label="Tidy scope"]',tidySurface),direction=q('[aria-label="Tidy arrangement"]',tidySurface);scope.value=all('option',scope).find(item=>item.value.startsWith('section:')&&tidyBase.pageFrames.filter(frame=>frame.sectionId===item.value.slice(8)).length>1)?.value??'selection';direction.value='horizontal';click('Preview Tidy',tidySurface);const previewCount=all('[data-tidy-transform]',canvas).length,edgePreview=all('[data-tidy-edge-preview]',canvas).length,beforeCancel=JSON.stringify(await graph());click('Cancel Tidy',tidySurface);const cancelled=JSON.stringify(await graph())===beforeCancel;
  click('Tidy',toolbar);const secondSurface=surface(),secondScope=q('[aria-label="Tidy scope"]',secondSurface),secondDirection=q('[aria-label="Tidy arrangement"]',secondSurface);secondScope.value=scope.value;secondDirection.value='vertical';click('Preview Tidy',secondSurface);click('Confirm Tidy',secondSurface);await waitFor(async()=>JSON.stringify((await graph()).pageFrames)!==JSON.stringify(tidyBase.pageFrames),'confirmed Tidy');const tidied=await snapshot();
  evidence.runtime019={previewed:previewCount>1,edgePreview:edgePreview>0,cancelled,oneCommand:JSON.stringify(tidied.pageFrames)!==JSON.stringify(tidyBase.pageFrames),semantics:JSON.stringify(tidied.relationships)===JSON.stringify(tidyBase.relationships)&&tidied.pageFrames.every((item,index)=>item.id===tidyBase.pageFrames[index]?.id&&item.sectionId===tidyBase.pageFrames[index]?.sectionId)};
  evidence.runtime020={contained:viewport.getBoundingClientRect().right<=innerWidth+2&&document.documentElement.scrollWidth<=innerWidth+2,focusable:all('button,[tabindex="0"]',workspace).every(item=>item.getAttribute('aria-label')||item.textContent.trim()),surfacesContained:surface().getBoundingClientRect().right<=innerWidth+2,outerStable:document.documentElement.scrollWidth<=Math.max(outerBefore,innerWidth)};

  click('Zoom out',toolbar);click('Zoom out',toolbar);click('Zoom out',toolbar);click('Zoom out',toolbar);const distant=canvas.dataset.semanticDetail==='identity';click('100 percent',toolbar);refresh();const eventGroup=q('[data-occurrence-id]',canvas),eventReady=Boolean(q('.flow-readiness',eventGroup));eventGroup.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();refresh();const eventActions=q('[aria-label="Selected Event occurrence inline actions"]');click('Details',eventActions);await pause();
  evidence.runtime021={semanticZoom:distant,eventReadiness:eventReady,details:Boolean(q('[data-event-example-for]',surface())),noCanvasJson:all('foreignObject',canvas).every(item=>getComputedStyle(item).display==='none')};
  evidence.runtime022={migrated:tidied.relationships.every(item=>item.kind!=='parallel'),identities:tidied.relationships.every(item=>postSection.relationships.some(before=>before.id===item.id))};
  click('Close',surface());refresh();const edge=q('[data-relationship-id]',canvas);edge.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();refresh();const relationshipActions=q('[aria-label="Selected relationship actions"]');
  evidence.runtime023={toolbar:Boolean(relationshipActions),actions:['Edit documentation','Delete relationship'].every(label=>all('button',relationshipActions).some(item=>item.textContent.includes(label))),pageEndpoints:tidied.relationships.every(item=>item.sourceEndpoint.kind==='page-frame'&&item.targetEndpoint.kind==='page-frame')};
  const counts=new Map();for(const frame of tidied.pageFrames)counts.set(frame.pageId,(counts.get(frame.pageId)??0)+1);
  evidence.runtime024={repeated:[...counts.values()].some(value=>value>1),distinct:new Set(tidied.pageFrames.map(item=>item.id)).size===tidied.pageFrames.length,sectionsNeutral:tidied.pageFrames.every(item=>!item.sectionId||tidied.sections.some(section=>section.id===item.sectionId))};
  const finalPage=all('g[data-page-frame-id]',canvas).find(item=>!item.dataset.occurrenceId);finalPage.dispatchEvent(new MouseEvent('click',{bubbles:true}));await pause();refresh();click('Details',q('[aria-label="Selected Page instance inline actions"]'));await pause();
  evidence.runtime025={pageReadiness:Boolean(q('.flow-readiness',finalPage)),pageDetails:Boolean(q('[data-page-example-for]',surface())),noCardJson:!q('foreignObject:not([style*="display: none"])',finalPage)};
  const namingActions=q('[aria-label="Selected Page instance inline actions"]');
  evidence.runtime026={renameAction:all('button',namingActions).some(item=>item.textContent.trim()==='Rename in Flow'),stableNames:tidied.pageFrames.every(item=>typeof item.name==='string'),canonicalPageNames:(await load()).state.project.collections.pages.every(item=>Boolean(item.name))};
  return {...evidence,installedBoundary:location.protocol==='chrome-extension:'&&Boolean(repository&&workspace&&toolbar&&canvas)};
})()`;
}
