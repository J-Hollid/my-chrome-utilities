(ns acceptance.verification-support.modular-architecture-task-checkpoint-repair-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]))

(defonce ^:private quiescence-evidence (atom nil))
(defonce ^:private repair-evidence (atom nil))

(defn- verified! [world]
  (let [quiescence (process-evidence/load!
                    quiescence-evidence
                    {:command ["node" "test/verification-contracts/execution-binding-contract-test.mjs"]
                     :prepared-task "unit:test/verification-contracts/execution-binding-contract-test.mjs"
                     :fallback ["node" "test/verification-contracts/execution-binding-contract-test.mjs"]
                     :prefix "{\"verificationTaskCheckpointIncidentRepairAcceptance\""
                     :key :verificationTaskCheckpointIncidentRepairAcceptance
                     :failure "Task-checkpoint failure-quiescence contract failed."
                     :missing "Task-checkpoint failure-quiescence evidence is missing."})
        repair (process-evidence/load!
                repair-evidence
                {:command ["node" "test/verification-contracts/reliability-regression-routing-contract-test.mjs"]
                 :prepared-task "unit:test/verification-contracts/reliability-regression-routing-contract-test.mjs"
                 :fallback ["node" "test/verification-contracts/reliability-regression-routing-contract-test.mjs"]
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
          #"^review-ready evidence and its terminal deferral are recorded only with fresh selected coverage and package proof$"]
   "211" [#"^task-checkpoint repair needs incident-aware fail-fast bounded-stage scheduling$"
          #"^the application-wide shared artifact helper would make that candidate genuinely global$"
          #"^the scheduler is placed under the existing verification-execution boundary$"
          #"^the shared artifact helper is byte-identical to the approved specification base$"
          #"^its existing scheduling, artifact lease, browser worker, and exported helper behavior is unchanged$"
          #"^exact readiness selects only Shell and verification process without an expansion cause or terminal obligation$"
          #"^a global-helper change, ownership exception, historical narrowing, or all-runnable-pack plan blocks before task launch$"]
   "212" [#"^a bounded parent verification run launches one registered contract task with an immutable run intent and authorized task set$"
          #"^that task invokes the production verification runner for a child plan$"
          #"^the inherited parent binding rejects the nested production run regardless of its requested mode, packs, tasks, or injected command runner$"
          #"^rejection occurs before a child receipt, plan summary, launch authorization, callback, or task launch$"
          #"^the rejected attempt is recorded only as the parent task failure and follows ordinary stage quiescence and incident handling$"
          #"^contract tests inspect broader plans through pure planning or isolated synthetic registries without invoking a production child run$"
          #"^direct build and package subprocesses inside the clean-checkout contract remain unchanged$"]})

(defn handlers []
  (vec (for [[scenario patterns] scenario-step-patterns
             pattern patterns]
         {:pattern pattern
          :applies? #(= (str "Modular verification packs " scenario)
                        (:acceptance/scenario-name %))
          :handler (fn [world _example _captures] (verified! world))})))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-29T10:19:15.834869086+02:00", :module-hash "133156156", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "979687865"} {:id "form/1/defonce", :kind "defonce", :line 5, :end-line 5, :hash "-814685918"} {:id "form/2/defonce", :kind "defonce", :line 6, :end-line 6, :hash "1068854842"} {:id "defn-/verified!", :kind "defn-", :line 8, :end-line 36, :hash "1524039898"} {:id "def/scenario-step-patterns", :kind "def", :line 38, :end-line 75, :hash "-849668430"} {:id "defn/handlers", :kind "defn", :line 77, :end-line 83, :hash "-1734612146"}]}
;; clj-mutate-manifest-end
