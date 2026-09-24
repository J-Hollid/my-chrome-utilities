import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readTealiumPage} from '../../../dist/tealium/detection/page-reader.js';
import {parseMetadata} from '../../../dist/tealium/live/metadata/request.js';
import {explainRule} from '../../../dist/tealium/live/rule-explanation.js';

let pageCalls = 0;
const forbidden = () => {pageCalls++;throw Error('Page code was called');};
const runtime = {view:forbidden,link:forbidden,cfg:{utid:'shop/main/202609100600'},
  sender:{21:{send:forbidden},22:{send:forbidden},23:{send:forbidden}},handler:{iflag:1},data:{page_type:'checkout',country:'NL'},
  cond:{12:true,13:false},loader:{cfg:{21:{title:'Analytics'},22:{title:'Other'},23:{title:'All pages'}},
    initcfg:function(){utag.loader.cfg={"21":{load:utag.cond[12],send:1},"22":{load:(utag.cond[13]),send:1},"23":{load:4,send:1}};},
    loadrules:function(d,c){for(var l in c){switch(l){
      case '12':try{c[12]|=(d['page_type'].toString().toLowerCase()=='checkout'.toLowerCase()&&d['country']=='NL')}catch(e){};break;
      case '13':try{c[13]|=(d['page_type']=='home')}catch(e){};break;
    }}}}};
const observed=JSON.parse(JSON.stringify(vm.runInNewContext(`(${readTealiumPage.toString()})()`,{
  window:{utag:runtime},location:{href:'https://shop.example/checkout'},
  document:{scripts:[],querySelectorAll:()=>[]},performance:{getEntriesByType:()=>[]},URL})));
assert.equal(pageCalls,0);
assert.deepEqual(observed.rules.map(rule=>[rule.id,rule.result]),[['12',true],['13',false]]);
assert.deepEqual(observed.tags.map(tag=>[tag.uid,tag.loadRuleIds]),[['21',['12']],['22',['13']],['23',[]]]);
const trueStep=explainRule(observed.rules[0]);
assert.equal(trueStep.result,true);
assert.deepEqual(trueStep.children.map(step=>step.result),[true,true]);
const falseStep=explainRule(observed.rules[1]);
assert.equal(falseStep.result,false);
const metadata=parseMetadata('window.__tealium_wc_getProfile('+JSON.stringify({title:'Release',
  manage:{21:{title:'Analytics',rules:{apply:[{and:[{or:[{uid:'12',type:'loadRule'}]}]}]}},
    22:{title:'Other',rules:{exclude:[{and:[{or:[{uid:'13',type:'loadRule'}]}]}]}},
    23:{title:'All pages',rules:{apply:[]}}},loadrules:{12:{title:'Checkout rule',conditions:[[
    {variable:'udo.page_type',operator:'equals',value:'checkout'},
    {variable:'udo.country',operator:'equals',value:'NL'}]]},13:{title:'Home rule'}}})+');');
assert.equal(metadata.rules[12].name,'Checkout rule');
assert.deepEqual(metadata.tagRules[21],['12']);
assert.deepEqual(metadata.tagRules[22],['13']);
assert.deepEqual(metadata.tagRules[23],[]);
assert.equal(explainRule({...observed.rules[0],conditions:metadata.rules[12].conditions}).result,true);
console.log('Tealium load rules: runtime results, metadata names, tag links, and condition steps passed');
