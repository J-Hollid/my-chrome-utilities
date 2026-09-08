import {execFileSync} from "node:child_process";
import {verifyClojureLaneRegression} from "./project-observation-sources/browser/clojure-lane-regression.mjs";
execFileSync("bb", ["-e", `(require '[clojure.test :as test] 'acceptance.project-observation-source-resolvers-test)
  (let [result (test/run-tests 'acceptance.project-observation-source-resolvers-test)]
    (when (pos? (+ (:fail result) (:error result))) (System/exit 1)))`], {stdio: "inherit"});
await verifyClojureLaneRegression(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ? JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) : undefined);
