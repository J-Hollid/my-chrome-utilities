import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { headlessChromeArguments, removeChromeProfile, resolveChromeExecutable, stopHeadlessChrome } from "../support/headless-chrome.mjs";
import { FLOW_RUNTIME_KEYS, flowInterruptionReport } from "../support/flow-evidence-reporter.mjs";
import { wait } from "./shared-harness.mjs";
import { flowGraphCorrectiveWorkflow, flowGraphEventExampleIncompleteEvidence, flowGraphEventExampleSeed, flowGraphEventExampleStateEvidence, flowGraphLegacyContextEvidence, flowGraphLegacyContextSeed, flowGraphPageExampleIncompleteEvidence, flowGraphPageExampleSeed, flowGraphPageExampleStateEvidence, flowGraphRelationshipKindEvidence, flowGraphRelationshipKindSeed, flowGraphReloadEvidence, flowGraphRepeatedInstanceEvidence, flowGraphRepeatedInstanceSeed } from "../support/flow-graph-corrective-workflow.mjs";
import { flowR02GeometryEvidence, flowR02ItemActivationResult, flowR02PanProbe, flowR02PanResult, flowR02PreparePanGraph, flowR02RestorePanGraph, flowR02ViewStorageKey } from "../support/flow-r02-correction-evidence.mjs";
import { boundedFlowExamplesReadiness, createFlowExamplesPhaseTimer,
    flowExamplesTargetLimitMilliseconds } from "../support/flow-examples-timing.mjs";
import { createBrowserPhaseTimer, observeBrowserReadiness, transmitDevtoolsProgram,
    waitForChromeDebuggingPort, withDevtoolsProtocolDeadline,
    withLogicalTargetLifecycle } from "../support/browser-observation-control.mjs";
import { assessFlowReloadLifecycle, canonicalFlowReloadIdentity, FLOW_WORKSPACE_CONTROLS_RELOAD_SEQUENCE } from "../../scripts/flow-reload-lifecycle.mjs";
import { encodeDevtoolsTextFrame, planFlowBrowserTargets } from "../support/flow-workspace-r02-runtime.mjs";
class DevtoolsSocket {
    constructor(url, targetId, { callLimitMilliseconds, forcedHangMethod } = {}) { this.url = new URL(url); this.targetId = targetId; this.callLimitMilliseconds = callLimitMilliseconds ?? (() => 120000); this.forcedHangMethod = forcedHangMethod; this.nextId = 1; this.pending = new Map(); this.handlers = new Map(); this.buffer = Buffer.alloc(0); }
    async connect() { await new Promise((resolve, reject) => { this.socket = net.createConnection({ host: this.url.hostname, port: Number(this.url.port) }); this.socket.once("error", reject); this.socket.once("connect", () => { const key = Buffer.from(String(Math.random())).toString("base64"); this.socket.write([`GET ${this.url.pathname}${this.url.search} HTTP/1.1`, `Host: ${this.url.host}`, "Upgrade: websocket", "Connection: Upgrade", `Sec-WebSocket-Key: ${key}`, "Sec-WebSocket-Version: 13", "\r\n"].join("\r\n")); }); let handshake = ""; const receive = (chunk) => { handshake += chunk.toString("binary"); const end = handshake.indexOf("\r\n\r\n"); if (end < 0)
        return; this.socket.off("data", receive); if (!handshake.startsWith("HTTP/1.1 101"))
        return reject(new Error("DevTools WebSocket upgrade failed")); const remaining = Buffer.from(handshake.slice(end + 4), "binary"); this.socket.on("data", (data) => this.receive(data)); if (remaining.length)
        this.receive(remaining); resolve(); }; this.socket.on("data", receive); }); }
    receive(chunk) { this.buffer = Buffer.concat([this.buffer, chunk]); while (this.buffer.length >= 2) {
        const first = this.buffer[0];
        let length = this.buffer[1] & 127, offset = 2;
        if (length === 126) {
            if (this.buffer.length < 4)
                return;
            length = this.buffer.readUInt16BE(2);
            offset = 4;
        }
        else if (length === 127) {
            if (this.buffer.length < 10)
                return;
            length = Number(this.buffer.readBigUInt64BE(2));
            offset = 10;
        }
        if (this.buffer.length < offset + length)
            return;
        const payload = this.buffer.subarray(offset, offset + length);
        this.buffer = this.buffer.subarray(offset + length);
        if ((first & 15) !== 1)
            continue;
        const message = JSON.parse(payload.toString("utf8")), pending = this.pending.get(message.id);
        if (!pending) {
            this.handlers.get(message.method)?.(message.params);
            continue;
        }
        if (pending.method === this.forcedHangMethod)
            continue;
        this.pending.delete(message.id);
        message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
    } }
    send(payload) { const frame = encodeDevtoolsTextFrame(JSON.stringify(payload));
        this.socket.write(frame.bytes); }
    call(method, params = {}) {
        const id = this.nextId++;
        this.send({ id, method, params });
        return withDevtoolsProtocolDeadline({
            targetId:this.targetId, method, limitMs:this.callLimitMilliseconds(),
            work:() => new Promise((resolve, reject) => this.pending.set(id, { resolve, reject, method })),
            onTimeout:() => this.pending.delete(id),
        });
    }
    on(method, handler) { this.handlers.set(method, handler); }
    close() { for (const pending of this.pending.values()) pending.reject(new Error(`${this.targetId} DevTools socket closed`)); this.pending.clear(); this.socket?.destroy(); }
}
const selectedTargetIds = process.env.SWARMFORGE_BROWSER_TARGET_IDS
    ? JSON.parse(process.env.SWARMFORGE_BROWSER_TARGET_IDS)
    : [];
const selectedTargets = planFlowBrowserTargets(
    selectedTargetIds, process.env.FLOW_GRAPH_BROWSER_SHARD ?? "core");
const processStarted = performance.now();
const configuredProtocolCallLimitMilliseconds = Number(
    process.env.SWARMFORGE_VTD007_PROTOCOL_CALL_LIMIT_MS ?? 120000,
);
assert.ok(Number.isFinite(configuredProtocolCallLimitMilliseconds) &&
    configuredProtocolCallLimitMilliseconds > 0,
"SWARMFORGE_VTD007_PROTOCOL_CALL_LIMIT_MS must be finite and positive");
const profile = await mkdtemp(path.join(os.tmpdir(), "flow-instance-runtime-")), extensionRoot = path.resolve("dist"), args = headlessChromeArguments(profile, extensionRoot);
args.splice(-1, 0, `--load-extension=${extensionRoot}`);
const chrome = spawn(resolveChromeExecutable(), args, { stdio: ["ignore", "ignore", "pipe"] });
let socket, activePhase = "startup", activeTargetTimer, activeTargetId, activeTargetPageId, port;
try {
    port = await waitForChromeDebuggingPort({
        chrome, targetId:"flow-browser-process", limitMs:15000, maximumStderrCharacters:2000,
    });
    const extensionState = await observeBrowserReadiness({
        targetId: "flow-browser-process", phase: "browser startup",
        predicateDescription: "installed extension service worker discovery",
        timeoutMs: 2000, pollIntervalMs: 20, maximumSnapshotCharacters: 500,
        observe: async () => { const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json()), worker = targets.find(({ type, url }) => type === "service_worker" && url.startsWith("chrome-extension://") && new URL(url).pathname === "/background.js"); return { ready: Boolean(worker), worker, targetCount: targets.length }; },
        ready: ({ ready }) => ready, snapshot: ({ targetCount }) => ({ targetCount }),
    });
    const extension = new URL(extensionState.worker.url).hostname;
    const origin = `chrome-extension://${extension}`;
    const pageUrl = `${origin}/specification-builder.html`;
    const browserStartupMs = performance.now() - processStarted;
    for (const { id: targetId, shard: browserShard } of selectedTargets) {
    const targetStarted = performance.now();
    const phaseTimer = browserShard === "examples"
        ? createFlowExamplesPhaseTimer({ browserStartupMs })
        : createBrowserPhaseTimer({targetId,phaseNames:["target setup","navigation","fixture","readiness","interaction","persistence","assertion","cleanup"]});
    const transitionPhase=(phase)=>phaseTimer.transition(
        browserShard === "examples" ? phase : phase === "fixture setup" ? "fixture" : phase,
    );
    activeTargetTimer=phaseTimer;activeTargetId=targetId;
    activePhase = `${targetId}:startup`;
    let flowGraph, phaseTiming, lifecycleFailedAtPhase, initializationError;
    const targetLimitMilliseconds=browserShard==="examples"?flowExamplesTargetLimitMilliseconds:120000;
    await withLogicalTargetLifecycle({targetId,boundary:"Flow logical target",
    limitMs:targetLimitMilliseconds,onTimeout:()=>socket?.close(),work:async({remainingMilliseconds})=>{
    const protocolCallLimitMilliseconds=()=>Math.max(1,Math.min(
        configuredProtocolCallLimitMilliseconds,
        remainingMilliseconds()-50,
    ));
    const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(pageUrl)}`, { method: "PUT" }).then((response) => response.json());
    if (!target)
        throw new Error("Installed Specification Builder target is unavailable.");
    activeTargetPageId=target.id;
    socket = new DevtoolsSocket(target.webSocketDebuggerUrl, targetId, {
        callLimitMilliseconds:protocolCallLimitMilliseconds,
        forcedHangMethod:process.env.SWARMFORGE_VTD007_FORCE_FLOW_PROTOCOL_HANG_METHOD,
    });
    await socket.connect();
    await socket.call("Runtime.enable");
    await socket.call("Page.enable");
    socket.on("Runtime.exceptionThrown",({exceptionDetails})=>{initializationError=exceptionDetails?.exception?.description??exceptionDetails?.text??"Unknown initializer error";});
    await socket.call("Storage.clearDataForOrigin", { origin, storageTypes: "all" });
    await socket.call("Page.reload", { ignoreCache: true });
    for (const name of ["flowEvidencePhase", "flowNativeKey"])
        await socket.call("Runtime.addBinding", { name });
    socket.on("Runtime.bindingCalled", async ({ name, payload }) => { if (name === "flowEvidencePhase") {
        activePhase = `${targetId}:${payload}`;
        return;
    } const { key } = JSON.parse(payload), code = key === " " ? "Space" : key, virtualKeyCode = key === "Enter" ? 13 : key === "Escape" ? 27 : key.charCodeAt(0); await socket.call("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode }); await socket.call("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode }); });
    const evaluate = async (expression, phase = activePhase) => { const result = await transmitDevtoolsProgram({ targetId, phase, source: expression, shape: "expression", call:socket.call.bind(socket), parameters:{ returnByValue: true, awaitPromise: true, userGesture: true } }); if (result.exceptionDetails)
        throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text); return result.result.value; };
    const waitForBrowser = async (phase, predicate, selector, stabilityMs = 0) => {
      const readiness=()=>boundedFlowExamplesReadiness({
        targetId, phase, predicate,
        timeoutMs:browserShard==="examples"
          ? 5000
          : Math.max(1, remainingMilliseconds()-50),
        observe: async () => evaluate(`(()=>{const node=document.querySelector(${JSON.stringify(selector)});return{ready:document.readyState==='complete'&&Boolean(node),readyState:document.readyState,selector:${JSON.stringify(selector)},present:Boolean(node),text:String(node?.textContent??'').slice(0,120)}})()`),
        stabilityMs,
      });
      if(browserShard==="examples")return readiness();
      const timedPhase=phase==="fixture setup"?"fixture":phase;
      const result=await phaseTimer.scoped(timedPhase,readiness);
      if(process.env.SWARMFORGE_VTD007_FORCE_FLOW_FAILURE_AFTER_READINESS==="1"&&
          phaseTimer.activePhase==="interaction")
        throw new Error("forced Flow failure after scoped readiness");
      return result;
    };
    await waitForBrowser("target setup", "create-project form mounted", "#create-project-form");
    activePhase = "seed";
    transitionPhase("fixture setup");
    const seeded = await evaluate(`(async()=>{const {createSpecificationProject,addProjectEntity}=await import('./data-layer-specification-project.js'),{createFlowSection,addFlowPageFrameToSection}=await import('./data-layer-property-set-flow-section.js'),{addGraphOccurrence,saveGraphRelationship}=await import('./data-layer-flow-graph.js'),{openIndexedDbProjectRepository}=await import('./data-layer-durable-project-repository.js');let n=0,id=(kind)=>kind+':runtime:'+ ++n,state=createSpecificationProject({name:'Flow runtime',site:'runtime.example',id});const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);},propertySet=add('propertySets',{name:'Checkout',schemaConstraints:[{path:'/currency',type:'string',examples:['EUR']}]}),application=(name)=>({id:id('application'),name:'Checkout',propertySetId:propertySet.id}),confirmation=add('pages',{name:'Confirmation',propertySetApplications:[application()]}),payment=add('pages',{name:'Payment',propertySetApplications:[application()]}),receipt=add('pages',{name:'Receipt',propertySetApplications:[application()]}),purchase=add('events',{name:'Purchase',eventName:'purchase',schemaConstraints:[{path:'/event',type:'string',examples:['purchase']}]}),review=add('events',{name:'Review',eventName:'review'}),flow=add('flows',{name:'Checkout journey',steps:[]}),otherFlow=add('flows',{name:'Returns journey',steps:[]});state=addFlowPageFrameToSection(state,otherFlow.id,receipt.id,undefined,id);state=createFlowSection(state,flow.id,{name:'Checkout',bounds:{x:20,y:20,width:760,height:300}},id);state=createFlowSection(state,flow.id,{name:'Completion',bounds:{x:20,y:360,width:760,height:260}},id);let graph=state.project.documentationFlowGraphs[flow.id],sections=graph.sections;for(const [page,sectionId]of[[confirmation,sections[0].id],[payment,sections[0].id],[receipt,sections[1].id],[confirmation,undefined]])state=addFlowPageFrameToSection(state,flow.id,page.id,sectionId,id);graph=state.project.documentationFlowGraphs[flow.id];const frames=graph.pageFrames;state=addGraphOccurrence(state,flow.id,{name:'Purchase',pageFrameId:frames[0].id,pageId:confirmation.id,eventId:purchase.id,obligation:'Required',minimum:1,maximum:1,x:24,y:70},id);state=addGraphOccurrence(state,flow.id,{name:'Review',pageFrameId:frames[1].id,pageId:payment.id,eventId:review.id,obligation:'Required',minimum:1,maximum:1,x:24,y:70},id);state=saveGraphRelationship(state,flow.id,frames[0].id,{toStepId:frames[1].id,sourcePort:'right',targetPort:'left',label:'Checkout route'},id);state=saveGraphRelationship(state,flow.id,frames[0].id,{toStepId:frames[2].id,sourcePort:'top',targetPort:'bottom'},id);graph=state.project.documentationFlowGraphs[flow.id];const repository=await openIndexedDbProjectRepository();await repository.putProject(state,{active:true,navigation:{kind:'flows',id:flow.id}});return{projectId:state.project.id,flowId:flow.id,otherFlowId:otherFlow.id,pageIds:[confirmation.id,payment.id,receipt.id],frameIds:graph.pageFrames.map(({id})=>id),occurrenceIds:graph.occurrences.map(({id})=>id),relationshipIds:graph.relationships.map(({id})=>id),sectionIds:graph.sections.map(({id})=>id)};})()`);
    await evaluate(`(()=>{const url=new URL(location.href);url.searchParams.set('project',${JSON.stringify(seeded.projectId)});url.searchParams.set('kind','flows');url.searchParams.set('entity',${JSON.stringify(seeded.flowId)});history.replaceState(null,'',url);})()`);
    const reloadSequence=[];
    const reloadIdentity=()=>canonicalFlowReloadIdentity({targetId,pageTargetId:"single-specification-builder-page",origin,storageIdentity:`${origin}:my-chrome-utilities.project-repository`,projectId:seeded.projectId,flowId:seeded.flowId,reloadSequence});
    const reloadFlowPage=async(boundary)=>{
        await observeBrowserReadiness({targetId,phase:"persistence",predicateDescription:`Flow persistence settled before ${boundary}`,timeoutMs:5000,pollIntervalMs:20,maximumSnapshotCharacters:300,observe:async()=>evaluate("(()=>{const status=document.documentElement.dataset.specificationStudioPersistence;return{ready:status==='settled',status};})()"),ready:({ready})=>ready,snapshot:(state)=>state});
        if(targetId!=="FLOW_WORKSPACE_CONTROLS_TARGET"){
            await socket.call("Page.reload",{ignoreCache:true});
            return;
        }
        reloadSequence.push(boundary);
        const identityBefore=reloadIdentity(),priorGeneration=await evaluate("performance.timeOrigin"),currentUrl=await evaluate("location.href");
        initializationError=undefined;
        await socket.call("Page.navigate",{url:currentUrl});
        await observeBrowserReadiness({targetId,phase:"navigation",predicateDescription:`Flow reload ${boundary} lifecycle`,timeoutMs:5000,pollIntervalMs:25,stabilityMs:150,maximumSnapshotCharacters:900,observe:async()=>{
            const observed=await evaluate(`(()=>{const generation=performance.timeOrigin,root=document.documentElement,initializationComplete=root?.dataset.specificationStudioInitialization==='complete',repositoryOpen=root?.dataset.specificationStudioRepository==='open',activeProjectId=repositoryOpen&&document.title.includes(${JSON.stringify(` · ${seeded.projectId}`)})?${JSON.stringify(seeded.projectId)}:undefined,navigationKinds=[...document.querySelectorAll('#project-tree [data-kind]')].map(item=>item.dataset.kind).filter(Boolean),workspace=document.querySelector(${JSON.stringify(`[data-flow-section-workspace="${seeded.flowId}"]`)}),toolbar=workspace?.querySelector('[aria-label="Flow toolbar"]'),box=toolbar?.getBoundingClientRect();return{generation,initializationComplete,repositoryOpen,initializationStage:root?.dataset.specificationStudioInitialization,activeProjectId,navigationKinds,requestedFlowId:workspace?.dataset.flowSectionWorkspace,flowMounted:Boolean(workspace),flowPainted:Boolean(toolbar&&box.width>0&&box.height>0)};})()`);
            const generationChanged=observed.generation!==priorGeneration;
            return assessFlowReloadLifecycle({...observed,generation:generationChanged?"current":"previous",expectedGeneration:"current",expectedProjectId:seeded.projectId,expectedFlowId:seeded.flowId,...(initializationError?{initializationError}:{})});
        },ready:({ready})=>ready,snapshot:({stage,state})=>({identity:identityBefore,boundary,stage,state})});
    };
    const ensureFlowWorkspace = async (predicate) => {
        await observeBrowserReadiness({targetId,phase:"navigation",predicateDescription:`${predicate}: connected project tree`,timeoutMs:5000,pollIntervalMs:25,stabilityMs:100,maximumSnapshotCharacters:400,observe:async()=>evaluate("(()=>{const tree=document.querySelector('#project-tree'),box=tree?.getBoundingClientRect();return{ready:Boolean(tree?.isConnected),readyState:document.readyState,width:box?.width??0,height:box?.height??0};})()"),ready:({ready})=>ready,snapshot:(state)=>state});
        if (!await evaluate("Boolean(document.querySelector('[aria-label=\"Flow toolbar\"]')?.getBoundingClientRect().width)")) {
            await waitForBrowser("interaction", "Flows navigation mounted", "[data-kind=\"flows\"]");
            await evaluate("document.querySelector('[data-kind=\"flows\"]')?.click()");
            await observeBrowserReadiness({targetId,phase:"interaction",predicateDescription:"Checkout journey row mounted",timeoutMs:4000,pollIntervalMs:25,maximumSnapshotCharacters:400,observe:async()=>evaluate("(()=>{const rows=[...document.querySelectorAll('.entity-row button')],row=rows.find(item=>item.textContent==='Checkout journey');return{ready:Boolean(row),texts:rows.map(item=>item.textContent).slice(0,20)}})()"),ready:({ready})=>ready,snapshot:({texts})=>({texts})});
            await evaluate("(()=>{const row=[...document.querySelectorAll('.entity-row button')].find(item=>item.textContent==='Checkout journey');row.click();return true;})()");
        }
        await observeBrowserReadiness({targetId,phase:"readiness",predicateDescription:predicate,timeoutMs:5000,pollIntervalMs:25,stabilityMs:100,maximumSnapshotCharacters:400,observe:async()=>evaluate("(()=>{const toolbar=[...document.querySelectorAll('[aria-label=\"Flow toolbar\"]')].find(item=>{const box=item.getBoundingClientRect();return box.width>0&&box.height>0;});const box=toolbar?.getBoundingClientRect();return{ready:Boolean(toolbar?.isConnected),width:box?.width??0,height:box?.height??0};})()"),ready:({ready})=>ready,snapshot:(state)=>state});
    };
    const ensureFlowPanWorkspace = async (predicate) => {
        await ensureFlowWorkspace(predicate);
        await observeBrowserReadiness({targetId,phase:"readiness",predicateDescription:`${predicate}: rendered graph item`,timeoutMs:5000,pollIntervalMs:25,stabilityMs:100,maximumSnapshotCharacters:400,observe:async()=>evaluate("(()=>{const items=[...document.querySelectorAll('[aria-label=\"Interactive directional Flow canvas\"] [data-flow-section-id],[aria-label=\"Interactive directional Flow canvas\"] [data-page-frame-id]')],painted=items.filter(item=>{const box=item.getBoundingClientRect();return box.width>0&&box.height>0;});return{ready:painted.length>0,itemCount:items.length,paintedCount:painted.length};})()"),ready:({ready})=>ready,snapshot:(state)=>state});
    };
    const runtime = {};
    if (browserShard !== "examples") transitionPhase("interaction");
    if (browserShard === "core") {
        const geometryRows = [[360, 800, false, false, "narrowHiddenClosed"], [360, 800, false, true, "narrowHiddenOpen"], [360, 800, true, false, "narrowVisibleClosed"], [360, 800, true, true, "narrowVisibleOpen"], [1440, 900, false, false, "wideHiddenClosed"], [1440, 900, false, true, "wideHiddenOpen"], [1440, 900, true, false, "wideVisibleClosed"], [1440, 900, true, true, "wideVisibleOpen"]], geometryEvidence = {};
        for (const [width, height, visible, inspectorOpen, label] of geometryRows) {
            await socket.call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
            await evaluate(`(()=>{const key=${JSON.stringify(flowR02ViewStorageKey(seeded))},prior=JSON.parse(sessionStorage.getItem(key)??'{}');sessionStorage.setItem(key,JSON.stringify({...prior,navigationVisible:${visible}}));})()`);
            await reloadFlowPage(`geometry:${label}`);
            await ensureFlowWorkspace("Flow toolbar mounted after geometry reload");
            await evaluate(`(()=>{const inspector=document.querySelector('#project-inspector'),toggle=document.querySelector('#toggle-project-inspector');if(Boolean(inspector&&!inspector.hidden)!==${inspectorOpen})toggle?.click();})()`);
            await observeBrowserReadiness({targetId,phase:"readiness",predicateDescription:`Flow geometry row ${label} has live toolbar, viewport, and Add action geometry`,timeoutMs:7500,pollIntervalMs:25,stabilityMs:250,maximumSnapshotCharacters:600,observe:async()=>evaluate("(()=>{const toolbar=document.querySelector('[aria-label=\"Flow toolbar\"]'),viewport=document.querySelector('.flow-canvas-viewport'),add=[...(toolbar?.querySelectorAll('button')??[])].find(button=>button.textContent.trim()==='Add'),toolbarBox=toolbar?.getBoundingClientRect(),viewportBox=viewport?.getBoundingClientRect(),addBox=add?.getBoundingClientRect();return{ready:(toolbarBox?.width??0)>0&&(viewportBox?.height??0)>0&&(addBox?.width??0)>0,toolbarWidth:toolbarBox?.width??0,viewportHeight:viewportBox?.height??0,addWidth:addBox?.width??0};})()"),ready:({ready})=>ready,snapshot:(state)=>state});
            const row = await evaluate(flowR02GeometryEvidence());
            for (const [key, value] of Object.entries(row))
                geometryEvidence[`${label}_${key}`] = value;
        }
        const styleStateBefore = await evaluate(`(async()=>{const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),loaded=await repository.loadProject(${JSON.stringify(seeded.projectId)}),graph=loaded.state.project.documentationFlowGraphs[${JSON.stringify(seeded.flowId)}];return JSON.stringify({graph,revision:loaded.draftSequence,undo:loaded.state.history.undo.length});})()`);
        const assetPresentation = await evaluate(`(()=>{const hrefs=[...document.styleSheets].flatMap(sheet=>sheet.href?[new URL(sheet.href).pathname]:[]),required=['/flow-graph/flow-workspace.css','/flow-graph/flow-workspace-shell.css'],canvas=document.querySelector('[aria-label="Interactive directional Flow canvas"]'),node=document.querySelector('.flow-page-frame'),port=document.querySelector('[data-input-port-for]'),portBox=port?.getBoundingClientRect(),toolbar=document.querySelector('[aria-label="Flow toolbar"]'),buttons=[...toolbar.querySelectorAll('button')];return{assetsLoaded:required.every(path=>hrefs.includes(path))&&required.every(path=>hrefs.filter(href=>href===path).length===1),computedPresentation:Boolean(canvas&&node&&port&&getComputedStyle(canvas).backgroundColor!=='rgba(0, 0, 0, 0)'&&getComputedStyle(node).fill!=='none'&&getComputedStyle(port).visibility!=='hidden'&&(portBox?.width??0)>0&&(portBox?.height??0)>0),visibleControls:['Add','Focus Canvas','Zoom in','Fit Flow','Outline','Details'].every(label=>{const button=buttons.find(item=>item.textContent.trim()===label),box=button?.getBoundingClientRect();return Boolean(box&&box.width>0&&box.height>0);})};})()`);
        const zoomGeometry = {};
        for (const scale of [0.25, 1, 2]) {
            await socket.call("Emulation.setPageScaleFactor", { pageScaleFactor:scale });
            zoomGeometry[String(scale)] = await evaluate("(()=>{const canvas=document.querySelector('[aria-label=\"Interactive directional Flow canvas\"]'),viewport=document.querySelector('.flow-canvas-viewport'),canvasBox=canvas?.getBoundingClientRect(),viewportBox=viewport?.getBoundingClientRect();return Boolean(canvasBox&&viewportBox&&canvasBox.width>0&&canvasBox.height>0&&viewportBox.width>0&&viewportBox.height>0);})()");
        }
        await socket.call("Emulation.setPageScaleFactor", { pageScaleFactor:1 });
        await socket.call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"reduce"}] });
        const reducedMotion = await evaluate("(()=>{const button=document.querySelector('[aria-label=\"Flow toolbar\"] button');return matchMedia('(prefers-reduced-motion: reduce)').matches&&getComputedStyle(button).transitionProperty==='none';})()");
        await socket.call("Emulation.setEmulatedMedia", { features:[{name:"forced-colors",value:"active"}] });
        const forcedColors = await evaluate("(()=>{const root=document.querySelector('.documentary-flow'),node=document.querySelector('.flow-node rect');return matchMedia('(forced-colors: active)').matches&&getComputedStyle(root).borderColor!==''&&getComputedStyle(node).stroke!=='none';})()");
        await socket.call("Emulation.setEmulatedMedia", { features:[] });
        await evaluate("(()=>{const toolbar=document.querySelector('[aria-label=\"Flow toolbar\"]'),button=toolbar.querySelector('button');button.focus();})()");
        await socket.call("Input.dispatchKeyEvent", {type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
        await socket.call("Input.dispatchKeyEvent", {type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
        const keyboardFocus = await evaluate("(()=>{const active=document.activeElement;return Boolean(active?.closest('.documentary-flow')&&active.matches(':focus-visible')&&(getComputedStyle(active).outlineStyle!=='none'||getComputedStyle(active).borderStyle!=='none'||getComputedStyle(active).boxShadow!=='none'));})()");
        const styleStateAfter = await evaluate(`(async()=>{const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),loaded=await repository.loadProject(${JSON.stringify(seeded.projectId)}),graph=loaded.state.project.documentationFlowGraphs[${JSON.stringify(seeded.flowId)}];return JSON.stringify({graph,revision:loaded.draftSequence,undo:loaded.state.history.undo.length});})()`);
        runtime.styles = {
            ...assetPresentation,
            zoomGeometry:Object.values(zoomGeometry).every(Boolean),
            reducedMotion,
            forcedColors,
            keyboardFocus,
            canonicalStable:styleStateAfter===styleStateBefore,
        };
        activePhase = "runtime001";
        await reloadFlowPage("runtime001");
        await waitForBrowser("navigation", "Flow canvas mounted for runtime001", "[aria-label=\"Flow canvas viewport\"]");
        activePhase = "runtime027";
        const originalPanState = await evaluate(flowR02PreparePanGraph(seeded));
        await reloadFlowPage("runtime027:setup");
        await ensureFlowPanWorkspace("Flow canvas mounted for runtime027");
        const panRows = [
            [false, "primary", 120, 80, "mainPrimaryBlank"], [true, "primary", -90, -60, "focusPrimaryBlank"],
            [false, "space", 110, -70, "mainSpaceItem"], [true, "space", -100, 75, "focusSpaceItem"],
            [false, "middle", 95, 65, "mainMiddleBlank"], [true, "middle", -85, -55, "focusMiddleBlank"],
            [false, "touch", 105, -65, "mainTouch"], [true, "touch", -95, 70, "focusTouch"],
            [false, "keyboard", 80, 60, "mainKeyboard"], [true, "keyboard", -80, -60, "focusKeyboard"]
        ], panEvidence = {};
        const mousePan = async (point, dx, dy, button = "left") => { const buttons = button === "middle" ? 4 : 1; await socket.call("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button, buttons, clickCount: 1 }); await socket.call("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x + dx, y: point.y + dy, button, buttons }); await socket.call("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x + dx, y: point.y + dy, button, buttons: 0, clickCount: 1 }); };
        const keyboardPan = async (dx, dy) => { for (const [key, distance] of [[dx > 0 ? "ArrowRight" : "ArrowLeft", Math.abs(dx)], [dy > 0 ? "ArrowDown" : "ArrowUp", Math.abs(dy)]])
            for (let offset = 0; offset < distance; offset += 20) {
                await socket.call("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode: key === "ArrowLeft" ? 37 : key === "ArrowUp" ? 38 : key === "ArrowRight" ? 39 : 40 });
                await socket.call("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode: key === "ArrowLeft" ? 37 : key === "ArrowUp" ? 38 : key === "ArrowRight" ? 39 : 40 });
            } };
        for (const [focused, kind, dx, dy, label] of panRows) {
            await socket.call("Emulation.setTouchEmulationEnabled", { enabled: false });
            await reloadFlowPage(`runtime027:pan:${label}`);
            await ensureFlowPanWorkspace(`Flow canvas mounted for ${label}`);
            if (kind === "touch")
                await socket.call("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
            await evaluate(`(async()=>{const painted=(selector)=>[...document.querySelectorAll(selector)].find(item=>{const box=item.getBoundingClientRect();return box.width>0&&box.height>0;}),toolbar=painted('[aria-label="Flow toolbar"]'),button=(text)=>{const found=[...toolbar.querySelectorAll('button')].find(item=>item.textContent.trim()===text);if(!found)throw new Error('Missing pan setup control '+text+' from '+[...toolbar.querySelectorAll('button')].map(item=>item.textContent.trim()).join('|'));return found;},active=document.body.classList.contains('flow-focus-canvas');if(active!==${focused})button(active?'Exit Focus Canvas':'Focus Canvas').click();/* Observe focus-layout animation before measuring Fit Flow. */await new Promise(resolve=>setTimeout(resolve,10));button('Fit Flow').click();/* Repeat the Zoom in control to observe bounded key-repeat behavior. */for(let count=0;count<20&&painted('[aria-label="Flow zoom percentage"]').textContent!=='200%';count+=1)button('Zoom in').click();painted('[aria-label="Flow canvas viewport"]').focus();})()`);
            const before = await evaluate(flowR02PanProbe(seeded));
            if (kind === "keyboard") {
                await evaluate(`(()=>{const viewport=[...document.querySelectorAll('[aria-label="Flow canvas viewport"]')].find(item=>{const box=item.getBoundingClientRect();return box.width>0&&box.height>0;});viewport.focus({preventScroll:true});})()`);
                await keyboardPan(dx, dy);
            }
            else if (kind === "touch") {
                await socket.call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: before.blank.x, y: before.blank.y, id: 77, radiusX: 1, radiusY: 1, force: 1 }] });
                // The press duration is the touch-pan gesture under test.
                await wait(20);
                await socket.call("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: before.blank.x + dx, y: before.blank.y + dy, id: 77, radiusX: 1, radiusY: 1, force: 1 }] });
                await socket.call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
                await socket.call("Emulation.setTouchEmulationEnabled", { enabled: false });
            }
            else {
                if (kind === "space")
                    await socket.call("Input.dispatchKeyEvent", { type: "rawKeyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
                await mousePan(kind === "space" ? before.item : before.blank, dx, dy, kind === "middle" ? "middle" : "left");
                if (kind === "space")
                    await socket.call("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
            }
            // Observe the pan render before reading its resulting camera state.
            await wait(10);
            const result = await evaluate(flowR02PanResult(seeded, before, dx, dy));
            const continuation = await evaluate(flowR02PanProbe(seeded));
            await mousePan(continuation.blank, 35, 25);
            const continued = await evaluate(flowR02PanResult(seeded, continuation, 35, 25));
            for (const [key, value] of Object.entries({ ...result, continued: continued.exactDelta && continued.zoomStable }))
                panEvidence[`${label}_${key}`] = value;
        }
        for (const [focused, label] of [[false, "mainPanPinch"], [true, "focusPanPinch"]]) {
            await socket.call("Emulation.setTouchEmulationEnabled", { enabled: false });
            await evaluate(`(()=>{const key=${JSON.stringify(flowR02ViewStorageKey(seeded))},prior=JSON.parse(sessionStorage.getItem(key)??'{}');sessionStorage.setItem(key,JSON.stringify({...prior,selectedItems:[]}));})()`);
            await reloadFlowPage(`runtime027:pinch:${label}`);
            await ensureFlowPanWorkspace(`Flow canvas mounted for ${label}`);
            await evaluate(`(async()=>{const painted=(selector)=>[...document.querySelectorAll(selector)].find(item=>{const box=item.getBoundingClientRect();return box.width>0&&box.height>0;}),toolbar=painted('[aria-label="Flow toolbar"]'),button=(text)=>[...toolbar.querySelectorAll('button')].find(item=>item.textContent.trim()===text),active=document.body.classList.contains('flow-focus-canvas');if(active!==${focused})button(active?'Exit Focus Canvas':'Focus Canvas').click();/* Observe focus-layout animation before measuring Fit Flow. */await new Promise(resolve=>setTimeout(resolve,10));button('Fit Flow').click();painted('[aria-label="Flow canvas viewport"]').focus();})()`);
            await socket.call("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 2 });
            const before = await evaluate(flowR02PanProbe(seeded)), first = { x: before.blank.x + 45, y: before.blank.y + 30, id: 91, radiusX: 1, radiusY: 1, force: 1 }, second = { x: first.x + 70, y: first.y, id: 92, radiusX: 1, radiusY: 1, force: 1 };
            await socket.call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...first, x: before.blank.x, y: before.blank.y }] });
            await socket.call("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [first] });
            await socket.call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first, second] });
            await socket.call("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...first, x: first.x - 25 }, { ...second, x: second.x + 25 }] });
            await socket.call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
            await socket.call("Emulation.setTouchEmulationEnabled", { enabled: false });
            // Observe pinch rendering before measuring the resulting camera.
            await wait(20);
            const after = await evaluate(flowR02PanProbe(seeded));
            await mousePan(after.item, 0, 0);
            // Observe item activation before asserting selection.
            await wait(20);
            const itemActivated = await evaluate(flowR02ItemActivationResult(after.item.id)), control = await evaluate(`(()=>{const painted=(selector)=>[...document.querySelectorAll(selector)].find(item=>{const box=item.getBoundingClientRect();return box.width>0&&box.height>0;}),toolbar=painted('[aria-label="Flow toolbar"]'),button=[...toolbar.querySelectorAll('button')].find(item=>item.textContent.trim()==='Zoom in'),box=button.getBoundingClientRect();return{x:box.left+box.width/2,y:box.top+box.height/2,zoom:JSON.parse(painted('[aria-label="Interactive directional Flow canvas"]').dataset.viewport).zoom};})()`);
            await mousePan(control, 0, 0);
            // Observe toolbar animation before asserting its zoom effect.
            await wait(20);
            const controlActivated = await evaluate(`JSON.parse(document.querySelector('[aria-label="Interactive directional Flow canvas"]').dataset.viewport).zoom>${control.zoom}`);
            for (const [key, value] of Object.entries({ gestureChanged: JSON.stringify(after.camera) !== JSON.stringify(before.camera), canonicalStable: after.graph === before.graph && after.revision === before.revision && after.undo === before.undo, selectionClearBefore: before.selection === '[]', itemActivated, controlActivated }))
                panEvidence[`${label}_${key}`] = value;
        }
        runtime.runtime027 = panEvidence;
        await evaluate(`(()=>{if(document.body.classList.contains('flow-focus-canvas')){const toolbar=[...document.querySelectorAll('[aria-label="Flow toolbar"]')].find(item=>{const box=item.getBoundingClientRect();return box.width>0&&box.height>0;});[...toolbar.querySelectorAll('button')].find(button=>button.textContent.trim()==='Exit Focus Canvas')?.click();}})()`);
        // Observe Focus Canvas exit animation before restoring the persisted graph.
        await wait(50);
        await evaluate(flowR02RestorePanGraph(seeded, originalPanState));
        await reloadFlowPage("runtime027:restore");
        await waitForBrowser("navigation", "project tree mounted after pan restoration", "#project-tree");
        if (!await evaluate("Boolean(document.querySelector('[aria-label=\"Flow toolbar\"]'))")) {
            await waitForBrowser("interaction", "Flows navigation mounted after pan restoration", "[data-kind=\"flows\"]");
            await evaluate("document.querySelector('[data-kind=\"flows\"]')?.click()");
            await observeBrowserReadiness({targetId,phase:"interaction",predicateDescription:"Checkout journey row mounted after pan restoration",timeoutMs:4000,pollIntervalMs:25,maximumSnapshotCharacters:400,observe:async()=>evaluate("(()=>{const rows=[...document.querySelectorAll('.entity-row button')],row=rows.find(item=>item.textContent==='Checkout journey');return{ready:Boolean(row),texts:rows.map(item=>item.textContent).slice(0,20)}})()"),ready:({ready})=>ready,snapshot:({texts})=>({texts})});
            await evaluate("(()=>{const row=[...document.querySelectorAll('.entity-row button')].find(item=>item.textContent==='Checkout journey');row.click();return true;})()");
        }
        await waitForBrowser("readiness", "Flow toolbar mounted after pan restoration", "[aria-label=\"Flow toolbar\"]");
        Object.assign(runtime, await evaluate(flowGraphCorrectiveWorkflow(
            seeded, { stopAfterRuntime: 20, targetId, browserShard })));
        runtime.runtime001 = geometryEvidence;
        runtime.runtime027 = panEvidence;
        await reloadFlowPage("core-workflow:evidence");
        await waitForBrowser("navigation", "interactive Flow canvas mounted after core workflow", "[aria-label=\"Interactive directional Flow canvas\"]");
        const reloadEvidence = await evaluate(flowGraphReloadEvidence(seeded));
        for (const [key, value] of Object.entries(reloadEvidence))
            runtime[key] = { ...runtime[key], ...value };
    }
    if (browserShard === "legacy") {
        const legacyContext = await evaluate(flowGraphLegacyContextSeed(seeded));
        await socket.call("Page.reload", { ignoreCache: true });
        await waitForBrowser("navigation", "project tree mounted for legacy context", "#project-tree");
        runtime.runtime017 = await evaluate(flowGraphLegacyContextEvidence(seeded, legacyContext));
        const legacyKinds = await evaluate(flowGraphRelationshipKindSeed(seeded));
        await socket.call("Page.reload", { ignoreCache: true });
        await waitForBrowser("navigation", "interactive Flow canvas mounted for relationship kinds", "[aria-label=\"Interactive directional Flow canvas\"]");
        runtime.runtime022 = await evaluate(flowGraphRelationshipKindEvidence(seeded, legacyKinds));
    }
    if (browserShard === "examples") {
        const reloadForExample = async (predicate) => {
            phaseTimer.transition("rendering");
            await socket.call("Page.reload", { ignoreCache: true });
            phaseTimer.transition("readiness");
            await waitForBrowser("readiness", predicate, "#project-tree");
        };
        phaseTimer.transition("persistence");
        const eventExample = await evaluate(flowGraphEventExampleSeed(seeded, "incomplete"));
        await reloadForExample("incomplete Event example rendered");
        phaseTimer.transition("example compilation");
        const eventExampleEvidence = await evaluate(flowGraphEventExampleIncompleteEvidence(seeded, eventExample));
        phaseTimer.transition("persistence");
        await evaluate(flowGraphEventExampleSeed(seeded, "invalid"));
        await reloadForExample("invalid Event example rendered");
        phaseTimer.transition("example compilation");
        const invalidEventExample = await evaluate(flowGraphEventExampleStateEvidence(seeded, eventExample, "Invalid", "/quantity", "TYPE"));
        phaseTimer.transition("persistence");
        await evaluate(flowGraphEventExampleSeed(seeded, "blocked"));
        await reloadForExample("blocked Event example rendered");
        phaseTimer.transition("example compilation");
        const blockedEventExample = await evaluate(flowGraphEventExampleStateEvidence(seeded, eventExample, "Blocked", "/runtime_conflict", "CONFLICT"));
        runtime.runtime021 = { ...eventExampleEvidence, invalid: invalidEventExample, blocked: blockedEventExample };
        phaseTimer.transition("persistence");
        const pageExample = await evaluate(flowGraphPageExampleSeed(seeded, "incomplete"));
        await reloadForExample("incomplete Page example rendered");
        phaseTimer.transition("example compilation");
        const pageExampleEvidence = await evaluate(flowGraphPageExampleIncompleteEvidence(seeded, pageExample));
        phaseTimer.transition("persistence");
        await evaluate(flowGraphPageExampleSeed(seeded, "invalid"));
        await reloadForExample("invalid Page example rendered");
        phaseTimer.transition("example compilation");
        const invalidPageExample = await evaluate(flowGraphPageExampleStateEvidence(pageExample, "Invalid", "/typed_page", "TYPE"));
        phaseTimer.transition("persistence");
        await evaluate(flowGraphPageExampleSeed(seeded, "blocked"));
        await reloadForExample("blocked Page example rendered");
        phaseTimer.transition("example compilation");
        const blockedPageExample = await evaluate(flowGraphPageExampleStateEvidence(pageExample, "Blocked", "/page_runtime_conflict", "CONFLICT"));
        runtime.runtime025 = { ...pageExampleEvidence, invalid: invalidPageExample, blocked: blockedPageExample };
    }
    if (browserShard === "author") {
        await reloadFlowPage("authoring:start");
        await ensureFlowWorkspace("Flow toolbar mounted for authoring");
        Object.assign(runtime, await evaluate(flowGraphCorrectiveWorkflow(seeded, { targetId, browserShard })));
        await reloadFlowPage("authoring:evidence");
        await waitForBrowser("navigation", "interactive Flow canvas mounted after authoring", "[aria-label=\"Interactive directional Flow canvas\"]");
        const reloadEvidence = await evaluate(flowGraphReloadEvidence(seeded));
        for (const [key, value] of Object.entries(reloadEvidence))
            runtime[key] = { ...runtime[key], ...value };
    }
    if ((browserShard === "core" && targetId === "FLOW_GRAPH_FALLBACK_TARGET") || browserShard === "author") {
        const repeatedInstances = await evaluate(flowGraphRepeatedInstanceSeed(seeded));
        await reloadFlowPage("runtime024:instances");
        await waitForBrowser("navigation", "project tree mounted for repeated instances", "#project-tree");
        runtime.runtime024 = { ...runtime.runtime024, ...await evaluate(flowGraphRepeatedInstanceEvidence(seeded, repeatedInstances)) };
    }
    transitionPhase("assertion");
    if(targetId==="FLOW_WORKSPACE_CONTROLS_TARGET")assert.deepEqual(reloadSequence,FLOW_WORKSPACE_CONTROLS_RELOAD_SEQUENCE,"Flow controls reload sequence changed");
    const fallbackCore = browserShard === "core" && targetId === "FLOW_GRAPH_FALLBACK_TARGET", supplemental = new Set(["runtime017", "runtime021", "runtime022", "runtime025"]), missing = fallbackCore ? FLOW_RUNTIME_KEYS.filter(key => !supplemental.has(key) && !runtime[key]).map(path => ({ path, value: "unexecuted" })) : [], falseLeaves = Object.entries(runtime).flatMap(([runtimeKey, evidence]) => Object.entries(evidence).filter(([, value]) => value !== true).map(([key, value]) => ({ path: `${runtimeKey}.${key}`, value }))), shardFailures = [...missing, ...falseLeaves, ...(fallbackCore && runtime.installedBoundary !== true ? [{ path: "installedBoundary", value: runtime.installedBoundary }] : [])];
    assert.deepEqual(shardFailures, [], `Flow browser ${browserShard} evidence contains a false value`);
    const controlRuntimeKeys = new Set(["runtime001", "runtime016", "runtime018", "runtime020", "runtime027"]);
    flowGraph = targetId === "FLOW_STYLESHEET_EXTRACTION_TARGET"
        ? {styles:runtime.styles}
        : targetId === "FLOW_WORKSPACE_CONTROLS_TARGET"
        ? Object.fromEntries(Object.entries(runtime).filter(([key]) => controlRuntimeKeys.has(key)))
        : targetId === "FLOW_WORKSPACE_AUTHORING_TARGET"
            ? Object.fromEntries(Object.entries(runtime).filter(([key]) =>
                key === "installedBoundary" || !controlRuntimeKeys.has(key)))
            : runtime;
    },cleanup:async({failure,signal})=>{
    lifecycleFailedAtPhase=failure?phaseTimer.activePhase:undefined;
    transitionPhase("cleanup");
    const completedTargetId = activeTargetPageId;
    socket?.close();socket=undefined;
    if(completedTargetId)
        await fetch(`http://127.0.0.1:${port}/json/close/${encodeURIComponent(completedTargetId)}`,{signal});
    activeTargetPageId=undefined;
    },finalize:({failure})=>{
    phaseTiming = phaseTimer.finish({status:failure?"failed":"passed",failedAtPhase:lifecycleFailedAtPhase});
    const durationMs = phaseTiming.durationMs;
    activeTargetTimer=undefined;activeTargetId=undefined;
    if(failure){console.log(JSON.stringify({swarmforgeBrowserTargetResult:{id:targetId,status:"failed",error:failure.message}}));console.log(JSON.stringify({swarmforgeBrowserTargetTiming:{id:targetId,durationMs,phases:phaseTiming.phases,activePhase:phaseTiming.activePhase}}));}
    }});
    const durationMs = phaseTiming.durationMs;
    console.log(JSON.stringify({ flowGraph }));
    if (selectedTargetIds.length) {
        console.log(JSON.stringify({ swarmforgeBrowserTargetResult: { id: targetId, status: "passed" } }));
        console.log(JSON.stringify({ swarmforgeBrowserTargetTiming: { id: targetId, durationMs,
            phases: phaseTiming.phases } }));
    }
    }
    if (selectedTargetIds.length)
        console.log(JSON.stringify({ swarmforgeBrowserLaunches: 1 }));
}
catch (error) {
    throw new Error(`Flow runtime interruption: ${JSON.stringify(flowInterruptionReport(activePhase, error))}`, { cause: error });
}
finally {
    socket?.close();
    await stopHeadlessChrome(chrome,3000,{targetId:"flow-browser-process"});
    await removeChromeProfile(profile, { targetId: "flow-graph" });
}
