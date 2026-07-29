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
  throw new Error(`Installed Slice 6 UI did not become ready: ${label}`);
}
async function metrics(socket,width,height,url){
  await socket.call("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});
  if(url)await socket.call("Page.navigate",{url});
  await ready(socket,"document.readyState==='complete'","document ready");
  await wait(100);
}
async function screenshot(socket,target){
  const capture=await socket.call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(target,Buffer.from(capture.data,"base64"));
}
async function nativeKey(socket,key,code=key){
  await socket.call("Input.dispatchKeyEvent",{type:"keyDown",key,code});
  await socket.call("Input.dispatchKeyEvent",{type:"keyUp",key,code});
}

const profile=await mkdtemp(path.join(os.tmpdir(),"twatility-workflow-polish-"));
const extensionRoot=path.resolve("dist"),chromeArguments=headlessChromeArguments(profile,extensionRoot);
chromeArguments.splice(-1,0,`--load-extension=${extensionRoot}`);
const chrome=spawn(resolveChromeExecutable(),chromeArguments,{stdio:["ignore","ignore","pipe"]});
const evidenceDirectory=path.resolve(process.env.BRAND_EVIDENCE_DIR??"docs/twatility-branding-evidence/slice-6-workflows");
await mkdir(evidenceDirectory,{recursive:true});
let side,studio;
try{
  const port=await new Promise((resolve,reject)=>{
    let output="";const timeout=setTimeout(()=>reject(new Error(`Chrome debugging timeout: ${output}`)),15_000);
    chrome.stderr.on("data",(chunk)=>{output+=chunk;const match=output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//u);if(match){clearTimeout(timeout);resolve(Number(match[1]));}});
    chrome.once("error",reject);
  });
  const id=await extensionId(port),base=`chrome-extension://${id}/`,projectId="project-polish";
  side=await pageSocket(port,`${base}side-panel.html`);
  await ready(side,"document.querySelector('#data-layer-view-projects')?.isConnected","side panel");
  const seeded=await evaluate(side,`(async()=>{
    const {createSpecificationProject}=await import("./data-layer-specification-project.js");
    const {createProjectCollectionEntity}=await import("./data-layer-project-entity-lifecycle.js");
    const {configureProjectEventTransport}=await import("./data-layer-project-event-transport.js");
    const {openIndexedDbProjectRepository}=await import("./data-layer-durable-project-repository.js");
    let sequence=0;const makeId=(kind)=>kind==="project"?${JSON.stringify(projectId)}:kind+":polish:"+(++sequence);
    let state=createSpecificationProject({name:"Retail measurement operations",description:"Long-form production workflow evidence across every remaining surface.",site:"retail-measurement-operations.example.com",id:makeId});
    for(const [kind,name,values] of[
      ["profiles","Commerce foundation",{}],
      ["pageGroups","Checkout customers",{}],
      ["pages","Checkout confirmation",{eventName:"pageview"}],
      ["events","Purchase completed",{eventName:"purchase"}],
      ["applicabilitySets","Retail customers",{}],
      ["flows","Checkout journey",{}],
      ["fixtures","Valid checkout",{}],
    ])state=createProjectCollectionEntity(state,kind,name,makeId,values);
    const profile=state.project.collections.profiles[0],page=state.project.collections.pages[0],group=state.project.collections.pageGroups[0],event=state.project.collections.events[0],flow=state.project.collections.flows[0];
    state=createProjectCollectionEntity(state,"assignments","Purchase payload",makeId,{targetKind:"Shared Profile",targetId:profile.id,eventId:event.id,applicabilitySetId:state.project.collections.applicabilitySets[0].id});
    state=configureProjectEventTransport(state,{observationHistoryPath:"event.history",defaultPushPath:"dataLayer"});
    state.project.documentationFlowGraphs={[flow.id]:{pageGroupIds:[group.id],pageFrames:[{id:"frame:polish",name:page.name,pageId:page.id,pageGroupId:group.id,position:{x:120,y:80}}],occurrences:[{id:"occurrence:polish",name:event.name,pageFrameId:"frame:polish",pageId:page.id,eventId:event.id,role:"interaction",obligation:"Required",minimum:1,maximum:1,optional:false,position:{x:210,y:150}}],relationships:[]}};
    state.project.documentation={
      themes:[{id:"theme:polish",name:"Client navy",clientName:"Retail measurement",logo:"",colors:{heading:"#0b3155",accent:"#c7921e",stripe:"#f4e7c9"},typography:{family:"Arial",headingSize:16,bodySize:11},density:"comfortable",borders:true,striping:true,highlightedHeadings:true,columnWidths:{Property:24},headerText:"Retail measurement specification",footerText:"Reviewed Draft"}],
      sets:[{id:"set:polish",name:"Retail implementation specification",themeId:"theme:polish",sections:[{id:"section:overview",kind:"overview",name:"Overview",selected:true},{id:"section:flow",kind:"flow",name:"Checkout journey",targetId:flow.id,selected:true,configuration:{contextIds:[],paths:[],columns:[]}},{id:"section:matrix",kind:"matrix",name:"Data capture matrix",selected:true,configuration:{contextIds:[]}}]}],
    };
    state.draft={id:"draft:polish",status:"Saved",updatedAt:"2026-07-26T20:30:00.000Z"};
    const repository=await openIndexedDbProjectRepository();
    await repository.putProjectMetadataOnly(state,{active:true,draftToken:"polish-9",draftSequence:9,publishedRevision:0,navigation:{kind:"pages"}});
    await repository.saveSavedSchema({schema:{id:"schema:polish",name:"Purchase payload",version:2,published:true,document:{type:"object",properties:{event:{type:"string"}}},assignments:[],attachedRules:[],documentation:{}},label:"Seed Purchase payload"});
    return await repository.activeProjectId()===${JSON.stringify(projectId)};
  })()`);
  assert.equal(seeded,true,"production project and Saved Schema must seed");
  await side.call("Page.reload",{ignoreCache:true});
  await ready(side,"document.querySelector('#active-project-header')?.textContent.includes('Retail measurement operations')","active project");

  await metrics(side,360,800);
  const live=await evaluate(side,`(async()=>{
    document.querySelector("#data-layer-view-live").click();document.querySelector("#data-layer-settings").open=true;
    await new Promise(resolve=>setTimeout(resolve,80));
    const ids=["project-transport-context","history-path","history-path-status","default-push-path","default-push-path-status"];
    const controls=[...document.querySelectorAll("button,input,select,textarea,a[href],[role=tab]")];
    const refs=["aria-controls","aria-labelledby","aria-describedby","aria-errormessage"];
    const signature=()=>controls.map((element)=>({tag:element.tagName,id:element.id,type:element.getAttribute("type"),role:element.getAttribute("role"),hidden:element.hidden,disabled:Boolean(element.disabled),aria:refs.map((name)=>[name,element.getAttribute(name)])}));
    const before=signature(),sheets=[...document.styleSheets].filter((sheet)=>/(?:twatility-brand|side-panel-brand)\\.css/.test(sheet.href||""));sheets.forEach((sheet)=>sheet.disabled=true);const after=signature();sheets.forEach((sheet)=>sheet.disabled=false);
    const workspace=document.querySelector("#workspace-panel-data-layer");
    return{present:ids.every((id)=>document.getElementById(id)),context:document.querySelector("#project-transport-context").textContent,values:[document.querySelector("#history-path").value,document.querySelector("#default-push-path").value],equivalent:JSON.stringify(before)===JSON.stringify(after),overflow:[document.documentElement.scrollWidth-document.documentElement.clientWidth,document.body.scrollWidth-document.body.clientWidth,workspace.scrollWidth-workspace.clientWidth],broken:[...document.querySelectorAll("*")].flatMap((element)=>refs.flatMap((name)=>(element.getAttribute(name)||"").split(/\\s+/).filter(Boolean).filter((id)=>!document.getElementById(id))))};
  })()`);
  assert.equal(live.present,true);
  assert.match(live.context,/Retail measurement operations/u);
  assert.deepEqual(live.values,["event.history","dataLayer"]);
  assert.equal(live.equivalent,true);
  assert.deepEqual(live.overflow,[0,0,0]);
  assert.deepEqual(live.broken,[]);
  await evaluate(side,`document.querySelector("#data-layer-settings").scrollIntoView({block:"start"})`);
  await wait(50);
  await screenshot(side,path.join(evidenceDirectory,"side-live-settings-360x800.png"));

  await metrics(side,420,900);
  await evaluate(side,`document.querySelector("#data-layer-view-library").click();document.querySelector("#add-new-event").click()`);
  await ready(side,"!document.querySelector('#event-property-editor').hidden","Library editor");
  const library=await evaluate(side,`(()=>{const editor=document.querySelector("#event-property-editor"),master=document.querySelector("#event-template-master"),panel=document.querySelector("#data-layer-panel-library"),wide=[...editor.querySelectorAll("*")].filter((element)=>element.scrollWidth>element.offsetWidth+1).map((element)=>({id:element.id,tag:element.tagName,className:element.className,offsetWidth:element.offsetWidth,scrollWidth:element.scrollWidth})).slice(0,8),overflow=[document.documentElement.scrollWidth-document.documentElement.clientWidth,document.body.scrollWidth-document.body.clientWidth,panel.scrollWidth-panel.clientWidth];return{editor:!editor.hidden,contained:overflow.every((value)=>value<=1)&&wide.length===0&&master.scrollWidth<=master.offsetWidth+1,widths:{editor:[editor.clientWidth,editor.offsetWidth,editor.scrollWidth],master:[master.clientWidth,master.offsetWidth,master.scrollWidth]},overflow,wide,controls:["close-template-editor","event-template-name","event-template-json","save-template-revision","push-template-draft"].every((id)=>document.getElementById(id))};})()`);
  assert.equal(library.editor,true);
  assert.equal(library.contained,true,`Library must be locally contained: ${JSON.stringify(library)}`);
  assert.equal(library.controls,true);
  await screenshot(side,path.join(evidenceDirectory,"side-library-editor-420x900.png"));

  await metrics(side,512,900);
  await evaluate(side,`document.querySelector("#data-layer-view-sessions").click()`);
  await screenshot(side,path.join(evidenceDirectory,"side-sessions-512x900.png"));
  await evaluate(side,`document.querySelector("#data-layer-view-defects").click()`);
  await screenshot(side,path.join(evidenceDirectory,"side-defects-512x900.png"));

  await metrics(side,520,900);
  await evaluate(side,`document.querySelector("#data-layer-view-schemas").click()`);
  await ready(side,"document.querySelector('#schema-list')?.textContent.includes('Project Retail measurement operations')","schema tree");
  const treeBefore=await evaluate(side,`(()=>{const tree=document.querySelector("#schema-list"),rows=[...tree.querySelectorAll('[role="treeitem"]')],first=rows[0]?.querySelector("button");first?.focus();return{categories:[...document.querySelector("#schema-category-filter").options].map(({textContent})=>textContent),rows:rows.length,levels:rows.every((row)=>Number(row.getAttribute("aria-level"))>=1),selected:rows.every((row)=>row.hasAttribute("aria-selected")),contained:tree.scrollWidth<=tree.clientWidth+1,firstText:first?.textContent};})()`);
  assert.deepEqual(treeBefore.categories,["All","Saved schemas","Shared Profiles","Page Groups","Pages","Events","Flow Page instances","Event occurrences"]);
  assert.equal(treeBefore.rows>5,true);
  assert.equal(treeBefore.levels,true);
  assert.equal(treeBefore.selected,true);
  assert.equal(treeBefore.contained,true);
  await screenshot(side,path.join(evidenceDirectory,"side-schema-tree-520x900.png"));
  await evaluate(side,`document.querySelector("#schema-list [role=treeitem] > button:first-child").focus()`);
  await nativeKey(side,"End","End");
  const treeKeyboard=await evaluate(side,`(()=>{const rows=[...document.querySelectorAll("#schema-list [role=treeitem] > button:first-child")];return document.activeElement===rows.at(-1);})()`);
  assert.equal(treeKeyboard,true,"End must move tree focus to the final visible row");

  studio=await pageSocket(port,`${base}specification-builder.html?project=${projectId}&route=overview`);
  await metrics(studio,1280,900);
  await ready(studio,"document.querySelector('#tree-project-name')?.textContent.includes('Retail measurement operations')","Studio project");
  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="documentation"]').click()`);
  await ready(studio,"document.querySelector('[aria-label=\"Project Documentation workspace\"]')","Documentation workspace");
  const documentation=await evaluate(studio,`(()=>{const root=document.querySelector('[aria-label="Project Documentation workspace"]');return{set:root.textContent.includes("Retail implementation specification"),regions:["Documentation section outline","Selected documentation section configuration"].every((name)=>root.querySelector('[aria-label="'+name+'"]')),contained:root.scrollWidth<=root.clientWidth+1,overflow:[document.documentElement.scrollWidth-document.documentElement.clientWidth,document.body.scrollWidth-document.body.clientWidth]};})()`);
  assert.equal(documentation.set,true);
  assert.equal(documentation.regions,true);
  assert.deepEqual(documentation.overflow,[0,0]);
  const documentationChoices=await evaluate(studio,`(()=>{
    const root=document.querySelector('[aria-label="Project Documentation workspace"]'),tableTheme=root.querySelector('[data-theme-group="Table"]');tableTheme.open=true;
    const choices=[...root.querySelectorAll('input[type="checkbox"]')],visible=(element)=>element.getClientRects().length>0;
    const details=choices.map((input)=>{const label=input.labels?.[0],indicator=input.getBoundingClientRect(),copy=label?.querySelector(".studio-choice-copy")?.getBoundingClientRect(),style=getComputedStyle(input),row=label?.getBoundingClientRect();return{text:label?.textContent.trim(),id:input.id,forValue:label?.htmlFor,labels:input.labels?.length,role:input.getAttribute("role"),description:input.getAttribute("aria-description"),enhanced:input.dataset.studioChoiceEnhanced,width:indicator.width,height:indicator.height,padding:style.padding,gap:copy?copy.left-indicator.right:null,rowHeight:row?.height,visible:visible(input)};});
    const exportChoice=choices.find((input)=>input.labels?.[0]?.textContent.includes("Export Overview")),before=exportChoice.checked;let changes=0;exportChoice.addEventListener("change",()=>changes++);exportChoice.click();const afterInput=exportChoice.checked;exportChoice.labels[0].click();
    const actionPairs=[...root.querySelectorAll("li")].flatMap((item)=>{const label=item.querySelector(":scope > label.studio-choice-row"),action=item.querySelector(":scope > button");if(!label||!action||!visible(label)||!visible(action))return[];const left=label.getBoundingClientRect(),right=action.getBoundingClientRect();return[{intersects:!(left.right<=right.left||right.right<=left.left||left.bottom<=right.top||right.bottom<=left.top)}];});
    const verticalDetails=[...root.querySelectorAll("fieldset")].filter((field)=>field.querySelector(":scope > .studio-choice-row,:scope > ol .studio-choice-row")).map((field)=>{const rows=[...field.querySelectorAll(".studio-choice-row")].filter(visible).map((row)=>row.getBoundingClientRect());return{legend:field.querySelector("legend")?.textContent,columns:getComputedStyle(field).gridTemplateColumns,stacked:rows.every((row,index)=>!index||row.top>=rows[index-1].bottom-0.1)};});
    return{count:choices.length,details,activation:{before,afterInput,restored:exportChoice.checked,changes},vertical:verticalDetails.every(({stacked})=>stacked),verticalDetails,actionsSeparate:actionPairs.every(({intersects})=>!intersects)};
  })()`);
  assert.equal(documentationChoices.count>5,true);
  assert.equal(documentationChoices.details.every(({id,forValue,labels,enhanced,description})=>id&&forValue===id&&labels===1&&enhanced==="true"&&description),true);
  assert.equal(documentationChoices.details.filter(({visible,role})=>visible&&role!=="switch").every(({width,height,padding,gap,rowHeight})=>width>=16&&width<=18&&height>=16&&height<=18&&padding==="0px"&&Math.abs(gap-8)<0.1&&rowHeight>=36),true,JSON.stringify(documentationChoices.details.filter(({visible,role})=>visible&&role!=="switch")));
  assert.equal(documentationChoices.activation.afterInput,!documentationChoices.activation.before);
  assert.equal(documentationChoices.activation.restored,documentationChoices.activation.before);
  assert.equal(documentationChoices.activation.changes,2);
  assert.equal(documentationChoices.details.find(({text})=>text.includes("Include concept subheadings"))?.role,null);
  assert.equal(documentationChoices.details.find(({text})=>text.includes("Borders"))?.role,null);
  assert.equal(documentationChoices.vertical,true,JSON.stringify(documentationChoices.verticalDetails));
  assert.equal(documentationChoices.actionsSeparate,true);
  await screenshot(studio,path.join(evidenceDirectory,"studio-documentation-1280x900.png"));

  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="pages"]').click();document.querySelector('[data-entity-id] button').click()`);
  await ready(studio,"document.querySelector('.composed-schema-workspace input[aria-label=\"Only defined fields\"]')?.dataset.studioChoiceEnhanced==='true'","Only defined fields switch");
  const switchBefore=await evaluate(studio,`(()=>{const input=document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]'),label=input.labels[0];input.focus();return{checked:input.checked,role:input.getAttribute("role"),ariaChecked:input.getAttribute("aria-checked"),state:label.querySelector(".studio-switch-state")?.textContent,mark:label.querySelector(".studio-switch-mark")?.textContent,undo:Number(document.querySelector("#undo-project").dataset.undoCount)};})()`);
  await nativeKey(studio," ","Space");
  await wait(180);
  const switchAfter=await evaluate(studio,`(()=>{const input=document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]'),label=input.labels[0];return{checked:input.checked,role:input.getAttribute("role"),ariaChecked:input.getAttribute("aria-checked"),state:label.querySelector(".studio-switch-state")?.textContent,mark:label.querySelector(".studio-switch-mark")?.textContent,undo:Number(document.querySelector("#undo-project").dataset.undoCount)};})()`);
  assert.equal(switchBefore.role,"switch");
  assert.equal(switchAfter.role,"switch");
  assert.equal(switchAfter.checked,!switchBefore.checked);
  assert.equal(switchAfter.ariaChecked,String(switchAfter.checked));
  assert.equal(switchAfter.state,switchAfter.checked?"On":"Off");
  assert.equal(switchAfter.mark,switchAfter.checked?"✓":"—");
  assert.equal(switchAfter.undo,switchBefore.undo+1);
  await evaluate(studio,`document.querySelector("#undo-project").click()`);
  await wait(180);
  const switchUndo=await evaluate(studio,`(()=>{const input=document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]');return{checked:input.checked,undo:Number(document.querySelector("#undo-project").dataset.undoCount),redo:Number(document.querySelector("#redo-project").dataset.redoCount)};})()`);
  await evaluate(studio,`document.querySelector("#redo-project").click()`);
  await wait(180);
  const switchRedo=await evaluate(studio,`(()=>{const input=document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]');return{checked:input.checked,undo:Number(document.querySelector("#undo-project").dataset.undoCount),redo:Number(document.querySelector("#redo-project").dataset.redoCount)};})()`);
  assert.equal(switchUndo.checked,switchBefore.checked);
  assert.equal(switchUndo.redo,1);
  assert.equal(switchRedo.checked,switchAfter.checked);
  assert.equal(switchRedo.undo,switchAfter.undo);
  await studio.call("Page.reload",{ignoreCache:true});
  await ready(studio,"document.querySelector('.composed-schema-workspace input[aria-label=\"Only defined fields\"]')?.dataset.studioChoiceEnhanced==='true'","reloaded Only defined fields switch");
  const switchReloaded=await evaluate(studio,`document.querySelector('.composed-schema-workspace input[aria-label="Only defined fields"]').checked`);
  assert.equal(switchReloaded,switchAfter.checked);

  await studio.call("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:1});
  await metrics(studio,360,800);
  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="documentation"]').click();document.querySelector('[data-theme-group="Table"]').open=true`);
  await ready(studio,"document.querySelector('[aria-label=\"Project Documentation workspace\"] input[type=\"checkbox\"]')?.dataset.studioChoiceEnhanced==='true'","narrow choice rows");
  const responsiveChoices=await evaluate(studio,`(()=>{
    const root=document.querySelector('[aria-label="Project Documentation workspace"]'),choices=[...root.querySelectorAll('input[type="checkbox"]')].filter((input)=>input.getClientRects().length),rows=choices.map((input)=>input.labels[0]),boxes=rows.map((row)=>row.getBoundingClientRect()),input=choices.find((choice)=>choice.labels[0].textContent.includes("Include concept subheadings"));input.focus();const focus=getComputedStyle(input.labels[0]);
    return{coarse:matchMedia("(pointer: coarse)").matches,minTarget:Math.min(...boxes.map(({height})=>height)),adjacent:choices.every((choice)=>{const indicator=choice.getBoundingClientRect(),copy=choice.labels[0].querySelector(".studio-choice-copy").getBoundingClientRect();return Math.abs(copy.left-indicator.right-8)<.1;}),contained:boxes.every(({left,right})=>left>=0&&right<=innerWidth+.1),focus:[focus.outlineStyle,focus.outlineWidth],overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  })()`);
  assert.equal(responsiveChoices.coarse,true);
  assert.equal(responsiveChoices.minTarget>=44,true);
  assert.equal(responsiveChoices.adjacent,true);
  assert.equal(responsiveChoices.contained,true);
  assert.notEqual(responsiveChoices.focus[0],"none");
  assert.notEqual(responsiveChoices.focus[1],"0px");
  assert.equal(responsiveChoices.overflow,0);
  await metrics(studio,640,450);
  const zoomChoices=await evaluate(studio,`(()=>{const root=document.querySelector('[aria-label="Project Documentation workspace"]'),choices=[...root.querySelectorAll('input[type="checkbox"]')].filter((input)=>input.getClientRects().length),rows=choices.map((input)=>input.labels[0].getBoundingClientRect());return{targets:rows.every(({height})=>height>=44),contained:rows.every(({left,right})=>left>=0&&right<=innerWidth+.1),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()`);
  assert.deepEqual(zoomChoices,{targets:true,contained:true,overflow:0});
  await studio.call("Emulation.setTouchEmulationEnabled",{enabled:false});

  await metrics(studio,1720,960);
  await evaluate(studio,`document.querySelector('#project-tree button[data-kind="flows"]').click();document.querySelector('[data-entity-id] button').click()`);
  await ready(studio,"document.querySelector('#flow-graph-workspace .flow-graph-canvas')","Flow workspace");
  const flow=await evaluate(studio,`(()=>{const owner=document.querySelector(".flow-canvas-scroll"),canvas=document.querySelector(".flow-graph-canvas");return{canvas:Boolean(canvas),localOwner:getComputedStyle(owner).overflowX==="auto"||owner.scrollWidth>owner.clientWidth,documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()`);
  assert.equal(flow.canvas,true);
  assert.equal(flow.localOwner,true);
  assert.equal(flow.documentOverflow,0);
  await screenshot(studio,path.join(evidenceDirectory,"studio-flow-1720x960.png"));

  await metrics(studio,1440,900);
  await evaluate(studio,`document.querySelector("#run-preflight").click()`);
  await ready(studio,"document.querySelector('.preflight-list')","preflight assurance");
  await screenshot(studio,path.join(evidenceDirectory,"studio-assurance-1440x900.png"));
  await evaluate(studio,`document.querySelector("#show-coverage").click()`);
  await ready(studio,"document.querySelector('.coverage-grid')||document.querySelector('#workspace-content').textContent.includes('Coverage blocked')","assurance");

  await metrics(studio,640,450);
  const zoom=await evaluate(studio,`(()=>({overflow:[document.documentElement.scrollWidth-document.documentElement.clientWidth,document.body.scrollWidth-document.body.clientWidth],controls:[...document.querySelectorAll("button,input,select,textarea")].filter((element)=>{const box=element.getBoundingClientRect();return box.width>0&&box.height>0;}).every((element)=>element.getBoundingClientRect().width<=innerWidth)}))()`);
  assert.deepEqual(zoom.overflow,[0,0]);
  assert.equal(zoom.controls,true);
  await screenshot(studio,path.join(evidenceDirectory,"studio-zoom-640x450.png"));

  await studio.call("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  const reduced=await evaluate(studio,`(()=>{const samples=[...document.querySelectorAll(".entity-row button,.actions button")];return{matches:matchMedia("(prefers-reduced-motion: reduce)").matches,durations:samples.map((element)=>getComputedStyle(element).transitionDuration)};})()`);
  assert.equal(reduced.matches,true);
  assert.equal(reduced.durations.every((duration)=>duration.split(",").every((value)=>parseFloat(value)<=0.001)),true);
  await studio.call("Emulation.setEmulatedMedia",{features:[{name:"forced-colors",value:"active"}]});
  const forced=await evaluate(studio,`(()=>{const samples=[document.querySelector("#show-coverage"),document.querySelector("#publish-project"),document.querySelector("#project-tree button[aria-current=true]")].filter(Boolean);return{matches:matchMedia("(forced-colors: active)").matches,count:samples.length,borders:samples.map((element)=>{const style=getComputedStyle(element);return[style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth];})};})()`);
  assert.equal(forced.matches,true);
  assert.equal(forced.count,3);
  assert.equal(forced.borders.every((widths)=>widths.some((width)=>parseFloat(width)>0)),true);

  const badEvents=[...side.events,...studio.events].filter(({method,params})=>method==="Runtime.exceptionThrown"||method==="Network.loadingFailed"||(method==="Log.entryAdded"&&params.entry?.level==="error"));
  assert.deepEqual(badEvents,[],"installed Slice 6 surfaces must have no runtime or load errors");
  const studioChoiceControls={
    installedBoundary:documentationChoices.count>5,
    explicitLabels:documentationChoices.details.every(({id,forValue,labels,enhanced,description})=>Boolean(id)&&forValue===id&&labels===1&&enhanced==="true"&&Boolean(description)),
    checkboxClassification:documentationChoices.details.find(({text})=>text.includes("Include concept subheadings"))?.role===null&&documentationChoices.details.find(({text})=>text.includes("Borders"))?.role===null,
    desktopGeometry:documentationChoices.details.filter(({visible,role})=>visible&&role!=="switch").every(({width,height,padding,gap,rowHeight})=>width>=16&&width<=18&&height>=16&&height<=18&&padding==="0px"&&Math.abs(gap-8)<0.1&&rowHeight>=36),
    labelActivation:documentationChoices.activation.afterInput===!documentationChoices.activation.before&&documentationChoices.activation.restored===documentationChoices.activation.before&&documentationChoices.activation.changes===2,
    verticalGroups:documentationChoices.vertical,
    separateActions:documentationChoices.actionsSeparate,
    immediateSwitch:switchBefore.role==="switch"&&switchAfter.role==="switch"&&switchAfter.checked===!switchBefore.checked&&switchAfter.ariaChecked===String(switchAfter.checked)&&switchAfter.state===(switchAfter.checked?"On":"Off")&&switchAfter.mark===(switchAfter.checked?"✓":"—"),
    oneCommand:switchAfter.undo===switchBefore.undo+1,
    undoRedoReload:switchUndo.checked===switchBefore.checked&&switchUndo.redo===1&&switchRedo.checked===switchAfter.checked&&switchReloaded===switchAfter.checked,
    coarseAndNarrow:responsiveChoices.coarse&&responsiveChoices.minTarget>=44&&responsiveChoices.adjacent&&responsiveChoices.contained,
    focusVisible:responsiveChoices.focus[0]!=="none"&&responsiveChoices.focus[1]!=="0px",
    responsiveOverflow:responsiveChoices.overflow===0&&zoomChoices.targets&&zoomChoices.contained&&zoomChoices.overflow===0,
    sidePanelUnchanged:live.equivalent&&!side.events.some(({method})=>method==="Runtime.exceptionThrown"),
  };
  await writeFile(path.join(evidenceDirectory,"report.json"),`${JSON.stringify({live,library,tree:treeBefore,treeKeyboard,documentation,studioChoiceControls,flow,zoom,reduced,forced},null,2)}\n`);
  console.log(JSON.stringify({studioChoiceControls}));
} finally {
  side?.close();studio?.close();
  await stopHeadlessChrome(chrome,1500);
  await rm(profile,{recursive:true,force:true});
}

console.log("TWAtility Belt packaged Slice 6 workflow polish browser test passed");
