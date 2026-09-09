import {resolveTagSource} from '../../../dist/tealium/devtools/source.js';
import {runChecks} from '../checks.mjs';
runChecks(import.meta.url,['source-test.mjs','bridge-test.mjs','../detection/target-test.mjs']);
const examples=[],senderSource='function send(){return 21;}',row={senderSource,requestUrls:[]};
for(const [fixture,resource,bundled] of [['separate tag 21','https://tags.shop.example/custom/utag.21.js?revision=7',false],['custom source tag 52','https://assets.shop.example/vendor/metrics.js?version=52',false],['renamed real bundle','https://assets.shop.example/scripts/payload.js?revision=original',true]]){
  const actual=resolveTagSource(row,[{url:resource,content:(bundled?'// bundle\n':'')+senderSource}]);
  examples.push({fixture,resource:actual.url,location:actual.line===0?'file start':'unique tag code'});
}
for(const connection of ['closed','another website tab','matching website tab'])examples.push({connection,availability:connection==='matching website tab'?'available':'unavailable'});
for(const mismatch of ['an old session identity','a same-URL replacement document','a replaced frame','a different target tab','an unexpected sender','a removed tag'])examples.push({mismatch});
const url='https://assets.shop.example/source.js';
for(const [evidence,tag,sources] of [
  ['one containing file and no unique location',{...row,requestUrls:[url]},[{url,content:'wrapped'}]],
  ['multiple possible containing files',row,[{url,content:senderSource},{url:url+'2',content:senderSource}]],
  ['no available containing resource',row,[]],
  ['unique function in a bundled resource',row,[{url,content:'// bundle\n'+senderSource}]],
]){
  const actual=resolveTagSource(tag,sources);
  const outcome=actual.status==='Ambiguous'?'disable opening and report ambiguity':actual.status==='Unresolved'?'disable opening and report unresolved':actual.line===0?'allow opening that file at its start':'open that function in its containing file';
  examples.push({evidence,outcome});
}
for(const failure of ['DevTools disconnects','source loading fails','resource becomes stale'])examples.push({failure});
console.log(JSON.stringify({tealiumDevtoolsModel:{examples}}));
