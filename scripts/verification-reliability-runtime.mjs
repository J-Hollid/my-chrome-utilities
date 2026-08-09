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
  throw new Error("Use: verification-reliability-incidents.mjs assert-handoff|assert-evidence [commit] | list | propose-repair <id> <causal-category> <causal-explanation> <regression-key> <regression-receipt> <focused-receipt>");
}
