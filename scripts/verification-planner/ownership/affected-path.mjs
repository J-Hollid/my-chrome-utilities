import {ownerOf,values,verificationImplementationPathKeys} from "../../verification-registry/validation.mjs";
import {isRunnablePack as runnable} from "../../verification-pack-cardinality/contract.mjs";
import {sharedBoundaryPlanFor} from "../../verification-shared-boundaries.mjs";
import {stylesheetPlanFor,stylesheetDeclarations} from "../../verification-styles.mjs";
import {exactRuntimeConsumers,exactVerificationConsumers,exactVerificationHelperConsumers,
 globalImpact,impactBoundaryFor} from "./impact.mjs";

export function affectedPath(registry, changedPath, {
  exactVerificationChange = true, forceVerificationExact = false,
} = {}, {explicit,hasFocusedFeatureBoundary,focusedPolicyPath,canonicalRunnableSelection,
  terminalFull,known,modularRegistrySlices,hasExactFeatureSlice}) {
  if ((explicit.size || hasFocusedFeatureBoundary) &&
      focusedPolicyPath(registry, changedPath) &&
      !canonicalRunnableSelection && !terminalFull) {
    return { semantic:[], exactSemantic:[], verificationConsumers:[], boundary:null };
  }
  if (changedPath === "dist" || changedPath.startsWith("dist/")) {
    return { semantic:[], exactSemantic:[], verificationConsumers:[], boundary:null };
  }
  const owner = ownerOf(registry, changedPath);
  if (!owner) throw new Error(`Assign every changed path to one verification pack: ${changedPath}`);
  const sharedPlan=sharedBoundaryPlanFor(registry,changedPath);
  if(sharedPlan)return{semantic:sharedPlan.selected,exactSemantic:[],verificationConsumers:[],boundary:sharedPlan.boundaryId,propagateDependants:false,sharedBoundaryTargets:sharedPlan.qaTargets,terminalFullObligation:sharedPlan.terminalFullObligation};
  const stylePlan = stylesheetPlanFor(registry, changedPath);
  if (stylePlan) {
    const unavailable = stylePlan.selected.filter((id) => !known.has(id));
    if (unavailable.length) {
      throw new Error(`Stylesheet ${changedPath} names unavailable verification consumers: ${unavailable.join(", ")}`);
    }
    return {
      semantic:stylePlan.selected,
      exactSemantic:[],
      verificationConsumers:[],
      boundary:null,
      propagateDependants:false,
      styleSmokeTargets:stylePlan.styleSmokeTargets,
      terminalFullObligation:stylePlan.terminalFullObligation,
    };
  }
  if (changedPath.endsWith(".css") && stylesheetDeclarations(registry).length) {
    throw new Error(`Undeclared stylesheet boundary blocks verification prelaunch: ${changedPath}`);
  }
  const boundary = impactBoundaryFor(owner, changedPath);
  const runtimeConsumers = exactRuntimeConsumers(registry, changedPath);
  const boundaryConsumers = values(boundary ?? {}, "consumers");
  const helperConsumers = exactVerificationHelperConsumers(registry, changedPath);
  const exactFeatureSlice = hasExactFeatureSlice(registry, changedPath);
  const verificationOwned = exactVerificationChange && (forceVerificationExact ||
    verificationImplementationPathKeys.some((key) => values(owner, key).includes(changedPath)) ||
    values(owner, "isolatedVerificationHandlers").includes(changedPath)
  );
  const semantic = helperConsumers.length || verificationOwned || exactFeatureSlice ? []
      : globalImpact(registry, changedPath, modularRegistrySlices ? owner : undefined)
      ? [owner.id, ...registry.filter(runnable).map(({ id }) => id)]
      : [...(boundary && !boundary.propagateDependants ? [] : [owner.id]), ...runtimeConsumers];
  const exactSemantic = verificationOwned || exactFeatureSlice || boundary && !boundary.propagateDependants
    ? [owner.id, ...boundaryConsumers] : [];
  const verificationConsumers = exactFeatureSlice ? [] : [
    ...exactVerificationConsumers(registry, changedPath), ...helperConsumers,
  ];
  const unavailable = [...new Set([...semantic, ...verificationConsumers])]
    .filter((id) => !known.has(id));
  if (unavailable.length) {
    throw new Error(`Historical verification owner is unavailable for ${changedPath}: ${unavailable.join(", ")}`);
  }
  return {
    semantic:[...new Set(semantic)],
    exactSemantic:[...new Set(exactSemantic)],
    verificationConsumers:[...new Set(verificationConsumers)],
    boundary:boundary?.id ?? null,
    fallbackPropagateDependants:boundary?.fallbackPropagateDependants === true,
  };
}
