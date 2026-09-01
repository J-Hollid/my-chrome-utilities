export function validateBootstrapAuthority(authority,plan) {
  if (!authority||authority.task!==plan.task||authority.baseCommit!==plan.baseCommit) {
    throw new Error("Bootstrap authority identity does not match the plan");
  }
  if (authority.acceptedCandidate) throw new Error("Bootstrap authority has expired");
  return {active:true,task:authority.task,baseCommit:authority.baseCommit};
}
