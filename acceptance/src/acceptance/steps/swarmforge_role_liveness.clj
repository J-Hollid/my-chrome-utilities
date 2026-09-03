(ns acceptance.steps.swarmforge-role-liveness
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files ["features/swarmforge-role-liveness-and-legacy-unblockers.feature"])
(defonce ^:private verified? (atom false))

(def checks
  [["unit:test/swarmforge-role-command-observation-runtime-test.mjs"
    "test/swarmforge-role-command-observation-runtime-test.mjs" "command observation"]
   ["unit:test/swarmforge-role-delivery-runtime-test.mjs"
    "test/swarmforge-role-delivery-runtime-test.mjs" "role delivery"]
   ["unit:test/swarmforge-role-lease-race-runtime-test.mjs"
    "test/swarmforge-role-lease-race-runtime-test.mjs" "lease race"]
   ["unit:test/swarmforge-role-task-lifecycle-runtime-test.mjs"
    "test/swarmforge-role-task-lifecycle-runtime-test.mjs" "task lifecycle"]
   ["unit:test/swarmforge-role-task-recovery-runtime-test.mjs"
    "test/swarmforge-role-task-recovery-runtime-test.mjs" "task recovery"]
   ["unit:test/swarmforge-role-batch-liveness-runtime-test.mjs"
    "test/swarmforge-role-batch-liveness-runtime-test.mjs" "batch role liveness"]
   ["unit:test/swarmforge-role-liveness-test.mjs"
    "test/swarmforge-role-liveness-test.mjs" "role liveness"]
   ["unit:test/swarmforge-unblocker-binding-compatibility-test.mjs"
    "test/swarmforge-unblocker-binding-compatibility-test.mjs" nil]])

(defn- verify-controls! []
  (when-not @verified?
    (doseq [[task command marker] checks]
      (let [result (support/verified-task-result task "node" command)]
        (support/assert! (and (zero? (:exit result))
                              (or (nil? marker) (str/includes? (:out result) marker)))
                         "SwarmForge role liveness production contracts failed."
                         {:task task :out (:out result) :err (:err result)})))
    (reset! verified? true)))

(defn- transition [world _example _captures _spec]
  (verify-controls!)
  (assoc world :swarmforge-role-liveness/active true))

(def handlers
  (support/feature-scoped-stateful-handlers
   feature-files
   #(= % "a SwarmForge role owns an approved task or queued handoff")
   :swarmforge-role-liveness/active
   transition))
