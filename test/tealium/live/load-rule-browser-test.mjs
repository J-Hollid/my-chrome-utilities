import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
import {metadataNetwork,identity} from './metadata/network-fixture.mjs';

let network;
const installed=await installedTealium({beforeSelect:async(browser,native)=>{
  network=await metadataNetwork(browser,native);
  const website=(await browser.call('Target.getTargets')).targetInfos.find(target=>target.url.includes('/separate'));
  const session=await browser.attach(website.targetId);
  await browser.evaluate(session,`(()=>{
    utag.cfg.utid=${JSON.stringify(identity)};
    utag.data={page_type:'checkout',country:'NL'};
    utag.cond={12:true,13:false};
    utag.loader.loadrules=function(d,c){for(var l in c){switch(l){
      case '12':try{c[12]|=(d['page_type']=='checkout'&&d['country']=='NL')}catch(e){};break;
      case '13':try{c[13]|=(d['page_type']=='home')}catch(e){};break;
    }}};
  })()`);
}});
const {browser,native,doc}=installed;
try {
  await browser.wait('load rule metadata request',()=>network.requests.length===1);
  await network.release(0,{title:'Release',manage:{21:{title:'Analytics',loadrule:'12,13'}},
    loadrules:{12:{title:'Checkout rule'},13:{title:'Home rule'}}});
  await browser.wait('named load rules',()=>browser.evaluate(native,
    `${doc}.querySelector('#rule-rows')?.textContent.includes('Checkout rule')`));
  await browser.evaluate(native,`${doc}.querySelector('#view-rules').click()`);
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#rule-count').textContent`),
    '1 true · 1 false · 2 load rules');
  await browser.evaluate(native,`${doc}.querySelector('.rule').click()`);
  assert.match(await browser.evaluate(native,`${doc}.querySelector('#rule-conditions').textContent`),
    /page_type equals "checkout"/);
  await browser.evaluate(native,`${doc}.querySelector('#view-tags').click();${doc}.querySelector('.tag').click()`);
  assert.match(await browser.evaluate(native,`${doc}.querySelector('#tag-rules').textContent`),/Home rule.*False/);
  await browser.evaluate(native,`${doc}.querySelector('#tag-rules button:last-child').click()`);
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#rule-name').textContent`),'Home rule · 13');
  assert.equal(await browser.evaluate(native,`${doc}.querySelector('#view-rules').getAttribute('aria-pressed')`),'true');
  console.log('Tealium load rule browser: separate view, true and false results, condition detail, tag link passed');
} finally {network?.remove();await installed.close();}
