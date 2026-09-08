/** Identical private utility checks in the standalone document and retained frame. */
export function observeProbeUtility(doc) {
  const check=(value,label)=>{if(!value)throw new Error(label);};
  const draft=doc.querySelector('#draft'), filter=doc.querySelector('#filter'), selection=doc.querySelector('#selection');
  draft.value='common draft';draft.dispatchEvent(new Event('input'));
  filter.value='common filter';selection.value='B';doc.querySelector('#scroll').scrollTop=240;
  check(draft.value==='common draft'&&filter.value==='common filter'&&selection.value==='B','Private editor state');
  check(doc.querySelector('#scroll').scrollTop===240,'Private scroll');
  doc.querySelector('#save').click();
  check(doc.defaultView.localStorage.getItem('utility.probe.draft')==='common draft','Private saved draft');
  const before=JSON.parse(doc.querySelector('#state').textContent);
  doc.querySelector('#start').click();doc.querySelector('#event').click();doc.querySelector('#stop').click();
  const after=JSON.parse(doc.querySelector('#state').textContent);
  check(!after.running&&after.events===before.events+1&&after.stops===before.stops+1,'Private job processes once and stops');
  check(after.session===before.session&&after.target===before.target,'Private job retains session and target');
  return {editor:true,scroll:true,persistence:true,job:true,identity:true};
}
