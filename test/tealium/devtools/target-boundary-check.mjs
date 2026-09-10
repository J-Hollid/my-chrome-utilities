import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {resolveTagSource} from '../../../dist/tealium/devtools/source.js';

export function checkTargetBoundaries() {
  const url='https://example.test/boundaries.js',senderSource='(a,b)=>a+b';
  const extension='function(){return 21;}',tag={senderSource,extensionSources:[extension],requestUrls:[]};
  const real=`const actual=${senderSource};`;
  for(const content of [`while(false){break\n/${senderSource}/;}`,
    `outer:while(false){continue outer\n/${senderSource}/;}`,
    `outer:while(false){break outer\n/${senderSource}/;}`,`debugger\n/${senderSource}/;`]) {
    new Script(content);
    assert.equal(resolveTagSource(tag,[{url,content}]).status,'Unresolved',content);
    assert.equal(resolveTagSource({...tag,requestUrls:[url]},[{url,content}]).exact,false,content);
    const result=resolveTagSource(tag,[{url,content:content+real}]);
    assert.equal(result.exact,true);assert.equal(result.line,1);
    assert.equal(resolveTagSource(tag,[{url,content:content+real},{url:url+'?copy',content:real}]).status,'Ambiguous');
  }
  for(const content of [
    `a.u.send=${senderSource};b.u.extend=[${extension}];${real}`,
    `a.u.send=${senderSource};b.v.u.extend=[${extension}];${real}`,
    `var u={};u.send=${senderSource};u={};u.extend=[${extension}];${real}`,
    `var u={};u.extend=[${extension}];u={};u.send=${senderSource};${real}`,
  ]) {
    new Script(content);
    for(const destination of ['send','extend']) {
      const result=resolveTagSource({...tag,requestUrls:[url]},[{url,content}],destination);
      assert.equal(result.status,'Resolved');assert.equal(result.exact,false,content);
      assert.equal(result.line,0);assert.equal(result.column,0);
    }
  }
}
