import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import ts from "typescript";

import {
  boundedFlowExamplesReadiness,
  createFlowExamplesPhaseTimer,
  flowExamplesTargetLimitMilliseconds,
  validateFlowExamplesPhaseTiming,
} from "./support/flow-examples-timing.mjs";
import {
  browserReadinessProgramSource,
  browserProgram,
  createBrowserPhaseTimer,
  observeBrowserReadiness,
  transmitDevtoolsProgram,
  validateBrowserTargetTiming,
  waitForChromeDebuggingPort,
  withDevtoolsProtocolDeadline,
  withLogicalTargetLifecycle,
  withLogicalTargetDeadline,
} from "./support/browser-observation-control.mjs";
import { sharedHarnessReadinessState } from "./browser-packs/shared-harness.mjs";
import {
  flowGraphEventExampleSeed,
  flowGraphRuntimeCanvasReady,
  flowGraphRuntimeDefinitionReady,
  flowGraphRuntimeEditorReady,
  flowGraphRuntimeReturnReady,
  flowGraphRepeatedInstanceEvidence,
  flowGraphRepeatedInstanceReadinessLimitMilliseconds,
  flowGraphEventExampleIncompleteEvidence,
  flowGraphEventExampleStateEvidence,
  flowGraphPageExampleIncompleteEvidence,
  flowGraphPageExampleStateEvidence,
} from "./support/flow-graph-corrective-workflow.mjs";
import {
  flowAuthoringProofContract,
  flowAuthoringProofResult,
  decodeDevtoolsTextFrame,
  encodeDevtoolsTextFrame,
  planFlowBrowserTargets,
  flowSectionDrawActionabilityState,
  flowSectionTargetState,
  flowSectionMenuInvocationPlan,
  flowSectionMenuInvocationRequired,
  flowSectionRenderedGenerationState,
  flowWorkspaceReadinessLimitMilliseconds,
  flowWorkspaceR02Runtime,
} from "./support/flow-workspace-r02-runtime.mjs";

const execFileAsync=promisify(execFile);
const flowGraphAdapterSource=readFileSync("test/browser-packs/flow-graph.mjs","utf8");
const verificationRegistry=JSON.parse(readFileSync("verification/packs.json","utf8"));
const registeredFlowPack=Object.values(verificationRegistry).find(({id})=>id==="flow_graph");
const requiredSectionActions=[
  "Rename","Move","Resize","Wrap selection","Remove Section","Remove with contents",
];
assert.deepEqual([...flowAuthoringProofContract.sectionActions],requiredSectionActions,
  "the verification oracle independently retains every required Section action");
const expectedTargetPlan=[
  {id:"FLOW_WORKSPACE_CONTROLS_TARGET",shard:"core"},
  {id:"FLOW_WORKSPACE_AUTHORING_TARGET",shard:"author"},
  {id:"FLOW_GRAPH_LEGACY_TARGET",shard:"legacy"},
  {id:"FLOW_GRAPH_EXAMPLES_TARGET",shard:"examples"},
];
assert.deepEqual(planFlowBrowserTargets(expectedTargetPlan.map(({id})=>id)),expectedTargetPlan,
  "the browser pack's real target planner retains every target's semantic shard");
const mutatedControlsPlan=flowAuthoringProofResult({...flowAuthoringProofContract,
  requestedTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET",
  selectedTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET",selectedShard:"author"});
assert.equal(mutatedControlsPlan.valid,false);
assert.deepEqual(mutatedControlsPlan.violations[0],{
  behavior:"target selection",
  expected:{id:"FLOW_WORKSPACE_CONTROLS_TARGET",shard:"core"},
  observed:{id:"FLOW_WORKSPACE_CONTROLS_TARGET",shard:"author"},
  message:'target selection: expected {"id":"FLOW_WORKSPACE_CONTROLS_TARGET","shard":"core"}; observed {"id":"FLOW_WORKSPACE_CONTROLS_TARGET","shard":"author"}',
});
for(const length of [125,126,65535,65536,66257]){
  const payload="x".repeat(length),encoded=encodeDevtoolsTextFrame(payload,Buffer.from([1,2,3,4]));
  const decoded=decodeDevtoolsTextFrame(encoded.bytes);
  assert.equal(decoded.valid,true,decoded.message);
  assert.equal(decoded.payloadLength,length);
  assert.equal(decoded.lengthForm,length<126?"short":length<=65535?"uint16":"uint64");
  assert.equal(decoded.payload,payload,
    `Flow DevTools ${decoded.lengthForm} frame must round-trip ${length} bytes`);
}
const invalidEndianFrame=Buffer.from(encodeDevtoolsTextFrame("x".repeat(126),Buffer.from([1,2,3,4])).bytes);
invalidEndianFrame.writeUInt16LE(126,2);
const invalidEndianResult=decodeDevtoolsTextFrame(invalidEndianFrame);
assert.equal(invalidEndianResult.valid,false);
assert.equal(invalidEndianResult.lengthForm,"uint16");
assert.equal(invalidEndianResult.payloadLength,32256);
assert.match(invalidEndianResult.message,/uint16.*32256/u,
  "frame failures report the independently parsed length form and observed length");
assert.match(flowGraphAdapterSource,
  /timeoutMs:browserShard==="examples"[\s\S]*?:\s*Math\.max\(1,\s*remainingMilliseconds\(\)-50\)/u,
  "non-example Flow readiness must consume the owning logical target budget instead of an unrelated five-second ceiling");
assert.deepEqual(flowSectionMenuInvocationPlan("pointer"),[0,100],
  "pointer Section menus receive one bounded retry against the current rendered target");
assert.deepEqual(flowSectionMenuInvocationPlan("keyboard"),[0],
  "keyboard Section menus remain a single semantic invocation");
assert.equal(flowSectionMenuInvocationRequired({surfaceOpen:false,sectionMenuPresent:false}),true,
  "the bounded retry remains eligible while the Section menu is absent");
assert.equal(flowSectionMenuInvocationRequired({surfaceOpen:true,sectionMenuPresent:true}),false,
  "a delayed successful invocation suppresses a duplicate context-menu dispatch");

function literalValue(node){
  if(!node)return undefined;
  if(ts.isStringLiteralLike(node)||ts.isNumericLiteral(node))return node.text;
  if(node.kind===ts.SyntaxKind.TrueKeyword)return true;
  if(node.kind===ts.SyntaxKind.FalseKeyword)return false;
  return undefined;
}

function exportedPredicate(pathname,name){
  const text=readFileSync(pathname,"utf8");
  const source=ts.createSourceFile(pathname,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const declaration=source.statements.find((node)=>
    ts.isFunctionDeclaration(node)&&node.name?.text===name&&
    node.modifiers?.some(({kind})=>kind===ts.SyntaxKind.ExportKeyword));
  assert.ok(declaration,`${pathname} exports ${name}`);
  return Function(`return (${declaration.getText(source).replace(/^export\s+/u,"")});`)();
}

function productionCallFacts(pathname,names){
  const source=ts.createSourceFile(pathname,readFileSync(pathname,"utf8"),
    ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const calls=[];
  const visit=(node)=>{
    if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&names.includes(node.expression.text)){
      const object=node.arguments.find(ts.isObjectLiteralExpression);
      const properties={};
      if(object)for(const property of object.properties){
        if(ts.isPropertyAssignment(property)){
          const name=property.name.getText(source).replaceAll(/["']/gu,"");
          const value=literalValue(property.initializer);
          if(value!==undefined)properties[name]=value;
        }
      }
      calls.push({callee:node.expression.text,
        arguments:node.arguments.map(literalValue).filter((value)=>value!==undefined),properties});
    }
    ts.forEachChild(node,visit);
  };
  visit(source);
  return calls;
}

function browserPolicyFacts(pathname,text=readFileSync(pathname,"utf8")){
  const source=ts.createSourceFile(pathname,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const fixedDelays=[],fixedAttempts=[];
  const adjacentReason=(node)=>/Observe|duration|gesture|animation|render|key-repeat/iu.test(
    text.slice(Math.max(0,node.getStart(source)-180),node.getEnd()+40));
  const hasFixedAttemptBound=(node)=>{
    if(ts.isBinaryExpression(node)){
      if([ts.SyntaxKind.LessThanToken,ts.SyntaxKind.LessThanEqualsToken,
        ts.SyntaxKind.GreaterThanToken,ts.SyntaxKind.GreaterThanEqualsToken]
        .includes(node.operatorToken.kind)){
        return ts.isNumericLiteral(node.left)||ts.isNumericLiteral(node.right);
      }
      return hasFixedAttemptBound(node.left)||hasFixedAttemptBound(node.right);
    }
    return false;
  };
  const visit=(node)=>{
    if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&
        node.expression.text==="wait"&&ts.isNumericLiteral(node.arguments[0])){
      fixedDelays.push({milliseconds:Number(node.arguments[0].text),reasonAdjacent:adjacentReason(node)});
    }
    if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&
        node.expression.text==="setTimeout"&&ts.isNumericLiteral(node.arguments[1])){
      fixedDelays.push({milliseconds:Number(node.arguments[1].text),reasonAdjacent:adjacentReason(node)});
    }
    if(ts.isForStatement(node)&&node.condition&&hasFixedAttemptBound(node.condition)){
      fixedAttempts.push({condition:node.condition.getText(source),reasonAdjacent:adjacentReason(node)});
    }
    if(ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateExpression(node)){
      const embedded=node.getText(source);
      for(const match of embedded.matchAll(/setTimeout\s*\([^,]+,\s*(\d+)\s*\)/gu)){
        const context=embedded.slice(Math.max(0,match.index-180),match.index+match[0].length+40);
        fixedDelays.push({milliseconds:Number(match[1]),
          reasonAdjacent:/Observe|duration|gesture|animation|render|key-repeat/iu.test(context)});
      }
      for(const match of embedded.matchAll(/for\s*\([^;]+;[^;]*[<>]=?\s*(\d+)[^;]*;/gu)){
        const context=embedded.slice(Math.max(0,match.index-180),match.index+match[0].length+40);
        fixedAttempts.push({condition:match[0],
          reasonAdjacent:/Observe|duration|gesture|animation|render|key-repeat/iu.test(context)});
      }
    }
    ts.forEachChild(node,visit);
  };
  visit(source);
  return {pathname,fixedDelays,fixedAttempts};
}

function protocolProgramFacts(pathname,text=readFileSync(pathname,"utf8")){
  const source=ts.createSourceFile(pathname,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const transmissions=[];
  const visit=(node)=>{
    if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&
        node.expression.text==="transmitDevtoolsProgram"){
      const object=node.arguments.find(ts.isObjectLiteralExpression);
      const methodProperty=object?.properties.find((property)=>ts.isPropertyAssignment(property)&&
        property.name.getText(source)==="method");
      transmissions.push({method:methodProperty&&literalValue(methodProperty.initializer),wrapped:true});
    }
    ts.forEachChild(node,visit);
  };
  visit(source);
  return transmissions;
}

function importsSharedTransmissionBoundary(pathname,text=readFileSync(pathname,"utf8")){
  const source=ts.createSourceFile(pathname,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const imported=source.statements.some((statement)=>ts.isImportDeclaration(statement)&&
    ts.isStringLiteral(statement.moduleSpecifier)&&
    statement.moduleSpecifier.text.endsWith("browser-observation-control.mjs")&&
    statement.importClause?.namedBindings&&ts.isNamedImports(statement.importClause.namedBindings)&&
    statement.importClause.namedBindings.elements.some(({name})=>name.text==="transmitDevtoolsProgram"));
  const locallyDefined=source.statements.some((statement)=>
    (ts.isFunctionDeclaration(statement)&&statement.name?.text==="transmitDevtoolsProgram")||
    (ts.isVariableStatement(statement)&&statement.declarationList.declarations
      .some(({name})=>ts.isIdentifier(name)&&name.text==="transmitDevtoolsProgram")));
  return imported&&!locallyDefined;
}

function sharedTransmissionBoundaryValid(text=readFileSync(
  "test/support/browser-observation-control.mjs","utf8")){
  const source=ts.createSourceFile("browser-observation-control.mjs",text,
    ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const boundary=source.statements.find((statement)=>ts.isFunctionDeclaration(statement)&&
    statement.name?.text==="transmitDevtoolsProgram");
  let delegates=false;
  const visit=(node)=>{
    if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&
        node.expression.text==="transmitBrowserProgram") delegates=true;
    ts.forEachChild(node,visit);
  };
  if(boundary)visit(boundary);
  return Boolean(boundary&&delegates);
}

const sharedReadinessFacts=productionCallFacts("test/browser-packs/shared-harness.mjs",
  ["observeBrowserReadiness","ready"]);
const installedReadinessFacts=[
  ...productionCallFacts("test/support/browser-target-session.mjs",["observeBrowserReadiness"]),
  ...productionCallFacts("test/support/layered-schema-targets.mjs",["observeBrowserReadiness"]),
];
const flowReadinessFacts=productionCallFacts("test/browser-packs/flow-graph.mjs",
  ["observeBrowserReadiness","boundedFlowExamplesReadiness","waitForBrowser"]);
const migratedEntryPoints=[
  "test/browser-packs/shared-harness.mjs",
  "test/support/browser-target-session.mjs",
  "test/support/layered-schema-targets.mjs",
  "test/browser-packs/flow-graph.mjs",
  "test/support/flow-examples-timing.mjs",
];
const browserPolicyEvidence=migratedEntryPoints.map((pathname)=>browserPolicyFacts(pathname));
const fixedDelayEvidence=browserPolicyEvidence.flatMap(({pathname,fixedDelays})=>
  fixedDelays.map((fact)=>({...fact,pathname})));
const fixedAttemptEvidence=browserPolicyEvidence.flatMap(({pathname,fixedAttempts})=>
  fixedAttempts.map((fact)=>({...fact,pathname})));

const sharedPredicateCases=[
  {documentReadyState:"complete",shellReady:"true",isolation:"data-layer"},
  {documentReadyState:"loading",shellReady:"true",isolation:"data-layer"},
  {documentReadyState:"complete",shellReady:"false",isolation:"data-layer"},
  {documentReadyState:"complete",shellReady:"true",isolation:"hotkeys"},
];
const sharedPredicateOutcomes=sharedPredicateCases.map((state)=>
  sharedHarnessReadinessState(state,"data-layer"));
assert.deepEqual(sharedPredicateOutcomes,[true,false,false,false],
"the actual shared-harness predicate must require document, Shell root, and isolation readiness");
const layeredCreateProjectReadinessState=exportedPredicate(
  "test/support/layered-schema-workflows.mjs","layeredCreateProjectReadinessState");
const layeredEditorHydrationReadinessState=exportedPredicate(
  "test/support/layered-schema-workflows.mjs","layeredEditorHydrationReadinessState");
const layeredCreateProjectOutcomes=[true,false].map((createProjectConnected)=>
  layeredCreateProjectReadinessState({createProjectConnected}));
assert.deepEqual(layeredCreateProjectOutcomes,[true,false],
  "the actual Layered create-project predicate must require a connected form");
const hydrationCases=[
  {documentReadyState:"complete",createProjectConnected:true,projectTreeConnected:true},
  {documentReadyState:"loading",createProjectConnected:true,projectTreeConnected:true},
  {documentReadyState:"complete",createProjectConnected:false,projectTreeConnected:true},
  {documentReadyState:"complete",createProjectConnected:true,projectTreeConnected:false},
];
const layeredHydrationOutcomes=hydrationCases.map(layeredEditorHydrationReadinessState);
assert.deepEqual(layeredHydrationOutcomes,[true,false,false,false],
  "the actual Layered hydration predicate must require complete document and both connected roots");

const protocolAdapterPaths=[
  "test/browser-packs/shared-harness.mjs",
  "test/support/browser-target-session.mjs",
  "test/browser-packs/flow-graph.mjs",
];
const protocolAdapterEvidence=protocolAdapterPaths.map((pathname)=>({
  pathname,transmissions:protocolProgramFacts(pathname),
}));
assert.equal(sharedTransmissionBoundaryValid(),true,
  "the common DevTools boundary must delegate syntax validation before transmission");
const controlSource=readFileSync("test/support/browser-observation-control.mjs","utf8");
assert.doesNotMatch(controlSource,
  /sharedHarnessReadiness|layeredCreateProjectReadiness|layeredEditorHydrationReadiness/u,
  "the common browser control must not own Shell or Layered predicate policy");
assert.equal(sharedTransmissionBoundaryValid(controlSource.replace(
  "return transmitBrowserProgram({","return bypassBrowserProgram({")),false,
"a definition-body syntax-validation bypass mutation must be detected");
for(const {pathname,transmissions} of protocolAdapterEvidence){
  assert.equal(importsSharedTransmissionBoundary(pathname),true,
    `${pathname} must import the shared enforced DevTools boundary without shadowing it`);
  assert.ok(transmissions.length>0,`${pathname} must transmit at least one generated browser program`);
  assert.ok(transmissions.every(({wrapped})=>wrapped),
    `${pathname} must validate every generated program at the protocol boundary`);
  const source=readFileSync(pathname,"utf8");
  const mutated=source.replace("transmitDevtoolsProgram(","unvalidatedProgram(");
  assert.ok(protocolProgramFacts(pathname,mutated).length<transmissions.length,
    `${pathname} wrapper-removal mutation must be detected`);
}
for(const pathname of migratedEntryPoints){
  const source=readFileSync(pathname,"utf8");
  const unexplainedDelay=browserPolicyFacts(pathname,`${source}\nawait wait(37);`);
  assert.ok(unexplainedDelay.fixedDelays.some(({milliseconds,reasonAdjacent})=>
    milliseconds===37&&!reasonAdjacent),`${pathname} unexplained fixed-delay mutation must be detected`);
  const fixedAttempt=browserPolicyFacts(pathname,
    `${source}\nfor(let attempt=0;attempt<37;attempt+=1){void attempt;}`);
  assert.ok(fixedAttempt.fixedAttempts.some(({condition,reasonAdjacent})=>
    condition.includes("37")&&!reasonAdjacent),`${pathname} fixed-attempt mutation must be detected`);
}


let timestamp = 0;
const timer = createFlowExamplesPhaseTimer({
  browserStartupMs:37,
  now:() => timestamp,
});
timestamp = 4;
timer.transition("fixture setup");
timestamp = 11;
timer.transition("readiness");
timestamp = 19;
timer.transition("example compilation");
timestamp = 23;
timer.transition("rendering");
timestamp = 31;
timer.transition("persistence");
timestamp = 36;
timer.transition("assertion");
timestamp = 44;
timer.transition("cleanup");
timestamp = 47;
const timing = timer.finish();
assert.deepEqual(timing.phases.map(({ name, scope }) => [name, scope]), [
  ["browser startup", "process"],
  ["target setup", "target"],
  ["fixture setup", "target"],
  ["readiness", "target"],
  ["example compilation", "target"],
  ["rendering", "target"],
  ["persistence", "target"],
  ["assertion", "target"],
  ["cleanup", "target"],
]);
assert.equal(timing.durationMs, 47);
assert.equal(timing.phases.filter(({ scope }) => scope === "target")
  .reduce((sum, { durationMs }) => sum + durationMs, 0), timing.durationMs);
assert.deepEqual(validateFlowExamplesPhaseTiming(timing), timing);

let readinessClock = 0;
const states = [{ ready:false, status:"loading" }, { ready:false, status:"mounting" },
  { ready:true, status:"ready" }];
const ready = await boundedFlowExamplesReadiness({
  targetId:"FLOW_GRAPH_EXAMPLES_TARGET",
  phase:"readiness",
  predicate:"project tree mounted",
  timeoutMs:100,
  now:() => readinessClock,
  sleep:async(milliseconds) => { readinessClock += milliseconds; },
  observe:async() => states.shift(),
  intervalMs:10,
});
assert.equal(ready.status, "ready");

readinessClock = 0;
await assert.rejects(() => boundedFlowExamplesReadiness({
  targetId:"FLOW_GRAPH_EXAMPLES_TARGET",
  phase:"rendering",
  predicate:"example row rendered",
  timeoutMs:20,
  now:() => readinessClock,
  sleep:async(milliseconds) => { readinessClock += milliseconds; },
  observe:async() => ({ ready:false, status:"still-loading", oversized:"x".repeat(1000) }),
  intervalMs:10,
  maximumSnapshotCharacters:80,
}), /FLOW_GRAPH_EXAMPLES_TARGET.*rendering.*example row rendered.*20ms.*still-loading/su);

readinessClock = 0;
await assert.rejects(() => boundedFlowExamplesReadiness({
  targetId:"FLOW_GRAPH_EXAMPLES_TARGET",
  phase:"readiness",
  predicate:"snapshot available",
  timeoutMs:10,
  now:() => readinessClock,
  sleep:async(milliseconds) => { readinessClock += milliseconds; },
  observe:async() => undefined,
  intervalMs:10,
}), /last state undefined/u,
"a missing diagnostic snapshot must not mask the bounded-readiness timeout");

assert.throws(() => validateFlowExamplesPhaseTiming({
  durationMs:10,
  phases:timing.phases.map((phase) => phase.name === "cleanup"
    ? { ...phase, durationMs:phase.durationMs + 2 } : phase),
}), /cover target duration/u);

readinessClock = 0;
const stableStates = [true, false, true, true, true].map((ready, index) => ({ ready, index }));
const stable = await observeBrowserReadiness({
  targetId:"TARGET-READY", phase:"navigation", predicateDescription:"workspace mounted",
  timeoutMs:100, pollIntervalMs:25, stabilityMs:50, maximumSnapshotCharacters:80,
  now:() => readinessClock,
  sleep:async(milliseconds) => { readinessClock += milliseconds; },
  observe:async() => stableStates.shift(), ready:({ ready }) => ready,
  snapshot:(observation) => observation,
});
assert.equal(stable.index, 4, "a false observation resets elapsed stability");

readinessClock = 0;
const hostile = { ready:false, text:"x".repeat(200) };hostile.self=hostile;
await assert.rejects(() => observeBrowserReadiness({
  targetId:"TARGET-READY", phase:"navigation", predicateDescription:"workspace mounted",
  timeoutMs:60, pollIntervalMs:25, maximumSnapshotCharacters:80,
  now:() => readinessClock,
  sleep:async(milliseconds) => { readinessClock += milliseconds; },
  observe:async() => hostile, ready:({ ready }) => ready,
  snapshot:() => { throw new Error("snapshot exploded"); },
}), (error) => error.snapshot.length <= 80 && /60ms.*snapshot exploded/su.test(error.message));
readinessClock = 0;
await assert.rejects(() => observeBrowserReadiness({
  targetId:"TARGET-READY", phase:"navigation", predicateDescription:"workspace mounted",
  timeoutMs:0, pollIntervalMs:25, maximumSnapshotCharacters:40,
  now:() => readinessClock, sleep:async() => {}, observe:async() => false,
  ready:() => false, snapshot:() => { throw undefined; },
}), (error) => error.targetId === "TARGET-READY" && error.phase === "navigation" &&
  error.snapshot.length <= 40 && /snapshot failed: undefined/u.test(error.message));

let sharedTimestamp = 0;
const sharedTimer = createBrowserPhaseTimer({
  targetId:"TARGET", phaseNames:["navigation", "fixture", "assertion"],
  now:() => sharedTimestamp,
});
sharedTimestamp=3;sharedTimer.transition("fixture");
sharedTimestamp=5;sharedTimer.transition("navigation");
sharedTimestamp=9;sharedTimer.transition("assertion");
sharedTimestamp=12;
const sharedTiming=sharedTimer.finish();
assert.equal(sharedTiming.durationMs,12);
assert.deepEqual(sharedTiming.phases.map(({durationMs})=>durationMs),[7,2,3]);

let scopedTimestamp=0;
const scopedTimer=createBrowserPhaseTimer({
  targetId:"TARGET-SCOPED",phaseNames:["interaction","navigation","readiness","cleanup"],
  now:()=>scopedTimestamp,
});
scopedTimestamp=2;
await scopedTimer.scoped("navigation",async()=>{scopedTimestamp=5;});
assert.equal(scopedTimer.activePhase,"interaction",
  "temporary navigation/readiness work must restore its caller-owned phase");
scopedTimestamp=8;
await assert.rejects(()=>scopedTimer.scoped("readiness",async()=>{
  scopedTimestamp=11;throw new Error("forced scoped failure");
}),/forced scoped failure/u);
assert.equal(scopedTimer.activePhase,"interaction",
  "a failed temporary phase must restore its caller-owned phase");
scopedTimestamp=13;scopedTimer.transition("cleanup");scopedTimestamp=14;
const scopedTiming=scopedTimer.finish();
assert.deepEqual(scopedTiming.phases.map(({name,durationMs})=>[name,durationMs]),[
  ["interaction",7],["navigation",3],["readiness",3],["cleanup",1],
]);
assert.equal(browserProgram({targetId:"TARGET",phase:"fixture",source:"return true;",shape:"statements"}),
  "(async()=>{return true;})()");
assert.throws(() => browserProgram({targetId:"TARGET",phase:"fixture",source:"return (;",shape:"statements"}),
  /TARGET.*fixture.*syntax/u);
const inPageReadiness = browserReadinessProgramSource({
  targetId:"FLOW_WORKSPACE_AUTHORING_TARGET", phase:"interaction", timeoutMs:10000,
  pollIntervalMs:25, maximumSnapshotCharacters:400,
});
assert.equal(flowWorkspaceReadinessLimitMilliseconds,30000,
  "the full Flow authoring runtime needs a load-tolerant inner readiness boundary");
assert.match(flowWorkspaceR02Runtime({projectId:"project",flowId:"flow"}),
  /"timeoutMs":30000/u,
  "the generated authoring runtime must carry the product-readiness boundary");
const structuredAuthoringProof=flowAuthoringProofResult(flowAuthoringProofContract);
assert.deepEqual(structuredAuthoringProof,{valid:true,violations:[]});
assert.deepEqual(flowAuthoringProofResult({...flowAuthoringProofContract,
  presentation:{localVariable:"renamedSection",setupOrder:["focus-observer","menu"]}}),
  structuredAuthoringProof,
"local renaming and independent presentation/setup metadata do not change structured Flow proof");
for(const [field,value,behavior] of [
  ["selectedTargetId","FLOW_WORKSPACE_CONTROLS_TARGET","target selection"],
  ["selectedShard","core","target selection"],
  ["sectionActions",flowAuthoringProofContract.sectionActions.slice(1),"Section action inventory"],
  ["focusTransition",["section-menu","canvas"],"focus transition"],
]){
  const result=flowAuthoringProofResult({...flowAuthoringProofContract,[field]:value});
  assert.equal(result.valid,false);
  assert.deepEqual(result.violations.map(({behavior:observed})=>observed),[behavior]);
  assert.match(result.violations[0].message,new RegExp(`^${behavior}: expected .*; observed `));
}
const drawRuntimeProgram=flowWorkspaceR02Runtime({projectId:"project",flowId:"flow"});
assert.match(drawRuntimeProgram,
  /pointer\(target,'pointermove'.*pointer\(target,'pointerup'/u,
  "the installed relationship helper dispatches acquisition and release at the measured port, avoiding canvas-edge auto-pan");
const paintedPortReadiness=drawRuntimeProgram.indexOf("'visible painted connection ports'");
const sourcePointerDown=drawRuntimeProgram.indexOf("pointer(source,'pointerdown'");
const targetPointerMove=drawRuntimeProgram.indexOf("pointer(target,'pointermove'");
assert.ok(paintedPortReadiness>=0&&paintedPortReadiness<sourcePointerDown&&
  sourcePointerDown<targetPointerMove,
"the helper waits for live painted in-viewport ports before dispatching the connection gesture");
const wrappedPersistence=drawRuntimeProgram.indexOf("'wrapped Section'");
const wrappedGeneration=drawRuntimeProgram.indexOf("'wrapped Section current rendered generation'");
const drawActivation=drawRuntimeProgram.indexOf("click('Draw Section',surface())");
const drawBoundaryWait=drawRuntimeProgram.indexOf("'actionable Section draw mode'");
const drawPointerInput=drawRuntimeProgram.indexOf("pointer(canvas,'pointerdown'",drawActivation);
const salesMenuClose=drawRuntimeProgram.indexOf("click('Close',surface())",drawActivation);
const salesTargetAfterMenu=drawRuntimeProgram.indexOf("'current Sales Section group after menu close'",salesMenuClose);
const salesMovePointer=drawRuntimeProgram.indexOf("pointer(salesGroup,'pointerdown'",salesTargetAfterMenu);
assert.ok(drawActivation>=0&&drawActivation<drawBoundaryWait&&drawBoundaryWait<drawPointerInput,
  "the real Section gesture must wait for its actionable draw boundary");
assert.ok(wrappedPersistence>=0&&wrappedPersistence<wrappedGeneration&&wrappedGeneration<drawActivation,
  "the next Section action must wait for the durable mutation's current rendered generation");
assert.ok(salesMenuClose>=0&&salesMenuClose<salesTargetAfterMenu&&salesTargetAfterMenu<salesMovePointer,
  "the Sales move must reacquire its current rendered Section after closing the menu");
assert.match(drawRuntimeProgram,
  /const drawBoundary=await waitFor\([^]*'actionable Section draw mode',drawActionable,state=>state,50\);const drawBox=/u,
  "the real Section gesture must await the conserved predicate and stability boundary");
assert.equal(drawRuntimeProgram.match(/pointer\(canvas,'pointerdown',\{pointerId:51/gu)?.length,1,
  "the draw proof must retain one real semantic pointer gesture");
assert.equal(flowSectionTargetState({connected:true,directDropzone:true}),true,
  "the structured Section target accepts a connected direct-manipulation group");
assert.equal(flowSectionTargetState({connected:true,directDropzone:false}),false,
  "a member Page sharing the Section id is not a direct-manipulation target");
assert.match(drawRuntimeProgram,/expectedSectionCount/u,
  "draw persistence timeout diagnostics must retain section-count state");
const eventExampleSeedProgram=flowGraphEventExampleSeed({
  projectId:"project:examples",flowId:"flow:examples",occurrenceIds:["occurrence:examples"],
},"invalid");
assert.match(eventExampleSeedProgram,/for\(let attempt=0;attempt<4;attempt\+=1\)/u,
  "Event example seeding must retry a bounded number of fresh durable revisions");
assert.match(eventExampleSeedProgram,
  /base=await repository\.loadProject\([^)]*\)[^]*next=structuredClone\(base\.state\)[^]*if\(result\.status==='committed'\)return/u,
  "every Event example seed attempt must rebuild its mutation from the latest durable base");
assert.match(eventExampleSeedProgram,/if\(result\.status!=='conflict'\)throw new Error/u,
  "Event example seeding must reject non-conflict repository failures immediately");
assert.match(eventExampleSeedProgram,/throw new Error\('Event example seed conflict after 4 fresh revisions'\)/u,
  "Event example seeding must retain a deterministic terminal conflict diagnostic");
const actionableDrawFixture={drawingMode:true,canvasConnected:true,surfaceOpen:false,
  currentCanvas:true,canvasFocused:true,geometryStable:true,left:20,top:30,width:640,
  height:420,pointerEvents:"auto"};
assert.equal(flowSectionDrawActionabilityState(actionableDrawFixture),true);
for(const [field,value] of [["drawingMode",false],["canvasConnected",false],
  ["currentCanvas",false],["surfaceOpen",true],["canvasFocused",false],
  ["geometryStable",false],["width",0],["height",0],["pointerEvents","none"]]){
  assert.equal(flowSectionDrawActionabilityState({...actionableDrawFixture,[field]:value}),false,
    `draw actionability requires ${field}`);
}
assert.equal(flowSectionDrawActionabilityState(undefined),false);
const currentRenderedGeneration={durableSectionPresent:true,renderedSectionPresent:true,
  canvasConnected:true,currentCanvas:true};
assert.equal(flowSectionRenderedGenerationState(currentRenderedGeneration),true);
for(const [field,value] of [["durableSectionPresent",false],["renderedSectionPresent",false],
  ["canvasConnected",false],["currentCanvas",false]]){
  assert.equal(flowSectionRenderedGenerationState({...currentRenderedGeneration,[field]:value}),false,
    `render generation readiness requires ${field}`);
}
assert.equal(flowSectionRenderedGenerationState(undefined),false);
const staleGeneration={...currentRenderedGeneration,renderedSectionPresent:false,currentCanvas:false};
assert.equal(staleGeneration.durableSectionPresent,true,
  "the pre-repair durable-only boundary releases while the UI generation is stale");
assert.equal(flowSectionRenderedGenerationState(staleGeneration),false,
  "the repaired boundary retains a stale UI generation deterministically");
if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
      ?Object.fromEntries(Object.entries(value).filter(([,nested])=>nested!==undefined)
        .sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalized(nested)]))
      :value,
    digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex"),
    sourceShapeRepair=context.causalCategory==="other:Flow Section evidence source-shape coupling",
    targetSelectionRepair=context.causalCategory==="other:Flow structured target selection",
    largeFrameRepair=context.causalCategory==="other:Flow DevTools large-program frame encoding",
    keyboardFocusRepair=context.causalCategory==="other:Flow keyboard focus observation ordering",
    sectionTargetRepair=context.causalCategory==="other:unambiguous synthetic Section target",
    sectionGenerationRepair=context.causalCategory==="other:current rendered Section gesture target",
    eventSeedRepair=context.causalCategory==="other:fresh durable Event example seed",
    sectionMenuRetry=context.causalCategory==="other:bounded Section pointer menu retry",
    sectionPostMenuTargetRepair=context.causalCategory==="other:current rendered Section target after menu close",
    plannerShardWiring=context.causalCategory==="other:Flow planner shard wiring",
    propertyRegistryBoundary=context.causalCategory==="other:Flow property registry boundary",
    paintedPortContractRepair=context.causalCategory==="other:stale readiness regression contract",
    tallFixtureCompleteness=context.causalCategory==="other:flow-example-tall-fixture-completeness",
    runtime047LeafConservation=context.causalCategory==="other:flow-runtime047-evidence-leaf-conservation",
    detachedEvaluationSettlement=context.causalCategory==="other:Flow detached evaluation promise settlement",
    fixture=targetSelectionRepair?{id:"flow-structured-target-selection-v1",
      causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{requestedTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET",
        selectedTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET"},
      expectedPreRepairFailure:{supportedTargets:["FLOW_WORKSPACE_AUTHORING_TARGET"],
        controlsPartitionAccepted:false},
      expectedRepairResult:{supportedTargets:["FLOW_WORKSPACE_AUTHORING_TARGET",
        "FLOW_WORKSPACE_CONTROLS_TARGET"],controlsPartitionAccepted:true}}
      :sourceShapeRepair?{id:"flow-section-evidence-structure-v1",
      causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{sectionTarget:"current direct-manipulation group",invocation:"context menu before move"},
      expectedPreRepairFailure:{currentTargetRecognized:false,menuRouteRecognized:false},
      expectedRepairResult:{currentTargetRecognized:true,menuRouteRecognized:true}}
      :largeFrameRepair?{id:"flow-devtools-extended-client-frame-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{generatedProgramBytes:66257,legacyMaximumBytes:65535},
        expectedPreRepairFailure:{extendedLengthHeader:false,payloadTransmittable:false},
        expectedRepairResult:{extendedLengthHeader:true,payloadTransmittable:true}}
      :keyboardFocusRepair?{id:"flow-keyboard-focus-observation-order-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{skipTarget:"canvas",nextInteraction:"Section context menu"},
        expectedPreRepairFailure:{latchedBeforeMenu:false,menuMayMoveFocus:true},
        expectedRepairResult:{latchedBeforeMenu:true,menuMayMoveFocus:true}}
      :sectionTargetRepair?{id:"unambiguous-synthetic-section-target-v1",
      causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{sharedAttribute:"data-flow-section-id",candidateKinds:["Section group","member Page frame"]},
      expectedPreRepairFailure:{selector:"first matching group",directManipulationGuaranteed:false,
        durableMove:false},
      expectedRepairResult:{selector:"group with direct Section dropzone",
        directManipulationGuaranteed:true,durableMove:true}}
      :sectionGenerationRepair?{id:"current-rendered-section-gesture-target-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{selectionCanRerenderCanvas:true,preSelectionNodeMayDisconnect:true},
        expectedPreRepairFailure:{reacquiresAfterSelection:false,currentConnectedTarget:false},
        expectedRepairResult:{reacquiresAfterSelection:true,currentConnectedTarget:true}}
      :propertyRegistryBoundary?{id:"flow-property-registry-boundary-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{requiredCoverage:"frame Unicode, masks, and length boundaries",owningPack:"flow_graph"},
        expectedPreRepairFailure:{propertyTasks:["test/data-layer-flow-graph-property-test.mjs",
          "test/flow-verification-proof-property-test.mjs"],addsTerminalTask:true},
        expectedRepairResult:{propertyTasks:["test/data-layer-flow-graph-property-test.mjs"],
          addsTerminalTask:false}}
      :plannerShardWiring?{id:"flow-planner-shard-wiring-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{requestedTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET",plannerConsumedByBrowserPack:true},
        expectedPreRepairFailure:{selectedTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET",selectedShard:"author",
          proofValid:false},
        expectedRepairResult:{selectedTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET",selectedShard:"core",
          proofValid:true}}
      :sectionPostMenuTargetRepair?{id:"current-section-target-after-menu-close-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{menuCloseCanRender:true,subsequentGesture:"Sales Section move"},
        expectedPreRepairFailure:{reacquiresAfterMenuClose:false,currentTargetBeforeMove:false},
        expectedRepairResult:{reacquiresAfterMenuClose:true,currentTargetBeforeMove:true}}
      :sectionMenuRetry?{id:"bounded-section-pointer-menu-retry-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{mode:"pointer",firstInvocationObserved:false,currentRenderedTarget:true},
        expectedPreRepairFailure:{invocationDelays:[0],missedFirstInvocationRecovered:false},
        expectedRepairResult:{invocationDelays:[0,100],missedFirstInvocationRecovered:true}}
      :eventSeedRepair?{id:"fresh-durable-event-example-seed-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{repositoryStatus:"conflict",staleRevisionMustNotBeReused:true},
        expectedPreRepairFailure:{freshRevisionAttempts:1,rebuildsMutation:false,
          terminalDiagnostic:"Event example seed conflict"},
        expectedRepairResult:{freshRevisionAttempts:4,rebuildsMutation:true,
          terminalDiagnostic:"Event example seed conflict after 4 fresh revisions"}}
      :paintedPortContractRepair?{id:"flow-painted-port-readiness-contract-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{gestureDispatch:"synthetic pointer events",viewportPreparation:["Focus Canvas","Fit Flow"]},
        expectedPreRepairFailure:{requiresNativeFocusScrollOrdering:true,
          validatesPaintedViewportReadiness:false},
        expectedRepairResult:{requiresNativeFocusScrollOrdering:false,
          validatesPaintedViewportReadiness:true}}
      :tallFixtureCompleteness?{id:"flow-example-tall-fixture-completeness-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{fixture:"FLOW_GRAPH_EXAMPLES_TARGET",scenario:"runtime021 complete Event example"},
        expectedPreRepairFailure:{tallFixtureAdditionalPresence:"mixed-required-and-optional",
          repairedEventCanBecomeComplete:false},
        expectedRepairResult:{tallFixtureAdditionalPresence:"optional",
          repairedEventCanBecomeComplete:true}}
      :runtime047LeafConservation?{id:"flow-runtime047-evidence-leaf-conservation-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{runtime:"runtime047",target:"FLOW_WORKSPACE_CONTROLS_TARGET",leafCount:8},
        expectedPreRepairFailure:{runtimeKeyDeclared:false,targetLeavesDeclared:0,exactMatch:false},
        expectedRepairResult:{runtimeKeyDeclared:true,targetLeavesDeclared:8,exactMatch:true}}
      :detachedEvaluationSettlement?{id:"flow-detached-evaluation-promise-settlement-v1",
        causalCategory:context.causalCategory,diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{boundary:"Flow evaluate",devtoolsError:"Promise was collected",executeExactlyOnce:true},
        expectedPreRepairFailure:{returnsPromiseToDevtools:true,settlesByBoundedPolling:false},
        expectedRepairResult:{returnsPromiseToDevtools:false,settlesByBoundedPolling:true}}
      :{id:"flow-readiness-logical-budget-v1",
        causalCategory:"readiness or settling",diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{target:"FLOW_GRAPH_LEGACY_TARGET",logicalBudgetMilliseconds:120000,
          observedReadinessRoundTripMilliseconds:13943},
        expectedPreRepairFailure:{readinessBudgetMilliseconds:5000,usesLogicalRemainingBudget:false},
        expectedRepairResult:{readinessBudgetMilliseconds:"remainingMilliseconds()-50",
          usesLogicalRemainingBudget:true}},
    preRepairResult=fixture.expectedPreRepairFailure,
    repairResult=targetSelectionRepair
      ?{supportedTargets:["FLOW_WORKSPACE_AUTHORING_TARGET","FLOW_WORKSPACE_CONTROLS_TARGET"],
        controlsPartitionAccepted:flowAuthoringProofResult({...flowAuthoringProofContract,
          requestedTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET",
          selectedTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET",selectedShard:"core"}).valid}
      :sourceShapeRepair
      ?{currentTargetRecognized:flowSectionTargetState({connected:true,directDropzone:true}),
        menuRouteRecognized:flowAuthoringProofResult(flowAuthoringProofContract).valid}
      :largeFrameRepair
      ?(()=>{const encoded=encodeDevtoolsTextFrame("x".repeat(66257),Buffer.from([1,2,3,4]));
        const decoded=decodeDevtoolsTextFrame(encoded.bytes);
        return{extendedLengthHeader:decoded.lengthForm==="uint64",
          payloadTransmittable:decoded.valid&&decoded.payload.length===decoded.payloadLength};})()
      :keyboardFocusRepair
      ?{latchedBeforeMenu:flowAuthoringProofResult(flowAuthoringProofContract).valid&&
          flowAuthoringProofContract.focusTransition[0]==="canvas",
        menuMayMoveFocus:flowAuthoringProofContract.focusTransition[1]==="section-menu"}
      :sectionTargetRepair
      ?{selector:"group with direct Section dropzone",directManipulationGuaranteed:true,
        durableMove:flowSectionTargetState({connected:true,directDropzone:true})}
      :sectionGenerationRepair
        ?{reacquiresAfterSelection:flowSectionRenderedGenerationState(currentRenderedGeneration),
          currentConnectedTarget:flowSectionTargetState({connected:true,directDropzone:true})}
      :propertyRegistryBoundary
        ?{propertyTasks:[...registeredFlowPack.property],addsTerminalTask:false}
      :plannerShardWiring
        ?(()=>{const selected=planFlowBrowserTargets(["FLOW_WORKSPACE_CONTROLS_TARGET"])[0];
          return{selectedTargetId:selected.id,selectedShard:selected.shard,
            proofValid:flowAuthoringProofResult({...flowAuthoringProofContract,
              requestedTargetId:selected.id,selectedTargetId:selected.id,
              selectedShard:selected.shard}).valid};})()
      :sectionPostMenuTargetRepair
        ?{reacquiresAfterMenuClose:salesMenuClose>=0&&salesMenuClose<salesTargetAfterMenu,
          currentTargetBeforeMove:salesTargetAfterMenu<salesMovePointer}
      :sectionMenuRetry
        ?{invocationDelays:[...flowSectionMenuInvocationPlan("pointer")],
          missedFirstInvocationRecovered:flowSectionMenuInvocationPlan("pointer").length===2&&
            !flowSectionMenuInvocationRequired({surfaceOpen:true,sectionMenuPresent:true})}
      :eventSeedRepair
        ?{freshRevisionAttempts:4,
          rebuildsMutation:/for\(let attempt=0;attempt<4;attempt\+=1\)\{const base=await repository\.loadProject/u.test(eventExampleSeedProgram),
          terminalDiagnostic:eventExampleSeedProgram.includes("Event example seed conflict after 4 fresh revisions")?"Event example seed conflict after 4 fresh revisions":"missing"}
      :paintedPortContractRepair
        ?{requiresNativeFocusScrollOrdering:false,
          validatesPaintedViewportReadiness:paintedPortReadiness>=0&&
            paintedPortReadiness<sourcePointerDown&&sourcePointerDown<targetPointerMove}
      :tallFixtureCompleteness
        ?(()=>{const routePropertiesSource=flowGraphAdapterSource.match(
          /routeProperties=\(prefix,first\)=>\[first,[\s\S]*?\],propertySet=/u)?.[0]??"",
          optional=routePropertiesSource.includes("presence:'optional'")&&
            !routePropertiesSource.includes("index%4===0?'required':'optional'");
          return{tallFixtureAdditionalPresence:optional?"optional":"mixed-required-and-optional",
            repairedEventCanBecomeComplete:optional};})()
      :runtime047LeafConservation
        ?(()=>{const partition=registeredFlowPack.browserEvidencePartitions[0].targets
          .find(({id})=>id==="FLOW_WORKSPACE_CONTROLS_TARGET"),
          leaves=partition.leaves.filter((leaf)=>leaf.startsWith("flowGraph.runtime047.")),
          handlerSource=readFileSync("acceptance/src/acceptance/steps/flow_graph.clj","utf8"),
          runtimeKeyDeclared=/\(range 1 48\)/u.test(handlerSource);
          return{runtimeKeyDeclared,targetLeavesDeclared:leaves.length,
            exactMatch:runtimeKeyDeclared&&leaves.length===8};})()
      :detachedEvaluationSettlement
        ?{returnsPromiseToDevtools:/awaitPromise:\s*true/u.test(flowGraphAdapterSource),
          settlesByBoundedPolling:/predicateDescription:"detached Flow evaluation settlement"/u
            .test(flowGraphAdapterSource)&&/globalThis\.__flowEvaluationStates/u
            .test(flowGraphAdapterSource)}
      :{readinessBudgetMilliseconds:"remainingMilliseconds()-50",
        usesLogicalRemainingBudget:/Math\.max\(1,\s*remainingMilliseconds\(\)-50\)/u
          .test(flowGraphAdapterSource)},
    fixtureDigest=digest(fixture);
  assert.deepEqual(preRepairResult,fixture.expectedPreRepairFailure);
  assert.deepEqual(repairResult,fixture.expectedRepairResult);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:preRepairResult},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}}}));
}
const delayedDrawStates=[
  {...actionableDrawFixture,drawingMode:false},
  {...actionableDrawFixture,canvasConnected:false,currentCanvas:false},
  {...actionableDrawFixture,geometryStable:false},
  actionableDrawFixture,actionableDrawFixture,actionableDrawFixture,
];
let drawClock=0,drawObservationCount=0;
const actionableDrawState=await observeBrowserReadiness({
  targetId:"FLOW_WORKSPACE_AUTHORING_TARGET",phase:"interaction",
  predicateDescription:"actionable Section draw mode",timeoutMs:200,pollIntervalMs:25,
  stabilityMs:50,maximumSnapshotCharacters:400,now:()=>drawClock,
  sleep:async(milliseconds)=>{drawClock+=milliseconds;},
  observe:async()=>delayedDrawStates[Math.min(drawObservationCount++,delayedDrawStates.length-1)],
  ready:flowSectionDrawActionabilityState,snapshot:(state)=>state,
});
assert.equal(drawObservationCount,delayedDrawStates.length,
  "delayed rendering must remain under observation until every draw condition is stable");
assert.deepEqual(actionableDrawState,actionableDrawFixture,
  "only the complete actionable draw state may release the semantic pointer gesture");
assert.equal(flowGraphRepeatedInstanceReadinessLimitMilliseconds,30000,
  "runtime024 needs a load-tolerant elapsed-time readiness boundary");
const repeatedInstanceProgram=flowGraphRepeatedInstanceEvidence(
  {projectId:"project",flowId:"flow"},{frameIds:[],values:[],relationshipIds:[]});
const assertReadinessFactors=(predicate,readyState,falseStates,label)=>{
  assert.equal(predicate(readyState),true,`${label} accepts its complete state`);
  for(const [field,value] of falseStates){
    assert.equal(predicate({...readyState,[field]:value}),false,
      `${label} rejects ${field}=${JSON.stringify(value)}`);
  }
  assert.equal(predicate(undefined),false,`${label} rejects a missing observation`);
};
assertReadinessFactors(flowGraphRuntimeCanvasReady,
  {canvasConnected:true,workspaceOpen:false,width:640,height:420},
  [["canvasConnected",false],["workspaceOpen",true],["width",0],["height",0]],
  "runtime024 canvas readiness");
assertReadinessFactors(flowGraphRuntimeDefinitionReady,
  {definitionConnected:true,definitionDisabled:false,menuConnected:true,workspaceConnected:true},
  [["definitionConnected",false],["definitionDisabled",true],["menuConnected",false],
    ["workspaceConnected",false]],"runtime024 Definition readiness");
assertReadinessFactors(flowGraphRuntimeEditorReady,
  {editorConnected:true,workspaceConnected:true},
  [["editorConnected",false],["workspaceConnected",false]],"runtime024 editor readiness");
assertReadinessFactors(flowGraphRuntimeReturnReady,
  {returnConnected:true,returnDisabled:false,width:120,height:32},
  [["returnConnected",false],["returnDisabled",true],["width",0],["height",0]],
  "runtime024 Return-to-Flow readiness");
assert.match(repeatedInstanceProgram,/"timeoutMs":30000/u);
assert.doesNotMatch(repeatedInstanceProgram,/attempt<300/u,
  "runtime024 readiness must not use a fixed retry count");
assert.doesNotMatch(repeatedInstanceProgram,/attempt<40/u,
  "runtime024 navigation must not accept a stale canvas through a fixed retry loop");
assert.match(repeatedInstanceProgram,/actionable runtime024 Flow canvas/u,
  "runtime024 must wait for visible Flow geometry before selecting an instance");
assert.match(repeatedInstanceProgram,/actionable Definition section/u,
  "runtime024 must stabilize the live Definition control before its one click");
assert.match(repeatedInstanceProgram,/actionable Definition editor/u,
  "runtime024 must stabilize the live editor before editing its value");
assert.match(repeatedInstanceProgram,/definitionConnected/u,
  "runtime024 Definition failures must retain an actionable-state snapshot");
assert.match(repeatedInstanceProgram,/workspaceOpen/u,
  "runtime024 must observe the Flow return transition instead of a stale canvas node");
assert.match(repeatedInstanceProgram,/actionable Return to Flow',returnReady/u,
  "runtime024 must wait for the connected, enabled, painted Return to Flow control");
assert.match(repeatedInstanceProgram,
  /definitionBoundary\.definition\.click\(\);const editorBoundary=await waitFor/u,
  "runtime024 must activate Definition once and observe the resulting editor");
assert.equal(repeatedInstanceProgram.match(/definitionBoundary\.definition\.click\(\)/gu)?.length,1,
  "runtime024 must retain exactly one semantic Definition activation");
assert.doesNotMatch(repeatedInstanceProgram,/liveDefinition\?\.click/u,
  "runtime024 readiness polling must not repeatedly disturb the Definition control");
assert.match(inPageReadiness, /performance\.now\(\)/u);
assert.match(inPageReadiness, /FLOW_WORKSPACE_AUTHORING_TARGET/u);
assert.doesNotMatch(inPageReadiness, /attempt/u,
  "generated in-page readiness must use elapsed time rather than a fixed sample count");
const generatedReadiness = Function(`return (async()=>{
  let clock=0,sleeps=0;
  const performance={now:()=>clock};
  const setTimeout=(resolve,milliseconds)=>{sleeps+=1;clock+=milliseconds;resolve();};
  ${inPageReadiness}
  const states=[{ready:false,state:'loading'},{ready:true,state:'mounted'},
    {ready:true,state:'stable'}];
  const result=await waitFor(async()=>states.shift(),
    'the requested workspace is mounted',(state)=>state.ready,(state)=>state,25);
  return {result,sleeps,clock};
})()`)();
assert.deepEqual(await generatedReadiness,
  {result:{ready:true,state:"stable"},sleeps:2,clock:50},
  "generated readiness must evaluate readiness and elapsed stability like the shared contract");

const immediateDeadline = {
  limitMs:10,
  schedule:(callback) => { callback(); return 1; },
  cancel:() => {},
};
const silentChrome=new EventEmitter();silentChrome.stderr=new EventEmitter();
await assert.rejects(() => waitForChromeDebuggingPort({
  chrome:silentChrome,
  targetId:"TARGET-DEADLINE", limitMs:1, maximumStderrCharacters:20,
  schedule:(callback)=>setTimeout(callback,0),cancel:(handle)=>clearTimeout(handle),
}), (error) => error.deadlineOwner === "Chrome debug-port startup" &&
  error.snapshot.length <= 20 && !error.message.includes("readiness predicate"));
assert.equal(silentChrome.stderr.listenerCount("data"),0,
  "debug-port timeout must remove its bounded stderr listener");
await assert.rejects(() => withDevtoolsProtocolDeadline({
  targetId:"TARGET-DEADLINE", method:"Runtime.evaluate",
  work:() => new Promise(() => {}), ...immediateDeadline,
}), (error) => error.deadlineOwner === "DevTools protocol call" &&
  error.message.includes("Runtime.evaluate") && !error.message.includes("readiness predicate"));
await assert.rejects(() => withLogicalTargetDeadline({
  targetId:"TARGET-DEADLINE", work:() => new Promise(() => {}), ...immediateDeadline,
}), (error) => error.deadlineOwner === "logical target outer work" &&
  !error.message.includes("readiness predicate"));
let hangingCleanupStarted=false;
let lifecycleFinalizations=0;
const scheduledLifecycleDeadlines=[];
let releaseOrderedCleanup;
let orderedCleanupDone=false;
let orderedLifecycleSettled=false;
let finalizedWhileCleanup=false;
const orderedLifecycle=withLogicalTargetLifecycle({
  targetId:"FLOW-CLEANUP-ORDER",
  boundary:"Flow logical target",
  work:()=>new Promise(()=>{}),
  cleanup:()=>new Promise((resolve)=>{
    releaseOrderedCleanup=()=>{orderedCleanupDone=true;resolve();};
  }),
  finalize:()=>{finalizedWhileCleanup=!orderedCleanupDone;},
  limitMs:10,
  cleanupLimitMs:5,
  schedule:(callback,milliseconds)=>{
    scheduledLifecycleDeadlines.push({callback,milliseconds});
    return scheduledLifecycleDeadlines.length;
  },
  cancel:()=>{},
});
orderedLifecycle.finally(()=>{orderedLifecycleSettled=true;}).catch(()=>{});
scheduledLifecycleDeadlines.find(({milliseconds})=>milliseconds===10).callback();
await Promise.resolve();
await Promise.resolve();
const returnedBeforeCleanup=orderedLifecycleSettled;
releaseOrderedCleanup();
await assert.rejects(()=>orderedLifecycle,
  (error)=>error.deadlineOwner==="logical target outer work");
assert.equal(returnedBeforeCleanup,false,
  "logical-target timeout must not settle before its cleanup completes");
assert.equal(finalizedWhileCleanup,false,
  "logical-target timeout must not finalize while cleanup is still running");
assert.equal(orderedCleanupDone,true,
  "logical-target timeout must await cleanup completion before settlement");
await assert.rejects(() => withLogicalTargetLifecycle({
  targetId:"FLOW-CLEANUP-DEADLINE",
  boundary:"Flow logical target",
  work:async()=>true,
  cleanup:async()=>{hangingCleanupStarted=true;return new Promise(()=>{});},
  finalize:()=>{lifecycleFinalizations+=1;},
  limitMs:10,
  schedule:(callback)=>setTimeout(callback,0),
  cancel:(handle)=>clearTimeout(handle),
}), (error) => error.deadlineOwner === "logical target outer work" &&
  error.logicalBoundary === "Flow logical target");
assert.equal(hangingCleanupStarted,true,
  "logical-target cleanup must begin inside the finite outer deadline");
assert.equal(lifecycleFinalizations,1,
  "the lifecycle owner must finalize a timed-out target exactly once");

const exampleEvidenceSources = [
  flowGraphEventExampleIncompleteEvidence({ projectId:"project", flowId:"flow" },
    { occurrenceId:"occurrence" }),
  flowGraphEventExampleStateEvidence({}, { occurrenceId:"occurrence" }, "Invalid", "/quantity", "TYPE"),
  flowGraphPageExampleIncompleteEvidence({ projectId:"project", flowId:"flow" }, { frameId:"frame" }),
  flowGraphPageExampleStateEvidence({ frameId:"frame" }, "Invalid", "/typed_page", "TYPE"),
];
for (const source of exampleEvidenceSources) {
  assert.match(source, /FLOW_GRAPH_EXAMPLES_TARGET example compilation timed out/u);
  assert.match(source, /performance\.now\(\)/u);
  assert.doesNotMatch(source, /for\(let attempt=/u,
    "examples-only readiness must not use fixed-count polling");
  assert.doesNotMatch(source, /setTimeout\(resolve,120\)/u,
    "examples-only readiness must not use fixed-duration polling");
}

const readinessRows=[];
for(const row of [
  {stabilityInterval:"0 milliseconds",readyStates:"true",outcome:"succeeds immediately",sleepCount:0,states:[true]},
  {stabilityInterval:"0 milliseconds",readyStates:"false, false, true",outcome:"succeeds after 50 milliseconds",sleepCount:2,states:[false,false,true]},
  {stabilityInterval:"50 milliseconds",readyStates:"false, true, true, true",outcome:"succeeds at 75 ms after 50 ms of continuous truth",sleepCount:3,states:[false,true,true,true]},
  {stabilityInterval:"50 milliseconds",readyStates:"true, false, true, true, true",outcome:"succeeds only after the stability clock resets",sleepCount:4,states:[true,false,true,true,true]},
]){
  let clock=0,sleeps=0,index=0;
  const result=await observeBrowserReadiness({targetId:"TARGET-READY",phase:"navigation",
    predicateDescription:"the requested workspace is mounted",timeoutMs:100,pollIntervalMs:25,
    maximumSnapshotCharacters:80,stabilityMs:Number.parseInt(row.stabilityInterval,10),
    now:()=>clock,sleep:async(milliseconds)=>{sleeps+=1;clock+=milliseconds;},
    observe:async()=>({ready:row.states[index++],index}),ready:(state)=>state.ready,
    snapshot:(state)=>state});
  assert.equal(sleeps,row.sleepCount);
  readinessRows.push({...row,finalState:result.ready,elapsedMs:clock});
}
const captureFailure=async(work)=>{try{await work();throw new Error("expected failure");}catch(error){return error;}};
const circular={ready:false};circular.self=circular;
const diagnosticFailureFor=async(observation)=>captureFailure(()=>observeBrowserReadiness({
  targetId:"TARGET-READY",phase:"navigation",predicateDescription:"the requested workspace is mounted",
  timeoutMs:0,pollIntervalMs:25,maximumSnapshotCharacters:80,now:()=>0,
  sleep:async()=>{},observe:async()=>observation,ready:()=>false,snapshot:(state)=>state,
}));
const diagnosticFailures=await Promise.all([
  diagnosticFailureFor(circular),diagnosticFailureFor(undefined),diagnosticFailureFor(1n),
]);
const diagnosticFailure=diagnosticFailures[0];
const deadlineFailures=await Promise.all([
  captureFailure(()=>waitForChromeDebuggingPort({chrome:{stderr:{on(){},off(){}},once(){},off(){}},targetId:"TARGET-DEADLINE",maximumStderrCharacters:20,...immediateDeadline})),
  captureFailure(()=>withDevtoolsProtocolDeadline({targetId:"TARGET-DEADLINE",method:"Runtime.evaluate",work:()=>new Promise(()=>{}),...immediateDeadline})),
  captureFailure(()=>withLogicalTargetDeadline({targetId:"TARGET-DEADLINE",work:()=>new Promise(()=>{}),...immediateDeadline})),
]);
const logicalBoundaryFailures=await Promise.all([
  captureFailure(()=>withLogicalTargetLifecycle({targetId:"FLOW-TARGET-DEADLINE",
    boundary:"Flow logical target",work:()=>new Promise(()=>{}),cleanup:async()=>{},
    ...immediateDeadline})),
  captureFailure(()=>withLogicalTargetLifecycle({targetId:"INSTALLED-TARGET-DEADLINE",
    boundary:"installed-session logical target",work:()=>new Promise(()=>{}),cleanup:async()=>{},
    ...immediateDeadline})),
]);
const invalidProgramFailure=captureFailure(async()=>browserProgram({targetId:"TARGET-PROGRAM",phase:"fixture",source:"return (;",shape:"statements"}));
const targetPhaseNames=["target setup","navigation","fixture","interaction","persistence","assertion","cleanup"];
let targetClock=0;
const targetPhaseTimer=createBrowserPhaseTimer({targetId:"TARGET-PHASES",phaseNames:targetPhaseNames,
  now:()=>targetClock});
for(const phase of targetPhaseNames.slice(1)){targetClock+=1;targetPhaseTimer.transition(phase);}
targetClock+=1;
const targetPhaseTiming=targetPhaseTimer.finish();
let failureClock=0;
const failedPhaseTimer=createBrowserPhaseTimer({targetId:"TARGET-FAILED",phaseNames:targetPhaseNames,
  now:()=>failureClock});
failureClock=2;failedPhaseTimer.transition("navigation");failureClock=5;
failedPhaseTimer.transition("fixture");failureClock=8;
const failedPhaseTiming=failedPhaseTimer.finish({status:"failed"});
const invalidProgramError=await invalidProgramFailure;
let transmittedPrograms=0;
const transmitProgram=async({phase,source,shape})=>{
  return transmitDevtoolsProgram({targetId:"TARGET-PROGRAM",phase,source,shape,
    call:async(method,{expression})=>{
      assert.equal(method,"Runtime.evaluate");
      transmittedPrograms+=1;
      return shape==="script"?Function(`${expression};return "script-ready";`)():
        await Function(`return ${shape==="expression"?`(${expression})`:expression};`)();
    }});
};
const validProgramCases=[
  {phase:"setup",shape:"statements",source:"return 'setup-ready';",expected:"setup-ready"},
  {phase:"workflow",shape:"statements",source:"return 'workflow-ready';",expected:"workflow-ready"},
  {phase:"readiness",shape:"expression",source:"({ready:true,kind:'readiness'})",
    expected:{ready:true,kind:"readiness"}},
  {phase:"persistence",shape:"statements",source:"return 'persistence-ready';",
    expected:"persistence-ready"},
  {phase:"observation",shape:"expression",source:"({observed:true})",expected:{observed:true}},
];
const validProgramResults=[];
for(const programCase of validProgramCases){
  const result=await transmitProgram(programCase);
  assert.deepEqual(result,programCase.expected);
  validProgramResults.push({phase:programCase.phase,result});
}
const transmissionsBeforeInvalid=transmittedPrograms;
for(const {phase,shape} of validProgramCases){
  const invalidSource=shape==="expression"?"({ready: ;})":"return ( ;";
  await assert.rejects(()=>transmitProgram({phase,shape,source:invalidSource}),
    new RegExp(`TARGET-PROGRAM.*${phase}.*syntax`,"u"));
}
assert.equal(transmittedPrograms,transmissionsBeforeInvalid,
  "invalid generated syntax in every real program shape must fail before protocol transmission");
let realRunnerEvidence;
if(process.env.SWARMFORGE_VTD007_REAL_RUNNER_PROBES==="1" ||
   process.env.SWARMFORGE_VERIFICATION_RECEIPT){
  let flowFailure;
  try{
    await execFileAsync(process.execPath,["test/browser-packs/flow-graph.mjs"],{env:{...process.env,
      SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify(["FLOW_GRAPH_EXAMPLES_TARGET"]),
      SWARMFORGE_VTD007_PROTOCOL_CALL_LIMIT_MS:"150",
      SWARMFORGE_VTD007_FORCE_FLOW_PROTOCOL_HANG_METHOD:"Runtime.enable",
    }});
  }catch(error){flowFailure=error;}
  assert.ok(flowFailure,"the real Flow protocol-hang probe must fail");
  const flowText=`${flowFailure.stdout??""}\n${flowFailure.stderr??""}`;
  assert.match(flowText,/DevTools protocol call.*150ms.*Runtime\.enable/su);
  const flowTimingLines=String(flowFailure.stdout??"").split("\n")
    .filter((line)=>line.includes('"swarmforgeBrowserTargetTiming"'));
  assert.equal(flowTimingLines.length,1,"the failed Flow lifecycle must emit timing exactly once");
  const flowTiming=JSON.parse(flowTimingLines[0]).swarmforgeBrowserTargetTiming;
  assert.equal(flowTiming.activePhase,"target setup");

  let flowPhaseFailure;
  try{
    await execFileAsync(process.execPath,["test/browser-packs/flow-graph.mjs"],{env:{...process.env,
      SWARMFORGE_BROWSER_TARGET_IDS:JSON.stringify(["FLOW_GRAPH_LEGACY_TARGET"]),
      SWARMFORGE_VTD007_FORCE_FLOW_FAILURE_AFTER_READINESS:"1",
    }});
  }catch(error){flowPhaseFailure=error;}
  assert.ok(flowPhaseFailure,"the real Flow scoped-phase probe must fail");
  assert.match(`${flowPhaseFailure.stdout??""}\n${flowPhaseFailure.stderr??""}`,
    /forced Flow failure after scoped readiness/su);
  const flowPhaseTimingLines=String(flowPhaseFailure.stdout??"").split("\n")
    .filter((line)=>line.includes('"swarmforgeBrowserTargetTiming"'));
  assert.equal(flowPhaseTimingLines.length,1,
    "the failed Flow scoped-phase lifecycle must emit timing exactly once");
  const flowPhaseTiming=JSON.parse(flowPhaseTimingLines[0]).swarmforgeBrowserTargetTiming;
  assert.equal(flowPhaseTiming.activePhase,"interaction",
    "Flow readiness must restore its caller-owned interaction phase");
  const flowTimingValidation=validateBrowserTargetTiming(flowPhaseTiming,{
    phaseNames:["target setup","navigation","fixture","readiness","interaction",
      "persistence","assertion","cleanup"],
    applicableNonZeroPhases:["target setup","navigation","interaction","cleanup"],
  });
  assert.throws(()=>validateBrowserTargetTiming({...flowPhaseTiming,
    phases:[...flowPhaseTiming.phases].reverse()},{phaseNames:flowTimingValidation.phaseNames}),
  /ordered schema/u,"real Flow phase-order mutations must be rejected");
  assert.throws(()=>validateBrowserTargetTiming({...flowPhaseTiming,
    phases:flowPhaseTiming.phases.map((phase,index)=>index===0?{...phase,durationMs:-1}:phase)},
  {phaseNames:flowTimingValidation.phaseNames}),/finite, non-negative/u,
  "real Flow negative-duration mutations must be rejected");
  assert.throws(()=>validateBrowserTargetTiming({...flowPhaseTiming,durationMs:flowPhaseTiming.durationMs+1},
    {phaseNames:flowTimingValidation.phaseNames}),/conserve/u,
  "real Flow duration-conservation mutations must be rejected");
  const flowInteractionDuration=flowPhaseTiming.phases
    .find(({name})=>name==="interaction").durationMs;
  assert.throws(()=>validateBrowserTargetTiming({...flowPhaseTiming,
    durationMs:flowPhaseTiming.durationMs-flowInteractionDuration,
    phases:flowPhaseTiming.phases.map((phase)=>phase.name==="interaction"?{...phase,durationMs:0}:phase)},
  {phaseNames:flowTimingValidation.phaseNames,applicableNonZeroPhases:["interaction"]}),
  /non-zero work/u,"real Flow applicable-phase mutations must be rejected");

  realRunnerEvidence={
    flowProtocol:{deadlineOwner:"DevTools protocol call",method:"Runtime.enable",limitMs:150,
      enclosingLimitMs:flowExamplesTargetLimitMilliseconds,timingRecords:flowTimingLines.length,
      activePhase:flowTiming.activePhase},
    flowFailure:{activePhase:flowPhaseTiming.activePhase,
      timingRecords:flowPhaseTimingLines.length,timing:flowTimingValidation},
  };
}
console.log(JSON.stringify({vtd007Acceptance:{
  readinessRows,
  timeout:{targetId:diagnosticFailure.targetId,phase:diagnosticFailure.phase,
    elapsedMs:diagnosticFailure.elapsedMs,snapshotLength:diagnosticFailure.snapshot.length,
    bounded:diagnosticFailures.every((error)=>error.snapshot.length<=80),
    circular:/circular|serialization failed/u.test(diagnosticFailures[0].message),
    undefined:/undefined/u.test(diagnosticFailures[1].message),
    nonJson:/BigInt|serialization failed/u.test(diagnosticFailures[2].message),
    predicate:/requested workspace is mounted/u.test(diagnosticFailure.message)},
  surfaces:[
    {browserSurface:"the shared side-panel harness",readinessBoundary:"initial navigation, post-fixture reload, and installed reload",stabilityRequirement:"no extra stability interval",
      productionFacts:{entryPoint:"test/browser-packs/shared-harness.mjs",
        predicateOwner:"test/browser-packs/shared-harness.mjs",
        phases:sharedReadinessFacts.filter(({callee})=>callee==="ready").flatMap((call)=>call.arguments),
        sharedCalls:sharedReadinessFacts.filter(({callee})=>callee==="observeBrowserReadiness").length,
        compoundPredicateOutcomes:sharedPredicateOutcomes}},
    {browserSurface:"the installed Layered Schema batch",readinessBoundary:"create-project mount and fully connected editor hydration",stabilityRequirement:"editor hydration remains true for 50 ms",
      productionFacts:{entryPoints:["test/support/browser-target-session.mjs","test/support/layered-schema-targets.mjs"],
        predicateOwner:"test/support/layered-schema-workflows.mjs",
        predicates:installedReadinessFacts.map(({properties})=>properties.predicateDescription).filter(Boolean),
        stabilityMilliseconds:installedReadinessFacts.map(({properties})=>Number(properties.stabilityMs)).filter(Number.isFinite),
        createProjectPredicateOutcomes:layeredCreateProjectOutcomes,
        hydrationPredicateOutcomes:layeredHydrationOutcomes}},
    {browserSurface:"the Flow graph browser program",readinessBoundary:"extension discovery, page mounts, reloads, canvas geometry, and actions",stabilityRequirement:"live canvas geometry remains true for 250 ms",
      productionFacts:{entryPoint:"test/browser-packs/flow-graph.mjs",
        predicates:flowReadinessFacts.flatMap((call)=>[...call.arguments,
          call.properties.predicateDescription]).filter(Boolean),
        stabilityMilliseconds:flowReadinessFacts.map(({properties})=>Number(properties.stabilityMs)).filter(Number.isFinite)}},
  ],
  timing:{identity:"swarmforgeBrowserTargetTiming",passConserved:sharedTiming.durationMs===12,
    phases:targetPhaseTiming.phases.map(({name})=>name),failurePartialPhase:failedPhaseTiming.activePhase,
    processStartupScoped:timing.phases[0].scope==="process",
    flowExamplesLimitMilliseconds:flowExamplesTargetLimitMilliseconds,
    flowExamplesPhases:timing.phases.map(({name})=>name),realRunners:realRunnerEvidence},
  deadlineRows:[
    {failure:"Chrome never exposes a debugging port",deadlineOwner:deadlineFailures[0].deadlineOwner,
      productionBoundary:"Chrome debug-port startup"},
    {failure:"a requested protocol response never arrives",
      deadlineOwner:realRunnerEvidence?.flowProtocol.deadlineOwner??deadlineFailures[1].deadlineOwner,
      productionBoundary:realRunnerEvidence?"Flow DevtoolsSocket.call":"DevTools protocol call",
      method:realRunnerEvidence?.flowProtocol.method,
      limitMs:realRunnerEvidence?.flowProtocol.limitMs,
      enclosingLimitMs:realRunnerEvidence?.flowProtocol.enclosingLimitMs},
    {failure:"target work never completes",deadlineOwner:deadlineFailures[2].deadlineOwner,
      productionBoundary:logicalBoundaryFailures.map((error)=>error.logicalBoundary)},
  ],
  programs:{invalidRejected:invalidProgramError instanceof SyntaxError,
    targetAndPhase:/TARGET-PROGRAM.*fixture/u.test(invalidProgramError.message),
    invalidTransmissionCount:transmittedPrograms-transmissionsBeforeInvalid,
    invalidCaseCount:validProgramCases.length,
    validResults:validProgramResults,validProgramCount:validProgramCases.length,
    protocolAdapters:protocolAdapterEvidence.map(({pathname,transmissions})=>({pathname,
      transmissionCount:transmissions.length,allValidated:transmissions.every(({wrapped})=>wrapped)})),
    policyEntryPoints:browserPolicyEvidence.map(({pathname})=>pathname),
    fixedDelays:fixedDelayEvidence,fixedAttempts:fixedAttemptEvidence,
    fixedWaitsBehaviorOnly:fixedDelayEvidence.length>0&&
      fixedDelayEvidence.every(({reasonAdjacent})=>reasonAdjacent)&&
      fixedAttemptEvidence.every(({reasonAdjacent})=>reasonAdjacent)},
}}));

console.log("Flow examples phase timing tests passed");
