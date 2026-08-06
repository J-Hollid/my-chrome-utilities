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
import { boundedFlowExamplesReadiness, createFlowExamplesPhaseTimer } from "../support/flow-examples-timing.mjs";
class DevtoolsSocket {
    constructor(url) { this.url = new URL(url); this.nextId = 1; this.pending = new Map(); this.handlers = new Map(); this.buffer = Buffer.alloc(0); }
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
        this.pending.delete(message.id);
        message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
    } }
    send(payload) { const body = Buffer.from(JSON.stringify(payload)), mask = Buffer.from([1, 2, 3, 4]); let header; if (body.length < 126)
        header = Buffer.from([129, 128 | body.length]);
    else {
        header = Buffer.alloc(4);
        header[0] = 129;
        header[1] = 254;
        header.writeUInt16BE(body.length, 2);
    } for (let index = 0; index < body.length; index += 1)
        body[index] ^= mask[index % 4]; this.socket.write(Buffer.concat([header, mask, body])); }
    call(method, params = {}) {
        const id = this.nextId++;
        this.send({ id, method, params });
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`CDP ${method} timed out`));
            }, 120000);
            this.pending.set(id, {
                resolve: (value) => { clearTimeout(timeout); resolve(value); },
                reject: (error) => { clearTimeout(timeout); reject(error); },
            });
        });
    }
    on(method, handler) { this.handlers.set(method, handler); }
    close() { this.socket?.destroy(); }
}
const targetShards = {
    FLOW_WORKSPACE_CONTROLS_TARGET: "core",
    FLOW_WORKSPACE_AUTHORING_TARGET: "author",
    FLOW_GRAPH_LEGACY_TARGET: "legacy",
    FLOW_GRAPH_EXAMPLES_TARGET: "examples",
};
const selectedTargetIds = process.env.SWARMFORGE_BROWSER_TARGET_IDS
    ? JSON.parse(process.env.SWARMFORGE_BROWSER_TARGET_IDS)
    : [];
const selectedTargets = selectedTargetIds.length
    ? selectedTargetIds.map((id) => ({ id, shard: targetShards[id] }))
    : [{ id: "FLOW_GRAPH_FALLBACK_TARGET", shard: process.env.FLOW_GRAPH_BROWSER_SHARD ?? "core" }];
for (const { id, shard } of selectedTargets)
    assert.equal(typeof shard, "string", `Unknown Flow browser target ${id}`);
const processStarted = performance.now();
const profile = await mkdtemp(path.join(os.tmpdir(), "flow-instance-runtime-")), extensionRoot = path.resolve("dist"), args = headlessChromeArguments(profile, extensionRoot);
args.splice(-1, 0, `--load-extension=${extensionRoot}`);
const chrome = spawn(resolveChromeExecutable(), args, { stdio: ["ignore", "ignore", "pipe"] });
let socket, activePhase = "startup";
try {
    let port;
    await new Promise((resolve, reject) => { let output = ""; const timeout = setTimeout(() => reject(new Error(`Chrome did not expose a debugging port: ${output}`)), 15000); chrome.stderr.on("data", (chunk) => { output += chunk; const match = output.match(/ws:\/\/127\.0\.0\.1:(\d+)\//); if (match) {
        clearTimeout(timeout);
        port = Number(match[1]);
        resolve();
    } }); chrome.once("error", reject); });
    let extension;
    for (let attempt = 0; attempt < 100; attempt += 1) {
        const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json()), worker = targets.find(({ type, url }) => type === "service_worker" && url.startsWith("chrome-extension://") && new URL(url).pathname === "/background.js");
        if (worker) {
            extension = new URL(worker.url).hostname;
            break;
        }
        await wait(20);
    }
    const origin = `chrome-extension://${extension}`;
    const pageUrl = `${origin}/specification-builder.html`;
    const browserStartupMs = performance.now() - processStarted;
    for (const { id: targetId, shard: browserShard } of selectedTargets) {
    const targetStarted = performance.now();
    const phaseTimer = browserShard === "examples"
        ? createFlowExamplesPhaseTimer({ browserStartupMs }) : undefined;
    activePhase = `${targetId}:startup`;
    const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(pageUrl)}`, { method: "PUT" }).then((response) => response.json());
    if (!target)
        throw new Error("Installed Specification Builder target is unavailable.");
    socket = new DevtoolsSocket(target.webSocketDebuggerUrl);
    await socket.connect();
    await socket.call("Runtime.enable");
    await socket.call("Page.enable");
    await socket.call("Storage.clearDataForOrigin", { origin, storageTypes: "all" });
    await socket.call("Page.reload", { ignoreCache: true });
    const targetDeadline = setTimeout(() => socket?.close(), 120000);
    for (const name of ["flowEvidencePhase", "flowNativeKey"])
        await socket.call("Runtime.addBinding", { name });
    socket.on("Runtime.bindingCalled", async ({ name, payload }) => { if (name === "flowEvidencePhase") {
        activePhase = `${targetId}:${payload}`;
        return;
    } const { key } = JSON.parse(payload), code = key === " " ? "Space" : key, virtualKeyCode = key === "Enter" ? 13 : key === "Escape" ? 27 : key.charCodeAt(0); await socket.call("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode }); await socket.call("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode }); });
    const evaluate = async (expression) => { const result = await socket.call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true }); if (result.exceptionDetails)
        throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text); return result.result.value; };
    const waitForExamples = async (phase, predicate, selector) => boundedFlowExamplesReadiness({
        targetId, phase, predicate, timeoutMs: 5000,
        observe: async () => evaluate(`(()=>{const node=document.querySelector(${JSON.stringify(selector)});return{ready:document.readyState==='complete'&&Boolean(node),readyState:document.readyState,selector:${JSON.stringify(selector)},present:Boolean(node),text:String(node?.textContent??'').slice(0,120)}})()`),
    });
    if (browserShard === "examples")
        await waitForExamples("target setup", "create-project form mounted", "#create-project-form");
    else
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('#create-project-form'))"))
                break;
            await wait(25);
        }
    activePhase = "seed";
    phaseTimer?.transition("fixture setup");
    const seeded = await evaluate(`(async()=>{const {createSpecificationProject,addProjectEntity}=await import('./data-layer-specification-project.js'),{createFlowSection,addFlowPageFrameToSection}=await import('./data-layer-property-set-flow-section.js'),{addGraphOccurrence,saveGraphRelationship}=await import('./data-layer-flow-graph.js'),{openIndexedDbProjectRepository}=await import('./data-layer-durable-project-repository.js');let n=0,id=(kind)=>kind+':runtime:'+ ++n,state=createSpecificationProject({name:'Flow runtime',site:'runtime.example',id});const add=(kind,entity)=>{state=addProjectEntity(state,kind,entity,id);return state.project.collections[kind].at(-1);},propertySet=add('propertySets',{name:'Checkout',schemaConstraints:[{path:'/currency',type:'string',examples:['EUR']}]}),application=(name)=>({id:id('application'),name:'Checkout',propertySetId:propertySet.id}),confirmation=add('pages',{name:'Confirmation',propertySetApplications:[application()]}),payment=add('pages',{name:'Payment',propertySetApplications:[application()]}),receipt=add('pages',{name:'Receipt',propertySetApplications:[application()]}),purchase=add('events',{name:'Purchase',eventName:'purchase',schemaConstraints:[{path:'/event',type:'string',examples:['purchase']}]}),review=add('events',{name:'Review',eventName:'review'}),flow=add('flows',{name:'Checkout journey',steps:[]}),otherFlow=add('flows',{name:'Returns journey',steps:[]});state=addFlowPageFrameToSection(state,otherFlow.id,receipt.id,undefined,id);state=createFlowSection(state,flow.id,{name:'Checkout',bounds:{x:20,y:20,width:760,height:300}},id);state=createFlowSection(state,flow.id,{name:'Completion',bounds:{x:20,y:360,width:760,height:260}},id);let graph=state.project.documentationFlowGraphs[flow.id],sections=graph.sections;for(const [page,sectionId]of[[confirmation,sections[0].id],[payment,sections[0].id],[receipt,sections[1].id],[confirmation,undefined]])state=addFlowPageFrameToSection(state,flow.id,page.id,sectionId,id);graph=state.project.documentationFlowGraphs[flow.id];const frames=graph.pageFrames;state=addGraphOccurrence(state,flow.id,{name:'Purchase',pageFrameId:frames[0].id,pageId:confirmation.id,eventId:purchase.id,obligation:'Required',minimum:1,maximum:1,x:24,y:70},id);state=addGraphOccurrence(state,flow.id,{name:'Review',pageFrameId:frames[1].id,pageId:payment.id,eventId:review.id,obligation:'Required',minimum:1,maximum:1,x:24,y:70},id);state=saveGraphRelationship(state,flow.id,frames[0].id,{toStepId:frames[1].id,sourcePort:'right',targetPort:'left',label:'Checkout route'},id);state=saveGraphRelationship(state,flow.id,frames[0].id,{toStepId:frames[2].id,sourcePort:'top',targetPort:'bottom'},id);graph=state.project.documentationFlowGraphs[flow.id];const repository=await openIndexedDbProjectRepository();await repository.putProject(state,{active:true,navigation:{kind:'flows',id:flow.id}});return{projectId:state.project.id,flowId:flow.id,otherFlowId:otherFlow.id,pageIds:[confirmation.id,payment.id,receipt.id],frameIds:graph.pageFrames.map(({id})=>id),occurrenceIds:graph.occurrences.map(({id})=>id),relationshipIds:graph.relationships.map(({id})=>id),sectionIds:graph.sections.map(({id})=>id)};})()`);
    const runtime = {};
    if (browserShard === "core") {
        const geometryRows = [[360, 800, false, false, "narrowHiddenClosed"], [360, 800, false, true, "narrowHiddenOpen"], [360, 800, true, false, "narrowVisibleClosed"], [360, 800, true, true, "narrowVisibleOpen"], [1440, 900, false, false, "wideHiddenClosed"], [1440, 900, false, true, "wideHiddenOpen"], [1440, 900, true, false, "wideVisibleClosed"], [1440, 900, true, true, "wideVisibleOpen"]], geometryEvidence = {};
        for (const [width, height, visible, inspectorOpen, label] of geometryRows) {
            await socket.call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
            await evaluate(`(()=>{const key=${JSON.stringify(flowR02ViewStorageKey(seeded))},prior=JSON.parse(sessionStorage.getItem(key)??'{}');sessionStorage.setItem(key,JSON.stringify({...prior,navigationVisible:${visible}}));})()`);
            await socket.call("Page.reload", { ignoreCache: true });
            for (let attempt = 0; attempt < 200; attempt += 1) {
                if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('#project-tree'))"))
                    break;
                await wait(25);
            }
            await evaluate(`(async()=>{if(document.querySelector('[aria-label="Flow toolbar"]')?.getBoundingClientRect().width)return;let flows;for(let attempt=0;attempt<160;attempt+=1){flows=document.querySelector('[data-kind="flows"]');if(flows)break;await new Promise(resolve=>setTimeout(resolve,25));}flows?.click();for(let attempt=0;attempt<160;attempt+=1){const row=[...document.querySelectorAll('.entity-row button')].find(item=>item.textContent==='Checkout journey');if(row){row.click();return;}await new Promise(resolve=>setTimeout(resolve,25));}})()`);
            await evaluate(`(()=>{const inspector=document.querySelector('#project-inspector'),toggle=document.querySelector('#toggle-project-inspector');if(Boolean(inspector&&!inspector.hidden)!==${inspectorOpen})toggle?.click();})()`);
            let ready = false, stable = 0;
            for (let attempt = 0; attempt < 300; attempt += 1) {
                ready = await evaluate("(()=>{const toolbar=document.querySelector('[aria-label=\"Flow toolbar\"]'),viewport=document.querySelector('.flow-canvas-viewport'),add=[...(toolbar?.querySelectorAll('button')??[])].find(button=>button.textContent.trim()==='Add'),box=add?.getBoundingClientRect();return (toolbar?.getBoundingClientRect().width??0)>0&&(viewport?.getBoundingClientRect().height??0)>0&&(box?.width??0)>0;})()");
                stable = ready ? stable + 1 : 0;
                if (stable >= 10)
                    break;
                await wait(25);
            }
            assert.equal(stable >= 10, true, `Flow geometry row ${label} did not open with stable live geometry`);
            const row = await evaluate(flowR02GeometryEvidence());
            for (const [key, value] of Object.entries(row))
                geometryEvidence[`${label}_${key}`] = value;
        }
        activePhase = "runtime001";
        await socket.call("Page.reload", { ignoreCache: true });
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('[aria-label=\"Flow canvas viewport\"]'))"))
                break;
            await wait(25);
        }
        activePhase = "runtime027";
        const originalPanState = await evaluate(flowR02PreparePanGraph(seeded));
        await socket.call("Page.reload", { ignoreCache: true });
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('[aria-label=\"Flow canvas viewport\"]'))"))
                break;
            await wait(25);
        }
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
            await socket.call("Page.reload", { ignoreCache: true });
            for (let attempt = 0; attempt < 200; attempt += 1) {
                if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('[aria-label=\"Flow canvas viewport\"]'))"))
                    break;
                await wait(25);
            }
            if (kind === "touch")
                await socket.call("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
            await evaluate(`(async()=>{const toolbar=document.querySelector('[aria-label="Flow toolbar"]'),button=(text)=>{const found=[...toolbar.querySelectorAll('button')].find(item=>item.textContent.trim()===text);if(!found)throw new Error('Missing pan setup control '+text+' from '+[...toolbar.querySelectorAll('button')].map(item=>item.textContent.trim()).join('|'));return found;},active=document.body.classList.contains('flow-focus-canvas');if(active!==${focused})button(active?'Exit Focus Canvas':'Focus Canvas').click();await new Promise(resolve=>setTimeout(resolve,10));button('Fit Flow').click();for(let count=0;count<20&&document.querySelector('[aria-label="Flow zoom percentage"]').textContent!=='200%';count+=1)button('Zoom in').click();document.querySelector('[aria-label="Flow canvas viewport"]').focus();})()`);
            const before = await evaluate(flowR02PanProbe(seeded));
            if (kind === "keyboard")
                await keyboardPan(dx, dy);
            else if (kind === "touch") {
                await socket.call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: before.blank.x, y: before.blank.y, id: 77, radiusX: 1, radiusY: 1, force: 1 }] });
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
            await socket.call("Page.reload", { ignoreCache: true });
            for (let attempt = 0; attempt < 200; attempt += 1) {
                if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('[aria-label=\"Flow canvas viewport\"]'))"))
                    break;
                await wait(25);
            }
            await evaluate(`(async()=>{const toolbar=document.querySelector('[aria-label="Flow toolbar"]'),button=(text)=>[...toolbar.querySelectorAll('button')].find(item=>item.textContent.trim()===text),active=document.body.classList.contains('flow-focus-canvas');if(active!==${focused})button(active?'Exit Focus Canvas':'Focus Canvas').click();await new Promise(resolve=>setTimeout(resolve,10));button('Fit Flow').click();document.querySelector('[aria-label="Flow canvas viewport"]').focus();})()`);
            await socket.call("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 2 });
            const before = await evaluate(flowR02PanProbe(seeded)), first = { x: before.blank.x + 45, y: before.blank.y + 30, id: 91, radiusX: 1, radiusY: 1, force: 1 }, second = { x: first.x + 70, y: first.y, id: 92, radiusX: 1, radiusY: 1, force: 1 };
            await socket.call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...first, x: before.blank.x, y: before.blank.y }] });
            await socket.call("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [first] });
            await socket.call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first, second] });
            await socket.call("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...first, x: first.x - 25 }, { ...second, x: second.x + 25 }] });
            await socket.call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
            await socket.call("Emulation.setTouchEmulationEnabled", { enabled: false });
            await wait(20);
            const after = await evaluate(flowR02PanProbe(seeded));
            await mousePan(after.item, 0, 0);
            await wait(20);
            const itemActivated = await evaluate(flowR02ItemActivationResult(after.item.id)), control = await evaluate(`(()=>{const button=[...document.querySelectorAll('[aria-label="Flow toolbar"] button')].find(item=>item.textContent.trim()==='Zoom in'),box=button.getBoundingClientRect();return{x:box.left+box.width/2,y:box.top+box.height/2,zoom:JSON.parse(document.querySelector('[aria-label="Interactive directional Flow canvas"]').dataset.viewport).zoom};})()`);
            await mousePan(control, 0, 0);
            await wait(20);
            const controlActivated = await evaluate(`JSON.parse(document.querySelector('[aria-label="Interactive directional Flow canvas"]').dataset.viewport).zoom>${control.zoom}`);
            for (const [key, value] of Object.entries({ gestureChanged: JSON.stringify(after.camera) !== JSON.stringify(before.camera), canonicalStable: after.graph === before.graph && after.revision === before.revision && after.undo === before.undo, selectionClearBefore: before.selection === '[]', itemActivated, controlActivated }))
                panEvidence[`${label}_${key}`] = value;
        }
        runtime.runtime027 = panEvidence;
        await evaluate(`(()=>{if(document.body.classList.contains('flow-focus-canvas'))[...document.querySelectorAll('[aria-label="Flow toolbar"] button')].find(button=>button.textContent.trim()==='Exit Focus Canvas')?.click();})()`);
        await wait(50);
        await evaluate(flowR02RestorePanGraph(seeded, originalPanState));
        await socket.call("Page.reload", { ignoreCache: true });
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('#project-tree'))"))
                break;
            await wait(25);
        }
        await evaluate(`(async()=>{if(document.querySelector('[aria-label="Flow toolbar"]'))return;let flows;for(let attempt=0;attempt<160;attempt+=1){flows=document.querySelector('[data-kind="flows"]');if(flows)break;await new Promise(resolve=>setTimeout(resolve,25));}flows?.click();for(let attempt=0;attempt<160;attempt+=1){const row=[...document.querySelectorAll('.entity-row button')].find(item=>item.textContent==='Checkout journey');if(row){row.click();return;}await new Promise(resolve=>setTimeout(resolve,25));}})()`);
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("Boolean(document.querySelector('[aria-label=\"Flow toolbar\"]'))"))
                break;
            await wait(25);
        }
        Object.assign(runtime, await evaluate(flowGraphCorrectiveWorkflow(seeded, { stopAfterRuntime: 20 })));
        runtime.runtime001 = geometryEvidence;
        runtime.runtime027 = panEvidence;
        await socket.call("Page.reload", { ignoreCache: true });
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('[aria-label=\"Interactive directional Flow canvas\"]'))"))
                break;
            await wait(25);
        }
        const reloadEvidence = await evaluate(flowGraphReloadEvidence(seeded));
        for (const [key, value] of Object.entries(reloadEvidence))
            runtime[key] = { ...runtime[key], ...value };
    }
    if (browserShard === "legacy") {
        const legacyContext = await evaluate(flowGraphLegacyContextSeed(seeded));
        await socket.call("Page.reload", { ignoreCache: true });
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('#project-tree'))"))
                break;
            await wait(25);
        }
        runtime.runtime017 = await evaluate(flowGraphLegacyContextEvidence(seeded, legacyContext));
        const legacyKinds = await evaluate(flowGraphRelationshipKindSeed(seeded));
        await socket.call("Page.reload", { ignoreCache: true });
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('[aria-label=\"Interactive directional Flow canvas\"]'))"))
                break;
            await wait(25);
        }
        runtime.runtime022 = await evaluate(flowGraphRelationshipKindEvidence(seeded, legacyKinds));
    }
    if (browserShard === "examples") {
        const reloadForExample = async (predicate) => {
            phaseTimer.transition("rendering");
            await socket.call("Page.reload", { ignoreCache: true });
            phaseTimer.transition("readiness");
            await waitForExamples("readiness", predicate, "#project-tree");
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
        await socket.call("Page.reload", { ignoreCache: true });
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("Boolean(document.querySelector('[aria-label=\"Flow toolbar\"]'))"))
                break;
            await wait(25);
        }
        Object.assign(runtime, await evaluate(flowGraphCorrectiveWorkflow(seeded)));
        await socket.call("Page.reload", { ignoreCache: true });
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('[aria-label=\"Interactive directional Flow canvas\"]'))"))
                break;
            await wait(25);
        }
        const reloadEvidence = await evaluate(flowGraphReloadEvidence(seeded));
        for (const [key, value] of Object.entries(reloadEvidence))
            runtime[key] = { ...runtime[key], ...value };
    }
    if ((browserShard === "core" && targetId === "FLOW_GRAPH_FALLBACK_TARGET") || browserShard === "author") {
        const repeatedInstances = await evaluate(flowGraphRepeatedInstanceSeed(seeded));
        await socket.call("Page.reload", { ignoreCache: true });
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (await evaluate("document.readyState==='complete'&&Boolean(document.querySelector('#project-tree'))"))
                break;
            await wait(25);
        }
        runtime.runtime024 = { ...runtime.runtime024, ...await evaluate(flowGraphRepeatedInstanceEvidence(seeded, repeatedInstances)) };
    }
    phaseTimer?.transition("assertion");
    const fallbackCore = browserShard === "core" && targetId === "FLOW_GRAPH_FALLBACK_TARGET", supplemental = new Set(["runtime017", "runtime021", "runtime022", "runtime025"]), missing = fallbackCore ? FLOW_RUNTIME_KEYS.filter(key => !supplemental.has(key) && !runtime[key]).map(path => ({ path, value: "unexecuted" })) : [], falseLeaves = Object.entries(runtime).flatMap(([runtimeKey, evidence]) => Object.entries(evidence).filter(([, value]) => value !== true).map(([key, value]) => ({ path: `${runtimeKey}.${key}`, value }))), shardFailures = [...missing, ...falseLeaves, ...(fallbackCore && runtime.installedBoundary !== true ? [{ path: "installedBoundary", value: runtime.installedBoundary }] : [])];
    assert.deepEqual(shardFailures, [], `Flow browser ${browserShard} evidence contains a false value`);
    const controlRuntimeKeys = new Set(["runtime001", "runtime016", "runtime018", "runtime020", "runtime027"]);
    const flowGraph = targetId === "FLOW_WORKSPACE_CONTROLS_TARGET"
        ? Object.fromEntries(Object.entries(runtime).filter(([key]) => controlRuntimeKeys.has(key)))
        : targetId === "FLOW_WORKSPACE_AUTHORING_TARGET"
            ? Object.fromEntries(Object.entries(runtime).filter(([key]) =>
                key === "installedBoundary" || !controlRuntimeKeys.has(key)))
            : runtime;
    phaseTimer?.transition("cleanup");
    clearTimeout(targetDeadline);
    const completedTargetId = target.id;
    socket.close();
    socket = undefined;
    await fetch(`http://127.0.0.1:${port}/json/close/${encodeURIComponent(completedTargetId)}`);
    const phaseTiming = phaseTimer?.finish();
    const durationMs = phaseTiming?.durationMs ?? Math.round(performance.now() - targetStarted);
    assert.ok(durationMs <= 120000, `${targetId} exceeded its 120000ms target limit`);
    console.log(JSON.stringify({ flowGraph }));
    if (selectedTargetIds.length) {
        console.log(JSON.stringify({ swarmforgeBrowserTargetResult: { id: targetId, status: "passed" } }));
        console.log(JSON.stringify({ swarmforgeBrowserTargetTiming: { id: targetId, durationMs,
            ...(phaseTiming ? { phases: phaseTiming.phases } : {}) } }));
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
    await stopHeadlessChrome(chrome);
    await removeChromeProfile(profile, { targetId: "flow-graph" });
}
