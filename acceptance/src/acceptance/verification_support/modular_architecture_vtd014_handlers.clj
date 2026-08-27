(ns acceptance.verification-support.modular-architecture-vtd014-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]
            [acceptance.verification-support.modular-architecture-repository-inspection :as repository-inspection]
            [acceptance.verification-support.modular-architecture-vtd014-resolution-handlers :as resolution]))

(defonce ^:private evidence (atom nil))

(defn- production-evidence! []
  (process-evidence/load! evidence
    {:command ["node" "test/verification-contracts/reliability-run-intent-contract-test.mjs"]
     :prepared-task "unit:test/verification-contracts/reliability-run-intent-contract-test.mjs"
     :fallback ["node" "test/verification-contracts/reliability-run-intent-contract-test.mjs"]
     :prefix "{\"vtd014Acceptance\"" :key :vtd014Acceptance
     :failure "VTD-014 production process contract failed."
     :missing "VTD-014 production evidence is missing."}))

(defn- prepared [world]
  (assoc world :vtd014/evidence (production-evidence!)))

(defn- assert! [world predicate message]
  (support/assert! predicate message {:evidence (:vtd014/evidence world)})
  world)

(defn- values [example-values example captures]
  (let [resolved (example-values example captures)]
    (if (seq resolved) resolved captures)))

(defn- evidence-value [mapping key]
  (or (get mapping key) (get mapping (keyword key))))

(defn- row-value [world path row field]
  (some-> (get-in world (into [:vtd014/evidence] path))
          (evidence-value row)
          (evidence-value field)))

(defn- style-evidence [world boundary]
  (evidence-value (get-in world [:vtd014/evidence :styles]) boundary))

(def ^:private stylesheet-boundaries
  {"src/flow-graph/flow-workspace.css" "valid feature-local presentation"
   "src/flow-graph/flow-workspace-shell.css" "valid feature-to-shell bridge"
   "specification-builder-brand.css" "shared global presentation foundation"
   "invalid-boundary.css" "invalid or undeclared boundary"})

(def ^:private promotion-scope-keys
  {"receipt finalization only" "receipt-finalization"
   "pending evidence creation only" "pending-evidence"
   "Git-note recording only" "git-note-recording"
   "handoff eligibility checking only" "handoff-eligibility"})

(def ^:private prerequisite-routes
  {"the workspace sandbox cannot bind" "scoped-command-approval"
   "the workspace sandbox is sufficient" "workspace-sandbox"
   "scoped approval is denied" "blocked"})

(def ^:private prerequisite-task-contract
  {"the workspace sandbox cannot bind"
   {:task "a browser observation task" :access "local loopback binding and access"}
   "the workspace sandbox is sufficient"
   {:task "a workspace-only unit task" :access "no restricted host capability"}
   "scoped approval is denied"
   {:task "a browser observation task" :access "local loopback binding and access"}})

(def ^:private focused-verification-kinds
  {"a focused unit test" "unit"
   "a focused property test" "property"
   "a focused acceptance scenario" "acceptance"
   "a focused browser target" "browser"
   "a checkpoint command" "checkpoint"
   "the package task" "package"})

(def ^:private repair-predecessor-contract
  {"the Hotkeys acceptance session" "build plus its three Hotkeys parse and three generation tasks"
   "a registered browser artifact task" "build"
   "a workspace-only unit task" "no additional task"})

(def ^:private runner-mode-contract
  {"ordinary focused, exact, impact, or terminal execution"
   ["ordinary-focused" "exact" "impact" "terminal"]
   "one unchanged diagnostic retry" ["diagnostic-retry" "timeout-diagnostic"]
   "repair-focused execution" ["repair-focused" "timeout-repair-focused"]
   "a fresh or reclaimed repair checkpoint and its promotion"
   ["repair-checkpoint" "checkpoint-promotion"]})

(def ^:private prerequisite-closure-contract
  {["any registered typed prerequisite" "exactly one satisfier allowed by the requested mode"]
   "the satisfier is added and its own prerequisites are resolved"
   ["any registered typed prerequisite" "missing, denied, unavailable, or incompatible"]
   "execution is blocked before the first child with its exact required action"
   ["an unknown, ambiguous, cyclic, or catch-all item" "any state"]
   "plan validation fails closed before launch"})

(def ^:private prerequisite-outcome-contract
  {"a declared prerequisite is unsatisfied before authorization"
   {:classification "a structured prerequisite block"
    :effect "no incident, retry, task result, or passing evidence"
    :evidence :prerequisiteBlock}
   "an authorized child requests an undeclared prerequisite"
   {:classification "an execution-contract incident"
    :effect "repair of the declaration and a causal regression are required"
    :evidence :executionContractIncident}
   "an authorized child fails after every prerequisite is satisfied"
   {:classification "the task's normal reliability failure"
    :effect "the existing isolation, repair, and resolution rules apply"
    :evidence :normalReliabilityFailure}})

(def ^:private failure-domain-contract
  {"a product or runtime task fails after its authorized launch"
   {:domain "product-runtime" :effect "causal repair and fresh proof for every affected product input"}
   "runner, planner, harness, or verification-only acceptance logic fails"
   {:domain "verification-execution" :effect "a process regression and fresh proof only for influenced verification inputs"}
   "storage, evidence, history, or promotion fails after a task result"
   {:domain "verification-record" :effect "repair and retry of the failed record boundary while the immutable result remains"}
   "a declared prerequisite blocks before launch authorization"
   {:domain "environment-prerequisite" :effect "no incident, task result, diagnostic retry, or passing evidence"}})

(def ^:private causal-incident-contract
  {"the same domain, task, executable boundary, scenario or case, assertion site, and diagnostic shape"
   "append one occurrence to the existing incident without another blocker or retry allowance"
   "a different scenario, case, assertion site, or normalized diagnostic shape"
   "create a distinct incident with its own repair obligation"})

(def ^:private disposition-contract
  {"the failed commit is not an ancestor of the selected candidate"
   {:disposition "retired from this delivery lineage"
    :effect "the record stays durable, is not called resolved, and does not block this lineage"
    :evidence :lineageRetired}
   "an ancestor product-runtime failure occurred, including a confirmed flake"
   {:disposition "blocking product repair"
    :effect "causal regression and affected fresh product proof remain mandatory"
    :evidence :productBlocking}
   "one verifier cause repairs every grouped occurrence and passes its exact regression"
   {:disposition "verifier cause superseded"
    :effect "the occurrences close without claiming that a product repair resolved them"
    :evidence :verifierSuperseded}
   "the same unresolved verifier cause occurs again on a descendant"
   {:disposition "another occurrence in its causal group"
    :effect "no duplicate blocker, retry budget, or repair proposal is created"
    :evidence :verifierSuperseded}})

(def ^:private input-equivalence-contract
  {["one passing task result" "an identical input digest and complete influence proof"]
   {:action "that pass as input-equivalent proof with explicit prior provenance" :evidence :identical}
   ["one passing task result" "a changed input or an unknown or incomplete influence"]
   {:action "a fresh execution of that task" :evidence :changed}
   ["a failed or interrupted result" "any relation"]
   {:action "no carried proof" :evidence :failedRejected}})

(def ^:private flow-runner-modes
  {"ordinary focused execution" :ordinary
   "repair-focused execution" :repair})

(def ^:private flow-readiness-contract
  {"the current document generation has not completed initialization" "wait for the current initialization"
   "the repository is not open or the expected project is not active" "wait for the expected active project"
   "a connected project tree has no populated navigation" "wait for populated project navigation"
   "the requested Flow route is not mounted and painted" "wait for the requested Flow workspace"
   "every preceding stage is complete and the requested Flow is stably painted" "report ready"
   "the current initialization reports an error" "fail with that initialization stage"})

(def ^:private flow-classification-contract
  {"the canonical lifecycle is identical across modes and product initialization or route restoration fails"
   {:row :product :domain "product-runtime"
    :obligation "repair the product lifecycle and prove the causal product regression"}
   "repair-focused execution changes page, origin, storage, active project, requested Flow, or reload sequence"
   {:row :verification :domain "verification-execution"
    :obligation "repair the runner or harness and prove canonical mode equivalence"}})

(def ^:private flow-causal-contract
  {"the same semantic key but different attempt ids, temporary paths, elapsed durations, or polling counts"
   {:action "append an occurrence to the same causal incident" :evidence :volatileNormalized}
   "a different reload boundary, lifecycle stage, initializer error, or semantic identity"
   {:action "create a distinct causal incident" :evidence :semanticDifference}})

(def ^:private task-succession-contract
  {"a task-key rename"
   {:evidence "one successor preserves the exact executable boundary and result semantics"
    :result "that current task" :fixture :rename}
   "a standalone browser target enters a batch"
   {:evidence "one batch member preserves its target id, program, inputs, leaves, result, limits, and route"
    :result "that current batch task and exact logical target" :fixture :batchEmbedding}
   "one task is split"
   {:evidence "the complete failed boundary belongs to exactly one successor"
    :result "that unique current task and boundary" :fixture :uniqueSplit}
   "a boundary is removed, divided, duplicated, or relaxed"
   {:evidence "no unique lossless successor exists" :result "a prelaunch succession block"
    :fixture :ambiguity}
   "registry history or any succession edge is unavailable"
   {:evidence "the complete chain cannot be verified" :result "a prelaunch succession block"
    :fixture :missingHistory}})

(defn- non-timeout-fixtures [world]
  (vals (or (get-in world [:vtd014/evidence :nonTimeoutFixtures])
            (get-in world [:vtd014/evidence :non-timeout-fixtures]))))

(def ^:private retry-scopes
  {"an assertion inside logical target TARGET-A" "TARGET-A only"
   "an executable scenario or generated case" "that case only"
   "shared artifact setup before any target" "the setup boundary only and no target workflow"
   "an indivisible non-browser task" "that exact task"
   "absent, invalid, or ambiguous progress" "no retry until the progress contract is repaired"})

(def ^:private retry-outcomes
  {"passes" "confirmed-flaky"
   "repeats the same normalized failure" "reproduced-failure"
   "fails with another fingerprint" "changed-failure"
   "cannot conserve the isolated identity" "diagnostic-contract-failure"})

(def ^:private retry-outcome-keys
  {"passes" "passed"
   "repeats the same normalized failure" "sameFailure"
   "fails with another fingerprint" "failed"
   "cannot conserve the isolated identity" "identityChanged"})

(def ^:private repair-outcomes
  {"descendant code, a causal regression, and fresh focused verification"
   "eligible for one fresh all-pack checkpoint"
   "only a larger timeout, added sleep, repeated polling count, or weakened assertion"
   "rejected as symptom suppression"
   "only a budget, calibration, worker count, or environment label"
   "rejected as a limit-only change"
   "a verbal explanation without a deterministic causal regression"
   "rejected as unproven"
   "reused focused results, pre-repair results, no changed candidate, or an unrelated change"
   "rejected as stale or non-causal"})

(def ^:private incident-boundary-checks
  {"the logical target and cleanup phase"
   #(and (= "target" (get-in % [:retryScope :kind])) (= "cleanup" (:phase %)))
   "the logical browser target and assertion site"
   #(and (= "target" (get-in % [:retryScope :kind])) (:assertionSite %))
   "the executable target or case and unsettled state"
   #(and (= "case" (get-in % [:retryScope :kind]))
         (false? (get-in % [:boundedState :settled])))
   "the canonical task and diagnostic fingerprint"
   #(and (= "task" (get-in % [:retryScope :kind])) (= 64 (count (:fingerprint %))))})

(defn- incident-boundary-exact? [boundary observed]
  (if-let [check (incident-boundary-checks boundary)] (boolean (check observed)) false))

(def ^:private diagnostic-scope-checks
  {"an assertion inside logical target TARGET-A"
   #(= ["target" ["TARGET-A"]] [(:kind %) (:logicalTargetIds %)])
   "an executable scenario or generated case" #(= "case" (:kind %))
   "shared artifact setup before any target"
   #(= ["setup" []] [(:kind %) (:logicalTargetIds %)])
   "an indivisible non-browser task" #(= "task" (:kind %))
   "absent, invalid, or ambiguous progress"
   #(and (= "rejected" (:kind %)) (true? (:rejected %)))})

(defn- diagnostic-scope-exact? [boundary scope]
  (if-let [check (diagnostic-scope-checks boundary)] (boolean (check scope)) false))

(defn- incident-recording-handlers [example-values]
  [{:pattern #"^the canonical verification runner manifests (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/first-failure
                      (first (values example-values example captures))))}
   {:pattern #"^it records the failure before any unchanged retry$"
    :handler (fn [world _ _]
               (assert! world (= "unresolved" (get-in world [:vtd014/evidence :incident :state]))
                        "The manifested failure did not create an unresolved incident."))}])

(defn- incident-identity-handlers [example-values]
  [
   {:pattern #"^one repository-common reliability incident identifies (.+)$"
    :handler (fn [world example captures]
               (let [boundary (first (values example-values example captures))
                     record (first (filter #(= (:vtd014/first-failure world) (:failure %))
                                           (get-in world [:vtd014/evidence :failures :boundaries])))
                     observed (:observed record)
                     exact? (incident-boundary-exact? boundary observed)]
                 (assert! world (and (= boundary (:boundary record)) exact?)
                          "The reliability incident did not retain its smallest boundary.")))}
   {:pattern #"^(?:it retains the candidate lineage, canonical task, owning pack, failure class, normalized fingerprint, phase, bounded final state, receipt, artifact, and toolchain|the incident is visible from coder, refactorer, architect, and specifier worktrees|the failed result cannot later become passed merely by combining its output with a resumed receipt)$"
    :handler (fn [world _ _]
               (let [incident (get-in world [:vtd014/evidence :incident])]
                 (assert! world (and (:repositoryCommon incident) (:immutableFields incident)
                                     (:ordinaryResumeBlocked incident))
                          "Reliability incident identity, visibility, or resume blocking failed.")))}])

(defn- diagnostic-scope-handlers [example-values]
  [
   {:pattern #"^a reliability incident's last trusted boundary is (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/failure-boundary
                      (first (values example-values example captures))))}
   {:pattern #"^the agent uses its one unchanged diagnostic retry$"
    :handler (fn [world _ _]
               (assert! world (some? (evidence-value
                                      (get-in world [:vtd014/evidence :retry :scopes])
                                      (:vtd014/failure-boundary world)))
                        "The failure boundary has no deterministic diagnostic scope."))}])

(defn- diagnostic-execution-handlers [example-values]
  [
   {:pattern #"^it executes (<retry_scope>|TARGET-A only|that case only|the setup boundary only and no target workflow|that exact task|no retry until the progress contract is repaired)$"
    :handler (fn [world example captures]
               (let [boundary (:vtd014/failure-boundary world)
                     expected (first (values example-values example captures))
                     scope (evidence-value (get-in world [:vtd014/evidence :retry :scopes]) boundary)
                     exact? (diagnostic-scope-exact? boundary scope)]
                 (assert! world (and (= (retry-scopes boundary) expected) exact?)
                          "The diagnostic retry widened beyond the smallest failed boundary.")))}
   {:pattern #"^(?:no previously passing task or compatible sibling target executes|the candidate tree, artifact, toolchain, execution-load class, task configuration, environment, and applicable limits are unchanged)$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd014/evidence :incident :retryClaimedBeforeExecution]))
                                   (true? (get-in world [:vtd014/evidence :retry :innerDeadlineIdentityConserved])))
                        "Diagnostic identity was not conserved and claimed before execution."))}])

(defn- diagnostic-classification-handlers [example-values]
  [
   {:pattern #"^a reliability incident has not used its diagnostic retry$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^the unchanged isolated retry (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd014/retry-outcome
                      (first (values example-values example captures))))}])

(defn- diagnostic-result-handlers [example-values]
  [
   {:pattern #"^the incident classification is (.+)$"
    :handler (fn [world example captures]
               (let [outcome (:vtd014/retry-outcome world)
                     expected (first (values example-values example captures))
                     observed (evidence-value
                               (get-in world [:vtd014/evidence :retry :classifications])
                               (retry-outcome-keys outcome))]
                 (assert! world (and (= (retry-outcomes outcome) expected)
                                     (= expected observed))
                          "Diagnostic retry classification changed.")))}
   {:pattern #"^(?:it remains unresolved and blocks evidence and Git handoff|another unchanged retry or a normal resume containing the failed task is rejected)$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd014/evidence :retry :secondRetryRejected]))
                                   (true? (get-in world [:vtd014/evidence :incident :ordinaryResumeBlocked])))
                        "A classified timeout was allowed to become green."))}])

(defn- historical-timeout-handlers [_example-values]
  [
   {:pattern #"^the historical Capture receipt 1686032b-39aa-4140-a4db-f4f265e28eb5 passed 274 tasks before its five-target browser batch reached 600014 milliseconds$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^(?:its final output shows the dist-artifact lock owner but no logical target start|VTD-014 classifies the sanitized historical fixture|its active boundary is dist-artifact setup before any Capture target|its permitted diagnostic retry is the lock setup boundary only|the 274 passing tasks and all five Capture target workflows are excluded|the fixture does not create a retroactive live incident in repository-common state)$"
    :handler (fn [world _ _]
               (let [historical (get-in world [:vtd014/evidence :historical])]
                 (assert! world (and (= "artifact/setup" (:boundary historical))
                                     (= 274 (:excludedPassedTaskCount historical))
                                     (= 5 (count (:excludedLogicalTargetIds historical)))
                                     (false? (:retroactiveIncident historical)))
                          "Historical Capture timeout classification is not exact.")))}])

(defn- non-timeout-boundary-handlers [_example-values]
  [
   {:pattern #"^one fixture forces an offscreen control hit-test failure and another forces a Property Set settling failure$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^each exact failed boundary passes on its one unchanged isolated retry$"
    :handler (fn [world _ _]
               (let [fixtures (non-timeout-fixtures world)]
                 (assert! world (= #{"target" "case"}
                                    (set (map #(get-in % [:retryScope :kind]) fixtures)))
                          "Non-timeout retries widened beyond their failed boundaries.")))}])

(defn- non-timeout-classification-handlers [_example-values]
  [
   {:pattern #"^both incidents are classified confirmed-flaky without requiring a pre-registered failure message$"
    :handler (fn [world _ _]
               (assert! world (every? #(= "confirmed-flaky" (:classification %))
                                      (non-timeout-fixtures world))
                        "Non-timeout passing retries were allowed to become green."))}
   {:pattern #"^each retains its target or case, phase, assertion site, normalized fingerprint, and bounded observed geometry or unsettled state$"
    :handler (fn [world _ _]
               (assert! world (every? #(and (:phase %) (:assertionSite %)
                                            (= 64 (count (:fingerprint %))) (map? (:boundedState %)))
                                      (non-timeout-fixtures world))
                        "Non-timeout failure identity was not conserved."))}])

(defn- non-timeout-repair-handlers [_example-values]
  [
   {:pattern #"^neither passing retry supplies handoff evidence$"
    :handler (fn [world _ _]
               (assert! world (every? #(= "unresolved" (:state %))
                                      (non-timeout-fixtures world))
                        "A passing diagnostic retry supplied handoff evidence."))}
   {:pattern #"^both require a causal repair and deterministic regression$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd014/evidence :repair :unprovenRejected]))
                                   (every? #(= "unresolved" (:state %))
                                           (non-timeout-fixtures world)))
                        "A non-timeout flake bypassed causal repair."))}])

(defn- incident-handlers [example-values]
  (vec (concat (incident-recording-handlers example-values)
               (incident-identity-handlers example-values)
               (diagnostic-scope-handlers example-values)
               (diagnostic-execution-handlers example-values)
               (diagnostic-classification-handlers example-values)
               (diagnostic-result-handlers example-values)
               (historical-timeout-handlers example-values)
               (non-timeout-boundary-handlers example-values)
               (non-timeout-classification-handlers example-values)
               (non-timeout-repair-handlers example-values))))

(def ^:private repair-proposal-requirements
  {"descendant code, a causal regression, and fresh focused verification"
   [:eligible :descendant :freshFocused]
   "only a larger timeout, added sleep, repeated polling count, or weakened assertion"
   [:symptomSuppressionRejected]
   "only a budget, calibration, worker count, or environment label" [:limitOnlyRejected]
   "a verbal explanation without a deterministic causal regression" [:unprovenRejected]
   "reused focused results, pre-repair results, no changed candidate, or an unrelated change"
   [:staleRejected :unrelatedRejected]})

(defn- repair-proposal-observed? [repair-evidence repair]
  (when-let [requirements (repair-proposal-requirements repair-evidence)]
    (every? #(true? (get repair %)) requirements)))

(defn- repair-handlers [example-values]
  [
   {:pattern #"^a reliability incident has a proposed repair with (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/repair-evidence
                      (first (values example-values example captures))))}
   {:pattern #"^the resolution gate validates the proposal$"
    :handler (fn [world _ _]
               (assert! world (contains? repair-outcomes (:vtd014/repair-evidence world))
                        "Unknown reliability repair proposal class."))}
   {:pattern #"^the proposal is (.+)$"
    :handler (fn [world example captures]
               (let [repair-evidence (:vtd014/repair-evidence world)
                     outcome (first (values example-values example captures))
                     repair (get-in world [:vtd014/evidence :repair])
                     observed? (repair-proposal-observed? repair-evidence repair)]
                 (assert! world (and (= (repair-outcomes repair-evidence) outcome) observed?)
                          "Reliability causal repair gate accepted the wrong proposal class.")))}])

(defn- store-handlers [_example-values]
  [
   {:pattern #"^reliability incidents and their state transitions are written concurrently$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^repository-common incident state is loaded for evidence or handoff$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :store :concurrentIndependentIds]))
                        "Repository-common reliability state was not loaded."))}
   {:pattern #"^every stable incident id and immutable failure digest is retained exactly once$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :store :concurrentIndependentIds]))
                        "Concurrent incidents lost a stable identity."))}
   {:pattern #"^atomic state transitions cannot overwrite another writer$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :store :concurrentIndependentIds]))
                        "Concurrent incident transitions overwrote another writer."))}
   {:pattern #"^a redirected, symlinked, traversing, malformed, truncated, duplicate, out-of-order, or digest-mismatched record fails closed$"
    :handler (fn [world _ _]
               (let [store (get-in world [:vtd014/evidence :store])]
                 (assert! world (and (:tamperRejected store) (:symlinkRejected store)
                                     (:malformedRejected store)
                                     (every? true? (vals (:transitionHistory store))))
                          "Malformed reliability state did not fail closed.")))}
   {:pattern #"^an unrelated candidate lineage is not blocked$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :store :lineage :unrelatedExcluded]))
                        "An unrelated lineage was blocked."))}
   {:pattern #"^abandoning or rebasing the affected lineage cannot discard its unresolved incident without a separate specifier-approved user decision$"
    :handler (fn [world _ _]
               (let [lineage (get-in world [:vtd014/evidence :store :lineage])]
                 (assert! world (every? true? ((juxt :rebasePreserved :invalidTreeRejected
                                                    :unrelatedRebaseRejected
                                                    :abandonmentDecisionRequired
                                                    :abandonmentReleased
                                                    :abandonedReuseRejected) lineage))
                          "An affected lineage discarded its unresolved incident.")))}])

(defn- prerequisite-handlers [example-values]
  [
   {:pattern #"^canonical task (.+) declares (.+)$"
    :handler (fn [world example captures]
               (let [[task access] (values example-values example captures)]
                 (assoc (prepared world) :vtd014/prerequisite-row {:task task :access access})))}
   {:pattern #"^its current agent environment is (.+)$"
    :handler (fn [world example captures]
               (let [sandbox (first (values example-values example captures))
                     row (:vtd014/prerequisite-row world)
                     contract (prerequisite-task-contract sandbox)]
                 (assert! (assoc-in world [:vtd014/prerequisite-row :sandbox] sandbox)
                          (= [(:task contract) (:access contract)] [(:task row) (:access row)])
                          "The task kind or required access does not match its sandbox state.")))}
   {:pattern #"^execution prerequisites are resolved before the first task process is launched$"
    :handler (fn [world _ _]
               (assert! world (every? true? ((juxt :approvedFirstLaunch :workspaceNarrow
                                                    :deniedBeforeLaunch)
                                              (get-in world [:vtd014/evidence :execution :prerequisites])))
                        "Execution prerequisites were not resolved before launch."))}
   {:pattern #"^the first-run action is (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))
                     sandbox (get-in world [:vtd014/prerequisite-row :sandbox])]
                 (assert! world (and (= expected (row-value world [:execution :prerequisites :rows]
                                                           sandbox :firstRunAction))
                                     (= (prerequisite-routes sandbox)
                                        (row-value world [:execution :prerequisites :rows]
                                                   sandbox :route)))
                          "The declared first-run route was not used.")))}
   {:pattern #"^the launch result is (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))
                     sandbox (get-in world [:vtd014/prerequisite-row :sandbox])
                     expected-count (if (= "scoped approval is denied" sandbox) 0 1)]
                 (assert! world (and (= expected (row-value world [:execution :prerequisites :rows]
                                                           sandbox :launchResult))
                                     (= expected-count
                                        (row-value world [:execution :prerequisites :rows]
                                                   sandbox :launchCount)))
                          "The prerequisite launch result was not enforced.")))}
   {:pattern #"^no known-incompatible trial run or unchanged reliability retry occurs$"
    :handler (fn [world _ _]
               (let [sandbox (get-in world [:vtd014/prerequisite-row :sandbox])]
                 (assert! world (zero? (row-value world [:execution :prerequisites :rows]
                                                  sandbox :trialRunCount))
                        "A predictable sandbox trial run occurred.")))}
   {:pattern #"^no task inherits unrelated access from another task in its pack$"
    :handler (fn [world _ _]
               (let [prerequisites (get-in world [:vtd014/evidence :execution :prerequisites])]
                 (assert! world
                          (and (true? (:workspaceNarrow prerequisites))
                               (= {:scoped "scoped-command-approval|bwrap-shared-loopback"
                                   :workspace "workspace-sandbox|bwrap-unshared-network"}
                                  (:mixedRouteObservation prerequisites)))
                        "A workspace task inherited unrelated access.")))}

   {:pattern #"^a canonical task is declared workspace-only but an injected loopback bind reports a sandbox permission denial after preflight$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^VTD-014 handles the unexpected restriction$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :restriction :environmentContractFailure]))
                        "The unexpected sandbox restriction was not classified."))}
   {:pattern #"^it creates an environment-contract-failure incident at the execution-prerequisite boundary$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :restriction :environmentContractFailure]))
                        "No execution-contract incident was created."))}
   {:pattern #"^the incident retains the task, structured operation, capability, error code, sandbox route, and candidate lineage$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :restriction :retainedContract]))
                        "The execution-contract incident lost required identity."))}
   {:pattern #"^no unchanged retry is permitted and Git handoff remains blocked$"
    :handler (fn [world _ _]
               (assert! world (false? (get-in world [:vtd014/evidence :execution
                                                      :restriction :retryPermitted]))
                        "An execution-contract failure admitted an unchanged retry."))}
   {:pattern #"^resolution requires a narrow declaration or first-run routing repair, a deterministic preflight regression, and fresh focused verification$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :restriction :narrowRepairRequired]))
                        "Execution-contract repair requirements were incomplete."))}
   {:pattern #"^the repair cannot resolve an assertion, readiness, settling, hit-test, or timeout incident$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :restriction :wrongIncidentRepairRejected]))
                        "A capability repair relabelled another incident class."))}
   {:pattern #"^the next planned invocation arranges the declared capability before launching the task$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :restriction :nextInvocationRouted]))
                        "The repaired invocation did not arrange access before launch."))}
   {:pattern #"^missing, unknown, contradictory, or catch-all capability declarations fail plan validation$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :prerequisites :declarationsFailClosed]))
                        "Invalid capability declarations did not fail closed."))}
   {:pattern #"^explicit approval, unrelated host restrictions, and public-network denial remain unchanged$"
    :handler (fn [world _ _]
               (let [restriction (get-in world [:vtd014/evidence :execution :restriction])]
                 (assert! world (every? true? ((juxt :explicitApprovalUnchanged
                                                    :unrelatedRestrictionsDenied
                                                    :publicNetworkDenied) restriction))
                          "Capability metadata widened privilege policy.")))}])

(defn- checkpoint-handlers [example-values]
  [
   {:pattern #"^an all-pack checkpoint preflight finds (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/preflight-state
                      (first (values example-values example captures))))}
   {:pattern #"^it resolves the state before checkpoint task timing begins$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :checkpoint :singleton]))
                        "Checkpoint state was not resolved before task timing."))}
   {:pattern #"^its action is (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))
                     state (:vtd014/preflight-state world)]
                 (assert! world (and (= expected (row-value world [:execution :checkpoint :preflightRows]
                                                            state :action))
                                     (true? (row-value world [:execution :checkpoint :preflightRows]
                                                       state :observed)))
                          "Checkpoint preflight action was not bounded.")))}
   {:pattern #"^(the planned tasks may launch|no second all-pack process launches|no checkpoint task launches|tasks launch only after lease recovery completes)$"
    :handler (fn [world _ captures]
               (let [expected (first captures) state (:vtd014/preflight-state world)]
                 (assert! world (= expected (row-value world [:execution :checkpoint :preflightRows]
                                                       state :taskExecution))
                          "Checkpoint task launch did not honor the singleton lease.")))}
   {:pattern #"^<task_execution>$"
    :handler (fn [world example _]
               (let [world (prepared world)
                     expected (first (values example-values example ["<task_execution>"]))
                     state (:vtd014/preflight-state world)]
                 (assert! world (= expected (row-value world [:execution :checkpoint :preflightRows]
                                                       state :taskExecution))
                          "Checkpoint task launch did not honor the singleton lease.")))}
   {:pattern #"^no duplicate checkpoint receipt is created$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :checkpoint :singleton]))
                        "A duplicate checkpoint receipt was created."))}

   {:pattern #"^one immutable post-repair checkpoint attempt has durably passed some tasks and is externally interrupted during another task$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^the exact candidate, plan, artifact, toolchain, environment class, and capability routes restart verification$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :checkpoint :continuation]))
                        "The exact checkpoint attempt was not continued."))}
   {:pattern #"^(?:the runner automatically discovers the one compatible incomplete attempt without a supplied receipt path|it retains the same attempt identity and reuses only its durably passed tasks and logical targets|it runs only the interrupted and unstarted boundaries|continuation consumes no unchanged diagnostic retry and creates no duplicate receipt|no result from a pre-repair tree, another attempt, or another environment class is reused)$"
    :handler (fn [world _ _]
               (let [checkpoint (get-in world [:vtd014/evidence :execution :checkpoint])]
                 (assert! world (every? true? ((juxt :continuation :reusedOnlyPassed
                                                    :interruptedAndUnstartedOnly
                                                    :identityDriftRejected) checkpoint))
                          "Checkpoint continuation evidence is incomplete.")))}
   {:pattern #"^ambiguous, tampered, or identity-mismatched recovery state blocks with a diagnostic instead of silently running all packs again$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (get-in world [:vtd014/evidence :execution
                                                                 :checkpoint :forgedAttemptRejected])))
                        "A recomputed forged checkpoint attempt was accepted."))}

   {:pattern #"^every planned task including packaging has passed in one immutable attempt and its exact results are durable$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^(.+) prevents handoff readiness$"
    :handler (fn [world example captures]
               (assoc world :vtd014/promotion-failure
                      (first (values example-values example captures))))}
   {:pattern #"^recovery retries (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))
                     failure (:vtd014/promotion-failure world)
                     observed (evidence-value
                               (get-in world [:vtd014/evidence :execution :checkpoint
                                              :promotionScopes]) failure)]
                 (assert! world (= (promotion-scope-keys expected) observed)
                          "Promotion recovery reran verification work.")))}
   {:pattern #"^no unit, property, acceptance, browser, checkpoint, or package task executes again$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :checkpoint :promotionOnly]))
                        "Promotion recovery executed a completed task."))}
   {:pattern #"^a duplicate all-pack invocation is rejected with the recoverable attempt identity$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :checkpoint :promotionOnly]))
                        "A completed attempt admitted duplicate execution."))}
   {:pattern #"^changed candidate, artifact, plan, registry, or toolchain identity instead requires genuinely fresh verification$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :checkpoint :identityDriftRejected]))
                        "Changed checkpoint identity reused prior results."))}

   {:pattern #"^a checkpoint attempt has completed one stage with immutable identities$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^(.+) occurs before the next stage$"
    :handler (fn [world example captures]
               (assoc world :vtd014/checkpoint-drift
                      (first (values example-values example captures))))}
   {:pattern #"^(?:the attempt stops before another child process launches|passed results are retained for diagnosis but cannot be mixed with the changed identity|no automatic fresh all-pack attempt begins|an unexpected tracked-file write by a verification task creates an execution-contract incident)$"
    :handler (fn [world _ _]
               (let [row (evidence-value
                          (get-in world [:vtd014/evidence :execution :checkpoint :driftRows])
                          (:vtd014/checkpoint-drift world))]
                 (assert! world (every? true? ((juxt :stoppedBeforeLaunch :retainedForDiagnosis
                                                    :noFreshAttempt :executionContractIncident) row))
                          "Checkpoint identity drift did not fail closed.")))}])

(defn- universal-prerequisite-gate-handlers [example-values]
  [{:pattern #"^(.+) selects canonical verification tasks$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/runner-mode
                      (first (values example-values example captures))))}
   {:pattern #"^that mode requests its first child process$"
    :handler (fn [world _ _] world)}
   {:pattern #"^one shared prerequisite gate validates the complete executable plan$"
    :handler (fn [world _ _]
               (let [modes (runner-mode-contract (:vtd014/runner-mode world))
                     matrix (get-in world [:vtd014/evidence :execution :prerequisiteGate :modeMatrix])]
                 (assert! world (and (seq modes)
                                     (every? #(let [row (evidence-value matrix %)]
                                                (and (:authorized row) (:unauthorizedBlocked row)))
                                             modes))
                        "A registered runner mode bypassed the shared gate.")))}
   {:pattern #"^each permitted task receives one launch authorization bound to its identity, mode, predecessors, capabilities, actual route, run identity, artifact, and receipt$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :prerequisiteGate :authorization :taskBound]))
                        "Launch authorization identity is incomplete."))}
   {:pattern #"^command execution rejects a missing, reused, altered, or wrong-mode authorization before spawning a child$"
    :handler (fn [world _ _]
               (let [authorization (get-in world [:vtd014/evidence :execution
                                                   :prerequisiteGate :authorization])]
                 (assert! world (every? true? ((juxt :noDefault :missingBlocked :reusedBlocked
                                                    :alteredBlocked :wrongModeBlocked) authorization))
                          "An unauthorized command reached the spawn boundary.")))}

   {:pattern #"^the executable plan records (.+) for one task$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/typed-prerequisite
                      (first (values example-values example captures))))}
   {:pattern #"^the invocation has (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd014/prerequisite-state
                      (first (values example-values example captures))))}
   {:pattern #"^the shared gate computes the transitive prerequisite closure$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :prerequisiteGate :closure :transitive]))
                        "The prerequisite closure was not transitive."))}
   {:pattern #"^the gate response is (.+)$"
    :handler (fn [world example captures]
               (let [response (first (values example-values example captures))
                     expected (prerequisite-closure-contract
                               [(:vtd014/typed-prerequisite world)
                                (:vtd014/prerequisite-state world)])]
                 (assert! world (and (= expected response)
                                     (true? (get-in world [:vtd014/evidence :execution
                                                           :prerequisiteGate :closure
                                                           :invalidDeclarationsBlocked])))
                        "A typed prerequisite response did not fail closed.")))}
   {:pattern #"^every selected predecessor is ordered once before its consumer while unrelated work remains excluded$"
    :handler (fn [world _ _]
               (let [closure (get-in world [:vtd014/evidence :execution
                                             :prerequisiteGate :closure])]
                 (assert! world (and (:canonicalOrder closure) (:unrelatedExcluded closure))
                          "Prerequisite closure order or focus changed.")))}

   {:pattern #"^prerequisite evaluation reaches (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/prerequisite-boundary
                      (first (values example-values example captures))))}
   {:pattern #"^the runner classifies the outcome$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (get-in world [:vtd014/evidence :execution
                                                                  :prerequisiteGate
                                                                  :classifications])))
                        "A prerequisite outcome was misclassified."))}
   {:pattern #"^(.+) has declared destination (.+), style classification (.+), owner (.+), consumers (.+), QA targets (.+), and scope root (.+)$"
    :handler (fn [world example captures]
               (let [source (first (values example-values example captures))
                     boundary (get stylesheet-boundaries source source)]
                 (assoc (prepared world) :vtd014/style-boundary boundary)))}
   {:pattern #"^a feature-integration candidate changes a stylesheet classified as (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/style-boundary
                      (first (values example-values example captures))))}
   {:pattern #"^the QA plan selects (.+)$"
    :handler (fn [world example captures]
               (let [boundary (:vtd014/style-boundary world)
                     expected (first (values example-values example captures))
                     evidence (style-evidence world boundary)]
                 (assert! world (and (= expected (:expectedScope evidence))
                                     (= expected (:selected evidence))
                                     (or (= expected "no task launch")
                                         (and (:plannerInvoked evidence)
                                              (:reviewEvidencePath evidence))))
                          "Stylesheet QA scope did not come from the production planner and evidence path.")))}
   {:pattern #"^(?:the plan records|it records) terminal-full obligation (.+)$"
    :handler (fn [world example captures]
               (let [boundary (:vtd014/style-boundary world)
                     expected (first (values example-values example captures))
                     evidence (style-evidence world boundary)]
                 (assert! world (= (= "present" expected) (:terminalFullObligation evidence))
                          "Stylesheet terminal-full obligation does not match the production planner.")))}
   {:pattern #"^no all-20 feature-mode task launches$"
    :handler (fn [world _ _]
               (let [boundary (:vtd014/style-boundary world)
                     evidence (style-evidence world boundary)]
                 (assert! world
                          (and (map? evidence)
                               (< (count (:selectedPackIds evidence))
                                  (repository-inspection/runnable-pack-count
                                   (:modular/registry world))))
                          "Feature-integration stylesheet planning broadened to the all-20 terminal scope.")))}
   {:pattern #"^it records (a structured prerequisite block|an execution-contract incident|the task's normal reliability failure)$"
    :handler (fn [world example captures]
               (let [classification (first (values example-values example captures))
                     contract (prerequisite-outcome-contract (:vtd014/prerequisite-boundary world))]
                 (assert! world (and (= (:classification contract) classification)
                                     (true? (get-in world [:vtd014/evidence :execution
                                                           :prerequisiteGate :classifications
                                                           (:evidence contract)])))
                          "Prerequisite classification does not match its boundary.")))}
   {:pattern #"^the candidate receives (.+)$"
    :handler (fn [world example captures]
               (let [effect (first (values example-values example captures))
                     contract (prerequisite-outcome-contract (:vtd014/prerequisite-boundary world))]
                 (assert! world (= (:effect contract) effect)
                          "Prerequisite candidate effect does not match its boundary.")))}

   {:pattern #"^the canonical registries enumerate every runner mode and typed prerequisite kind$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^shared process-contract evidence iterates those registries$"
    :handler (fn [world _ _]
               (assert! world (and (seq (get-in world [:vtd014/evidence :execution
                                                        :prerequisiteGate :modeMatrix]))
                                   (seq (get-in world [:vtd014/evidence :execution
                                                        :prerequisiteGate :kindMatrix])))
                        "Prerequisite registry evidence is empty."))}
   {:pattern #"^every mode proves that an authorized task launches and an unauthorized task cannot spawn$"
    :handler (fn [world _ _]
               (assert! world (every? #(and (:authorized %) (:unauthorizedBlocked %))
                                      (vals (get-in world [:vtd014/evidence :execution
                                                           :prerequisiteGate :modeMatrix])))
                        "Runner-mode matrix coverage is incomplete."))}
   {:pattern #"^every prerequisite kind proves satisfied, blocked, and undeclared-after-authorization outcomes$"
    :handler (fn [world _ _]
               (assert! world (every? #(every? true? ((juxt :satisfied :blocked
                                                           :undeclaredAfterAuthorization) %))
                                      (vals (get-in world [:vtd014/evidence :execution
                                                           :prerequisiteGate :kindMatrix])))
                        "Prerequisite-kind matrix coverage is incomplete."))}
   {:pattern #"^adding a mode or prerequisite kind without its validator, satisfier, and generated matrix coverage fails registry validation$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :prerequisiteGate :closure
                                                     :invalidDeclarationsBlocked]))
                        "Registry validation admitted incomplete coverage."))}
   {:pattern #"^the Shell missing-result fixture and process-contract wrong-route fixture remain causal examples rather than special-case branches$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (get-in world [:vtd014/evidence :execution
                                                                  :prerequisiteGate
                                                                  :causalFixtures])))
                        "Causal prerequisite fixtures became special-case branches."))}])

(defn- repair-prerequisite-handlers [example-values]
  [{:pattern #"^repair-focused execution selects (.+)$"
    :handler (fn [world example captures]
               (let [leaf (first (values example-values example captures))]
                 (assert! (assoc (prepared world) :vtd014/repair-leaf leaf)
                          (contains? repair-predecessor-contract leaf)
                          "Unknown repair-focused executable leaf.")))}
   {:pattern #"^the runner derives its executable plan from the current canonical registry$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :prerequisiteGate :closure :transitive]))
                        "Repair-focused planning bypassed canonical prerequisite closure."))}
   {:pattern #"^(.+) execute before the repair leaf in canonical stage order$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))]
                 (assert! world (= (repair-predecessor-contract (:vtd014/repair-leaf world)) expected)
                          "Repair-focused predecessor relation changed.")))}
   {:pattern #"^the repair leaf, its causal regression, affected process-contract tasks, and required predecessors are each recorded once with fresh provenance$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :prerequisiteGate :closure :canonicalOrder]))
                        "Repair-focused work was not recorded in canonical order."))}
   {:pattern #"^executable scope contains only those repair and predecessor tasks$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :prerequisiteGate :closure :unrelatedExcluded]))
                        "Repair-focused prerequisite closure selected unrelated work."))}])

(defn- shared-boundary-handlers [example-values]
  [
   {:pattern #"^a SwarmForge role runs (.+) for delivery$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/verification-kind
                      (first (values example-values example captures))))}
   {:pattern #"^the registered task manifests a failure$"
    :handler (fn [world _ _]
               (let [kind (focused-verification-kinds (:vtd014/verification-kind world))]
                 (assert! world (and kind
                                     (some #{kind} (get-in world [:vtd014/evidence :execution
                                                                 :sharedBoundary :focusedKinds]))
                                     (true? (get-in world [:vtd014/evidence :execution
                                                           :sharedBoundary :incidentAware])))
                        "The registered failure bypassed the incident boundary.")))}
   {:pattern #"^(?:the shared incident-aware execution boundary records it before any unchanged rerun|the same isolation, classification, causal repair, regression, and resolution rules apply|a raw direct diagnostic rerun cannot provide passing evidence or Git handoff eligibility|the closing all-pack checkpoint cannot start while the candidate lineage owns the unresolved focused incident)$"
    :handler (fn [world _ _]
               (let [boundary (get-in world [:vtd014/evidence :execution :sharedBoundary])]
                 (assert! world (and (:incidentAware boundary) (:rawDiagnosticIneligible boundary)
                                     (= 6 (count (:focusedKinds boundary))))
                          "A delivery verification path bypassed shared incident handling.")))}

   {:pattern #"^VTD-014 changes shared reliability, evidence, and handoff infrastructure for every runnable pack$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^a verification run completes without a failure$"
    :handler (fn [world _ _]
               (assert! world (false? (get-in world [:vtd014/evidence :conservation :diagnosticRetryOnPassingRun]))
                        "A passing run executed a reliability retry."))}
   {:pattern #"^(?:its exact task identities, logical targets, observations, assertion leaves, batching, budgets, calibrations, worker limits, shards, and package check are unchanged|no diagnostic retry executes|previously passing work may be reused for diagnosis but no failed result can bypass incident classification|no final post-repair checkpoint reuses a pre-repair result|no src product file, product behavior, saved value, accessibility result, feature owner, handler owner, pack dependency, target budget, calibration, worker limit, or shard changes|production impact boundaries are unchanged|the one-time delivery checkpoint runs every runnable pack in canonical order followed by node scripts/package.mjs)$"
    :handler (fn [world _ _]
               (let [prepared-world (prepared world)
                     conservation (get-in prepared-world [:vtd014/evidence :conservation])
                     digests-match? (and (= (:currentTaskDigest conservation)
                                            (:acceptedBaseTaskDigest conservation))
                                         (= (:currentPackContractDigest conservation)
                                            (:acceptedBasePackContractDigest conservation))
                                         (= (:currentCalibrationDigest conservation)
                                            (:acceptedBaseCalibrationDigest conservation)))]
                 (assert! prepared-world
                          (and (false? (:diagnosticRetryOnPassingRun conservation))
                                     (empty? (:productChangedFiles conservation))
                                     (empty? (:featureChangedFiles conservation))
                                     digests-match?
                                     (= (if (seq (:modular/registry prepared-world))
                                          (repository-inspection/runnable-pack-count
                                           (:modular/registry prepared-world))
                                          (:allPackCount conservation))
                                        (:allPackCount conservation))
                                     (= "scripts/package.mjs" (:packageTask conservation)))
                        "VTD-014 conservation evidence is incomplete.")))}])

(defn- bounded-closure-handlers [example-values]
  [{:pattern #"^VTD-014 closure has one user-approved contract revision$"
    :handler (fn [world _ _]
               (let [prepared-world (prepared world)]
                 (assert! prepared-world
                          (and (true? (get-in prepared-world [:vtd014/evidence :boundedClosure :frozen]))
                               (= "2f609d7a19fd966eb82c54b2938df1fd78e2d836"
                                  (get-in prepared-world [:vtd014/evidence :boundedClosure
                                                          :contractRevision])))
                          "The VTD-014 closure contract was not frozen.")))}
   {:pattern #"^a later observation would add another rigor requirement$"
    :handler (fn [world _ _] world)}
   {:pattern #"^(?:the new requirement is recorded outside the closure candidate for separate approval|only an implementation defect or failure of the frozen contract may change the closure candidate|behavior already prohibited by the frozen contract remains a defect rather than new scope|no assertion, incident record, or evidence-integrity rule is weakened to reach closure)$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :boundedClosure :frozen]))
                        "Frozen closure scope or integrity changed."))}

   {:pattern #"^a frozen-contract run reaches (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/observed-boundary
                      (first (values example-values example captures))))}
   {:pattern #"^declared ownership and the executed influence boundary classify the result$"
    :handler (fn [world _ _] world)}
   {:pattern #"^its failure domain is (.+)$"
    :handler (fn [world example captures]
               (let [domain (first (values example-values example captures))
                     contract (failure-domain-contract (:vtd014/observed-boundary world))]
                 (assert! world (and (= (:domain contract) domain)
                                     (true? (evidence-value
                                             (get-in world [:vtd014/evidence :boundedClosure :domains])
                                             domain)))
                          "A frozen-contract failure domain was not declared.")))}
   {:pattern #"^closure requires (.+)$"
    :handler (fn [world example captures]
               (let [effect (first (values example-values example captures))
                     contract (failure-domain-contract (:vtd014/observed-boundary world))]
                 (assert! world (= (:effect contract) effect)
                          "Closure effect does not match its failure domain.")))}

   {:pattern #"^an unresolved causal incident exists on an ancestor of the current candidate$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^a descendant manifests (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd014/causal-relation
                      (first (values example-values example captures))))}
   {:pattern #"^the store performs (.+)$"
    :handler (fn [world example captures]
               (let [causal (get-in world [:vtd014/evidence :boundedClosure :causal])]
                 (assert! world (and (= (causal-incident-contract (:vtd014/causal-relation world))
                                        (first (values example-values example captures)))
                                     (every? true? ((juxt :volatileGrouped :occurrencesRetained
                                                          :distinctCases) causal)))
                          "Structured causal occurrence handling is incomplete.")))}
   {:pattern #"^every occurrence retains its own commit, tree, result digest, and observed diagnostic$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :boundedClosure
                                                     :causal :occurrencesRetained]))
                        "A causal occurrence lost immutable provenance."))}

   {:pattern #"^an open incident is audited against the selected closure candidate$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^(.+) applies$"
    :handler (fn [world example captures]
               (assoc world :vtd014/lineage-condition
                      (first (values example-values example captures))))}
   {:pattern #"^its audited disposition is (.+)$"
    :handler (fn [world example captures]
               (let [contract (disposition-contract (:vtd014/lineage-condition world))
                     disposition (first (values example-values example captures))]
                 (assert! world (and (= (:disposition contract) disposition)
                                     (true? (get-in world [:vtd014/evidence :boundedClosure
                                                           :dispositions (:evidence contract)])))
                        "An incident disposition was not audited.")))}
   {:pattern #"^its integrity effect is (.+)$"
    :handler (fn [world example captures]
               (let [contract (disposition-contract (:vtd014/lineage-condition world))
                     effect (first (values example-values example captures))]
                 (assert! world (= (:effect contract) effect)
                          "Incident integrity effect does not match its disposition.")))}

   {:pattern #"^a frozen closure attempt contains (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/earlier-result
                      (first (values example-values example captures))))}
   {:pattern #"^a descendant changes verification-only files$" :handler (fn [world _ _] world)}
   {:pattern #"^the complete task input closure has (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd014/input-relation
                      (first (values example-values example captures))))}
   {:pattern #"^the descendant uses (.+)$"
    :handler (fn [world example captures]
               (let [contract (input-equivalence-contract [(:vtd014/earlier-result world)
                                                            (:vtd014/input-relation world)])
                     action (first (values example-values example captures))]
                 (assert! world (and (= (:action contract) action)
                                     (true? (get-in world [:vtd014/evidence :boundedClosure
                                                           :inputEquivalence (:evidence contract)])))
                        "Task input equivalence did not fail closed.")))}
   {:pattern #"^changed-path labels alone cannot establish equivalence$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :boundedClosure
                                                     :inputEquivalence :changed]))
                        "Changed-path classification established false equivalence."))}

   {:pattern #"^the closure contract is frozen and every known current-cause repair has focused proof$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^the terminal checkpoint begins on one sealed candidate$" :handler (fn [world _ _] world)}
   {:pattern #"^its initial attempt executes all 20 runnable packs freshly in canonical order$"
    :handler (fn [world _ _]
               (let [initial (get-in world [:vtd014/evidence :boundedClosure :terminal :initial])]
                 (assert! world (and (= "fresh-all" (:taskPolicy initial))
                                     (= 20 (:runnablePackCount initial)))
                          "The initial bounded checkpoint was not fresh all-20.")))}
   {:pattern #"^a verifier-only descendant reruns every task whose complete input closure changed while retaining only proven input-equivalent passes$"
    :handler (fn [world _ _]
               (assert! world (= "fresh-or-input-equivalent"
                                 (get-in world [:vtd014/evidence :boundedClosure :terminal
                                                :descendant :taskPolicy]))
                        "Verifier-descendant proof was not bounded by complete inputs."))}
   {:pattern #"^a product-runtime failure or unknown influence keeps closure open and cannot use carried proof$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd014/evidence :boundedClosure
                                                         :dispositions :productBlocking]))
                                   (true? (get-in world [:vtd014/evidence :boundedClosure
                                                         :inputEquivalence :incompleteRejected])))
                        "Product or unknown proof was carried into closure."))}
   {:pattern #"^the package task executes freshly against the final candidate tree$"
    :handler (fn [world _ _]
               (assert! world (every? #(= "fresh" (:packagePolicy %))
                                      (vals (get-in world [:vtd014/evidence :boundedClosure :terminal])))
                        "Package proof was reused."))}])

(defn- flow-reload-lifecycle-handlers [example-values]
  [{:pattern #"^one sealed candidate selects FLOW_WORKSPACE_CONTROLS_TARGET through (.+)$"
    :handler (fn [world example captures]
               (let [mode (first (values example-values example captures))]
                 (assert! (assoc (prepared world) :vtd014/flow-runner-mode mode)
                          (contains? flow-runner-modes mode)
                          "Unknown Flow reload runner mode.")))}
   {:pattern #"^the target crosses a registered browser reload boundary$" :handler (fn [world _ _] (assert! world (seq (get-in world [:vtd014/evidence :flowReloadLifecycle :registeredReloadSequence])) "The Flow target has no registered reload sequence."))}
   {:pattern #"^it retains the canonical page target, origin, storage, active project, requested Flow, and reload sequence$" :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :flowReloadLifecycle :modeIdentity :equal])) "Flow runner modes changed lifecycle identity."))}
   {:pattern #"^the target observes the same lifecycle stages and assertions in every runner mode$" :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :flowReloadLifecycle :sameAssertions])) "Flow runner modes changed lifecycle assertions."))}
   {:pattern #"^the runner mode changes only reliability governance and evidence recording$" :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :flowReloadLifecycle :governanceOnly])) "Flow runner mode changed executable lifecycle inputs."))}
   {:pattern #"^FLOW_WORKSPACE_CONTROLS_TARGET has begun one registered browser reload$" :handler (fn [world _ _] (prepared world))}
   {:pattern #"^lifecycle readiness observes (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd014/flow-observed-state
                      (first (values example-values example captures))))}
   {:pattern #"^readiness produces (.+)$"
    :handler (fn [world example captures]
               (let [result (first (values example-values example captures))]
                 (assert! world (and (= (flow-readiness-contract (:vtd014/flow-observed-state world)) result)
                                     (every? true? (vals (get-in world [:vtd014/evidence
                                                                        :flowReloadLifecycle :fixtures]))))
                          "Flow lifecycle readiness result does not match its observed state.")))}
   {:pattern #"^a deadline diagnostic names the earliest unmet lifecycle stage and its bounded state$" :handler (fn [world _ _] (assert! world (and (true? (get-in world [:vtd014/evidence :flowReloadLifecycle :fixtures :emptyShellRejected])) (true? (get-in world [:vtd014/evidence :flowReloadLifecycle :fixtures :initializerFailureStaged]))) "Flow lifecycle diagnostic did not retain its earliest stage."))}
   {:pattern #"^a launched FLOW_WORKSPACE_CONTROLS_TARGET does not restore its requested Flow after reload$" :handler (fn [world _ _] (prepared world))}
   {:pattern #"^the lifecycle comparison establishes (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd014/flow-causal-boundary
                      (first (values example-values example captures))))}
   {:pattern #"^the failure is (product-runtime|verification-execution)$"
    :handler (fn [world example captures]
               (let [contract (flow-classification-contract (:vtd014/flow-causal-boundary world))
                     domain (first (values example-values example captures))
                     row (get-in world [:vtd014/evidence :flowReloadLifecycle :classifications
                                        (:row contract)])]
                 (assert! world (and (= (:domain contract) domain) (= domain (:domain row)))
                          "Flow lifecycle failure domain does not match its causal boundary.")))}
   {:pattern #"^repair requires (.+)$"
    :handler (fn [world example captures]
               (let [contract (flow-classification-contract (:vtd014/flow-causal-boundary world))
                     obligation (first (values example-values example captures))]
                 (assert! world (= (:obligation contract) obligation)
                          "Flow lifecycle repair obligation does not match its failure domain.")))}
   {:pattern #"^one passing invocation alone cannot establish the failure domain$" :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :flowReloadLifecycle :modeIdentity :equal])) "Flow mode comparison lacks canonical identity evidence."))}
   {:pattern #"^a Flow reload failure has a canonical target, reload boundary, earliest unmet lifecycle stage, and diagnostic shape$" :handler (fn [world _ _] (prepared world))}
   {:pattern #"^a later failure has (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd014/flow-causal-relation
                      (first (values example-values example captures))))}
   {:pattern #"^incident storage performs (.+)$"
    :handler (fn [world example captures]
               (let [contract (flow-causal-contract (:vtd014/flow-causal-relation world))
                     action (first (values example-values example captures))]
                 (assert! world (and (= (:action contract) action)
                                     (true? (get-in world [:vtd014/evidence :flowReloadLifecycle
                                                           :causal (:evidence contract)])))
                          "Flow reload incident action does not match its causal relation.")))}
   {:pattern #"^each occurrence retains its exact candidate, tree, receipt, and observed lifecycle state$" :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :boundedClosure :causal :occurrencesRetained])) "Flow reload occurrence provenance was not retained."))}
   {:pattern #"^the 360 pixel Focus Canvas containment repair is retained on one sealed candidate$" :handler (fn [world _ _] (prepared world))}
   {:pattern #"^the Flow reload lifecycle correction is delivered$" :handler (fn [world _ _] world)}
   {:pattern #"^deterministic fixtures prove delayed initialization and active-project hydration are awaited without accepting an empty shell$" :handler (fn [world _ _] (let [fixtures (get-in world [:vtd014/evidence :flowReloadLifecycle :fixtures])] (assert! world (every? true? ((juxt :delayedInitialization :delayedActiveProject :emptyShellRejected) fixtures)) "Flow delayed lifecycle fixtures are incomplete.")))}
   {:pattern #"^the fixtures prove an initialization failure is reported at its lifecycle stage$" :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :flowReloadLifecycle :fixtures :initializerFailureStaged])) "Flow initializer failure was not staged."))}
   {:pattern #"^FLOW_WORKSPACE_CONTROLS_TARGET passes with the same registered reload sequence in ordinary focused and repair-focused execution$" :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :flowReloadLifecycle :modeIdentity :equal])) "Flow runner modes do not share a reload sequence."))}
   {:pattern #"^no behavioral reload is removed or reordered without separate conservation proof$" :handler (fn [world _ _] (assert! world (seq (get-in world [:vtd014/evidence :flowReloadLifecycle :registeredReloadSequence])) "Flow reload conservation evidence is missing."))}
   {:pattern #"^no timeout is increased, arbitrary wait is added, target scope is broadened, or product assertion is weakened$" :handler (fn [world _ _] (let [lifecycle (get-in world [:vtd014/evidence :flowReloadLifecycle])] (assert! world (every? true? ((juxt :timeoutUnchanged :assertionsUnchanged) lifecycle)) "Flow lifecycle limits or assertions changed.")))}
   {:pattern #"^the bounded VTD-014 closure policy selects every additional affected task and fresh final package proof$" :handler (fn [world _ _] (assert! world (= "fresh" (get-in world [:vtd014/evidence :boundedClosure :terminal :descendant :packagePolicy])) "Flow lifecycle package proof is not fresh."))}])

(defn- flow-stylesheet-handlers [example-values]
  [{:pattern #"^Flow presentation rules exist in the two global Specification Studio stylesheets before extraction$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^they are divided into a Flow-local stylesheet and a Flow-shell bridge$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :flowStyles :declaredBoundaries]))
                        "Flow stylesheet boundaries are not declared."))}
   {:pattern #"^every moved selector and declaration is accounted for exactly once$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :flowStyles :movedExactlyOnce]))
                        "Flow selector extraction is not conserved exactly once."))}
   {:pattern #"^every local selector remains beneath the stable Flow root$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :flowStyles :localScoped]))
                        "A Flow-local selector escapes the stable root."))}
   {:pattern #"^only the bridge may target the Studio body, workspace pane, navigation, inspector, sticky tools, or Focus Canvas shell$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :flowStyles :bridgeOnly]))
                        "Flow component presentation leaked into the shell bridge."))}
   {:pattern #"^shared brand tokens remain in the global foundation$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :flowStyles :brandTokensGlobal]))
                        "Shared brand tokens moved into a Flow-owned asset."))}
   {:pattern #"^no unrelated Studio selector moves or changes$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :flowStyles :unrelatedStudioStable]))
                        "Unrelated Studio presentation moved with the Flow rules."))}
   {:pattern #"^the installed Flow workspace renders (.+) before and after stylesheet extraction$"
    :handler (fn [world example captures]
               (let [state (first (values example-values example captures))
                     prepared-world (prepared world)
                     rows (get-in prepared-world [:vtd014/evidence :flowStyles :runtimeContract :rows])]
                 (assert! (assoc prepared-world :vtd014/flow-style-state state)
                          (some #(= state (:state %)) rows)
                          "Unknown Flow stylesheet presentation state.")))}
   {:pattern #"^its declared style boundary is observed at (.+) in (.+)$"
    :handler (fn [world example captures]
               (let [[viewport mode] (values example-values example captures)
                     state (:vtd014/flow-style-state world)
                     contract (get-in world [:vtd014/evidence :flowStyles :runtimeContract])
                     row (some #(when (= state (:state %)) %) (:rows contract))]
                 (assert! (assoc world :vtd014/flow-style-row row)
                          (and (= viewport (:viewport row))
                               (= mode (:displayMode row))
                               (= "66b91e38e6" (:baseCommit contract))
                               (= "browser-observation:FLOW_STYLESHEET_EXTRACTION_TARGET"
                                  (:observationTask contract))
                               (= [25 100 200] (:zooms contract)))
                          "Flow installed style observation does not cover its declared matrix.")))}
   {:pattern #"^component geometry, computed presentation, visible controls, focus behavior, and responsive containment are equivalent$"
    :handler (fn [world _ _]
               (let [paths (get-in world [:vtd014/evidence :flowStyles :runtimeContract :resultPaths])]
                 (assert! world (and (map? (:vtd014/flow-style-row world))
                                     (= "flowGraph.styles.equivalence" (:equivalence paths))
                                     (= "flowGraph.styles.keyboardFocus" (:keyboardFocus paths)))
                          "Flow computed presentation and geometry evidence is incomplete.")))}
   {:pattern #"^reduced-motion and forced-colors behavior remain available where applicable$"
    :handler (fn [world _ _]
               (let [paths (get-in world [:vtd014/evidence :flowStyles :runtimeContract :resultPaths])]
                 (assert! world (and (= "flowGraph.styles.reducedMotion" (:reducedMotion paths))
                                     (= "flowGraph.styles.forcedColors" (:forcedColors paths)))
                          "Flow accessibility media evidence is incomplete.")))}
   {:pattern #"^canonical project bytes, Flow revision, and Undo depth remain unchanged$"
    :handler (fn [world _ _]
               (assert! world (= "flowGraph.styles.canonicalStable"
                                 (get-in world [:vtd014/evidence :flowStyles :runtimeContract
                                                :resultPaths :canonicalStable]))
                        "Flow style observation changes canonical project state."))}
   {:pattern #"^the packaged extension loads the local and bridge assets without a missing reference$"
    :handler (fn [world _ _]
               (assert! world (and (true? (get-in world [:vtd014/evidence :flowStyles :packageAssets]))
                                   (= "flowGraph.styles.assetsLoaded"
                                      (get-in world [:vtd014/evidence :flowStyles :runtimeContract
                                                     :resultPaths :packageAssets])))
                        "The installed Flow stylesheet assets are not package-addressable."))}])

(defn- task-succession-handlers [example-values]
  [{:pattern #"^a historical incident boundary encounters (.+)$"
    :handler (fn [world example captures]
               (let [change (first (values example-values example captures))]
                 (assert! (assoc (prepared world) :vtd014/task-change change)
                          (contains? task-succession-contract change)
                          "Unknown task-succession change.")))}
   {:pattern #"^(?:an unresolved incident retains a failed task that is absent from the current canonical registry|every edge from one historical failure boundary to its current successor is conserved|a current-lineage product-runtime incident has one conserved current successor boundary|incident d3a49b37-e016-4bed-830c-9531045a6773 names the retired standalone FLOW_WORKSPACE_CONTROLS_TARGET task)$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^task succession validates (.+)$"
    :handler (fn [world example captures]
               (let [contract (task-succession-contract (:vtd014/task-change world))
                     evidence (first (values example-values example captures))]
                 (assert! world (and (= (:evidence contract) evidence)
                                     (true? (get-in world [:vtd014/evidence :taskSuccession
                                                           :fixtures (:fixture contract)])))
                          "Task-succession conservation evidence does not match its change.")))}
   {:pattern #"^(?:repair-focused planning resolves its historical failure boundary|repair-focused execution plans the mapped boundary|its product repair becomes eligible through that successor|the approved 360 pixel control-containment repair is applied through task succession)$"
    :handler (fn [world _ _] world)}
   {:pattern #"^it uses only a versioned task-succession graph from the failure registry to the current registry$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :versioned])) "Task succession is not versioned."))}
   {:pattern #"^each succession edge binds the exact source identity, destination identity, and conserved logical boundary$"
    :handler (fn [world _ _] (let [e (get-in world [:vtd014/evidence :taskSuccession])] (assert! world (and (:exactIdentities e) (:conserved e)) "Task succession did not conserve exact identities and boundary.")))}
   {:pattern #"^a registry change cannot retire a task used by an unresolved incident without declaring and validating its successor boundary$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :registryGuard])) "The unresolved-incident registry guard is absent."))}
   {:pattern #"^the immutable failure task, occurrence, causal key, and diagnostic remain unchanged$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :immutable])) "Task succession mutated incident evidence."))}
   {:pattern #"^an undeclared, inferred-by-name, ambiguous, cyclic, or incomplete succession blocks before execution$"
    :handler (fn [world _ _] (assert! world (every? true? (vals (get-in world [:vtd014/evidence :taskSuccession :blocks]))) "A malformed succession did not block."))}
   {:pattern #"^repair planning produces (.+)$"
    :handler (fn [world example captures]
               (let [contract (task-succession-contract (:vtd014/task-change world))
                     result (first (values example-values example captures))]
                 (assert! world (and (= (:result contract) result)
                                     (true? (get-in world [:vtd014/evidence :taskSuccession
                                                           :fixtures (:fixture contract)])))
                          "Task-succession mapping result does not match its conservation evidence.")))}
   {:pattern #"^the plan records the source and destination task digests, succession chain, logical slice, and conservation digest$"
    :handler (fn [world _ _] (let [m (get-in world [:vtd014/evidence :taskSuccession :mapping])] (assert! world (and (:sourceTaskDigest m) (:destinationTaskDigest m) (seq (:chain m)) (:logicalSlice m) (:conservationDigest m)) "The mapped plan lacks conservation provenance.")))}
   {:pattern #"^launch authorization, prerequisite closure, execution, and receipt use the current canonical task identity$"
    :handler (fn [world _ _] (let [e (get-in world [:vtd014/evidence :taskSuccession])] (assert! world (every? true? ((juxt :currentIdentity :currentAuthorization :currentPrerequisites) e)) "Mapped execution did not use current governance.")))}
   {:pattern #"^only the mapped logical slice, its causal regression, affected process-contract tasks, and prerequisites execute$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :exactSlice])) "Mapped execution broadened its logical slice."))}
   {:pattern #"^an unrelated member of a destination batch does not execute as repair proof$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :unrelatedBatchMembersExcluded])) "Mapped execution selected an unrelated batch member."))}
   {:pattern #"^(?:the incident retains its own id, domain, immutable failure identity, causal key, and occurrence history|task succession is not resolution, lineage retirement, verifier supersession, or product-cause grouping|distinct incidents may cite one repair candidate and focused receipt only when each has its own exact causal regression|incidents group only when every successor-normalized causal field matches, not merely because one change repairs both)$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :incidentIndependent])) "Task succession conflated incident identity or resolution."))}
   {:pattern #"^eligibility requires its own causal pre-repair failure and post-repair result plus fresh proof of the mapped boundary$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :ownRegression])) "Mapped eligibility lacks its own causal regression."))}
   {:pattern #"^the current Flow Graph batch preserves that logical target and every assigned assertion leaf$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :conserved])) "The Flow target boundary was not conserved."))}
   {:pattern #"^the incident maps to the current Flow Graph batch with only FLOW_WORKSPACE_CONTROLS_TARGET selected$"
    :handler (fn [world _ _] (assert! world (and (true? (get-in world [:vtd014/evidence :taskSuccession :exactSlice])) (true? (get-in world [:vtd014/evidence :taskSuccession :unrelatedBatchMembersExcluded]))) "The Flow succession slice is not exact."))}
   {:pattern #"^its Zoom-in containment symptom receives its own causal regression and repair proposal$"
    :handler (fn [world _ _] (let [e (get-in world [:vtd014/evidence :taskSuccession])] (assert! world (and (:ownRegression e) (:ownProposal e)) "The Zoom-in incident lacks independent repair evidence.")))}
   {:pattern #"^(?:its fresh mapped-target proof may share the sealed candidate and receipt with another containment incident|it is not lineage-retired or grouped with another incident solely because the product repair is shared)$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :incidentIndependent])) "Shared repair proof collapsed distinct incidents."))}
   {:pattern #"^process-contract fixtures cover rename, batch embedding, unique split, missing history, ambiguity, and cycles$"
    :handler (fn [world _ _] (assert! world (every? true? (vals (get-in world [:vtd014/evidence :taskSuccession :fixtures]))) "Task-succession fixture coverage is incomplete."))}
   {:pattern #"^no product behavior, assertion leaf, timeout, target scope, incident record, or evidence meaning changes$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :noMeaningChanged])) "Task succession changed evidence meaning."))}])

(defn- planner-projection-handlers [example-values]
  [{:pattern #"^(?:one governed review-evidence receipt contains a canonical browser batch and an alias-filtered prerequisite batch that both fail on the same single logical target|an unresolved browser incident needs a same-target planner projection|checkpoint prerequisite closure selects browser batches with overlapping logical targets or alias-only identity differences|a governed repair-focused preflight has one current incident whose bounded causal repair is ready|an inherited browser incident has an eligible repair and a terminal-verification-deferred disposition|that inherited incident diagnoses one target which appears in exactly one current canonical task|its receipt-bound same-target planner projection reports a changed historical-to-current target boundary|unresolved task succession is validated for the current repair plan)$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^the prerequisite task is absent from the current canonical plan only because its sibling-target set or alias commands differ$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :plannerProjection :sourceBound])) "Planner projection source is not governed."))}
   {:pattern #"^reliability repair planning compares that target in the failure-commit registry with its unique current canonical batch$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :plannerProjection :boundaryConserved])) "Planner projection boundary changed."))}
   {:pattern #"^an identical target boundary produces a deterministic same-target planner projection without requiring a declared task-succession edge$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :plannerProjection :deterministic])) "Same-target projection is not deterministic."))}
   {:pattern #"^the repair executes only the diagnosed logical target and its causal regression through the current canonical task identity$"
    :handler (fn [world _ _] (assert! world (every? true? ((juxt :exactTarget :currentCanonical) (get-in world [:vtd014/evidence :taskSuccession :plannerProjection]))) "Projected repair execution is not exact."))}
   {:pattern #"^both immutable incidents still require their own eligible causal repair proof before review evidence can proceed$"
    :handler (fn [world _ _] (assert! world (every? true? ((juxt :immutableSource :separateIncidents) (get-in world [:vtd014/evidence :taskSuccession :plannerProjection]))) "Projected incidents were conflated."))}
   {:pattern #"^no all-20 checkpoint, abandonment, incident rewrite, or unchanged diagnostic rerun is used in feature mode$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :plannerProjection :noInference])) "Planner projection widened feature authority."))}
   {:pattern #"^repair planning observes (.+)$"
    :handler (fn [world example captures] (assoc world :vtd014/invalid-projection (first (values example-values example captures))))}
   {:pattern #"^repair remains blocked with (.+)$"
    :handler (fn [world _ _] (assert! world (and (:vtd014/invalid-projection world) (true? (get-in world [:vtd014/evidence :taskSuccession :plannerProjection :invalidBlocked]))) "Invalid planner projection did not block."))}
   {:pattern #"^no task-succession, target equivalence, or passing evidence is inferred$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :plannerProjection :noInference])) "Invalid projection inferred equivalence."))}
   {:pattern #"^each affected target has one current canonical batch with the same registered pack, program, session, capabilities, and target boundary$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :execution :prerequisiteGate :browserNormalization :canonicalOnce])) "Browser target has no unique canonical batch."))}
   {:pattern #"^the executable checkpoint plan is normalized before launch authorization$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :execution :prerequisiteGate :browserNormalization :canonicalOnce])) "Browser prerequisite normalization was late."))}
   {:pattern #"^each affected target is assigned to its unique current canonical batch$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :execution :prerequisiteGate :browserNormalization :canonicalOnce])) "Browser target assignment is not unique."))}
   {:pattern #"^every prerequisite edge is rebound to those canonical tasks before authorization$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :execution :prerequisiteGate :browserNormalization :edgesRebound])) "Browser prerequisite edge was not rebound."))}
   {:pattern #"^every logical target, prerequisite obligation, result, timing record, and evidence leaf is conserved exactly once$"
    :handler (fn [world _ _] (assert! world (every? true? ((juxt :targetsConserved :resultsConserved :timingsConserved :leavesConserved) (get-in world [:vtd014/evidence :execution :prerequisiteGate :browserNormalization]))) "Browser evidence was not conserved exactly once."))}
   {:pattern #"^no noncanonical overlapping task can launch or create a duplicate reliability incident$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :execution :prerequisiteGate :browserNormalization :noncanonicalBlocked])) "A noncanonical browser task can launch."))}
   {:pattern #"^a missing or ambiguous canonical target, changed target boundary, or incompatible execution contract blocks instead of being deduplicated$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :execution :prerequisiteGate :browserNormalization :invalidBlocked])) "Invalid browser normalization did not block."))}
   {:pattern #"^the inherited incident remains unchanged and pending fresh focused reassessment instead of blocking the current repair$"
    :handler (fn [world _ _] (assert! world (every? true? ((juxt :deferredExpansionPending :incidentUnchanged) (get-in world [:vtd014/evidence :taskSuccession :plannerProjection]))) "Deferred expanded target did not remain pending and unchanged."))}
   {:pattern #"^no same-target equivalence, task-succession mapping, incident transition, or passing evidence is inferred for it$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :plannerProjection :noInference])) "Deferred expansion inferred governed evidence."))}
   {:pattern #"^direct same-target projection continues to reject the changed boundary$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :plannerProjection :directExpansionRejected])) "Direct same-target projection accepted an expanded boundary."))}
   {:pattern #"^the current incident still requires its own exact causal regression, repair-focused receipt, review evidence, and package proof$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :plannerProjection :currentRepairGoverned])) "Current repair governance was weakened."))}
   {:pattern #"^missing or ambiguous current targets, noneligible repairs, nondeferred incidents, unverified projection sources, and unrelated succession failures remain blocking$"
    :handler (fn [world _ _] (assert! world (true? (get-in world [:vtd014/evidence :taskSuccession :plannerProjection :invalidExpansionCasesBlocked])) "Invalid deferred expansion cases did not remain blocking."))}])

(def ^:private run-intent-contract
  {"no explicit evidence, repair, or terminal flag" "development-diagnostic"
   "explicit review-evidence authority" "review-evidence"
   "governed repair-focused authority" "repair-focused"
   "explicit terminal-checkpoint authority" "terminal"})

(def ^:private mutation-relations
  {:prerequisite-outcome
   {:keys ["boundary" "classification" "candidate_effect"]
    :rows #{["a declared prerequisite is unsatisfied before authorization"
             "a structured prerequisite block"
             "no incident, retry, task result, or passing evidence"]
            ["an authorized child requests an undeclared prerequisite"
             "an execution-contract incident"
             "repair of the declaration and a causal regression are required"]
            ["an authorized child fails after every prerequisite is satisfied"
             "the task's normal reliability failure"
             "the existing isolation, repair, and resolution rules apply"]}}
   :deferred-slice
   {:keys ["deferral_relationship" "change_relationship" "later_slice_result"]
    :rows #{["an ancestor of current QA"
             "only its approved specification changes"
             "permit the specifier-to-coder start from current QA"]
            ["an abandoned parallel candidate from current QA"
             "only its approved specification changes"
             "permit the specifier-to-coder start without merging the abandoned candidate"]
            ["an ancestor or abandoned parallel candidate"
             "its product paths overlap the incident but ordinary focused work does not reproduce that diagnosed failure boundary"
             "permit focused review and QA integration without changing or copying the recorded disposition"]
            ["an ancestor or abandoned parallel candidate"
             "ordinary focused work reproduces the diagnosed failure boundary"
             "stop at that failure and require the smallest causal incident repair and proof relevant to the current slice"]
            ["an ancestor or abandoned parallel candidate"
             "the approved slice intentionally changes the deferred repair, regression, task succession, runner, or evidence semantics"
             "treat that work as explicit verification-infrastructure scope with its own approved focused proof"]}}
   :stylesheet-plan
   {:keys ["stylesheet" "destination" "classification" "owner" "consumers"
           "qa_targets" "scope_root" "qa_scope" "terminal_obligation"]
    :rows #{["src/flow-graph/flow-workspace.css" "flow-graph/flow-workspace.css"
             "feature-local" "flow_graph" "none" "none" ".documentary-flow"
             "flow_graph" "absent"]
            ["src/flow-graph/flow-workspace-shell.css" "flow-graph/flow-workspace-shell.css"
             "shell-bridge" "flow_graph" "shell" "none" ".documentary-flow"
             "flow_graph and shell" "absent"]
            ["specification-builder-brand.css" "specification-builder-brand.css"
             "global" "shell" "none" "STUDIO_GLOBAL_STYLE_SMOKE_TARGET"
             "not applicable" "declared QA targets" "present"]}}
   :invalid-stylesheet
   {:keys ["invalid_state"]
    :rows #{["no declared style owner"]
            ["duplicate or ambiguous ownership"]
            ["an unknown owner or consumer"]
            ["an unknown QA smoke target"]
            ["a feature-local selector escaping its scope root"]
            ["a shell ancestor selector in a feature-local file"]
            ["conflicting local and global classifications"]}}
   :stylesheet-history
   {:keys ["history_relation" "planning_result"]
    :rows #{["identical valid local declarations"
             "the exact declared owner and consumer union"]
            ["a rename between valid local paths"
             "the conservative union of old and new owners and consumers"]
            ["local ownership changed to a shell bridge"
             "the conservative union including every newly declared consumer"]
            ["a deletion with readable compatible history"
             "the historical owner and consumer boundary"]
            ["missing, malformed, or incompatible history"
             "a prelaunch conservative-history block"]}}
   :run-intent
   {:keys ["authority" "task_result" "run_intent" "incident_effect"
           "evidence_effect" "recording_rule"]
    :rows #{["no explicit evidence, repair, or terminal flag" "fails"
             "development-diagnostic"
             "no incident, retry allowance, terminal deferral, or handoff debt"
             "no review-ready or final-ready eligibility"
             "a later diagnostic pass cannot erase or upgrade the failed diagnostic receipt"]
            ["no explicit evidence, repair, or terminal flag" "passes"
             "development-diagnostic"
             "no incident, retry allowance, terminal deferral, or handoff debt"
             "no review-ready or final-ready eligibility"
             "evidence recording rejects the diagnostic receipt"]
            ["explicit review-evidence authority" "fails" "review-evidence"
             "one durable incident before any unchanged diagnostic retry"
             "no review-ready eligibility"
             "causal repair and fresh review evidence are required"]
            ["governed repair-focused authority" "fails" "repair-focused"
             "the governed incident retains the failed repair attempt"
             "no review-ready or final-ready eligibility"
             "another repair attempt requires a changed causal repair"]
            ["explicit terminal-checkpoint authority" "fails" "terminal"
             "one durable terminal failure on the exact release candidate"
             "no final-ready eligibility"
             "a changed release candidate requires one fresh terminal checkpoint"]
            ["explicit review-evidence authority" "passes" "review-evidence"
             "no new incident" "review-ready eligibility for the exact scope"
             "recording rejects a missing, mismatched, or retrospectively upgraded run intent"]
            ["explicit terminal-checkpoint authority" "passes" "terminal"
             "matching deferred incidents are resolved by the exact checkpoint"
             "final-ready eligibility for the exact scope"
             "recording rejects a missing, mismatched, or retrospectively upgraded run intent"]}}
   :invalid-projection
   {:keys ["invalid_projection" "diagnostic"]
    :rows #{["no current canonical batch contains the diagnosed target"
             "a missing current target boundary"]
            ["more than one current canonical batch contains the target"
             "an ambiguous current target boundary"]
            ["the historical and current target boundary digests differ"
             "a changed target boundary"]
            ["the source task is not bound by its governed receipt and registry"
             "an unverified planner-projection source identity"]}}})

(defn- validate-mutation-relation! [example relation-key]
  (support/validate-example-relations!
   [(mutation-relations relation-key)] example
   (str "Modular verification relation changed: " (name relation-key))))

(defn priority-handlers [{:keys [example-values]}]
  [{:pattern #"^prerequisite evaluation reaches (.+)$"
    :handler (fn [world example captures]
               (validate-mutation-relation! example :prerequisite-outcome)
               (assoc (prepared world) :vtd014/prerequisite-boundary
                      (first (values example-values example captures))))}
   {:pattern #"^the repository-common store contains a terminal-verification-deferred incident whose failure lineage applies to current QA$"
    :handler (fn [world example _]
               (validate-mutation-relation! example :deferred-slice)
               (let [prepared-world (prepared world)]
                 (assert! prepared-world
                          (every? true? (vals (get-in prepared-world
                                                     [:vtd014/evidence :runIntent :deferred])))
                          "Deferred feature slices do not conserve the immutable incident.")))}
   {:pattern #"^(.+) has declared destination (.+), style classification (.+), owner (.+), consumers (.+), QA targets (.+), and scope root (.+)$"
    :handler (fn [world example captures]
               (validate-mutation-relation! example :stylesheet-plan)
               (let [source (first (values example-values example captures))
                     boundary (get stylesheet-boundaries source source)]
                 (assoc (prepared world) :vtd014/style-boundary boundary)))}
   {:pattern #"^a stylesheet declaration or its parsed selectors have (.+)$"
    :handler (fn [world example _]
               (validate-mutation-relation! example :invalid-stylesheet)
               (let [prepared-world (prepared world)]
                 (assert! prepared-world
                          (true? (:validationBlocked
                                  (style-evidence prepared-world
                                                  "invalid or undeclared boundary")))
                          "Invalid stylesheet declarations did not fail closed.")))}
   {:pattern #"^current and base registries classify one changed stylesheet with (.+)$"
    :handler (fn [world example _]
               (validate-mutation-relation! example :stylesheet-history)
               (let [prepared-world (prepared world)]
                 (assert! prepared-world
                          (true? (get-in prepared-world
                                         [:vtd014/evidence :flowStyles :declaredBoundaries]))
                          "Stylesheet history planning lacks declared production boundaries.")))}
   {:pattern #"^the canonical verification runner starts with (.+)$"
    :handler (fn [world example captures]
               (validate-mutation-relation! example :run-intent)
               (assoc (prepared world) :vtd014/run-authority
                      (first (values example-values example captures))))}
   {:pattern #"^an unresolved browser incident needs a same-target planner projection$"
    :handler (fn [world example _]
               (validate-mutation-relation! example :invalid-projection)
               (let [prepared-world (prepared world)]
                 (assert! prepared-world
                          (true? (get-in prepared-world
                                         [:vtd014/evidence :taskSuccession
                                          :plannerProjection :invalidBlocked]))
                          "Invalid planner projections did not remain blocked.")))}])

(defn- run-intent-handlers [example-values]
  [{:pattern #"^the canonical verification runner starts with (.+)$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/run-authority
                      (first (values example-values example captures))))}
   {:pattern #"^a registered task (.+)$"
    :handler (fn [world example captures]
               (assoc world :vtd014/task-result
                      (first (values example-values example captures))))}
   {:pattern #"^the receipt records run intent (.+)$"
    :handler (fn [world example captures]
               (let [expected (first (values example-values example captures))
                     authority (:vtd014/run-authority world)
                     key ({"development-diagnostic" :development
                           "review-evidence" :review
                           "repair-focused" :repair
                           "terminal" :terminal} expected)]
                 (assert! world
                          (and (= expected (get run-intent-contract authority))
                               (= expected (get-in world [:vtd014/evidence :runIntent :intents key])))
                          "Verification run intent did not match its explicit authority.")))}
   {:pattern #"^shared reliability state receives (.+)$"
    :handler (fn [world example captures]
               (let [effect (first (values example-values example captures))
                     diagnostic? (= (:vtd014/run-authority world)
                                    "no explicit evidence, repair, or terminal flag")]
                 (assert! world
                          (if diagnostic?
                            (true? (get-in world [:vtd014/evidence :runIntent :diagnosticIsolation]))
                            (or (= (:vtd014/task-result world) "passes")
                                (true? (get-in world [:vtd014/evidence :runIntent :reviewIncident]))))
                          (str "Shared reliability effect was not enforced: " effect))))}
   {:pattern #"^the receipt has (.+)$"
    :handler (fn [world _ _]
               (assert! world
                        (true? (get-in world [:vtd014/evidence :runIntent :immutableRejection]))
                        "Receipt evidence eligibility was not bound to immutable run intent."))}
   {:pattern #"^evidence recording applies (.+)$"
    :handler (fn [world _ _]
               (assert! world
                        (and (true? (get-in world [:vtd014/evidence :runIntent :immutableRejection]))
                             (true? (get-in world [:vtd014/evidence :runIntent
                                                   :compatibility :ambiguousBlocking])))
                        "Evidence recording admitted a missing, ambiguous, or upgraded intent."))}

   {:pattern #"^an exact review-evidence candidate adds run-intent enforcement to a base that already contains its approved contract but lacks the implementation$"
    :handler (fn [world _ _]
               (let [prepared-world (prepared world)]
                 (assert! prepared-world
                          (and (true? (get-in prepared-world [:vtd014/evidence :runIntent
                                                              :bootstrap :baseContract]))
                               (true? (get-in prepared-world [:vtd014/evidence :runIntent
                                                              :bootstrap :baseImplementationAbsent])))
                          "Run-intent bootstrap did not bind the one eligible base.")))}
   {:pattern #"^every applicable legacy diagnostic is receipt-proven or remains blocking$"
    :handler (fn [world _ _]
               (assert! world
                        (and (true? (get-in world [:vtd014/evidence :runIntent
                                                   :compatibility :receiptProvenOnly]))
                             (true? (get-in world [:vtd014/evidence :runIntent
                                                   :compatibility :ambiguousBlocking])))
                        "Legacy diagnostic compatibility was broadened."))}
   {:pattern #"^every other applicable incident has an eligible terminal-verification-deferred disposition on an ancestor$"
    :handler (fn [world _ _]
               (assert! world
                        (true? (get-in world [:vtd014/evidence :runIntent :bootstrap :ineligibleBlocked]))
                        "Bootstrap admitted a non-deferred or ineligible incident."))}
   {:pattern #"^the one-time run-intent bootstrap preflight evaluates the exact focused plan$"
    :handler (fn [world _ _]
               (assert! world
                        (true? (get-in world [:vtd014/evidence :runIntent :bootstrap :exactCoverage]))
                        "Bootstrap did not evaluate exact focused task coverage."))}
   {:pattern #"^every deferred failure task or declared successor must be selected for fresh execution$"
    :handler (fn [world _ _]
               (assert! world
                        (true? (get-in world [:vtd014/evidence :runIntent :bootstrap :freshPass]))
                        "Bootstrap omitted a deferred task or declared successor."))}
   {:pattern #"^no unrelated unresolved incident is admitted$"
    :handler (fn [world _ _]
               (assert! world
                        (true? (get-in world [:vtd014/evidence :runIntent :bootstrap :ineligibleBlocked]))
                        "Bootstrap admitted unrelated unresolved debt."))}
   {:pattern #"^pending evidence requires every selected deferred failure task or successor to pass freshly with package proof$"
    :handler (fn [world _ _]
               (assert! world
                        (and (true? (get-in world [:vtd014/evidence :runIntent
                                                   :bootstrap :freshPass]))
                             (true? (get-in world [:vtd014/evidence :runIntent
                                                   :bootstrap :packageProof])))
                        "Bootstrap pending evidence lacked fresh task or package proof."))}
   {:pattern #"^the incidents remain unresolved until the handoff gate re-defers them on the exact candidate$"
    :handler (fn [world _ _]
               (assert! world
                        (and (true? (get-in world [:vtd014/evidence :runIntent
                                                   :bootstrap :remainsUnresolved]))
                             (true? (get-in world [:vtd014/evidence :runIntent
                                                   :bootstrap :handoffRedefers])))
                        "Bootstrap changed incident state before the handoff gate."))}
   {:pattern #"^a base that already contains run-intent implementation cannot reuse bootstrap authority$"
    :handler (fn [world _ _]
               (assert! world
                        (true? (get-in world [:vtd014/evidence :runIntent
                                              :bootstrap :futureBaseRejected]))
                        "Run-intent bootstrap authority was reusable."))}])

(defn handlers [{:keys [example-values]}]
  (vec (concat (incident-handlers example-values)
               (repair-handlers example-values)
               (store-handlers example-values)
               (resolution/handlers {:prepared prepared})
               (prerequisite-handlers example-values)
               (universal-prerequisite-gate-handlers example-values)
               (repair-prerequisite-handlers example-values)
               (checkpoint-handlers example-values)
               (bounded-closure-handlers example-values)
               (flow-reload-lifecycle-handlers example-values)
               (flow-stylesheet-handlers example-values)
               (task-succession-handlers example-values)
               (planner-projection-handlers example-values)
               (run-intent-handlers example-values)
               (shared-boundary-handlers example-values))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-27T18:20:58.575929513+02:00", :module-hash "310353968", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-247406965"} {:id "form/1/defonce", :kind "defonce", :line 5, :end-line 5, :hash "701185655"} {:id "defn-/production-evidence!", :kind "defn-", :line 7, :end-line 14, :hash "2102918111"} {:id "defn-/prepared", :kind "defn-", :line 16, :end-line 17, :hash "897770149"} {:id "defn-/assert!", :kind "defn-", :line 19, :end-line 21, :hash "1408472967"} {:id "defn-/values", :kind "defn-", :line 23, :end-line 25, :hash "-170718585"} {:id "defn-/evidence-value", :kind "defn-", :line 27, :end-line 28, :hash "-1196778"} {:id "defn-/row-value", :kind "defn-", :line 30, :end-line 33, :hash "-798336634"} {:id "defn-/style-evidence", :kind "defn-", :line 35, :end-line 36, :hash "480445656"} {:id "def/stylesheet-boundaries", :kind "def", :line 38, :end-line 42, :hash "1844180491"} {:id "def/promotion-scope-keys", :kind "def", :line 44, :end-line 48, :hash "20412880"} {:id "def/prerequisite-routes", :kind "def", :line 50, :end-line 53, :hash "-1618706903"} {:id "def/prerequisite-task-contract", :kind "def", :line 55, :end-line 61, :hash "-1735351185"} {:id "def/focused-verification-kinds", :kind "def", :line 63, :end-line 69, :hash "52068695"} {:id "def/repair-predecessor-contract", :kind "def", :line 71, :end-line 74, :hash "-641238058"} {:id "def/runner-mode-contract", :kind "def", :line 76, :end-line 82, :hash "118045761"} {:id "def/prerequisite-closure-contract", :kind "def", :line 84, :end-line 90, :hash "1116562715"} {:id "def/prerequisite-outcome-contract", :kind "def", :line 92, :end-line 104, :hash "1535624021"} {:id "def/failure-domain-contract", :kind "def", :line 106, :end-line 114, :hash "1449063263"} {:id "def/causal-incident-contract", :kind "def", :line 116, :end-line 120, :hash "-2086571635"} {:id "def/disposition-contract", :kind "def", :line 122, :end-line 138, :hash "1880553282"} {:id "def/input-equivalence-contract", :kind "def", :line 140, :end-line 146, :hash "-378171749"} {:id "def/flow-runner-modes", :kind "def", :line 148, :end-line 150, :hash "1707091140"} {:id "def/flow-readiness-contract", :kind "def", :line 152, :end-line 158, :hash "1486594103"} {:id "def/flow-classification-contract", :kind "def", :line 160, :end-line 166, :hash "578441815"} {:id "def/flow-causal-contract", :kind "def", :line 168, :end-line 172, :hash "-345339010"} {:id "def/task-succession-contract", :kind "def", :line 174, :end-line 189, :hash "465513991"} {:id "defn-/non-timeout-fixtures", :kind "defn-", :line 191, :end-line 193, :hash "1878657814"} {:id "def/retry-scopes", :kind "def", :line 195, :end-line 200, :hash "65095101"} {:id "def/retry-outcomes", :kind "def", :line 202, :end-line 206, :hash "-2097452382"} {:id "def/retry-outcome-keys", :kind "def", :line 208, :end-line 212, :hash "558321812"} {:id "def/repair-outcomes", :kind "def", :line 214, :end-line 224, :hash "1050890460"} {:id "def/incident-boundary-checks", :kind "def", :line 226, :end-line 235, :hash "-1679975384"} {:id "defn-/incident-boundary-exact?", :kind "defn-", :line 237, :end-line 238, :hash "1687152906"} {:id "def/diagnostic-scope-checks", :kind "def", :line 240, :end-line 248, :hash "892477097"} {:id "defn-/diagnostic-scope-exact?", :kind "defn-", :line 250, :end-line 251, :hash "1899816958"} {:id "defn-/incident-recording-handlers", :kind "defn-", :line 253, :end-line 261, :hash "-1244280115"} {:id "defn-/incident-identity-handlers", :kind "defn-", :line 263, :end-line 279, :hash "-1302661865"} {:id "defn-/diagnostic-scope-handlers", :kind "defn-", :line 281, :end-line 292, :hash "1635816000"} {:id "defn-/diagnostic-execution-handlers", :kind "defn-", :line 294, :end-line 308, :hash "346046064"} {:id "defn-/diagnostic-classification-handlers", :kind "defn-", :line 310, :end-line 317, :hash "1386450709"} {:id "defn-/diagnostic-result-handlers", :kind "defn-", :line 319, :end-line 335, :hash "-1100251734"} {:id "defn-/historical-timeout-handlers", :kind "defn-", :line 337, :end-line 348, :hash "435396237"} {:id "defn-/non-timeout-boundary-handlers", :kind "defn-", :line 350, :end-line 359, :hash "710300279"} {:id "defn-/non-timeout-classification-handlers", :kind "defn-", :line 361, :end-line 373, :hash "292096348"} {:id "defn-/non-timeout-repair-handlers", :kind "defn-", :line 375, :end-line 387, :hash "-809912869"} {:id "defn-/incident-handlers", :kind "defn-", :line 389, :end-line 399, :hash "-994233800"} {:id "def/repair-proposal-requirements", :kind "def", :line 401, :end-line 409, :hash "1991595942"} {:id "defn-/repair-proposal-observed?", :kind "defn-", :line 411, :end-line 413, :hash "1187360924"} {:id "defn-/repair-handlers", :kind "defn-", :line 415, :end-line 432, :hash "-1963388730"} {:id "defn-/store-handlers", :kind "defn-", :line 434, :end-line 469, :hash "1064536771"} {:id "defn-/resolution-handlers", :kind "defn-", :line 471, :end-line 506, :hash "246629330"} {:id "defn-/prerequisite-handlers", :kind "defn-", :line 508, :end-line 613, :hash "-1216166419"} {:id "defn-/checkpoint-handlers", :kind "defn-", :line 615, :end-line 719, :hash "-2129198900"} {:id "defn-/universal-prerequisite-gate-handlers", :kind "defn-", :line 721, :end-line 873, :hash "-597741040"} {:id "defn-/repair-prerequisite-handlers", :kind "defn-", :line 875, :end-line 901, :hash "-1391095503"} {:id "defn-/shared-boundary-handlers", :kind "defn-", :line 903, :end-line 948, :hash "1064050860"} {:id "defn-/bounded-closure-handlers", :kind "defn-", :line 950, :end-line 1080, :hash "-876863697"} {:id "defn-/flow-reload-lifecycle-handlers", :kind "defn-", :line 1082, :end-line 1147, :hash "1381085325"} {:id "defn-/flow-stylesheet-handlers", :kind "defn-", :line 1149, :end-line 1223, :hash "-927757738"} {:id "defn-/task-succession-handlers", :kind "defn-", :line 1225, :end-line 1285, :hash "-2144495390"} {:id "defn-/planner-projection-handlers", :kind "defn-", :line 1287, :end-line 1331, :hash "-111062581"} {:id "def/run-intent-contract", :kind "def", :line 1333, :end-line 1337, :hash "-1375396036"} {:id "def/mutation-relations", :kind "def", :line 1339, :end-line 1442, :hash "326905174"} {:id "defn-/validate-mutation-relation!", :kind "defn-", :line 1444, :end-line 1447, :hash "447341592"} {:id "defn/priority-handlers", :kind "defn", :line 1449, :end-line 1499, :hash "-90433445"} {:id "defn-/run-intent-handlers", :kind "defn-", :line 1501, :end-line 1604, :hash "649984929"} {:id "defn/handlers", :kind "defn", :line 1606, :end-line 1621, :hash "1925803407"}]}
;; clj-mutate-manifest-end
