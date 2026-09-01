export const stageFixtureTasks = [
  ["unit", "unit:bootstrap"],
  ["property", "property:bootstrap"],
  ["acceptance-parse", "acceptance-parse:bootstrap.feature"],
  ["acceptance-generate", "acceptance-generate:bootstrap.feature"],
  ["acceptance-session", "acceptance-session:verification_process"],
  ["browser", "browser:bootstrap"],
  ["browser-observation", "browser-observation:bootstrap"],
  ["checkpoint", "checkpoint:verification_process:bootstrap"],
  ["package", "package:extension"],
].map(([stage,key])=>({stage,key,display:`run ${key}`}));

export function bootstrapPlan(overrides={}) {
  return {
    version:1,
    task:"verification-process-bootstrap-fast-path",
    baseCommit:"a".repeat(40),
    candidateCommit:"b".repeat(40),
    candidateTree:"c".repeat(40),
    toolchainDigest:"d".repeat(64),
    artifactDigest:"e".repeat(64),
    forecastMs:12_000,
    parentFallback:false,
    packIds:["verification_process"],
    sliceIds:["process_fast_path_bootstrap"],
    changedPaths:[],
    changedPathProjection:[],
    tasks:stageFixtureTasks.filter(({stage})=>!["browser","browser-observation"].includes(stage)),
    ...overrides,
  };
}
