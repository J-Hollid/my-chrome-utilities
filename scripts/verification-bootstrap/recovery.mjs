const identityFields=["candidateCommit","candidateTree","planDigest","toolchainDigest","task"];

export function recoverBootstrapRun(stored,requested) {
  if (!stored||!requested||identityFields.some((field)=>stored[field]!==requested[field])||
      JSON.stringify(stored.incidentIds??[])!==JSON.stringify(requested.incidentIds??[])) {
    throw new Error("Bootstrap durable run identity changed");
  }
  const actions={running:"attach",completed:"use-receipt",failed:"report-failure"};
  const action=actions[stored.status];
  if (!action) throw new Error("Bootstrap durable run state is invalid");
  return {action,run:structuredClone(stored)};
}
