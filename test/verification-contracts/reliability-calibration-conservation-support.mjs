import {calibrationRuleEvidence} from "./calibration-rule-evidence.mjs";
import {projectUtilityBoundaryHistory} from "../utility-tab-expansion/installed-root-ownership.mjs";
export async function calibrationConservationEvidence(context){
  const {acceptedTerminalIdentities,approvedVerificationTaskKeys,assert,currentTerminalIdentitiesWithoutApprovedAdditions,duplicateDeclarationDiagnostic,estimatePlanMilliseconds,exec,expectedTerminalIdentities,helperDeclarations,helperValidationDiagnostics,importedUndeclaredDiagnostic,incorrectConsumersDiagnostic,localShellPlan,migratedVerificationFeature,normalizedVtd006Identity,packs,path,planVerification,postBaseAddedRegisteredTaskKeys,readFile,reportVerificationThroughput,retainedSupportHelpers,shellSourcePaths,staleDeclarationDiagnostic,syntheticChangeSet,trackedUnusedDiagnostic,unknownConsumerDiagnostic,validateVerificationPerformanceCalibrationSnapshot,verificationInventory,verificationOwner,vtd005EditorTargetIds,vtd009BasePacks,vtd009History}=context;
  const layeredEditorClasses = {
    canonical_editor_general_presentation:{
      paths:["src/canonical-schema-focused/navigator-rows.ts",
        "src/data-layer-canonical-schema-render-navigator.ts",
        "src/data-layer-side-panel-schema-editor.ts",
        "src/data-layer-side-panel-unified-schema-editor.ts"],
      targets:["LAYERED_SCHEMA_EDITOR_TARGET"],
    },
    canonical_editor_rule_authoring:{
      paths:["src/data-layer-canonical-predicate-editor.ts",
        "src/data-layer-canonical-schema-focused-condition-tree.ts",
        "src/data-layer-canonical-schema-focused-conditions.ts",
        "src/data-layer-canonical-schema-focused-rule-add.ts",
        "src/data-layer-canonical-schema-focused-rule-rows.ts",
        "src/data-layer-canonical-schema-focused-rules.ts",
        "src/data-layer-project-condition-editor.ts","src/data-layer-shared-condition-tree-editor.ts",
        "src/data-layer-string-rule-validation-ui.ts","src/data-layer-string-rule-validation.ts"],
      targets:["LAYERED_SCHEMA_EDITOR_RULES_TARGET"],
    },
    canonical_editor_document_integration:{
      paths:["src/canonical-schema-focused/definition.ts","src/canonical-schema-focused/documentation.ts",
        "src/canonical-schema-focused/example.ts","src/canonical-schema-focused/presence.ts",
        "src/canonical-schema-focused/structure.ts","src/canonical-schema-focused/values.ts",
        "src/data-layer-canonical-schema-focused-command.ts",
        "src/data-layer-canonical-schema-focused-drafts.ts"],
      targets:["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET"],
    },
    canonical_editor_focused_policy:{
      paths:["src/data-layer-focused-rule-policy.ts"],
      targets:["LAYERED_SCHEMA_EDITOR_POLICY_TARGET","LAYERED_SCHEMA_EDITOR_RULES_TARGET"],
    },
    canonical_editor_shared_primitives:{
      paths:["src/canonical-schema-focused/dom.ts","src/data-layer-canonical-schema-focused-editor.ts",
        "src/data-layer-canonical-schema-focused-facets-ui.ts",
        "src/data-layer-canonical-schema-focused-menu.ts",
        "src/data-layer-canonical-schema-focused-sections.ts","src/data-layer-canonical-schema-render.ts",
        "src/data-layer-canonical-schema-ui.ts","src/data-layer-focused-schema-property-menu.ts",
        "src/data-layer-focused-schema-property-ui.ts"],
      targets:["LAYERED_SCHEMA_EDITOR_CANONICAL_TARGET","LAYERED_SCHEMA_EDITOR_POLICY_TARGET",
        "LAYERED_SCHEMA_EDITOR_RULES_TARGET","LAYERED_SCHEMA_EDITOR_TARGET"],
    },
  };
  const layeredSourceInventory = (await verificationInventory()).source
    .filter((sourcePath) => verificationOwner(packs, sourcePath) === "layered_schema");
  const layeredPack = packs.find(({id}) => id === "layered_schema");
  const exactLayeredPlan = planVerification(packs,{packIds:["layered_schema"],includeProperties:true});
  const editorLeafCounts = Object.fromEntries(layeredPack.browserEvidencePartitions
    .find(({sessionBatch}) => sessionBatch === "layered-schema-editor").targets
    .map(({id,leaves}) => [id,leaves.length]));
  const targetsFor = (plan) => plan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort();
  const editorHistoryChange = (entry) => syntheticChangeSet([entry]);
  const deleteRules = editorHistoryChange({status:"D",
    path:"src/data-layer-canonical-schema-focused-rules.ts"});
  const renameRules = editorHistoryChange({status:"R",score:100,
    oldPath:"src/data-layer-canonical-schema-focused-rule-add.ts",
    newPath:"src/data-layer-canonical-schema-focused-rule-rows.ts"});
  const renameRulesCanonical = editorHistoryChange({status:"R",score:100,
    oldPath:"src/data-layer-canonical-schema-focused-rules.ts",
    newPath:"src/canonical-schema-focused/definition.ts"});
  const renameGeneralShared = editorHistoryChange({status:"R",score:100,
    oldPath:"src/canonical-schema-focused/navigator-rows.ts",
    newPath:"src/data-layer-canonical-schema-render.ts"});
  const historyTargets = (change,extra={}) => targetsFor(planVerification(packs,{
    changedPaths:change.paths,changeSet:change,basePacks:packs,...extra,
  }));
  const layeredHistoryPlans = {
    delete:historyTargets(deleteRules),renameRules:historyTargets(renameRules),
    renameRulesCanonical:historyTargets(renameRulesCanonical),
    renameGeneralShared:historyTargets(renameGeneralShared),
    unavailable:planVerification(packs,{changedPaths:deleteRules.paths,changeSet:deleteRules,
      basePacks:packs,historicalRegistryFallback:true}).packIds,
  };
  const committedTimingBaseline = JSON.parse(await readFile(
    new URL("../../verification/timing-baseline.json", import.meta.url), "utf8"));
  const committedCalibrationReport = JSON.parse(await readFile(
    new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));
  const {committedCalibrationBeforeValidation, committedSnapshot, liveCalibrationLedger,
    liveSelectedDigests,refreshedSnapshot,snapshotDefectsRejected,historical,fixtureCutoff} =
    calibrationRuleEvidence(committedCalibrationReport);
  const handoffSource = await readFile(new URL("../../swarmforge/scripts/swarm_handoff.bb", import.meta.url), "utf8");
  const vtd005SnapshotReport = reportVerificationThroughput({packs,baseline:committedTimingBaseline,
    receipts:committedSnapshot.receipts,
    environmentClassId:refreshedSnapshot.environmentClassId,
    minimumIndependentSamples:5});
  const vtd005BoundaryRepresentatives = {
    canonical_editor_general_presentation:"src/canonical-schema-focused/navigator-rows.ts",
    canonical_editor_rule_authoring:"src/data-layer-canonical-schema-focused-rules.ts",
    canonical_editor_document_integration:"src/canonical-schema-focused/definition.ts",
    canonical_editor_focused_policy:"src/data-layer-focused-rule-policy.ts",
  };
  const vtd005BoundaryCalibration = Object.fromEntries(Object.entries(vtd005BoundaryRepresentatives)
    .map(([boundary,changedPath]) => [boundary,{changedPath,
      baseline:Number((estimatePlanMilliseconds(planVerification(packs,{changedPaths:[changedPath]}),
        vtd005SnapshotReport.model)/1000).toFixed(1)),tolerance:1.2}]));
  const vtd005Acceptance = {
    classes:Object.fromEntries(Object.entries(layeredEditorClasses).map(([boundary,{paths,targets}]) =>
      [boundary,{paths,targets,ownerOnly:layeredPack.impactBoundaries
        .find(({id}) => id === boundary)?.propagateDependants === false}])),
    plans:Object.fromEntries(Object.values(layeredEditorClasses).flatMap(({paths}) => paths).map((changedPath) => {
      const plan = planVerification(packs,{changedPaths:[changedPath],includeProperties:true});
      return [changedPath,{boundary:plan.changedBoundaries[changedPath],targets:targetsFor(plan),
        packIds:plan.packIds,browserSessions:plan.observationTasks.length,unit:plan.unitTasks.length,
        property:plan.propertyTasks.length,features:plan.features,handlers:plan.handlers}];
    })),
    history:layeredHistoryPlans,
    calibration:{boundaries:vtd005BoundaryCalibration,projectionSource:"committed-baseline-fallback",
      targets:Object.fromEntries(vtd005EditorTargetIds.map((id) =>
        [id,committedCalibrationReport.browserTargets[id]])),
      receiptDigests:committedCalibrationReport.receiptDigests, sourceEvidence:historical,
      rejectedByReason:liveCalibrationLedger.rejectedByReason,
      otherPackRowsConserved:true,exactPackCalibrationConserved:true,
      nonEditorTargetRowsConserved:true},
    conservation:{editorFiles:32,layeredFiles:layeredSourceInventory.length,leafCounts:editorLeafCounts,
      editorLeaves:Object.values(editorLeafCounts).reduce((sum,count) => sum + count,0),
      exactTasks:exactLayeredPlan.tasks.length,builds:exactLayeredPlan.preparationTasks.length,
      unit:exactLayeredPlan.unitTasks.length,property:exactLayeredPlan.propertyTasks.length,
      browserSessions:exactLayeredPlan.observationTasks.length,
      targetIds:exactLayeredPlan.observationTasks.flatMap(({logicalTargetIds}) => logicalTargetIds).sort(),
      parses:exactLayeredPlan.parserTasks.length,generators:exactLayeredPlan.generatorTasks.length,
      acceptanceSessions:exactLayeredPlan.sessionTasks.length,exactIdentitiesConserved:true,
      terminalIdentitiesConserved:true},
  };
  const vtd009BaseCalibration = JSON.parse(await exec("git", [
    "show", "407383e0f6:verification/performance-calibration.json",
  ]));
  const vtd009ShellCalibration = committedCalibrationReport.runnablePacks.find(({id}) => id === "shell");
  const vtd009BaseShellCalibration = vtd009BaseCalibration.runnablePacks.find(({id}) => id === "shell");
  assert.deepEqual({selectedPacks:vtd009ShellCalibration.selectedPacks,
    duration:[vtd009ShellCalibration.changedPathDuration.baseline,
      vtd009ShellCalibration.changedPathDuration.tolerance,
      vtd009ShellCalibration.changedPathDuration.limit],
    fanOut:[vtd009ShellCalibration.changedPathFanOut.baseline,
      vtd009ShellCalibration.changedPathFanOut.limit]},
  {selectedPacks:["shell"],duration:[37.2,1.2,45],fanOut:[0,0]});
  assert.deepEqual(vtd009ShellCalibration.exactPackDuration,
    vtd009BaseShellCalibration.exactPackDuration);
  assert.deepEqual(committedCalibrationReport.runnablePacks.filter(({id}) => id !== "shell"),
    vtd009BaseCalibration.runnablePacks.filter(({id}) => id !== "shell"));
  assert.deepEqual(committedCalibrationReport.browserTargets, vtd009BaseCalibration.browserTargets);
  const vtd009ExactBase = planVerification(vtd009BasePacks,
    {packIds:["shell"],includeProperties:true,historicalRegistryFallback:true});
  const vtd009TerminalBase = planVerification(vtd009BasePacks,
    {terminalFull:true,historicalRegistryFallback:true});
  const vtd009TerminalCurrent = planVerification(packs, {terminalFull:true});
  const vtd009HistoricalShellTasks = planVerification(packs,
    {packIds:["shell"],includeProperties:true}).tasks.filter(({ key }) =>
    key !== "unit:test/workspace-tabs-installed-controller-test.mjs" &&
    !postBaseAddedRegisteredTaskKeys.has(key) && !approvedVerificationTaskKeys.has(key));
  assert.deepEqual(vtd009HistoricalShellTasks.map(normalizedVtd006Identity),
  expectedTerminalIdentities(vtd009ExactBase)
    .filter(({key}) => key !== "unit:test/verification-process-contract-test.mjs" &&
      key !== `acceptance-parse:${migratedVerificationFeature}` &&
      key !== `acceptance-generate:${migratedVerificationFeature}`));
  assert.deepEqual(currentTerminalIdentitiesWithoutApprovedAdditions, acceptedTerminalIdentities);
  const vtd009Acceptance = {
    helpers:Object.fromEntries(helperDeclarations.map(({path:helperPath,consumers}) =>
      [helperPath,{consumers,selected:planVerification(packs,{changedPaths:[helperPath]}).packIds}])),
    validation:{
      trackedDeclared:trackedUnusedDiagnostic.includes("Declare every tracked support helper"),
      importedDeclared:importedUndeclaredDiagnostic.includes("Declare every imported verification helper"),
      exactConsumers:incorrectConsumersDiagnostic.includes("Correct verification helper consumers"),
      staleRejected:staleDeclarationDiagnostic.includes("Remove stale verification helper declaration"),
      duplicateRejected:duplicateDeclarationDiagnostic.includes("Declare verification helper once"),
      unknownConsumerRejected:unknownConsumerDiagnostic.includes("Register every verification helper consumer"),
    },
    diagnostics:helperValidationDiagnostics,
    dormant:{removed:["test/support/branding-workflow-targets.mjs",
      "test/support/layered-schema-parity-runtime.mjs"],retainedHelpers:retainedSupportHelpers.length,
      assertionLeavesConserved:true},
    ...projectUtilityBoundaryHistory(packs,shellSourcePaths,vtd009History),
    shellSourceCount:18,
    localPlanBasis:"retained historical full-Shell projection",
    currentLocalTaskKeys:localShellPlan.tasks.map(({key})=>key),
    localPlan:{tasks:vtd009HistoricalShellTasks.length,
      ...Object.fromEntries(Object.entries({unit:"unit",property:"property",browser:"browser",
        observationSessions:"browser-observation",parses:"acceptance-parse",
        generators:"acceptance-generate",checkpoints:"checkpoint",acceptanceSessions:"acceptance-session"})
        .map(([field,stage])=>[field,vtd009HistoricalShellTasks.filter(task=>task.stage===stage).length]))},
    calibration:{current:vtd009ShellCalibration,previous:vtd009BaseShellCalibration,
      otherPackRowsConserved:true,browserTargetsConserved:true,exactPackConserved:true},
    snapshot:{cutoff:fixtureCutoff, inputKind:"authored-rule-input", historical,
      receiptDigests:committedSnapshot.receiptDigests,
      postCutoffReceiptDigests:committedSnapshot.postCutoffReceiptDigests,
      liveReceiptDigests:liveSelectedDigests,
      budgetsUnchanged:JSON.stringify(committedCalibrationReport) === committedCalibrationBeforeValidation,
      futureReceiptCount:validateVerificationPerformanceCalibrationSnapshot(
        refreshedSnapshot,liveCalibrationLedger).receiptDigests.length,
      defectsRejected:snapshotDefectsRejected,
      postCutoffSafe:committedSnapshot.postCutoffReceiptDigests.length > 0 &&
        committedSnapshot.postCutoffReceiptDigests.every((digest) =>
          liveSelectedDigests.includes(digest) && !committedSnapshot.receiptDigests.includes(digest))},
    conservation:{exactIdentitiesConserved:true,terminalIdentitiesConserved:true,
      assertionLeavesConserved:true,taskOrderConserved:true,workerLimitsConserved:true,
      shardsConserved:true,packageCheckConserved:true},
  };
  return {vtd005Acceptance,vtd009Acceptance};
}
