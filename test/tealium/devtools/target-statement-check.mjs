import assert from 'node:assert/strict';
import {resolveTagSource} from '../../../dist/tealium/devtools/source.js';
export function checkStatementTargets() {
 const senderSource='function(a,b){return a+b;}',url='https://example.test/statement.js';
 const regex='/'+senderSource+'/;',real='const actual='+senderSource+';';
 const contents=['if (x) '+regex,'while (x) '+regex,'for (;x;) '+regex,
  'if (x) {} '+regex,'function unrelated(){} '+regex,'class Unrelated {} '+regex,
  'if (x) {} else '+regex,'do '+regex+'while (false);',
  'if ((x())) '+regex,'for (const x of xs) '+regex,'try {} finally {} '+regex,
  'try {} catch (x) {} '+regex,'{let x;} '+regex,'async function unrelated(){} '+regex,
  'async function unrelated(){for await (const x of xs) '+regex+'}'];
 for(const content of contents) {
  new Function(content); // Validate syntax without execution.
  const tag={senderSource,requestUrls:[]};
  assert.equal(resolveTagSource(tag,[{url,content}]).status,'Unresolved',content);
  const known=resolveTagSource({...tag,requestUrls:[url]},[{url,content}]);
  assert.equal(known.exact,false,content);assert.equal(known.line,0);assert.equal(known.column,0);
  const mixed=resolveTagSource(tag,[{url,content:content+real}]);
  assert.equal(mixed.exact,true,content);assert.equal(mixed.column,content.length+real.indexOf(senderSource));
  assert.equal(resolveTagSource(tag,[{url,content:content+real},{url:url+'?copy',content:real}]).status,'Ambiguous');
 }
 for(const prefix of ['const n=f() / 2;','const n=(4+2) / 2;','const n={} / 2;',
  'const n=function(){} / 2;','const n=class {} / 2;','const n=class Named {} / 2;',
  'const n=(()=>{}) / 2;','const n=({a:1}) / 2;','const n=obj.if(x) / 2;',
  'const n=obj?.while(x) / 2;']) {
  const content=prefix+real;new Function(content);
  const result=resolveTagSource({senderSource,requestUrls:[]},[{url,content}]);
  assert.equal(result.exact,true,prefix);assert.equal(result.column,content.indexOf(senderSource));
 }
 // Complex declaration headers are outside the supported lexical context.
 for(const prefix of ['class C extends Object {} ','class C extends mixin(Object) {} ']) {
  const content=prefix+regex;new Function(content);
  assert.equal(resolveTagSource({senderSource,requestUrls:[]},[{url,content}]).status,'Unresolved');
  const result=resolveTagSource({senderSource,requestUrls:[url]},[{url,content}]);
  assert.equal(result.exact,false);assert.equal(result.line,0);assert.equal(result.column,0);
 }
}
