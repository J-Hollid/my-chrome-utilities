(ns acceptance.verification-support.modular-architecture-vtd017-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]
            [clojure.string :as str]))

(defonce ^:private evidence (atom nil))

(defn- prepared [world]
  (assoc world :vtd017/evidence
         (process-evidence/load! evidence
           {:command ["node" "test/verification-process-contract-legacy.mjs"]
            :prepared-task "checkpoint:verification_process:legacy-process-contract-conservation"
            :fallback ["node" "test/verification-process-contract-legacy.mjs"]
            :prefix "{\"vtd017Acceptance\"" :key :vtd017Acceptance
            :failure "VTD-017 process contract failed."
            :missing "VTD-017 process evidence is missing."})))

(defn- assert! [world predicate message]
  (support/assert! predicate message {:evidence (:vtd017/evidence world)})
  world)

(defn- values [example-values example captures]
  (let [resolved (example-values example captures)]
    (if (seq resolved) resolved captures)))

(defn handlers [{:keys [example-values]}]
  [{:pattern #"^one verification coordinator has prepared and validated an immutable build artifact$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^a (.+) plan contains two independent read-only browser tasks$"
    :handler (fn [world example captures]
               (assoc world :vtd017/plan-mode (first (values example-values example captures))))}
   {:pattern #"^the coordinator runs the plan with two browser workers$"
    :handler (fn [world _ _]
               (assert! world
                        (and (some #{(:vtd017/plan-mode world)}
                                   (get-in world [:vtd017/evidence :coordinator :planModes]))
                             (= 2 (get-in world [:vtd017/evidence :overlap :workerCount])))
                        "The coordinator did not run the selected plan with two workers."))}
   {:pattern #"^both tasks use the coordinator's exact artifact identity$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :coordinator :exactArtifactIdentity]))
                        "Parallel readers did not retain one artifact identity."))}
   {:pattern #"^both tasks start before either task completes$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :overlap :startsBeforeEitherCompletes]))
                        "Browser tasks did not overlap."))}
   {:pattern #"^neither task waits for the other task to release the artifact$"
    :handler (fn [world _ _]
               (assert! world (zero? (get-in world [:vtd017/evidence :overlap :artifactWaitMs]))
                        "A browser child reacquired the artifact lease."))}
   {:pattern #"^the combined result records each task once$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :coordinator :combinedResultOnce]))
                        "The combined result duplicated or lost a task."))}
   {:pattern #"^the coordinator currently serves its artifact to two concurrent readers$"
    :handler (fn [world _ _] world)}
   {:pattern #"^an external writer requests permission to replace the artifact$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the writer remains blocked until the coordinator releases the artifact$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :protection :outsideWriterBlocked]))
                        "An outside writer bypassed the coordinator lease."))}
   {:pattern #"^every browser task observes the validated artifact digest$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :coordinator :exactArtifactIdentity]))
                        "A browser task observed a different artifact digest."))}
   {:pattern #"^an attempted reader mutation fails the verification run$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :protection :readerMutationRejected]))
                        "Read-only artifact access permitted a mutation."))}
   {:pattern #"^parallel scheduling receives a browser task with (.+)$"
    :handler (fn [world example captures]
               (let [state (first (values example-values example captures))]
                 (assert! world
                          (contains? #{"private profile, debugging port, temporary data, evidence path, and cleanup"
                                       "shared writable state or an unproved dependency"}
                                     state)
                          "Concurrent eligibility received an unknown isolation state.")
                 (assoc world :vtd017/isolation-state state)))}
   {:pattern #"^the scheduler evaluates concurrent eligibility$"
    :handler (fn [world _ _] world)}
   {:pattern #"^(<scheduling_result>)$"
    :handler (fn [world example captures]
               (let [result (first (values example-values example captures))
                     private? (str/starts-with? (:vtd017/isolation-state world) "private")]
                 (assert! world
                          (contains? #{"it assigns an independent browser worker"
                                       "it keeps the task in one worker or runs it serially"}
                                     result)
                          "Concurrent eligibility produced an unknown scheduling result.")
                 (assert! world
                          (= private? (= result "it assigns an independent browser worker"))
                          "Concurrent eligibility did not preserve writable-state isolation.")))}
   {:pattern #"^the two-worker schedule has useful overlap and no per-task artifact wait$"
    :handler (fn [world _ _]
               (assert! world (and (pos? (get-in world [:vtd017/evidence :overlap :usefulOverlapMs]))
                                   (zero? (get-in world [:vtd017/evidence :overlap :artifactWaitMs])))
                        "Two-worker overlap evidence is incomplete."))}
   {:pattern #"^a three-worker candidate is compared using the exact layered_schema focused plan$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the normal sample is at least 60 seconds faster than the accepted two-worker sample$"
    :handler (fn [world _ _]
               (assert! world (>= (get-in world [:vtd017/evidence :workerDecision :accepted :savingsMs]) 60000)
                        "The three-worker normal sample missed its speed threshold."))}
   {:pattern #"^a loaded sample introduces no timeout, cleanup, port, profile, evidence, or artifact collision$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :workerDecision :accepted :loadedPassed]))
                        "The three-worker loaded sample was not isolated."))}
   {:pattern #"^three workers become the default only when both results pass$"
    :handler (fn [world _ _]
               (assert! world (= 3 (get-in world [:vtd017/evidence :workerDecision :accepted :workerCount]))
                        "Three workers were accepted without both samples."))}
   {:pattern #"^three workers do not satisfy the speed and stability threshold$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the worker decision is recorded$"
    :handler (fn [world _ _] world)}
   {:pattern #"^two workers remain the default$"
    :handler (fn [world _ _]
               (assert! world (= 2 (get-in world [:vtd017/evidence :workerDecision :rejectedWorkerCount]))
                        "A rejected candidate changed the worker default."))}
   {:pattern #"^the artifact-overlap improvement remains eligible for delivery$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :coordinator :oneLease]))
                        "The two-worker artifact correction was discarded."))}
   {:pattern #"^no failed result is retried at lower concurrency to turn it green$"
    :handler (fn [world _ _]
               (assert! world (false? (get-in world [:vtd017/evidence :workerDecision :accepted :retryAtLowerConcurrency]))
                        "A failed parallel result permits a green lower-concurrency retry."))}
   {:pattern #"^one parallel browser task fails$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the coordinator completes the remaining independent work$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :failure :remainingWorkCompleted]))
                        "A worker failure discarded independent work."))}
   {:pattern #"^the combined verification result fails$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :failure :combinedFailed]))
                        "A worker failure did not fail the combined result."))}
   {:pattern #"^the failed task retains its original identity, output, timing, and failure record$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd017/evidence :failure :originalIdentity]))
                        "The failed worker evidence was rewritten."))}
   {:pattern #"^repair requires focused causal proof followed by a fresh final run on the changed candidate$"
    :handler (fn [world _ _]
               (assert! world (false? (get-in world [:vtd017/evidence :failure :lowerConcurrencyRetry]))
                        "Failure repair may bypass causal and final proof."))}
   {:pattern #"^the settled VTD-017 candidate is ready for final verification$"
    :handler (fn [world _ _] world)}
   {:pattern #"^the architect runs the canonical final gate once$"
    :handler (fn [world _ _] world)}
   {:pattern #"^all 20 packs, properties, every existing evidence leaf, and packaging run against one artifact$"
    :handler (fn [world _ _]
               (let [final (get-in world [:vtd017/evidence :final])]
                 (assert! world (and (= 20 (:packCount final)) (:properties final) (:package final))
                          "The final plan does not conserve terminal evidence.")))}
   {:pattern #"^the receipt reports worker count, useful overlap, artifact wait, browser-stage time, and complete-gate time$"
    :handler (fn [world _ _]
               (assert! world (every? number? (vals (select-keys
                                                     (get-in world [:vtd017/evidence :overlap])
                                                     [:workerCount :usefulOverlapMs :artifactWaitMs])))
                        "The receipt omits parallel execution metrics."))}
   {:pattern #"^the passing evidence remains bound to the exact task, base, commit, tree, plan, artifact, and toolchain$"
    :handler (fn [world _ _]
               (assert! world (= #{"task" "base" "commit" "tree" "plan" "artifact" "toolchain"}
                                  (set (get-in world [:vtd017/evidence :final :bindings])))
                        "Final evidence bindings changed."))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-12T00:13:57.135156986+02:00", :module-hash "890464730", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-511802902"} {:id "form/1/defonce", :kind "defonce", :line 6, :end-line 6, :hash "701185655"} {:id "defn-/prepared", :kind "defn-", :line 8, :end-line 16, :hash "1140417774"} {:id "defn-/assert!", :kind "defn-", :line 18, :end-line 20, :hash "-1696981105"} {:id "defn-/values", :kind "defn-", :line 22, :end-line 24, :hash "-170718585"} {:id "defn/handlers", :kind "defn", :line 26, :end-line 166, :hash "1413126420"}]}
;; clj-mutate-manifest-end
