import { runVerificationAdministrationChecks } from "./administration-preflight.mjs";

export async function runVerificationAdministrationEligibility({
  task,
  plan,
  artifactInputDigest,
  requireCompletedReceipt = false,
  operations,
}) {
  let compatibility;
  let candidatePacks;
  let reliabilityResolutions = [];
  let consumedBlockedAggregateObligations = [];
  let consumedTerminalObligations;
  let terminalEligible = false;
  const checks = [
    { name:"candidate-plan-authority", validate:async() => {
      compatibility = await operations.validateCompatibility();
      candidatePacks = await operations.loadCandidatePacks(compatibility.commit);
      if (artifactInputDigest &&
          compatibility.rawReceipt?.artifactInput?.inputDigest !== artifactInputDigest) {
        throw new Error("Verification artifact input identity changed before task launch");
      }
      return { commit:compatibility.commit, tree:compatibility.tree,
        baseCommit:compatibility.baseCommit,
        planDigest:operations.digestPlan(compatibility.planRecord) };
    } },
    { name:"git-note-resolution", validate:async() => {
      const store = operations.createIncidentStore();
      reliabilityResolutions = await store.resolutions({ commit:compatibility.commit });
      await operations.inspectAncestorBlockedAggregateObligations(compatibility.commit);
      terminalEligible = operations.terminalPlanEligible(
        compatibility.planRecord, candidatePacks);
      consumedTerminalObligations = terminalEligible
        ? await operations.discoverTerminalObligations({
          baseCommit:compatibility.baseCommit,
          candidateCommit:compatibility.commit,
          candidateTree:compatibility.tree,
          finalPaths:compatibility.actualChangeSet.paths,
          finalTerminalPaths:compatibility.planRecord.terminalFullObligations ?? [],
        })
        : undefined;
      return { resolutionIds:reliabilityResolutions.map(({ incidentId }) => incidentId).sort(),
        terminalObligationCount:consumedTerminalObligations?.length ?? 0 };
    } },
    { name:"incident-state", validate:async() => {
      const rawReceipt = compatibility.rawReceipt;
      const runIntentBootstrap = rawReceipt.runIntentBootstrap;
      const blockedAggregateObligation = rawReceipt.blockedAggregateObligation;
      const confirmedFlakyAdmissions = rawReceipt.confirmedFlakyAdmissions;
      if (runIntentBootstrap) {
        await operations.validateRunIntentBootstrapBase({
          baseCommit:compatibility.baseCommit,
          changedPaths:compatibility.actualChangeSet.paths,
          evidenceTask:task,
          candidatePacks,
        });
        const incidents = await operations.loadBlockingIncidents(compatibility.commit);
        const coverage = await operations.runIntentBootstrapCoverage({
          incidents, plan, packs:candidatePacks,
          candidate:{ commit:compatibility.commit, tree:compatibility.tree },
          evidenceTask:task,
        });
        if (!operations.same(coverage, runIntentBootstrap.coverage)) {
          throw new Error("Run-intent bootstrap incident coverage changed");
        }
      } else if (blockedAggregateObligation) {
        await operations.assertBlockedAggregateAdmission({
          commit:compatibility.commit,
          obligation:blockedAggregateObligation,
          confirmedFlakyAdmissions,
        });
      } else {
        await operations.assertNoBlockingIncidents(compatibility.commit, {
          changedPaths:compatibility.actualChangeSet.paths,
          confirmedFlakyAdmissions,
        });
      }
      if (requireCompletedReceipt) {
        consumedBlockedAggregateObligations =
          await operations.collectBlockedAggregateConsumptions({
            currentObligation:blockedAggregateObligation,
            candidateCommit:compatibility.commit,
            candidateTree:compatibility.tree,
            baseCommit:compatibility.baseCommit,
            rawReceipt,
          });
      }
      return { status:"eligible" };
    } },
    { name:"promotion-capabilities", validate:async() => {
      const rows = operations.validatePromotionPrerequisiteContract(compatibility.rawReceipt);
      return { routes:Object.fromEntries(rows.map(({ key, route }) => [key, route])) };
    } },
  ];
  const administration = await runVerificationAdministrationChecks({
    phase:requireCompletedReceipt ? "final-evidence" : "prelaunch", checks,
  });
  return { ...compatibility, administration, candidatePacks,
    reliabilityResolutions:reliabilityResolutions.sort((left, right) =>
      left.incidentId.localeCompare(right.incidentId)),
    consumedBlockedAggregateObligations, consumedTerminalObligations, terminalEligible };
}
