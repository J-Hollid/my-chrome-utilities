import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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
import { encodeDevtoolsTextFrame, observeFlowPointerClickOwnership, planFlowBrowserTargets } from "../support/flow-workspace-r02-runtime.mjs";
const normalizedRepairValue=value=>Array.isArray(value)?value.map(normalizedRepairValue):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalizedRepairValue(nested)])):value;
const repairDigest=value=>createHash("sha256").update(JSON.stringify(normalizedRepairValue(value))).digest("hex");
function flowVisualRepairProtocol(runtime){const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);if(context.causalCategory==="readiness or settling"){const expectedPreRepairFailure={paintedConnectionPorts:false,pointerRelationshipCommitted:false},expectedRepairResult={paintedConnectionPorts:true,pointerRelationshipCommitted:true},observed={paintedConnectionPorts:runtime.runtime009?.temporaryEdge===true&&runtime.runtime009?.validTarget===true,pointerRelationshipCommitted:runtime.runtime009?.committed===true},fixture={id:"flow-connection-port-paint-readiness-v1",causalCategory:context.causalCategory,diagnosedBoundaryDigest:repairDigest(context.diagnosedBoundary),input:{interaction:"pointer connection",requiredGeometry:"nonzero connected source and target ports"},expectedPreRepairFailure,expectedRepairResult},fixtureDigest=repairDigest(fixture);assert.deepEqual(observed,expectedRepairResult);return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},repairResult:{status:"passed",fixtureDigest,observed}};}const expectedPreRepairFailure={visibleThumbnailHydrated:false,installedBoundaryObserved:false},expectedRepairResult={visibleThumbnailHydrated:true,installedBoundaryObserved:true},observed={visibleThumbnailHydrated:Number(runtime.runtime035?.measurements?.near?.count??0)>=2,installedBoundaryObserved:runtime.runtime035?.boundedHydration===true},fixture={id:"flow-visual-background-visibility-hydration-v1",causalCategory:context.causalCategory,diagnosedBoundaryDigest:repairDigest(context.diagnosedBoundary),input:{visibilityTrigger:"thumbnail mode transition",backgroundObservation:true,offscreenAsset:true},expectedPreRepairFailure,expectedRepairResult},fixtureDigest=repairDigest(fixture);assert.deepEqual(observed,expectedRepairResult);return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},repairResult:{status:"passed",fixtureDigest,observed}};}
const measuredModuleCoverage=async(socket,modulePath)=>{
    const {result}=await socket.call("Profiler.takePreciseCoverage"),script=result.find(({url})=>url.endsWith(`/${modulePath}`));
    assert.ok(script,`Precise browser coverage did not observe ${modulePath}`);
    const source=await readFile(path.resolve("dist",modulePath),"utf8"),ranges=script.functions.flatMap(({ranges})=>ranges),lineOffsets=[];
    for(let start=0;start<source.length;){const end=source.indexOf("\n",start),finish=end<0?source.length:end,line=source.slice(start,finish),first=line.search(/\S/u);if(first>=0)lineOffsets.push(start+first);if(end<0)break;start=end+1;}
    const executed=position=>ranges.filter(({startOffset,endOffset})=>startOffset<=position&&position<endOffset).sort((left,right)=>(left.endOffset-left.startOffset)-(right.endOffset-right.startOffset))[0]?.count>0,coveredLines=lineOffsets.filter(executed).length,coveredFunctions=script.functions.filter(({ranges:[entry]})=>entry?.count>0).length;
    return{lines:coveredLines/lineOffsets.length,functions:coveredFunctions/script.functions.length,coveredLines,totalLines:lineOffsets.length,coveredFunctions,totalFunctions:script.functions.length};
};
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
const flowStylesheetExtractionBase = "66b91e38e6";
const gitShow = (revision, file) => new Promise((resolve, reject) => execFile(
    "git", ["show", `${revision}:${file}`], { encoding:"utf8", maxBuffer:2_000_000 },
    (error, stdout, stderr) => error ? reject(new Error(stderr || error.message)) : resolve(stdout),
));
const flowStyleBaseline = selectedTargets.some(({ id }) => id === "FLOW_STYLESHEET_EXTRACTION_TARGET")
    ? {
        base:await gitShow(flowStylesheetExtractionBase, "specification-builder.css"),
        brand:await gitShow(flowStylesheetExtractionBase, "specification-builder-brand.css"),
    }
    : undefined;
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
    let evaluationSequence = 0;
    const evaluate = async (expression, phase = activePhase) => {
      const key = `${targetId}:${++evaluationSequence}`;
      const transmit = async (source) => {
        const response = await transmitDevtoolsProgram({targetId,phase,source,shape:"expression",
          call:socket.call.bind(socket),parameters:{returnByValue:true,userGesture:true}});
        if (response.exceptionDetails)
          throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
        return response.result.value;
      };
      let state = await transmit(`(()=>{globalThis.__flowEvaluationStates??={};const key=${JSON.stringify(key)};
        try{const value=(${expression});if(value&&typeof value.then==='function'){
          globalThis.__flowEvaluationStates[key]={status:'pending'};Promise.resolve(value)
            .then(result=>{globalThis.__flowEvaluationStates[key]={status:'passed',value:result};},error=>{
              globalThis.__flowEvaluationStates[key]={status:'failed',message:String(error?.message??error)};
            });return{status:'pending'};}return{status:'passed',value};}
        catch(error){return{status:'failed',message:String(error?.message??error)};}})()`);
      if (state.status === "pending") state = await observeBrowserReadiness({targetId,phase,
        predicateDescription:"detached Flow evaluation settlement",timeoutMs:120000,
        pollIntervalMs:20,maximumSnapshotCharacters:500,
        observe:async()=>transmit(`globalThis.__flowEvaluationStates?.[${JSON.stringify(key)}]`),
        ready:observed=>observed?.status!=="pending",snapshot:observed=>observed});
      await transmit(`delete globalThis.__flowEvaluationStates?.[${JSON.stringify(key)}]`);
      if (state.status === "failed") throw new Error(state.message);
      return state.value;
    };
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
    const seeded = await evaluate(`(async()=>{const {createSpecificationProject,addProjectEntity}=await import('./data-layer-specification-project.js'),{createFlowSection,addFlowPageFrameToSection}=await import('./data-layer-property-set-flow-section.js'),{addGraphOccurrence,saveGraphRelationship}=await import('./data-layer-flow-graph.js'),{openIndexedDbProjectRepository}=await import('./data-layer-durable-project-repository.js');let n=0,id=(kind)=>kind+':runtime:'+ ++n,state=createSpecificationProject({name:'Flow runtime',site:'runtime.example',id});const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);},routeProperties=(prefix,first)=>[first,...Array.from({length:18},(_,index)=>({path:'/'+prefix+'_'+String(index+1).padStart(2,'0'),type:index%3===0?'number':'string',presence:'optional'}))],propertySet=add('propertySets',{name:'Checkout',schemaConstraints:routeProperties('checkout_property',{path:'/currency',type:'string',examples:['EUR']})}),application=(name)=>({id:id('application'),name:'Checkout',propertySetId:propertySet.id}),confirmation=add('pages',{name:'Customer details',propertySetApplications:[application()]}),payment=add('pages',{name:'Payment',propertySetApplications:[application()]}),receipt=add('pages',{name:'ID verification',propertySetApplications:[application()]}),summary=add('pages',{name:'Summary',propertySetApplications:[application()],localSchemaContributions:[{path:'/page_missing',type:'string',presence:'required'}]}),purchase=add('events',{name:'Purchase',eventName:'purchase',schemaConstraints:routeProperties('event_property',{path:'/event',type:'string',examples:['purchase']})}),review=add('events',{name:'Review',eventName:'review',schemaConstraints:[{path:'/event_missing',type:'string',presence:'required'}]}),flow=add('flows',{name:'Checkout journey',steps:[]}),otherFlow=add('flows',{name:'Returns journey',steps:[]});state=addFlowPageFrameToSection(state,otherFlow.id,receipt.id,undefined,id);state=createFlowSection(state,flow.id,{name:'Checkout',bounds:{x:20,y:20,width:760,height:300}},id);state=createFlowSection(state,flow.id,{name:'Completion',bounds:{x:20,y:360,height:260,width:760}},id);let graph=state.project.documentationFlowGraphs[flow.id],sections=graph.sections;for(const [page,sectionId]of[[confirmation,sections[0].id],[payment,sections[0].id],[receipt,sections[1].id],[confirmation,undefined],[summary,sections[1].id]])state=addFlowPageFrameToSection(state,flow.id,page.id,sectionId,id);graph=state.project.documentationFlowGraphs[flow.id];const frames=graph.pageFrames;state=addGraphOccurrence(state,flow.id,{name:'Purchase',pageFrameId:frames[0].id,pageId:confirmation.id,eventId:purchase.id,obligation:'Required',minimum:1,maximum:1,x:24,y:70},id);state=addGraphOccurrence(state,flow.id,{name:'Review',pageFrameId:frames[1].id,pageId:payment.id,eventId:review.id,obligation:'Required',minimum:1,maximum:1,x:24,y:70},id);state=saveGraphRelationship(state,flow.id,frames[0].id,{toStepId:frames[1].id,sourcePort:'right',targetPort:'left',label:'Checkout route'},id);state=saveGraphRelationship(state,flow.id,frames[0].id,{toStepId:frames[2].id,sourcePort:'top',targetPort:'bottom'},id);graph=state.project.documentationFlowGraphs[flow.id];const repository=await openIndexedDbProjectRepository();await repository.putProject(state,{active:true,navigation:{kind:'flows',id:flow.id}});return{projectId:state.project.id,flowId:flow.id,otherFlowId:otherFlow.id,pageIds:[confirmation.id,payment.id,receipt.id],summaryPageId:summary.id,frameIds:graph.pageFrames.map(({id})=>id),summaryFrameId:graph.pageFrames.find(({pageId})=>pageId===summary.id).id,occurrenceIds:graph.occurrences.map(({id})=>id),relationshipIds:graph.relationships.map(({id})=>id),sectionIds:graph.sections.map(({id})=>id)};})()`);
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
        if (targetId === "FLOW_STYLESHEET_EXTRACTION_TARGET") {
        const styleStateBefore = await evaluate(`(async()=>{const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),loaded=await repository.loadProject(${JSON.stringify(seeded.projectId)}),graph=loaded.state.project.documentationFlowGraphs[${JSON.stringify(seeded.flowId)}];return JSON.stringify({project:loaded.state.project,graph,revision:loaded.draftSequence,undo:loaded.state.history.undo.length});})()`);
        assert.ok(flowStyleBaseline, "Flow stylesheet extraction requires its approved-base styles");
        const switchFlowStyles = async (mode) => evaluate(`(async()=>{const mode=${JSON.stringify(mode)},paths={base:'/specification-builder.css',brand:'/specification-builder-brand.css',local:'/flow-graph/flow-workspace.css',bridge:'/flow-graph/flow-workspace-shell.css'},links=[...document.querySelectorAll('link[rel="stylesheet"]')],linkFor=(path)=>links.find(link=>new URL(link.href).pathname===path);document.querySelectorAll('style[data-flow-extraction-baseline]').forEach(node=>node.remove());for(const path of Object.values(paths)){const link=linkFor(path);if(!link)throw new Error('Missing installed stylesheet '+path);link.media=mode==='base'?'not all':'';}if(mode==='base'){for(const [path,source]of[[paths.base,${JSON.stringify(flowStyleBaseline.base)}],[paths.brand,${JSON.stringify(flowStyleBaseline.brand)}]]){const link=linkFor(path),style=document.createElement('style');style.dataset.flowExtractionBaseline=path;style.textContent=source;link.before(style);}}await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return{mode,baselineCount:document.querySelectorAll('style[data-flow-extraction-baseline]').length,suppressed:links.filter(link=>link.media==='not all').map(link=>new URL(link.href).pathname).sort()};})()`);
        const configureFlowState = async ({ focusCanvas, selected, surface }) => evaluate(`(async()=>{const button=(label)=>[...document.querySelectorAll('[aria-label="Flow toolbar"] button')].find(item=>item.textContent.trim()===label),focus=${focusCanvas};if(document.body.classList.contains('flow-focus-canvas')!==focus)button(focus?'Focus Canvas':'Exit Focus Canvas')?.click();const open=[...document.querySelectorAll('[aria-label="Flow toolbar"] [data-flow-surface][aria-expanded="true"]')][0];if(open)open.click();if(${selected}){const frame=document.querySelector('g[data-page-frame-id]:not([data-occurrence-id])');if(!frame)throw new Error('Missing Page frame for style state');if(!frame.classList.contains('is-selected'))frame.dispatchEvent(new MouseEvent('click',{bubbles:true}));}if(${JSON.stringify(surface)}!=='none'){const target=button(${JSON.stringify(surface === "none" ? "" : surface[0].toUpperCase() + surface.slice(1))});if(!target)throw new Error('Missing Flow surface control');target.click();}await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return{focusCanvas:document.body.classList.contains('flow-focus-canvas'),selected:Boolean(document.querySelector('g[data-page-frame-id].is-selected')),surface:document.querySelector('.flow-workspace-surface')?.dataset.flowWorkspaceSurface??${JSON.stringify(surface)}};})()`);
        const setFlowZoom = async (percent) => evaluate(`(async()=>{const toolbar=document.querySelector('[aria-label="Flow toolbar"]'),button=(label)=>[...toolbar.querySelectorAll('button')].find(item=>item.textContent.trim()===label),output=toolbar.querySelector('[aria-label="Flow zoom percentage"]'),target=${percent};button('100 percent').click();/* Observe bounded key-repeat behavior across the declared 25-200 percent zoom range. */for(let count=0;count<12&&Number.parseInt(output.textContent,10)!==target;count+=1)button(target<100?'Zoom out':'Zoom in').click();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const observed=Number.parseInt(output.textContent,10);if(observed!==target)throw new Error('Flow camera did not reach '+target+'%; observed '+observed+'%');return observed;})()`);
        const captureFlowPresentation = async ({ state, viewport, displayMode, surface, zoom }) => evaluate(`(()=>{
            const rect=(node)=>{const box=node?.getBoundingClientRect();return box?Object.fromEntries(['left','top','right','bottom','width','height'].map(key=>[key,Math.round(box[key]*100)/100])):null;};
            const style=(node,properties)=>{const computed=node?getComputedStyle(node):null;return computed?Object.fromEntries(properties.map(key=>[key,computed[key]])):null;};
            const painted=(node)=>{const box=node?.getBoundingClientRect();return Boolean(box&&box.width>0&&box.height>0&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden');};
            const workspace=document.querySelector('.documentary-flow'),toolbar=document.querySelector('[aria-label="Flow toolbar"]'),canvas=document.querySelector('[aria-label="Interactive directional Flow canvas"]'),viewportNode=document.querySelector('.flow-canvas-viewport'),page=document.querySelector('g[data-page-frame-id]:not([data-occurrence-id])'),pageRect=page?.querySelector('.flow-page-frame'),event=document.querySelector('.flow-node'),eventRect=event?.querySelector('rect'),port=page?.querySelector('[data-input-port-for],[data-output-port-for]')??document.querySelector('[data-flow-port-for]'),edge=document.querySelector('.flow-edge'),edgeLine=edge?.querySelector('line'),panel=document.querySelector('.flow-workspace-surface'),minimap=document.querySelector('.flow-minimap');
            const controls=['Add','Focus Canvas','Exit Focus Canvas','Zoom in','Zoom out','Fit Flow','Outline','Details'];
            const visibleControls=controls.filter(label=>[...toolbar.querySelectorAll('button')].some(button=>button.textContent.trim()===label&&painted(button)));
            const boxes={workspace:rect(workspace),toolbar:rect(toolbar),viewport:rect(viewportNode),canvas:rect(canvas),page:rect(page),event:rect(event),port:rect(port),edge:rect(edge),surface:rect(panel),minimap:rect(minimap)};
            const styles={workspace:style(workspace,['display','position','overflow','backgroundColor','borderTopStyle']),canvas:style(canvas,['display','backgroundColor','borderTopColor','borderTopWidth','touchAction']),page:style(pageRect,['fill','stroke','strokeWidth']),event:style(eventRect,['fill','stroke','strokeWidth','filter']),port:style(port,['fill','stroke','strokeWidth','opacity','visibility','pointerEvents']),edge:style(edgeLine,['stroke','strokeWidth','strokeDasharray']),toolbar:style(toolbar,['display','position','overflowX','backgroundColor','borderTopStyle']),surface:style(panel,['display','position','overflow','backgroundColor','borderTopStyle'])};
            const shellBoxes=[workspace,toolbar,viewportNode,canvas,...(${JSON.stringify(surface)}==='none'?[]:[panel])].map(rect).filter(Boolean);
            const horizontalContained=shellBoxes.every(box=>box.left>=-1.5&&box.right<=innerWidth+1.5);
            const desktopContained=shellBoxes.every(box=>box.left>=-1.5&&box.top>=-1.5&&box.right<=innerWidth+1.5&&box.bottom<=innerHeight+1.5);
            const selectedPortVisible=${JSON.stringify(state)}!=='selected Page with visible ports'||Boolean(painted(port)&&Number.parseFloat(getComputedStyle(port).opacity)>0);
            const requiredPainted=[workspace,toolbar,viewportNode,canvas,page,edge,...(${zoom}>=100?[event]:[])].every(painted)&&(${JSON.stringify(surface)}==='none'||painted(panel));
            const zoomText=document.querySelector('[aria-label="Flow zoom percentage"]')?.textContent?.trim();
            return{state:${JSON.stringify(state)},viewport:${JSON.stringify(viewport)},displayMode:${JSON.stringify(displayMode)},surface:${JSON.stringify(surface)},zoom:${zoom},zoomText,boxes,styles,visibleControls,requiredPainted,selectedPortVisible,horizontalContained,desktopContained,documentHorizontalOverflow:document.documentElement.scrollWidth>innerWidth,focusCanvas:document.body.classList.contains('flow-focus-canvas'),media:{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,forcedColors:matchMedia('(forced-colors: active)').matches}};
        })()`);
        const equivalentRect = (base, candidate) => base === null || candidate === null
            ? base === candidate
            : Object.keys(base).every((key) => Math.abs(base[key] - candidate[key]) <= 0.75);
        const samePresentation = (base, candidate) =>
            JSON.stringify(base.styles) === JSON.stringify(candidate.styles) &&
            JSON.stringify(base.visibleControls) === JSON.stringify(candidate.visibleControls) &&
            Object.keys(base.boxes).every((key) => equivalentRect(base.boxes[key], candidate.boxes[key])) &&
            base.zoomText === candidate.zoomText && base.focusCanvas === candidate.focusCanvas &&
            JSON.stringify(base.media) === JSON.stringify(candidate.media);
        const equivalentPresentation = (base, candidate, { narrow }) =>
            samePresentation(base, candidate) && base.requiredPainted && candidate.requiredPainted &&
            base.selectedPortVisible && base.horizontalContained && !base.documentHorizontalOverflow &&
            candidate.selectedPortVisible && candidate.horizontalContained && !candidate.documentHorizontalOverflow &&
            (narrow || (base.desktopContained && candidate.desktopContained));
        const stateRows = [
            { state:"ordinary canvas with Page and Event cards", viewport:"desktop", width:1440, height:900, displayMode:"ordinary Flow", focusCanvas:false, selected:false, surfaces:["none"] },
            { state:"selected Page with visible ports", viewport:"360 by 800", width:360, height:800, displayMode:"ordinary Flow", focusCanvas:false, selected:true, surfaces:["none"] },
            { state:"open contextual Details and Outline", viewport:"desktop", width:1440, height:900, displayMode:"ordinary Flow", focusCanvas:false, selected:true, surfaces:["outline", "details"] },
            { state:"complete canvas and overlay controls", viewport:"360 by 800", width:360, height:800, displayMode:"Focus Canvas", focusCanvas:true, selected:true, surfaces:["outline"] },
        ];
        const stateMeasurements = [];
        for (const row of stateRows) {
            await socket.call("Emulation.setDeviceMetricsOverride", { width:row.width, height:row.height, deviceScaleFactor:1, mobile:false });
            for (const surface of row.surfaces) {
                await configureFlowState({ ...row, surface });
                for (const zoom of [25, 100, 200]) {
                    await setFlowZoom(zoom);
                    await switchFlowStyles("base");
                    const base = await captureFlowPresentation({ ...row, surface, zoom });
                    await switchFlowStyles("candidate");
                    const candidate = await captureFlowPresentation({ ...row, surface, zoom });
                    stateMeasurements.push({ state:row.state, viewport:row.viewport,
                        displayMode:row.displayMode, surface, zoom, base, candidate,
                        equivalent:equivalentPresentation(base, candidate, { narrow:row.width === 360 }) });
                }
            }
        }
        const mediaMeasurements = {};
        await socket.call("Emulation.setDeviceMetricsOverride", { width:1440, height:900, deviceScaleFactor:1, mobile:false });
        await configureFlowState({ focusCanvas:false, selected:true, surface:"none" });
        await setFlowZoom(100);
        for (const [name, features] of [
            ["reducedMotion", [{name:"prefers-reduced-motion",value:"reduce"}]],
            ["forcedColors", [{name:"forced-colors",value:"active"}]],
        ]) {
            await socket.call("Emulation.setEmulatedMedia", { features });
            await switchFlowStyles("base");
            const base = await captureFlowPresentation({ state:name, viewport:"desktop", displayMode:"ordinary Flow", surface:"none", zoom:100 });
            await switchFlowStyles("candidate");
            const candidate = await captureFlowPresentation({ state:name, viewport:"desktop", displayMode:"ordinary Flow", surface:"none", zoom:100 });
            mediaMeasurements[name] = { base, candidate, equivalent:JSON.stringify(base)===JSON.stringify(candidate), active:base.media[name]&&candidate.media[name] };
        }
        await socket.call("Emulation.setEmulatedMedia", { features:[] });
        const focusMeasurements = {};
        for (const mode of ["base", "candidate"]) {
            await switchFlowStyles(mode);
            await evaluate("document.querySelector('[aria-label=\"Flow toolbar\"] button')?.focus()");
            await socket.call("Input.dispatchKeyEvent", {type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
            await socket.call("Input.dispatchKeyEvent", {type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
            focusMeasurements[mode] = await evaluate("(()=>{const active=document.activeElement,computed=getComputedStyle(active),box=active.getBoundingClientRect();return{label:active.textContent.trim(),insideFlow:Boolean(active.closest('.documentary-flow')),focusVisible:active.matches(':focus-visible'),affordance:computed.outlineStyle!=='none'||computed.borderStyle!=='none'||computed.boxShadow!=='none',rect:{width:Math.round(box.width*100)/100,height:Math.round(box.height*100)/100},outlineStyle:computed.outlineStyle,borderStyle:computed.borderStyle,boxShadow:computed.boxShadow};})()");
        }
        await switchFlowStyles("candidate");
        const assetPresentation = await evaluate(`(()=>{const hrefs=[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>new URL(link.href).pathname),required=['/flow-graph/flow-workspace.css','/flow-graph/flow-workspace-shell.css'],toolbar=document.querySelector('[aria-label="Flow toolbar"]'),buttons=[...toolbar.querySelectorAll('button')],visible=(label)=>buttons.some(item=>item.textContent.trim()===label&&item.getBoundingClientRect().width>0);return{assetsLoaded:required.every(path=>hrefs.filter(href=>href===path).length===1),visibleControls:['Add','Zoom in','Fit Flow','Outline','Details'].every(visible)&&(visible('Focus Canvas')||visible('Exit Focus Canvas'))};})()`);
        const styleStateAfter = await evaluate(`(async()=>{const repository=await(await import('./data-layer-durable-project-repository.js')).openIndexedDbProjectRepository(),loaded=await repository.loadProject(${JSON.stringify(seeded.projectId)}),graph=loaded.state.project.documentationFlowGraphs[${JSON.stringify(seeded.flowId)}];return JSON.stringify({project:loaded.state.project,graph,revision:loaded.draftSequence,undo:loaded.state.history.undo.length});})()`);
        const equivalence = stateMeasurements.every(({ equivalent }) => equivalent);
        const reducedMotion = mediaMeasurements.reducedMotion.equivalent && mediaMeasurements.reducedMotion.active;
        const forcedColors = mediaMeasurements.forcedColors.equivalent && mediaMeasurements.forcedColors.active &&
            mediaMeasurements.forcedColors.base.styles.page.stroke !== "none";
        const comparableFocus = ({ boxShadow:unusedBoxShadow, ...measurement }) => measurement;
        const keyboardFocus = JSON.stringify(comparableFocus(focusMeasurements.base)) ===
            JSON.stringify(comparableFocus(focusMeasurements.candidate)) &&
            focusMeasurements.base.insideFlow && focusMeasurements.base.focusVisible && focusMeasurements.base.affordance &&
            focusMeasurements.base.rect.width > 0 && focusMeasurements.base.rect.height > 0;
        runtime.styles = {
            ...assetPresentation,
            computedPresentation:equivalence,
            zoomGeometry:equivalence && stateMeasurements.every(({ base }) => ["25%", "100%", "200%"].includes(base.zoomText)),
            reducedMotion,
            forcedColors,
            keyboardFocus,
            canonicalStable:styleStateAfter===styleStateBefore,
            equivalence,
            measurements:{ baseCommit:flowStylesheetExtractionBase, states:stateMeasurements,
                media:mediaMeasurements, focus:focusMeasurements },
        };
        }
        if (targetId !== "FLOW_STYLESHEET_EXTRACTION_TARGET") {
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
        let viewerModuleCoverage;const measureViewerCoverage=targetId==="FLOW_WORKSPACE_AUTHORING_TARGET";
        if(measureViewerCoverage){
            await socket.call("Profiler.enable");
            await socket.call("Profiler.startPreciseCoverage",{callCount:true,detailed:true});
        }
        Object.assign(runtime, await evaluate(flowGraphCorrectiveWorkflow(
            seeded, { stopAfterRuntime: 20, targetId, browserShard })));
        if (targetId === "FLOW_WORKSPACE_CONTROLS_TARGET")
            Object.assign(runtime, await observeFlowPointerClickOwnership(seeded, { evaluate, socket }));
        if(measureViewerCoverage){
            viewerModuleCoverage=await measuredModuleCoverage(socket,"flow-graph/concept-visual-ui.js");
            assert.ok(viewerModuleCoverage.lines>.8&&viewerModuleCoverage.functions>.8,
                `Installed concept visual UI coverage fell below 80%: ${JSON.stringify(viewerModuleCoverage)}`);
            await socket.call("Profiler.stopPreciseCoverage");
            await socket.call("Profiler.disable");
        }
        runtime.runtime001 = geometryEvidence;
        runtime.runtime027 = panEvidence;
        await reloadFlowPage("core-workflow:evidence");
        await waitForBrowser("navigation", "interactive Flow canvas mounted after core workflow", "[aria-label=\"Interactive directional Flow canvas\"]");
        const reloadEvidence = await evaluate(flowGraphReloadEvidence(seeded));
        for (const [key, value] of Object.entries(reloadEvidence))
            runtime[key] = { ...runtime[key], ...value };
        if(viewerModuleCoverage){
            runtime.runtime035.measurements={...runtime.runtime035.measurements,viewerModuleCoverage};
        }
        }
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
        const viewerMeasurements=[];
        for(const [width,height] of [[360,800],[1440,900]]){
            await socket.call("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});
            await observeBrowserReadiness({targetId,phase:"readiness",predicateDescription:`Concept Visual viewer viewport rendered at ${width} by ${height}`,timeoutMs:2000,pollIntervalMs:25,maximumSnapshotCharacters:200,observe:async()=>evaluate("({width:innerWidth,height:innerHeight})"),ready:(viewport)=>viewport.width===width&&viewport.height===height,snapshot:(viewport)=>viewport});
            viewerMeasurements.push(await evaluate("globalThis.flowConceptVisualViewerProbe.measure()"));
        }
        const viewerInteractions=await evaluate("globalThis.flowConceptVisualViewerProbe.interact()");
        runtime.runtime038={
            contained:viewerMeasurements.every(({contained})=>contained),
            fixedControls:viewerMeasurements.every(({fixedControls})=>fixedControls),
            scrollbarFree:viewerMeasurements.every(({scrollbarFree})=>scrollbarFree),
            fitComplete:viewerMeasurements.every(({fitComplete})=>fitComplete),
            actualScale:viewerMeasurements.every(({actualScale})=>actualScale),
            metadata:viewerMeasurements.every(({metadata})=>metadata),
            focusReturned:viewerMeasurements.every(({focusReturned})=>focusReturned),
            stateInvariant:viewerMeasurements.every(({stateInvariant})=>stateInvariant),
            measurements:viewerMeasurements.map(({measurement})=>measurement),
        };
        viewerInteractions.runtime041.scrollbarFree=viewerMeasurements.every(({scrollbarFree})=>scrollbarFree);
        Object.assign(runtime,viewerInteractions);
        Object.assign(runtime, await observeFlowPointerClickOwnership(seeded, { evaluate, socket }));
        const callSnapProbe = (expression) => evaluate(`globalThis.flowRelationshipSnapProbe.${expression}`);
        const mouse = async (type, point) => socket.call("Input.dispatchMouseEvent", {
            type, x:point.clientX, y:point.clientY,
            button:type === "mouseMoved" ? "none" : "left",
            buttons:type === "mouseReleased" ? 0 : type === "mouseMoved" ? 1 : 1,
            ...(type === "mousePressed" || type === "mouseReleased" ? {clickCount:1} : {}),
        });
        const touch = async (type, point) => socket.call("Input.dispatchTouchEvent", {
            type, touchPoints:type === "touchCancel" ? [] : [{
                x:point.clientX, y:point.clientY, id:71, radiusX:1, radiusY:1, force:1,
            }],
        });
        const escape = async () => {
            const key={key:"Escape",code:"Escape",windowsVirtualKeyCode:27,nativeVirtualKeyCode:27};
            await socket.call("Input.dispatchKeyEvent",{type:"keyDown",...key});
            await socket.call("Input.dispatchKeyEvent",{type:"keyUp",...key});
        };
        const commitRows=[
            {zoom:25,source:"Customer details",sourceSide:"right",target:"Payment",targetSide:"left",kind:"expected_next"},
            {zoom:100,source:"Customer details",sourceSide:"top",target:"ID verification",targetSide:"bottom",kind:"alternative"},
            {zoom:200,source:"ID verification",sourceSide:"bottom",target:"Payment",targetSide:"top",kind:"merge"},
        ], commitResults=[];
        for(const row of commitRows){
            const prepared=await callSnapProbe(`prepareCommit(${JSON.stringify(row)})`);
            await mouse("mousePressed",prepared.sourcePoint);
            const started=await callSnapProbe("started()");
            const interaction=await callSnapProbe("interactionPoints()");
            await mouse("mouseMoved",interaction.haloPoint);
            const acquired=await callSnapProbe("acquired()");
            if(![acquired.portOnly,acquired.previewPinned,acquired.nonColorEmphasis,acquired.statusNamed].every(Boolean))throw new Error(`Native Flow snap acquisition failed: ${JSON.stringify({row,prepared,interaction,started,acquired})}`);
            await mouse("mouseReleased",interaction.haloPoint);
            const finished=await callSnapProbe("finishCommit()");
            commitResults.push({...row,...prepared,...interaction,...started,...acquired,...finished});
        }
        runtime.runtime028={
            actualPointerInput:commitResults.length===3&&commitResults.every(({preview})=>preview),
            pageBodyHalo:commitResults.every(({pageBodyHalo})=>pageBodyHalo),
            exactExamples:commitResults.every(({exactExample})=>exactExample),
            visibleInteraction:commitResults.every(({visibleInteraction})=>visibleInteraction),
            noArbitraryTarget:commitResults.every(({noArbitraryTarget})=>noArbitraryTarget),
            previewPinned:commitResults.every(({previewPinned})=>previewPinned),
            portOnly:commitResults.every(({portOnly,nonColorEmphasis})=>portOnly&&nonColorEmphasis),
            statusNamed:commitResults.every(({statusNamed})=>statusNamed),
            identity:commitResults.every(({identity})=>identity),
            definitionsStable:commitResults.every(({definitionsStable})=>definitionsStable),
            noEndpointForm:commitResults.every(({noEndpointForm})=>noEndpointForm),
            measurements:{relationshipSnap:commitResults},
        };
        const cancellationRows=[
            {zoom:25,source:"Customer details",sourceSide:"right",target:"Payment",targetSide:"left",transfer:"Summary",kind:"expected_next",cancel:"Escape"},
            {zoom:100,source:"Customer details",sourceSide:"right",target:"Payment",targetSide:"left",transfer:"Summary",kind:"expected_next",cancel:"pointer cancellation"},
            {zoom:200,source:"Customer details",sourceSide:"right",target:"Payment",targetSide:"left",transfer:"Summary",kind:"expected_next",cancel:"Escape"},
        ], cancellationResults=[];
        for(const row of cancellationRows){
            const prepared=await callSnapProbe(`prepareCancellation(${JSON.stringify(row)})`);
            await mouse("mousePressed",prepared.sourcePoint);
            const started=await callSnapProbe("started()");
            const interaction=await callSnapProbe("interactionPoints()"),invalidTargets=interaction.invalidTargets;
            await mouse("mouseMoved",interaction.haloPoint);const acquired=await callSnapProbe("acquired()");
            await mouse("mouseMoved",interaction.outsidePoint);const cleared=await callSnapProbe("cleared()");
            const invalid=[];
            for(const [index,{point}] of invalidTargets.entries()){
                await mouse("mouseMoved",point);invalid.push(await callSnapProbe(`invalid(${index})`));
            }
            if(invalid.some(({directInvalid,noPortSnap})=>!directInvalid||!noPortSnap))throw new Error(`Native Flow invalid-target precedence failed: ${JSON.stringify({row,invalidTargets,acquired,cleared,invalid})}`);
            await mouse("mouseMoved",interaction.transferPoint);const transferred=await callSnapProbe("transferred()");
            await touch("touchStart",interaction.outsidePoint);await touch("touchMove",interaction.outsidePoint);await touch("touchCancel",interaction.outsidePoint);
            const foreignPointerIgnored=(await callSnapProbe("transferred()")).transferred;
            if(!foreignPointerIgnored)throw new Error(`Unrelated pointer changed Flow snap ownership: ${JSON.stringify({row})}`);
            if(row.cancel === "pointer cancellation")await callSnapProbe("cancelActivePointer()");else await escape();
            const finished=await callSnapProbe("finishCancellation()");
            await mouse("mouseReleased",interaction.transferPoint);
            cancellationResults.push({...row,...prepared,...interaction,...started,invalidTargets,acquired,cleared,invalid,transferred,foreignPointerIgnored,...finished});
        }
        runtime.runtime029={
            actualPointerInput:cancellationResults.length===3&&cancellationResults.every(({preview})=>preview),
            haloBoundary:cancellationResults.every(({pageBodyHalo,acquired,cleared})=>pageBodyHalo&&acquired.portOnly&&acquired.previewPinned&&cleared.cleared&&cleared.previewAtPointer),
            exactExamples:cancellationResults.every(({exactExample})=>exactExample),
            visibleInteraction:cancellationResults.every(({visibleInteraction})=>visibleInteraction),
            noArbitraryTarget:cancellationResults.every(({noArbitraryTarget})=>noArbitraryTarget),
            nonOverlappingHalos:cancellationResults.every(({nonOverlappingHalos})=>nonOverlappingHalos),
            directInvalid:cancellationResults.every(({invalid})=>invalid.length===4&&invalid.every(({directInvalid,noPortSnap})=>directInvalid&&noPortSnap)),
            transferred:cancellationResults.every(({transferred})=>transferred.transferred&&transferred.noWrite),
            cancelled:cancellationResults.every(({cancelled,foreignPointerIgnored})=>cancelled&&foreignPointerIgnored),
            canonicalStable:cancellationResults.every(({sameGraph,sameBoundary})=>sameGraph&&sameBoundary),
            measurements:{relationshipSnapCancellation:cancellationResults},
        };
        await callSnapProbe("finish()");
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
    const fallbackCore = browserShard === "core" && targetId === "FLOW_GRAPH_FALLBACK_TARGET", supplemental = new Set(["runtime017", "runtime021", "runtime022", "runtime025"]), missing = fallbackCore ? FLOW_RUNTIME_KEYS.filter(key => !supplemental.has(key) && !runtime[key]).map(path => ({ path, value: "unexecuted" })) : [], falseLeaves = Object.entries(runtime).flatMap(([runtimeKey, evidence]) => Object.entries(evidence).filter(([key, value]) => key !== "measurements" && value !== true).map(([key, value]) => ({ path: `${runtimeKey}.${key}`, value }))), shardFailures = [...missing, ...falseLeaves, ...(fallbackCore && runtime.installedBoundary !== true ? [{ path: "installedBoundary", value: runtime.installedBoundary }] : [])];
    const styleFailureDetail = targetId === "FLOW_STYLESHEET_EXTRACTION_TARGET"
        ? JSON.stringify({ states:runtime.styles.measurements.states.filter(({ equivalent }) => !equivalent)
            .map(({ state, viewport, displayMode, surface, zoom, base, candidate }) => ({
                state, viewport, displayMode, surface, zoom, identical:JSON.stringify(base)===JSON.stringify(candidate),
                base:{ requiredPainted:base.requiredPainted, selectedPortVisible:base.selectedPortVisible,
                    horizontalContained:base.horizontalContained, desktopContained:base.desktopContained,
                    shell:{workspace:base.boxes.workspace,toolbar:base.boxes.toolbar,viewport:base.boxes.viewport,
                        canvas:base.boxes.canvas,surface:base.boxes.surface} },
                candidate:{ requiredPainted:candidate.requiredPainted, selectedPortVisible:candidate.selectedPortVisible,
                    horizontalContained:candidate.horizontalContained, desktopContained:candidate.desktopContained,
                    shell:{workspace:candidate.boxes.workspace,toolbar:candidate.boxes.toolbar,viewport:candidate.boxes.viewport,
                        canvas:candidate.boxes.canvas,surface:candidate.boxes.surface} },
            })), focus:runtime.styles.measurements.focus }, null, 2)
        : "";
    const snapFailureDetail = shardFailures.some(({path}) => path.startsWith("runtime028.") || path.startsWith("runtime029."))
        ? JSON.stringify({runtime028:runtime.runtime028?.measurements,runtime029:runtime.runtime029?.measurements},null,2)
        : "";
    const pagePlacementFailureDetail = shardFailures.some(({path}) => path.startsWith("runtime031."))
        ? JSON.stringify({runtime031:runtime.runtime031?.measurements},null,2)
        : "";
    const contextualActionFailureDetail = shardFailures.some(({path}) => path.startsWith("runtime032."))
        ? JSON.stringify({runtime032:runtime.runtime032?.measurements},null,2)
        : "";
    const wheelZoomFailureDetail = shardFailures.some(({path}) => path.startsWith("runtime033."))
        ? JSON.stringify({runtime033:runtime.runtime033?.measurements},null,2)
        : "";
    const visualFailureDetail = shardFailures.some(({path}) => /^(?:runtime03[4-7]|runtime049|runtime051)\./.test(path))
        ? JSON.stringify({runtime034:runtime.runtime034?.measurements,runtime035:runtime.runtime035?.measurements,runtime037:runtime.runtime037?.measurements,runtime049:runtime.runtime049?.measurements,runtime051:runtime.runtime051?.measurements},null,2)
        : "";
    const pointerOwnershipFailureDetail = shardFailures.some(({path}) => /^runtime04[3-8]\./.test(path))
        ? JSON.stringify({runtime043:runtime.runtime043?.measurements,runtime044:runtime.runtime044?.measurements,runtime045:runtime.runtime045?.measurements,runtime046:runtime.runtime046?.measurements,runtime047:runtime.runtime047?.measurements,runtime048:runtime.runtime048?.measurements},null,2)
        : "";
    const failureDetail=styleFailureDetail||snapFailureDetail||pagePlacementFailureDetail||contextualActionFailureDetail||wheelZoomFailureDetail||visualFailureDetail||pointerOwnershipFailureDetail;
    assert.deepEqual(shardFailures, [], `Flow browser ${browserShard} evidence contains a false value${failureDetail ? `\n${failureDetail}` : ""}`);
    const controlRuntimeKeys = new Set(["runtime001", "runtime016", "runtime018", "runtime020", "runtime027", "runtime033", "runtime043", "runtime044", "runtime045", "runtime046", "runtime047", "runtime048", "runtime050"]);
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
    if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION&&targetId==="FLOW_WORKSPACE_AUTHORING_TARGET"&&["readiness or settling","cleanup/resource lifecycle"].includes(JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION).causalCategory))console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:flowVisualRepairProtocol(flowGraph)}));
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
