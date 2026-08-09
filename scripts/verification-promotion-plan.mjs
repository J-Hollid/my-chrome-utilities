export function verificationPromotionTasks(pendingPath = "<pending-evidence>") {
  return [{ key:"promotion:pending-evidence", stage:"promotion", packId:null,
    executable:"node", args:["scripts/run-focused-acceptance.mjs", "--internal-pending-evidence"],
    target:"pending-evidence", environment:null, requiredCapabilities:[] },
  { key:"promotion:git-note", stage:"promotion", packId:null, executable:"node",
    args:["scripts/verification-evidence.mjs", "record", pendingPath], target:"git-note",
    environment:null, requiredCapabilities:["git-metadata-write"] }];
}

export function verificationGitNotePromotionTask(pendingPath) {
  return verificationPromotionTasks(pendingPath).find(({ key }) => key === "promotion:git-note");
}
