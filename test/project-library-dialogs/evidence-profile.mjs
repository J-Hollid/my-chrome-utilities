import {projectDialogPaths,projectDialogHandlerCoverage} from "./registry-contract.mjs";

/** Keep historical evidence comparable while exposing the complete current owner. */
export async function projectDialogEvidence(evidence, pack) {
  const conservation=evidence.conservation;
  const withoutDialogs=paths=>paths.filter(path=>!projectDialogPaths.has(path));
  const profile=value=>Object.fromEntries(Object.entries(value).map(([key,paths])=>[key,withoutDialogs(paths)]));
  return {...evidence,
    handler:{...evidence.handler,paths:pack.isolatedVerificationHandlers,
      servedFeatures:await projectDialogHandlerCoverage(pack,evidence.handler.servedFeatures)},
    conservation:{...conservation,
      evidenceProfile:profile(conservation.evidenceProfile),
      preDialogExecutionProfile:profile(conservation.executionProfile),
      conservedTaskTargets:profile(conservation.conservedTaskTargets)},
  };
}
