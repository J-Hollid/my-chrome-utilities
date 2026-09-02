(ns acceptance.verification-support.modular-architecture-vtd014-checkpoint-evidence
  (:require [acceptance.verification-support.modular-architecture-process-evidence
             :as process-evidence]))

(defonce ^:private evidence-cache (atom nil))

(defn merge-into [aggregate]
  (let [checkpoint (process-evidence/load! evidence-cache
                     {:command ["node" (str "test/verification-contracts/"
                                            "execution-attempt-store-contract-test.mjs")]
                      :prepared-task "unit:test/verification-contracts/execution-attempt-store-contract-test.mjs"
                      :fallback ["node" (str "test/verification-contracts/"
                                             "execution-attempt-store-contract-test.mjs")]
                      :prefix "{\"vtd014CheckpointAcceptance\""
                      :key :vtd014CheckpointAcceptance
                      :failure "VTD-014 checkpoint process contract failed."
                      :missing "VTD-014 checkpoint evidence is missing."})]
    (-> aggregate
        (update-in [:execution :checkpoint] merge (dissoc checkpoint :preflightRows))
        (update-in [:execution :checkpoint :preflightRows]
                   merge (:preflightRows checkpoint)))))
