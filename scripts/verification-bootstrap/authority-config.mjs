export const bootstrapTask="verification-process-bootstrap-fast-path";
export const bootstrapBaseCommit="2514c073218f6ab488d7478b4cbc2d1f0bfd7791";

export const bootstrapPathDeclarations=[
  {prefix:"scripts/verification-bootstrap/",owner:"transition-only",
    sliceId:"process_fast_path_bootstrap"},
  {prefix:"test/verification-bootstrap/",owner:"transition-only",
    sliceId:"process_fast_path_bootstrap"},
  {path:"acceptance/src/acceptance/verification_support/bootstrap_fast_path_handlers.clj",
    owner:"verification_process",sliceId:"process_fast_path_bootstrap"},
  {path:"acceptance/src/acceptance/bootstrap_session.clj",
    owner:"verification_process",sliceId:"process_fast_path_bootstrap"},
  {path:"scripts/settled-final-verification-review.mjs",
    owner:"verification_process",sliceId:"process_fast_path_bootstrap"},
];

const feature="features/verification-process-bootstrap-fast-path.feature";
const ir="build/acceptance/ir/verification-process-bootstrap-fast-path.json";
const generated="build/acceptance/generated/features-verification-process-bootstrap-fast-path-feature_acceptance_test.clj";

function task(key,stage,command,forecastMs) {
  return {key,stage,display:command.join(" "),command,forecastMs};
}

export const bootstrapTasks=[
  task("checkpoint:bootstrap:conservation","checkpoint",
    ["node","scripts/refresh-verification-contract-conservation.mjs","check"],2_000),
  task("unit:test/verification-contracts/administration-acceptance-dependencies-test.mjs","unit",
    ["node","test/verification-contracts/administration-acceptance-dependencies-test.mjs"],2_000),
  task("checkpoint:bootstrap:toolchain","checkpoint",
    ["node","scripts/check-swarmforge-toolchain.mjs"],5_000),
  task("unit:test/verification-bootstrap/bootstrap-fast-path-test.mjs","unit",
    ["node","test/verification-bootstrap/bootstrap-fast-path-test.mjs"],2_000),
  task(`acceptance-parse:${feature}`,"acceptance-parse",
    ["bb","gherkin-parser",feature,ir],2_000),
  task(`acceptance-generate:${feature}`,"acceptance-generate",
    ["bb","acceptance-entrypoint-generator",ir,"build/acceptance/generated"],2_000),
  task("acceptance-session:verification_process:bootstrap","acceptance-session",
    ["bb","-m","acceptance.bootstrap-session",generated,ir],30_000),
  task("package:extension","package",["node","scripts/package.mjs"],10_000),
];
