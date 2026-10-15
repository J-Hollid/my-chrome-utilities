// Review-only capture of local mockups and the built extension in a fresh profile.
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {headlessChromeArguments,resolveChromeExecutable,stopHeadlessChrome,removeChromeProfile} from '../../test/support/headless-chrome.mjs';
import {pageSocket,evaluate,extensionId,wait} from '../../test/support/side-panel-companion/chrome.mjs';
const root=path.resolve('docs/ux-review-2026-09-26');
const profile=await mkdtemp(path.join(os.tmpdir(),'twatility-visual-review-'));
const args=headlessChromeArguments(profile,path.resolve('dist'));
args.splice(-1,0,`--load-extension=${path.resolve('dist')}`);
const chrome=spawn(resolveChromeExecutable(),args,{stdio:['ignore','ignore','pipe'],windowsHide:true});
const report={captures:[],interactions:[],limits:'Synthetic sample data. No production profile or website was used.'};
let socket;
try{
  const port=await new Promise((resolve,reject)=>{
    let stderr='';const timeout=setTimeout(()=>reject(Error('Chrome start timeout')),15000);
    chrome.stderr.on('data',chunk=>{stderr+=chunk;const match=stderr.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);if(match){clearTimeout(timeout);resolve(Number(match[1]));}});
    chrome.once('error',reject);
  });
  await mkdir(path.join(root,'mockups/png'),{recursive:true});
  async function open(url,width,height){
    socket?.close();socket=await pageSocket(port,url);
    await socket.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    for(let i=0;i<100;i++){if(await evaluate(socket,'document.readyState==="complete"'))break;await wait(30);}
    await evaluate(socket,'document.fonts.ready.then(()=>true)');
  }
  async function capture(name){
    const shot=await socket.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await writeFile(path.join(root,name),Buffer.from(shot.data,'base64'));
    const measurement=await evaluate(socket,`({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)})`);
    report.captures.push({name,...measurement});return measurement;
  }
  const variants=[['01-capture',420,980],['02-library',420,1040],['03-studio',1280,900],['04-theme',1280,900],['05-rules',920,1080],['06-flow',1280,900],['07-document',1280,1000],['08-hotkeys',420,1040],['08b-commands',650,900],['09-tealium',420,1000],['index',1280,950]];
  for(const [name,width,height] of variants){
    await open(pathToFileURL(path.join(root,'mockups',name+'.html')).href,width,height);
    const measurement=await capture('mockups/png/'+name+'.png');assert.equal(measurement.overflow,false,name);assert.deepEqual(measurement.brokenImages,[],name);
    if(name==='01-capture'){
      await evaluate(socket,'document.querySelector("#choose-page").click();document.querySelector("#start-capture").click()');
      assert.equal(await evaluate(socket,'document.querySelector("#capture-state").textContent'),'Capturing');
      await capture('mockups/png/01-capture-running.png');report.interactions.push('Capture setup -> ready -> sample event feed');
    }
    if(name==='02-library'){
      await evaluate(socket,'document.querySelector("#toggle-library").click()');
      assert.equal(await evaluate(socket,'document.querySelector("#library-populated").hidden'),false);
      await capture('mockups/png/02-library-populated.png');report.interactions.push('Empty/populated library toggle');
    }
    if(name==='05-rules'){
      await evaluate(socket,'document.querySelector("#rule-value").value="abc";document.querySelector("#rule-value").dispatchEvent(new Event("input"))');
      assert.equal(await evaluate(socket,'document.querySelector("#rule-result").textContent'),'! Does not match the pattern');
      report.interactions.push('Pattern test reports a mismatch');
    }
    if(name==='07-document'){
      await evaluate(socket,'document.querySelector("#heading-color").value="#7b2118";document.querySelector("#heading-color").dispatchEvent(new Event("input"))');
      assert.equal(await evaluate(socket,'document.querySelector("#preview-status").textContent'),'Preview is out of date');
      await evaluate(socket,'document.querySelector("#refresh-preview").click()');
      assert.equal(await evaluate(socket,'getComputedStyle(document.querySelector("#document-preview h2")).color'),'rgb(123, 33, 24)');
      report.interactions.push('Theme edits mark preview stale; Refresh updates it');
    }
    if(name==='08-hotkeys'){
      await evaluate(socket,'document.querySelector("#record-shortcut").click()');
      await socket.call('Input.dispatchKeyEvent',{type:'keyDown',key:'J',code:'KeyJ',modifiers:3,windowsVirtualKeyCode:74});
      await socket.call('Input.dispatchKeyEvent',{type:'keyUp',key:'J',code:'KeyJ',modifiers:3,windowsVirtualKeyCode:74});
      assert.equal(await evaluate(socket,'document.querySelector("#save-shortcut").disabled'),false);
      await capture('mockups/png/08-hotkeys-recording.png');report.interactions.push('Shortcut recorder accepts Ctrl Alt J in preview');
    }
    if(name==='09-tealium'){
      await evaluate(socket,'document.querySelector("#tealium-target").click();document.querySelector("#tealium-start").click()');
      assert.equal(await evaluate(socket,'document.querySelector("#tealium-state").textContent'),'Observing');
      await capture('mockups/png/09-tealium-observing.png');report.interactions.push('Tealium target -> sample inventory');
    }
    await socket.call('Emulation.setDeviceMetricsOverride',{width:360,height:1000,deviceScaleFactor:1,mobile:false});
    assert.equal(await evaluate(socket,'document.documentElement.scrollWidth>innerWidth'),false,name+' narrow');
    if(['05-rules','03-studio'].includes(name))await capture('mockups/png/'+name+'-360.png');
    await socket.call('Emulation.setDeviceMetricsOverride',{width:320,height:1000,deviceScaleFactor:1,mobile:false});
    assert.equal(await evaluate(socket,'document.documentElement.scrollWidth>innerWidth'),false,name+' 320');
  }
  const id=await extensionId(port);
  await open(`chrome-extension://${id}/side-panel.html`,420,900);
  for(let i=0;i<100;i++){if(await evaluate(socket,'!!document.querySelector("#workspace-tab-tealium")'))break;await wait(30);}
  await evaluate(socket,'document.querySelector("#workspace-tab-tealium").click()');await wait(800);
  await mkdir(path.join(root,'evidence/extra'),{recursive:true});
  await capture('evidence/extra/tealium-no-target-420.png');
  report.tealium=await evaluate(socket,'document.querySelector("iframe[title=Tealium]")?.contentDocument?.body?.innerText');
  await evaluate(socket,'document.querySelector("#open-palette").click()');await wait(100);
  await capture('evidence/extra/command-palette-420.png');
  await writeFile(path.join(root,'mockups/validation.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({captures:report.captures.length,interactions:report.interactions,containmentWidths:[320,360],brokenImages:0}));
}finally{socket?.close();await stopHeadlessChrome(chrome);await removeChromeProfile(profile);}
