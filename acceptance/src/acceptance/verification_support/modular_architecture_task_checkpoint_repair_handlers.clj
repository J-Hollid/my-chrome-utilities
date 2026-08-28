(ns acceptance.verification-support.modular-architecture-task-checkpoint-repair-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]))

(defonce ^:private quiescence-evidence (atom nil))
(defonce ^:private repair-evidence (atom nil))

(defn- verified! [world]
  (let [quiescence (process-evidence/load!
                    quiescence-evidence
                    {:command ["node" "test/verification-contracts/execution-checkpoint-contract-test.mjs"]
                     :prepared-task "unit:test/verification-contracts/execution-checkpoint-contract-test.mjs"
                     :fallback ["node" "test/verification-contracts/execution-checkpoint-contract-test.mjs"]
                     :prefix "{\"verificationTaskCheckpointIncidentRepairAcceptance\""
                     :key :verificationTaskCheckpointIncidentRepairAcceptance
                     :failure "Task-checkpoint failure-quiescence contract failed."
                     :missing "Task-checkpoint failure-quiescence evidence is missing."})
        repair (process-evidence/load!
                repair-evidence
                {:command ["node" "test/verification-contracts/reliability-run-intent-contract-test.mjs"]
                 :prepared-task "unit:test/verification-contracts/reliability-run-intent-contract-test.mjs"
                 :fallback ["node" "test/verification-contracts/reliability-run-intent-contract-test.mjs"]
                 :prefix "{\"verificationTaskCheckpointRepairAcceptance\""
                 :key :verificationTaskCheckpointRepairAcceptance
                 :failure "Task-checkpoint repair-proof contract failed."
                 :missing "Task-checkpoint repair-proof evidence is missing."})
        all-true? (fn [value]
                    (and (map? value)
                         (every? true? (mapcat vals (vals value)))))]
    (support/assert! (all-true? quiescence)
                     "Task-checkpoint failure quiescence evidence is incomplete."
                     {:evidence quiescence})
    (support/assert! (all-true? repair)
                     "Task-checkpoint repair proof evidence is incomplete."
                     {:evidence repair})
    world))

(def scenario-step-patterns
  {"207" [#"^an incident-aware evidence stage is running multiple tasks against one immutable checkpoint candidate$"
          #"^one task returns the first failing result$"
          #"^the stage closes to new task launches and requests bounded termination of every running sibling$"
          #"^the runner waits for child exit, output persistence, receipt callbacks, and cleanup before reporting the stage as quiesced$"
          #"^coordinator-cancelled siblings are recorded as cancelled without a reliability incident while independently failed siblings retain their ordinary incidents$"
          #"^repair work, candidate mutation, and compatible resume remain blocked until the durable quiesced boundary is complete$"]
   "208" [#"^an immutable execution-contract incident records checkpoint-identity operation task before one canonical task launched$"
          #"^its incident, source receipt, and failure-commit registry together bind the same run, candidate, plan, task identity, and failure digest$"
          #"^governed causal-repair planning derives the diagnosed boundary$"
          #"^it derives the exact canonical task key and execution arguments for repair only$"
          #"^a missing legacy causal key is derived only from the validated immutable task-checkpoint proof$"
          #"^it does not add a retry scope, permit an unchanged diagnostic retry, rewrite the source receipt, or mutate the incident$"
          #"^repair eligibility still requires a changed exact candidate, named cause, deterministic regression, and fresh focused execution$"]
   "209" [#"^a task-checkpoint repair proposal has (.+)$"
          #"^governed boundary derivation is evaluated$"
          #"^repair remains blocked with (.+)$"
          #"^no retry, task identity, passing evidence, incident transition, or compatibility disposition is inferred$"]
   "210" [#"^preserved incident (.+) has (.+) on the Event Library product lineage$"
          #"^the exact product remainder is conserved while the verification prerequisite reaches QA$"
          #"^the same stable product task resumes on the prerequisite QA descendant$"
          #"^(.+) makes that incident independently eligible on the resumed exact candidate$"
          #"^one fresh canonical owned-pack run may admit it without widening the plan or resolving it$"
          #"^review-ready evidence and its terminal deferral are recorded only with fresh selected coverage and package proof$"]})

(defn handlers []
  (vec (for [[_scenario patterns] scenario-step-patterns
             pattern patterns]
         {:pattern pattern
          :handler (fn [world _example _captures] (verified! world))})))
