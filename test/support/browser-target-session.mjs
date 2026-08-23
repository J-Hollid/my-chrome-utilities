function parseJsonEnvironment(environment, name, fallback) {
  const source = environment[name];
  if (source === undefined) return fallback;
  try { return JSON.parse(source); }
  catch (error) { throw new Error(`${name} must contain JSON: ${error.message}`); }
}

export function selectedBrowserTargetConfigurations(environment, knownTargetIds) {
  const known = new Set(knownTargetIds);
  const ids = parseJsonEnvironment(environment, "SWARMFORGE_BROWSER_TARGET_IDS", []);
  const configurations = parseJsonEnvironment(
    environment, "SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS", {},
  );
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length) {
    throw new Error("SWARMFORGE_BROWSER_TARGET_IDS must select every logical target once");
  }
  return ids.map((id) => {
    if (!known.has(id)) throw new Error(`Unknown browser target for this program: ${id}`);
    const configuration = configurations[id];
    if (!configuration || Array.isArray(configuration) || typeof configuration !== "object") {
      throw new Error(`Missing browser target configuration: ${id}`);
    }
    return { id, environment:{ ...configuration } };
  });
}

export function summarizeBrowserTargetResults(targetResults) {
  const document = {};
  const results = {};
  for (const result of targetResults) {
    if (result.status === "passed") {
      for (const [key,value] of Object.entries(result.observation)) {
        if (document[key] && value && typeof document[key] === "object" &&
            typeof value === "object" && !Array.isArray(document[key]) && !Array.isArray(value)) {
          Object.assign(document[key], value);
        } else document[key] = value;
      }
      results[result.id] = { status:"passed", durationMs:result.durationMs };
    } else {
      results[result.id] = {
        status:"failed", durationMs:result.durationMs, error:result.error,
      };
    }
  }
  return { document, results };
}

class DevtoolsSocket {
  constructor(url, targetId, { callLimitMilliseconds } = {}) {
    this.url = new URL(url);
    this.logicalTargetId = targetId;
    this.callLimitMilliseconds = callLimitMilliseconds ?? (() => 120_000);
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
    this.handlers = new Map();
  }
  async connect() {
    await new Promise((resolve, reject) => {
      this.socket = net.createConnection({ host:this.url.hostname, port:Number(this.url.port) });
      this.socket.once("error", reject);
      this.socket.once("connect", () => {
        const key = Buffer.from(String(Math.random())).toString("base64");
        this.socket.write([
          `GET ${this.url.pathname}${this.url.search} HTTP/1.1`, `Host: ${this.url.host}`,
          "Upgrade: websocket", "Connection: Upgrade", `Sec-WebSocket-Key: ${key}`,
          "Sec-WebSocket-Version: 13", "\r\n",
        ].join("\r\n"));
      });
      let header = "";
      const receive = (chunk) => {
        header += chunk.toString("binary");
        const end = header.indexOf("\r\n\r\n");
        if (end < 0) return;
        this.socket.off("data", receive);
        if (!header.startsWith("HTTP/1.1 101")) return reject(new Error("CDP upgrade failed"));
        this.socket.on("data", (data) => this.receive(data));
        const rest = Buffer.from(header.slice(end + 4), "binary");
        if (rest.length) this.receive(rest);
        resolve();
      };
      this.socket.on("data", receive);
    });
  }
  receive(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      let length = this.buffer[1] & 127;
      let offset = 2;
      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2); offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        length = Number(this.buffer.readBigUInt64BE(2)); offset = 10;
      }
      if (this.buffer.length < offset + length) return;
      const payload = this.buffer.subarray(offset, offset + length);
      this.buffer = this.buffer.subarray(offset + length);
      if ((first & 15) !== 1) continue;
      const message = JSON.parse(payload.toString());
      const pending = this.pending.get(message.id);
      if (!pending) {
        this.handlers.get(message.method)?.(message.params);
        continue;
      }
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    }
  }
  send(value) {
    const body = Buffer.from(JSON.stringify(value));
    const mask = Buffer.from([1, 2, 3, 4]);
    let header;
    if (body.length < 126) header = Buffer.from([0x81, 0x80 | body.length]);
    else if (body.length <= 0xffff) {
      header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0xfe;
      header.writeUInt16BE(body.length, 2);
    } else {
      header = Buffer.alloc(10); header[0] = 0x81; header[1] = 0xff;
      header.writeBigUInt64BE(BigInt(body.length), 2);
    }
    for (let index = 0; index < body.length; index += 1) body[index] ^= mask[index % 4];
    this.socket.write(Buffer.concat([header, mask, body]));
  }
  call(method, params = {}) {
    const id = this.nextId++;
    this.send({ id, method, params });
    return withDevtoolsProtocolDeadline({
      targetId:this.logicalTargetId, method, limitMs:this.callLimitMilliseconds(),
      work:() => new Promise((resolve, reject) => this.pending.set(id, { resolve, reject })),
      onTimeout:() => this.pending.delete(id),
    });
  }
  on(method, handler) { this.handlers.set(method, handler); }
  close() {
    for (const pending of this.pending.values()) {
      pending.reject(new Error(`${this.logicalTargetId} DevTools socket closed`));
    }
    this.pending.clear();
    this.socket?.destroy();
  }
}

async function installedExtensionOrigin(port) {
  const observed = await observeBrowserReadiness({
    targetId:"installed-extension", phase:"target setup",
    predicateDescription:"installed extension service worker discovery",
    timeoutMs:6000, pollIntervalMs:25, maximumSnapshotCharacters:500,
    observe:async() => {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const worker = targets.find(({ type, url }) => type === "service_worker" &&
        url.startsWith("chrome-extension://") && new URL(url).pathname === "/background.js");
      return { ready:Boolean(worker), worker, targetCount:targets.length };
    }, ready:({ ready }) => ready, snapshot:({ targetCount }) => ({ targetCount }),
  });
  return `chrome-extension://${new URL(observed.worker.url).hostname}`;
}

async function freshTargetSocket(port, origin, pagePath, targetId, callLimitMilliseconds) {
  const target = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${origin}/${pagePath}`)}`,
    { method:"PUT" },
  ).then((response) => response.json());
  const socket = new DevtoolsSocket(target.webSocketDebuggerUrl, targetId, {callLimitMilliseconds});
  socket.targetId = target.id;
  await socket.connect();
  await socket.call("Runtime.enable");
  await socket.call("Page.enable");
  await socket.call("Storage.clearDataForOrigin", { origin, storageTypes:"all" });
  await socket.call("Page.reload", { ignoreCache:true });
  return socket;
}

async function reconnectTargetSocket(port, origin, pagePath, targetId, callLimitMilliseconds) {
  const connected = await observeBrowserReadiness({
    targetId, phase:"navigation", predicateDescription:`target reconnection for ${pagePath}`,
    timeoutMs:6000, pollIntervalMs:25, maximumSnapshotCharacters:500,
    observe:async() => {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const target = targets.find(({ type, url }) => type === "page" && url.startsWith(`${origin}/${pagePath}`));
      if (!target) return { ready:false, pages:targets.filter(({ type }) => type === "page").map(({ url }) => url) };
      let socket;
      try {
        socket = new DevtoolsSocket(target.webSocketDebuggerUrl, targetId, {callLimitMilliseconds});socket.targetId=target.id;
        await socket.connect();await socket.call("Runtime.enable");await socket.call("Page.enable");
        return { ready:true, socket };
      } catch (error) { socket?.close();return { ready:false, connectionError:error.message }; }
    }, ready:({ ready }) => ready, snapshot:({ pages, connectionError }) => ({ pages, connectionError }),
  });
  return connected.socket;
}

async function evaluate(socket, expression, targetId, phase) {
  const result = await transmitDevtoolsProgram({
    targetId, phase, source:expression, shape:"statements",
    call:socket.call.bind(socket),
    parameters:{ returnByValue:true, awaitPromise:true, userGesture:true },
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

export async function runBrowserTargetSession({
  definitions,
  environment = process.env,
  extensionRoot = path.resolve("dist"),
}) {
  const selected = selectedBrowserTargetConfigurations(environment, Object.keys(definitions));
  const rowCompositionViewport=Number(environment.SWARMFORGE_ROW_COMPOSITION_VIEWPORT_WIDTH);
  const profile = await mkdtemp(path.join(os.tmpdir(), "browser-target-batch-"));
  const args = headlessChromeArguments(profile, extensionRoot);
  args.splice(-1, 0, `--load-extension=${extensionRoot}`);
  const chrome = spawn(resolveChromeExecutable(), args, { stdio:["ignore", "ignore", "pipe"] });
  const results = [];
  let cleanupError;
  try {
    const port = await waitForChromeDebuggingPort({
      chrome, targetId:"installed-extension", limitMs:30_000, maximumStderrCharacters:2_000,
    });
    const origin = await installedExtensionOrigin(port);
    for (const target of selected) {
      const definition = definitions[target.id];
      const timer = createBrowserPhaseTimer({
        targetId:target.id,
        phaseNames:["target setup", "navigation", "fixture", "interaction", "persistence", "assertion", "target cleanup"],
      });
      let socket, observation, failure, failedAtPhase, timing;
      try {
        const maximumElapsedMilliseconds=definition.maximumElapsedMilliseconds??120_000;
        observation=await withLogicalTargetLifecycle({
          targetId:target.id,boundary:"installed-session logical target",
          limitMs:maximumElapsedMilliseconds,onTimeout:()=>socket?.close(),
          work:async({remainingMilliseconds})=>{
        const protocolCallLimitMilliseconds=()=>Math.max(1,Math.min(120_000,remainingMilliseconds()-50));
        socket = await freshTargetSocket(port, origin, definition.pagePath, target.id,
          protocolCallLimitMilliseconds);
        if(definition.rowCompositionViewport&&Number.isFinite(rowCompositionViewport))await socket.call("Emulation.setDeviceMetricsOverride",{width:rowCompositionViewport,height:900,deviceScaleFactor:1,mobile:rowCompositionViewport<=360});
        const waitForDefinitionReadiness=async(phase)=>{
          const readiness=definition.readiness??{};
          const source=readiness.expression??"({ready:document.readyState==='complete',documentReadyState:document.readyState,href:location.href})";
          return observeBrowserReadiness({
            targetId:target.id,phase,predicateDescription:readiness.description??"definition-owned page readiness",
            timeoutMs:readiness.timeoutMs??6000,pollIntervalMs:readiness.pollIntervalMs??25,
            stabilityMs:readiness.stabilityMs??0,maximumSnapshotCharacters:readiness.maximumSnapshotCharacters??600,
            observe:async()=>{const result=await transmitDevtoolsProgram({targetId:target.id,phase,source,shape:"expression",call:socket.call.bind(socket),parameters:{returnByValue:true}});return result.result.value;},
            ready:(state)=>state===true||state?.ready===true,snapshot:(state)=>state,
          });
        };
        timer.transition("navigation");
        await waitForDefinitionReadiness("initial navigation");
        let activeProgramPhase="interaction";
        const evaluateWithNavigationRetries=async(expression)=>{
          for (let attempt = 0; attempt <= (definition.navigationRetries ?? 0); attempt += 1) {
            try { return await evaluate(socket, expression, target.id, activeProgramPhase); }
            catch (error) {
              if (!String(error).includes("Inspected target navigated or closed") ||
                  attempt === (definition.navigationRetries ?? 0)) throw error;
              const resumePhase=timer.activePhase;
              timer.transition("navigation");
              socket.close();
              socket = await reconnectTargetSocket(port, origin, definition.pagePath, target.id,
                protocolCallLimitMilliseconds);
              if(definition.rowCompositionViewport&&Number.isFinite(rowCompositionViewport))await socket.call("Emulation.setDeviceMetricsOverride",{width:rowCompositionViewport,height:900,deviceScaleFactor:1,mobile:rowCompositionViewport<=360});
              await waitForDefinitionReadiness("reconnected navigation");
              timer.transition(resumePhase);
            }
          }
        };
        const targetWork=async()=>{
          if (definition.beforeExpression) {
            timer.transition("fixture");activeProgramPhase="fixture";
            await evaluateWithNavigationRetries(definition.beforeExpression(target.environment));
            timer.transition("navigation");await socket.call("Page.reload", { ignoreCache:true });
            await waitForDefinitionReadiness("post-fixture navigation");
          }
          timer.transition("interaction");activeProgramPhase="interaction";
          return definition.run
            ? definition.run({
              targetId:target.id,
              environment:target.environment,
              evaluate:(unusedSocket, expression)=>evaluateWithNavigationRetries(expression),
              socket:()=>socket,
            })
            : evaluateWithNavigationRetries(definition.expression(target.environment));
        };
        const targetObservation=await targetWork();
        observation=targetObservation;
        if (!observation || Array.isArray(observation) || typeof observation !== "object") {
          throw new Error(`${target.id} did not return an observation object`);
        }
        timer.transition("assertion");
        return observation;
          },cleanup:async({failure:lifecycleFailure,signal})=>{
            failure=lifecycleFailure;
            failedAtPhase=lifecycleFailure?timer.activePhase:undefined;
            timer.transition("target cleanup");
            const pageTargetId=socket?.targetId;
            socket?.close();socket=undefined;
            if (pageTargetId) {
              try { await fetch(`http://127.0.0.1:${port}/json/close/${encodeURIComponent(pageTargetId)}`,{signal}); }
              catch { /* Chrome shutdown remains the final process cleanup boundary. */ }
            }
          },finalize:({failure:lifecycleFailure})=>{
            failure??=lifecycleFailure;
            timing=timer.finish({status:failure?"failed":"passed",failedAtPhase});
          },
        });
      } catch (error) {
        failure??=error;failedAtPhase??=timer.activePhase;
      }
      if (failure) {
        results.push({id:target.id,status:"failed",durationMs:timing.durationMs,error:failure.message});
        console.log(JSON.stringify({swarmforgeBrowserTargetResult:{id:target.id,status:"failed",error:failure.message}}));
      } else {
        results.push({id:target.id,status:"passed",durationMs:timing.durationMs,observation});
        console.log(JSON.stringify(observation));
        console.log(JSON.stringify({swarmforgeBrowserTargetResult:{id:target.id,status:"passed"}}));
      }
      console.log(JSON.stringify({swarmforgeBrowserTargetTiming:{id:target.id,durationMs:timing.durationMs,phases:timing.phases,...(timing.activePhase?{activePhase:timing.activePhase}:{})}}));
    }
  } finally {
    await stopHeadlessChrome(chrome, 3000, {targetId:"installed-extension"});
    try {
      await removeChromeProfile(profile, { targetId:selected.map(({ id }) => id).join(",") });
    } catch (error) { cleanupError = error; }
  }
  const summary = summarizeBrowserTargetResults(results);
  if (cleanupError || results.some(({ status }) => status === "failed")) {
    const failures = results.filter(({ status }) => status === "failed")
      .map(({ id, error }) => new Error(`${id}: ${error}`));
    if (cleanupError) failures.push(cleanupError);
    const error = new AggregateError(failures, "Browser target batch failed");
    error.partialDocument = summary.document;
    error.targetResults = summary.results;
    throw error;
  }
  return summary.document;
}
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

import {
  headlessChromeArguments,
  removeChromeProfile,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "./headless-chrome.mjs";
import { createBrowserPhaseTimer, observeBrowserReadiness, transmitDevtoolsProgram,
  waitForChromeDebuggingPort, withDevtoolsProtocolDeadline,
  withLogicalTargetLifecycle } from "./browser-observation-control.mjs";
