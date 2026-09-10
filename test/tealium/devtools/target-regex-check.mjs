import assert from 'node:assert/strict';
import {resolveTagSource} from '../../../dist/tealium/devtools/source.js';

export function checkRegexTargets() {
 const senderSource='function(a,b){return a+b;}',url='https://example.test/distractor.js';
 const operators=['=>','&&','||','??','&','|','^','+','-','*','**','/','%','<','>','<=','>=','==','!=','===','!==','<<','>>','>>>','+=','-=','*=','**=','/=','%=','&=','|=','^=','<<=','>>=','>>>=','&&=','||=','??='];
 for(const operator of operators) {
  const content=`let x;const matcher = x ${operator} /${senderSource}/;`;
  new Function(content); // Parse the fixture; do not run it.
  const tag={senderSource,extensionSources:null,requestUrls:[]};
  assert.equal(resolveTagSource(tag,[{url,content}]).status,'Unresolved',operator+' regex cannot identify a file');
  const known=resolveTagSource({...tag,requestUrls:[url]},[{url,content}]);
  assert.equal(known.status,'Resolved');assert.equal(known.exact,false,operator+' regex cannot identify a location');
  assert.equal(known.line,0);assert.equal(known.column,0);
  const real='const actual='+senderSource+';';
  const mixed=resolveTagSource(tag,[{url,content:content+real}]);
  assert.equal(mixed.exact,true);assert.equal(mixed.column,content.length+real.indexOf(senderSource));
  assert.equal(resolveTagSource(tag,[{url,content:content+real},{url:url+'?copy',content:real}]).status,'Ambiguous');
 }
 // Division must not consume a real definition that follows it.
 for(const content of ['let x=4/2;','let x=4;x/=2;']) {
  const real=content+'const actual='+senderSource+';';
  const result=resolveTagSource({senderSource,requestUrls:[]},[{url,content:real}]);
  assert.equal(result.exact,true);assert.equal(result.column,real.indexOf(senderSource));
 }
}
