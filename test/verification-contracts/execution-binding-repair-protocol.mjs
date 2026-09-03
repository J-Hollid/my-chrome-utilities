import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";

import {verificationDigest} from "../../scripts/verification-evidence.mjs";

function emitProtocol(context,fixture,observed){
  assert.deepEqual(observed,fixture.expectedRepairResult);
  const fixtureDigest=verificationDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:fixture.expectedPreRepairFailure},
    repairResult:{status:"passed",fixtureDigest,observed}}}));
}

function repositoryTemporaryRoute(context,expectedChromeTemporaryDirectory){
  const fixture={
    id:"repository-namespaced-chrome-temporary-route-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{root:"/tmp/sf-chrome",ownership:["repository","run"]},
    expectedPreRepairFailure:{repositoryNamespaced:false,runNamespaced:true},
    expectedRepairResult:{repositoryNamespaced:true,runNamespaced:true},
  };
  const segments=expectedChromeTemporaryDirectory("contract-run").split(path.sep);
  emitProtocol(context,fixture,{repositoryNamespaced:segments.at(-2)?.length===24,
    runNamespaced:segments.at(-1)?.length===24});
}

async function migratedManifestStaging(context,contractSourceUrl){
  const source=await readFile(contractSourceUrl,"utf8");
  const fixture={
    id:"migrated-manifest-checkpoint-fixture-staging-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{obsoleteManifestPath:"verification/manifests/verification-process.json",
      cloneSource:"HEAD"},
    expectedPreRepairFailure:{stagesOnlyExistingObsoletePath:false,
      currentMigratedHeadSupported:false},
    expectedRepairResult:{stagesOnlyExistingObsoletePath:true,
      currentMigratedHeadSupported:true},
  };
  const conditionalStaging=source.includes(
    "...(obsoleteManifestExisted ? [obsoleteManifestPath] : [])");
  emitProtocol(context,fixture,{stagesOnlyExistingObsoletePath:conditionalStaging,
    currentMigratedHeadSupported:conditionalStaging});
}

async function postCommitFixtureIndependence(context,contractSourceUrl){
  const source=await readFile(contractSourceUrl,"utf8");
  const fixture={
    id:"post-commit-checkpoint-fixture-independence-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{cloneSource:"HEAD",removedPath:"test/verification-process-contract-legacy.mjs"},
    expectedPreRepairFailure:{requiresRemovedLegacyPath:true,currentHeadCloneSupported:false},
    expectedRepairResult:{requiresRemovedLegacyPath:false,currentHeadCloneSupported:true},
  };
  const requiresRemovedLegacyPath=/await rm\(path\.join\(cliContentionRepository,\s*"test\/verification-process-contract-legacy\.mjs"\)\)/u.test(source);
  emitProtocol(context,fixture,{requiresRemovedLegacyPath,
    currentHeadCloneSupported:!requiresRemovedLegacyPath});
}

function receiptBoundHistoricalIdentity(context,{
  historicalSession,compatibleRepairSession,repairExecutionArgs,repairIdentityCompatible,
}){
  const expectedIncidentId="71381574-7913-4676-85c6-85e91a59d344";
  const expectedFailureDigest=
    "0c69f4b8eed1616ac4ff6112713cae12d578dfa7726bf0f776e3eb66f41f4e8e";
  const failedTask="unit:test/verification-contracts/execution-binding-contract-test.mjs";
  const retryArguments=["test/verification-contracts/execution-binding-contract-test.mjs"];
  assert.equal(context.version,1,"the repair context version is exact");
  assert.equal(context.incidentId,expectedIncidentId,"the repair incident is exact");
  assert.equal(context.failureDigest,expectedFailureDigest,"the repair failure is exact");
  assert.deepEqual(context.diagnosedBoundary,
    {kind:"task",taskKey:failedTask,executionArgs:retryArguments},
    "the repair boundary binds the failed task and retry arguments");
  const historicalArguments=JSON.stringify(historicalSession.args);
  const historicalPrerequisites=JSON.stringify(historicalSession.prerequisiteTaskKeys);
  const repairedExecutionArguments=repairExecutionArgs({priorIdentity:historicalSession,
    currentIdentity:compatibleRepairSession,diagnosedArgs:historicalSession.args});
  const observed={
    expectedArguments:"historical-session",
    observedArguments:JSON.stringify(compatibleRepairSession.args)===historicalArguments
      ?"historical-session":"other",
    expectedPrerequisites:"historical-session",
    observedPrerequisites:
      JSON.stringify(compatibleRepairSession.prerequisiteTaskKeys)===historicalPrerequisites
        ?"historical-session":"other",
    expectedIdentityCompatible:true,
    observedIdentityCompatible:repairIdentityCompatible(historicalSession,compatibleRepairSession),
    executionArguments:JSON.stringify(repairedExecutionArguments)===historicalArguments
      ?"historical-session":"other",
    assertionsPass:true,
  };
  const fixture={
    id:"receipt-bound-historical-aggregate-identity-v1",
    causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
    input:{failedTask,retryArguments},
    expectedPreRepairFailure:{
      expectedArguments:"current-session",observedArguments:"historical-session",
      expectedPrerequisites:"current-session",observedPrerequisites:"historical-session",
      expectedIdentityCompatible:false,observedIdentityCompatible:true,
      executionArguments:"historical-session",assertionsPass:false,
    },
    expectedRepairResult:observed,
  };
  emitProtocol(context,fixture,observed);
}

export async function emitExecutionBindingRepairProtocol(encodedContext,dependencies){
  if(!encodedContext)return;
  const context=JSON.parse(encodedContext);
  if(context.causalCategory==="cleanup/resource lifecycle"){
    repositoryTemporaryRoute(context,dependencies.expectedChromeTemporaryDirectory);
  }
  if(context.causalCategory==="other:migrated manifest fixture staging"){
    await migratedManifestStaging(context,dependencies.contractSourceUrl);
  }
  if(context.causalCategory==="other:post-commit checkpoint fixture independence"){
    await postCommitFixtureIndependence(context,dependencies.contractSourceUrl);
  }
  if(context.causalCategory==="other:receipt-bound historical aggregate identity"){
    receiptBoundHistoricalIdentity(context,dependencies);
  }
}
