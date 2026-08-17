import path from "node:path";

const structuralClasses=new Set(["registration","packaging","composition","persistence","migration","shared-semantics"]);
const normalized=(value)=>typeof value==="string"&&value.length>0&&!path.posix.isAbsolute(value)&&path.posix.normalize(value)===value&&!value.startsWith("../")&&!value.includes("\\")&&!value.includes("\0");
export function sharedBoundaryDeclarations(packs){return (packs??[]).flatMap(pack=>(pack.sharedBoundaries??[]).map(declaration=>({...declaration,declaredBy:pack.id})));}
export function validateSharedBoundaryDeclarations(packs){
  if(!Array.isArray(packs))throw new Error("Shared boundaries require the canonical verification pack array");const ids=new Set(packs.map(({id})=>id)),observations=new Map(packs.flatMap(pack=>(pack.browserObservations??[]).map(({id})=>[id,pack.id]))),seenIds=new Set(),seenPrefixes=new Set();
  for(const boundary of sharedBoundaryDeclarations(packs)){
    const keys=Object.keys(boundary).filter(key=>key!=="declaredBy").sort().join(",");if(keys!==["consumers","id","owner","prefixes","propagateDependants","qaTargets","structuralClass","terminalFullObligation"].sort().join(","))throw new Error(`Shared boundary ${boundary.id??"declaration"} has missing or unknown fields`);
    if(typeof boundary.id!=="string"||!/^[a-z0-9][a-z0-9_-]*$/u.test(boundary.id)||seenIds.has(boundary.id))throw new Error(`Duplicate or invalid shared boundary identity: ${boundary.id}`);seenIds.add(boundary.id);
    if(boundary.owner!==boundary.declaredBy||!ids.has(boundary.owner))throw new Error(`Shared boundary ${boundary.id} must be declared by its owner pack`);
    if(!Array.isArray(boundary.prefixes)||!boundary.prefixes.length||boundary.prefixes.some(prefix=>!normalized(prefix)||seenPrefixes.has(prefix)))throw new Error(`Shared boundary ${boundary.id} has duplicate or invalid prefixes`);boundary.prefixes.forEach(prefix=>seenPrefixes.add(prefix));
    if(!Array.isArray(boundary.consumers)||new Set(boundary.consumers).size!==boundary.consumers.length||boundary.consumers.some(id=>!ids.has(id)||id===boundary.owner))throw new Error(`Shared boundary ${boundary.id} has an unknown, duplicate, or self-owned consumer`);
    if(!structuralClasses.has(boundary.structuralClass)||boundary.propagateDependants!==false||typeof boundary.terminalFullObligation!=="boolean")throw new Error(`Shared boundary ${boundary.id} has an invalid structural contract`);
    if(!Array.isArray(boundary.qaTargets)||!boundary.qaTargets.length||new Set(boundary.qaTargets).size!==boundary.qaTargets.length||boundary.qaTargets.some(target=>!observations.has(target)||![boundary.owner,...boundary.consumers].includes(observations.get(target))))throw new Error(`Shared boundary ${boundary.id} requires observable QA smoke targets owned by its boundary packs`);
  }
  return packs;
}
export function sharedBoundaryPlanFor(packs,source){const matches=sharedBoundaryDeclarations(packs).filter(({prefixes})=>prefixes.some(prefix=>source===prefix||source.startsWith(prefix.endsWith("/")?prefix:`${prefix}/`)));if(matches.length>1)throw new Error(`Ambiguous shared boundary ownership for ${source}`);const boundary=matches[0];if(!boundary)return null;return{boundaryId:boundary.id,owner:boundary.owner,selected:[...new Set([boundary.owner,...boundary.consumers])],qaTargets:[...boundary.qaTargets],structuralClass:boundary.structuralClass,propagateDependants:false,terminalFullObligation:boundary.terminalFullObligation};}
