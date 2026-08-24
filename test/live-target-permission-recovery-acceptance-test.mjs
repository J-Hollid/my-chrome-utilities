import { execFileSync } from "node:child_process";

const feature = "features/modular-verification-packs.feature";
const ir = "build/acceptance/ir/modular-verification-packs.json";
const generated = "build/acceptance/generated";

execFileSync("bb", ["gherkin-parser", feature, ir], { stdio:"inherit" });
execFileSync("bb", ["acceptance-entrypoint-generator", ir, generated], { stdio:"inherit" });

const expression = String.raw`
(require '[acceptance.runtime :as runtime]
         '[acceptance.pack-runtime :as packs]
         '[aps.json :as aps-json])
(let [feature (aps-json/read-json-file "build/acceptance/ir/modular-verification-packs.json")
      wanted (set (map #(format "Modular verification packs %03d" %)
                       (range 199 204)))
      focused (assoc feature :scenarios
                     (filterv #(contains? wanted (:name %)) (:scenarios feature)))
      result (runtime/run-feature!
              focused
              (packs/handlers-for-feature "features/modular-verification-packs.feature"))]
  (when-not (= {:status :passed :executions 9} result)
    (throw (ex-info "Unexpected focused permission-recovery acceptance result"
                    {:result result}))))`;

execFileSync("bb", ["-e", expression], { stdio:"inherit" });
console.log("live target permission recovery acceptance scenarios passed");
