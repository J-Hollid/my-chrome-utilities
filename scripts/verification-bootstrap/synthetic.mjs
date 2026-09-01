const supportedStages=["unit","property","acceptance-parse","acceptance-generate",
  "acceptance-session","browser","browser-observation","checkpoint","incident","evidence","package"];

export function validateSyntheticStageFixtures(tasks) {
  if (!Array.isArray(tasks)) throw new Error("Bootstrap synthetic fixtures are invalid");
  const stages=tasks.map(({stage})=>stage);
  const missing=supportedStages.find((stage)=>!stages.includes(stage));
  if (missing) throw new Error(`Bootstrap synthetic fixture is missing stage: ${missing}`);
  if (new Set(stages).size!==supportedStages.length||
      stages.some((stage)=>!supportedStages.includes(stage))) {
    throw new Error("Bootstrap synthetic fixtures contain an unknown or duplicate stage");
  }
  return {passed:true,stages:[...supportedStages]};
}
