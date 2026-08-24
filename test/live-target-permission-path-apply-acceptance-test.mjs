import { execFileSync } from "node:child_process";

execFileSync("bb", ["test/acceptance/live_target_permission_path_apply_test.clj"],
  { stdio:"inherit" });

console.log("live target permission path apply acceptance passed");
