import { execFileSync } from "node:child_process";

const expectedTasks = [
  "unit:test/verification-contracts/reliability-calibration-contract-test.mjs",
  "unit:test/verification-contracts/ownership-event-library-contract-test.mjs",
  "unit:test/verification-contracts/ownership-capture-contract-test.mjs",
  "unit:test/verification-contracts/ownership-schemas-contract-test.mjs",
  "unit:test/verification-contracts/evidence-promotion-conservation-contract-test.mjs",
  "unit:test/verification-contracts/ownership-priority-contract-test.mjs",
  "unit:test/verification-contracts/reliability-calibration-contract-test.mjs",
];
const program = [
  "(require '[acceptance.verification-support.modular-architecture-process-evidence :as evidence]",
  "         '[acceptance.verification-support.modular-architecture-throughput-evidence :as throughput])",
  "(let [calls (atom [])]",
  "  (with-redefs [evidence/load! (fn [_ options]",
  "                                  (swap! calls conj (:prepared-task options))",
  "                                  (if (:key options) {:prepared true}",
  "                                    {:vtd004Acceptance {:prepared true}",
  "                                     :vtd004DurableAcceptance {:prepared true}",
  "                                     :vtd004EventAcceptance {:prepared true}",
  "                                     :vtd004CaptureAcceptance {:prepared true}",
  "                                     :vtd004SchemasAcceptance {:prepared true}",
  "                                     :vtd005Acceptance {:prepared true}",
  "                                     :vtd009Acceptance {:prepared true}}))]",
  "    (let [world (throughput/prepare {})]",
  "      (assert (= #{:vtd004/project-evidence :vtd004/durable-evidence",
  "                   :vtd004/event-evidence :vtd004/capture-evidence",
  "                   :vtd004/schemas-evidence :vtd005/evidence :vtd009/evidence}",
  "                 (set (keys world))))",
  `      (assert (= ${JSON.stringify(expectedTasks)} @calls)))))`,
].join("\n");

execFileSync("bb", ["-e", program], { stdio:"inherit" });
console.log("modular throughput evidence direct test passed");
