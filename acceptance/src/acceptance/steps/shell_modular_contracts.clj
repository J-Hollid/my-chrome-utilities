(ns acceptance.steps.shell-modular-contracts
  (:require [acceptance.steps.support :as support]))

(def feature-files
  ["features/modular-acceptance-execution.feature"
   "features/modular-browser-runtime-adapters.feature"
   "features/modular-chrome-utility-architecture.feature"])

(defonce ^:private verified? (atom false))

(defn- verify-contract! []
  (when-not @verified?
    (let [task "unit:test/modular-utility-architecture-test.mjs"
          result (support/verified-task-result
                  task "node" "test/modular-utility-architecture-test.mjs")]
      (support/assert! (and (zero? (:exit result))
                            (re-find #"modular utility architecture tests passed"
                                     (:out result)))
                       "Modular utility architecture contracts failed."
                       {:out (:out result) :err (:err result)})
      (reset! verified? true))))

(defn- transition [world _example _captures _spec]
  (verify-contract!)
  (assoc world :shell-modular-contracts/active true))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files
   #{"acceptance features and handlers are assigned to verification packs"
     "browser-runtime behavior is assigned to utility verification packs"
     "the extension contains independently useful Chrome workflow utilities"}
   :shell-modular-contracts/active
   transition))
