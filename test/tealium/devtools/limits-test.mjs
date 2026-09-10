import {checkTargetLimits} from './target-limits-check.mjs';
import assert from 'node:assert/strict';
import {installedTealium} from '../installed.mjs';
import {sourceNavigationPackage} from './fixture.mjs';
const fixture=await sourceNavigationPackage(),results=[];
try {
  const targets=await checkTargetLimits(fixture.extensionRoot);
  for(const [name,word,enabled] of [['configured','No verified loaded source',false],['ambiguous','Multiple possible',false],['wrapped','location unavailable',true]]) {
    const installed=await installedTealium({extensionRoot:fixture.extensionRoot,fixtureName:name});
    try {
      const {browser,native,doc,website}=installed;
      await browser.evaluate(native,`${doc}.querySelector('.tag').click()`);
      await browser.call('Target.openDevTools',{targetId:website.targetId});
      await browser.wait('source resolution limit',()=>browser.evaluate(native,`${doc}.querySelector('#source-status').textContent.includes(${JSON.stringify(word)})`));
      assert.equal(await browser.evaluate(native,`${doc}.querySelector('#show-source').disabled`),!enabled);
      assert.equal(await browser.evaluate(native,`${doc}.querySelector('#copy-source').disabled`),!enabled);
      if(enabled) {
        await browser.evaluate(native,`${doc}.querySelector('#show-source').click()`);
        const frontend=await browser.wait('wrapped source frontend',async()=>
          (await browser.call('Target.getTargets')).targetInfos.find(target=>target.url.startsWith('devtools://')&&target.title.includes('/wrapped')));
        const front=await browser.attach(frontend.targetId);
        const selected=await browser.wait('known containing file in Sources',()=>browser.evaluate(front,`(async()=>{const S=await import('./panels/sources/sources.js');const v=S.SourcesPanel.SourcesPanel.instance().sourcesView(),s=v.currentSourceFrame()?.textEditor?.state;return {url:v.currentUISourceCode()?.url(),head:s?.selection?.main?.head,length:s?.doc?.length};})()`),value=>value.url?.endsWith('/wrapped.js')&&value.length>0);
        assert.equal(selected.head,0);
      }
      results.push({fixture:name,enabled,reason:word});
    }finally{await installed.close();}
  }
  console.log(JSON.stringify({tealiumSourceLimits:{preview:fixture.preview,results,targets}}));
}finally{await fixture.close();}
