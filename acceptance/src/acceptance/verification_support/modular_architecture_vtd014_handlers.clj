(ns acceptance.verification-support.modular-architecture-vtd014-handlers
  (:require [acceptance.steps.support :as support]
            [acceptance.verification-support.modular-architecture-process-evidence :as process-evidence]))

(defonce ^:private evidence (atom nil))

(defn- production-evidence! []
  (process-evidence/load! evidence
    {:command ["node" "test/verification-process-contract-test.mjs"]
     :prepared-task "unit:test/verification-process-contract-test.mjs"
     :fallback ["node" "test/verification-process-contract-test.mjs"]
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

(def ^:private promotion-scope-keys
  {"receipt finalization only" "receipt-finalization"
   "pending evidence creation only" "pending-evidence"
   "Git-note recording only" "git-note-recording"
   "handoff eligibility checking only" "handoff-eligibility"})

(def ^:private prerequisite-routes
  {"the workspace sandbox cannot bind" "scoped-command-approval"
   "the workspace sandbox is sufficient" "workspace-sandbox"
   "scoped approval is denied" "blocked"})

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
   {:pattern #"^it executes (.+)$"
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

(defn- resolution-handlers [_example-values]
  [
   {:pattern #"^a causal reliability repair and its fresh focused regression have passed$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^one fresh canonical all-20 checkpoint and node scripts/package.mjs pass without reused tasks or another failure$"
    :handler (fn [world _ _]
               (let [resolution (get-in world [:vtd014/evidence :resolution])]
                 (assert! world (and (= 20 (:allPackCount resolution))
                                     (zero? (:reusedTaskCount resolution))
                                     (:packagePassed resolution))
                          "Reliability resolution did not use a fresh all-20 checkpoint and package.")))}
   {:pattern #"^the incident resolution binds .+$"
    :handler (fn [world _ _]
               (let [resolution (get-in world [:vtd014/evidence :resolution :evidence])]
                 (assert! world (and (= 64 (count (:failureDigest resolution)))
                                     (= 64 (count (:resolutionDigest resolution)))
                                     (:repairCommit resolution) (:repairTree resolution)
                                     (:causalCategory resolution) (:regression resolution)
                                     (:focusedReceipt resolution) (:checkpointReceiptSha256 resolution))
                          "Reliability resolution evidence is not completely bound.")))}
   {:pattern #"^Git-note verification recomputes every resolution link$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :archiveVerified]))
                        "Resolution archive links were not recomputed."))}
   {:pattern #"^the current candidate lineage has no unresolved incident or retry result awaiting repair$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :resolvedIncidentExcludedFromBlocking]))
                        "The resolved incident still blocks its candidate lineage."))}
   {:pattern #"^git_handoff is permitted while repair note handoffs remained available throughout the blocked state$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :handoffGate]))
                        "The resolved incident did not release the handoff gate."))}
   {:pattern #"^a later failure in a downstream role creates a new incident rather than reopening or hiding the resolved one$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :resolution :downstreamIncidentDistinct]))
                        "A later failure reused the resolved incident identity."))}])

(defn- prerequisite-handlers [example-values]
  [
   {:pattern #"^canonical task (.+) declares (.+)$"
    :handler (fn [world example captures]
               (let [[task access] (values example-values example captures)]
                 (assoc (prepared world) :vtd014/prerequisite-row {:task task :access access})))}
   {:pattern #"^its current agent environment is (.+)$"
    :handler (fn [world example captures]
               (assoc-in world [:vtd014/prerequisite-row :sandbox]
                         (first (values example-values example captures))))}
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
    :handler (fn [world _ _]
               (prepared world))}
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
               (assert! world (every? #(and (:authorized %) (:unauthorizedBlocked %))
                                      (vals (get-in world [:vtd014/evidence :execution
                                                           :prerequisiteGate :modeMatrix])))
                        "A registered runner mode bypassed the shared gate."))}
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
    :handler (fn [world _ _] world)}
   {:pattern #"^the shared gate computes the transitive prerequisite closure$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :prerequisiteGate :closure :transitive]))
                        "The prerequisite closure was not transitive."))}
   {:pattern #"^the gate response is (.+)$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :prerequisiteGate :closure
                                                     :invalidDeclarationsBlocked]))
                        "A typed prerequisite response did not fail closed."))}
   {:pattern #"^every selected predecessor is ordered once before its consumer while unrelated work remains excluded$"
    :handler (fn [world _ _]
               (let [closure (get-in world [:vtd014/evidence :execution
                                             :prerequisiteGate :closure])]
                 (assert! world (and (:canonicalOrder closure) (:unrelatedExcluded closure))
                          "Prerequisite closure order or focus changed.")))}

   {:pattern #"^prerequisite evaluation reaches (.+)$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^the runner classifies the outcome$"
    :handler (fn [world _ _]
               (assert! world (every? true? (vals (get-in world [:vtd014/evidence :execution
                                                                  :prerequisiteGate
                                                                  :classifications])))
                        "A prerequisite outcome was misclassified."))}
   {:pattern #"^it records (.+)$" :handler (fn [world _ _] world)}
   {:pattern #"^the candidate receives (.+)$" :handler (fn [world _ _] world)}

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

(defn- shared-boundary-handlers [example-values]
  [
   {:pattern #"^a SwarmForge role runs (.+) for delivery$"
    :handler (fn [world example captures]
               (assoc (prepared world) :vtd014/verification-kind
                      (first (values example-values example captures))))}
   {:pattern #"^the registered task manifests a failure$"
    :handler (fn [world _ _]
               (assert! world (true? (get-in world [:vtd014/evidence :execution
                                                     :sharedBoundary :incidentAware]))
                        "The registered failure bypassed the incident boundary."))}
   {:pattern #"^(?:the shared incident-aware execution boundary records it before any unchanged rerun|the same isolation, classification, causal repair, regression, and resolution rules apply|a raw direct diagnostic rerun cannot provide passing evidence or Git handoff eligibility|the closing all-pack checkpoint cannot start while the candidate lineage owns the unresolved focused incident)$"
    :handler (fn [world _ _]
               (let [boundary (get-in world [:vtd014/evidence :execution :sharedBoundary])]
                 (assert! world (and (:incidentAware boundary) (:rawDiagnosticIneligible boundary)
                                     (= 6 (count (:focusedKinds boundary))))
                          "A delivery verification path bypassed shared incident handling.")))}

   {:pattern #"^VTD-014 changes shared reliability, evidence, and handoff infrastructure for all 20 runnable packs$"
    :handler (fn [world _ _] (prepared world))}
   {:pattern #"^a verification run completes without a failure$"
    :handler (fn [world _ _]
               (assert! world (false? (get-in world [:vtd014/evidence :conservation :diagnosticRetryOnPassingRun]))
                        "A passing run executed a reliability retry."))}
   {:pattern #"^(?:its exact task identities, logical targets, observations, assertion leaves, batching, budgets, calibrations, worker limits, shards, and package check are unchanged|no diagnostic retry executes|previously passing work may be reused for diagnosis but no failed result can bypass incident classification|no final post-repair checkpoint reuses a pre-repair result|no src product file, product behavior, saved value, accessibility result, feature owner, handler owner, pack dependency, target budget, calibration, worker limit, or shard changes|production impact boundaries are unchanged|the one-time delivery checkpoint runs all 20 runnable packs in canonical order followed by node scripts/package.mjs)$"
    :handler (fn [world _ _]
               (let [conservation (get-in world [:vtd014/evidence :conservation])
                     digests-match? (and (= (:currentTaskDigest conservation)
                                            (:masterTaskDigest conservation))
                                         (= (:currentPackContractDigest conservation)
                                            (:masterPackContractDigest conservation))
                                         (= (:currentCalibrationDigest conservation)
                                            (:masterCalibrationDigest conservation)))]
                 (assert! world (and (false? (:diagnosticRetryOnPassingRun conservation))
                                     (empty? (:productChangedFiles conservation))
                                     (empty? (:featureChangedFiles conservation))
                                     digests-match?
                                     (= 20 (:allPackCount conservation))
                                     (= "scripts/package.mjs" (:packageTask conservation)))
                        "VTD-014 conservation evidence is incomplete.")))}])

(defn handlers [{:keys [example-values]}]
  (vec (concat (incident-handlers example-values)
               (repair-handlers example-values)
               (store-handlers example-values)
               (resolution-handlers example-values)
               (prerequisite-handlers example-values)
               (universal-prerequisite-gate-handlers example-values)
               (checkpoint-handlers example-values)
               (shared-boundary-handlers example-values))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-10T07:51:37.804001813+02:00", :module-hash "925273036", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-247406965"} {:id "form/1/defonce", :kind "defonce", :line 5, :end-line 5, :hash "701185655"} {:id "defn-/production-evidence!", :kind "defn-", :line 7, :end-line 14, :hash "2102918111"} {:id "defn-/prepared", :kind "defn-", :line 16, :end-line 17, :hash "897770149"} {:id "defn-/assert!", :kind "defn-", :line 19, :end-line 21, :hash "1408472967"} {:id "defn-/values", :kind "defn-", :line 23, :end-line 25, :hash "-170718585"} {:id "defn-/evidence-value", :kind "defn-", :line 27, :end-line 28, :hash "-1196778"} {:id "defn-/row-value", :kind "defn-", :line 30, :end-line 33, :hash "-798336634"} {:id "def/promotion-scope-keys", :kind "def", :line 35, :end-line 39, :hash "20412880"} {:id "def/prerequisite-routes", :kind "def", :line 41, :end-line 44, :hash "-1618706903"} {:id "defn-/non-timeout-fixtures", :kind "defn-", :line 46, :end-line 48, :hash "1878657814"} {:id "def/retry-scopes", :kind "def", :line 50, :end-line 55, :hash "65095101"} {:id "def/retry-outcomes", :kind "def", :line 57, :end-line 61, :hash "-2097452382"} {:id "def/retry-outcome-keys", :kind "def", :line 63, :end-line 67, :hash "558321812"} {:id "def/repair-outcomes", :kind "def", :line 69, :end-line 79, :hash "1050890460"} {:id "def/incident-boundary-checks", :kind "def", :line 81, :end-line 90, :hash "-1679975384"} {:id "defn-/incident-boundary-exact?", :kind "defn-", :line 92, :end-line 93, :hash "1687152906"} {:id "def/diagnostic-scope-checks", :kind "def", :line 95, :end-line 103, :hash "892477097"} {:id "defn-/diagnostic-scope-exact?", :kind "defn-", :line 105, :end-line 106, :hash "1899816958"} {:id "defn-/incident-recording-handlers", :kind "defn-", :line 108, :end-line 116, :hash "-1244280115"} {:id "defn-/incident-identity-handlers", :kind "defn-", :line 118, :end-line 134, :hash "-1302661865"} {:id "defn-/diagnostic-scope-handlers", :kind "defn-", :line 136, :end-line 147, :hash "1635816000"} {:id "defn-/diagnostic-execution-handlers", :kind "defn-", :line 149, :end-line 163, :hash "475759033"} {:id "defn-/diagnostic-classification-handlers", :kind "defn-", :line 165, :end-line 172, :hash "1386450709"} {:id "defn-/diagnostic-result-handlers", :kind "defn-", :line 174, :end-line 190, :hash "-1100251734"} {:id "defn-/historical-timeout-handlers", :kind "defn-", :line 192, :end-line 203, :hash "435396237"} {:id "defn-/non-timeout-boundary-handlers", :kind "defn-", :line 205, :end-line 214, :hash "710300279"} {:id "defn-/non-timeout-classification-handlers", :kind "defn-", :line 216, :end-line 228, :hash "292096348"} {:id "defn-/non-timeout-repair-handlers", :kind "defn-", :line 230, :end-line 242, :hash "-809912869"} {:id "defn-/incident-handlers", :kind "defn-", :line 244, :end-line 254, :hash "-994233800"} {:id "def/repair-proposal-requirements", :kind "def", :line 256, :end-line 264, :hash "1991595942"} {:id "defn-/repair-proposal-observed?", :kind "defn-", :line 266, :end-line 268, :hash "1187360924"} {:id "defn-/repair-handlers", :kind "defn-", :line 270, :end-line 287, :hash "-1963388730"} {:id "defn-/store-handlers", :kind "defn-", :line 289, :end-line 324, :hash "1064536771"} {:id "defn-/resolution-handlers", :kind "defn-", :line 326, :end-line 361, :hash "246629330"} {:id "defn-/prerequisite-handlers", :kind "defn-", :line 363, :end-line 464, :hash "16480481"} {:id "defn-/checkpoint-handlers", :kind "defn-", :line 466, :end-line 565, :hash "1761285751"} {:id "defn-/shared-boundary-handlers", :kind "defn-", :line 567, :end-line 606, :hash "2031289868"} {:id "defn/handlers", :kind "defn", :line 608, :end-line 615, :hash "1627457090"}]}
;; clj-mutate-manifest-end
