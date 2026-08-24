import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const cases = [
  {
    feature:"features/data-layer-observation-target-access.feature",
    scenario:"Data layer observation target access 009",
  },
  {
    feature:"features/data-layer-target-path-status-runtime.feature",
    scenario:"Data layer target path status runtime 002",
  },
];

mkdirSync("build/acceptance/ir", { recursive:true });
mkdirSync("build/acceptance/generated", { recursive:true });

for (const [index, testCase] of cases.entries()) {
  const ir = `build/acceptance/ir/live-target-permission-recovery-${index}.json`;
  execFileSync("bb", ["gherkin-parser", testCase.feature, ir], { stdio:"inherit" });
  execFileSync("bb", ["acceptance-entrypoint-generator", ir, "build/acceptance/generated"], {
    stdio:"inherit",
  });
  const expression = String.raw`
(require '[acceptance.runtime :as runtime]
         '[acceptance.pack-runtime :as packs]
         '[aps.json :as aps-json])
(let [feature (aps-json/read-json-file ${JSON.stringify(ir)})
      focused (assoc feature :scenarios
                     (filterv #(= ${JSON.stringify(testCase.scenario)} (:name %))
                              (:scenarios feature)))
      result (runtime/run-feature!
              focused
              (packs/handlers-for-feature ${JSON.stringify(testCase.feature)}))]
  (when-not (= {:status :passed :executions 1} result)
    (throw (ex-info "Unexpected focused permission-recovery product result"
                    {:result result}))))`;
  execFileSync("bb", ["-e", expression], { stdio:"inherit" });
}

console.log("live target permission recovery product scenarios passed");
