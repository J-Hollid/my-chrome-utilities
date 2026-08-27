import { execFileSync } from "node:child_process";

execFileSync("bb", ["-e", [
  "(require '[clojure.test :as test]",
  "         '[acceptance.live-target-permission-path-apply-test])",
  "(let [result (test/run-tests 'acceptance.live-target-permission-path-apply-test)]",
  "  (when (pos? (+ (:fail result) (:error result))) (System/exit 1)))",
].join("\n")],
  { stdio:"inherit" });

console.log("live target permission path apply acceptance passed");
