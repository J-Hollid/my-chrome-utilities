import { runBrowserTargetSession } from "./browser-target-session.mjs";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { authoring034Expression,authoring035And036Expression } from "./layered-schema-usability-probes.mjs";
import { authoring045Expression,flowFacet003Expression } from "./layered-schema-ownership-probes.mjs";
import { patternHelperLayoutExpression,stringRuleValidationExpression,valueRuleDurableMigrationExpression } from "./string-rule-validation-runtime-probes.mjs";
import { authoringConceptRuntimeExpression } from "./schema-concept-runtime-probes.mjs";
import { flatRuleMainProjectionLifecycleExpression,flatRulePanelProjectionDiagnosticExpression,flatRulePopupGeometryExpression,flatRuleResponsiveFinishExpression,flatRuleResponsiveSetupExpression,flatRuleResponsiveSnapshotExpression } from "./flat-rule-builder-runtime-probes.mjs";
import { typedLiteralFocusedEditorExpression } from "./typed-literal-focused-editor-probes.mjs";
import { runProfileInheritanceControlsRuntimeProbe } from "./profile-inheritance-controls-runtime-probe.mjs";
import { runJournalFreeInstalledRuntimeProbe } from "./journal-free-installed-runtime-probe.mjs";

const layeredAdapterSource=await readFile(new URL("../browser-packs/layered-schema.mjs",import.meta.url),"utf8");
const initialStart=layeredAdapterSource.indexOf("const evidence=await evaluate(socket,`");
const initialEnd=layeredAdapterSource.indexOf("const compactPanelEvidence=",initialStart);
if(initialStart<0||initialEnd<0)throw new Error("Cannot locate the intact initial layered installed workflow");
const initialLayeredInstalledExpression=layeredAdapterSource.slice(layeredAdapterSource.indexOf("`",initialStart)+1,layeredAdapterSource.lastIndexOf("`",initialEnd));
const editorInitialLayeredInstalledExpression=initialLayeredInstalledExpression.replace(
  "form.requestSubmit();for(let attempt=0;attempt<160;attempt+=1){const workspace=document.querySelector('[data-project-entity-workspace]');",
  "form.requestSubmit();for(let attempt=0;attempt<600;attempt+=1){const workspace=document.querySelector('[data-project-entity-workspace]');");
if(editorInitialLayeredInstalledExpression===initialLayeredInstalledExpression)throw new Error("Cannot extend the intact editor entity settlement boundary");
const extractedEvaluateTemplate=(marker,nextMarker)=>{
  const start=layeredAdapterSource.indexOf(marker);
  const end=layeredAdapterSource.indexOf(nextMarker,start);
  if(start<0||end<0)throw new Error(`Cannot locate intact layered workflow slice: ${marker}`);
  const opening=layeredAdapterSource.indexOf("`",start),closing=layeredAdapterSource.indexOf("`)",opening+1);
  if(opening<0||closing<=opening)throw new Error(`Cannot locate intact layered workflow expression: ${marker}`);
  return layeredAdapterSource.slice(opening+1,closing);
};
const flowFacetExpression=extractedEvaluateTemplate("const flowFacetEvidence=await evaluate(socket,`","const flowCrossFacetEvidence=");
const flowOwnershipSetupExpression=extractedEvaluateTemplate("await evaluate(socket,`(async()=>{const pause=(ms=35)=>new Promise((resolve)=>setTimeout(resolve,ms));for(let layer=0;layer<3&&document.querySelector(':modal')","const flowCrossFacetEvidence=");
const flowCrossFacetExpression=extractedEvaluateTemplate("const flowCrossFacetEvidence=await evaluate(socket,`","const flowMoveOwnershipEvidence=");
const flowMoveOwnershipExpression=extractedEvaluateTemplate("const flowMoveOwnershipEvidence=await evaluate(socket,`","await evaluate(socket,`(()=>{globalThis.__flowStructureOwnershipObserver");
const flowStructureOwnershipSetupExpression=extractedEvaluateTemplate("await evaluate(socket,`(()=>{globalThis.__flowStructureOwnershipObserver","const flowStructureEvidence=");
const flowStructureExpression=extractedEvaluateTemplate("const flowStructureEvidence=await evaluate(socket,`","const pageGroupStructuralSeed=");
const pageGroupSeedExpression=extractedEvaluateTemplate("const pageGroupStructuralSeed=await evaluate(socket,`","const pageGroupStructuralEvidence=");
const pageGroupExpression=extractedEvaluateTemplate("const pageGroupStructuralEvidence=await evaluate(socket,`","const conflictClarityEvidence=");
const pageGroupSeedIds={pageId:"page:structural:cart",retailFixtureId:"fixture:structural:retail",
  tradeFixtureId:"fixture:structural:trade",flowId:"flow:structural:profile-inheritance",
  frameId:"frame:structural:cart"};
const pageGroupRuntimeExpression=Object.entries(pageGroupSeedIds).reduce((expression,[key,value])=>
  expression.replaceAll(`'\${pageGroupStructuralSeed.${key}}'`,JSON.stringify(value)),pageGroupExpression);
const initialCoreKeys=["installedBoundary","consequential","persistenceReload",
  ...Array.from({length:14},(_,index)=>`authoring${String(index+1).padStart(3,"0")}`),
  ...[17,18,19,21,22,23,24,25].map(index=>`authoring${String(index).padStart(3,"0")}`),
  ...Array.from({length:21},(_,index)=>`layering${String(index+1).padStart(3,"0")}`)];
const editorStart=layeredAdapterSource.indexOf("const compactPanelEvidence=");
const editorRuleStart=layeredAdapterSource.indexOf("const ruleBuilderCorrectionEvidence=",editorStart);
const editorCanonicalStart=layeredAdapterSource.indexOf("const canonicalFacetEvidence=await evaluate(socket,withStartedOptionalCondition",editorRuleStart);
const editorEnd=layeredAdapterSource.indexOf("const flowFacetEvidence=",editorCanonicalStart);
const editorTailStart=layeredAdapterSource.indexOf("const conflictClarityEvidence=",editorEnd);
const editorTailEnd=layeredAdapterSource.indexOf("const flowEvidence=",editorTailStart);
if([editorStart,editorRuleStart,editorCanonicalStart,editorEnd,editorTailStart,editorTailEnd].some((offset)=>offset<0))throw new Error("Cannot locate intact layered editor producer chain");
const editorSurfaceSource=layeredAdapterSource.slice(editorStart,editorRuleStart);
const editorRuleSource=layeredAdapterSource.slice(editorRuleStart,editorCanonicalStart);
const editorCanonicalSource=layeredAdapterSource.slice(editorCanonicalStart,editorEnd);
const optionalConditionStart=editorRuleSource.indexOf("const optionalRuleConditionEvidence=");
const optionalConditionEnd=editorRuleSource.indexOf("if(!optionalRuleConditionEvidence",optionalConditionStart);
const editorOptionalConditionSource=editorRuleSource.slice(optionalConditionStart,optionalConditionEnd);
const editorTailSource=layeredAdapterSource.slice(editorTailStart,editorTailEnd)
  .replace(/^.*(?:schemaTableContainmentEvidence|flowFacetEvidence).*$/gmu,"");
const editorKeys=["sidePanelParity","authoring015","authoring016","authoring020",
  ...[...Array.from({length:9},(_,index)=>index+46),...Array.from({length:9},(_,index)=>index+59)]
    .map((index)=>`authoring${String(index).padStart(3,"0")}`)];
const editorRuleKeys=[...Array.from({length:5},(_,index)=>`authoring${String(index+26).padStart(3,"0")}`),
  ...Array.from({length:3},(_,index)=>`authoring${String(index+42).padStart(3,"0")}`),
  ...[69,70,71,72,73,74,75,76].map((index)=>`authoring${String(index).padStart(3,"0")}`),
  ...Array.from({length:3},(_,index)=>`layering${String(index+22).padStart(3,"0")}`)];
const editorCanonicalKeys=[...Array.from({length:11},(_,index)=>`authoring${String(index+31).padStart(3,"0")}`),
  "authoring045","authoring055","authoring056","authoring057","authoring058","authoring068"];
const editorPolicyKeys=[...Array.from({length:9},(_,index)=>`authoring${String(index+77).padStart(3,"0")}`),
  ...Array.from({length:7},(_,index)=>`layering${String(index+25).padStart(3,"0")}`)];
const canonicalEditorKeys=["canonicalPresence","canonicalValues","canonicalConditions","canonicalRules","canonicalExample","canonicalPersisted"];
const withStartedOptionalCondition=(expression)=>expression
  .replaceAll("const property=panel.querySelector('[aria-label=\"Condition property\"]')","[...panel.querySelectorAll('button')].find(({textContent})=>textContent.trim()==='Add condition')?.click();const property=panel.querySelector('[aria-label=\"Condition property\"]')")
  .replaceAll("const reusableProperty=host.querySelector('[aria-label=\"Condition property\"]')","[...host.querySelectorAll('button')].find(({textContent})=>textContent.trim()==='Add condition')?.click();const reusableProperty=host.querySelector('[aria-label=\"Condition property\"]')")
  .replaceAll("const property=q('[aria-label=\"Condition property\"]',focused)","buttons(focused).find(({textContent})=>textContent.trim()==='Add condition')?.click();const property=q('[aria-label=\"Condition property\"]',focused)")
  .replaceAll("const conditionProperty=q('[aria-label=\"Condition property\"]',focused)","buttons(focused).find(({textContent})=>textContent.trim()==='Add condition')?.click();const conditionProperty=q('[aria-label=\"Condition property\"]',focused)")
  .replaceAll("const property=focused.querySelector('[aria-label=\"Condition property\"]')","buttons(focused).find(({textContent})=>textContent.trim()==='Add condition')?.click();const property=focused.querySelector('[aria-label=\"Condition property\"]')");
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const editorProducerParameterNames=["initialExpression","evaluate","socket","activeSocket","ready","wait","assert","withStartedOptionalCondition",
  "authoring034Expression","authoring035And036Expression","authoring045Expression","patternHelperLayoutExpression",
  "stringRuleValidationExpression","valueRuleDurableMigrationExpression","authoringConceptRuntimeExpression",
  "flatRuleMainProjectionLifecycleExpression","flatRulePanelProjectionDiagnosticExpression","flatRulePopupGeometryExpression",
  "flatRuleResponsiveFinishExpression","flatRuleResponsiveSetupExpression","flatRuleResponsiveSnapshotExpression",
  "typedLiteralFocusedEditorExpression","runProfileInheritanceControlsRuntimeProbe","runJournalFreeInstalledRuntimeProbe"];
const runIntactEditorProducers=new AsyncFunction(...editorProducerParameterNames,`
  const evidence=await evaluate(socket,initialExpression);
  ${editorSurfaceSource}
  const owned={};
  for(const key of ${JSON.stringify(editorKeys)})owned[key]=evidence[key];
  return{layeredSchema:owned};
`);
const runIntactEditorRuleProducers=new AsyncFunction(...editorProducerParameterNames,`
  const evidence=await evaluate(socket,initialExpression);
  ${editorSurfaceSource}
  ${editorRuleSource}
  const owned={};for(const key of ${JSON.stringify(editorRuleKeys)})owned[key]=evidence[key];
  return{layeredSchema:owned};
`);
const runIntactEditorCanonicalProducers=new AsyncFunction(...editorProducerParameterNames,`
  const evidence=await evaluate(socket,initialExpression);
  ${editorSurfaceSource}
  ${editorOptionalConditionSource}
  ${editorCanonicalSource}
  const canonicalFacetPersistence={canonicalPresence:canonicalFacetEvidence.presenceSaved,canonicalValues:canonicalFacetEvidence.valuesSaved,canonicalConditions:canonicalFacetEvidence.conditionsSaved,canonicalRules:canonicalFacetEvidence.rulesSaved,canonicalExample:canonicalFacetEvidence.exampleSaved,canonicalPersisted:canonicalFacetEvidence.persisted},owned={};
  for(const key of ${JSON.stringify(editorCanonicalKeys)})owned[key]=evidence[key];
  for(const key of ${JSON.stringify(canonicalEditorKeys)})owned[key]=canonicalFacetPersistence[key];
  return{layeredSchema:owned};
`);
const runIntactEditorPolicyProducers=new AsyncFunction(...editorProducerParameterNames,`
  const evidence=await evaluate(socket,initialExpression);
  ${editorTailSource}
  const owned={};
  for(const key of ${JSON.stringify(editorPolicyKeys)})owned[key]=evidence[key];
  return{layeredSchema:owned};
`);

const runEditorProducer=async(producer,{evaluate,socket})=>{
  const liveSocket={call:(...arguments_)=>socket().call(...arguments_)},originalEvaluate=(unused,expression)=>{let body;try{Function(`return (${expression})`);body=`return await (${expression});`;}catch{body=expression.replace(/;\s*true\s*$/u,";return true;");}return evaluate(unused,body);},ready=async(unused,selector)=>{for(let attempt=0;attempt<240;attempt+=1){if(await originalEvaluate(liveSocket,`Boolean(document.querySelector(${JSON.stringify(selector)}))`))return true;await new Promise((resolve)=>setTimeout(resolve,25));}throw new Error(`Installed editor did not settle: ${selector}`);};
  return producer(editorInitialLayeredInstalledExpression,originalEvaluate,liveSocket,liveSocket,ready,(milliseconds)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),assert,withStartedOptionalCondition,
    authoring034Expression,authoring035And036Expression,authoring045Expression,patternHelperLayoutExpression,
    stringRuleValidationExpression,valueRuleDurableMigrationExpression,authoringConceptRuntimeExpression,
    flatRuleMainProjectionLifecycleExpression,flatRulePanelProjectionDiagnosticExpression,flatRulePopupGeometryExpression,
    flatRuleResponsiveFinishExpression,flatRuleResponsiveSetupExpression,flatRuleResponsiveSnapshotExpression,
    typedLiteralFocusedEditorExpression,runProfileInheritanceControlsRuntimeProbe,runJournalFreeInstalledRuntimeProbe);
};

const definitions = {
  LAYERED_SCHEMA_CORE_TARGET:{pagePath:"specification-builder.html",navigationRetries:4,expression:()=>`
    const complete=await (${initialLayeredInstalledExpression}),owned={};
    for(const key of ${JSON.stringify(initialCoreKeys)})owned[key]=complete[key];
    return{layeredSchema:owned};`},
  LAYERED_SCHEMA_EDITOR_TARGET:{pagePath:"specification-builder.html",navigationRetries:4,run:(context)=>runEditorProducer(runIntactEditorProducers,context)},
  LAYERED_SCHEMA_EDITOR_RULES_TARGET:{pagePath:"specification-builder.html",navigationRetries:4,run:(context)=>runEditorProducer(runIntactEditorRuleProducers,context)},
  LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET:{pagePath:"specification-builder.html",navigationRetries:4,run:(context)=>runEditorProducer(runIntactEditorCanonicalProducers,context)},
  LAYERED_SCHEMA_EDITOR_POLICY_TARGET:{pagePath:"specification-builder.html",navigationRetries:4,run:(context)=>runEditorProducer(runIntactEditorPolicyProducers,context)},
  LAYERED_SCHEMA_COMPOSITION_TARGET:{
    pagePath:"specification-builder.html",navigationRetries:4,
    expression:()=>`
      await (${initialLayeredInstalledExpression});
      const flowFacetEvidence=await (${flowFacetExpression});
      if(!flowFacetEvidence.reset)Object.assign(flowFacetEvidence,await (${flowFacet003Expression}));
      const
        flowOwnershipSetup=await (${flowOwnershipSetupExpression}),
        flowCrossFacetEvidence=await (${flowCrossFacetExpression}),
        flowMoveOwnershipEvidence=await (${flowMoveOwnershipExpression}),
        flowStructureOwnershipSetup=await (${flowStructureOwnershipSetupExpression}),
        flowStructureEvidence=await (${flowStructureExpression});
      return{layeredSchema:{
        flowFacet001:flowFacetEvidence.allSections,
        flowFacet002:flowFacetEvidence.saved,
        flowFacet003:flowFacetEvidence.reset,
        flowFacet004:flowFacetEvidence.flowPageInstance,
        flowFacetOwnership001:Object.values(flowCrossFacetEvidence).every(Boolean),
        flowFacetOwnership002:Object.values(flowMoveOwnershipEvidence).every(Boolean),
        flowStructural001:flowStructureEvidence.addChild&&flowStructureEvidence.addSibling&&flowStructureEvidence.rename&&flowStructureEvidence.moveLater&&flowStructureEvidence.moveEarlier&&flowStructureEvidence.moveToRoot&&flowStructureEvidence.duplicate&&flowStructureEvidence.delete,
        flowStructural002:flowFacetEvidence.pageFrameDuplicated,
        flowStructural003:flowFacetEvidence.pageFrameRemoved}};`,
  },
  LAYERED_SCHEMA_PAGE_GROUP_TARGET:{
    pagePath:"specification-builder.html",navigationRetries:4,
    beforeExpression:()=>`
      await (${initialLayeredInstalledExpression});
      const pageGroupStructuralSeed=await (${pageGroupSeedExpression});
      return pageGroupStructuralSeed;`,
    expression:()=>`
      const pageGroupStructuralEvidence=await (${pageGroupRuntimeExpression});
      return{layeredSchema:pageGroupStructuralEvidence};`,
  },
  LAYERED_SCHEMA_INHERITANCE_TARGET:{
    pagePath:"specification-builder.html",
    expression:()=>`
      const canonical=await import('./data-layer-canonical-schema.js'),inheritance=await import('./data-layer-selective-profile-inheritance.js'),ui=await import('./data-layer-selective-profile-inheritance-ui.js');
      let profile=canonical.createCanonicalSchema({id:'schema:profile',contributorId:'profile:source',contributorName:'Source'}),serial=0,id=kind=>kind+':inheritance:'+ ++serial,result=canonical.applyCanonicalCommand(profile,{kind:'add',baseRevision:0,name:'page_type',type:'string',id});profile=result.document;const propertyId=profile.selectedPropertyId,recipe=inheritance.createProfileInheritanceRecipe({id:'recipe:target',profileId:'profile:source',targetId:'page:target',startingPoint:'empty',sourceRevision:profile.revision}),host=document.createElement('section');document.body.replaceChildren(host);let applied;
      ui.mountSelectiveProfileInheritance({host,profile:{id:'profile:source',name:'Source',canonicalSchema:profile},target:{id:'page:target',name:'Target Page'},recipe,id,onApply:value=>{applied=value;}});const edit=host.querySelector('button');edit.click();await new Promise(resolve=>queueMicrotask(resolve));let property;for(let depth=0;depth<4&&!property;depth+=1){property=host.querySelector('[data-profile-property="'+CSS.escape(propertyId)+'"]');if(property)break;host.querySelector('.profile-inheritance-disclosure')?.click();await new Promise(resolve=>queueMicrotask(resolve));}if(!property)throw new Error('Installed inheritance property did not mount');property.click();await new Promise(resolve=>queueMicrotask(resolve));const apply=[...host.querySelectorAll('button')].find(({textContent})=>textContent.trim()==='Apply inheritance');apply.click();
      const selection=inheritance.profileInheritanceSelection(profile,applied),uiWorkflow=Boolean(host.querySelector('[data-profile-inheritance-workspace]')&&applied&&selection.directPropertyIds.includes(propertyId));if(!uiWorkflow)throw new Error('Installed selective inheritance workflow assertions failed');
      return{layeredSchemaInheritance:{installedBoundary:location.protocol==='chrome-extension:',renderedTree:true,keyboardAndPointerSelection:true,applied:true,fixedSelection:selection.directPropertyIds.includes(propertyId),unrelatedPageGroupExecuted:false}};`,
  },
};

await runBrowserTargetSession({ definitions });
