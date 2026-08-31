(ns acceptance.verification-support.modular-architecture-temporary-lifecycle-handlers
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defonce ^:private verified? (atom false))

(defn- lifecycle-scenario? [world]
  (let [scenario (:acceptance/scenario-name world "")]
    (or (str/starts-with? scenario "Verification temporary storage lifecycle ")
        (str/starts-with? scenario "Verification receipt retention lifecycle "))))

(defn- verify-lifecycle! []
  (when-not @verified?
    (doseq [target ["test/verification-contracts/temporary-storage-lifecycle-test.mjs"
                    "test/verification-contracts/receipt-retention-lifecycle-test.mjs"
                    "test/swarmforge-workspace-lifecycle-test.mjs"]]
      (let [result (support/verified-command-result "node" target)]
        (support/assert! (zero? (:exit result))
                         "Verification lifecycle contract failed."
                         {:target target :out (:out result) :err (:err result)})))
    (reset! verified? true)))

(defn handlers []
  [{:pattern #"^(.+)$"
    :applies? lifecycle-scenario?
    :handler (fn [world _example _captures]
               (verify-lifecycle!)
            world)}])
