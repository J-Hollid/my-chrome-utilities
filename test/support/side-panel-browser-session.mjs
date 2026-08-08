import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import {
  boundedDiagnostic,
  createBrowserPhaseTimer,
  observeBrowserReadiness,
  waitForChromeDebuggingPort,
  withDevtoolsProtocolDeadline,
  withLogicalTargetLifecycle,
} from "./browser-observation-control.mjs";
import { runSidePanelBrowserFixture } from "./side-panel-browser-fixture-primitives.mjs";
import {
  headlessChromeArguments,
  removeChromeProfile,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "./headless-chrome.mjs";

const phases = ["setup", "navigation", "fixture", "interaction", "persistence", "assertion", "cleanup"];

function primitiveLeafPaths(value, prefix = []) {
  if (Array.isArray(value)) return value.flatMap((nested, index) =>
    primitiveLeafPaths(nested, [...prefix, index]));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, nested]) =>
    primitiveLeafPaths(nested, [...prefix, key]));
  return value === undefined ? [] : [prefix];
}

async function startInstalledBrowserProcess() {
  const temporaryRoot = path.resolve("tmp");
  await mkdir(temporaryRoot, { recursive:true });
  const chromeProfile = await mkdtemp(path.join(temporaryRoot, "side-panel-layout-"));
  const distributionRoot = path.resolve("dist");
  const assetServer = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (pathname === "/observation-target.html") {
      response.writeHead(200, { "Content-Type":"text/html" })
        .end('<!doctype html><title>Retail confirmation</title><script>globalThis.dataLayer=[]</script>');
      return;
    }
    const requested = pathname === "/" ? "side-panel.html" : pathname.slice(1);
    const file = path.resolve(distributionRoot, requested ?? "side-panel.html");
    if (!file.startsWith(distributionRoot + path.sep)) {
      response.writeHead(404).end();
      return;
    }
    try {
      const content = await readFile(file);
      const contentType = file.endsWith(".js") ? "text/javascript"
        : file.endsWith(".css") ? "text/css"
          : "text/html";
      response.writeHead(200, { "Content-Type":contentType }).end(content);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => assetServer.listen(0, "127.0.0.1", resolve));
  const assetPort = assetServer.address().port;
  const chrome = spawn(
    resolveChromeExecutable(),
    headlessChromeArguments(chromeProfile, distributionRoot),
    { stdio:["ignore", "ignore", "pipe"] },
  );
  return { assetPort, assetServer, chrome, chromeProfile };
}

async function stopInstalledBrowserProcess(resources, targetId) {
  await stopHeadlessChrome(resources.chrome);
  await new Promise((resolve) => resources.assetServer.close(resolve));
  await removeChromeProfile(resources.chromeProfile, { targetId });
}

async function cleanTarget(definition, resources, context, failure) {
  const cleanupFailures = [];
  try { await definition.cleanup({ context, failure }); }
  catch (error) { cleanupFailures.push(error); }
  while (context.cleanup.length) {
    try { await context.cleanup.pop()(); }
    catch (error) { cleanupFailures.push(error); }
  }
  try { await resources.closeTarget({ targetId:definition.id, context, failure }); }
  catch (error) { cleanupFailures.push(error); }
  context.listeners.clear();
  context.timers.clear();
  context.observations.clear();
  context.page = null;
  context.socket = null;
  if (cleanupFailures.length) throw new AggregateError(cleanupFailures, `${definition.id} cleanup failed`);
}

export async function runSidePanelBrowserSession({
  definitions, resources, environment = process.env, emit = console.log, now = () => performance.now(),
}) {
  const frozenEnvironment = Object.freeze({ ...environment });
  const processContext = await resources.start();
  const failures = [];
  try {
    for (const definition of definitions) {
      const timer = createBrowserPhaseTimer({ targetId:definition.id, phaseNames:phases, now });
      const context = {
        id:definition.id,
        configuration:definition.configuration,
        environment:frozenEnvironment,
        phaseTimer:timer,
        viewport:structuredClone(definition.viewport),
        process:processContext,
        page:null,
        socket:null,
        cleanup:[],
        listeners:new Set(),
        timers:new Set(),
        observations:new Map(),
        deferredAssertions:[],
      };
      let failure;
      let failedAtPhase;
      let observation;
      const runPhase = async (phase, work) => {
        if (timer.activePhase !== phase) timer.transition(phase);
        try { return await work(); }
        catch (error) {
          error.activeBrowserPhase ??= phase;
          throw error;
        }
      };
      context.runPhaseScoped = async (phase, work) => {
        try { return await timer.scoped(phase, work); }
        catch (error) {
          error.activeBrowserPhase ??= phase;
          throw error;
        }
      };
      try {
        observation = await withLogicalTargetLifecycle({
          targetId:definition.id,
          boundary:"side-panel logical target",
          work:async () => {
            await runPhase("setup", () => resources.resetOrigins({ targetId:definition.id, context }));
            Object.assign(context, await runPhase("navigation", () =>
              resources.openTarget({ targetId:definition.id, context })));
            await runPhase("fixture", async () => {
              await resources.prepareFixture?.({ targetId:definition.id, context });
              await definition.setup({ context });
            });
            observation = await runPhase("interaction", () => definition.observe({ context }));
            if (resources.verifyPersistence) {
              observation = await runPhase("persistence", () => resources.verifyPersistence({
                targetId:definition.id, context, observation,
              }));
            } else {
              timer.transition("persistence");
            }
            await runPhase("assertion", async () => {
              if (!observation || typeof observation !== "object" ||
                  definition.observationKeys.some((key) => !Object.hasOwn(observation, key))) {
                throw new Error(`${definition.id} omitted a declared observation key`);
              }
              for (const leaf of definition.assertionLeaves ?? definition.observationKeys.map((key) => [key])) {
                let value = observation;
                for (const segment of leaf) {
                  if (segment === "*") {
                    const deepLeaves = primitiveLeafPaths(value);
                    if (!deepLeaves.length) value = undefined;
                    else context.observations.set(`assertion:${leaf[0]}`, deepLeaves);
                    break;
                  }
                  value = value?.[segment];
                }
                if (value === undefined) throw new Error(`${definition.id} omitted assertion leaf ${leaf.join(".")}`);
              }
              await resources.assertObservation?.({ targetId:definition.id, context, observation,
                assertionLeaves:definition.assertionLeaves });
            });
            return observation;
          },
          cleanup:async ({ failure:targetFailure }) => {
            context.preCleanupDiagnostics = Object.freeze({
              listeners:context.listeners.size,
              timers:context.timers.size,
              observations:context.observations.size,
              deferredAssertions:context.deferredAssertions.length,
            });
            timer.transition("cleanup");
            await cleanTarget(definition, resources, context, targetFailure);
          },
        });
      } catch (error) {
        failure = error;
        failedAtPhase = error.activeBrowserPhase ?? timer.activePhase;
        failures.push({ id:definition.id, error });
      }
      const timing = timer.finish({
        status:failure ? "failed" : "passed",
        failedAtPhase,
      });
      emit({ swarmforgeBrowserTargetTiming:{ id:definition.id, ...timing } });
      if (!failure) emit(observation);
      emit({ swarmforgeBrowserTargetResult:failure ? {
        id:definition.id,
        status:"failed",
        phase:failedAtPhase,
        cause:failure.deadlineOwner ? "infrastructure" : "readiness-or-product",
        durationMs:timing.durationMs,
        finalState:boundedDiagnostic({
          message:failure.message,
          ...(context.preCleanupDiagnostics ?? {}),
        }, 600),
        error:failure.message,
      } : { id:definition.id, status:"passed", durationMs:timing.durationMs } });
    }
  } finally {
    await resources.stop(processContext);
  }
  if (failures.length) {
    throw new AggregateError(
      failures.map(({ error }) => error),
      failures.map(({ id, error }) => `${id}: ${error.message}`).join("; "),
    );
  }
}

export async function runInstalledSidePanelSession({
  definitions = [], fixturePrograms = {}, environment = process.env,
  emit = (record) => console.log(JSON.stringify(record)),
  now = () => performance.now(),
  startProcess = startInstalledBrowserProcess,
  stopProcess = stopInstalledBrowserProcess,
  resetTarget = resetInstalledTarget,
  prepareTarget = prepareInstalledTarget,
  executeTarget = executeInstalledTarget,
  verifyTargetPersistence = verifyInstalledTargetPersistence,
  closeTarget = closeInstalledTarget,
} = {}) {
  await runSidePanelBrowserSession({
    definitions,
    environment,
    emit,
    now,
    resources:{
      start:startProcess,
      resetOrigins:({ targetId, context }) => resetTarget({ targetId, context }),
      openTarget:async ({ targetId, context }) => {
        const targetResources = await prepareTarget({ targetId, context });
        context.executeFixture = () => executeTarget({
          definition:definitions.find(({ id }) => id === targetId),
          definitions,
          fixturePrograms,
          processResources:context.process,
          context,
        });
        return targetResources;
      },
      prepareFixture:async ({ context }) => {
        if (typeof context.socket?.call !== "function") return;
        const ready = await context.socket.call("Runtime.evaluate", {
          expression:"({ready:document.querySelector('#side-panel-root')?.dataset.utilityShellReady === 'true',href:location.href})",
          returnByValue:true,
        });
        if (!ready.result.value.ready) throw new Error(`${context.id} fixture shell was not ready`);
        context.fixtureEvidence = ready.result.value;
      },
      verifyPersistence:({ targetId, context, observation }) =>
        verifyTargetPersistence({ targetId, context, observation }),
      assertObservation:async ({ context }) => {
        for (const assertion of context.deferredAssertions) assertion();
        context.assertionEvidence = Object.freeze({ count:context.deferredAssertions.length });
      },
      closeTarget:({ targetId, context, failure }) => closeTarget({ targetId, context, failure }),
      stop:(processResources) => stopProcess(
        processResources,
        definitions.map(({ id }) => id).join(",") || "side-panel-component-layout",
      ),
    },
  });
}

async function installedDebuggingPort(context) {
  if (context.debuggingPort) return context.debuggingPort;
  if (context.process.debuggingPort) {
    context.debuggingPort = context.process.debuggingPort;
    return context.debuggingPort;
  }
  if (!context.process.debuggingPortPromise) {
    context.process.debuggingPortPromise = waitForChromeDebuggingPort({
      chrome:context.process.chrome,
      targetId:context.id,
      limitMs:30_000,
      maximumStderrCharacters:2_000,
    });
  }
  try { context.debuggingPort = await context.process.debuggingPortPromise; }
  catch (error) {
    context.debuggingPortFailure = error;
    throw error;
  }
  context.process.debuggingPort = context.debuggingPort;
  return context.debuggingPort;
}

async function installedTargets(context) {
  const port = await installedDebuggingPort(context);
  return fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
}

class InstalledDevtoolsSocket {
  constructor(url, targetId, context) {
    this.url = url;
    this.targetId = targetId;
    this.nextId = 1;
    this.pending = new Map();
    this.context = context;
    this.listenerRecords = [];
  }

  listen(type, listener, options) {
    const record = Object.freeze({ socket:this.targetId, type, listener });
    this.socket.addEventListener(type, listener, options);
    this.listenerRecords.push(record);
    this.context.listeners.add(record);
    return record;
  }

  unlisten(record) {
    this.socket?.removeEventListener(record.type, record.listener);
    this.context.listeners.delete(record);
    this.listenerRecords = this.listenerRecords.filter((candidate) => candidate !== record);
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    this.listen("message", ({ data }) => {
      const message = JSON.parse(data);
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    this.listen("close", () => {
      for (const pending of this.pending.values()) pending.reject(new Error("DevTools socket closed"));
      this.pending.clear();
    });
    await new Promise((resolve, reject) => {
      let openRecord;
      let errorRecord;
      const settled = (callback) => (value) => {
        this.unlisten(openRecord);
        this.unlisten(errorRecord);
        callback(value);
      };
      openRecord = this.listen("open", settled(resolve), { once:true });
      errorRecord = this.listen("error", settled(reject), { once:true });
    });
  }

  call(method, params = {}) {
    const id = this.nextId++;
    const timer = Object.freeze({ socket:this.targetId, method, id });
    this.context.timers.add(timer);
    return withDevtoolsProtocolDeadline({
      targetId:this.targetId,
      method,
      limitMs:120_000,
      work:() => new Promise((resolve, reject) => {
        this.pending.set(id, { resolve, reject });
        this.socket.send(JSON.stringify({ id, method, params }));
      }),
      onTimeout:() => this.pending.delete(id),
    }).finally(() => this.context.timers.delete(timer));
  }

  close() {
    for (const pending of this.pending.values()) pending.reject(new Error("DevTools socket closed"));
    this.pending.clear();
    for (const record of [...this.listenerRecords]) this.unlisten(record);
    this.socket?.close();
  }
}

async function discoverInstalledExtension(context) {
  if (context.process.extensionId) return context.process.extensionId;
  const state = await observeBrowserReadiness({
    targetId:context.id, phase:"setup", predicateDescription:"the installed extension service worker",
    timeoutMs:6_000, pollIntervalMs:20, maximumSnapshotCharacters:600,
    observe:async () => {
      const targets = await installedTargets(context);
      const extensionWorker = targets.find(({ type, url }) => type === "service_worker" &&
        url.startsWith("chrome-extension://") && new URL(url).pathname === "/background.js");
      return { extensionWorker, targetCount:targets.length };
    },
    ready:({ extensionWorker }) => Boolean(extensionWorker),
    snapshot:({ targetCount }) => ({ targetCount }),
  });
  context.process.extensionId = new URL(state.extensionWorker.url).hostname;
  return context.process.extensionId;
}

async function openInstalledPage(context, { url, width = 720, readyExpression } = {}) {
  const port = await installedDebuggingPort(context);
  const page = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,
    { method:"PUT" }).then((response) => response.json());
  const socket = new InstalledDevtoolsSocket(page.webSocketDebuggerUrl, context.id, context);
  await socket.connect();
  await socket.call("Emulation.setDeviceMetricsOverride",
    { width, height:900, deviceScaleFactor:1, mobile:false });
  await socket.call("Runtime.enable");
  if (readyExpression) {
    await observeBrowserReadiness({
      targetId:context.id, phase:"navigation", predicateDescription:"the installed side-panel shell",
      timeoutMs:15_000, pollIntervalMs:50, maximumSnapshotCharacters:600,
      observe:async () => (await socket.call("Runtime.evaluate",
        { expression:`({ready:Boolean(${readyExpression}),href:location.href,state:document.readyState})`,
          returnByValue:true })).result.value,
      ready:({ ready }) => ready,
      snapshot:(state) => state,
    });
  }
  context.cleanup.push(() => socket.close());
  return { page, socket };
}

async function closeInstalledPages(context) {
  const port = await installedDebuggingPort(context);
  const targets = await installedTargets(context);
  for (const target of targets.filter(({ type }) => type === "page")) {
    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {});
  }
}

async function resetInstalledTarget({ context }) {
  await closeInstalledPages(context);
  const extensionId = await discoverInstalledExtension(context);
  const { socket } = await openInstalledPage(context, { url:"about:blank" });
  const origins = [`chrome-extension://${extensionId}`, `http://127.0.0.1:${context.process.assetPort}`];
  for (const origin of origins) {
    await socket.call("Storage.clearDataForOrigin", { origin, storageTypes:"all" });
  }
  socket.close();
  await closeInstalledPages(context);
  context.resetEvidence = Object.freeze({ origins:Object.freeze(origins), emulationRestored:true });
}

async function prepareInstalledTarget({ context }) {
  const extensionId = await discoverInstalledExtension(context);
  const opened = [];
  const openAtWidth = async (width) => {
    const target = await openInstalledPage(context, {
      url:`http://127.0.0.1:${context.process.assetPort}/side-panel.html`, width,
      readyExpression:"document.readyState === 'complete' && document.querySelector('#side-panel-root')?.dataset.utilityShellReady === 'true' && document.querySelector('#save-and-close-schema') !== null",
    });
    const fixtureSocket = Object.freeze({
      targetId:target.socket.targetId,
      call:target.socket.call.bind(target.socket),
      close:() => {},
    });
    opened.push({ ...target, fixtureSocket });
    return fixtureSocket;
  };
  const first = await openAtWidth(context.viewport[0]);
  context.acquireInstalledSocket = async (width) => opened.length === 1 &&
      opened[0].fixtureSocket === first && !opened[0].claimed && width === context.viewport[0]
    ? (opened[0].claimed = true, first)
    : openAtWidth(width);
  return { extensionId, page:opened[0].page, socket:first, installedPages:opened };
}

async function executeInstalledTarget({ definition, fixturePrograms, processResources, context }) {
  const records = [];
  await runSidePanelBrowserFixture({
    definitions:[definition],
    fixturePrograms,
    processResources,
    manageLifecycle:false,
    targetContext:context,
    emit:(record) => {
      const parsed = typeof record === "string" ? JSON.parse(record) : record;
      if (parsed && typeof parsed === "object") records.push(parsed);
    },
  });
  const observation = Object.assign({}, ...records.filter((record) =>
    definition.observationKeys.some((key) => Object.hasOwn(record, key))));
  context.observations.set(definition.id, structuredClone(observation));
  return observation;
}

async function verifyInstalledTargetPersistence({ context, observation }) {
  const persisted = await context.socket.call("Runtime.evaluate", {
    expression:"({href:location.href,localStorageEntries:localStorage.length,ready:document.readyState})",
    returnByValue:true,
  });
  context.persistenceEvidence = persisted.result.value;
  return structuredClone(observation);
}

async function closeInstalledTarget({ context }) {
  if (context.debuggingPortFailure) return;
  await closeInstalledPages(context);
}
