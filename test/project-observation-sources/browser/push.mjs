export async function observeSourcePush(source) {
  const c=sourceControls;
  await c.start();await c.until(()=>c.captured().length===2,'snapshots');c.filter(source.toLowerCase());
  const original=c.captured(),libraryBefore=localStorage.getItem('my-chrome-utilities.event-template-library.v1');
  c.q('#data-layer-view-library').click();c.q('#add-new-event').click();
  c.input('#event-template-name','Direct event');c.input('#event-template-event-name','direct_new');
  c.input('#event-template-source',source.toLowerCase());c.input('#event-template-json','{}');
  const directDestination=c.q('#push-destination-path').value;
  await c.until(()=>!c.q('#push-template-draft').disabled,'direct push readiness');c.q('#push-template-draft').click();
  await c.until(()=>c.q('#push-draft-review').open,'push confirmation');c.q('#confirm-push-draft').click();
  await c.until(()=>commandQueue.length===1,'direct page push');
  c.q('#close-template-editor').click();
  const discard=document.querySelector('#discard-and-close-template');if(discard&&!discard.closest('dialog')?.hidden)discard.click();
  const explicit=[...c.q('#event-template-list').querySelectorAll('li')].find(node=>node.textContent.includes('Explicit destination'));
  c.button(explicit,'Push').click();await c.until(()=>analyticsQueue.length===1,'explicit Library push');
  const libraryUnchanged=localStorage.getItem('my-chrome-utilities.event-template-library.v1')===libraryBefore;
  c.q('#data-layer-view-live').click();c.q('#live-event-feed [data-event-id]').click();c.q('#live-inspector-action-save-to-library').click();
  const capturedEvent=original.find(event=>event.sourceName===source);
  const library=()=>JSON.parse(localStorage.getItem('my-chrome-utilities.event-template-library.v1'));
  await c.until(()=>library().some(template=>template.name===capturedEvent.name),'captured Library draft');
  const draft=library().find(template=>template.name===capturedEvent.name);
  c.q('#data-layer-view-library').click();
  const draftRow=[...c.q('#event-template-list').querySelectorAll('li')].find(node=>node.textContent.includes(capturedEvent.name));draftRow.querySelector('button').click();
  return {source,directDestination,direct:structuredClone(commandQueue),explicit:structuredClone(analyticsQueue),
    observationLengths:[dataLayer.length,event.history.length],libraryUnchanged,draftDestination:draft.destination,
    renderedDestination:c.q('#push-destination-path').value,settings:(await c.stored()).project.eventTransport};
}
