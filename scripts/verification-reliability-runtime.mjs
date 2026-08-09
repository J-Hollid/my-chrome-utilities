import {
  assertNoBlockingTimeoutIncidents, createTimeoutIncidentStore,
} from "./verification-reliability-store.mjs";

export { createTimeoutIncidentStore };

export async function runReliabilityIncidentCli(args) {
  const [command, commit = "HEAD"] = args;
  if (command === "assert-handoff" || command === "assert-evidence") {
    await assertNoBlockingTimeoutIncidents(commit);
    console.log("reliability incident gate passed");
    return;
  }
  if (command === "list") {
    console.log(JSON.stringify(await createTimeoutIncidentStore().list(), null, 2));
    return;
  }
  if (command === "propose-repair") {
    const [, id, causalCategory, causalExplanation, regressionKey, regressionReceiptPath,
      focusedReceiptPath] = args;
    const incident = await createTimeoutIncidentStore().proposeRepair(id, {
      causalCategory, causalExplanation, regressionKey, regressionReceiptPath, focusedReceiptPath,
    });
    console.log(JSON.stringify({ incidentId:incident.id, repair:incident.repair }, null, 2));
    return;
  }
  if (command === "record-rebase") {
    const [, id, fromCommit, toCommit, toTree] = args;
    const incident = await createTimeoutIncidentStore().recordLineageTransition(id, {
      kind:"rebase", fromCommit, toCommit, toTree,
    });
    console.log(JSON.stringify({ incidentId:incident.id,
      lineageTransition:incident.lineageTransitions.at(-1) }, null, 2));
    return;
  }
  if (command === "record-abandon") {
    if (process.env.SWARMFORGE_ROLE !== "specifier") {
      throw new Error("Only the specifier can record a separate user-approved abandonment decision");
    }
    const [, id, fromCommit, reference] = args;
    const incident = await createTimeoutIncidentStore().recordLineageTransition(id, {
      kind:"abandon", fromCommit,
      userDecision:{ approved:true, approvedBy:"specifier", reference },
    });
    console.log(JSON.stringify({ incidentId:incident.id,
      lineageTransition:incident.lineageTransitions.at(-1) }, null, 2));
    return;
  }
  throw new Error("Use: verification-reliability-incidents.mjs assert-handoff|assert-evidence [commit] | list | propose-repair <id> <causal-category> <causal-explanation> <regression-key> <regression-receipt> <focused-receipt> | record-rebase <id> <from-commit> <to-commit> <to-tree> | record-abandon <id> <from-commit> <user-decision-reference>");
}
