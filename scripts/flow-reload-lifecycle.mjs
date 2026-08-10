import {createHash} from "node:crypto";

const lifecycleIdentityFields=[
  "targetId","pageTargetId","origin","storageIdentity","projectId","flowId","reloadSequence",
];

export const FLOW_WORKSPACE_CONTROLS_RELOAD_SEQUENCE=Object.freeze([
  "geometry:narrowHiddenClosed","geometry:narrowHiddenOpen","geometry:narrowVisibleClosed","geometry:narrowVisibleOpen",
  "geometry:wideHiddenClosed","geometry:wideHiddenOpen","geometry:wideVisibleClosed","geometry:wideVisibleOpen",
  "runtime001","runtime027:setup",
  "runtime027:pan:mainPrimaryBlank","runtime027:pan:focusPrimaryBlank",
  "runtime027:pan:mainSpaceItem","runtime027:pan:focusSpaceItem",
  "runtime027:pan:mainMiddleBlank","runtime027:pan:focusMiddleBlank",
  "runtime027:pan:mainTouch","runtime027:pan:focusTouch",
  "runtime027:pan:mainKeyboard","runtime027:pan:focusKeyboard",
  "runtime027:pinch:mainPanPinch","runtime027:pinch:focusPanPinch",
  "runtime027:restore","core-workflow:evidence",
]);

export function canonicalFlowReloadIdentity(input){
  return Object.fromEntries(lifecycleIdentityFields.map(field=>[field,structuredClone(input[field])]));
}

export function assessFlowReloadLifecycle(observed){
  if(observed.initializationError){
    const error=new Error(`Flow reload current-document-initialization failed: ${observed.initializationError}`);
    error.stage="current-document-initialization";
    error.state={generation:observed.generation,expectedGeneration:observed.expectedGeneration,initializationError:observed.initializationError};
    throw error;
  }
  if(observed.generation!==observed.expectedGeneration||observed.initializationComplete!==true)
    return{ready:false,stage:"current-document-initialization",state:{generation:observed.generation,expectedGeneration:observed.expectedGeneration,initializationComplete:Boolean(observed.initializationComplete),...(observed.initializationStage?{initializationStage:observed.initializationStage}:{})}};
  if(observed.repositoryOpen!==true)
    return{ready:false,stage:"repository-open",state:{repositoryOpen:Boolean(observed.repositoryOpen),repositoryError:observed.repositoryError}};
  if((observed.expectedProjectId!==undefined&&observed.activeProjectId!==observed.expectedProjectId)||observed.activeProjectId===undefined)
    return{ready:false,stage:"expected-active-project",state:{activeProjectId:observed.activeProjectId,expectedProjectId:observed.expectedProjectId}};
  if(!Array.isArray(observed.navigationKinds)||!observed.navigationKinds.includes("flows"))
    return{ready:false,stage:"populated-project-navigation",state:{navigationKinds:observed.navigationKinds??[]}};
  if((observed.expectedFlowId!==undefined&&observed.requestedFlowId!==observed.expectedFlowId)||observed.flowMounted!==true||observed.flowPainted!==true)
    return{ready:false,stage:"requested-flow-painted",state:{requestedFlowId:observed.requestedFlowId,expectedFlowId:observed.expectedFlowId,flowMounted:Boolean(observed.flowMounted),flowPainted:Boolean(observed.flowPainted)}};
  return{ready:true,stage:"ready",state:{flowId:observed.requestedFlowId,painted:true}};
}

export async function observeFlowReloadLifecycle({observe,maximumObservations=20}){
  let assessment;
  for(let observation=1;observation<=maximumObservations;observation+=1){
    assessment=assessFlowReloadLifecycle(await observe(observation));
    if(assessment.ready)return{...assessment,observationCount:observation};
  }
  const error=new Error(`Flow reload lifecycle remained at ${assessment?.stage??"unknown"}`);
  error.stage=assessment?.stage??"unknown";
  error.state=assessment?.state;
  throw error;
}

export function classifyFlowReloadModes(ordinary,repair,outcome={}){
  const same=JSON.stringify(ordinary)===JSON.stringify(repair);
  if(!same)return{domain:"verification-execution",obligation:"canonical-mode-equivalence-repair"};
  if(outcome.initializationFailed||outcome.routeRestorationFailed)
    return{domain:"product-runtime",obligation:"causal-product-repair"};
  return{domain:"verification-execution",obligation:"deterministic-process-regression"};
}

export function normalizedFlowReloadDiagnostic(value){
  return String(value)
    .replace(/\/tmp\/(?:sf-chrome|[^\s/:]+)[^\s]*/g,"<temporary-path>")
    .replace(/\battempt(?:[ _-]?id)?(?:\s*[=:]\s*|\s+)[A-Za-z0-9-]+\b/gi,"attempt <id>")
    .replace(/\b\d+(?:\.\d+)?\s*ms\b/gi,"<duration>")
    .replace(/\b\d+\s+polls?\b/gi,"<polls>")
    .replace(/\s+/g," ").trim();
}

export function flowReloadCausalKey({targetId,reloadBoundary,stage,diagnostic}){
  return createHash("sha256").update(JSON.stringify({
    targetId,reloadBoundary,stage,diagnostic:normalizedFlowReloadDiagnostic(diagnostic),
  })).digest("hex");
}
