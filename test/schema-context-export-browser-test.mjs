import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir,mkdtemp,writeFile,readFile} from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {headlessChromeArguments,resolveChromeExecutable,stopHeadlessChrome,removeChromeProfile} from "./support/headless-chrome.mjs";
import {wait,evaluate,extensionId,pageSocket} from "./support/side-panel-companion/chrome.mjs";
import {seedContextExportProject} from "./support/schema-context-export/fixture.mjs";
import {openSidePanelHost,observeContextExport,openFlowExportHost,productionOccurrenceOutcomes} from "./support/schema-context-export/browser-probes.mjs";
import {prepareCompatibilityExport,observeCompatibilityExport,prepareLongRevision} from "./support/schema-context-export/compatibility.mjs";
import {prepareExportEdit,observeUnconfirmedExportEdit,observeStaleAndFailedExports} from "./support/schema-context-export/interactions.mjs";

await mkdir("tmp",{recursive:true});
const profile=await mkdtemp(path.resolve("tmp/schema-context-chrome-")),extensionRoot=path.resolve("dist");
const args=headlessChromeArguments(profile,extensionRoot);args.splice(-1,0,`--load-extension=${extensionRoot}`);
const chrome=spawn(resolveChromeExecutable(),args,{stdio:["ignore","ignore","pipe"],env:{...process.env,XDG_CONFIG_HOME:path.join(profile,"config")} });
const sockets=[],reports=[],layouts=[];
let downloadSequence=0;
async function observe(socket,keyboard=false){
  const downloadPath=path.join(profile,`downloads-${++downloadSequence}`);await mkdir(downloadPath);
  await socket.call("Browser.setDownloadBehavior",{behavior:"allow",downloadPath});
  await socket.call("Page.bringToFront");
  const pending=evaluate(socket,`(${observeContextExport.toString()})(${keyboard})`);
  if(keyboard){
    for(let n=0;n<100;n++){if(await evaluate(socket,"window.contextExportKeyboardReady===true"))break;await wait(50);}
    await socket.call("Input.dispatchKeyEvent",{type:"rawKeyDown",key:"Enter",code:"Enter",windowsVirtualKeyCode:13});
    await socket.call("Input.dispatchKeyEvent",{type:"char",text:"\r",unmodifiedText:"\r"});
    await socket.call("Input.dispatchKeyEvent",{type:"keyUp",key:"Enter",code:"Enter",windowsVirtualKeyCode:13});
  }
  const report=await pending;
  for(let n=0;n<100;n++){try{report.fileText=await readFile(path.join(downloadPath,report.downloaded.filename),"utf8");break;}catch(error){if(error.code!=="ENOENT")throw error;await wait(50);}}
  assert.equal(report.fileText,report.text,"Completed browser download matches preview");
  assert.equal(report.unchanged,true,"Repository and revision tokens stay unchanged");
  return report;
}
const longOnly=process.env.SCHEMA_CONTEXT_EXPORT_DIAGNOSTIC==="long";
const flowOnly=process.env.SCHEMA_CONTEXT_EXPORT_DIAGNOSTIC==="flow";
const interactionOnly=process.env.SCHEMA_CONTEXT_EXPORT_DIAGNOSTIC==="interaction";
try{
  const port=await new Promise((resolve,reject)=>{let output="";const timer=setTimeout(()=>reject(new Error(`Chrome startup failed: ${output}`)),15000);chrome.stderr.on("data",chunk=>{output+=chunk;const match=output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);if(match){clearTimeout(timer);resolve(Number(match[1]));}});chrome.once("error",reject);});
  const base=`chrome-extension://${await extensionId(port)}/`;
  const side=await pageSocket(port,`${base}side-panel.html`);sockets.push(side);
  await evaluate(side,`(${seedContextExportProject.toString()})()`);
  await side.call("Page.reload");
  await side.call("Emulation.setDeviceMetricsOverride",{width:360,height:760,deviceScaleFactor:1,mobile:false});
  await wait(500);
  const hosts=[
    ["Saved Schema Draft editor","saved:schema:export",false],
    ["Saved Schema revision viewer","saved:schema:export",true],
    ["Shared Profile","profiles:profile:sitewide",false],
    ["Property Set","propertySets:set:checkout",false],
    ["Page","pages:page:cart",false],
    ["Event","events:event:purchase",false],
    ["Flow Page instance","flowInstances:flow:checkout:frame:cart",false],
    ["Event occurrence","occurrences:flow:checkout:occurrence:purchase",false],
  ];
  for(const [host,key,revision]of flowOnly||interactionOnly||longOnly?[]:hosts){
    await evaluate(side,`(${openSidePanelHost.toString()})(${JSON.stringify(key)},${revision})`);
    const report=await observe(side);
    assert.equal(report.clipboard,report.text,host);assert.equal(report.downloaded?.text,report.text,host);
    assert.equal(report.downloaded.mime,"application/schema+json");assert.equal(report.focusReturned,true);
    const document=JSON.parse(report.text),ajv=new Ajv2020({strict:false});assert.equal(ajv.validateSchema(document),true,JSON.stringify(ajv.errors));
    for(const control of report.controls){assert.ok(control.left>=0&&control.right<=report.width&&control.top>=0&&control.bottom<=report.height,JSON.stringify(control));}
    if(host==="Saved Schema Draft editor"){assert.equal(document.$id,undefined);assert.equal(document.properties.draft.type,"number");}
    if(revision){assert.match(document.$id,/revisions\/4$/);assert.equal(document.properties.published.type,"string");}
    reports.push({host,surface:"Side panel",...report});console.error(`Context export browser: ${host} passed`);
    await side.call("Page.reload");await wait(350);
  }
  for(const [host,kind,entity]of [["Shared Profile","profiles","profile:sitewide"],["Property Set","propertySets","set:checkout"],["Page","pages","page:cart"],["Event","events","event:purchase"],["Flow Page instance","flows","frame:cart"],["Event occurrence","flows","occurrence:purchase"]]){
    if(longOnly||interactionOnly||flowOnly&&kind!=="flows")continue;
    const studio=await pageSocket(port,`${base}specification-builder.html?project=project%3Aexport&kind=${kind}&entity=${encodeURIComponent(kind==="flows"?"flow:checkout":entity)}`);sockets.push(studio);
    await studio.call("Emulation.setDeviceMetricsOverride",{width:1280,height:900,deviceScaleFactor:1,mobile:false});await wait(350);
    if(kind==="flows")await evaluate(studio,`(${openFlowExportHost.toString()})(${JSON.stringify(entity.startsWith("frame:")?"page":"occurrence")},${JSON.stringify(entity)})`);
    const report=await observe(studio);
    assert.equal(report.header,true,host);assert.equal(report.clipboard,report.text);assert.equal(report.downloaded.text,report.text);assert.equal(report.focusReturned,true);
    new Ajv2020({strict:false}).compile(JSON.parse(report.text));
    if(host==="Shared Profile"){
      await evaluate(studio,`[...document.querySelectorAll('button')].find(button=>button.textContent==='Table'&&button.getClientRects().length).click()`);
      const table=await observe(studio);assert.deepEqual(JSON.parse(table.text),JSON.parse(report.text));assert.ok(table.header&&table.filtered);
      layouts.push({surface:"Studio",tree:report,table});
    }
    reports.push({host,surface:kind==="flows"?"Flow workspace":"Studio",...report});console.error(`Context export browser: ${host} ${kind==="flows"?"Flow workspace":"Studio"} passed`);
  }
  const payload={kind:"purchase",amount:10,currency:"EUR",products:[{name:"Book"}]};
  const payloads=[payload,{...payload,amount:9},{kind:"purchase",amount:10,products:[{name:"Book"}]},{kind:"view",amount:10,products:[{name:"Book"}]},{...payload,products:[{name:"Book"},{}]},{...payload,tracking:true},{...payload,debug:true}];
  const expected=[true,false,false,true,false,false,false];
  const production=await evaluate(side,`(${productionOccurrenceOutcomes.toString()})(${JSON.stringify(payloads)})`);
  assert.deepEqual(production,expected,"Production occurrence validation");
  for(const report of reports.filter(row=>row.host==="Event occurrence")){const validate=new Ajv2020({strict:false}).compile(JSON.parse(report.text));assert.deepEqual(payloads.map(payload=>validate(payload)),production,`Validator parity: ${report.surface}`);}
  let edit,failures,compatibility,longRevision;
  if(!flowOnly&&!longOnly){
    await evaluate(side,`(${prepareExportEdit.toString()})()`);
    const editing=await pageSocket(port,`${base}specification-builder.html?project=project%3Aexport&kind=profiles&entity=profile%3Asitewide`);sockets.push(editing);
    edit=await evaluate(editing,`(${observeUnconfirmedExportEdit.toString()})()`);
    assert.equal(edit.initial,"10");assert.equal(edit.disabled.disabled,true);assert.match(edit.disabled.reason,/Confirm or cancel/);assert.ok(edit.accepted===20||JSON.stringify(edit.accepted)==="[20]");
    const page=await pageSocket(port,`${base}specification-builder.html?project=project%3Aexport&kind=pages&entity=page%3Acart`);sockets.push(page);
    failures=await evaluate(page,`(${observeStaleAndFailedExports.toString()})()`);
    assert.ok(failures.stale.copyDisabled&&failures.stale.downloadDisabled&&failures.stale.textUnchanged);
    assert.match(failures.refreshed,/Updated parent currency/);assert.equal(failures.copied,failures.refreshed);
    assert.ok(failures.clipboardFailure.otherEnabled&&failures.downloadFailure.otherEnabled);assert.equal(failures.downloads,1);
    console.error("Context export browser: staged edits, parent changes, and boundary retries passed");
  }
  if(!flowOnly&&!longOnly){
    await evaluate(side,`(${prepareCompatibilityExport.toString()})()`);
    const lossy=await pageSocket(port,`${base}specification-builder.html?project=project%3Aexport&kind=profiles&entity=profile%3Asitewide`);sockets.push(lossy);
    compatibility=await evaluate(lossy,`(${observeCompatibilityExport.toString()})()`);
    assert.ok(compatibility.blocked&&compatibility.unchanged,JSON.stringify(compatibility));assert.deepEqual(compatibility.cancelled,{writes:0,downloads:0});
    assert.match(compatibility.review,/Partner amount check.*amount/);assert.match(compatibility.completion,/1 omitted rule/);
    assert.equal(compatibility.clipboard,compatibility.downloaded);
    const compatible=new Ajv2020({strict:false}).compile(JSON.parse(compatibility.downloaded));
    assert.equal(compatible({...payload,amount:20}),true);assert.equal(compatible({...payload,amount:2000}),false);
    console.error("Context export browser: compatibility passed");
  }
  if(!flowOnly){
    console.error("Context export browser: prepare long revision");
    const names=await evaluate(side,`(${prepareLongRevision.toString()})()`);
    await side.call("Page.reload");await wait(350);
    await evaluate(side,`(${openSidePanelHost.toString()})("saved:schema:export",true)`);
    console.error("Context export browser: long viewer open");
    longRevision=await observe(side,true);
    assert.ok(longRevision.jsonScrolls&&longRevision.focusReturned&&longRevision.routeUnchanged);
    assert.deepEqual(Object.keys(JSON.parse(longRevision.text).properties),names);
    for(const control of longRevision.controls)assert.ok(control.left>=0&&control.right<=360&&control.bottom<=760);
    console.error("Context export browser: compatibility cancellation and long read-only keyboard export passed");
  }
  const output={schemaContextExport:{hosts:reports,layouts,parity:{payloads,production},edit,failures,compatibility,longRevision}};
  await writeFile("tmp/schema-context-export-browser.json",`${JSON.stringify(output,null,2)}\n`);
  console.log(JSON.stringify(output));
}finally{for(const socket of sockets)socket.close();await stopHeadlessChrome(chrome);await removeChromeProfile(profile);}
