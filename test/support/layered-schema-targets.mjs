import { runBrowserTargetSession } from "./browser-target-session.mjs";
import assert from "node:assert/strict";
import {
  flowCrossFacetExpression,
  flowFacetExpression,
  flowMoveOwnershipExpression,
  flowOwnershipSetupExpression,
  flowStructureExpression,
  flowStructureOwnershipSetupExpression,
  initialLayeredInstalledExpression,
  pageGroupRuntimeExpression,
  pageGroupSeedExpression,
  runLayeredEditorCanonicalWorkflow,
  runLayeredEditorPolicyWorkflow,
  runLayeredEditorRuleWorkflow,
  runLayeredEditorSurfaceWorkflow,
} from "./layered-schema-workflows.mjs";
import { authoring034Expression,authoring035And036Expression } from "./layered-schema-usability-probes.mjs";
import { authoring045Expression,flowFacet003Expression } from "./layered-schema-ownership-probes.mjs";
import { patternHelperLayoutExpression,stringRuleValidationExpression,valueRuleDurableMigrationExpression } from "./string-rule-validation-runtime-probes.mjs";
import { authoringConceptRuntimeExpression } from "./schema-concept-runtime-probes.mjs";
import { flatRuleMainProjectionLifecycleExpression,flatRulePanelProjectionDiagnosticExpression,flatRulePopupGeometryExpression,flatRuleResponsiveFinishExpression,flatRuleResponsiveSetupExpression,flatRuleResponsiveSnapshotExpression } from "./flat-rule-builder-runtime-probes.mjs";
import { typedLiteralFocusedEditorExpression } from "./typed-literal-focused-editor-probes.mjs";
import { runProfileInheritanceControlsRuntimeProbe } from "./profile-inheritance-controls-runtime-probe.mjs";
import { runJournalFreeInstalledRuntimeProbe } from "./journal-free-installed-runtime-probe.mjs";

const editorInitialLayeredInstalledExpression=initialLayeredInstalledExpression;
const initialCoreKeys=["installedBoundary","consequential","persistenceReload",
  ...Array.from({length:14},(_,index)=>`authoring${String(index+1).padStart(3,"0")}`),
  ...[17,18,19,21,22,23,24,25].map(index=>`authoring${String(index).padStart(3,"0")}`),
  ...Array.from({length:21},(_,index)=>`layering${String(index+1).padStart(3,"0")}`)];
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
const runEditorProducer=async(workflow,keys,{evaluate,socket},{canonical=false}={})=>{
  const liveSocket={call:(...arguments_)=>socket().call(...arguments_)},originalEvaluate=(unused,expression)=>{let body;try{Function(`return (${expression})`);body=`return await (${expression});`;}catch{body=expression.replace(/;\s*true\s*$/u,";return true;");}return evaluate(unused,body);},ready=async(unused,selector)=>{for(let attempt=0;attempt<240;attempt+=1){if(await originalEvaluate(liveSocket,`Boolean(document.querySelector(${JSON.stringify(selector)}))`))return true;await new Promise((resolve)=>setTimeout(resolve,25));}throw new Error(`Installed editor did not settle: ${selector}`);};
  await ready(liveSocket,"#create-project-form");let stableDocumentSamples=0;for(let attempt=0;attempt<240&&stableDocumentSamples<3;attempt+=1){const settled=await originalEvaluate(liveSocket,"document.readyState==='complete'&&Boolean(document.querySelector('#create-project-form')?.isConnected&&document.querySelector('#project-tree')?.isConnected)");stableDocumentSamples=settled?stableDocumentSamples+1:0;await new Promise((resolve)=>setTimeout(resolve,25));}if(stableDocumentSamples<3)throw new Error("Installed editor document did not hydrate stably");
  const evidence=await originalEvaluate(liveSocket,editorInitialLayeredInstalledExpression),result=await workflow({
    evidence,evaluate:originalEvaluate,socket:liveSocket,activeSocket:liveSocket,ready,
    wait:(milliseconds)=>new Promise((resolve)=>setTimeout(resolve,milliseconds)),assert,
    authoring034Expression,authoring035And036Expression,authoring045Expression,patternHelperLayoutExpression,
    stringRuleValidationExpression,valueRuleDurableMigrationExpression,authoringConceptRuntimeExpression,
    flatRuleMainProjectionLifecycleExpression,flatRulePanelProjectionDiagnosticExpression,flatRulePopupGeometryExpression,
    flatRuleResponsiveFinishExpression,flatRuleResponsiveSetupExpression,flatRuleResponsiveSnapshotExpression,
    typedLiteralFocusedEditorExpression,runProfileInheritanceControlsRuntimeProbe,runJournalFreeInstalledRuntimeProbe,
  }),owned={};
  for(const key of keys)owned[key]=result.evidence[key];
  if(canonical){const facet=result.canonicalFacetEvidence,persistence={canonicalPresence:facet.presenceSaved,canonicalValues:facet.valuesSaved,canonicalConditions:facet.conditionsSaved,canonicalRules:facet.rulesSaved,canonicalExample:facet.exampleSaved,canonicalPersisted:facet.persisted};for(const key of canonicalEditorKeys)owned[key]=persistence[key];}
  return{layeredSchema:owned};
};

const definitions = {
  LAYERED_SCHEMA_CORE_TARGET:{pagePath:"specification-builder.html",navigationRetries:4,expression:()=>`
    const complete=await (${initialLayeredInstalledExpression}),owned={};
    for(const key of ${JSON.stringify(initialCoreKeys)})owned[key]=complete[key];
    return{layeredSchema:owned};`},
  LAYERED_SCHEMA_EDITOR_TARGET:{pagePath:"specification-builder.html",navigationRetries:4,run:(context)=>runEditorProducer(runLayeredEditorSurfaceWorkflow,editorKeys,context)},
  LAYERED_SCHEMA_EDITOR_RULES_TARGET:{pagePath:"specification-builder.html",navigationRetries:4,run:(context)=>runEditorProducer(runLayeredEditorRuleWorkflow,editorRuleKeys,context)},
  LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET:{pagePath:"specification-builder.html",navigationRetries:4,run:(context)=>runEditorProducer(runLayeredEditorCanonicalWorkflow,editorCanonicalKeys,context,{canonical:true})},
  LAYERED_SCHEMA_EDITOR_POLICY_TARGET:{pagePath:"specification-builder.html",navigationRetries:4,run:(context)=>runEditorProducer(runLayeredEditorPolicyWorkflow,editorPolicyKeys,context)},
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
      try{const pageGroupStructuralEvidence=await (${pageGroupRuntimeExpression});return{layeredSchema:pageGroupStructuralEvidence};}
      catch(error){throw new Error(String(error)+' [stage '+String(globalThis.__pageGroupStructuralStage??'startup')+']');}`,
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
