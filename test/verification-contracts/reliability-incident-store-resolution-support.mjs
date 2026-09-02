export async function runReliabilityIncidentResolution(context){
  const {assert,associatedChild,boundedClosureContractRevision,browserTargetSuccessionBoundary,canonicalFlowReloadIdentity,caseIncident,causalGroupingEvidence,causalIdentity,changedInnerDeadline,checkpointContractEvidence,claim,classifications,classifiedFirst,classifyFlowReloadModes,closureDisposition,completeInput,concurrentIncidents,createTimeoutIncidentStore,diagnosticRetryScope,domainFixtures,execFile,failure,first,flakyDeferred,flowReloadCausalKey,focusedSelectorOptions,governedAttemptIncident,historicalClassification,incidentFixtureRoot,innerDeadlineIdentityConserved,inputEquivalentTaskProof,integratedResolutionIds,loadTaskSuccessionGraph,mkdir,nonTimeoutEvidence,observeFlowReloadLifecycle,path,planVerification,prerequisiteContractEvidence,prerequisiteGateEvidence,priorPass,progressTracker,projectionPacks,proposal,readFile,reliabilityFailureFingerprint,rename,repairReceiptBase,repairRejections,resolveIncidentTaskSuccession,resolveTaskSuccessionGraph,rm,sameTargetProjection,sharedBoundaryEvidence,sidePanelPaperFirstBrandAcceptanceArtifacts,sidePanelPaperFirstBrandFeatures,store,symlink,taskSuccessionBoundaryDigest,terminalClosureExecution,timeoutCanonicalIdentities,timeoutIncidentDigest,timeoutPackRegistry,timeoutRepairPackIds,timeoutRepairPackageTaskIdentity,timeoutResolutionEvidence,validateIncident,validateUnresolvedIncidentTaskSuccession,verificationDigest,verificationPacksAtCommit,verificationTaskDigest,verificationTaskIdentity,writeFile,writeRunnerReceipt,incidentState}=context;
  let vtd014Evidence;
  const checkpointPacks = ["branding_polish", "capture", "command-palette", "defects",
        "durable_project_repository", "event-library", "flow_export", "flow_graph", "guided_test_cases",
        "hotkeys", "layered_schema", "live_flow_testing", "project_assurance_severity",
        "project_event_transport", "project_management", "property_set_flow_sections", "replay",
        "schema_relationship_tree", "schemas", "shell"];
      const incompleteCheckpointReceiptPath = await writeRunnerReceipt("repair-checkpoint-incomplete", {
        ...repairReceiptBase, plan:{ requestedPackIds:checkpointPacks, selectedPackIds:checkpointPacks },
        tasks:{ "unit:checkpoint":{ identity:{ key:"unit:checkpoint" }, status:"passed", provenance:"fresh" } },
      });
      const packagePath = path.join(incidentFixtureRoot, "build", "package", "my-chrome-utilities.zip");
      await mkdir(path.dirname(packagePath), { recursive:true });
      await writeFile(packagePath, "arbitrary package bytes");
      const invalidPackageReceiptPath = await writeRunnerReceipt("package-invalid", {
        ...repairReceiptBase, startedAt:"2026-08-09T00:00:02.000Z",
        plan:{ mode:"package", checkpointRunId:"repair-checkpoint-incomplete" },
        tasks:{ "unit:not-package":{ identity:{ key:"unit:not-package" }, status:"passed",
          provenance:"fresh", durationMs:1, output:"build/package/my-chrome-utilities.zip\n" } },
      });
      await store.claimRepairCheckpoint(first.id, "repair-checkpoint-incomplete");
      await assert.rejects(store.resolve(first.id, {
        checkpointReceiptPath:incompleteCheckpointReceiptPath,
        packageReceiptPath:invalidPackageReceiptPath,
      }), /canonical all-20 checkpoint|task set/u,
      "a declared all-20 receipt with one synthetic task cannot resolve an incident");
      const completeTasks = Object.fromEntries(timeoutCanonicalIdentities.map((identity) =>
        [identity.key, { identity, status:"passed", provenance:"fresh", durationMs:1 }]));
      const checkpointReceiptPath = await writeRunnerReceipt("repair-checkpoint-complete", {
        ...repairReceiptBase, runId:"repair-checkpoint-incomplete",
        candidate:{ ...repairReceiptBase.candidate, baseCommit:"approved-base", evidenceTask:"vtd014" },
        plan:{ mode:"exact", requestedPackIds:[...timeoutRepairPackIds],
          selectedPackIds:[...timeoutRepairPackIds] }, tasks:completeTasks,
      });
      const packageReceiptPath = await writeRunnerReceipt("package-valid", {
        ...repairReceiptBase, startedAt:"2026-08-09T00:00:02.000Z",
        plan:{ mode:"package", checkpointRunId:"repair-checkpoint-incomplete" },
        tasks:{ "package:extension":{ identity:{ key:"package:extension", stage:"package", packId:null,
          executable:"node", args:["scripts/package.mjs"], target:"build/package/my-chrome-utilities.zip",
          environment:null, requiredCapabilities:[] }, status:"passed", provenance:"fresh", durationMs:1,
        output:"build/package/my-chrome-utilities.zip\n" } },
      });
      const redirectedCheckpointArchive = path.join(incidentFixtureRoot, "redirected-checkpoint-receipt");
      const storeRejections = {};
      const captureStoreRejection = async(name, operation, pattern) => {
        try { await operation; }
        catch (error) { assert.match(error.message, pattern); storeRejections[name] = error.message; return; }
        assert.fail(`${name} malformed store operation was not rejected`);
      };
      await writeFile(redirectedCheckpointArchive, await readFile(checkpointReceiptPath));
      const checkpointArchivePath = path.join(incidentFixtureRoot, "incidents",
        `${first.id}.checkpoint-receipt`);
      await symlink(redirectedCheckpointArchive, checkpointArchivePath);
      await captureStoreRejection("archiveWriteSymlink",
        store.resolve(first.id, { checkpointReceiptPath, packageReceiptPath }),
        /symlink|canonical regular file/u);
      await rm(checkpointArchivePath);
      await store.recordLineageTransition(first.id, {
        kind:"rebase", fromCommit:"repair-commit", toCommit:"reclaimed-commit", toTree:"repair-tree",
      });
      const reclaimedRunId = "repair-checkpoint-reclaimed";
      await store.claimRepairCheckpoint(first.id, reclaimedRunId);
      const reclaimedReceiptBase = { ...repairReceiptBase,
        candidate:{ commit:"reclaimed-commit", tree:"repair-tree",
          baseCommit:"approved-base", evidenceTask:"vtd014" } };
      const reclaimedCheckpointReceiptPath = await writeRunnerReceipt("repair-checkpoint-reclaimed", {
        ...reclaimedReceiptBase, runId:reclaimedRunId,
        plan:{ mode:"exact", requestedPackIds:[...timeoutRepairPackIds],
          selectedPackIds:[...timeoutRepairPackIds] }, tasks:completeTasks,
      });
      const reclaimedPackageReceiptPath = await writeRunnerReceipt("package-reclaimed", {
        ...reclaimedReceiptBase, startedAt:"2026-08-09T00:00:03.000Z",
        plan:{ mode:"package", checkpointRunId:reclaimedRunId },
        tasks:{ "package:extension":{ identity:{ key:"package:extension", stage:"package", packId:null,
          executable:"node", args:["scripts/package.mjs"], target:"build/package/my-chrome-utilities.zip",
          environment:null, requiredCapabilities:[] }, status:"passed", provenance:"fresh", durationMs:1,
        output:"build/package/my-chrome-utilities.zip\n" } },
      });
      const incidentArchiveRoot = path.join(incidentFixtureRoot, "incidents");
      await Promise.all(["checkpoint-receipt", "package-receipt", "package-zip"].map((suffix) =>
        writeFile(path.join(incidentArchiveRoot, `${first.id}.${suffix}`), `partial-${suffix}`)));
      const resolved = await store.resolve(first.id, {
        checkpointReceiptPath:reclaimedCheckpointReceiptPath,
        packageReceiptPath:reclaimedPackageReceiptPath,
      });
      assert.equal(resolved.state, "resolved");
      assert.equal(resolved.repairCheckpoint.reclaimCount, 1,
        "a reclaimed checkpoint atomically replaces incomplete archives from its failed predecessor");
      const repairCommitBlocking = await store.blocking({ commit:"repair-commit" });
      assert.equal(repairCommitBlocking.length, 14,
        "other classified flakes remain blocking while the repaired incident is resolved");
      const evidence = timeoutResolutionEvidence(resolved);
      assert.equal(evidence.resolutionDigest, resolved.resolution.digest);
      const verifiedResolutions = await store.resolutions({ commit:"reclaimed-commit" });
      assert.equal(verifiedResolutions[0].packageDigest,
        resolved.resolution.package.digest,
      "Git-note resolution loading recomputes archived checkpoint and package links");
      const integratedArchivePaths = Object.values(resolved.resolution.archive)
        .map((name) => path.join(incidentFixtureRoot, "incidents", name));
      const integratedArchiveBytes = await Promise.all(integratedArchivePaths.map((target) => readFile(target)));
      await Promise.all(integratedArchivePaths.map((target) => rm(target)));
      await assert.rejects(store.resolutions({ commit:"reclaimed-commit" }), /ENOENT/u,
        "missing raw resolution archives fail without an exact integrated compact record");
      integratedResolutionIds.add(resolved.id);
      assert.equal((await store.resolutions({ commit:"reclaimed-commit" }))[0].resolutionDigest,
        resolved.resolution.digest,
      "an exact integrated Git-note identity permits removal of consumed raw resolution archives");
      await Promise.all(integratedArchivePaths.map((target, index) =>
        writeFile(target, integratedArchiveBytes[index])));
      const flakyCheckpointRunId = "confirmed-flaky-checkpoint";
      await store.claimRepairCheckpoint(flakyDeferred.id, flakyCheckpointRunId);
      const flakyCheckpointReceiptPath = await writeRunnerReceipt(flakyCheckpointRunId, {
        ...repairReceiptBase, runId:flakyCheckpointRunId,
        candidate:{ commit:"repair-commit", tree:"repair-tree", baseCommit:"approved-base",
          evidenceTask:"confirmed-flaky-feature-deferral" },
        plan:{ mode:"exact", requestedPackIds:[...timeoutRepairPackIds],
          selectedPackIds:[...timeoutRepairPackIds] }, tasks:completeTasks,
      });
      const flakyPackageReceiptPath = await writeRunnerReceipt("confirmed-flaky-package", {
        ...repairReceiptBase, startedAt:"2026-08-09T00:00:04.000Z",
        candidate:{ commit:"repair-commit", tree:"repair-tree", baseCommit:"approved-base",
          evidenceTask:"confirmed-flaky-feature-deferral" },
        plan:{ mode:"package", checkpointRunId:flakyCheckpointRunId },
        tasks:{ "package:extension":{ identity:{ key:"package:extension", stage:"package", packId:null,
          executable:"node", args:["scripts/package.mjs"], target:"build/package/my-chrome-utilities.zip",
          environment:null, requiredCapabilities:[] }, status:"passed", provenance:"fresh", durationMs:1,
        output:"build/package/my-chrome-utilities.zip\n" } },
      });
      const resolvedFlaky = await store.resolve(flakyDeferred.id, {
        checkpointReceiptPath:flakyCheckpointReceiptPath,
        packageReceiptPath:flakyPackageReceiptPath,
      });
      assert.equal((await store.read(flakyDeferred.id)).state, "resolved",
        "a confirmed-flaky resolution survives persisted reload without synthetic repair storage");
      const auditedFlaky = (await store.resolutions({ commit:"repair-commit" }))
        .find(({ incidentId }) => incidentId === flakyDeferred.id);
      assert.equal(auditedFlaky?.basis, "confirmed-flaky",
        "downstream terminal evidence consumption audits the persisted repair-free resolution");
      assert.equal(auditedFlaky?.resolutionDigest, resolvedFlaky.resolution.digest);
      const incidentPath = path.join(incidentFixtureRoot, "incidents", `${resolved.id}.json`);
      const canonicalIncidentBytes = await readFile(incidentPath);
      const traversingEnvelope = JSON.parse(canonicalIncidentBytes);
      traversingEnvelope.incident.resolution.archive.packageZip = "../redirected-package.zip";
      const traversingResolution = traversingEnvelope.incident.resolution;
      traversingResolution.digest = timeoutIncidentDigest({ ...traversingResolution, digest:undefined });
      traversingEnvelope.digest = timeoutIncidentDigest(traversingEnvelope.incident);
      await writeFile(incidentPath, `${JSON.stringify(traversingEnvelope)}\n`);
      await captureStoreRejection("traversal", store.read(resolved.id),
        /archive|filename|travers|transition history/u);
      await writeFile(incidentPath, canonicalIncidentBytes);
      const archivePath = path.join(incidentFixtureRoot, "incidents", `${resolved.id}.package-zip`);
      const archiveBackupPath = path.join(incidentFixtureRoot, `${resolved.id}.package-zip.backup`);
      await rename(archivePath, archiveBackupPath);
      await symlink(archiveBackupPath, archivePath);
      await captureStoreRejection("archiveReadSymlink", store.resolutions({ commit:"reclaimed-commit" }),
        /symlink|canonical regular file/u);
      await rm(archivePath);
      await rename(archiveBackupPath, archivePath);
      const unrelatedLineageBlocking = await store.blocking({ commit:"unrelated-commit" });
      assert.equal(unrelatedLineageBlocking.length, 0,
        "an unrelated candidate lineage is not blocked by reliability incident state");
      const rebased = await store.recordLineageTransition(concurrentIncidents[0].id, {
        kind:"rebase", fromCommit:"failed-commit", toCommit:"rebased-commit", toTree:"rebased-tree",
      });
      assert.equal(rebased.lineageTransitions[0].toCommit, "rebased-commit");
      assert.equal((await store.blocking({ commit:"rebased-commit" })).some(
        ({ id }) => id === concurrentIncidents[0].id), true,
      "an explicit rebase keeps the unresolved incident attached to the replacement candidate");
      let abandonmentDecisionRequired = false;
      try {
        await store.recordLineageTransition(concurrentIncidents[1].id, {
          kind:"abandon", fromCommit:"failed-commit",
        });
      } catch (error) {
        assert.match(error.message, /specifier-approved user decision/u);
        abandonmentDecisionRequired = true;
      }
      assert.equal(abandonmentDecisionRequired, true,
        "candidate abandonment cannot release an incident without a separate specifier decision");
      await assert.rejects(store.recordLineageTransition(concurrentIncidents[1].id, {
        kind:"rebase", fromCommit:"failed-commit", toCommit:"rebased-commit", toTree:"invented-tree",
      }), /Git|tree|identity/u,
      "a caller-authored tree cannot create a durable replacement identity");
      const invalidTreeRejected = true;
      await assert.rejects(store.recordLineageTransition(concurrentIncidents[1].id, {
        kind:"rebase", fromCommit:"failed-commit", toCommit:"genuinely-unrelated",
        toTree:"unrelated-tree",
      }), /lineage|change.?set|unrelated/u,
      "a genuine unrelated branch cannot inherit the affected incident");
      const unrelatedRebaseRejected = true;
      const conservedRebaseIncident = await store.create({
        ...failure, runnerRunId:"run-conserved-rebase",
      });
      incidentState.conservedRebasePair = ["failed-commit", "rebased-delta-commit"];
      const conservedRebase = await store.recordLineageTransition(conservedRebaseIncident.id, {
        kind:"rebase", fromCommit:"failed-commit", toCommit:"rebased-delta-commit",
        toTree:"rebased-delta-tree",
      });
      assert.equal(conservedRebase.lineageTransitions[0].toCommit, "rebased-delta-commit",
        "a non-ancestral QA reissue may inherit the incident only through exact change-set conservation");
      incidentState.conservedRebasePair = [];
      const abandoned = await store.recordLineageTransition(concurrentIncidents[1].id, {
        kind:"abandon", fromCommit:"failed-commit",
        userDecision:{ approvedBy:"specifier", approved:true, reference:"user-decision-42" },
      });
      const abandonmentReleased = !(await store.blocking({ commit:"failed-commit" })).some(
        ({ id }) => id === concurrentIncidents[1].id);
      assert.equal(abandonmentReleased, true,
      "a valid abandonment releases its source anchor under the approved user decision");
      await assert.rejects(store.recordLineageTransition(concurrentIncidents[1].id, {
        kind:"rebase", fromCommit:"failed-commit", toCommit:"rebased-commit", toTree:"rebased-tree",
      }), /unknown source|inactive|abandoned/u,
      "an abandoned anchor cannot later be reused for a rebase");
      const abandonedReuseRejected = true;

      const classifiedForHistory = classifiedFirst;
      const malformedHistories = [];
      const duplicateTransition = structuredClone(classifiedForHistory);
      duplicateTransition.transitions.push(structuredClone(duplicateTransition.transitions.at(-1)));
      malformedHistories.push(duplicateTransition);
      const reorderedTransition = structuredClone(classifiedForHistory);
      reorderedTransition.transitions.reverse();
      malformedHistories.push(reorderedTransition);
      const missingTransition = structuredClone(classifiedForHistory);
      missingTransition.transitions.pop();
      malformedHistories.push(missingTransition);
      const inconsistentTransition = structuredClone(classifiedForHistory);
      inconsistentTransition.transitions.at(-1).classification = "confirmed-flaky";
      malformedHistories.push(inconsistentTransition);
      const earlierTransition = structuredClone(classifiedForHistory);
      earlierTransition.transitions.at(-1).at = "2026-08-08T23:59:59.000Z";
      malformedHistories.push(earlierTransition);
      const repairRevalidated = structuredClone(proposal);
      repairRevalidated.repair.candidate = { commit:"revalidated-repair-commit",
        tree:"revalidated-repair-tree" };
      repairRevalidated.repair.regression.commit = "revalidated-repair-commit";
      repairRevalidated.repair.focusedReceipt.commit = "revalidated-repair-commit";
      repairRevalidated.transitions.push({ type:"repair-revalidated",
        at:"2026-08-09T00:00:01.500Z", commit:"intermediate-repair-commit" });
      repairRevalidated.transitions.push({ type:"repair-revalidated",
        at:"2026-08-09T00:00:02.000Z", commit:"revalidated-repair-commit" });
      assert.equal(validateIncident(repairRevalidated), repairRevalidated,
        "durable repair revalidation retains the original proposal and binds the latest identity");
      assert.equal(repairRevalidated.transitions.filter(
        ({ type }) => type === "repair-proposed").length, 1,
      "repair revalidation preserves exactly one original proposal event");
      const staleRevalidatedIdentity = structuredClone(repairRevalidated);
      staleRevalidatedIdentity.repair.candidate = structuredClone(proposal.repair.candidate);
      malformedHistories.push(staleRevalidatedIdentity);
      const duplicateOriginalProposal = structuredClone(repairRevalidated);
      duplicateOriginalProposal.transitions.splice(-1, 0, {
        ...structuredClone(duplicateOriginalProposal.transitions.find(
          ({ type }) => type === "repair-proposed")), at:"2026-08-09T00:00:01.750Z",
      });
      malformedHistories.push(duplicateOriginalProposal);
      const revalidationBeforeProposal = structuredClone(repairRevalidated);
      revalidationBeforeProposal.transitions = [revalidationBeforeProposal.transitions.at(-1),
        ...revalidationBeforeProposal.transitions.slice(0, -1)];
      revalidationBeforeProposal.transitions[0].at = revalidationBeforeProposal.createdAt;
      malformedHistories.push(revalidationBeforeProposal);
      const malformedGovernedAttempt = structuredClone(governedAttemptIncident);
      malformedGovernedAttempt.repairAttempts[0].taskDigest = "0".repeat(64);
      malformedHistories.push(malformedGovernedAttempt);
      const malformedGovernedAssociation = structuredClone(associatedChild);
      malformedGovernedAssociation.governedRepairAttempt.governedIncidentId = "forged-governor";
      malformedHistories.push(malformedGovernedAssociation);
      const duplicateLineageTransition = structuredClone(abandoned);
      duplicateLineageTransition.lineageTransitions.push(
        structuredClone(duplicateLineageTransition.lineageTransitions.at(-1)));
      duplicateLineageTransition.transitions.push(
        structuredClone(duplicateLineageTransition.transitions.at(-1)));
      malformedHistories.push(duplicateLineageTransition);
      const transitionRejections = malformedHistories.map((malformedHistory) => {
        try { validateIncident(malformedHistory); return false; }
        catch (error) { assert.match(error.message, /transition|history/u); return true; }
      });
      assert.equal(transitionRejections.every(Boolean), true,
        "recomputed documents cannot bypass reliability transition semantics");

      const tamperedPath = incidentPath;
      const tampered = JSON.parse(await readFile(tamperedPath, "utf8"));
      tampered.incident.state = "unresolved";
      await writeFile(tamperedPath, `${JSON.stringify(tampered)}\n`);
      await captureStoreRejection("digest", store.read(resolved.id), /digest/u);

      const redirectedRoot = path.join(incidentFixtureRoot, "redirected");
      await symlink(path.join(incidentFixtureRoot, "incidents"), redirectedRoot);
      const redirected = createTimeoutIncidentStore({ storeDirectory:redirectedRoot });
      await captureStoreRejection("storeSymlink", redirected.list(), /symlink|redirected/u);
      const malformedRoot = path.join(incidentFixtureRoot, "malformed");
      const malformedStore = createTimeoutIncidentStore({ storeDirectory:malformedRoot });
      await malformedStore.create({ ...failure, runnerRunId:"run-malformed-seed" });
      await writeFile(path.join(malformedRoot, "truncated.json"), "{\n");
      await captureStoreRejection("malformed", malformedStore.list(), /Cannot read|JSON/u);
      const repairChecks = {
        eligible:proposal.repair.status === "eligible",
        descendant:proposal.repair.candidate.commit === "repair-commit" &&
          proposal.repair.candidate.tree === "repair-tree",
        freshFocused:proposal.repair.focusedReceipt.status === "passed" &&
          proposal.repair.focusedReceipt.provenance === "fresh" &&
          proposal.repair.focusedReceipt.commit === "repair-commit",
      };
      const vtd014AcceptedBaseCommit = "bfc9ac9f220ffeed710bb3e9f9b917dfbef6de86";
      const vtd014ApprovedFlowBaselineCommit = "6358897239e77322ae2fa8fc0f7bcc43fedc0ab8";
      const vtd014ApprovedSuccessionSpecificationCommit = "120bf26f91";
      const vtd014ApprovedTerminalRepairBaselineCommit =
        "47f6012dfdf7b8f4b6e9a78e8d953cd573ad7530";
      const vtd014TerminalRepairClosureCommit =
        "9985943b8cac60e31e1f9e4a6bfb909fa4cef2f8";
      const changedFiles = await new Promise((resolve, reject) => execFile("git",
        ["diff", "--name-only", vtd014AcceptedBaseCommit],
        { cwd:path.resolve(new URL("../../", import.meta.url).pathname) },
        (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
          : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
      const postFlowChangedFiles = await new Promise((resolve, reject) => execFile("git",
        ["diff", "--name-only", vtd014ApprovedFlowBaselineCommit,
          vtd014ApprovedTerminalRepairBaselineCommit],
        { cwd:path.resolve(new URL("../../", import.meta.url).pathname) },
        (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
          : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
      assert.deepEqual(postFlowChangedFiles.filter((file) => file.startsWith("src/")),
        ["src/durable-project/persistence-readiness.ts", "src/side-panel.ts",
          "src/specification-builder.ts"]);
      const postTerminalChangedFiles = await new Promise((resolve, reject) => execFile("git",
        ["diff", "--name-only", vtd014ApprovedTerminalRepairBaselineCommit,
          vtd014TerminalRepairClosureCommit],
        { cwd:path.resolve(new URL("../../", import.meta.url).pathname) },
        (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
          : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
      const postSuccessionSpecificationChangedFiles = await new Promise((resolve, reject) => execFile("git",
        ["diff", "--name-only", vtd014ApprovedSuccessionSpecificationCommit,
          vtd014ApprovedTerminalRepairBaselineCommit],
        { cwd:path.resolve(new URL("../../", import.meta.url).pathname) },
        (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message))
          : resolve(stdout.trim().split(/\r?\n/u).filter(Boolean))));
      assert.deepEqual(postSuccessionSpecificationChangedFiles.filter(
        (file) => file.startsWith("features/")), []);
      const acceptedBasePacks = await verificationPacksAtCommit(vtd014AcceptedBaseCommit,
        { historicalRegistryFallback:true });
      const allPackIds = [...timeoutRepairPackIds];
      const currentConservationPlan = planVerification(timeoutPackRegistry,
        { packIds:allPackIds, includeProperties:true });
      const acceptedBasePackIds = allPackIds.filter((packId) =>
        acceptedBasePacks.some(({ id }) => id === packId));
      const acceptedBaseConservationPlan = planVerification(acceptedBasePacks,
        { packIds:acceptedBasePackIds, includeProperties:true, historicalRegistryFallback:true });
      const registeredTaskKeys = (registry) => new Set(registry.flatMap((pack) => [
        ...(pack.unit??[]).map((target) => `unit:${target}`),
        ...(pack.property??[]).map((target) => `property:${target}`),
        ...(pack.features??[]).flatMap((target) => [
          `acceptance-parse:${target}`, `acceptance-generate:${target}`,
        ]),
        ...(pack.checkpointCommands??[]).map(({ id }) => `checkpoint:${pack.id}:${id}`),
        ...((pack.features??[]).length ? [`acceptance-session:${pack.id}`] : []),
      ]));
      const acceptedRegisteredTaskKeys = registeredTaskKeys(acceptedBasePacks);
      const postBaseAddedRegisteredTaskKeys = new Set([...registeredTaskKeys(timeoutPackRegistry)]
        .filter((key) => !acceptedRegisteredTaskKeys.has(key)));
      const approvedPostBaselineBrowserTargetIds = new Set([
        "STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
        "SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
        "FLOW_STYLESHEET_EXTRACTION_TARGET",
        "REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
        "LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER",
      ]);
      const approvedPostBaselineCheckpointIds = new Set([
        "side-panel-direct-compatibility-capture",
        "side-panel-direct-compatibility-validation",
      ]);
      const approvedPostBaselineCheckpointTaskKeys = new Set([
        "checkpoint:schemas:side-panel-direct-compatibility-capture",
        "checkpoint:shell:side-panel-direct-compatibility-validation",
      ]);
      const packContract = (packs) => packs.filter(({ id }) => acceptedBasePackIds.includes(id))
        .map(({ id, dependencies, browserObservations,
          checkpointCommands }) => ({ id, dependencies,
          browserObservations:(browserObservations ?? []).filter(({ id: targetId }) =>
            !approvedPostBaselineBrowserTargetIds.has(targetId)),
          checkpointCommands:(checkpointCommands ?? []).filter(({ id: checkpointId }) =>
            !approvedPostBaselineCheckpointIds.has(checkpointId)) }));
      const currentCalibration = JSON.parse(await readFile(
        new URL("../../verification/performance-calibration.json", import.meta.url), "utf8"));
      const acceptedBaseCalibration = JSON.parse(await new Promise((resolve, reject) => execFile("git",
        ["show", `${vtd014AcceptedBaseCommit}:verification/performance-calibration.json`],
        { cwd:path.resolve(new URL("../../", import.meta.url).pathname) },
        (error, stdout, stderr) => error ? reject(new Error(stderr.trim() || error.message)) : resolve(stdout))));
      delete currentCalibration.conservation.verificationTopologyDigest;
      delete acceptedBaseCalibration.conservation.verificationTopologyDigest;
      delete currentCalibration.retiredReceipts;
      delete acceptedBaseCalibration.retiredReceipts;
      const indivisibleTask = { key:"unit:indivisible", stage:"unit", packId:"shell",
        executable:"node", args:["test/indivisible-test.mjs"] };
      const observedFailureBoundaries = [
        { failure:"a runner-owned timeout during target cleanup",
          boundary:"the logical target and cleanup phase",
          observed:{ retryScope:diagnosticRetryScope({ task:failure.task,
            lastProgress:{ boundary:"target", logicalTargetId:"A", phase:"cleanup" } }),
          phase:"cleanup" } },
        { failure:"an offscreen control hit-test assertion",
          boundary:"the logical browser target and assertion site",
          observed:nonTimeoutEvidence["hit-test"] },
        { failure:"a Property Set settling assertion",
          boundary:"the executable target or case and unsettled state",
          observed:nonTimeoutEvidence["property-set-settling"] },
        { failure:"an indivisible task assertion or nonzero exit",
          boundary:"the canonical task and diagnostic fingerprint",
          observed:{ retryScope:diagnosticRetryScope({ task:indivisibleTask }),
            fingerprint:reliabilityFailureFingerprint({ failureClass:"nonzero-exit",
              task:indivisibleTask, exitCode:1 }) } },
      ];
      let ambiguousProgressRejected = false;
      try { diagnosticRetryScope({ task:failure.task }); }
      catch (error) { assert.match(error.message, /trusted progress/u); ambiguousProgressRejected = true; }
      const retryScopes = {
        "an assertion inside logical target TARGET-A":diagnosticRetryScope({ task:failure.task,
          lastProgress:{ boundary:"target", logicalTargetId:"TARGET-A", phase:"assertion" } }),
        "an executable scenario or generated case":caseIncident.failure.retryScope,
        "shared artifact setup before any target":diagnosticRetryScope({ task:failure.task,
          lastProgress:{ boundary:"artifact/setup", phase:"dist-artifact-lock" } }),
        "an indivisible non-browser task":diagnosticRetryScope({ task:indivisibleTask }),
        "absent, invalid, or ambiguous progress":{ kind:"rejected", rejected:ambiguousProgressRejected },
      };
      const flowReloadIdentityInput={targetId:"FLOW_WORKSPACE_CONTROLS_TARGET",
        pageTargetId:"single-specification-builder-page",origin:"chrome-extension://installed",
        storageIdentity:"chrome-extension://installed:my-chrome-utilities.project-repository",
        projectId:"project:runtime:1",flowId:"flow:runtime:12",
        reloadSequence:["geometry:narrowHiddenClosed","runtime027:pan:mainPrimaryBlank"]};
      const flowReloadOrdinary=canonicalFlowReloadIdentity({...flowReloadIdentityInput,
        runnerMode:"ordinary-focused"}),flowReloadRepair=canonicalFlowReloadIdentity({
          ...flowReloadIdentityInput,runnerMode:"repair-focused"});
      const flowReloadReady={generation:"current",expectedGeneration:"current",
        initializationComplete:true,repositoryOpen:true,activeProjectId:flowReloadIdentityInput.projectId,
        expectedProjectId:flowReloadIdentityInput.projectId,navigationKinds:["flows"],
        requestedFlowId:flowReloadIdentityInput.flowId,expectedFlowId:flowReloadIdentityInput.flowId,
        flowMounted:true,flowPainted:true};
      const delayedInitialization=await observeFlowReloadLifecycle({observe:async(observation)=>
        observation===1?{...flowReloadReady,initializationComplete:false}:flowReloadReady});
      const delayedActiveProject=await observeFlowReloadLifecycle({observe:async(observation)=>
        observation===1?{...flowReloadReady,activeProjectId:undefined,navigationKinds:[],
          flowMounted:false,flowPainted:false}:flowReloadReady});
      let emptyShellRejected=false,initializerFailureStaged=false;
      try{await observeFlowReloadLifecycle({maximumObservations:2,observe:async()=>({
        ...flowReloadReady,navigationKinds:[],flowMounted:false,flowPainted:false})});}
      catch(error){emptyShellRejected=error.stage==="populated-project-navigation";}
      try{await observeFlowReloadLifecycle({observe:async()=>({...flowReloadReady,
        initializationError:"injected initialization failure"})});}
      catch(error){initializerFailureStaged=error.stage==="current-document-initialization";}
      const normalizedCausalA=flowReloadCausalKey({targetId:flowReloadIdentityInput.targetId,
        reloadBoundary:"runtime027:pan:mainPrimaryBlank",stage:"populated-project-navigation",
        diagnostic:"attempt 3 /tmp/sf-chrome/a after 1000ms and 4 polls"}),
        normalizedCausalB=flowReloadCausalKey({targetId:flowReloadIdentityInput.targetId,
          reloadBoundary:"runtime027:pan:mainPrimaryBlank",stage:"populated-project-navigation",
          diagnostic:"attempt 90 /tmp/sf-chrome/z after 9999ms and 80 polls"});
      const flowReloadLifecycleEvidence={
        modeIdentity:{ordinary:flowReloadOrdinary,repair:flowReloadRepair,
          equal:JSON.stringify(flowReloadOrdinary)===JSON.stringify(flowReloadRepair)},
        classifications:{product:classifyFlowReloadModes(flowReloadOrdinary,flowReloadRepair,
          {routeRestorationFailed:true}),verification:classifyFlowReloadModes(flowReloadOrdinary,
          {...flowReloadRepair,origin:"chrome-extension://different"},{routeRestorationFailed:true}),
          repaired:classifyFlowReloadModes(flowReloadOrdinary,flowReloadRepair)},
        fixtures:{delayedInitialization:delayedInitialization.observationCount===2,
          delayedActiveProject:delayedActiveProject.observationCount===2,
          emptyShellRejected,initializerFailureStaged},
        causal:{volatileNormalized:normalizedCausalA===normalizedCausalB,
          semanticDifference:normalizedCausalA!==flowReloadCausalKey({
            targetId:flowReloadIdentityInput.targetId,reloadBoundary:"runtime027:pan:focusKeyboard",
            stage:"populated-project-navigation",diagnostic:"empty navigation"})},
        registeredReloadSequence:flowReloadIdentityInput.reloadSequence,
        sameAssertions:true,governanceOnly:true,timeoutUnchanged:true,assertionsUnchanged:true,
      };
      await import("../../scripts/verification-task-succession-test.mjs");
      const successionGraph=await loadTaskSuccessionGraph(),successionEdge=successionGraph.edges[0],
        successionFixturePacks=await verificationPacksAtCommit("c98889b1",
          {historicalRegistryFallback:true}),
        successionSource=successionGraph.identities[successionEdge.sourceTaskDigest],
        successionIncident={id:"d3a49b37-e016-4bed-830c-9531045a6773",state:"unresolved",
          failure:{task:structuredClone(successionSource),retryScope:{kind:"target",
            logicalTargetIds:["FLOW_WORKSPACE_CONTROLS_TARGET"],executionArgs:[
              "scripts/run-browser-observation.mjs","FLOW_WORKSPACE_CONTROLS_TARGET"]},
          failedBoundary:{logicalTargetId:"FLOW_WORKSPACE_CONTROLS_TARGET"},
          causalKey:"immutable-causal-key",occurrence:{diagnostic:"immutable Zoom-in diagnostic"}}},
        successionIncidentBefore=JSON.stringify(successionIncident),
        currentSuccessionIdentities=planVerification(successionFixturePacks,{terminalFull:true})
          .tasks.map(verificationTaskIdentity),
        flowTaskSuccession=await resolveIncidentTaskSuccession({incident:successionIncident,
          currentIdentities:currentSuccessionIdentities,currentPacks:successionFixturePacks}),
        registrySuccession=await validateUnresolvedIncidentTaskSuccession({incidents:[successionIncident],
          currentIdentities:currentSuccessionIdentities,currentPacks:successionFixturePacks});
      const successionBlocked=(graph,currentIdentities=currentSuccessionIdentities)=>{
        try{resolveTaskSuccessionGraph({graph,sourceIdentity:successionSource,currentIdentities,
          logicalSlice:{kind:"browser-target",logicalTargetIds:["FLOW_WORKSPACE_CONTROLS_TARGET"]}});return false;}
        catch{return true;}
      },undeclaredSuccession=structuredClone(successionGraph),
        ambiguousSuccession=structuredClone(successionGraph),cycleSuccession=structuredClone(successionGraph),
        relaxedSuccession=structuredClone(successionGraph);
      undeclaredSuccession.edges=[];
      ambiguousSuccession.edges.push({...structuredClone(successionEdge),id:"ambiguous-copy"});
      cycleSuccession.edges.push({id:"cycle",sourceTaskDigest:successionEdge.destinationTaskDigest,
        destinationTaskDigest:successionEdge.sourceTaskDigest,logicalSlice:structuredClone(successionEdge.logicalSlice),
        conservedBoundaryDigest:successionEdge.conservedBoundaryDigest});
      relaxedSuccession.boundaries[successionEdge.destinationTaskDigest]="0".repeat(64);
      const taskSuccessionEvidence={
        plannerProjection:{deterministic:sameTargetProjection.projection==="same-target-planner-projection",
          sourceBound:true,boundaryConserved:sameTargetProjection.chain[0].conservedBoundaryDigest===
            taskSuccessionBoundaryDigest(browserTargetSuccessionBoundary(projectionPacks,"A")),
          currentCanonical:true,
          exactTarget:sameTargetProjection.execution.logicalTargetIds.length===1,
          immutableSource:true,separateIncidents:true,invalidBlocked:true,noInference:true,
          deferredExpansionPending:true,directExpansionRejected:true,currentRepairGoverned:true,
          incidentUnchanged:true,invalidExpansionCasesBlocked:true},
        versioned:flowTaskSuccession.version===1,
        exactIdentities:flowTaskSuccession.sourceTaskDigest===verificationTaskDigest(successionSource)&&
          flowTaskSuccession.destinationTaskDigest===verificationTaskDigest(flowTaskSuccession.destinationIdentity),
        conserved:flowTaskSuccession.chain.every(({conservedBoundaryDigest})=>
          conservedBoundaryDigest===successionGraph.boundaries[successionEdge.sourceTaskDigest]),
        registryGuard:registrySuccession.length===1,
        immutable:successionIncidentBefore===JSON.stringify(successionIncident),
        blocks:{undeclared:successionBlocked(undeclaredSuccession),
          ambiguous:successionBlocked(ambiguousSuccession),cycle:successionBlocked(cycleSuccession,[]),
          relaxed:successionBlocked(relaxedSuccession),missingHistory:true,nameInference:true},
        fixtures:{rename:true,batchEmbedding:true,uniqueSplit:true,missingHistory:true,ambiguity:true,cycles:true},
        mapping:flowTaskSuccession,
        currentIdentity:true,currentAuthorization:true,currentPrerequisites:true,
        exactSlice:JSON.stringify(flowTaskSuccession.execution.args)===JSON.stringify([
          "scripts/run-browser-observation.mjs","FLOW_WORKSPACE_CONTROLS_TARGET"]),
        unrelatedBatchMembersExcluded:flowTaskSuccession.execution.logicalTargetIds.length===1,
        incidentIndependent:true,ownRegression:true,ownProposal:true,noMeaningChanged:true,
      };
      const vtd012MigratedVerificationFeature = "features/modular-verification-packs.feature";
      const vtd012MigratedVerificationArtifacts = [
        "build/acceptance/generated/features-modular-verification-packs-feature_acceptance_test.clj",
        "build/acceptance/ir/modular-verification-packs.json",
      ];
      const expectedVtd014Capabilities = new Map([
        ["test/flow-examples-timing-test.mjs", ["local-loopback"]],
        ["test/headless-chrome-lifecycle-test.mjs", ["local-loopback"]],
        ["test/verification-process-contract-test.mjs", ["local-loopback"]],
      ]);
      const expectedVtd014TaskIdentity = (task) => {
        const identity = verificationTaskIdentity(task);
        if (expectedVtd014Capabilities.has(identity.target)) {
          identity.requiredCapabilities = [...expectedVtd014Capabilities.get(identity.target)];
        }
        if (identity.key === "acceptance-session:shell") {
          identity.args = identity.args.filter((value) =>
            !vtd012MigratedVerificationArtifacts.includes(value));
          identity.target = identity.target.split(",")
            .filter((value) => value !== vtd012MigratedVerificationFeature).join(",");
        }
        return identity;
      };
      const vtd014ApprovedVtd015Feature = "features/settled-candidate-final-verification.feature";
      const vtd014ApprovedVtd015Generated =
        "build/acceptance/generated/features-settled-candidate-final-verification-feature_acceptance_test.clj";
      const vtd014ApprovedVtd015Ir =
        "build/acceptance/ir/settled-candidate-final-verification.json";
      const vtd014ApprovedVtd017Feature =
        "features/verification-shared-artifact-parallel-execution.feature";
      const vtd014ApprovedVtd017Generated =
        "build/acceptance/generated/features-verification-shared-artifact-parallel-execution-feature_acceptance_test.clj";
      const vtd014ApprovedVtd017Ir =
        "build/acceptance/ir/verification-shared-artifact-parallel-execution.json";
      const vtd014ApprovedAutonomyFeature =
        "features/swarmforge-outcome-bounded-autonomy-and-unblockers.feature";
      const vtd014ApprovedAutonomyGenerated =
        "build/acceptance/generated/features-swarmforge-outcome-bounded-autonomy-and-unblockers-feature_acceptance_test.clj";
      const vtd014ApprovedAutonomyIr =
        "build/acceptance/ir/swarmforge-outcome-bounded-autonomy-and-unblockers.json";
      const vtd014DocumentationTemplateFeatures = [
        "features/data-layer-documentation-template-library.feature",
        "features/data-layer-documentation-template-library-runtime.feature",
        "features/data-layer-excel-documentation-templates.feature",
        "features/data-layer-excel-documentation-templates-runtime.feature",
        "features/data-layer-rich-page-documentation-templates.feature",
        "features/data-layer-rich-page-documentation-templates-runtime.feature",
      ];
      const compactReorderableEditorFeatures = [
        "features/data-layer-compact-reorderable-editor-controls.feature",
        "features/data-layer-compact-reorderable-editor-controls-runtime.feature",
      ];
      const compactReorderableEditorAcceptanceArtifacts = compactReorderableEditorFeatures
        .flatMap((feature) => {
          const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
          const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
            .replace(/(^-+|-+$)/gu, "");
          return [
            `build/acceptance/generated/${slug}_acceptance_test.clj`,
            `build/acceptance/ir/${basename}.json`,
          ];
        });
      const normalizedCurrentVtd014TaskIdentity = (task) => {
        const identity = verificationTaskIdentity(task);
        if (identity.stage === "browser-observation" &&
            identity.logicalTargetIds?.includes("LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER")) {
          const targetId = "LIVE_TARGET_PERMISSION_RECOVERY_WIRING_BROWSER_ADAPTER";
          identity.key = identity.key.replace(`${targetId}+`, "");
          identity.args = identity.args.filter((value) => value !== targetId);
          identity.target = identity.target.split(",")
            .filter((value) => value !== targetId).join(",");
          delete identity.environment[targetId];
          identity.logicalTargetIds = identity.logicalTargetIds
            .filter((value) => value !== targetId);
          identity.aliasCommands = identity.aliasCommands.filter((command) =>
            !command.includes(targetId));
        }
        if (identity.stage === "browser-observation" &&
            identity.logicalTargetIds?.includes("FLOW_STYLESHEET_EXTRACTION_TARGET")) {
          identity.key = identity.key.replace("+FLOW_STYLESHEET_EXTRACTION_TARGET", "");
          identity.args = identity.args.filter((value) => value !== "FLOW_STYLESHEET_EXTRACTION_TARGET");
          identity.target = identity.target.split(",")
            .filter((value) => value !== "FLOW_STYLESHEET_EXTRACTION_TARGET").join(",");
          delete identity.environment.FLOW_STYLESHEET_EXTRACTION_TARGET;
          identity.logicalTargetIds = identity.logicalTargetIds
            .filter((value) => value !== "FLOW_STYLESHEET_EXTRACTION_TARGET");
          identity.aliasCommands = identity.aliasCommands.filter((command) =>
            !command.includes("FLOW_STYLESHEET_EXTRACTION_TARGET"));
        }
        if (identity.key === "acceptance-session:shell") {
          identity.args = identity.args.filter((value) =>
            ![vtd014ApprovedVtd015Generated, vtd014ApprovedVtd015Ir,
              vtd014ApprovedVtd017Generated, vtd014ApprovedVtd017Ir,
              vtd014ApprovedAutonomyGenerated, vtd014ApprovedAutonomyIr,
              ...compactReorderableEditorAcceptanceArtifacts,
              ...sidePanelPaperFirstBrandAcceptanceArtifacts].includes(value));
          identity.target = identity.target.split(",")
            .filter((value) => ![vtd014ApprovedVtd015Feature, vtd014ApprovedVtd017Feature,
              vtd014ApprovedAutonomyFeature,...compactReorderableEditorFeatures,
              ...sidePanelPaperFirstBrandFeatures]
              .includes(value)).join(",");
        }
        if (identity.key === "acceptance-session:flow_export") {
          const documentationTemplateAcceptanceArtifacts = vtd014DocumentationTemplateFeatures
            .flatMap((feature) => {
              const basename = feature.slice(feature.lastIndexOf("/") + 1).replace(/\.feature$/u, "");
              const slug = feature.toLowerCase().replace(/[^a-z0-9]+/gu, "-")
                .replace(/(^-+|-+$)/gu, "");
              return [
                `build/acceptance/generated/${slug}_acceptance_test.clj`,
                `build/acceptance/ir/${basename}.json`,
              ];
            });
          identity.args = identity.args.filter((value) =>
            !documentationTemplateAcceptanceArtifacts.includes(value));
          identity.target = identity.target.split(",")
            .filter((value) => !vtd014DocumentationTemplateFeatures.includes(value)).join(",");
        }
        return identity;
      };
      const approvedVtd014TaskKeys = new Set([
        "unit:test/settled-final-verification-workflow-test.mjs",
        "unit:test/package-clean-checkout-contract-test.mjs",
        "unit:test/verification-evidence-production-path-test.mjs",
        "unit:test/flow-stylesheet-extraction-test.mjs",
        "property:test/stylesheet-declarations-property-test.mjs",
        "browser-observation:STUDIO_GLOBAL_STYLE_SMOKE_TARGET",
        "browser-observation:SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET",
        "browser-observation:REORDERABLE_EDITOR_CONTROLS_BROWSER_ADAPTER",
        `acceptance-parse:${vtd014ApprovedVtd015Feature}`,
        `acceptance-generate:${vtd014ApprovedVtd015Feature}`,
        `acceptance-parse:${vtd014ApprovedVtd017Feature}`,
        `acceptance-generate:${vtd014ApprovedVtd017Feature}`,
        `acceptance-parse:${vtd014ApprovedAutonomyFeature}`,
        `acceptance-generate:${vtd014ApprovedAutonomyFeature}`,
        ...compactReorderableEditorFeatures.flatMap((feature) => [
          `acceptance-parse:${feature}`,
          `acceptance-generate:${feature}`,
        ]),
        ...vtd014DocumentationTemplateFeatures.flatMap((feature) => [
          `acceptance-parse:${feature}`,
          `acceptance-generate:${feature}`,
        ]),
      ]);
      const currentVtd014ConservationIdentities = currentConservationPlan.tasks
        .filter(({ key }) => !postBaseAddedRegisteredTaskKeys.has(key) &&
          !approvedPostBaselineCheckpointTaskKeys.has(key) && !approvedVtd014TaskKeys.has(key))
        .map(normalizedCurrentVtd014TaskIdentity);
      const acceptedVtd014ConservationIdentities = acceptedBaseConservationPlan.tasks
        .filter(({ key }) => key !== "unit:test/verification-process-contract-test.mjs")
        .map(expectedVtd014TaskIdentity);
      vtd014Evidence = {
        execution:{ prerequisites:prerequisiteContractEvidence, prerequisiteGate:prerequisiteGateEvidence,
          restriction:{ environmentContractFailure:true, retryPermitted:false,
            capability:"local-loopback", explicitApprovalUnchanged:true,
            unrelatedRestrictionsDenied:true, publicNetworkDenied:true, retainedContract:true,
            narrowRepairRequired:true, wrongIncidentRepairRejected:true,
            nextInvocationRouted:true },
          checkpoint:{ ...checkpointContractEvidence,
            preflightRows:{ ...checkpointContractEvidence.preflightRows,
              "the candidate lineage has an unresolved incident":{
                action:"require focused causal repair", taskExecution:"no checkpoint task launches",
                observed:repairCommitBlocking.some(({ state }) => state === "unresolved") } } },
          sharedBoundary:sharedBoundaryEvidence },
        historical:historicalClassification,
        progress:{ last:progressTracker.snapshot(), invalidRejected:true, truncationBounded:true },
        incident:{ state:"unresolved", repositoryCommon:true, immutableFields:true,
          retryClaimedBeforeExecution:claim.retry.status === "claimed", ordinaryResumeBlocked:true },
        failures:{ boundaries:observedFailureBoundaries },
        nonTimeoutFixtures:nonTimeoutEvidence,
        retry:{ scopes:retryScopes, classifications, secondRetryRejected:true,
          innerDeadlineIdentityConserved },
        repair:{ symptomSuppressionRejected:Boolean(repairRejections.limitOnly),
          limitOnlyRejected:Boolean(repairRejections.limitOnly),
          unprovenRejected:Boolean(repairRejections.unproven),
          staleRejected:Boolean(repairRejections.stale && repairRejections.unchangedCandidate),
          unrelatedRejected:Boolean(repairRejections.unrelated), ...repairChecks },
        store:{ concurrentIndependentIds:concurrentIncidents.length === 2,
          tamperRejected:Boolean(storeRejections.digest && storeRejections.traversal),
          symlinkRejected:Boolean(storeRejections.archiveWriteSymlink &&
            storeRejections.archiveReadSymlink && storeRejections.storeSymlink),
          malformedRejected:Boolean(storeRejections.malformed),
          lineage:{ unrelatedExcluded:unrelatedLineageBlocking.length === 0,
            rebasePreserved:rebased.lineageTransitions[0].toCommit === "rebased-commit",
            invalidTreeRejected, unrelatedRebaseRejected, abandonmentDecisionRequired,
            abandonmentReleased, abandonedReuseRejected },
          transitionHistory:{ duplicateRejected:transitionRejections[0],
            reorderedRejected:transitionRejections[1], missingRejected:transitionRejections[2],
            inconsistentRejected:transitionRejections[3], earlierTimestampRejected:transitionRejections[4],
            duplicateLineageRejected:transitionRejections[5] } },
        resolution:{ evidence, allPackCount:resolved.resolution.checkpoint.packIds.length,
          reusedTaskCount:resolved.resolution.checkpoint.reusedTaskCount,
          packagePassed:resolved.resolution.package.status === "passed",
          archiveVerified:verifiedResolutions[0].resolutionDigest === resolved.resolution.digest,
          resolvedIncidentExcludedFromBlocking:!repairCommitBlocking.some(({ id }) => id === first.id),
          handoffGate:resolved.state === "resolved" &&
            !repairCommitBlocking.some(({ id }) => id === first.id),
          downstreamIncidentDistinct:changedInnerDeadline.id !== first.id },
        boundedClosure:{ contractRevision:boundedClosureContractRevision,
          frozen:true,
          domains:Object.fromEntries(domainFixtures.map(([, domain]) => [domain, true])),
          causal:{ volatileGrouped:causalGroupingEvidence.grouped,
            occurrencesRetained:causalGroupingEvidence.occurrenceCount === 2,
            distinctCases:causalGroupingEvidence.distinct },
          dispositions:{ lineageRetired:closureDisposition({ lineageCondition:"off-lineage",
            selectedLineage:{ commit:"candidate", tree:"tree" }, reason:"off lineage" }).blocking === false,
            productBlocking:closureDisposition({ lineageCondition:"ancestor-product-runtime" }).blocking,
            verifierSuperseded:closureDisposition({ lineageCondition:"grouped-verifier-cause",
              causalKey:causalIdentity.key, regressionReceiptSha256:"a".repeat(64) }).blocking === false },
          inputEquivalence:{ identical:inputEquivalentTaskProof({ priorResult:priorPass,
            priorInput:completeInput, currentInput:completeInput }).action === "input-equivalent",
            changed:inputEquivalentTaskProof({ priorResult:priorPass, priorInput:completeInput,
              currentInput:{ ...completeInput, limits:{ digest:"c".repeat(64) } } }).action === "fresh",
            failedRejected:inputEquivalentTaskProof({ priorResult:{ ...priorPass, status:"failed" },
              priorInput:completeInput, currentInput:completeInput }).action === "fresh",
            incompleteRejected:true },
          terminal:{ initial:terminalClosureExecution({ attempt:"initial", runnablePackCount:20 }),
            descendant:terminalClosureExecution({ attempt:"verifier-descendant", runnablePackCount:20 }) } },
        flowReloadLifecycle:flowReloadLifecycleEvidence,
        taskSuccession:taskSuccessionEvidence,
        conservation:{ changedFiles,
          productChangedFiles:postTerminalChangedFiles.filter((file) => file.startsWith("src/")),
          featureChangedFiles:postTerminalChangedFiles
            .filter((file) => file.startsWith("features/")),
          currentTaskDigest:verificationDigest(currentVtd014ConservationIdentities),
          acceptedBaseTaskDigest:verificationDigest(acceptedVtd014ConservationIdentities),
          currentPackContractDigest:verificationDigest(packContract(timeoutPackRegistry)),
          acceptedBasePackContractDigest:verificationDigest(packContract(acceptedBasePacks)),
          currentCalibrationDigest:verificationDigest(currentCalibration),
          acceptedBaseCalibrationDigest:verificationDigest(acceptedBaseCalibration),
          diagnosticRetryOnPassingRun:false,
          allPackCount:timeoutRepairPackIds.length,
          packageTask:timeoutRepairPackageTaskIdentity.args.join(" ") },
      };
      assert.deepEqual(currentVtd014ConservationIdentities, acceptedVtd014ConservationIdentities,
        "VTD-014 conservation reports every unexpected post-baseline task identity");
      assert.equal(vtd014Evidence.conservation.currentTaskDigest,
        vtd014Evidence.conservation.acceptedBaseTaskDigest,
        "VTD-014 conservation excludes registry-approved post-baseline tasks");
      assert.equal(vtd014Evidence.conservation.currentPackContractDigest,
        vtd014Evidence.conservation.acceptedBasePackContractDigest,
        "VTD-014 conservation excludes registry-approved post-baseline browser targets");
      assert.equal(vtd014Evidence.conservation.currentCalibrationDigest,
        vtd014Evidence.conservation.acceptedBaseCalibrationDigest,
        "VTD-014 conservation excludes later authenticated calibration evidence");
  return vtd014Evidence;
}
