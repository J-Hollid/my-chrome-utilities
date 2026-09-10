import assert from 'node:assert/strict';
import {renderInspector} from '../../../../dist/tealium/live/render.js';
export function checkProfileDisplay() {
  const prior=globalThis.document,cells=new Map();
  const nodes={inspector:{},working:{classList:{toggle(){}}},'tag-name':{},raw:{},metadata:{
    querySelector:selector=>cells.get(selector.slice(13,-2)),
    append(label,cell){cells.set(cell.dataset.field,cell);},
  }};
  globalThis.document={getElementById:id=>nodes[id],createElement:()=>({dataset:{}})};
  try {
    for(const [profileName,expected]of [[null,'Unavailable'],['checkout','checkout'],['docs','docs']]) {
      renderInspector({uid:'21',profile:'shop.main',profileName,name:'Local',frameId:0});
      assert.equal(cells.get('Profile').textContent,expected);
      assert.equal(cells.get('Runtime key').textContent,'shop.main');
      assert.equal(JSON.parse(nodes.raw.textContent).profile,'shop.main');
    }
  }finally{globalThis.document=prior;}
}
export async function checkInstalledProfile(browser,native,doc,websiteSession) {
  await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
  const value=()=>browser.evaluate(native,`({profile:${doc}.querySelector('[data-field="Profile"]').textContent,runtime:${doc}.querySelector('[data-field="Runtime key"]')?.textContent,raw:JSON.parse(${doc}.querySelector('#raw').textContent)})`);
  let observed=await value();assert.equal(observed.profile,'Unavailable');assert.equal(observed.raw.profileName,null);assert.equal(observed.raw.utid,null);assert.equal(observed.runtime,'shop.main');
  for(const [cfg,expected]of [[{profile:'Local profile'},'Local profile'],[{profile:'Conflicting hint',utid:'tealium/docs/202504230113'},'docs']]) {
    await browser.evaluate(websiteSession,`Object.assign(utag.cfg,${JSON.stringify(cfg)})`);
    observed=await browser.wait('profile display follows local evidence',value,row=>row.profile===expected);
    assert.equal(observed.raw.profile,'shop.main');assert.equal(observed.runtime,'shop.main');
  }
  await browser.evaluate(websiteSession,'delete utag.cfg.profile;delete utag.cfg.utid');
  await browser.wait('missing profile restored',value,row=>row.profile==='Unavailable');
  return {missingUnavailable:true,localProfile:true,validUtid:true,runtimeSeparate:true};
}
