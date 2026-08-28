import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  aggregateCampsiteAssessment,
  createPrerequisiteSatisfaction,
  createRemainderManifest,
  createResumptionQuarantine,
  recordDisposition,
  resumeRemainder,
} from "../scripts/stacked-campsite-control.mjs";
import { quarantinePrematureResumption, recordCampsitePrerequisiteSatisfaction,
  resumeOntoQa, routeCampsiteReadiness,
  triggerQaIntegrations } from "../scripts/campsite-git-runtime.mjs";
import { persistCampsitePipeline } from "../scripts/campsite-store.mjs";
import {
  granularityObservationIdentity,
  granularityPortfolioFreezeStatus,
  granularityPortfolioFreezeStatusSync,
  listGranularityPortfolio,
  recordGranularityObservation,
  recordGranularityPortfolioDisposition,
  recordGranularityQaProof,
} from "../scripts/campsite-granularity-observations.mjs";

const exec=promisify(execFile);
const control=path.resolve("scripts/stacked-campsite-control.mjs");
async function git(root,...args){return (await exec("git",args,{cwd:root,encoding:"utf8"})).stdout.trim();}

const assessment=aggregateCampsiteAssessment({task:"product-task",candidate:"1".repeat(40),
  causalPaths:["src/two.ts","src/one.ts","src/two.ts"]});
assert.deepEqual(assessment.causalPaths,["src/one.ts","src/two.ts"]);
const manifest=createRemainderManifest({task:assessment.task,splitBase:"2".repeat(40),
  prerequisiteCommit:"3".repeat(40),prerequisiteTask:"verification-slice-product-task",
  remainderHead:"4".repeat(40),remainderTree:"5".repeat(40),
  orderedCommits:["4".repeat(40)],changeSetDigest:"6".repeat(64),
  causalPaths:assessment.causalPaths,boundaryGeneration:"shell-v1",
  expectedPostRebaseDelta:"7".repeat(64),routing:{from:"qa",to:"reviewer"}});
assert.throws(()=>createRemainderManifest({task:assessment.task,splitBase:"2".repeat(40),
  prerequisiteCommit:"3".repeat(40),prerequisiteTask:"verification-slice-product-task",
  remainderHead:"4".repeat(40),remainderTree:"5".repeat(40),
  orderedCommits:["4".repeat(40)],changeSetDigest:"6".repeat(64),
  causalPaths:assessment.causalPaths,boundaryGeneration:"shell-v1",
  expectedPostRebaseDelta:"7".repeat(64)}),/return route/i);
const reviewEvidence={status:"review-ready",task:"verification-slice-product-task",
  specificationCommit:"a".repeat(40),candidateCommit:"b".repeat(40),candidateTree:"c".repeat(40),
  receiptPath:"tmp/verification-receipts/review.json",receiptDigest:"d".repeat(64)};
const qaReadyHandoff={from:"architect",to:"specifier",task:"verification-slice-product-task",
  commit:"b".repeat(40),base:"a".repeat(40),readiness:"qa-ready",verified:"review-ready"};
const satisfaction=createPrerequisiteSatisfaction(manifest,{manifestDigest:manifest.digest,
  prerequisiteTask:"verification-slice-product-task",latestSpecification:"a".repeat(40),
  implementationCommit:"b".repeat(40),implementationTree:"c".repeat(40),reviewEvidence,
  qaReadyHandoff,integratedQaHead:"e".repeat(40)});
assert.equal(satisfaction.generationId,manifest.generationId);
assert.equal(satisfaction.integratedQaHead,"e".repeat(40));
assert.throws(()=>createPrerequisiteSatisfaction(manifest,{...satisfaction,
  manifestDigest:"0".repeat(64)}),/manifest.*digest/i);
assert.throws(()=>createPrerequisiteSatisfaction(manifest,{...satisfaction,
  reviewEvidence:{...reviewEvidence,status:"passed"}}),/review-ready/i);
const quarantine=createResumptionQuarantine(manifest,{resumedHead:"9".repeat(40),
  activeHandoff:"resume-product-task-generation",reason:"specification-only-prerequisite"});
assert.equal(quarantine.parked,true);
assert.equal(quarantine.resumedHead,"9".repeat(40));
assert.equal(resumeRemainder(manifest,{newQaHead:"8".repeat(40),
  observedPostRebaseDelta:"7".repeat(64),observedChangeSetDigest:"6".repeat(64),
  resumedHead:"9".repeat(40)}).reissuedTask,"product-task");
assert.throws(()=>resumeRemainder(manifest,{newQaHead:"8".repeat(40),
  observedPostRebaseDelta:"7".repeat(64),observedChangeSetDigest:"0".repeat(64),
  resumedHead:"9".repeat(40)}),/complete.*delta|change-set/i);
const records=[];
recordDisposition(records,{task:"product-task",path:"src/one.ts",boundary:"shell",
  generation:"shell-v1",result:"parent-fallback",failedPremise:"seam is not stable",consumers:["shell"]});
assert.throws(()=>recordDisposition(records,{task:"product-task",path:"src/one.ts",boundary:"shell",
  generation:"shell-v1",result:"parent-fallback",failedPremise:"renamed explanation",
  consumers:["shell"]}),/already has a disposition/u);
assert.equal(recordDisposition(records,{task:"product-task",path:"src/one.ts",boundary:"shell",
  generation:"shell-v1",result:"slice",consumers:["shell"]}).result,"slice",
"a changed failed-premise state is a new applicability generation");

const observationRepository=await mkdtemp(path.join(os.tmpdir(),"granularity-observations-"));
try {
  const observation={version:1,task:"route-fix",qaBase:"a".repeat(40),
    causalPaths:["src/route.ts"],boundaryGeneration:"route-v1",
    semanticProductScope:"one local route presentation correction",
    selectedPackIds:["owner","consumer"],selectedTaskFamilies:["route","export"],
    unrelatedTaskFamilies:["export"],candidateSeam:"route presentation seam",
    measuredCost:{taskCount:80,criticalPathEstimateMs:120000,failureCount:1},
    failureSurface:"unrelated export failure surface",seamClarity:"candidate seam is coherent but unproved",
    preparationCostRisk:"independent extraction is broader than the correction",
    rationale:"defer while retaining conservative parent coverage",
    reconsiderationEvidence:"another occurrence or a shared boundary",recordedAt:"2026-08-18T12:00:00.000Z"};
  const identity=granularityObservationIdentity(observation);
  const first=await recordGranularityObservation(observationRepository,observation,
    {isBaseAncestor:async()=>true});
  const second=await recordGranularityObservation(observationRepository,
    {...observation,recordedAt:"2026-08-18T13:00:00.000Z",
      measuredCost:{...observation.measuredCost,wallTimeMs:130000}},
    {isBaseAncestor:async()=>true});
  assert.equal(first.observation.identity,identity);
  assert.equal(second.observation.occurrences.length,2,
    "a repeated task, path, and generation accumulates measured occurrence");
  assert.equal(second.observation.occurrences[0].recordedAt,"2026-08-18T12:00:00.000Z",
    "append-only observation history is retained");
  await assert.rejects(recordGranularityObservation(observationRepository,
    {...observation,qaBase:"b".repeat(40)},{isBaseAncestor:async()=>false}),/ancestral|QA base/i);
  await assert.rejects(recordGranularityObservation(observationRepository,
    {...observation,identity:"0".repeat(64)},{isBaseAncestor:async()=>true}),/identity collision/i);
  assert.equal((await listGranularityPortfolio(observationRepository)).observations.length,1);
  assert.equal((await granularityPortfolioFreezeStatus(observationRepository,
    {qaHead:"c".repeat(40),isAncestor:async()=>true})).ready,false,
  "an undisposed observation blocks release freeze");
  await recordGranularityPortfolioDisposition(observationRepository,{observationIdentity:identity,
    promotionIdentity:"promotion-1",disposition:"selected",refinementIdentity:"route-hardening",reason:"measured repeated mismatch",
    recordedAt:"2026-08-18T14:00:00.000Z"});
  assert.equal((await granularityPortfolioFreezeStatus(observationRepository,
    {promotionIdentity:"promotion-1",qaHead:"c".repeat(40),isAncestor:async()=>true})).ready,false,
  "selected hardening without QA proof blocks release freeze");
  await recordGranularityQaProof(observationRepository,{refinementIdentity:"route-hardening",
    promotionIdentity:"promotion-1",
    task:"verification-slice-route-fix",candidateCommit:"d".repeat(40),
    evidence:"review-ready",qaIntegrated:true,recordedAt:"2026-08-18T15:00:00.000Z"});
  assert.equal((await granularityPortfolioFreezeStatus(observationRepository,
    {promotionIdentity:"promotion-1",qaHead:"c".repeat(40),isAncestor:async()=>true})).ready,true);
  const dispositionIdentities={selected:identity};
  for (const [suffix,disposition] of [["combined","combined"],["carried","carried"],["retired","retired"]]) {
    const value={...observation,task:`route-${suffix}`,boundaryGeneration:`route-${suffix}`,
      recordedAt:`2026-08-18T16:0${suffix.length}:00.000Z`};
    const recorded=await recordGranularityObservation(observationRepository,value,
      {isBaseAncestor:async()=>true});
    dispositionIdentities[disposition]=recorded.observation.identity;
    await recordGranularityPortfolioDisposition(observationRepository,{observationIdentity:recorded.observation.identity,
      promotionIdentity:"promotion-1",disposition,
      refinementIdentity:disposition==="combined"?"route-hardening":undefined,
      reason:`explicit ${disposition} rationale`,reconsiderationEvidence:"review next promotion",
      disprovedPremise:disposition==="retired"?"no material mismatch remains":undefined,
      recordedAt:"2026-08-18T17:00:00.000Z"});
  }
  assert.deepEqual(new Set((await listGranularityPortfolio(observationRepository)).observations
    .map(({disposition})=>disposition?.kind)),new Set(["selected","combined","carried","retired"]));
  const nextPromotion=await granularityPortfolioFreezeStatus(observationRepository,
    {promotionIdentity:"promotion-2",qaHead:"c".repeat(40),isAncestor:async()=>true});
  assert.equal(nextPromotion.ready,false);
  assert.deepEqual(nextPromotion.blocking,
    Object.values(dispositionIdentities).map((value)=>`undisposed:${value}`).sort(),
  "selected, combined, carried, and retired observations all require an explicit next-promotion disposition");
  assert.deepEqual(granularityPortfolioFreezeStatusSync(
    observationRepository,"promotion-2").blocking,nextPromotion.blocking,
  "synchronous release policy uses the same exact promotion-scoped dispositions");
} finally { await rm(observationRepository,{recursive:true,force:true}); }

const persistenceRepository=await mkdtemp(path.join(os.tmpdir(),"stacked-campsite-persistence-"));
try {
  const reviewedAt="2026-08-18T00:00:00.000Z";
  const dispositions=assessment.causalPaths.map((pathValue)=>({task:assessment.task,path:pathValue,
    boundary:"shell",generation:"shell-v1",result:"slice",consumers:["shell"],
    reviewedBy:"architect",reviewedAt}));
  const boundManifest=createRemainderManifest({task:assessment.task,splitBase:"2".repeat(40),
    prerequisiteCommit:"3".repeat(40),prerequisiteTask:"prepare-product",
    remainderHead:"1".repeat(40),remainderTree:"5".repeat(40),
    orderedCommits:["1".repeat(40)],changeSetDigest:"6".repeat(64),candidate:assessment.candidate,
    causalPaths:assessment.causalPaths,boundaryGeneration:"shell-v1",dispositions,
    expectedPostRebaseDelta:"7".repeat(64),routing:{from:"qa",to:"reviewer"}});
  const pipeline={assessment,dispositions,manifest:boundManifest,
    preparation:{id:"prepare-product",from:"coder",to:"refactorer",task:"prepare-product"}};
  await assert.rejects(persistCampsitePipeline(persistenceRepository,{...pipeline,
    dispositions:dispositions.map((value,index)=>index?value:{...value,consumers:["flow","shell"]})}),
  /differs from manifest applicability/u);
  await assert.rejects(persistCampsitePipeline(persistenceRepository,{...pipeline,
    dispositions:dispositions.map((value)=>({...value,generation:"shell-v2"}))}),
  /differs from manifest applicability/u);
  await assert.rejects(readdir(path.join(persistenceRepository,".swarmforge")),({code})=>code==="ENOENT",
    "mismatched dispositions are rejected before campsite state mutation");
  const firstPipeline=await persistCampsitePipeline(persistenceRepository,pipeline);
  const reorderedPipeline=await persistCampsitePipeline(persistenceRepository,{...pipeline,
    dispositions:[...dispositions].reverse()});
  assert.equal(reorderedPipeline.reused,true,
    "equivalent reviewed disposition order reuses the durable pipeline identity");
  assert.equal(reorderedPipeline.digest,firstPipeline.digest);
} finally { await rm(persistenceRepository,{recursive:true,force:true}); }

const repository=await mkdtemp(path.join(os.tmpdir(),"stacked-campsite-git-"));
try {
  await git(repository,"init","-q"); await git(repository,"config","user.name","Campsite Test");
  await git(repository,"config","user.email","campsite@example.test");
  await mkdir(path.join(repository,"src"));
  const baseProduct=["export const product = 1;",...Array.from({length:10},(_,index)=>
    `export const unchanged${index} = ${index};`),"export const prerequisite = 1;",""] .join("\n");
  await writeFile(path.join(repository,"src/product.ts"),baseProduct);
  await writeFile(path.join(repository,"src/outside.ts"),"export const outside = 1;\n");
  await writeFile(path.join(repository,"mapping.json"),"{}\n");
  await git(repository,"add","."); await git(repository,"commit","-qm","base");
  const base=await git(repository,"rev-parse","HEAD");
  await writeFile(path.join(repository,"src/product.ts"),baseProduct.replace("product = 1","product = 2"));
  await writeFile(path.join(repository,"src/outside.ts"),"export const outside = 2;\n");
  await git(repository,"commit","-qam","product remainder");
  const remainder=await git(repository,"rev-parse","HEAD");
  await git(repository,"switch","-qc","preparation",base);
  await writeFile(path.join(repository,"prerequisite-spec.md"),"approved prerequisite specification\n");
  await git(repository,"add","prerequisite-spec.md");
  await git(repository,"commit","-qm","prerequisite specification");
  const prerequisiteSpecification=await git(repository,"rev-parse","HEAD");
  await writeFile(path.join(repository,"src/product.ts"),baseProduct.replace(
    "prerequisite = 1","prerequisite = 2"));
  await writeFile(path.join(repository,"mapping.json"),'{"slice":"ready"}\n');
  await git(repository,"add","."); await git(repository,"commit","-qm","preparation");
  const preparation=await git(repository,"rev-parse","HEAD");
  await git(repository,"switch","-q","master");
  assert.equal(await git(repository,"branch","--show-current"),"master");
  const manifestPath=path.join(repository,"campsite.json");
  await exec(process.execPath,[control,"preserve","product-task",base,prerequisiteSpecification,
    "verification-slice-product-task",remainder,
    "shell-v1",JSON.stringify(["src/product.ts"]),JSON.stringify({from:"qa",to:"reviewer"}),
    manifestPath],{cwd:repository});
  await git(repository,"switch","-qc","unrelated",base);
  await writeFile(path.join(repository,"unrelated.txt"),"must survive\n");
  await git(repository,"add","unrelated.txt"); await git(repository,"commit","-qm","unrelated work");
  const unrelatedHead=await git(repository,"rev-parse","HEAD");
  await assert.rejects(resumeOntoQa(repository,manifestPath,preparation),
    /implementation prerequisite is not satisfied/i);
  assert.equal(await git(repository,"rev-parse","HEAD"),unrelatedHead);
  assert.equal(await git(repository,"branch","--show-current"),"unrelated");
  assert.equal(await readFile(path.join(repository,"unrelated.txt"),"utf8"),"must survive\n",
    "a first attempt never rewrites an unrelated caller branch");
  const preparationTree=await git(repository,"rev-parse",`${preparation}^{tree}`);
  const preservedBeforeSatisfaction=JSON.parse(await readFile(manifestPath,"utf8"));
  const specificationTree=await git(repository,"rev-parse",`${prerequisiteSpecification}^{tree}`);
  await git(repository,"branch","-f","qa",prerequisiteSpecification);
  await assert.rejects(recordCampsitePrerequisiteSatisfaction(repository,manifestPath,{
    manifestDigest:preservedBeforeSatisfaction.digest,
    prerequisiteTask:"verification-slice-product-task",latestSpecification:prerequisiteSpecification,
    implementationCommit:prerequisiteSpecification,implementationTree:specificationTree,
    reviewEvidence:{status:"review-ready",task:"verification-slice-product-task",
      specificationCommit:prerequisiteSpecification,candidateCommit:prerequisiteSpecification,
      candidateTree:specificationTree,receiptPath:"tmp/verification-receipts/specification.json",
      receiptDigest:"c".repeat(64)},
    qaReadyHandoff:{from:"architect",to:"specifier",task:"verification-slice-product-task",
      commit:prerequisiteSpecification,base:prerequisiteSpecification,
      readiness:"qa-ready",verified:"review-ready"},integratedQaHead:prerequisiteSpecification,
  },{reviewEvidenceValidator:async()=>true}),/implementation paths|specification-only/i,
  "a specification-only candidate cannot create satisfaction even when it reaches QA");
  await git(repository,"branch","-f","qa",preparation);
  await recordCampsitePrerequisiteSatisfaction(repository,manifestPath,{
    manifestDigest:preservedBeforeSatisfaction.digest,
    prerequisiteTask:"verification-slice-product-task",latestSpecification:prerequisiteSpecification,
    implementationCommit:preparation,implementationTree:preparationTree,
    reviewEvidence:{status:"review-ready",task:"verification-slice-product-task",
      specificationCommit:prerequisiteSpecification,candidateCommit:preparation,
      candidateTree:preparationTree,receiptPath:"tmp/verification-receipts/preparation.json",
      receiptDigest:"d".repeat(64)},
    qaReadyHandoff:{from:"architect",to:"specifier",task:"verification-slice-product-task",
      commit:preparation,base:prerequisiteSpecification,readiness:"qa-ready",verified:"review-ready"},
    integratedQaHead:preparation,
  },{reviewEvidenceValidator:async()=>true});
  await git(repository,"switch","-q","master");
  await assert.rejects(resumeOntoQa(repository,manifestPath,preparation,
    {faultAt:"resume-git-moved"}),/Injected campsite crash/u);
  assert.notEqual(await git(repository,"rev-parse","HEAD"),remainder,
    "a durable attempt survives a crash after Git moves HEAD");
  await assert.rejects(resumeOntoQa(repository,manifestPath,preparation,
    {faultAt:"resumption-routed"}),/Injected campsite crash/u);
  await resumeOntoQa(repository,manifestPath,preparation);
  const preservedManifest=JSON.parse(await readFile(manifestPath,"utf8"));
  assert.equal(preservedManifest.status,"preserved","the preserved stack identity remains immutable");
  const resumedPath=path.join(repository,".swarmforge/campsites/resumed",
    `product-task-${preservedManifest.generationId}.json`);
  const resumedManifest=JSON.parse(await readFile(resumedPath,"utf8"));
  assert.equal(resumedManifest.status,"resumed");
  assert.equal(resumedManifest.deltaConserved,true);
  const conservedProduct=await readFile(path.join(repository,"src/product.ts"),"utf8");
  assert.match(conservedProduct,/product = 2/u);
  assert.match(conservedProduct,/prerequisite = 2/u,
    "a clean same-file prerequisite change survives contribution-based resume proof");
  assert.equal(await readFile(path.join(repository,"src/outside.ts"),"utf8"),"export const outside = 2;\n");
  assert.equal(JSON.parse(await readFile(path.join(repository,"mapping.json"),"utf8")).slice,"ready");
  assert.equal(JSON.parse(await readFile(resumedPath,
    "utf8")).reissuedTask,"product-task");

  const preservedBytes=await readFile(manifestPath,"utf8"),prematureBytes=await readFile(resumedPath,"utf8");
  const activeHandoff="resume-product-task-premature";
  const activeDirectory=path.join(repository,".swarmforge/handoffs/inbox/in_process");
  await mkdir(activeDirectory,{recursive:true});
  await writeFile(path.join(activeDirectory,`00_${activeHandoff}.handoff`),
    `id: ${activeHandoff}\nfrom: coder\nto: coder\ntask: product-task\n\nParked product task.\n`);
  const quarantined=await quarantinePrematureResumption(repository,manifestPath,{
    resumedHead:resumedManifest.resumedHead,activeHandoff,
    reason:"specification-only-prerequisite"});
  assert.equal(quarantined.parked,true);
  assert.deepEqual(quarantined.ineligibleAs,
    ["verification","evidence","product","retry","later-resumption-base"]);
  assert.equal(await readFile(manifestPath,"utf8"),preservedBytes);
  assert.equal(await readFile(resumedPath,"utf8"),prematureBytes,
    "quarantine appends recovery state without rewriting the premature result");

  await git(repository,"switch","-qc","replacement-prerequisite",preparation);
  await writeFile(path.join(repository,"replacement-spec.md"),"replacement prerequisite correction\n");
  await git(repository,"add","replacement-spec.md");
  await git(repository,"commit","-qm","replacement prerequisite specification");
  const replacementSpecification=await git(repository,"rev-parse","HEAD");
  await git(repository,"branch","-f","qa",preparation);
  await assert.rejects(recordCampsitePrerequisiteSatisfaction(repository,manifestPath,{
    manifestDigest:preservedBeforeSatisfaction.digest,
    prerequisiteTask:"verification-slice-product-task",latestSpecification:replacementSpecification,
    implementationCommit:preparation,implementationTree:preparationTree,
    reviewEvidence:{status:"review-ready",task:"verification-slice-product-task",
      specificationCommit:replacementSpecification,candidateCommit:preparation,
      candidateTree:preparationTree,receiptPath:"tmp/verification-receipts/superseded.json",
      receiptDigest:"a".repeat(64)},
    qaReadyHandoff:{from:"architect",to:"specifier",task:"verification-slice-product-task",
      commit:preparation,base:replacementSpecification,readiness:"qa-ready",verified:"review-ready"},
    integratedQaHead:preparation,
  },{reviewEvidenceValidator:async()=>true}),/latest specification|integrated QA head/i,
  "an implementation that omits a replacement specification fails closed");

  await git(repository,"switch","-q","replacement-prerequisite");
  await writeFile(path.join(repository,"src/gate.ts"),"export const prerequisiteGate = true;\n");
  await git(repository,"add","src/gate.ts");
  await git(repository,"commit","-qm","implement replacement prerequisite");
  const successorImplementation=await git(repository,"rev-parse","HEAD");
  const successorTree=await git(repository,"rev-parse",`${successorImplementation}^{tree}`);
  await git(repository,"branch","-f","qa",successorImplementation);
  await recordCampsitePrerequisiteSatisfaction(repository,manifestPath,{
    manifestDigest:preservedBeforeSatisfaction.digest,
    prerequisiteTask:"verification-slice-product-task",latestSpecification:replacementSpecification,
    implementationCommit:successorImplementation,implementationTree:successorTree,
    reviewEvidence:{status:"review-ready",task:"verification-slice-product-task",
      specificationCommit:replacementSpecification,candidateCommit:successorImplementation,
      candidateTree:successorTree,receiptPath:"tmp/verification-receipts/successor.json",
      receiptDigest:"b".repeat(64)},
    qaReadyHandoff:{from:"architect",to:"specifier",task:"verification-slice-product-task",
      commit:successorImplementation,base:replacementSpecification,
      readiness:"qa-ready",verified:"review-ready"},integratedQaHead:successorImplementation,
  },{reviewEvidenceValidator:async()=>true});
  await git(repository,"switch","--detach",remainder);
  await git(repository,"branch","-f","remainder-work",remainder);
  await git(repository,"switch","-q","remainder-work");
  const successor=await resumeOntoQa(repository,manifestPath,successorImplementation,
    {requireCurrentQa:true});
  assert.equal(successor.successor,true);
  assert.equal(successor.supersedesResumedHead,resumedManifest.resumedHead);
  assert.equal(successor.remainder.head,preservedManifest.remainder.head);
  assert.deepEqual(successor.remainder.orderedCommits,preservedManifest.remainder.orderedCommits);
  assert.deepEqual(successor.causalPaths,preservedManifest.causalPaths);
  assert.equal(successor.remainder.changeSetDigest,preservedManifest.remainder.changeSetDigest);
  assert.equal(successor.expectedPostRebaseDelta,preservedManifest.expectedPostRebaseDelta);
  assert.equal(await readFile(resumedPath,"utf8"),prematureBytes);
  assert.equal((await resumeOntoQa(repository,manifestPath,successorImplementation,
    {requireCurrentQa:true})).resumedHead,successor.resumedHead,
  "a completed successor transaction is idempotent for the exact integrated QA head");

  await git(repository,"switch","--detach",remainder);
  await git(repository,"branch","-f","remainder-work",remainder);
  await git(repository,"switch","-q","remainder-work");
  await rm(manifestPath);
  const mismatchManifestPath=path.join(repository,".swarmforge/campsites/mismatch-campsite.json");
  await mkdir(path.dirname(mismatchManifestPath),{recursive:true});
  await exec(process.execPath,[control,"preserve","mismatch-task",base,prerequisiteSpecification,
    "verification-slice-mismatch-task",remainder,
    "shell-v1",JSON.stringify(["src/product.ts"]),JSON.stringify({from:"qa",to:"reviewer"}),
    mismatchManifestPath],{cwd:repository});
  const mismatchManifest=JSON.parse(await readFile(mismatchManifestPath,"utf8"));
  mismatchManifest.remainder.changeSetDigest="0".repeat(64);
  await writeFile(mismatchManifestPath,`${JSON.stringify(mismatchManifest,null,2)}\n`);
  await assert.rejects(exec(process.execPath,[control,"resume",mismatchManifestPath,preparation],
    {cwd:repository}),/complete.*delta|change-set|modified/i);
  assert.equal(await git(repository,"rev-parse","HEAD"),remainder,
    "a failed full-delta check restores the preserved stack head");
  assert.equal(await git(repository,"branch","--show-current"),"remainder-work",
    "a failed full-delta check restores the caller's checked-out branch");
  assert.equal(await readFile(path.join(repository,"src/outside.ts"),"utf8"),"export const outside = 2;\n");

  const pipelineConfig=path.join(repository,".swarmforge/campsites/pipeline-input.json");
  const reviewedAt="2026-08-18T00:00:00.000Z";
  await writeFile(pipelineConfig,`${JSON.stringify({
    assessment:{task:"automatic-product-task",candidate:remainder,
      causalPaths:["src/outside.ts","src/product.ts","src/outside.ts"]},
    judgment:{version:1,outcome:"immediate-preparation",
      semanticProductScope:"one local product correction",
      unrelatedSelectedFamilies:["complete shell family"],
      measuredCost:{taskCount:20,criticalPathEstimateMs:40000,failureCount:0},
      failureSurface:"unrelated shell process checks",
      seamClarity:"two exact causal paths form a reusable boundary",
      preparationCostRisk:"small isolated verification preparation",
      rationale:"the reusable seam benefit is proportionate to preparation cost",
      reconsiderationEvidence:"consumer or boundary generation changes"},
    dispositions:[
      {task:"automatic-product-task",path:"src/product.ts",boundary:"shell",generation:"shell-v1",
        result:"slice",consumers:["shell"],reviewedBy:"architect",reviewedAt},
      {task:"automatic-product-task",path:"src/outside.ts",boundary:"shell",generation:"shell-v1",
        result:"parent-fallback",failedPremise:"no stable narrower observation",
        consumers:["shell"],reviewedBy:"architect",reviewedAt},
    ],
    manifest:{splitBase:base,prerequisiteCommit:prerequisiteSpecification,
      prerequisiteTask:"verification-slice-automatic-product-task",remainderHead:remainder,
      boundaryGeneration:"shell-v1",routing:{from:"qa",to:"reviewer",priority:"00"}},
    preparation:{id:"prepare-automatic-product-task",from:"coder",to:"refactorer",
      task:"verification-slice-automatic-product-task"},
  },null,2)}\n`);
  const readinessModule=new URL("../scripts/campsite-git-runtime.mjs",import.meta.url).href;
  const readiness={classification:"granularity-assessment-required",task:"automatic-product-task",
    expansionCauses:[{path:"src/outside.ts",credibleBoundary:true},
      {path:"src/product.ts",credibleBoundary:true}]};
  const readinessRunner=`const {routeCampsiteReadiness}=await import(${JSON.stringify(readinessModule)});`+
    `const {readFile}=await import('node:fs/promises');`+
    `const result=await routeCampsiteReadiness(process.cwd(),JSON.parse(process.env.READINESS),`+
    `JSON.parse(await readFile(process.env.CAMPSITE_CONFIG,'utf8')));console.log(JSON.stringify(result));`;
  const readinessEnvironment={...process.env,READINESS:JSON.stringify(readiness),CAMPSITE_CONFIG:pipelineConfig};
  const firstPipeline=JSON.parse((await exec(process.execPath,["--input-type=module","-e",readinessRunner],
    {cwd:repository,env:readinessEnvironment})).stdout);
  const secondPipeline=JSON.parse((await exec(process.execPath,["--input-type=module","-e",readinessRunner],
    {cwd:repository,env:readinessEnvironment})).stdout);
  assert.equal(secondPipeline.reused,true,"a later process reuses the reviewed task/path generation");
  assert.equal(firstPipeline.preparationHandoff,secondPipeline.preparationHandoff);
  assert.equal((await readdir(path.join(repository,".swarmforge/handoffs/outbox")))
    .filter((name)=>path.join(repository,".swarmforge/handoffs/outbox",name)===
      firstPipeline.preparationHandoff).length,1,
  "the same disposition cannot route the same preparation twice");
  const automaticManifest=firstPipeline.preserved;
  await assert.rejects(exec(process.execPath,[control,"resume",automaticManifest,base],{cwd:repository}),
    /implementation prerequisite is not satisfied/i);
  await rm(firstPipeline.preparationHandoff);
  const reviewer=await mkdtemp(path.join(os.tmpdir(),"stacked-campsite-reviewer-"));
  const fakeBin=path.join(repository,".swarmforge/fake-bin"),tmuxLog=path.join(repository,".swarmforge/tmux.log");
  await mkdir(path.join(repository,".swarmforge"),{recursive:true});
  await mkdir(path.join(reviewer,".swarmforge/handoffs/inbox/new"),{recursive:true});
  await git(reviewer,"init","-q");
  await writeFile(path.join(reviewer,".swarmforge/roles.tsv"),
    `reviewer\treviewer\t${reviewer}\treviewer-session\tReviewer\tcodex\ttask\n`);
  await mkdir(fakeBin,{recursive:true});
  await writeFile(path.join(repository,".swarmforge/roles.tsv"),
    `coder\tcoder\t${repository}\tcoder-session\tCoder\tcodex\ttask\n`+
    `reviewer\treviewer\t${reviewer}\treviewer-session\tReviewer\tcodex\ttask\n`);
  await writeFile(path.join(repository,".swarmforge/tmux-socket"),"fixture-socket\n");
  await writeFile(path.join(fakeBin,"tmux"),'#!/bin/sh\nprintf \'%s\\n\' "$*" >> "$TMUX_LOG"\n',{mode:0o755});
  await git(repository,"branch","-f","qa",preparation);
  const automaticManifestValue=JSON.parse(await readFile(automaticManifest,"utf8"));
  await recordCampsitePrerequisiteSatisfaction(repository,automaticManifest,{
    manifestDigest:automaticManifestValue.digest,
    prerequisiteTask:"verification-slice-automatic-product-task",
    latestSpecification:prerequisiteSpecification,implementationCommit:preparation,
    implementationTree:preparationTree,
    reviewEvidence:{status:"review-ready",task:"verification-slice-automatic-product-task",
      specificationCommit:prerequisiteSpecification,candidateCommit:preparation,
      candidateTree:preparationTree,receiptPath:"tmp/verification-receipts/automatic.json",
      receiptDigest:"e".repeat(64)},
    qaReadyHandoff:{from:"architect",to:"specifier",
      task:"verification-slice-automatic-product-task",commit:preparation,
      base:prerequisiteSpecification,readiness:"qa-ready",verified:"review-ready"},
    integratedQaHead:preparation,
  },{reviewEvidenceValidator:async()=>true});
  await exec("bb",[path.resolve("swarmforge/scripts/handoffd.bb"),repository,"--once"],{
    cwd:repository,env:{...process.env,PATH:`${fakeBin}${path.delimiter}${process.env.PATH}`,TMUX_LOG:tmuxLog}});
  const reviewerNew=path.join(reviewer,".swarmforge/handoffs/inbox/new");
  const reissued=await readdir(reviewerNew);
  assert.equal(reissued.length,3,`the daemon delivers every conserved task to routing.to: ${
    await readFile(path.join(repository,".swarmforge/daemon/handoffd.log"),"utf8")}`);
  const reissuedText=(await Promise.all(reissued.map((name)=>readFile(path.join(reviewerNew,name),"utf8"))))
    .find((text)=>text.includes("task: automatic-product-task"));
  assert.match(reissuedText,/task: automatic-product-task/u);
  assert.match(reissuedText,new RegExp(`base: ${preparation}`,"u"));
  const claimedOutput=(await exec(path.resolve("swarmforge/scripts/ready_for_next.sh"),[],{
    cwd:reviewer,env:{...process.env,SWARMFORGE_ROLE:"reviewer"}})).stdout;
  assert.match(claimedOutput,/TASK_NAME: automatic-product-task/u);
  assert.equal((await readdir(path.join(reviewer,".swarmforge/handoffs/inbox/in_process"))).length,1,
    "the declared recipient claims the automatically delivered ordinary handoff");
  const nextGeneration=JSON.parse(await readFile(pipelineConfig,"utf8"));
  nextGeneration.assessment.candidate=await git(repository,"rev-parse","HEAD");
  nextGeneration.manifest.splitBase=preparation;
  nextGeneration.manifest.remainderHead=nextGeneration.assessment.candidate;
  nextGeneration.manifest.boundaryGeneration="shell-v2";
  nextGeneration.dispositions=nextGeneration.dispositions.map((value)=>({...value,generation:"shell-v2"}));
  const nextGenerationConfig=path.join(repository,".swarmforge/campsites/pipeline-input-v2.json");
  await writeFile(nextGenerationConfig,`${JSON.stringify(nextGeneration,null,2)}\n`);
  const nextEnvironment={...readinessEnvironment,CAMPSITE_CONFIG:nextGenerationConfig};
  const nextPipeline=JSON.parse((await exec(process.execPath,["--input-type=module","-e",readinessRunner],
    {cwd:repository,env:nextEnvironment})).stdout);
  assert.notEqual(nextPipeline.preserved,firstPipeline.preserved,
    "a materially changed boundary generation receives a new durable identity");
  assert.equal((await readdir(path.join(repository,".swarmforge/campsites/preserved")))
    .filter((name)=>name.startsWith("automatic-product-task-")).length,2);
  const consumerGeneration=JSON.parse(await readFile(pipelineConfig,"utf8"));
  consumerGeneration.dispositions=consumerGeneration.dispositions.map((value)=>({...value,
    consumers:[...value.consumers,"flow"]}));
  const consumerConfig=path.join(repository,".swarmforge/campsites/pipeline-input-consumers.json");
  await writeFile(consumerConfig,`${JSON.stringify(consumerGeneration,null,2)}\n`);
  const consumerPipeline=JSON.parse((await exec(process.execPath,["--input-type=module","-e",readinessRunner],
    {cwd:repository,env:{...readinessEnvironment,CAMPSITE_CONFIG:consumerConfig}})).stdout);
  assert.notEqual(consumerPipeline.preserved,firstPipeline.preserved,
    "a changed reviewed consumer set receives a distinct applicability generation");
  assert.equal((await readdir(path.join(repository,".swarmforge/campsites/preserved")))
    .filter((name)=>name.startsWith("automatic-product-task-")).length,3);
  await rm(reviewer,{recursive:true,force:true});
} finally { await rm(repository,{recursive:true,force:true}); }

const conflictRepository=await mkdtemp(path.join(os.tmpdir(),"stacked-campsite-conflict-"));
try {
  await git(conflictRepository,"init","-q");
  await git(conflictRepository,"config","user.name","Campsite Conflict Test");
  await git(conflictRepository,"config","user.email","campsite-conflict@example.test");
  await writeFile(path.join(conflictRepository,"shared.txt"),"start\nend\n");
  await git(conflictRepository,"add","."); await git(conflictRepository,"commit","-qm","base");
  const conflictBase=await git(conflictRepository,"rev-parse","HEAD");
  await writeFile(path.join(conflictRepository,"shared.txt"),"start\nproduct\nend\n");
  await git(conflictRepository,"commit","-qam","product insertion");
  const conflictRemainder=await git(conflictRepository,"rev-parse","HEAD");
  await git(conflictRepository,"switch","-qc","preparation",conflictBase);
  await writeFile(path.join(conflictRepository,"prerequisite-spec.md"),"approved conflict prerequisite\n");
  await git(conflictRepository,"add","prerequisite-spec.md");
  await git(conflictRepository,"commit","-qm","conflict prerequisite specification");
  const conflictSpecification=await git(conflictRepository,"rev-parse","HEAD");
  await writeFile(path.join(conflictRepository,"shared.txt"),"start\nprerequisite\nend\n");
  await git(conflictRepository,"commit","-qam","prerequisite insertion");
  const conflictPreparation=await git(conflictRepository,"rev-parse","HEAD");
  await git(conflictRepository,"switch","-q","master");
  const conflictManifest=path.join(conflictRepository,"campsite.json");
  await exec(process.execPath,[control,"preserve","conflict-task",conflictBase,conflictSpecification,
    "verification-slice-conflict-task",conflictRemainder,"shell-v1",JSON.stringify(["shared.txt"]),
    JSON.stringify({from:"qa",to:"reviewer"}),conflictManifest],{cwd:conflictRepository});
  await git(conflictRepository,"branch","-f","qa",conflictPreparation);
  const conflictManifestValue=JSON.parse(await readFile(conflictManifest,"utf8"));
  const conflictTree=await git(conflictRepository,"rev-parse",`${conflictPreparation}^{tree}`);
  await recordCampsitePrerequisiteSatisfaction(conflictRepository,conflictManifest,{
    manifestDigest:conflictManifestValue.digest,prerequisiteTask:"verification-slice-conflict-task",
    latestSpecification:conflictSpecification,implementationCommit:conflictPreparation,
    implementationTree:conflictTree,
    reviewEvidence:{status:"review-ready",task:"verification-slice-conflict-task",
      specificationCommit:conflictSpecification,candidateCommit:conflictPreparation,
      candidateTree:conflictTree,receiptPath:"tmp/verification-receipts/conflict.json",
      receiptDigest:"f".repeat(64)},
    qaReadyHandoff:{from:"architect",to:"specifier",task:"verification-slice-conflict-task",
      commit:conflictPreparation,base:conflictSpecification,readiness:"qa-ready",verified:"review-ready"},
    integratedQaHead:conflictPreparation,
  },{reviewEvidenceValidator:async()=>true});
  await resumeOntoQa(conflictRepository,conflictManifest,conflictPreparation);
  const merged=await readFile(path.join(conflictRepository,"shared.txt"),"utf8");
  assert.match(merged,/prerequisite/u);
  assert.match(merged,/product/u,
    "a reversible textual insertion conflict is union-reapplied and contribution-checked");
} finally { await rm(conflictRepository,{recursive:true,force:true}); }
console.log("Stacked campsite control contracts passed.");
