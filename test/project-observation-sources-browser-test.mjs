import {observeSourceKeyboard} from "./project-observation-sources/browser/keyboard.mjs";
import {runInstalledSourceSuites} from "./project-observation-sources/browser/suites.mjs";
import {observeInstalledSourceReconfiguration} from "./project-observation-sources/browser/reconfiguration.mjs";
import {observeInstalledSourceLifecycle} from "./project-observation-sources/browser/lifecycle.mjs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir,mkdtemp} from "node:fs/promises";
import path from "node:path";
import {headlessChromeArguments,resolveChromeExecutable,stopHeadlessChrome,removeChromeProfile} from "./support/headless-chrome.mjs";
import {evaluate,extensionId,pageSocket} from "./project-observation-sources/browser/chrome.mjs";
import {seedObservationProject,installObservationTarget,observeTwoInstalledSources} from "./project-observation-sources/browser/installed.mjs";
await mkdir("tmp",{recursive:true});
const profile=await mkdtemp(path.resolve("tmp/observation-sources-chrome-")),extensionRoot=path.resolve("dist");
const args=headlessChromeArguments(profile,extensionRoot);args.splice(-1,0,`--load-extension=${extensionRoot}`);
const chrome=spawn(resolveChromeExecutable(),args,{stdio:["ignore","ignore","pipe"],env:{...process.env,XDG_CONFIG_HOME:path.join(profile,"config"),XDG_DATA_HOME:path.join(profile,"data")}});
let side;
try {
  const port=await new Promise((resolve,reject)=>{
    let output="";const timer=setTimeout(()=>reject(new Error("Chrome startup: "+output)),15000);
    chrome.stderr.on("data",chunk=>{output+=chunk;const match=output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);
      if(match){clearTimeout(timer);resolve(Number(match[1]));}});
    chrome.once("error",reject);
    chrome.once("exit",(code,signal)=>{clearTimeout(timer);reject(new Error(`Chrome exited: ${code} ${signal} ${output}`));});
  });
  const base=`chrome-extension://${await extensionId(port)}/`;
  const open=async(options={})=>{
    if(side){await side.call('Page.close');side.close();}
    side=await pageSocket(port,base+"manifest.json");
    await evaluate(side,'localStorage.clear()');
    await evaluate(side,`(${seedObservationProject.toString()})(${JSON.stringify(options)})`);
    await side.call("Page.addScriptToEvaluateOnNewDocument",{source:`(${installObservationTarget.toString()})()`});
    await side.call("Page.navigate",{url:base+"side-panel.html"});
    await side.call("Emulation.setDeviceMetricsOverride",{width:options.width??360,height:800,deviceScaleFactor:1,mobile:false});
    return side;
  };
  if(process.env.OBSERVATION_SOURCE_CASE&&process.env.OBSERVATION_SOURCE_CASE!=='keyboard') {
    console.log(JSON.stringify({projectObservationContracts:await runInstalledSourceSuites(open,process.env.OBSERVATION_SOURCE_CASE)}));
  } else {
  await open();

  const report=await evaluate(side,`(${observeTwoInstalledSources.toString()})()`);
  console.log(JSON.stringify({projectObservationSources:report}));
  assert.equal(report.capturedNames,true);assert.equal(report.samePayloadSeparate,true);
  assert.equal(report.filterCount,"4 events");assert.equal(report.rows,2);assert.equal(report.overflow,false);
  if(process.env.OBSERVATION_SOURCE_CASE==="keyboard") {
    console.log(JSON.stringify({projectObservationKeyboard:await observeSourceKeyboard(side)}));
  } else {
  const lifecycle=await evaluate(side,`(${observeInstalledSourceLifecycle.toString()})()`);
  console.log(JSON.stringify({projectObservationLifecycle:lifecycle}));
  for(const name of ["whileDisabled","catchup","oldLabel","newLabel","duplicateRejected","confirmationRequired","removedDetached"])
    assert.equal(lifecycle[name],true,name);
  assert.equal(lifecycle.subscriptions,1);assert.equal(lifecycle.pushDefault,"commandQueue");assert.equal(lifecycle.overflow,false);
  const reconfiguration=await evaluate(side,`(${observeInstalledSourceReconfiguration.toString()})()`);
  console.log(JSON.stringify({projectObservationReconfiguration:reconfiguration}));
  for(const name of ["oldPathDetached","oldPathRetained","newIdentity","joinedOnce","replacedOnce","oldArrayDetached","cleanupPreserved","stopped"])
    assert.equal(reconfiguration[name],true,name);
  console.log(JSON.stringify({projectObservationKeyboard:await observeSourceKeyboard(side)}));
  }
  if(!process.env.OBSERVATION_SOURCE_CASE)console.log(JSON.stringify({projectObservationContracts:await runInstalledSourceSuites(open)}));
  }
} catch(error) {
  console.error(JSON.stringify({browserErrors:side?.events.filter(event=>event.method==="Runtime.exceptionThrown"||event.method==="Log.entryAdded")}));
  throw error;
} finally {
  side?.close();await stopHeadlessChrome(chrome);await removeChromeProfile(profile,{targetId:"project-observation-sources"});
}
