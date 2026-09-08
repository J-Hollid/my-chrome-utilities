import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  chromeExecutableCandidates,
  headlessChromeArguments,
  removeChromeProfile,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "./support/headless-chrome.mjs";
import { runBrowserTargetSession } from "./support/browser-target-session.mjs";
import { validateBrowserTargetTiming } from "./support/browser-observation-control.mjs";
import { timeoutIncidentDigest as digest } from "../scripts/verification-reliability-values.mjs";

const args = headlessChromeArguments("/tmp/profile");
assert.ok(args.includes("--disable-background-networking"));
assert.ok(args.includes("--disable-component-update"));
assert.ok(args.includes("--disable-sync"));
assert.ok(args.includes("--user-data-dir=/tmp/profile"));

assert.equal(
  resolveChromeExecutable({
    env: { CHROME_PATH: "/custom/chrome", PATH: "" },
    platform: "linux",
    exists: (candidate) => candidate === "/custom/chrome",
  }),
  "/custom/chrome",
);
assert.deepEqual(
  chromeExecutableCandidates({
    env: {
      PROGRAMFILES: "C:\\Program Files",
      LOCALAPPDATA: "C:\\Users\\Analyst\\AppData\\Local",
      PATH: "",
    },
    platform: "win32",
  }),
  [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Users\\Analyst\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
  ],
);
assert.ok(
  chromeExecutableCandidates({
    env: { PATH: "/usr/bin" },
    platform: "linux",
  }).includes("/usr/bin/google-chrome"),
);
assert.throws(
  () =>
    resolveChromeExecutable({
      env: { PATH: "" },
      platform: "linux",
      exists: () => false,
    }),
  /CHROME_PATH/u,
);

class FakeChrome extends EventEmitter {
  exitCode = null;
  signals = [];
  kill(signal) {
    this.signals.push(signal);
    if (signal === "SIGKILL") {
      this.exitCode = 137;
      queueMicrotask(() => this.emit("exit", this.exitCode));
    }
    return true;
  }
}

const stubbornChrome = new FakeChrome();
await stopHeadlessChrome(stubbornChrome, 1);
assert.deepEqual(stubbornChrome.signals, ["SIGTERM", "SIGKILL"]);

const immortalChrome = new FakeChrome();
let terminationFailure;
try {
  await stopHeadlessChrome(immortalChrome, 1, {
    targetId:"TARGET-DEADLINE",
    waitForExit:async() => false,
  });
} catch (error) { terminationFailure=error; }
assert.equal(terminationFailure?.deadlineOwner,"Chrome termination");
assert.equal(terminationFailure?.targetId,"TARGET-DEADLINE");
assert.doesNotMatch(terminationFailure.message,/readiness predicate/u);

const cooperativeChrome = new FakeChrome();
cooperativeChrome.kill = function kill(signal) {
  this.signals.push(signal);
  this.exitCode = 0;
  queueMicrotask(() => this.emit("exit", 0));
  return true;
};
await stopHeadlessChrome(cooperativeChrome, 20);
assert.deepEqual(cooperativeChrome.signals, ["SIGTERM"]);

const exitedChrome = new FakeChrome();
exitedChrome.exitCode = 0;
await stopHeadlessChrome(exitedChrome, 1);
assert.deepEqual(exitedChrome.signals, []);

const signalledChrome = new FakeChrome();
signalledChrome.signalCode = "SIGKILL";
await stopHeadlessChrome(signalledChrome, 1);
assert.deepEqual(signalledChrome.signals, []);

const cleanupAttempts = [];
await removeChromeProfile("/tmp/profile-busy", {
  targetId:"LAYERED_CORE",
  retryDelayMilliseconds:1,
  remove:async(profile) => {
    cleanupAttempts.push(profile);
    if (cleanupAttempts.length < 3) throw Object.assign(new Error("busy"), { code:"EBUSY" });
  },
  wait:async() => {},
});
assert.equal(cleanupAttempts.length, 3, "transient profile cleanup contention is retried");
await assert.rejects(() => removeChromeProfile("/tmp/profile-stuck", {
  targetId:"LAYERED_EDITOR", attempts:2, retryDelayMilliseconds:1,
  remove:async() => { throw Object.assign(new Error("busy"), { code:"EBUSY" }); },
  wait:async() => {},
}), /LAYERED_EDITOR.*\/tmp\/profile-stuck/u,
"exhausted cleanup identifies the logical target and isolated profile path");

let profileFailure;
try {
  await removeChromeProfile("/tmp/profile-stuck", {
  targetId:"TARGET-DEADLINE", attempts:1,
  remove:async() => { throw Object.assign(new Error("busy"), { code:"EBUSY" }); },
  wait:async() => {},
  });
} catch (error) { profileFailure=error; }
assert.equal(profileFailure?.deadlineOwner,"profile cleanup");
assert.equal(profileFailure?.targetId,"TARGET-DEADLINE");
assert.doesNotMatch(profileFailure.message,/readiness predicate/u);

await assert.rejects(() => removeChromeProfile("/tmp/profile-hung", {
  targetId:"TARGET-DEADLINE", deadlineMilliseconds:10,
  remove:() => new Promise(() => {}), wait:async() => {},
  schedule:(callback) => { callback();return 1; }, cancel:() => {},
}), (error) => error.deadlineOwner === "profile cleanup" &&
  error.targetId === "TARGET-DEADLINE" && !error.message.includes("readiness predicate"));

let installedRunnerEvidence;
if(process.env.SWARMFORGE_VTD007_REAL_RUNNER_PROBES==="1" ||
   process.env.SWARMFORGE_VERIFICATION_RECEIPT){
  const extensionRoot = await mkdtemp(path.resolve("tmp", "installed-lifecycle-fixture-"));
  await Promise.all([
    writeFile(path.join(extensionRoot, "manifest.json"), JSON.stringify({
      manifest_version:3, name:"Installed lifecycle fixture", version:"1.0",
      background:{ service_worker:"background.js" },
    })),
    writeFile(path.join(extensionRoot, "background.js"),
      "chrome.runtime.onInstalled.addListener(() => {});"),
    writeFile(path.join(extensionRoot, "probe.html"),
      "<!doctype html><html><head><title>Lifecycle probe</title></head><body></body></html>"),
  ]);
  const installedLines=[];
  const originalLog=console.log;
  console.log=(...values)=>installedLines.push(values.join(" "));
  let installedFailure;
  let beforeIsolation;
  const repairContext=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION??"null");
  const configuration={
    SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify(["VTD007_INSTALLED_FAILURE_TARGET"]),
    SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS:JSON.stringify({VTD007_INSTALLED_FAILURE_TARGET:{}}),
  };
  const definition={
    pagePath:"probe.html",maximumElapsedMilliseconds:10000,
    readiness:{description:"installed runner document readiness",
      expression:"({ready:document.readyState==='complete',state:document.readyState})"},
    run:async({ socket, evaluate })=>{
      await evaluate(socket(), "(()=>{throw new Error('causal in-page probe failure')})()");
      throw new Error("forced installed runner interaction failure");
    },
  };
  try{
    if(repairContext?.causalCategory==="other:Chrome lifecycle fixture isolation"){
      const original=execFileSync("git",["show",
        "66bd90e54b221f0528385c740131e8f91980be35:test/headless-chrome-lifecycle-test.mjs"],{encoding:"utf8"});
      const former=original.match(/pagePath:"([^"]+)",maximumElapsedMilliseconds:(\d+)/u);
      assert.ok(former,"the controlled regression retains the immutable former page and deadline");
      assert.equal(Number(former[2]),definition.maximumElapsedMilliseconds);
      await writeFile(path.join(extensionRoot,former[1]),
        '<!doctype html><script src="slow-startup.js"></script>');
      await writeFile(path.join(extensionRoot,"slow-startup.js"),
        `const start=performance.now();while(performance.now()-start<${Number(former[2])+1000}){}`);
      let formerFailure;
      try{await runBrowserTargetSession({extensionRoot,environment:configuration,
        definitions:{VTD007_INSTALLED_FAILURE_TARGET:{...definition,pagePath:former[1]}}});}
      catch(error){formerFailure=error;}
      const detail=[formerFailure?.message,...(formerFailure?.errors??[]).map(error=>error.message)].join(" ");
      assert.match(detail,/deadline|timed out/iu,"unrelated page startup exhausts the original target budget");
      assert.doesNotMatch(detail,/causal in-page probe failure/u);
      beforeIsolation={interactionErrorReached:false};
      installedLines.length=0;
    }
    await runBrowserTargetSession({
      extensionRoot,
      environment:configuration,
      definitions:{VTD007_INSTALLED_FAILURE_TARGET:definition},
    });
  }catch(error){installedFailure=error;}
  finally{console.log=originalLog;await rm(extensionRoot,{recursive:true,force:true});}
  assert.ok(installedFailure,"the real installed-session failure probe must fail");
  const installedFailureDetails = [
    installedFailure.message,
    ...(installedFailure.errors ?? []).map((error) => error?.message ?? String(error)),
    ...Object.values(installedFailure.targetResults ?? {}).map((result) => result?.error ?? ""),
  ].join(" ");
  assert.match(installedFailureDetails, /causal in-page probe failure/u,
    "an in-page Runtime.evaluate throw must fail the logical target");
  if(beforeIsolation){
    const afterIsolation={interactionErrorReached:true};
    const fixture={id:"installed-lifecycle-startup-isolation-v1",causalCategory:repairContext.causalCategory,
      diagnosedBoundaryDigest:digest(repairContext.diagnosedBoundary),
      input:{startupDelayMs:11000,targetBudgetMs:10000},
      expectedPreRepairFailure:beforeIsolation,expectedRepairResult:afterIsolation};
    const fixtureDigest=digest(fixture);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:repairContext.incidentId,failureDigest:repairContext.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:beforeIsolation},
      repairResult:{status:"passed",fixtureDigest,observed:afterIsolation}}}));
  }
  const timingLines=installedLines.filter((line)=>line.includes('"swarmforgeBrowserTargetTiming"'));
  assert.equal(timingLines.length,1,
    "the failed installed lifecycle must emit timing exactly once");
  const timing=JSON.parse(timingLines[0]).swarmforgeBrowserTargetTiming;
  assert.equal(timing.activePhase,"interaction",
    "installed runner failures must retain the caller-owned interaction phase");
  const timingValidation=validateBrowserTargetTiming(timing,{
    phaseNames:["target setup","navigation","fixture","interaction","persistence",
      "assertion","target cleanup"],
    applicableNonZeroPhases:["target setup","navigation","interaction","target cleanup"],
  });
  assert.throws(()=>validateBrowserTargetTiming({...timing,phases:[...timing.phases].reverse()},
    {phaseNames:timingValidation.phaseNames}),/ordered schema/u,
  "real installed phase-order mutations must be rejected");
  assert.throws(()=>validateBrowserTargetTiming({...timing,
    phases:timing.phases.map((phase,index)=>index===0?{...phase,durationMs:NaN}:phase)},
  {phaseNames:timingValidation.phaseNames}),/finite, non-negative/u,
  "real installed non-finite duration mutations must be rejected");
  assert.throws(()=>validateBrowserTargetTiming({...timing,durationMs:timing.durationMs+1},
    {phaseNames:timingValidation.phaseNames}),/conserve/u,
  "real installed duration-conservation mutations must be rejected");
  const interactionDuration=timing.phases.find(({name})=>name==="interaction").durationMs;
  assert.throws(()=>validateBrowserTargetTiming({...timing,durationMs:timing.durationMs-interactionDuration,
    phases:timing.phases.map((phase)=>phase.name==="interaction"?{...phase,durationMs:0}:phase)},
  {phaseNames:timingValidation.phaseNames,applicableNonZeroPhases:["interaction"]}),
  /non-zero work/u,"real installed applicable-phase mutations must be rejected");
  installedRunnerEvidence={activePhase:timing.activePhase,timingRecords:timingLines.length,
    timing:timingValidation};
}

console.log(JSON.stringify({vtd007LifecycleAcceptance:{
  deadlineRows:[
    {failure:"the browser ignores graceful termination",
      deadlineOwner:terminationFailure.deadlineOwner,productionBoundary:"stopHeadlessChrome"},
    {failure:"the browser profile remains temporarily busy",
      deadlineOwner:profileFailure.deadlineOwner,productionBoundary:"removeChromeProfile"},
  ],
  installedRunner:installedRunnerEvidence,
}}));

console.log("headless Chrome lifecycle tests passed");
