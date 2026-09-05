import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { utilityRegistry, composeUtilityShell, extensionShell } from "../dist/utility-registry.js";
import { bindUtilityPanels, mountUtility, mountUtilityShell, renderUtilityDirectory } from "../dist/platform/utility-shell-dom.js";
import { createUtilityStorage } from "../dist/platform/utility-storage.js";
import { dataLayerUtility } from "../dist/utilities/data-layer/index.js";
import { commandPaletteUtility, commandsForUtilityShell, listCommands } from "../dist/utilities/command-palette/index.js";
import { focusedAcceptanceOptions } from "../scripts/run-focused-acceptance.mjs";
import { executeAcceptancePlan, loadVerificationPacks, planVerification, validateVerificationPacks, verificationInventory } from "../scripts/verification-packs.mjs";
import { architectureViolations } from "../scripts/check-architecture.mjs";
import { retainControlledElement, retainUtilityElement, utilityDomScopeFromSearch } from "../dist/platform/utility-dom-isolation.js";
import { scopedUtilityModulePath } from "../dist/platform/utility-bootstrap.js";
import { shellRuntimeCapabilities } from "../dist/platform/shell-runtime-capabilities.js";

assert.deepEqual(utilityRegistry.map(({id})=>id),["command-palette","hotkeys","data-layer"]);
for(const utility of utilityRegistry){
  assert.equal(typeof utility.identity.name,"string");assert.equal(Array.isArray(utility.commands),true);assert.equal(Array.isArray(utility.panels),true);
  assert.equal(typeof utility.lifecycle.activate,"function");assert.equal(typeof utility.lifecycle.mount,"function");assert.match(utility.storage.namespace,/^my-chrome-utilities\./);
}
assert.equal(new Set(utilityRegistry.map(({storage})=>storage.namespace)).size,utilityRegistry.length);
assert.deepEqual(new Set(extensionShell.commands),new Set(listCommands().map(({id})=>id)),"Every product command is owned by a registered utility");
assert.deepEqual(commandsForUtilityShell(listCommands(),extensionShell.commands).map(({id})=>id),listCommands().map(({id})=>id));
assert.deepEqual(commandsForUtilityShell(listCommands(),["demo.say-hello"]).map(({id})=>id),["demo.say-hello"]);
assert.throws(()=>commandsForUtilityShell(listCommands(),["missing.command"]),/commands are unavailable/);
assert.deepEqual(composeUtilityShell(utilityRegistry).utilityIds,["command-palette","hotkeys","data-layer"]);
const lifecycle=[];
const lifecycleShell=composeUtilityShell([
  {...utilityRegistry[0],id:"first",storage:{namespace:"test.first",version:1},lifecycle:{activate(){lifecycle.push("activate:first");},deactivate(){lifecycle.push("deactivate:first");}}},
  {...utilityRegistry[1],id:"second",storage:{namespace:"test.second",version:1},lifecycle:{activate(){lifecycle.push("activate:second");},deactivate(){lifecycle.push("deactivate:second");}}},
]);
assert.deepEqual(lifecycleShell.activate(),["first","second"]);
assert.deepEqual(lifecycleShell.activate(),["first","second"],"activation is idempotent");
lifecycleShell.deactivate();lifecycleShell.deactivate();
assert.deepEqual(lifecycle,["activate:first","activate:second","deactivate:second","deactivate:first"]);
const root={dataset:{}};let pagehide;
const mountedShell=composeUtilityShell(utilityRegistry);
mountUtilityShell(mountedShell,root,{addEventListener(type,listener){if(type==="pagehide")pagehide=listener;}});
assert.equal(root.dataset.registeredUtilities,"command-palette,hotkeys,data-layer");
assert.equal(root.dataset.activeUtilities,"command-palette,hotkeys,data-layer");
pagehide();assert.equal(root.dataset.activeUtilities,"");
const created=[];
const elementFactory={createElement(tag){const node={tag,dataset:{},children:[],append(...children){this.children.push(...children);}};created.push(node);return node;}};
const directory={children:[],replaceChildren(...children){this.children=children;}};
renderUtilityDirectory(utilityRegistry,directory,elementFactory);
assert.deepEqual(directory.children.map(({dataset,textContent})=>[dataset.utilityId,textContent]),[["command-palette","Command palette"],["hotkeys","Hotkeys"],["data-layer","Data layer"]]);
const values=new Map();
const backing={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
backing.setItem("legacy.data","before");
const ownedStorage=createUtilityStorage(backing,{namespace:"test.data",version:1,legacyKeys:["legacy.data"]});
assert.equal(ownedStorage.getItem("legacy.data"),"before");
ownedStorage.setItem("legacy.data","after");
assert.equal(backing.getItem("legacy.data"),"after","legacy storage remains compatible");
assert.equal(JSON.parse(backing.getItem("test.data"))["legacy.data"],"after","utility serialization is namespaced");
assert.throws(()=>ownedStorage.getItem("legacy.hotkeys"),/does not own storage key/);
const panelElements=new Map(extensionShell.panels.map((id)=>[id,{dataset:{}}]));
bindUtilityPanels(utilityRegistry,{querySelector(selector){return panelElements.get(selector.slice(1))??null;}});
for(const utility of utilityRegistry)for(const panel of utility.panels)assert.equal(panelElements.get(panel).dataset.utilityOwner,utility.id);
assert.throws(()=>bindUtilityPanels([{...utilityRegistry[0],panels:["missing-panel"]}],{querySelector(){return null;}}),/missing-panel/);
let standalonePagehide;
const standalonePanel={dataset:{}};
const standaloneRoot={dataset:{},querySelector(selector){return selector==="#palette"?standalonePanel:null;}};
const standaloneMount=mountUtility(commandPaletteUtility,standaloneRoot,{addEventListener(type,listener){if(type==="pagehide")standalonePagehide=listener;}});
assert.equal(standaloneRoot.dataset.registeredUtilities,"command-palette");
assert.equal(standaloneRoot.dataset.activeUtilities,"command-palette");
assert.equal(standalonePanel.dataset.utilityOwner,"command-palette");
standaloneMount.unmount();standalonePagehide();
assert.equal(standaloneRoot.dataset.activeUtilities,"");
const directLifecycleRoot={dataset:{},querySelector(selector){return selector==="#palette"?{dataset:{}}:null;}};
const directMount=commandPaletteUtility.lifecycle.mount(directLifecycleRoot,{addEventListener(){}});
assert.equal(directLifecycleRoot.dataset.activeUtilities,"command-palette","public lifecycle mounts without shell composition");
directMount.unmount();
assert.deepEqual(architectureViolations(new Map([["src/side-panel.ts",'import "./data-layer-session.js";']])),[{file:"src/side-panel.ts",dependency:"./data-layer-session.js",reason:"shell composition must use public utility entries"}]);
assert.deepEqual(architectureViolations(new Map([["src/utilities/data-layer/layers/core/demo.ts",'import "../browser/demo.js";']])),[{file:"src/utilities/data-layer/layers/core/demo.ts",dependency:"../browser/demo.js",reason:"core may not depend on browser"}]);
assert.deepEqual(architectureViolations(new Map([["src/utilities/data-layer/layers/application/demo.ts",'import "../browser/demo.js";']])),[{file:"src/utilities/data-layer/layers/application/demo.ts",dependency:"../browser/demo.js",reason:"application may not depend on browser"}]);
assert.deepEqual(architectureViolations(new Map([["src/utilities/hotkeys/demo.ts",'import "../command-palette/index.js";']])),[{file:"src/utilities/hotkeys/demo.ts",dependency:"../command-palette/index.js",reason:"utilities may not import another utility"}]);
const installedControllerIds = ["capture", "event-library", "schemas", "defects", "replay",
  "projects", "durable-projects", "project-event-transport", "live-flow-testing"];
for (const id of installedControllerIds) {
  const dependency = id === "capture" ? "../defects/index.js" : "../capture/index.js";
  const crossControllerForms = [
    `import value from "${dependency}";`,
    `import type { InstalledPorts } from "${dependency}";`,
    `import "${dependency}";`,
    `export { installedControllerDefinition } from "${dependency}";`,
    `export type { InstalledPorts } from "${dependency}";`,
    `const controller = import("${dependency}");`,
  ];
  for (const source of crossControllerForms) {
    assert.deepEqual(architectureViolations(new Map([
      [`src/data-layer-installed/${id}/index.ts`, source],
    ])), [{
      file:`src/data-layer-installed/${id}/index.ts`,
      dependency,
      reason:"installed controllers may not import another controller implementation",
    }], `${id} rejects every TypeScript cross-controller import form`);
  }
}
assert.deepEqual(architectureViolations(new Map([["src/data-layer-unclassified.ts","export const value=1;"]])),[{file:"src/data-layer-unclassified.ts",dependency:"architecture/data-layer-boundaries.json",reason:"data-layer file must declare its module and layer"}]);
assert.deepEqual(architectureViolations(new Map([["src/data-layer-schema-canonical-document.ts","export function typeOf(document){return document.type;}"]])),[]);
assert.deepEqual(architectureViolations(new Map([["src/data-layer-event-library-editor.ts",'import "./data-layer-schema-documentation.js";']])),[{file:"src/data-layer-event-library-editor.ts",dependency:"./data-layer-schema-documentation.js",reason:"cross-module import must use the module public API"}]);
assert.deepEqual(architectureViolations(new Map([["src/data-layer-event-library-editor.ts",'import "./data-layer-source.js";']])),[{file:"src/data-layer-event-library-editor.ts",dependency:"./data-layer-source.js",reason:"cross-module import must use the module public API"}]);
assert.deepEqual(architectureViolations(new Map([["src/data-layer-event-library-editor.ts",'import "./utilities/data-layer/capture.js";']])),[]);
assert.deepEqual(dataLayerUtility.modules.map(({id})=>id),["capture","live-inspection","event-library","schemas","defect-reporting","replay"]);
const captureScope={utilityId:"data-layer",panelIds:["workspace-panel-data-layer","data-layer-panel-live"]};
assert.equal(retainUtilityElement({id:"data-layer-panel-live",owner:"data-layer"},captureScope),true);
assert.equal(retainUtilityElement({id:"data-layer-panel-schemas",owner:"data-layer"},captureScope),false);
assert.equal(retainUtilityElement({id:"workspace-panel-hotkeys",owner:"hotkeys"},captureScope),false);
assert.equal(retainControlledElement("palette",new Set(["workspace-panel-data-layer"])),false);
assert.equal(retainControlledElement("workspace-panel-data-layer",new Set(["workspace-panel-data-layer"])),true);
assert.equal(retainControlledElement("workspace-panel-data-layer palette",new Set(["workspace-panel-data-layer"])),false);
assert.deepEqual(utilityDomScopeFromSearch("?utility=data-layer&panel=workspace-panel-data-layer&panel=data-layer-panel-live&remove=%23palette"),{utilityId:"data-layer",panelIds:["workspace-panel-data-layer","data-layer-panel-live"],removeSelectors:["#palette"]});
assert.equal(utilityDomScopeFromSearch(""),undefined);
assert.equal(scopedUtilityModulePath(captureScope),"./utilities/data-layer/index.js");
assert.equal(scopedUtilityModulePath({utilityId:"hotkeys",panelIds:["workspace-panel-hotkeys"]}),"./utilities/hotkeys/index.js");
assert.throws(()=>scopedUtilityModulePath({utilityId:"unknown",panelIds:["unknown-panel"]}),/Unknown utility scope/);
assert.deepEqual(shellRuntimeCapabilities({runtime:{onMessage:{addListener(){}}},tabs:{query(){},onUpdated:{addListener(){}},onRemoved:{addListener(){}}},permissions:{onRemoved:{addListener(){}}}}),["runtime.messaging","tabs.query","tabs.lifecycle","permissions.lifecycle"]);
const sidePanelSource=await readFile(new URL("../src/side-panel.ts",import.meta.url),"utf8");
assert.doesNotMatch(sidePanelSource,/from "\.\/data-layer-/,"The shell must use data-layer public entries instead of implementation modules");
assert.doesNotMatch(sidePanelSource,/from "\.\/command-palette/,"The shell must use the command-palette public entry");
for(const facade of ["capture","live-inspection","event-library","schemas","defect-reporting","replay"]){
  const source=await readFile(new URL(`../src/utilities/data-layer/${facade}.ts`,import.meta.url),"utf8");
  assert.doesNotMatch(source,/export \* from/,`${facade} must expose a narrow explicit interface`);
}

const packs=await loadVerificationPacks();
await validateVerificationPacks(packs);
const inventory=await verificationInventory();
await assert.rejects(()=>validateVerificationPacks(packs,{inventory:{source:[...inventory.source,"src/unassigned.ts"]}}),/Assign every source path to one pack: src\/unassigned\.ts/);
await assert.rejects(()=>validateVerificationPacks(packs,{inventory:{tests:[...inventory.tests,"test/unassigned-test.mjs"]}}),/Assign every test path to exactly one pack: test\/unassigned-test\.mjs/);
const registeredFeatureContracts=packs.flatMap(({features,plannedFeatures=[]})=>[...features,...plannedFeatures]);
await assert.rejects(()=>validateVerificationPacks(packs,{inventory:{features:[...registeredFeatureContracts,"features/unassigned.feature"],handlers:packs.flatMap(({handlers})=>handlers)}}),/Unassigned features path: features\/unassigned\.feature/);
await assert.rejects(()=>validateVerificationPacks(packs,{inventory:{features:registeredFeatureContracts,handlers:[...packs.flatMap(({handlers})=>handlers),"acceptance/src/acceptance/steps/unassigned.clj"]}}),/Unassigned handlers path/);
await assert.rejects(()=>validateVerificationPacks([...packs,{...packs[0],id:"duplicate",features:packs[0].features}]),/exactly one pack|Duplicate or invalid shared boundary identity/);
assert.equal(packs.length>=6,true);for(const pack of packs)for(const key of ["source","unit","property","features","handlers","browserAdapters","dependencies"])assert.equal(Array.isArray(pack[key]),true,`${pack.id}.${key}`);
const commandPalettePack=packs.find(({id})=>id==="command-palette");const shellPack=packs.find(({id})=>id==="shell");
const capturePack=packs.find(({id})=>id==="capture");const schemasPack=packs.find(({id})=>id==="schemas");
assert.ok(schemasPack.source.includes("src/data-layer-specification-model.ts"),"The canonical Specification Project model must be owned by the schemas verification pack");
assert.ok(commandPalettePack.handlers.includes("acceptance/src/acceptance/steps/palette.clj"));
assert.equal(shellPack.handlers.includes("acceptance/src/acceptance/steps/palette.clj"),false);
assert.ok(shellPack.features.includes("features/data-layer-secondary-view-separation.feature"));
assert.ok(shellPack.handlers.includes("acceptance/src/acceptance/steps/information_architecture.clj"));
assert.equal(capturePack.features.includes("features/data-layer-secondary-view-separation.feature"),false);
assert.equal(capturePack.handlers.includes("acceptance/src/acceptance/steps/non_applicable_property_visibility.clj"),false);
assert.equal(capturePack.handlers.includes("acceptance/src/acceptance/steps/recursive_property_validation.clj"),false);
assert.ok(schemasPack.handlers.includes("acceptance/src/acceptance/steps/schema_publication_refresh.clj"));
assert.ok(schemasPack.handlers.includes("acceptance/src/acceptance/steps/schema_publication_refresh_support.clj"));
assert.ok(schemasPack.handlers.includes("acceptance/src/acceptance/steps/non_applicable_property_visibility.clj"));
assert.ok(schemasPack.handlers.includes("acceptance/src/acceptance/steps/recursive_property_validation.clj"));
const aggregateHandlers=await readFile(new URL("../acceptance/src/acceptance/steps/all.clj",import.meta.url),"utf8");
assert.match(aggregateHandlers,/non-applicable-property-visibility\/handlers/);
const focused=planVerification(packs,{packIds:["schemas"]});assert.equal(focused.packIds.includes("schemas"),true);assert.equal(focused.packIds.includes("defects"),false);
assert.deepEqual(focused.packIds,["schemas"],"an exact pack does not inherit dependency regressions");
assert.deepEqual(focused.propertyCommands,[],"property tests are opt-in outside terminal verification");
assert.deepEqual(focusedAcceptanceOptions(["--pack","schemas","--property","--with-dependencies"]),{packIds:["schemas"],changedPaths:[],terminalFull:false,includeProperties:true,withDependencies:true,skipBuild:false,changedSince:undefined,shard:undefined,prepareEvidence:undefined,browserTargetIds:[],focusedTaskKeys:[]});
assert.throws(()=>focusedAcceptanceOptions(["--pack","schemas","--shard","5/4"]),/--shard/);
assert.throws(()=>focusedAcceptanceOptions(["--pack","schemas","--no-build"]),/--no-build/);
assert.deepEqual(focused.features,[...packs.find(({id})=>id==="schemas").features].sort());
assert.deepEqual(focused.handlers,packs.find(({id})=>id==="schemas").handlers);
const parseCommands=focused.commands.filter((command)=>command.startsWith("bb gherkin-parser "));
const generateCommands=focused.commands.filter((command)=>command.startsWith("bb acceptance-entrypoint-generator "));
const executeCommands=focused.commands.filter((command)=>command.includes("_acceptance_test.clj "));
const sessionCommands=focused.commands.filter((command)=>command.startsWith("bb acceptance-pack-runner schemas "));
assert.equal(sessionCommands.length,1);
assert.equal(parseCommands.length,focused.features.length);assert.equal(generateCommands.length,focused.features.length);assert.equal(executeCommands.length,1);
const generatedNames=focused.features.map((feature)=>`${feature.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-+|-+$)/g,"")}_acceptance_test.clj`);
assert.deepEqual(generatedNames.map((name)=>sessionCommands[0].indexOf(name)),[...generatedNames.map((name)=>sessionCommands[0].indexOf(name))].sort((left,right)=>left-right));
assert.ok(focused.commands.indexOf(parseCommands.at(-1))<focused.commands.indexOf(generateCommands[0]));
assert.ok(focused.commands.indexOf(generateCommands.at(-1))<focused.commands.indexOf(executeCommands[0]));
assert.deepEqual(focused.acceptanceCommands,[...parseCommands,...generateCommands,...executeCommands]);
const focusedExecutions=[];await executeAcceptancePlan(focused,{runCommand:async(command)=>focusedExecutions.push(command)});
assert.deepEqual(focusedExecutions,focused.commands,"a focused pack executes every registered leaf exactly once");
let activeCommands=0,maximumActiveCommands=0;const phaseEvents=[];
await executeAcceptancePlan({preparationCommands:[],unitCommands:["unit-a","unit-b","unit-c"],propertyCommands:[],browserCommands:["browser-a","browser-b"],parserCommands:[],generatorCommands:[],sessionCommands:[]},{concurrency:2,runCommand:async(command)=>{activeCommands+=1;maximumActiveCommands=Math.max(maximumActiveCommands,activeCommands);phaseEvents.push(`start:${command}`);await new Promise(resolve=>setTimeout(resolve,5));phaseEvents.push(`end:${command}`);activeCommands-=1;}});
assert.equal(maximumActiveCommands,2,"independent unit leaves use the bounded worker pool");
assert.ok(phaseEvents.indexOf("start:browser-a")>phaseEvents.indexOf("end:unit-c"));
assert.ok(phaseEvents.indexOf("start:browser-b")>phaseEvents.indexOf("end:browser-a"),"Chrome adapters remain sequential");
const attemptedUnitLeaves=[];await assert.rejects(()=>executeAcceptancePlan({preparationCommands:[],unitCommands:["unit-fail-a","unit-pass","unit-fail-b"],propertyCommands:[],browserCommands:[],parserCommands:[],generatorCommands:[],sessionCommands:[]},{concurrency:2,runCommand:async command=>{attemptedUnitLeaves.push(command);if(command.includes("fail"))throw new Error(command);}}),/1 independent command/);assert.deepEqual(attemptedUnitLeaves.sort(),["unit-fail-a","unit-pass"],"the first unit failure closes the bounded stage before another leaf launches");
const attemptedBrowserShards=[];await assert.rejects(()=>executeAcceptancePlan({preparationCommands:[],unitCommands:[],propertyCommands:[],browserCommands:["browser-fail-a","browser-pass","browser-fail-b"],parserCommands:[],generatorCommands:[],sessionCommands:[]},{runCommand:async command=>{attemptedBrowserShards.push(command);if(command.includes("fail"))throw new Error(command);}}),/1 independent command/);assert.deepEqual(attemptedBrowserShards,["browser-fail-a"],"the first browser adapter failure closes the stage before another adapter launches");
const stoppedExecutions=[];
await assert.rejects(()=>executeAcceptancePlan({acceptanceCommands:["parse","generate","execute"]},{runCommand:async(command)=>{stoppedExecutions.push(command);if(command==="generate")throw new Error("generation failed");}}),/generation failed/);
assert.deepEqual(stoppedExecutions,["npm run build","parse","generate"]);
const changedFeature=packs.find(({id})=>id==="schemas").features[0];
const changedAcceptance=planVerification(packs,{changedPaths:[changedFeature]});const changedAcceptancePacks=new Set(changedAcceptance.packIds);assert.deepEqual(changedAcceptance.features,packs.filter(({id})=>changedAcceptancePacks.has(id)).flatMap(({features})=>features).sort());assert.ok(changedAcceptance.unitCommands.length<=focused.unitCommands.length,"a sliced feature selects its direct tasks within the affected packs");
const focusedCliExecutions=[];await executeAcceptancePlan(changedAcceptance,
  {runCommand:async(command)=>focusedCliExecutions.push(command)});
assert.deepEqual(focusedCliExecutions,changedAcceptance.commands,
  "broader topology contracts execute an already pure-planned synthetic command set");
const schemaVerificationPath="src/data-layer-schema-verification.ts";
assert.throws(()=>planVerification(packs,{packIds:["schemas"],changedPaths:[schemaVerificationPath]}),/outside the explicit pack set/,
  "an explicit changed-path boundary fails closed when it omits affected consumer packs");
const changed=planVerification(packs,{changedPaths:[schemaVerificationPath]});assert.equal(changed.packIds.includes("schemas"),true);
assert.ok(changed.unitCommands.includes("node test/data-layer-schema-verification-test.mjs"));assert.equal(focused.unitCommands.every((command)=>changed.unitCommands.includes(command)),true,"source changes retain the whole owning pack inside the complete affected closure");
const ambiguousSharedSource=planVerification(packs,{changedPaths:["src/data-layer-specification-model.ts"]});assert.deepEqual(ambiguousSharedSource.unitCommands,changed.unitCommands,"an ambiguous shared source conservatively retains the complete affected closure");
const full=planVerification(packs,{terminalFull:true});assert.deepEqual(full.packIds,packs.filter(pack=>pack.unit.length+pack.property.length+pack.features.length+pack.browserAdapters.length+(pack.browserObservations?.length??0)+(pack.checkpointCommands?.length??0)>0).map(({id})=>id));
assert.ok(full.propertyCommands.length>0);
const shards=Array.from({length:4},(_,index)=>planVerification(packs,{terminalFull:true,skipBuild:true,shard:{index,count:4}}));
for(const key of ["unitCommands","propertyCommands","browserCommands","features"]){const combined=shards.flatMap(shard=>shard[key]);assert.equal(new Set(combined).size,combined.length,`${key} leaves belong to one shard`);assert.deepEqual([...combined].sort(),[...full[key]].sort(),`${key} shards cover the full plan`);}
assert.equal(new Set(full.commands).size,full.commands.length);assert.equal(full.commands.filter((command)=>command==="npm run build").length,1);
const fullCliExecutions=[];await executeAcceptancePlan(full,
  {runCommand:async(command)=>fullCliExecutions.push(command)});
assert.deepEqual(full.features,packs.flatMap(({features})=>features).sort());
assert.deepEqual(fullCliExecutions,full.commands,
  "terminal topology inspection remains pure and never invokes the production runner");
const bbTasks=await readFile(new URL("../bb.edn",import.meta.url),"utf8");
assert.ok(bbTasks.includes('"node" "scripts/run-focused-acceptance.mjs" "--full"'));
assert.throws(()=>planVerification(packs,{changedPaths:["src/unowned-module.ts"]}),/Assign every changed path to one verification pack/);
if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
      ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right))
        .map(([key,nested])=>[key,normalized(nested)])):value,
    digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
  if(context.causalCategory==="other:sliced Schema feature direct-task planning"){
    const expectedPreRepairFailure={directSliceBounded:false,directReachabilitySelected:false},
      expectedRepairResult={directSliceBounded:true,directReachabilitySelected:true},
      observed={directSliceBounded:changedAcceptance.unitCommands.length<=focused.unitCommands.length,
        directReachabilitySelected:changedAcceptance.unitCommands.some((command)=>
          command.includes("test/data-layer-installed/schema-editor-reachability-test.mjs"))},
      fixture={id:"sliced-schema-feature-direct-task-planning-v1",
        causalCategory:context.causalCategory,
        diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{feature:changedFeature,removedAggregate:"test/data-layer-installed/schemas-controller-test.mjs"},
        expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
    assert.deepEqual(observed,expectedRepairResult);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed}}}));
  }else if(context.causalCategory==="other:failure-quiescence legacy aggregate contract"){
    const expectedPreRepairFailure={unitLeaves:["unit-fail-a","unit-fail-b","unit-pass"],
        browserLeaves:["browser-fail-a","browser-pass","browser-fail-b"],unitFailureCount:2,
        browserFailureCount:2},
      expectedRepairResult={unitLeaves:["unit-fail-a","unit-pass"],
        browserLeaves:["browser-fail-a"],unitFailureCount:1,browserFailureCount:1},
      observed={unitLeaves:[...attemptedUnitLeaves].sort(),browserLeaves:[...attemptedBrowserShards],
        unitFailureCount:1,browserFailureCount:1},
      fixture={id:"bounded-stage-failure-quiescence-contract-v1",causalCategory:context.causalCategory,
        diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
        input:{unitConcurrency:2,browserConcurrency:1,launchGate:"first observed failure"},
        expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
    assert.deepEqual(observed,expectedRepairResult);
    console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
      incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed}}}));
  }else{
    const
    shellPack=packs.find(({id})=>id==="shell"),
    helper=shellPack.verificationHelpers.find(({path})=>path==="test/support/layered-schema-overlay-focusability.mjs"),
    declarationInventory=shellPack.verificationHelpers.filter(({path})=>
      !path.startsWith("test/support/side-panel-")&&path!=="test/support/browser-observation-control.mjs").length,
    expectedPreRepairFailure={declared:false,consumers:[],declarationInventory:21},
    expectedRepairResult={declared:Boolean(helper),consumers:helper?.consumers??[],declarationInventory};
  assert.deepEqual(expectedRepairResult,{declared:true,consumers:["layered_schema","shell"],declarationInventory:25});
  const fixture={id:"verification-helper-inventory-contract-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
    input:{helperPath:"test/support/layered-schema-overlay-focusability.mjs"},
    expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:expectedRepairResult}}}));
  }
}
// Schema architecture contract: controller state ownership and import direction.
{
const schemaSourceDirectory = "src/data-layer-installed/schemas";
const schemaSourceFiles = (await readdir(schemaSourceDirectory)).filter((name) => name.endsWith(".ts"));
const schemaSources = new Map(await Promise.all(schemaSourceFiles.map(async (name) => [
  name,
  await readFile(`${schemaSourceDirectory}/${name}`, "utf8"),
])));
assert.equal(
  [...schemaSources].flatMap(([name, source]) => source.split("\n").flatMap((line, index) =>
    line.length > 300 ? [`${name}:${index + 1}:${line.length}`] : [])).length,
  0,
  "Schema source keeps each line within the review limit",
);
const propertyWrites = /\.(?:selectedPath|expandedRulePaths|pendingCopyPosition|interactionReturn|renderSequence)\s*(?:=(?!=)|\+=)|\.expandedRulePaths\.(?:add|delete|clear)/gu;
const canonicalWrites = /\.(?:editor|reopenSelection|revisionSnapshots|scrollByKey|presenceDraft)\s*=(?!=)|\.(?:revisionSnapshots|scrollByKey)\.(?:set|clear)/gu;
for (const [name, source] of schemaSources) {
  if (name !== "property-controller.ts") assert.equal(propertyWrites.test(source), false, `${name} does not write property-controller state`);
  propertyWrites.lastIndex = 0;
  if (name !== "canonical-editor-controller.ts") assert.equal(canonicalWrites.test(source), false, `${name} does not write canonical-controller state`);
  canonicalWrites.lastIndex = 0;
}
const ownedSchemaState = new Map([
  ["guided-validation-controller.ts",["selections"]],
  ["assignment-controller.ts",["editing","conditions"]],
  ["persistence-controller.ts",["promotion","guided"]],
  ["library-editor.ts",["pendingRestoration"]],
  ["rule-attachment-workflow.ts",["pendingUpgrade","pendingSync","approvedAttachmentUpdateId"]],
  ["rule-promotion-workflow.ts",["pending","focusReturn","focusedPosition","generation"]],
  ["rule-controller.ts",["attachmentWorkflow","promotionWorkflow"]],
]);
for (const [name,names] of ownedSchemaState) for (const field of names) {
  assert.match(schemaSources.get(name),new RegExp(`#${field}(?:\\??:|=)`,"u"),`${name} keeps ${field} private`);
}
assert.doesNotMatch(schemaSources.get("guided-public-operations.ts"),/guided\.selections\b/u);
assert.doesNotMatch(schemaSources.get("property-controller.ts"),/get pendingCopyReview\b/u);
assert.doesNotMatch(schemaSources.get("property-view.ts"),/\.promotionFocusedPosition\s*=/u);
assert.equal(schemaSources.get("canonical-view-contracts.ts").includes("canonical-editor-controller"), false);
assert.equal(schemaSources.get("installed-editor-contracts.ts").includes("installed-editor-workflow"), false);
assert.equal(schemaSources.get("library-controller-contracts.ts").includes("library-controller.js"), false);
for (const [name, source] of schemaSources) {
  if (!name.endsWith("-controller.ts") || name === "installed-controller.ts") continue;
  assert.doesNotMatch(source,/from\s+["']\.\/[^"']+-controller\.js["']/u,
    `${name} collaborates through stable ports instead of another controller implementation`);
}
assert.match(schemaSources.get("persistence-controller.ts"),/persistence-controller-contracts\.js/u,
  "persistence collaboration uses its stable narrow port contract");

const graph = new Map(schemaSourceFiles.map((name) => [name, []]));
for (const [name, source] of schemaSources) {
  for (const match of source.matchAll(/from\s+["']\.\/([^"']+)\.js["']/gu)) {
    const target = `${match[1]}.ts`;
    if (graph.has(target)) graph.get(name).push(target);
  }
}
const visiting = new Set(), visited = new Set();
function assertAcyclic(name) {
  assert.equal(visiting.has(name), false, `Schema type and runtime imports are acyclic at ${name}`);
  if (visited.has(name)) return;
  visiting.add(name);
  for (const target of graph.get(name)) assertAcyclic(target);
  visiting.delete(name);
  visited.add(name);
}
for (const name of graph.keys()) assertAcyclic(name);
}
console.log("modular utility architecture tests passed");
