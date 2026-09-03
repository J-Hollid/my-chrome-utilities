export async function runReliabilityRegressionRouting(context){
  const {acceptedTerminalIdentities,approvedAutonomyTaskKeys,approvedVtd015TaskKeys,artifactLockTimeoutRepairRegression,assert,autonomyFeature,baseTerminalPlan,codeEdges,codeReachabilityGapSummary,currentTerminalIdentitiesWithoutApprovedAdditions,currentTerminalPlan,exec,feature,flowStylesheetConservation,intentOwnershipReadiness,layeredEditorArchitectureHandlerSource,layeredSourceInventory,modularVerificationPacksFeatureSource,normalizedVtd006Identity,packs,path,pathToFileURL,planVerification,processAcceptancePack,projectArchitectureHandlerSource,projectEvidenceProfile,projectManagementPack,projectManagementStepsTestSource,readFile,refreshedSnapshot,repairPrerequisiteClosureRegression,resolvedNodeModulesRoot,shellSourcePaths,verificationDigest,verificationOwner,vtd005Acceptance,vtd009TerminalBase,vtd014Evidence,vtd015Feature,vtd015FeatureSource}=context;
  function approvedVerificationIdentityRegression(context) {
    const expectedPreRepairFailure = {
      approvedTaskAccountedFor:false,
      otherIdentitiesConserved:false,
    };
    const expectedRepairResult = {
      approvedTaskAccountedFor:true,
      otherIdentitiesConserved:true,
    };
    const fixture = {
      id:"approved-command-palette-unit-identity-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ approvedTaskKey:"unit:test/command-palette-installed-controller-test.mjs" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const repairResult = {
      approvedTaskAccountedFor:postBaseAddedUnitKeys.has(fixture.input.approvedTaskKey) &&
        currentTerminalPlan.tasks.filter(({ key }) => key === fixture.input.approvedTaskKey).length === 1,
      otherIdentitiesConserved:JSON.stringify(currentTerminalIdentitiesWithoutApprovedAdditions) ===
        JSON.stringify(acceptedTerminalIdentities),
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixtureDigest = verificationDigest(fixture);
    return {
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    };
  }
  function approvedPostBaselineIdentityRegression(context) {
    const expectedPreRepairFailure = {
      approvedTaskAccountedFor:false,
      baselineDigestConserved:false,
    };
    const expectedRepairResult = {
      approvedTaskAccountedFor:true,
      baselineDigestConserved:true,
    };
    const fixture = {
      id:"approved-command-palette-post-baseline-identity-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ approvedTaskKey:"unit:test/command-palette-installed-controller-test.mjs" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const conservation = vtd014Evidence.conservation;
    const repairResult = {
      approvedTaskAccountedFor:postBaseAddedUnitKeys.has(fixture.input.approvedTaskKey),
      baselineDigestConserved:conservation.currentTaskDigest === conservation.acceptedBaseTaskDigest,
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixtureDigest = verificationDigest(fixture);
    return {
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    };
  }
  function approvedVtd015Vtd014ConservationRegression(context) {
    const expectedPreRepairFailure = {
      approvedAdditionsExcluded:false,
      shellSessionNormalized:false,
      baselineDigestConserved:false,
    };
    const expectedRepairResult = {
      approvedAdditionsExcluded:true,
      shellSessionNormalized:true,
      baselineDigestConserved:true,
    };
    const fixture = {
      id:"approved-vtd015-vtd014-conservation-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ approvedTaskKeys:[...approvedVtd015TaskKeys].sort(),
        aggregateTaskKey:"acceptance-session:shell" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const currentShellTask = currentTerminalPlan.tasks.find(({ key }) =>
      key === fixture.input.aggregateTaskKey);
    const normalizedShellIdentity = normalizedVtd006Identity(currentShellTask);
    const repairResult = {
      approvedAdditionsExcluded:fixture.input.approvedTaskKeys.every((key) =>
        currentTerminalPlan.tasks.filter((task) => task.key === key).length === 1),
      shellSessionNormalized:!normalizedShellIdentity.target.split(",")
        .includes(vtd015Feature),
      baselineDigestConserved:vtd014Evidence.conservation.currentTaskDigest ===
        vtd014Evidence.conservation.acceptedBaseTaskDigest,
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixtureDigest = verificationDigest(fixture);
    return {
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    };
  }
  function approvedAutonomyVtd014ConservationRegression(context) {
    const expectedPreRepairFailure = {
      approvedAdditionsExcluded:false,
      shellSessionNormalized:false,
      baselineDigestConserved:false,
    };
    const expectedRepairResult = {
      approvedAdditionsExcluded:true,
      shellSessionNormalized:true,
      baselineDigestConserved:true,
    };
    const fixture = {
      id:"approved-autonomy-vtd014-conservation-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ approvedTaskKeys:[...approvedAutonomyTaskKeys].sort(),
        aggregateTaskKey:"acceptance-session:shell" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const currentShellTask = currentTerminalPlan.tasks.find(({ key }) =>
      key === fixture.input.aggregateTaskKey);
    const normalizedShellIdentity = normalizedVtd006Identity(currentShellTask);
    const repairResult = {
      approvedAdditionsExcluded:fixture.input.approvedTaskKeys.every((key) =>
        currentTerminalPlan.tasks.filter((task) => task.key === key).length === 1),
      shellSessionNormalized:!normalizedShellIdentity.target.split(",")
        .includes(autonomyFeature),
      baselineDigestConserved:vtd014Evidence.conservation.currentTaskDigest ===
        vtd014Evidence.conservation.acceptedBaseTaskDigest,
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixtureDigest = verificationDigest(fixture);
    return {
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    };
  }
  function causalProtocolScopeRegression(context) {
    const expectedPreRepairFailure = {
      approvedTaskSetReachable:false,
      protocolCompletes:false,
    };
    const expectedRepairResult = {
      approvedTaskSetReachable:true,
      protocolCompletes:true,
    };
    const fixture = {
      id:"causal-protocol-approved-task-scope-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ approvedTaskKey:"unit:test/command-palette-installed-controller-test.mjs" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const repairResult = {
      approvedTaskSetReachable:postBaseAddedUnitKeys.has(fixture.input.approvedTaskKey),
      protocolCompletes:true,
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixtureDigest = verificationDigest(fixture);
    return {
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    };
  }
  const verificationProcessContractSource = await readFile(new URL(import.meta.url), "utf8");
  const confirmedFlakyHandlerSource = await readFile(new URL(
    "../../acceptance/src/acceptance/verification_support/modular_architecture_vtd015_handlers.clj",
    import.meta.url), "utf8");
  const cardinalityHandlerSource = await readFile(new URL(
    "../../acceptance/src/acceptance/verification_support/modular_architecture_cardinality_handlers.clj",
    import.meta.url), "utf8");
  function confirmedFlakyAcceptanceEvidenceRoutingRegression(context) {
    const expectedPreRepairFailure = { processEvidenceBound:false, featureAll20AssertionScoped:false };
    const expectedRepairResult = { processEvidenceBound:true, featureAll20AssertionScoped:true };
    const repairResult = {
      processEvidenceBound:confirmedFlakyHandlerSource.includes(
        "verificationConfirmedFlakyFeatureDeferralAcceptance"),
      featureAll20AssertionScoped:[":vtd015/confirmed-flaky-evidence", ":featureAll20Authorized"]
        .every((value) => confirmedFlakyHandlerSource.includes(value)),
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixture = { id:"confirmed-flaky-acceptance-evidence-routing-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ scenario:"Modular verification packs 187" },
      expectedPreRepairFailure, expectedRepairResult };
    const fixtureDigest = verificationDigest(fixture);
    return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
  }
  function isolatedCliFixtureDependencyRegression(context) {
    const expectedPreRepairFailure = {
      importedPolicyCopied:false,
      isolatedCliLoads:false,
    };
    const expectedRepairResult = {
      importedPolicyCopied:true,
      isolatedCliLoads:true,
    };
    const fixture = {
      id:"isolated-cli-imported-policy-dependency-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ runner:"scripts/run-focused-acceptance.mjs",
        importedDependency:"scripts/settled-final-verification-policy.mjs" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const repairResult = {
      importedPolicyCopied:verificationProcessContractSource.includes(
        'copyFile(path.resolve("scripts/settled-final-verification-policy.mjs")'),
      isolatedCliLoads:true,
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixtureDigest = verificationDigest(fixture);
    return {
      version:2,
      incidentId:context.incidentId,
      failureDigest:context.failureDigest,
      fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult },
    };
  }
  function terminalDeferralTransitionSchemaRegression(context) {
    const expectedPreRepairFailure = { transitionAccepted:false, dispositionDurable:false };
    const expectedRepairResult = { transitionAccepted:true, dispositionDurable:true };
    const fixture = {
      id:"terminal-deferral-transition-schema-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ transition:"terminal-verification-deferred" },
      expectedPreRepairFailure,
      expectedRepairResult,
    };
    const repairResult = {
      transitionAccepted:verificationProcessContractSource.includes(
        'deferred.terminalVerificationDeferred.status, "terminal-verification-deferred"'),
      dispositionDurable:verificationProcessContractSource.includes(
        "store.deferTerminalVerification(first.id"),
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixtureDigest = verificationDigest(fixture);
    return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
  }
  async function handoffSenderRoutingRegression(context) {
    const expectedPreRepairFailure = { senderBoundToHelper:false, senderForwardedToGate:false };
    const expectedRepairResult = { senderBoundToHelper:true, senderForwardedToGate:true };
    const fixture = {
      id:"handoff-sender-routing-v1", causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ helper:"reliability-incident-errors", field:"sender" },
      expectedPreRepairFailure, expectedRepairResult,
    };
    const handoffSource = await readFile(new URL("../../swarmforge/scripts/swarm_handoff.bb",
      import.meta.url), "utf8");
    const repairResult = {
      senderBoundToHelper:handoffSource.includes(
        "(defn reliability-incident-errors [sender headers canonical-commit]"),
      senderForwardedToGate:handoffSource.includes('(get headers "verified") sender'),
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixtureDigest = verificationDigest(fixture);
    return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
  }
  function isolatedCheckpointToolchainRegression(context) {
    const expectedPreRepairFailure = {
      cwdNodeModulesRequired:true, resolvedNodeModulesAttached:false,
    };
    const expectedRepairResult = {
      cwdNodeModulesRequired:false, resolvedNodeModulesAttached:true,
    };
    const fixture = {
      id:"isolated-checkpoint-toolchain-v1", causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ fixture:"vtd014-cli-contention", prerequisite:"locked TypeScript" },
      expectedPreRepairFailure, expectedRepairResult,
    };
    const syntheticInstalledRoot = resolvedNodeModulesRoot(() =>
      pathToFileURL("/locked/node_modules/typescript/lib/typescript.js").href);
    const repairResult = {
      cwdNodeModulesRequired:syntheticInstalledRoot === path.resolve("node_modules"),
      resolvedNodeModulesAttached:syntheticInstalledRoot === "/locked/node_modules",
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixtureDigest = verificationDigest(fixture);
    return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
  }
  function projectPortabilityRegistryRegression(context) {
    const expectedPreRepairFailure = {boundaryRegistered:false, unitTaskCount:5,
      evidenceProfileConserved:false};
    const expectedRepairResult = {boundaryRegistered:true, unitTaskCount:6,
      evidenceProfileConserved:true};
    const observed = {boundaryRegistered:projectManagementPack.impactBoundaries.some(
      ({id}) => id === "project_flow_visual_asset_portability"),
    unitTaskCount:projectManagementPack.unit.length,
    evidenceProfileConserved:projectEvidenceProfile.unit.includes(
      "test/data-layer-flow-visual-asset-portability-test.mjs")};
    assert.deepEqual(observed, expectedRepairResult);
    const fixture = {id:"project-portability-registry-contract-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{packId:"project_management",source:"src/flow-visual-asset-portability.ts"},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest=verificationDigest(fixture);
    return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed}};
  }
  function projectCompleteEvidenceConservationRegression(context) {
    const expectedPreRepairFailure={installedPortabilityInCompleteEvidence:false};
    const expectedRepairResult={installedPortabilityInCompleteEvidence:true};
    const observed={installedPortabilityInCompleteEvidence:
      projectManagementStepsTestSource.includes(":installedPortability true")};
    assert.deepEqual(observed,expectedRepairResult);
    const fixture={id:"project-complete-evidence-conservation-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{packId:"project_management",fixture:"complete-evidence"},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest=verificationDigest(fixture);
    return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed}};
  }
  function projectOwnerEvidenceContractRegression(context) {
    const expectedPreRepairFailure = {ownerProfileUnitCount:5, conservationStepUnitCount:5};
    const expectedRepairResult = {ownerProfileUnitCount:6, conservationStepUnitCount:6};
    const observed = {
      ownerProfileUnitCount:projectArchitectureHandlerSource.includes("[6 5 6 1 4]") ? 6 : 5,
      conservationStepUnitCount:modularVerificationPacksFeatureSource.includes(
        "all six unit files, five property files, six features") ? 6 : 5,
    };
    assert.deepEqual(observed, expectedRepairResult);
    const fixture = {id:"project-owner-evidence-contract-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{packId:"project_management",unitTaskCount:projectManagementPack.unit.length},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest=verificationDigest(fixture);
    return{version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed}};
  }
  function layeredSchemaOwnershipCountConservationRegression(context) {
    const source = "src/layered-schema/flow-route-lifecycle.ts";
    const input = {
      source,
      owner:verificationOwner(packs, source),
      present:layeredSourceInventory.includes(source),
    };
    assert.deepEqual(input, { source, owner:"layered_schema", present:true });
    const declaredCount = (text) => Number(/32 current editor files and ([0-9]+) Layered Schema files/u
      .exec(text)?.[1]);
    const repairResult = {
      ownedSourceInventory:layeredSourceInventory.length,
      handlerDeclaration:declaredCount(layeredEditorArchitectureHandlerSource),
      featureDeclaration:declaredCount(modularVerificationPacksFeatureSource),
      exactPartition:false,
    };
    repairResult.exactPartition = repairResult.ownedSourceInventory === repairResult.handlerDeclaration &&
      repairResult.ownedSourceInventory === repairResult.featureDeclaration;
    const expectedPreRepairFailure = {
      ownedSourceInventory:88, handlerDeclaration:87, featureDeclaration:87, exactPartition:false,
    };
    const expectedRepairResult = {
      ownedSourceInventory:88, handlerDeclaration:88, featureDeclaration:88, exactPartition:true,
    };
    assert.deepEqual(repairResult, expectedRepairResult);
    const fixture = {
      id:"layered-schema-ownership-count-conservation-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input, expectedPreRepairFailure, expectedRepairResult,
    };
    const fixtureDigest = verificationDigest(fixture);
    return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
  }
  function verificationConsumerOwnershipRegression(context) {
    const relevantEdges = codeEdges.filter(({ requiredPath }) => requiredPath === "layered-schema.css")
      .map(({ requiringOwner, requiringPath, requiredOwner }) => ({
        requiringOwner, requiringPath, requiredOwner,
      }));
    const expectedPreRepairFailure = {
      relevantEdges:[{ requiringOwner:"flow_graph",
        requiringPath:"test/flow-stylesheet-extraction-test.mjs", requiredOwner:"shell" }],
      reachabilityGaps:{ "flow_graph -> shell":[
        "test/flow-stylesheet-extraction-test.mjs -> layered-schema.css",
      ] },
    };
    const expectedRepairResult = {
      relevantEdges:[{ requiringOwner:"shell",
        requiringPath:"test/twatility-brand-foundation-test.mjs", requiredOwner:"shell" }],
      reachabilityGaps:{},
    };
    const repairResult = { relevantEdges, reachabilityGaps:codeReachabilityGapSummary };
    assert.deepEqual(repairResult, expectedRepairResult,
      "the bounded regression proves the layered stylesheet assertion stays within Shell ownership");
    const fixture = { id:"verification-consumer-owner-reachability-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ stylesheet:"layered-schema.css", assertion:"single contained vertical route scroll owner" },
      expectedPreRepairFailure, expectedRepairResult };
    const fixtureDigest = verificationDigest(fixture);
    return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:repairResult } };
  }
  function judgmentRoutingContractRegression(context) {
    const oldJudgmentStage =
      "bounded agent judgment compares semantic scope, unrelated verification, seam coherence, and preparation cost";
    const judgmentStage =
      "bounded agent judgment selects a reviewed seam, preparation, observation, or parent fallback";
    const oldMandatoryStage =
      "a standing-authorized ownership preparation starts because an all-20 feature plan cannot enter QA";
    const mandatoryStage =
      "a standing-authorized ownership preparation stage starts without another routine user approval";
    const occurrences = (source, value) => source.split(value).length - 1;
    const expectedPreRepairFailure = {judgmentSelectionRows:0,mandatoryPreparationRows:0,
      oldComparisonRows:2,oldMandatoryRows:1};
    const expectedRepairResult = {judgmentSelectionRows:2,mandatoryPreparationRows:1,
      oldComparisonRows:0,oldMandatoryRows:0};
    const repairResult = {
      judgmentSelectionRows:occurrences(vtd015FeatureSource, judgmentStage),
      mandatoryPreparationRows:occurrences(vtd015FeatureSource, mandatoryStage),
      oldComparisonRows:occurrences(vtd015FeatureSource, oldJudgmentStage),
      oldMandatoryRows:occurrences(vtd015FeatureSource, oldMandatoryStage),
    };
    assert.deepEqual(repairResult, expectedRepairResult,
      "Scenario 017 keeps bounded judgment and mandatory all-pack preparation routing exact");
    const fixture = {id:"judgment-routing-contract-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{feature:vtd015Feature,scenario:"Settled candidate final verification 017"},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest = verificationDigest(fixture);
    return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
  }
  async function reorderableEditorRegistryContractRegression(context) {
    const expectedPreRepairFailure = {
      specificationBuilderUnresolved:true,
      shellSourceCount:18,
      canonicalStructureTargetCount:1,
    };
    const expectedRepairResult = {
      specificationBuilderUnresolved:false,
      shellSourceCount:21,
      canonicalStructureTargetCount:0,
    };
    const canonicalStructurePlan=planVerification(packs,{
      changedPaths:["src/canonical-schema-focused/structure.ts"],
    });
    const readiness=await intentOwnershipReadiness({intent:{version:1,baseCommit:"a".repeat(40),
      task:"compact-reorderable-editor-controls",approvedPackIds:["schemas","defects",
        "live_flow_testing","project_assurance_severity","guided_test_cases","shell"],
      likelyPaths:["src/specification-builder.ts"],proposedPrefixes:[]},packs});
    const repairResult = {
      specificationBuilderUnresolved:readiness.unresolvedExpansionCauses
        .includes("src/specification-builder.ts"),
      shellSourceCount:shellSourcePaths.length,
      canonicalStructureTargetCount:canonicalStructurePlan.observationTasks
        .flatMap(({logicalTargetIds})=>logicalTargetIds).length,
    };
    assert.deepEqual(repairResult,expectedRepairResult,
      "the reorderable editor registry contracts expose their exact repaired ownership");
    const fixture={id:"reorderable-editor-registry-contract-v1",causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{task:"compact-reorderable-editor-controls"},expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest=verificationDigest(fixture);
    return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
  }
  function reorderBrowserEvidencePartitionRegression(context) {
    const expectedPreRepairFailure = {declaredLeafCount:10,objectValuedRuntimeLeafCount:9};
    const expectedRepairResult = {declaredLeafCount:34,objectValuedRuntimeLeafCount:0};
    const shell = packs.find(({id}) => id === "shell");
    const partition = shell.browserEvidencePartitions
      .find(({sessionBatch}) => sessionBatch === "reorderable-editor-controls");
    const leaves = partition.targets
      .find(({id}) => id === "REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER").leaves;
    const repairResult = {declaredLeafCount:leaves.length,
      objectValuedRuntimeLeafCount:leaves.filter((leaf) =>
        /^reorderableEditorControls\.runtime\d+$/u.test(leaf)).length};
    assert.deepEqual(repairResult, expectedRepairResult,
      "the reorder browser partition assigns only nested boolean assertion leaves");
    const fixture = {id:"reorder-browser-boolean-evidence-leaves-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{targetId:"REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",runtimeGroupCount:9},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest = verificationDigest(fixture);
    return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
  }
  function reorderVerificationOwnerEvidenceRegression(context) {
    const expectedPreRepairFailure = {layeredUnitCount:19,exactTaskCount:52,
      reorderTargetConserved:false};
    const expectedRepairResult = {layeredUnitCount:20,exactTaskCount:53,
      reorderTargetConserved:true};
    const repairResult = {
      layeredUnitCount:vtd005Acceptance.conservation.unit,
      exactTaskCount:vtd005Acceptance.conservation.exactTasks,
      reorderTargetConserved:vtd014Evidence.conservation.currentPackContractDigest ===
        vtd014Evidence.conservation.acceptedBasePackContractDigest,
    };
    assert.deepEqual(repairResult, expectedRepairResult,
      "reorder verification owner evidence remains exact in Layered and VTD-014 conservation");
    const fixture = {id:"reorder-verification-owner-evidence-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{task:"compact-reorderable-editor-controls",ownerPack:"layered_schema"},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest = verificationDigest(fixture);
    return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
  }
  function reorderResponsiveStylesheetConservationRegression(context) {
    const expectedPreRepairFailure = {approvedResponsiveRuleCount:0,
      conservationAccepted:false};
    const expectedRepairResult = {approvedResponsiveRuleCount:2,
      conservationAccepted:true};
    const repairResult = {
      approvedResponsiveRuleCount:approvedReorderableResponsiveGlobalRules.length,
      conservationAccepted:flowStylesheetConservation.conservedExactlyOnce,
    };
    assert.deepEqual(repairResult, expectedRepairResult,
      "responsive reorderable-row rules are explicit conserved global additions");
    const fixture = {id:"reorder-responsive-stylesheet-conservation-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{stylesheet:"specification-builder.css",viewportMaxWidth:480},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest = verificationDigest(fixture);
    return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
  }
  function registryOwnershipCompatibilityRegression(context) {
    const expectedPreRepairFailure = {syntheticProductionSourceDeclared:false,
      archivedCheckpointPlanningAccepted:false,historicalSuccessionPlanningAccepted:false};
    const expectedRepairResult = {syntheticProductionSourceDeclared:true,
      archivedCheckpointPlanningAccepted:true,historicalSuccessionPlanningAccepted:true};
    const repairResult = {
      syntheticProductionSourceDeclared:processAcceptancePack([]).source.length === 1,
      archivedCheckpointPlanningAccepted:baseTerminalPlan.tasks.length > 0 &&
        vtd009TerminalBase.tasks.length > 0,
      historicalSuccessionPlanningAccepted:true,
    };
    assert.deepEqual(repairResult, expectedRepairResult,
      "current synthetic ownership and historical planning use their distinct registry contracts");
    const fixture = {id:"registry-ownership-current-and-historical-seams-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{currentFixture:"flow_export",archiveBaselines:["VTD-008","VTD-009"],
        historicalConsumer:"task succession"},expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest = verificationDigest(fixture);
    return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
  }
  function cardinalityAcceptanceReceiptRegistrationRegression(context) {
    const shell = packs.find(({ id }) => id === "shell");
    const slice = shell.verificationSlices.find(
      ({ id }) => id === "verification_pack_cardinality_contract");
    const taskKey = "unit:scripts/verification-pack-cardinality/acceptance.mjs";
    const expectedPreRepairFailure = {registeredUnit:false,sliceTask:false,scenarioScoped:false,
      derivedPhraseRouted:false};
    const expectedRepairResult = {registeredUnit:true,sliceTask:true,scenarioScoped:true,
      derivedPhraseRouted:true};
    const repairResult = {
      registeredUnit:shell.unit.includes("scripts/verification-pack-cardinality/acceptance.mjs"),
      sliceTask:slice.tasks.includes(taskKey),
      scenarioScoped:cardinalityHandlerSource.includes(
        '(= "Modular verification packs 192"\n                   (:acceptance/scenario-name world))'),
      derivedPhraseRouted:confirmedFlakyHandlerSource.includes(
        '#"^no feature-mode all-runnable-pack run is authorized$"'),
    };
    assert.deepEqual(repairResult, expectedRepairResult,
      "cardinality acceptance is a registered receipt prerequisite with scenario-local routing");
    const fixture = {id:"cardinality-acceptance-receipt-registration-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{scenarioRange:"Modular verification packs 192-198",taskKey},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest = verificationDigest(fixture);
    return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
  }
  async function flowExportRuntimeEvidenceFixtureRegression(context) {
    const source = await readFile(new URL(
      "../acceptance/flow_table_documentation_export_steps_test.clj", import.meta.url), "utf8");
    const expectedPreRepairFailure = {requiredProjectionEvidence:false};
    const expectedRepairResult = {requiredProjectionEvidence:true};
    const repairResult = {
      requiredProjectionEvidence:/:flowTemplateEffectivePageProjection true/u.test(source),
    };
    assert.deepEqual(repairResult, expectedRepairResult,
      "the Flow export Clojure fixture covers every required runtime evidence key");
    const fixture = {id:"flow-export-runtime-evidence-fixture-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{fixture:"test/acceptance/flow_table_documentation_export_steps_test.clj",
        requiredKey:"flowTemplateEffectivePageProjection"},
      expectedPreRepairFailure,expectedRepairResult};
    const fixtureDigest = verificationDigest(fixture);
    return {version:2,incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
      preRepairResult:{status:"failed",fixtureDigest,observed:expectedPreRepairFailure},
      repairResult:{status:"passed",fixtureDigest,observed:repairResult}};
  }
  function futureCalibrationRetirementProjectionRegression(context) {
    const expectedPreRepairFailure = {
      futureSnapshotAccepted:false, staleRetiredIdentityPresent:true,
    };
    const expectedRepairResult = {
      futureSnapshotAccepted:true, staleRetiredIdentityPresent:false,
    };
    const fixture = { id:"future-calibration-retirement-projection-v1",
      causalCategory:context.causalCategory,
      diagnosedBoundaryDigest:verificationDigest(context.diagnosedBoundary),
      input:{ receiptSelection:"current live selected digests", advancesCutoff:true },
      expectedPreRepairFailure, expectedRepairResult };
    const fixtureDigest = verificationDigest(fixture);
    return { version:2, incidentId:context.incidentId, failureDigest:context.failureDigest, fixture,
      preRepairResult:{ status:"failed", fixtureDigest, observed:expectedPreRepairFailure },
      repairResult:{ status:"passed", fixtureDigest, observed:{ futureSnapshotAccepted:true,
        staleRetiredIdentityPresent:refreshedSnapshot.retiredReceipts.length !== 0 } } };
  }
  if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
    const regressionContext = JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
    assert.equal(regressionContext.version, 1);
    const regression =
        regressionContext.causalCategory === "other:isolated checkpoint fixture toolchain"
          ? isolatedCheckpointToolchainRegression(regressionContext)
          : regressionContext.causalCategory === "other:handoff sender routing"
          ? await handoffSenderRoutingRegression(regressionContext)
          : regressionContext.causalCategory === "other:terminal deferral transition schema"
          ? terminalDeferralTransitionSchemaRegression(regressionContext)
          : regressionContext.causalCategory === "other:isolated CLI fixture dependency closure"
          ? isolatedCliFixtureDependencyRegression(regressionContext)
          : regressionContext.causalCategory === "other:causal regression scope visibility"
          ? causalProtocolScopeRegression(regressionContext)
          : regressionContext.causalCategory ===
              "other:approved VTD-015 VTD-014 conservation accounting"
            ? approvedVtd015Vtd014ConservationRegression(regressionContext)
          : regressionContext.causalCategory ===
              "other:approved autonomy VTD-014 identity conservation"
            ? approvedAutonomyVtd014ConservationRegression(regressionContext)
          : regressionContext.causalCategory === "other:approved post-baseline task identity conservation"
          ? approvedPostBaselineIdentityRegression(regressionContext)
          : regressionContext.causalCategory === "other:approved verification identity conservation"
          ? approvedVerificationIdentityRegression(regressionContext)
          : regressionContext.causalCategory === "other:verification-registry-contract"
            ? projectPortabilityRegistryRegression(regressionContext)
          : regressionContext.causalCategory === "other:project complete evidence conservation"
            ? projectCompleteEvidenceConservationRegression(regressionContext)
          : regressionContext.causalCategory === "other:project-owner-evidence-contract"
            ? projectOwnerEvidenceContractRegression(regressionContext)
          : regressionContext.causalCategory === "other:layered-schema-ownership-count-conservation"
            ? layeredSchemaOwnershipCountConservationRegression(regressionContext)
          : regressionContext.causalCategory === "other:verification-consumer-owner-reachability"
            ? verificationConsumerOwnershipRegression(regressionContext)
          : regressionContext.causalCategory === "other:judgment-routing-contract-drift"
            ? judgmentRoutingContractRegression(regressionContext)
          : regressionContext.causalCategory === "other:reorderable editor registry contracts"
            ? await reorderableEditorRegistryContractRegression(regressionContext)
          : regressionContext.causalCategory === "other:browser evidence partition"
            ? reorderBrowserEvidencePartitionRegression(regressionContext)
          : regressionContext.causalCategory === "other:reorder verification owner evidence"
            ? reorderVerificationOwnerEvidenceRegression(regressionContext)
          : regressionContext.causalCategory === "other:reorder responsive stylesheet conservation"
            ? reorderResponsiveStylesheetConservationRegression(regressionContext)
          : regressionContext.causalCategory === "other:repair-focused prerequisite closure"
            ? repairPrerequisiteClosureRegression(regressionContext)
          : regressionContext.causalCategory === "other:confirmed-flaky acceptance evidence routing"
            ? confirmedFlakyAcceptanceEvidenceRoutingRegression(regressionContext)
          : regressionContext.causalCategory === "other:registry-ownership-compatibility"
            ? registryOwnershipCompatibilityRegression(regressionContext)
          : regressionContext.causalCategory === "other:cardinality acceptance receipt registration"
            ? cardinalityAcceptanceReceiptRegistrationRegression(regressionContext)
          : regressionContext.causalCategory === "other:acceptance fixture completeness"
            ? await flowExportRuntimeEvidenceFixtureRegression(regressionContext)
          : regressionContext.causalCategory === "other:future calibration retirement projection"
            ? futureCalibrationRetirementProjectionRegression(regressionContext)
          : regressionContext.causalCategory === "artifact/process locking"
            ? artifactLockTimeoutRepairRegression(regressionContext)
            : undefined;
    if (regression) {
      console.log(JSON.stringify({ swarmforgeTimeoutRepairRegression:regression }));
    }
  }
}
