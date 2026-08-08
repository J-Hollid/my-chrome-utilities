import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import {
  chromeExecutableCandidates,
  headlessChromeArguments,
  removeChromeProfile,
  resolveChromeExecutable,
  stopHeadlessChrome,
} from "./support/headless-chrome.mjs";
import { runBrowserTargetSession } from "./support/browser-target-session.mjs";
import { validateBrowserTargetTiming } from "./support/browser-observation-control.mjs";

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
if(process.env.SWARMFORGE_VTD007_REAL_RUNNER_PROBES==="1"){
  const installedLines=[];
  const originalLog=console.log;
  console.log=(...values)=>installedLines.push(values.join(" "));
  let installedFailure;
  try{
    await runBrowserTargetSession({
      environment:{
        SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify(["VTD007_INSTALLED_FAILURE_TARGET"]),
        SWARMFORGE_BROWSER_TARGET_CONFIGURATIONS:JSON.stringify({VTD007_INSTALLED_FAILURE_TARGET:{}}),
      },
      definitions:{VTD007_INSTALLED_FAILURE_TARGET:{
        pagePath:"specification-builder.html",maximumElapsedMilliseconds:10000,
        readiness:{description:"installed runner document readiness",
          expression:"({ready:document.readyState==='complete',state:document.readyState})"},
        run:async()=>{throw new Error("forced installed runner interaction failure");},
      }},
    });
  }catch(error){installedFailure=error;}
  finally{console.log=originalLog;}
  assert.ok(installedFailure,"the real installed-session failure probe must fail");
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
