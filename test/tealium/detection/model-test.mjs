import {identityExamples} from './identity-check.mjs';
import vm from 'node:vm';
import {readTealiumPage} from '../../../dist/tealium/detection/page-reader.js';
import {runChecks} from '../checks.mjs';
runChecks(import.meta.url,['reader-test.mjs','target-test.mjs']);
const observe=(utag,scripts=[])=>JSON.parse(JSON.stringify(vm.runInNewContext(`(${readTealiumPage.toString()})()`,{
  window:{utag},location:{href:'https://shop.example/'},document:{scripts,querySelectorAll:()=>[]},performance:{getEntriesByType:()=>[]},URL,
})));
const runtime=(uid,title)=>({view(){},link(){},loader:{cfg:{[uid]:{title}}},sender:{[uid]:{send(){}}},cfg:{},handler:{iflag:1}});
const examples=identityExamples();
for(const [fixture,uid,resource] of [['standard separate','21','https://tags.tiqcdn.com/utag/shop/main/prod/utag.js'],['first-party separate','32','https://tags.shop.example/custom/utag.js?revision=7'],['renamed real bundle','115','https://assets.shop.example/scripts/payload.js?revision=original']]){
  const actual=observe(runtime(uid),[{src:resource,id:''}]);examples.push({fixture,uid:actual.tags[0].uid,resource:actual.resources[0]});
}
for(const [evidence,input] of [['no Tealium evidence',undefined],['unrelated global and named file',{}],['supported early tracking queue',{e:[],view(){}}],['supported initialized runtime',runtime(21)],['recognized incompatible runtime',{view(){},link(){},loader:42}]])examples.push({evidence,state:observe(input).state});
for(const [evidence,registered,suppressed] of [['configuration without a sender',false,false],['registered sender with loading enabled',true,false],['registered sender with loading suppressed',true,true]]){
  const input=runtime(21);if(!registered)input.sender={};input.cfg.noload=suppressed;examples.push({evidence,state:observe(input).tags[0].codeState});
}
for(const [fixture,uid,title] of [['named tag 21',21,'Analytics'],['unnamed tag 32',32,undefined],['markup-like tag title',21,'<img src=x onerror=run>']])examples.push({fixture,name:observe(runtime(uid,title)).tags[0].name});
const one=runtime(21),two=runtime(21);one.o={first:one,second:two};examples.push({fixture:'one UID across two profiles',rows:String(observe(one).tags.length)});
one.o={first:one,alias:one};examples.push({fixture:'one runtime with two references',rows:String(observe(one).tags.length)});
examples.push({fixture:'one UID across three frames',rows:String([runtime(21),runtime(21),runtime(21)].flatMap(frame=>observe(frame).tags).length)});
console.log(JSON.stringify({tealiumDetectionModel:{examples}}));
