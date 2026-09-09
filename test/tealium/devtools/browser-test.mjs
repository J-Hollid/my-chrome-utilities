import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
import {sourceNavigationPackage} from './fixture.mjs';
import ts from 'typescript';

function tokens(text) {
  const scanner=ts.createScanner(ts.ScriptTarget.Latest,true,ts.LanguageVariant.Standard,text),values=[];
  while(scanner.scan()!==ts.SyntaxKind.EndOfFileToken)values.push(scanner.getTokenText());
  return values;
}

const fixture=await sourceNavigationPackage();
const results=[];
try {
  for(const [name,suffix,signature] of [['separate','/custom/utag.21.js?revision=7','separateSend'],
    ['custom','/vendor/metrics.js?version=52','customSend'],['real','/scripts/payload.js?revision=original',null]]) {
    const installed=await installedTealium({extensionRoot:fixture.extensionRoot,fixtureName:name});
    try {
      const {browser,native,doc,website}=installed;
      await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
      assert.equal(await browser.evaluate(native,`${doc}.querySelector('#show-source').disabled`),true);
      const sender=await browser.evaluate(native,`JSON.parse(${doc}.querySelector('#raw').textContent).senderSource`);
      await browser.call('Target.openDevTools',{targetId:website.targetId});
      const frontend=await browser.wait('website DevTools frontend',async()=>
        (await browser.call('Target.getTargets')).targetInfos.find(target=>target.url.startsWith('devtools://')&&target.title.includes('/'+name)));
      const front=await browser.attach(frontend.targetId);
      await browser.wait('resolved current source',()=>browser.evaluate(native,`!${doc}.querySelector('#show-source').disabled`));
      await browser.evaluate(native,`${doc}.querySelector('#show-source').click()`);
      const editor=`(async()=>{
        const S=await import('./panels/sources/sources.js');const view=S.SourcesPanel.SourcesPanel.instance().sourcesView();
        const frame=view.currentSourceFrame(),state=frame?.textEditor?.state;
        return {url:view.currentUISourceCode()?.url(),text:state?.doc?.toString(),head:state?.selection?.main?.head};
      })()`;
      const selected=await browser.wait('nonempty actual Sources editor',()=>browser.evaluate(front,editor),
        value=>Boolean(value.url?.endsWith(suffix)&&value.text?.length));
      if(signature)assert.ok(selected.text.includes(signature));
      assert.ok(selected.head>=0);
      const originalTokens=tokens(sender);
      assert.deepEqual(tokens(selected.text.slice(selected.head)).slice(0,originalTokens.length),originalTokens);
      await browser.wait('visible source success',()=>browser.evaluate(native,`${doc}.querySelector('#feedback').textContent==='Source opened'`));
      let formatted=false;
      if(name==='real') {
        const toggle=`(()=>{
          function find(root){for(const e of root.querySelectorAll('*')){if(/pretty.?print/i.test(e.getAttribute('aria-label')??e.getAttribute('title')??'')){e.click();return true;}if(e.shadowRoot&&find(e.shadowRoot))return true;}return false;}
          return find(document);
        })()`;
        const clicked=await browser.evaluate(front,toggle);
        assert.equal(clicked,true,'The actual Sources formatter is available');
        const changed=await browser.wait('source formatting changed the editor',()=>browser.evaluate(front,editor),value=>Boolean(value.text&&value.text!==selected.text));
        await browser.evaluate(front,toggle);
        const after=await browser.wait('formatted source restored',()=>browser.evaluate(front,editor),value=>Boolean(value.text&&value.text!==changed.text));
        assert.ok(after.text.split('\n').length>changed.text.split('\n').length);
        await browser.evaluate(native,`${doc}.querySelector('#show-source').click()`);
        await browser.wait('Show in Sources selects the tag in the formatted view',()=>browser.evaluate(front,editor),
          value=>JSON.stringify(tokens(value.text?.slice(value.head)??'').slice(0,originalTokens.length))===JSON.stringify(originalTokens));
        formatted=true;
      }
      results.push({fixture:name,url:selected.url,length:selected.text.length,head:selected.head,actualEditor:true,formatted});
    }finally{await installed.close();}
  }
  console.log(JSON.stringify({tealiumSources:{preview:fixture.preview,results}}));
}finally{await fixture.close();}
