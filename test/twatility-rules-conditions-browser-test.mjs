import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir,mkdtemp,rm,writeFile} from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import {
  headlessChromeArguments,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "./support/headless-chrome.mjs";

const wait=(milliseconds)=>new Promise((resolve)=>setTimeout(resolve,milliseconds));

class DevtoolsSocket {
  constructor(url){this.url=new URL(url);this.nextId=1;this.pending=new Map();this.buffer=Buffer.alloc(0);this.events=[];}
  async connect(){
    await new Promise((resolve,reject)=>{
      this.socket=net.createConnection({host:this.url.hostname,port:Number(this.url.port)});
      this.socket.once("error",reject);
      this.socket.once("connect",()=>{
        const key=Buffer.from(String(Math.random())).toString("base64");
        this.socket.write([
          `GET ${this.url.pathname}${this.url.search} HTTP/1.1`,
          `Host: ${this.url.host}`,
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Key: ${key}`,
          "Sec-WebSocket-Version: 13",
          "\r\n",
        ].join("\r\n"));
      });
      let handshake="";
      const receive=(chunk)=>{
        handshake+=chunk.toString("binary");
        const end=handshake.indexOf("\r\n\r\n");
        if(end<0)return;
        this.socket.off("data",receive);
        if(!handshake.startsWith("HTTP/1.1 101")){reject(new Error("DevTools WebSocket upgrade failed"));return;}
        const remaining=Buffer.from(handshake.slice(end+4),"binary");
        this.socket.on("data",(data)=>this.receive(data));
        if(remaining.length)this.receive(remaining);
        resolve();
      };
      this.socket.on("data",receive);
    });
  }
  receive(chunk){
    this.buffer=Buffer.concat([this.buffer,chunk]);
    while(this.buffer.length>=2){
      const first=this.buffer[0];let length=this.buffer[1]&0x7f,offset=2;
      if(length===126){if(this.buffer.length<4)return;length=this.buffer.readUInt16BE(2);offset=4;}
      else if(length===127){if(this.buffer.length<10)return;length=Number(this.buffer.readBigUInt64BE(2));offset=10;}
      if(this.buffer.length<offset+length)return;
      const payload=this.buffer.subarray(offset,offset+length);this.buffer=this.buffer.subarray(offset+length);
      if((first&15)!==1)continue;
      const message=JSON.parse(payload.toString("utf8")),pending=this.pending.get(message.id);
      if(!pending){this.events.push(message);continue;}
      this.pending.delete(message.id);
      if(message.error)pending.reject(new Error(message.error.message));else pending.resolve(message.result);
    }
  }
  send(payload){
    const body=Buffer.from(JSON.stringify(payload)),mask=Buffer.from([1,2,3,4]);let header;
    if(body.length<126)header=Buffer.from([0x81,0x80|body.length]);
    else{header=Buffer.alloc(4);header[0]=0x81;header[1]=0x80|126;header.writeUInt16BE(body.length,2);}
    for(let index=0;index<body.length;index+=1)body[index]^=mask[index%4];
    this.socket.write(Buffer.concat([header,mask,body]));
  }
  call(method,params={}){
    const id=this.nextId++;this.send({id,method,params});
    return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));
  }
  close(){this.socket?.destroy();}
}

async function evaluate(socket,expression){
  const result=await socket.call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true,userGesture:true});
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);
  return result.result.value;
}
async function extensionId(port){
  for(let attempt=0;attempt<160;attempt+=1){
    const targets=await fetch(`http://127.0.0.1:${port}/json/list`).then((response)=>response.json());
    const worker=targets.find(({type,url})=>type==="service_worker"&&url.startsWith("chrome-extension://")&&new URL(url).pathname==="/background.js");
    if(worker)return new URL(worker.url).hostname;
    await wait(25);
  }
  throw new Error("Unpacked extension did not load");
}
async function pageSocket(port,url){
  const page=await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,{method:"PUT"}).then((response)=>response.json());
  const socket=new DevtoolsSocket(page.webSocketDebuggerUrl);await socket.connect();
  await socket.call("Runtime.enable");await socket.call("Page.enable");await socket.call("Network.enable");await socket.call("Log.enable");
  return socket;
}
async function ready(socket,expression,label=expression){
  for(let attempt=0;attempt<320;attempt+=1){if(await evaluate(socket,expression))return;await wait(25);}
  throw new Error(`Installed rules UI did not become ready: ${label}`);
}
async function metrics(socket,width,height,url){
  await socket.call("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});
  if(url)await socket.call("Page.navigate",{url});
  await ready(socket,"document.readyState==='complete'","document ready");
  await wait(80);
}
async function screenshot(socket,target){
  const capture=await socket.call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(target,Buffer.from(capture.data,"base64"));
}
async function nativeTab(socket){
  await socket.call("Input.dispatchKeyEvent",{type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});
  await socket.call("Input.dispatchKeyEvent",{type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});
}

const profile=await mkdtemp(path.join(os.tmpdir(),"twatility-rules-conditions-"));
const extensionRoot=path.resolve("dist"),chromeArguments=headlessChromeArguments(profile,extensionRoot);
chromeArguments.splice(-1,0,`--load-extension=${extensionRoot}`);
const chrome=spawn(resolveChromeExecutable(),chromeArguments,{stdio:["ignore","ignore","pipe"]});
const evidenceDirectory=path.resolve(process.env.BRAND_EVIDENCE_DIR??"docs/twatility-branding-evidence/slice-5-rules-conditions");
await mkdir(evidenceDirectory,{recursive:true});
let studio,sidePanel;
try{
  const port=await new Promise((resolve,reject)=>{
    let output="";const timeout=setTimeout(()=>reject(new Error(`Chrome debugging timeout: ${output}`)),15_000);
    chrome.stderr.on("data",(chunk)=>{output+=chunk;const match=output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//u);if(match){clearTimeout(timeout);resolve(Number(match[1]));}});
    chrome.once("error",reject);
  });
  const id=await extensionId(port),base=`chrome-extension://${id}/`,projectId="project-rules-brand";
  studio=await pageSocket(port,`${base}specification-builder.html`);
  await ready(studio,"document.readyState==='complete'");
  const seeded=await evaluate(studio,`(async()=>{
    const {createSpecificationProject}=await import("./data-layer-specification-project.js");
    const {createProjectCollectionEntity}=await import("./data-layer-project-entity-lifecycle.js");
    const {createCanonicalSchema}=await import("./data-layer-canonical-schema.js");
    const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js");
    let sequence=0;const makeId=(kind)=>kind==="project"?${JSON.stringify(projectId)}:kind+":rules:"+sequence++;
    let state=createSpecificationProject({name:"Retail rules workspace",description:"Canonical and contextual rule authoring evidence.",site:"rules.example",id:makeId});
    state=createProjectCollectionEntity(state,"profiles","Commerce foundation",makeId,{});
    state=createProjectCollectionEntity(state,"applicabilitySets","Retail eligibility",makeId,{
      priority:20,
      condition:{kind:"all",conditions:[
        {kind:"predicate",field:"flowId",operator:"equals",value:"flow:checkout"},
        {kind:"any",conditions:[
          {kind:"predicate",field:"payload.market",operator:"is one of",values:["retail","trade"]},
          {kind:"not",conditions:[{kind:"predicate",field:"payload.path",operator:"matches pattern",pattern:"^/internal"}]},
        ]},
      ]},
    });
    state=createProjectCollectionEntity(state,"flows","Checkout flow",makeId,{
      entryCondition:{kind:"all",conditions:[{kind:"predicate",field:"payload.market",operator:"equals",value:"retail"}]},
      exitCondition:{kind:"not",conditions:[{kind:"predicate",field:"payload.status",operator:"equals",value:"blocked"}]},
    });
    state.project.collections.applicabilitySets[0].condition={
      kind:"all",
      conditions:[
        {kind:"predicate",field:"flowId",operator:"equals",value:"flow:checkout"},
        {kind:"any",conditions:[
          {kind:"predicate",field:"payload.market",operator:"is one of",values:["retail","trade"]},
          {kind:"not",conditions:[{kind:"predicate",field:"payload.path",operator:"matches pattern",pattern:"^/internal"}]},
        ]},
      ],
    };
    state.project.collections.flows[0].entryCondition={kind:"all",conditions:[{kind:"predicate",field:"payload.market",operator:"equals",value:"retail"}]};
    state.project.collections.flows[0].exitCondition={kind:"not",conditions:[{kind:"predicate",field:"payload.status",operator:"equals",value:"blocked"}]};
    const profile=state.project.collections.profiles[0],document=createCanonicalSchema({id:"schema:commerce",contributorId:profile.id,contributorName:profile.name});
    const property={id:"property:customer-type",name:"customer_type",order:0,type:"string",presence:{mode:"optional"},allowedValues:[{id:"value:retail",value:"retail"},{id:"value:trade",value:"trade"}],rules:[{id:"rule:retail-code",name:"Retail customer code",kind:"pattern",pattern:"^[A-Z]{2}-",condition:{id:"condition:root",kind:"all",children:[{id:"condition:market",kind:"predicate",propertyId:"property:customer-type",operator:"Equals",value:"retail"}]},severity:"warning",message:"Use the retail code format"}],documentation:{displayText:"Customer type",description:"Commercial customer classification.",comments:"Shared canonical rule evidence.",example:{method:"allowed",value:"retail"}},provenance:[{source:"created"}],overrideReferences:[]};
    document.rootIds=[property.id];document.nodes={[property.id]:property};document.selectedPropertyId=property.id;profile.canonicalSchema=document;
    const release={id:"release:rules:2",name:"Release 2",revision:2,createdAt:"2026-07-26T17:00:00.000Z",snapshot:structuredClone(state.project.collections)};
    state.project.releases=[release];state.project.currentRelease=release.id;
    state.draft={id:"draft:rules",status:"Saved",updatedAt:"2026-07-26T17:00:00.000Z"};
    const repository=await openIndexedDbProjectRepository();
    await repository.putProjectMetadataOnly(state,{active:true,draftToken:"rules-token-5",draftSequence:5,publishedRevision:2,navigation:{kind:"profiles"}});
    return (await repository.activeProjectId())===${JSON.stringify(projectId)};
  })()`);
  assert.equal(seeded,true);

  const route=(kind)=>`${base}specification-builder.html?project=${projectId}&kind=${kind}`;
  const openNamed=async(kind,name)=>{
    await metrics(studio,1280,900,route(kind));
    await ready(studio,"!document.querySelector('#project-workspace').hidden","Studio project route");
    await evaluate(studio,`(()=>{const control=[...document.querySelectorAll('#workspace-content .entity-row button')].find(({textContent})=>textContent.trim().startsWith(${JSON.stringify(name)}));if(!control)throw new Error('Missing entity route ${name}');control.click();})()`);
    await ready(studio,"document.querySelector('#workspace-content .contextual-editor form')?.isConnected","entity workspace");
  };
  const openCanonicalRuleTree=async()=>{
    for(let attempt=0;attempt<3;attempt+=1){
      if(!await evaluate(studio,"document.querySelector('[aria-label=\"Flat When condition list\"]')?.isConnected")){
        await evaluate(studio,`(()=>{const root=document.querySelector('[aria-label="Builder canonical schema editor"]');let rule=[...document.querySelectorAll('[data-rule-id="rule:retail-code"]')].at(-1);if(!rule){root.querySelector('[data-property-id] [aria-label^="Property actions"]').click();[...document.querySelectorAll('[data-property-context-menu="true"] button')].find(({textContent})=>textContent.trim()==='Rules').click();rule=[...document.querySelectorAll('[data-rule-id="rule:retail-code"]')].at(-1);}const edit=[...rule.querySelectorAll('button')].find(({textContent})=>textContent.trim()==='Edit');edit.click();})()`);
      }
      let connected=false;
      for(let poll=0;poll<80;poll+=1){
        if(await evaluate(studio,"document.querySelector('[aria-label=\"Flat When condition list\"]')?.isConnected")){connected=true;break;}
        await wait(25);
      }
      if(!connected)continue;
      await wait(100);
      if(await evaluate(studio,"document.querySelector('[aria-label=\"Flat When condition list\"]')?.isConnected"))return;
    }
    throw new Error("Canonical shared condition tree did not settle");
  };
  const inspect=async(socket,rootSelector)=>evaluate(socket,`(()=>{
    const root=document.querySelector(${JSON.stringify(rootSelector)}),controls=[...root.querySelectorAll('button,input,select,textarea,summary')];
    const fingerprint=()=>controls.map((control)=>({tag:control.tagName,id:control.id,name:control.getAttribute('name'),type:control.getAttribute('type'),role:control.getAttribute('role'),hidden:control.hidden,disabled:control.disabled,aria:[...control.attributes].filter(({name})=>name.startsWith('aria-')).map(({name,value})=>[name,value])}));
    const branded=fingerprint(),sheet=[...document.styleSheets].map(({ownerNode})=>ownerNode).find((node)=>node?.href?.endsWith('/schema-authoring-brand.css'));
    sheet.disabled=true;const unbranded=fingerprint();sheet.disabled=false;
    const unnamed=controls.filter((control)=>!((control.getAttribute('aria-label')||control.textContent||control.value||'').trim())&&!control.labels?.length).map(({tagName})=>tagName);
    const broken=[...root.querySelectorAll('[aria-controls],[aria-labelledby],[aria-describedby]')].flatMap((element)=>['aria-controls','aria-labelledby','aria-describedby'].flatMap((name)=>(element.getAttribute(name)||'').split(/\\s+/).filter(Boolean).filter((id)=>!document.getElementById(id)).map((id)=>name+':'+id)));
    const rect=root.getBoundingClientRect(),horizontalOut=[...root.querySelectorAll('[data-condition-kind],button,input,select,textarea')].filter((element)=>{const bounds=element.getBoundingClientRect();return bounds.width&&(bounds.left<-.5||bounds.right>innerWidth+.5);}).map((element)=>element.getAttribute('aria-label')||element.textContent?.trim()||element.tagName);
    const localTreeOut=[...root.querySelectorAll('[aria-label="Flat When condition list"],[aria-label="Shared editable condition tree"],[aria-label="Shared editable project condition tree"]')].flatMap((tree)=>{const container=tree.getBoundingClientRect();return[...tree.querySelectorAll('[data-condition-kind],button,input,select,textarea,label')].filter((element)=>{const bounds=element.getBoundingClientRect();return bounds.width&&(bounds.left<container.left-.5||bounds.right>container.right+.5);}).map((element)=>element.getAttribute('aria-label')||element.textContent?.trim()||element.tagName);});
    return{equivalent:JSON.stringify(branded)===JSON.stringify(unbranded),unnamed,broken,horizontalOut,localTreeOut,overflow:document.documentElement.scrollWidth>innerWidth+1||rect.left<-.5||rect.right>innerWidth+.5||horizontalOut.length>0||localTreeOut.length>0,width:innerWidth,height:innerHeight,controls:controls.length};
  })()`);

  await openNamed("profiles","Commerce foundation");
  await ready(studio,"document.querySelector('[aria-label=\"Builder canonical schema editor\"] [data-property-id]')?.isConnected","canonical property");
  studio.events.length=0;
  await openCanonicalRuleTree();
  const canonical1280=await inspect(studio,':modal [data-focused-property-editor="true"]');
  assert.equal(await evaluate(studio,"Boolean(document.querySelector('[data-rule-id=\"rule:retail-code\"] [aria-label=\"Rule match mode\"]')?.value==='all'&&document.querySelector('[data-rule-id=\"rule:retail-code\"] [data-condition-kind=\"predicate\"]')&&!document.querySelector('[data-rule-id=\"rule:retail-code\"] button:is([aria-label=\"View\"],[aria-label=\"Add child\"])'))"),true);
  await evaluate(studio,"document.querySelector('[aria-label=\"Flat When condition list\"]').scrollIntoView({block:'center'})");
  await wait(50);
  await screenshot(studio,path.join(evidenceDirectory,"canonical-rules-1280x900.png"));
  const focusBefore=await evaluate(studio,"(()=>{const control=document.querySelector('[aria-label=\"Flat When condition list\"] [aria-label=\"Rule match mode\"]');control.focus();return control===document.activeElement;})()");
  assert.equal(focusBefore,true);await nativeTab(studio);
  assert.equal(await evaluate(studio,"document.activeElement?.getAttribute('aria-label')!=='Rule match mode'"),true,"native Tab advances within the installed flat condition list");
  await metrics(studio,360,800);
  await openCanonicalRuleTree();
  await evaluate(studio,"document.querySelector('[aria-label=\"Flat When condition list\"]').scrollIntoView({block:'center'})");
  await wait(50);
  const canonical360=await inspect(studio,':modal [data-focused-property-editor="true"]');
  await screenshot(studio,path.join(evidenceDirectory,"canonical-rules-360x800.png"));

  await openNamed("applicabilitySets","Retail eligibility");
  await ready(studio,"document.querySelector('[aria-label=\"Shared editable project condition tree\"]')?.isConnected","project condition tree");
  const originalCondition=await evaluate(studio,`(async()=>{const record=await (await (await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository()).loadProject(${JSON.stringify(projectId)});return{condition:record.state.project.collections.applicabilitySets[0].condition,sequence:record.draftSequence,published:record.publishedRevision};})()`);
  const nested=await evaluate(studio,"(()=>{const root=document.querySelector('[aria-label=\"Shared editable project condition tree\"]');return{groups:[...root.querySelectorAll('[data-condition-kind=\"group\"]')].map(({dataset})=>dataset.conditionPath),predicates:[...root.querySelectorAll('[data-condition-kind=\"predicate\"]')].map((row)=>({path:row.dataset.conditionPath,field:row.querySelector('[aria-label=\"Condition field\"]').value,operator:row.querySelector('[aria-label=\"Condition operator\"]').value}))};})()");
  assert.deepEqual(nested.groups,["root","1","1.1"]);
  assert.deepEqual(nested.predicates.map(({field})=>field),["flowId","payload.market","payload.path"]);
  await evaluate(studio,"document.querySelector('[aria-label=\"Shared editable project condition tree\"]').scrollIntoView({block:'center'})");
  await wait(50);
  const applicability1280=await inspect(studio,'[aria-label="Shared editable project condition tree"]');
  await screenshot(studio,path.join(evidenceDirectory,"studio-applicability-1280x900.png"));
  await evaluate(studio,"(()=>{const root=document.querySelector('[aria-label=\"Shared editable project condition tree\"]'),field=[...root.querySelectorAll('[aria-label=\"Condition field\"]')].find(({value})=>value==='payload.path');field.value='payload.route';field.dispatchEvent(new Event('input',{bubbles:true}));field.closest('form').requestSubmit();})()");
  await ready(studio,`(async()=>{const record=await (await (await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository()).loadProject(${JSON.stringify(projectId)});return record.draftSequence===${originalCondition.sequence+1}&&JSON.stringify(record.state.project.collections.applicabilitySets[0].condition).includes('payload.route');})()`,"project condition save");
  await evaluate(studio,"document.querySelector('#undo-project').click()");
  await ready(studio,`(async()=>{const record=await (await (await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository()).loadProject(${JSON.stringify(projectId)});return JSON.stringify(record.state.project.collections.applicabilitySets[0].condition)===${JSON.stringify(JSON.stringify(originalCondition.condition))};})()`,"project condition Undo");
  await openNamed("applicabilitySets","Retail eligibility");
  assert.equal(await evaluate(studio,"[...document.querySelectorAll('[aria-label=\"Condition field\"]')].some(({value})=>value==='payload.path')"),true,"the exact tree restored by Undo survives reload");
  const restored=await evaluate(studio,`(async()=>{const record=await (await (await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository()).loadProject(${JSON.stringify(projectId)});return{condition:record.state.project.collections.applicabilitySets[0].condition,published:record.publishedRevision};})()`);
  assert.deepEqual(restored,{condition:originalCondition.condition,published:originalCondition.published});

  sidePanel=await pageSocket(port,`${base}side-panel.html`);
  await metrics(sidePanel,360,800);
  await ready(sidePanel,"document.querySelector('#data-layer-view-schemas')?.isConnected","side-panel Schemas tab");
  await evaluate(sidePanel,"document.querySelector('#data-layer-view-schemas').click()");
  await ready(sidePanel,"document.querySelector('[data-schema-entry-key^=\"profiles:\"]')?.isConnected","profile schema entry");
  await evaluate(sidePanel,"(()=>{const entry=document.querySelector('[data-schema-entry-key^=\"profiles:\"]'),open=[...entry.querySelectorAll('button')].find(({textContent})=>textContent.trim()==='Open schema');open.click();})()");
  await ready(sidePanel,"document.querySelector('[data-schema-presentation=\"compact-panel\"] [data-schema-property-canonical-path=\"/customer_type\"]')?.isConnected","compact canonical property");
  await evaluate(sidePanel,"document.querySelector('[data-schema-property-canonical-path=\"/customer_type\"]').click()");
  await ready(sidePanel,"document.querySelector('[aria-label^=\"Nested rule predicate\"] [aria-label=\"Flat When condition list\"]')?.isConnected","compact shared rule condition");
  await evaluate(sidePanel,"document.querySelector('[aria-label^=\"Nested rule predicate\"] [aria-label=\"Flat When condition list\"]').scrollIntoView({block:'center'})");
  await wait(50);
  const side360=await inspect(sidePanel,'[data-schema-presentation="compact-panel"]');
  await screenshot(sidePanel,path.join(evidenceDirectory,"side-panel-rules-360x800.png"));

  for(const result of [canonical1280,canonical360,applicability1280,side360]){
    assert.equal(result.equivalent,true,`${result.width}px control equivalence`);
    assert.deepEqual(result.unnamed,[],`${result.width}px accessible control names`);
    assert.deepEqual(result.broken,[],`${result.width}px ARIA references`);
    assert.deepEqual(result.localTreeOut,[],`${result.width}px local condition-tree containment`);
    assert.equal(result.overflow,false,`${result.width}px rules viewport overflow`);
  }
  const runtimeErrors=[...studio.events,...sidePanel.events].filter(({method,params})=>method==="Runtime.exceptionThrown"||(method==="Log.entryAdded"&&params.entry.level==="error")||(method==="Network.loadingFailed"&&!params.canceled));
  assert.deepEqual(runtimeErrors,[],"packaged rules/conditions runtime and local-load errors");
  const report={
    projectId,
    masterCutoff:"7edae41131a4e6a282d80f67a2fbcfbada52beb3",
    sharedMounts:["canonical Rules","composed Rules","compact side-panel predicate","Studio project Condition adapter"],
    nested,
    persistence:{before:originalCondition,restored,oneCommand:true,undoRestored:true},
    viewports:[canonical1280,canonical360,applicability1280,side360],
    runtimeErrors:runtimeErrors.length,
  };
  await writeFile(path.join(evidenceDirectory,"report.json"),`${JSON.stringify(report,null,2)}\n`);
  console.log("TWAtility Belt packaged rules and conditions browser test passed");
}finally{
  studio?.close();sidePanel?.close();await stopHeadlessChrome(chrome);
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
