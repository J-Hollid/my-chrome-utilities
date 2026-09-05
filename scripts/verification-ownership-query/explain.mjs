import {verificationPackTaskKeys,verificationSliceMapping} from "../verification-packs.mjs";
import {verificationOwnerForPath} from "../verification-planner/ownership/resolve.mjs";
export function ownershipFor(context,file) {
  const pack=verificationOwnerForPath(context.packs,file);
  if(!pack) return {path:file,kind:"unowned",reason:"No declared owner; this is not a safe-scope claim"};
  const mapping=verificationSliceMapping(context.packs,pack,file);
  const quarantined=mapping.kind==="slice"&&context.quarantine.includes(mapping.slice.id);
  return {path:file,owner:pack.id,kind:quarantined?"parent-fallback":mapping.kind,
    slice:mapping.slice?.id??null,reason:quarantined?"Slice is quarantined; conservative parent closure":
      mapping.diagnostic??mapping.slice.observableBoundary,quarantined,
    provenance:context.provenance[pack.id]};
}
export function explainPlan(context,plan,paths,baseContext) {
  const registries=[context,...(baseContext?[baseContext]:[])];
  const owners=registries.flatMap(ctx=>paths.map(p=>ownershipFor(ctx,p)));
  const direct=new Set(),prerequisites=new Set(),slices=[],consumers=[];
  for(const ctx of registries) for(const pack of ctx.packs) {
    for(const id of plan.selectedVerificationSlices?.[pack.id]??[]) {
      const declaration=pack.verificationSlices?.find(s=>s.id===id);
      if(!declaration)continue;
      const provenance={...ctx.provenance[pack.id],pointer:`${ctx.provenance[pack.id].pointer}/verificationSlices/${pack.verificationSlices.indexOf(declaration)}`,
        revision:ctx.head};
      slices.push({id:`slice:${pack.id}/${id}`,packId:pack.id,sliceId:id,provenance,declaration});
      const own=owners.some(o=>o.owner===pack.id&&o.slice===id&&o.kind==="slice");
      if(own) for(const key of declaration.tasks) direct.add(key);
      for(const key of declaration.prerequisites??[])prerequisites.add(key);
      for(const consumer of declaration.consumers??[])consumers.push({...consumer,from:`slice:${pack.id}/${id}`,provenance});
    }
    if(owners.some(o=>o.owner===pack.id&&o.kind==="parent-fallback"))
      for(const key of verificationPackTaskKeys(pack))direct.add(key);
  }
  const checks=plan.tasks.map(t=>({key:t.key,packId:t.packId,stage:t.stage,
    kind:direct.has(t.key)?"direct":prerequisites.has(t.key)?"prerequisite":
      !t.packId||owners.some(o=>o.owner===t.packId)?"prerequisite":"consumer",
    reason:direct.has(t.key)?"Declared owner check":prerequisites.has(t.key)?"Declared slice prerequisite":"Canonical plan closure",
    provenance:context.provenance[t.packId]??baseContext?.provenance[t.packId]??{path:"scripts/verification-planner/tasks/planner.mjs",pointer:null}}));
  const unique=items=>[...new Map(items.map(x=>[JSON.stringify(x),x])).values()];
  return {packIds:plan.packIds,slices:unique(slices),checks,consumers:unique(consumers),
    restrictions:[...(plan.verificationSliceDiagnostics??[]),...(plan.quarantinedSliceIds??[]).map(s=>`quarantined:${s}`)],
    terminalFullObligations:plan.terminalFullObligations??[],parentPackSliceFallbacks:plan.parentPackSliceFallbacks??[]};
}
