import { execFileSync } from "node:child_process";

const program = [
  "(require '[acceptance.verification-support.modular-architecture-process-evidence :as evidence]",
  "         '[acceptance.verification-support.modular-architecture-task-checkpoint-repair-handlers :as handlers])",
  "(let [calls (atom [])",
  "      world {:acceptance/scenario-name \"Modular verification packs 207\"}]",
  "  (with-redefs [evidence/load! (fn [_ options]",
  "                                  (swap! calls conj (:prepared-task options))",
  "                                  {:group {:passed true}})]",
  "    (let [step (first (filter #((:applies? %) world) (handlers/handlers)))]",
  "      (assert step)",
  "      (assert (= world ((:handler step) world nil nil)))",
  "      (assert (= #{\"unit:test/verification-contracts/execution-binding-contract-test.mjs\"",
  "                   \"unit:test/verification-contracts/reliability-regression-routing-contract-test.mjs\"}",
  "                 (set @calls))))))",
].join("\n");

execFileSync("bb", ["-e", program], { stdio:"inherit" });
console.log("task-checkpoint repair handler direct test passed");
