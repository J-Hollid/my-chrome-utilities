import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";

import {
  stylesheetDeclarationFor,
  validateStylesheetRegistry,
} from "../scripts/verification-styles.mjs";
import {
  stylesheetRuleInventory,
  verifyFlowStylesheetConservation,
} from "../scripts/flow-stylesheet-conservation.mjs";

const gitShow=(revision,file)=>new Promise((resolve,reject)=>execFile(
  "git",["show",`${revision}:${file}`],{encoding:"utf8"},
  (error,stdout)=>error?reject(error):resolve(stdout),
));

const registry=JSON.parse(await readFile(new URL("../verification/packs.json",import.meta.url),"utf8"));
const html=await readFile(new URL("../specification-builder.html",import.meta.url),"utf8");
const baseCss=await readFile(new URL("../specification-builder.css",import.meta.url),"utf8");
const brandCss=await readFile(new URL("../specification-builder-brand.css",import.meta.url),"utf8");
const localCss=await readFile(new URL("../src/flow-graph/flow-workspace.css",import.meta.url),"utf8");
const bridgeCss=await readFile(new URL("../src/flow-graph/flow-workspace-shell.css",import.meta.url),"utf8");
const extractionBase="66b91e38e6";
const baseGlobalSources=await Promise.all(["specification-builder.css","specification-builder-brand.css"]
  .map(async(path)=>({path,source:await gitShow(extractionBase,path)})));
const approvedStyleSliceAdditions=[
  {
    context:"",
    selector:".documentary-flow circle[data-flow-port-for].is-valid-target",
    declarations:"fill:#d9f7df;stroke:#137333;stroke-width:5",
  },
  {
    context:"",
    selector:'.documentary-flow .flow-canvas-scroll.is-connecting .flow-graph-canvas[data-semantic-detail="identity"] .flow-node',
    declarations:"display:inline",
  },
];
const relationshipPortSnapRuleBefore={
  context:"",
  selector:".documentary-flow .flow-connection-preview",
  declarations:"stroke:#f07c00;stroke-width:3;stroke-dasharray:6 4",
};
const relationshipPortSnapRuleAfter={...relationshipPortSnapRuleBefore,declarations:`${relationshipPortSnapRuleBefore.declarations};pointer-events:none`};
const ruleIdentity=({context,selector,declarations})=>JSON.stringify([context,selector,declarations]);
const ruleSelectorIdentity=({context,selector})=>JSON.stringify([context,selector]);
const flowOwnedGlobalSelector=/(?:\.documentary-flow|\.flow-(?:graph|canvas|workspace|node|edge|lane|projections|minimap|contextual|section|tidy|page|readiness|connection|empty)|#flow-graph-workspace|body\.flow-focus-canvas)/u;
const serializeRule=({context,selector,declarations})=>{
  let source=declarations===";"?`${selector};`:`${selector}{${declarations}}`;
  for(const atRule of context.split(" > ").filter(Boolean).reverse())source=`${atRule}{${source}}`;
  return source;
};
const serializeInventory=(inventory)=>inventory.map(serializeRule).join("\n");
const isApprovedViewerRule=({selector})=>selector.startsWith(".twatility-studio .flow-concept-visual-viewer")||selector===".twatility-studio dialog.flow-concept-visual-viewer";
const brandInventory=stylesheetRuleInventory(brandCss,"specification-builder-brand.css"),approvedViewerStyleAdditions=brandInventory.filter(isApprovedViewerRule);
assert.equal(approvedViewerStyleAdditions.length,17,"the approved concept-visual viewer style inventory remains explicit");
assert.ok(approvedViewerStyleAdditions.every(({selector})=>selector.startsWith(".twatility-studio ")),"every approved viewer rule remains scoped to Specification Studio");
const candidateGlobalSources=[
  {path:"specification-builder.css",source:baseCss},
  {path:"specification-builder-brand.css",source:brandCss},
];
const classifyPostBaselineNonFlowRules=({baseSources,candidateSources,explicitApproved=[]})=>{
  const baseInventory=baseSources.flatMap(({path,source})=>stylesheetRuleInventory(source,path));
  const remainingBase=[...baseInventory],remainingExplicit=[...explicitApproved],admitted=[];
  const consume=(pool,rule)=>{
    const index=pool.findIndex((candidate)=>ruleIdentity(candidate)===ruleIdentity(rule));
    if(index<0)return false;
    pool.splice(index,1);
    return true;
  };
  const baseSelectors=new Set(baseInventory.map(ruleSelectorIdentity));
  for(const {path,source} of candidateSources){
    for(const rule of stylesheetRuleInventory(source,path)){
      if(consume(remainingExplicit,rule)||consume(remainingBase,rule))continue;
      assert.ok(!baseSelectors.has(ruleSelectorIdentity(rule)),`a changed or duplicated approved-base selector cannot be admitted: ${ruleSelectorIdentity(rule)}`);
      assert.doesNotMatch(rule.selector,flowOwnedGlobalSelector,`a post-baseline global rule must be outside Flow ownership: ${ruleIdentity(rule)}`);
      admitted.push(rule);
    }
  }
  assert.equal(remainingExplicit.length,0,"every explicitly approved global addition remains present exactly once");
  return admitted;
};
const postBaselineNonFlowRules=classifyPostBaselineNonFlowRules({
  baseSources:baseGlobalSources,
  candidateSources:candidateGlobalSources,
  explicitApproved:approvedViewerStyleAdditions,
});
const approvedGlobalAdditions=[...approvedViewerStyleAdditions,...postBaselineNonFlowRules];
const withoutApprovedStyleSliceAdditions=(source)=>{
  const remaining=stylesheetRuleInventory(source,"src/flow-graph/flow-workspace.css");
  for(const approved of approvedStyleSliceAdditions){
    const matches=remaining.flatMap((rule,index)=>ruleIdentity(rule)===ruleIdentity(approved)?[index]:[]);
    assert.equal(matches.length,1,`approved style addition must occur exactly once: ${ruleIdentity(approved)}`);
    remaining.splice(matches[0],1);
  }
  return serializeInventory(remaining);
};
const replaceStructuredRule=(source,before,after)=>{
  let replaced=0;
  const inventory=stylesheetRuleInventory(source,"src/flow-graph/flow-workspace.css").map((rule)=>{
    if(ruleIdentity(rule)!==ruleIdentity(before))return rule;
    replaced+=1;
    return after;
  });
  assert.equal(replaced,1,`structured mutation source must occur exactly once: ${ruleIdentity(before)}`);
  return serializeInventory(inventory);
};
const withoutStructuredRule=(source,removed)=>{
  let removals=0;
  const inventory=stylesheetRuleInventory(source,"src/flow-graph/flow-workspace.css").filter((rule)=>{
    if(ruleIdentity(rule)!==ruleIdentity(removed))return true;
    removals+=1;
    return false;
  });
  assert.equal(removals,1,`structured removal source must occur exactly once: ${ruleIdentity(removed)}`);
  return serializeInventory(inventory);
};
const conservedLocalCss=replaceStructuredRule(withoutApprovedStyleSliceAdditions(localCss),relationshipPortSnapRuleAfter,relationshipPortSnapRuleBefore);
const conservation=verifyFlowStylesheetConservation({
  baseGlobalSources,candidateGlobalSources,
  localSource:conservedLocalCss,
  bridgeSource:bridgeCss,
  approvedCandidateGlobalRules:approvedGlobalAdditions,
});
assert.equal(conservation.conservedExactlyOnce,true);
assert.equal(conservation.addedGlobalRuleCount,17+postBaselineNonFlowRules.length,"approved and structurally non-Flow additions are accounted separately from conserved global rules");
assert.ok(postBaselineNonFlowRules.length>0,"later non-Flow global additions are separated from the frozen extraction inventory");
assert.equal(approvedStyleSliceAdditions.length,2,"the approved Stage 3 style inventory remains explicit");
assert.equal(stylesheetRuleInventory(localCss,"src/flow-graph/flow-workspace.css").filter((rule)=>ruleIdentity(rule)===ruleIdentity(relationshipPortSnapRuleAfter)).length,1,"the relationship-port snap safety replacement remains explicit exactly once");
assert.equal(conservation.baseRuleCount,
  conservation.retainedGlobalRuleCount+conservation.movedRuleCount,
  "every approved-base selector/declaration occurrence is retained globally or moved exactly once");
assert.throws(()=>verifyFlowStylesheetConservation({
  baseGlobalSources,candidateGlobalSources,
  localSource:conservedLocalCss.replace("stroke-width:2", "stroke-width:9"),bridgeSource:bridgeCss,
  approvedCandidateGlobalRules:approvedGlobalAdditions,
}),/no approved-base match/u,"a changed moved declaration cannot satisfy conservation");
assert.throws(()=>verifyFlowStylesheetConservation({
  baseGlobalSources,candidateGlobalSources,
  localSource:withoutStructuredRule(conservedLocalCss,{context:"",selector:".documentary-flow .flow-node",declarations:"cursor:grab"}),bridgeSource:bridgeCss,
  approvedCandidateGlobalRules:approvedGlobalAdditions,
}),/approved-base rules were lost/u,"an unaccounted moved selector cannot satisfy conservation");
const changedCompatiblePortRule={...approvedStyleSliceAdditions[0],declarations:"fill:#d9f7df;stroke:#137333;stroke-width:6"};
assert.throws(()=>withoutApprovedStyleSliceAdditions(replaceStructuredRule(localCss,approvedStyleSliceAdditions[0],changedCompatiblePortRule)),/must occur exactly once/u,"an unapproved compatible-port declaration fails conservation");
assert.throws(()=>withoutApprovedStyleSliceAdditions(`${localCss}\n${serializeRule(approvedStyleSliceAdditions[1])}`),/must occur exactly once/u,"a duplicated approved style addition fails conservation");

const causalBaseGlobalSources=[{path:"fixture-global.css",source:'.unrelated-shell{display:block}.documentary-flow .flow-node{cursor:grab}'}];
const causalCandidateGlobalSources=[{path:"fixture-global.css",source:'.unrelated-shell{display:block}.documentation-context-header{position:sticky}'}];
const verifyCausalFixture=(localSource,candidateGlobalSources=causalCandidateGlobalSources)=>{
  const admitted=classifyPostBaselineNonFlowRules({baseSources:causalBaseGlobalSources,candidateSources:candidateGlobalSources});
  return verifyFlowStylesheetConservation({
    baseGlobalSources:causalBaseGlobalSources,
    candidateGlobalSources,
    localSource,
    bridgeSource:"",
    approvedCandidateGlobalRules:admitted,
  });
};
const causalConservation=verifyCausalFixture('.documentary-flow .flow-node{cursor:grab}');
const rejectionMatches=(operation,pattern)=>{
  try{operation();}
  catch(error){return pattern.test(String(error?.message));}
  return false;
};
const causalOutcomes={
  unrelatedDocumentationAdmitted:causalConservation.addedGlobalRuleCount===1,
  changedExtractedFlowRejected:rejectionMatches(()=>verifyCausalFixture('.documentary-flow .flow-node{cursor:grabbing}'),/no approved-base match/u),
  lostExtractedFlowRejected:rejectionMatches(()=>verifyCausalFixture(""),/approved-base rules were lost/u),
  duplicatedExtractedFlowRejected:rejectionMatches(()=>verifyCausalFixture('.documentary-flow .flow-node{cursor:grab}.documentary-flow .flow-node{cursor:grab}'),/no approved-base match/u),
  laterGlobalFlowRejected:rejectionMatches(()=>verifyCausalFixture('.documentary-flow .flow-node{cursor:grab}',[{path:"fixture-global.css",source:`${causalCandidateGlobalSources[0].source}.documentary-flow .flow-new-control{display:block}`}]),/outside Flow ownership/u),
};
assert.deepEqual(causalOutcomes,{
  unrelatedDocumentationAdmitted:true,
  changedExtractedFlowRejected:true,
  lostExtractedFlowRejected:true,
  duplicatedExtractedFlowRejected:true,
  laterGlobalFlowRejected:true,
},"post-baseline admission remains causal and preserves every Flow conservation failure mode");

if(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION){
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION),
    normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
      ?Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right))
        .map(([key,nested])=>[key,normalized(nested)])):value,
    digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex"),
    expectedPreRepairFailure={...causalOutcomes,unrelatedDocumentationAdmitted:false},
    fixture={id:"flow-stylesheet-post-baseline-ownership-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:digest(context.diagnosedBoundary),
      input:{extractionBase,postBaselineSelector:".documentation-context-header"},
      expectedPreRepairFailure,expectedRepairResult:causalOutcomes},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed:causalOutcomes}}}));
}

assert.deepEqual(stylesheetDeclarationFor(registry,"src/flow-graph/flow-workspace.css"),{
  source:"src/flow-graph/flow-workspace.css",
  destination:"flow-graph/flow-workspace.css",
  classification:"feature-local",
  owner:"flow_graph",
  consumers:[],
  qaTargets:[],
  scopeRoot:".documentary-flow",
});
assert.deepEqual(stylesheetDeclarationFor(registry,"src/flow-graph/flow-workspace-shell.css"),{
  source:"src/flow-graph/flow-workspace-shell.css",
  destination:"flow-graph/flow-workspace-shell.css",
  classification:"shell-bridge",
  owner:"flow_graph",
  consumers:["shell"],
  qaTargets:[],
  scopeRoot:".documentary-flow",
});
await validateStylesheetRegistry(registry,{repositoryRoot:new URL("..",import.meta.url).pathname,packIds:registry.map(({id})=>id)});

const links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/gu)].map(([,href])=>href);
assert.ok(links.indexOf("flow-graph/flow-workspace.css")>links.indexOf("specification-builder.css"),"Flow-local rules follow the base Studio stylesheet");
assert.ok(links.indexOf("flow-graph/flow-workspace-shell.css")>links.indexOf("flow-graph/flow-workspace.css"),"the Flow-shell bridge follows Flow-local presentation");
assert.ok(links.indexOf("specification-builder-brand.css")>links.indexOf("flow-graph/flow-workspace-shell.css"),"brand overrides retain their deliberate final cascade position");

for(const [source,label] of [[baseCss,"base Studio"],[brandCss,"global brand"]]){
  assert.doesNotMatch(source,flowOwnedGlobalSelector,`${label} CSS no longer owns Flow selectors`);
}
assert.match(localCss,/^\.documentary-flow\b/mu,"the feature-local stylesheet is rooted at the stable Flow boundary");
assert.match(localCss,/\.documentary-flow .*\.flow-node/u,"node presentation is Flow-local");
assert.match(localCss,/\.documentary-flow circle\[data-flow-port-for\]\.is-valid-target\s*\{[^}]*stroke-width:\s*5/su,"compatible root-port shape emphasis is owned by the packaged Flow-local stylesheet");
assert.match(localCss,/\.flow-canvas-scroll\.is-connecting \.flow-graph-canvas\[data-semantic-detail="identity"\] \.flow-node\s*\{[^}]*display:\s*inline/su,"Event mini-cards remain direct invalid targets while drawing at identity zoom");
assert.match(localCss,/@media \(prefers-reduced-motion: reduce\)/u,"reduced-motion presentation remains Flow-local");
assert.match(localCss,/@media \(forced-colors: active\)/u,"forced-colors presentation remains Flow-local");
assert.doesNotMatch(localCss,/(?:^|[,{]\s*)(?:body|\.twatility-studio|#project-workspace|#workspace-pane|#project-inspector|\.sticky-tools)\b/mu,"feature-local selectors cannot target Studio shell ancestors");

assert.match(bridgeCss,/\.twatility-studio #workspace-pane:has\(\.documentary-flow/u,"the bridge retains ordinary Studio workspace integration");
assert.match(bridgeCss,/body\.flow-focus-canvas/u,"the bridge retains Focus Canvas shell integration");
assert.doesNotMatch(bridgeCss,/\.flow-node|\.flow-edge|\.flow-lane|\.flow-minimap/u,"component presentation cannot leak into the shell bridge");

console.log("Flow stylesheet extraction contract passed");
