import assert from "node:assert/strict";
import {execFile} from "node:child_process";
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
const candidateGlobalSources=[
  {path:"specification-builder.css",source:baseCss},
  {path:"specification-builder-brand.css",source:brandCss},
];
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
const serializeRule=({context,selector,declarations})=>{
  let source=declarations===";"?`${selector};`:`${selector}{${declarations}}`;
  for(const atRule of context.split(" > ").filter(Boolean).reverse())source=`${atRule}{${source}}`;
  return source;
};
const serializeInventory=(inventory)=>inventory.map(serializeRule).join("\n");
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
});
assert.equal(conservation.conservedExactlyOnce,true);
assert.equal(approvedStyleSliceAdditions.length,2,"the approved Stage 3 style inventory remains explicit");
assert.equal(stylesheetRuleInventory(localCss,"src/flow-graph/flow-workspace.css").filter((rule)=>ruleIdentity(rule)===ruleIdentity(relationshipPortSnapRuleAfter)).length,1,"the relationship-port snap safety replacement remains explicit exactly once");
assert.equal(conservation.baseRuleCount,
  conservation.retainedGlobalRuleCount+conservation.movedRuleCount,
  "every approved-base selector/declaration occurrence is retained globally or moved exactly once");
assert.throws(()=>verifyFlowStylesheetConservation({
  baseGlobalSources,candidateGlobalSources,
  localSource:conservedLocalCss.replace("stroke-width:2", "stroke-width:9"),bridgeSource:bridgeCss,
}),/no approved-base match/u,"a changed moved declaration cannot satisfy conservation");
assert.throws(()=>verifyFlowStylesheetConservation({
  baseGlobalSources,candidateGlobalSources,
  localSource:withoutStructuredRule(conservedLocalCss,{context:"",selector:".documentary-flow .flow-node",declarations:"cursor:grab"}),bridgeSource:bridgeCss,
}),/approved-base rules were lost/u,"an unaccounted moved selector cannot satisfy conservation");
const changedCompatiblePortRule={...approvedStyleSliceAdditions[0],declarations:"fill:#d9f7df;stroke:#137333;stroke-width:6"};
assert.throws(()=>withoutApprovedStyleSliceAdditions(replaceStructuredRule(localCss,approvedStyleSliceAdditions[0],changedCompatiblePortRule)),/must occur exactly once/u,"an unapproved compatible-port declaration fails conservation");
assert.throws(()=>withoutApprovedStyleSliceAdditions(`${localCss}\n${serializeRule(approvedStyleSliceAdditions[1])}`),/must occur exactly once/u,"a duplicated approved style addition fails conservation");

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
  assert.doesNotMatch(source,/(?:\.documentary-flow|\.flow-(?:graph|canvas|workspace|node|edge|lane|projections|minimap|contextual|section|tidy|page|readiness|connection|empty)|#flow-graph-workspace|body\.flow-focus-canvas)/u,`${label} CSS no longer owns Flow selectors`);
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
