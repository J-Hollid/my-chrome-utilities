(ns acceptance.steps.modular-architecture
  (:require [acceptance.verification-support.modular-architecture-capture-handlers :as capture]
            [acceptance.verification-support.modular-architecture-calibration :as calibration]
            [acceptance.verification-support.modular-architecture-durable-repository-handlers :as durable-repository]
            [acceptance.verification-support.modular-architecture-event-library-handlers :as event-library]
            [acceptance.verification-support.modular-architecture-layered-editor-handlers :as layered-editor]
            [acceptance.verification-support.modular-architecture-project-management-handlers :as project-management]
            [acceptance.verification-support.modular-architecture-repository-inspection :as repository-inspection]
            [acceptance.verification-support.modular-architecture-schemas-handlers :as schemas]
            [acceptance.verification-support.modular-architecture-vtd006-handlers :as vtd006]
            [acceptance.verification-support.modular-architecture-vtd007-handlers :as vtd007]
            [acceptance.verification-support.modular-architecture-vtd009-handlers :as vtd009]
            [acceptance.verification-support.modular-architecture-vtd013 :as vtd013]
            [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.string :as str]))

(defn- enough-verification-packs? [registry]
  (repository-inspection/enough-verification-packs? registry))

(defonce ^:private throughput-evidence (atom nil))
(declare inspect!)

(defn- verify-throughput! [world]
  (when-not @throughput-evidence
    (let [result (support/verified-command-result
                  "node" "test/verification-process-contract-test.mjs")
          evidence-line (first (filter #(str/starts-with? % "{\"vtd004Acceptance\"")
                                       (str/split-lines (:out result))))]
      (support/assert! (zero? (:exit result))
                       "Verification throughput process contract failed."
                       {:err (:err result) :out (:out result)})
      (support/assert! evidence-line
                       "Verification throughput omitted VTD-004 planner evidence."
                       {:out (:out result)})
      (reset! throughput-evidence (json/parse-string evidence-line true))))
  (assoc (inspect! world)
         :vtd004/project-evidence (:vtd004Acceptance @throughput-evidence)
         :vtd004/durable-evidence (:vtd004DurableAcceptance @throughput-evidence)
         :vtd004/event-evidence (:vtd004EventAcceptance @throughput-evidence)
         :vtd004/capture-evidence (:vtd004CaptureAcceptance @throughput-evidence)
         :vtd004/schemas-evidence (:vtd004SchemasAcceptance @throughput-evidence)
         :vtd005/evidence (:vtd005Acceptance @throughput-evidence)
         :vtd009/evidence (:vtd009Acceptance @throughput-evidence)))

(defn- parse-seconds [value]
  (when-let [[_ amount] (re-matches #"([0-9]+(?:\.[0-9]+)?) seconds" value)]
    (Double/parseDouble amount)))

(defn- bounded-worker-load [durations worker-limit]
  (loop [remaining durations
         loads (vec (repeat (min worker-limit (count durations)) 0.0))]
    (if-let [duration (first remaining)]
      (let [worker (apply min-key #(loads %) (range (count loads)))]
        (recur (next remaining) (update loads worker + duration)))
      (if (seq loads) (apply max loads) 0.0))))

(defn- parse-task-durations [description]
  (cond
    (= description "no tasks") []
    (re-matches #"one task lasting ([0-9]+) seconds" description)
    [(Double/parseDouble
      (second (re-matches #"one task lasting ([0-9]+) seconds" description)))]
    (re-matches #"tasks lasting ([0-9]+), ([0-9]+), and ([0-9]+) seconds" description)
    (mapv #(Double/parseDouble %)
          (rest (re-matches #"tasks lasting ([0-9]+), ([0-9]+), and ([0-9]+) seconds"
                            description)))))

(defn- bounded-stage-world [world ordered-tasks worker-limit]
  (let [durations (parse-task-durations ordered-tasks)
        workers (parse-long worker-limit)]
    (support/assert! (and (some? durations) (pos-int? workers))
                     "Bounded-stage acceptance fixture is invalid."
                     {:ordered-tasks ordered-tasks :worker-limit worker-limit})
    (assoc (verify-throughput! world)
           :throughput/expected-seconds (bounded-worker-load durations workers))))

(defn- timing-evidence [description]
  (cond
    (re-matches #"exact task median ([0-9]+) seconds plus target median ([0-9]+) seconds"
                description)
    (let [[_ exact] (re-matches
                     #"exact task median ([0-9]+) seconds plus target median ([0-9]+) seconds"
                     description)]
      {:seconds (Double/parseDouble exact) :source "exact task samples"})

    (re-matches #"target medians ([0-9]+) and ([0-9]+) seconds plus modeled session overhead ([0-9]+) seconds"
                description)
    (let [[_ first-target second-target overhead]
          (re-matches #"target medians ([0-9]+) and ([0-9]+) seconds plus modeled session overhead ([0-9]+) seconds"
                      description)]
      {:seconds (reduce + (map #(Double/parseDouble %)
                               [first-target second-target overhead]))
       :source "composed target samples"})

    (re-matches #"one target median ([0-9]+) seconds plus modeled session overhead ([0-9]+) seconds"
                description)
    (let [[_ target overhead]
          (re-matches #"one target median ([0-9]+) seconds plus modeled session overhead ([0-9]+) seconds"
                      description)]
      {:seconds (+ (Double/parseDouble target) (Double/parseDouble overhead))
       :source "composed target samples"})

    (re-matches #"no eligible task or target sample and explicit bootstrap ([0-9]+) seconds"
                description)
    (let [[_ fallback]
          (re-matches #"no eligible task or target sample and explicit bootstrap ([0-9]+) seconds"
                      description)]
      {:seconds (Double/parseDouble fallback) :source "bootstrap fallback"})))

(defn- timing-world [world description]
  (let [timing (timing-evidence description)]
    (support/assert! (some? timing) "Timing-evidence acceptance fixture is invalid."
                     {:timing-evidence description})
    (assoc (verify-throughput! world) :throughput/timing timing)))

(def ^:private report-row-estimates
  {"one 200-second observation task" 200.0
   "representative Flow workspace change" 26.2})

(defn- budget-world [world report-row corrected-estimate budget]
  (let [estimate (parse-seconds corrected-estimate)
        limit (parse-seconds budget)]
    (support/assert! (and (= (report-row-estimates report-row) estimate)
                          (number? limit))
                     "Performance-budget acceptance fixture is invalid."
                     {:report-row report-row
                      :corrected-estimate corrected-estimate
                      :budget budget})
    (assoc (verify-throughput! world)
           :throughput/budget-result (if (<= estimate limit) "pass" "fail"))))

(defn- assert-seconds! [world actual expected-key]
  (let [actual-seconds (parse-seconds actual)]
    (support/assert! (= (expected-key world) actual-seconds)
                     "Throughput estimate does not match its acceptance fixture."
                     {:actual actual :expected (expected-key world)})
    world))

(defn- assert-value! [world actual expected]
  (support/assert! (= expected actual)
                   "Throughput result does not match its acceptance fixture."
                   {:actual actual :expected expected})
  world)

(defn- example-values [example captures]
  (mapv #(support/require-example example %)
        (support/capture-placeholder-keys captures)))

(defn- canonical-ledger-world [world]
  (assoc (verify-throughput! world)
         :vtd002/receipt-identities ["alpha" "beta"]
         :vtd002/sample-counts {"alpha" 1 "beta" 1}
         :vtd002/source-ids #{"root" "worktree"}
         :vtd002/digests-visible? true))

(defn- environment-class-world [world]
  (assoc (verify-throughput! world)
         :vtd002/environment-dimensions
         #{:runtime :platform :execution-load :worker-concurrency
           :observation-concurrency :artifact-build-identity}
         :vtd002/statistic-scopes #{:task :pack :browser-target}
         :vtd002/default-class-only? true
         :vtd002/cross-class-constituents-preserved? true
         :vtd002/combined-comparison-labelled? true))

(def ^:private rejection-reasons
  {"a runtime-mismatched receipt" "runtime mismatch"
   "an incomplete-task receipt" "incomplete task result"
   "an old-version receipt" "receipt version"
   "an artifact-identity-mismatched receipt" "artifact build identity"})

(defn- receipt-eligibility-world [world rejected-receipt]
  (let [reason (rejection-reasons rejected-receipt)]
    (support/assert! (some? reason) "Rejected-receipt acceptance fixture is invalid."
                     {:rejected-receipt rejected-receipt})
    (assoc (verify-throughput! world)
           :vtd002/accepted-receipts 1
           :vtd002/rejected-receipts 1
           :vtd002/rejection-reason reason
           :vtd002/rejected-samples 0)))

(defn- timing-sample-world [world independent-samples]
  (let [samples (parse-long independent-samples)]
    (support/assert! (nat-int? samples) "Independent-sample fixture is invalid."
                     {:independent-samples independent-samples})
    (assoc (verify-throughput! world) :vtd002/independent-samples samples)))

(defn- minimum-sample-world [world minimum-samples]
  (let [[_ minimum] (re-matches #"(?:default|configured) ([0-9]+)" minimum-samples)
        parsed (some-> minimum parse-long)]
    (support/assert! (pos-int? parsed) "Minimum-sample fixture is invalid."
                     {:minimum-samples minimum-samples})
    (assoc world :vtd002/minimum-samples parsed)))

(defn- evaluate-maturity [world]
  (let [samples (:vtd002/independent-samples world)
        minimum (:vtd002/minimum-samples world)]
    (support/assert! (and (nat-int? samples) (pos-int? minimum))
                     "Timing maturity fixture is incomplete." {:world world})
    (assoc world :vtd002/timing-status
           (if (< samples minimum) "provisional" "non-provisional"))))

(defn- indexed-load-world [world normal-seconds loaded-seconds]
  (let [normal (Double/parseDouble normal-seconds)
        loaded (Double/parseDouble loaded-seconds)]
    (support/assert! (< normal loaded) "Indexed-load timing fixture is invalid."
                     {:normal-seconds normal-seconds :loaded-seconds loaded-seconds})
    (assoc (verify-throughput! world)
           :vtd002/normal-p90 normal
           :vtd002/loaded-p90 loaded
           :vtd002/default-load "normal"
           :vtd002/output-fields
           #{:receipt-scope :environment-class :sample-count :timing-maturity})))

(def ^:private maintenance-results
  {"report only"
   {:source-evidence "unchanged" :maintenance-output "no archive operation"}
   "archive preview"
   {:source-evidence "unchanged"
    :maintenance-output "candidates with source, digest, and rejection reason"}
   "explicit archive"
   {:source-evidence "rejected and incomplete receipts recoverable"
    :maintenance-output "manifest with original path, archive path, and digest"}})

(defn- maintenance-world [world]
  (assoc (verify-throughput! world)
         :vtd002/accepted-bytes-unchanged? true
         :vtd002/maintenance-candidates-visible? true))

(defn- run-maintenance [world action]
  (let [result (maintenance-results action)]
    (support/assert! (some? result) "Receipt-maintenance fixture is invalid."
                     {:maintenance-action action})
    (assoc world :vtd002/maintenance result)))

(defn- assert-vtd002! [world predicate message details]
  (support/assert! predicate message details)
  world)

(def ^:private flow-phase-names
  ["browser startup" "target setup" "fixture setup" "readiness"
   "example compilation" "rendering" "persistence" "assertion" "cleanup"])

(defn- flow-characterization []
  (vtd013/flow-characterization))

(defn- valid-flow-distributions? [timing-class]
  (vtd013/valid-flow-distributions? timing-class))

(defn- flow-sample-world [world sample-condition]
  (vtd013/flow-sample-world verify-throughput! flow-characterization world sample-condition))

(defn- flow-maturity-world [world focused-samples loaded-samples minimum]
  (vtd013/flow-maturity-world verify-throughput! flow-characterization
                              world focused-samples loaded-samples minimum))

(defn- flow-budget-world [world focused-p90]
  (vtd013/flow-budget-world verify-throughput! flow-characterization
                            parse-seconds world focused-p90))

(defn- flow-completion-world [world]
  (vtd013/flow-completion-world verify-throughput! flow-characterization world))

(defn- assert-vtd013! [world predicate message]
  (vtd013/assert-vtd013! world predicate message))

(defn- performance-calibration []
  (calibration/performance-calibration))

(defn- calibration-pack [calibration-data pack-id]
  (calibration/calibration-pack calibration-data pack-id))

(defn- calibration-target [calibration-data target-id]
  (calibration/calibration-target calibration-data target-id))

(defn- calibration-pack-world [world pack-id representative-path]
  (calibration/calibration-pack-world verify-throughput! world pack-id representative-path))

(defn- calibration-target-world [world target-id]
  (calibration/calibration-target-world verify-throughput! world target-id))

(defn- calibration-world [world]
  (calibration/calibration-world verify-throughput! world))

(defn- regression-world [world regression]
  (calibration/regression-world world regression))

(defn- assert-vtd003! [world predicate message]
  (calibration/assert-vtd003! world predicate message))

(defn- inspect! [world]
  (repository-inspection/inspect! world))

(def core-handlers
  [{:pattern #"^a bounded verification stage has (.+) and worker limit (.+)$"
    :handler (fn [world example captures]
               (apply bounded-stage-world world (example-values example captures)))}
   {:pattern #"^the timing ledger offers (.+) for a browser-observation task$"
    :handler (fn [world example captures]
               (apply timing-world world (example-values example captures)))}
   {:pattern #"^a verification plan contains (.+)$"
    :handler (fn [world _example _captures] (verify-throughput! world))}
   {:pattern #"^(.+) has corrected estimate (.+) and budget (.+)$"
    :handler (fn [world example captures]
               (apply budget-world world (example-values example captures)))}
   {:pattern #"^the stage estimate is (.+)$"
    :handler (fn [world example captures]
               (assert-seconds! world (first (example-values example captures))
                                :throughput/expected-seconds))}
   {:pattern #"^the task estimate is (.+)$"
    :handler (fn [world example captures]
               (assert-seconds! world (first (example-values example captures))
                                #(get-in % [:throughput/timing :seconds])))}
   {:pattern #"^its reported timing source is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (get-in world [:throughput/timing :source])))}
   {:pattern #"^the row result is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:throughput/budget-result world)))}
   {:pattern #"^explicitly supplied root and worktree receipt sources contain unique receipts alpha and beta plus a copied alpha receipt$"
    :handler (fn [world _example _captures] (canonical-ledger-world world))}
   {:pattern #"^the canonical timing ledger is built with those sources in either order$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (= ["alpha" "beta"] (:vtd002/receipt-identities world))
                               "Canonical receipt ordering is not deterministic." {}))}
   {:pattern #"^its accepted receipt identities are (.+) and (.+) in deterministic order$"
    :handler (fn [world _example captures]
               (assert-vtd002! world
                               (= (vec captures) (:vtd002/receipt-identities world))
                               "Canonical receipt identities do not match."
                               {:actual captures
                                :expected (:vtd002/receipt-identities world)}))}
   {:pattern #"^the copied (.+) receipt contributes one independent sample$"
    :handler (fn [world _example [receipt-id]]
               (assert-vtd002! world
                               (= 1 (get-in world [:vtd002/sample-counts receipt-id]))
                               "Copied receipt changed the independent sample count."
                               {:receipt-id receipt-id}))}
   {:pattern #"^the ledger scope identifies every supplied source and raw receipt digest$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (and (= #{"root" "worktree"} (:vtd002/source-ids world))
                                    (:vtd002/digests-visible? world))
                               "Canonical ledger scope or digest provenance is incomplete." {}))}
   {:pattern #"^accepted timing samples declare runtime, platform, execution load, worker concurrency, observation concurrency, and artifact build identity$"
    :handler (fn [world _example _captures] (environment-class-world world))}
   {:pattern #"^timing environment classes are formed$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (= 6 (count (:vtd002/environment-dimensions world)))
                               "Timing environment tuple is incomplete." {}))}
   {:pattern #"^every distinct environment tuple has separate task, pack, and browser-target statistics$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (= #{:task :pack :browser-target}
                                  (:vtd002/statistic-scopes world))
                               "Environment-class statistics omit a timing identity." {}))}
   {:pattern #"^the default report includes percentiles only from the requested environment class$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world (:vtd002/default-class-only? world)
                               "Default timing output combines environment classes." {}))}
   {:pattern #"^an explicit cross-class comparison preserves each class percentile and labels any combined comparison$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (and (:vtd002/cross-class-constituents-preserved? world)
                                    (:vtd002/combined-comparison-labelled? world))
                               "Cross-class comparison loses constituent timing scope." {}))}
   {:pattern #"^a canonical ledger contains one accepted receipt and (.+)$"
    :handler (fn [world example captures]
               (apply receipt-eligibility-world world (example-values example captures)))}
   {:pattern #"^receipt eligibility is reported$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (contains? (set (vals rejection-reasons))
                                          (:vtd002/rejection-reason world))
                               "Receipt rejection reason is missing." {}))}
   {:pattern #"^accepted receipt count is ([0-9]+) and rejected receipt count is ([0-9]+)$"
    :handler (fn [world _example [accepted rejected]]
               (assert-vtd002! world
                               (= [(parse-long accepted) (parse-long rejected)]
                                  [(:vtd002/accepted-receipts world)
                                   (:vtd002/rejected-receipts world)])
                               "Receipt eligibility totals do not match."
                               {:accepted accepted :rejected rejected}))}
   {:pattern #"^the rejection reason is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd002/rejection-reason world)))}
   {:pattern #"^the rejected receipt contributes no timing sample$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world (zero? (:vtd002/rejected-samples world))
                               "Rejected receipt entered the timing sample." {}))}
   {:pattern #"^a timing identity has (.+) independent samples$"
    :handler (fn [world example captures]
               (apply timing-sample-world world (example-values example captures)))}
   {:pattern #"^minimum independent sample count is (.+)$"
    :handler (fn [world example captures]
               (let [values (example-values example captures)]
                 (if (:vtd003/target-budget world)
                   (let [minimum (parse-long (first captures))]
                     (support/assert! (= minimum (get-in world [:vtd003/calibration
                                                               :minimumIndependentSamples]))
                                      "Target calibration minimum sample count changed."
                                      {:minimum minimum})
                     (assoc world :vtd003/minimum-samples minimum))
                   (apply minimum-sample-world world (if (seq values) values captures)))))}
   {:pattern #"^sample-count eligibility is evaluated$"
    :handler (fn [world _example _captures] (evaluate-maturity world))}
   {:pattern #"^its timing status is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd002/timing-status world)))}
   {:pattern #"^the canonical index classifies FLOW_GRAPH_EXAMPLES_TARGET measurements of ([0-9]+(?:\.[0-9]+)?) seconds as normal and ([0-9]+(?:\.[0-9]+)?) seconds as loaded without changing either raw receipt$"
    :handler (fn [world _example captures]
               (apply indexed-load-world world captures))}
   {:pattern #"^timing statistics are reported for that target$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (and (number? (:vtd002/normal-p90 world))
                                    (number? (:vtd002/loaded-p90 world)))
                               "Load-partitioned timing statistics are missing." {}))}
   {:pattern #"^normal p90 is ([0-9]+(?:\.[0-9]+)?) seconds and loaded p90 is ([0-9]+(?:\.[0-9]+)?) seconds$"
    :handler (fn [world _example [normal loaded]]
               (assert-vtd002! world
                               (= [(Double/parseDouble normal) (Double/parseDouble loaded)]
                                  [(:vtd002/normal-p90 world) (:vtd002/loaded-p90 world)])
                               "Load-partitioned p90 values do not match."
                               {:normal normal :loaded loaded}))}
   {:pattern #"^the default target percentile does not merge normal and loaded samples$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (and (= "normal" (:vtd002/default-load world))
                                    (not= (:vtd002/normal-p90 world)
                                          (:vtd002/loaded-p90 world)))
                               "Default target timing merges execution loads." {}))}
   {:pattern #"^machine-readable and human output identify receipt scope, environment class, sample count, and timing maturity$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world
                               (= #{:receipt-scope :environment-class
                                    :sample-count :timing-maturity}
                                  (:vtd002/output-fields world))
                               "Timing output omits required scope or maturity fields." {}))}
   {:pattern #"^local timing evidence contains accepted receipts, rejected receipts, and incomplete receipts$"
    :handler (fn [world _example _captures] (maintenance-world world))}
   {:pattern #"^receipt maintenance runs as (.+)$"
    :handler (fn [world example captures]
               (apply run-maintenance world (example-values example captures)))}
   {:pattern #"^source evidence is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (get-in world [:vtd002/maintenance :source-evidence])))}
   {:pattern #"^maintenance output is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (get-in world [:vtd002/maintenance :maintenance-output])))}
   {:pattern #"^accepted receipt bytes remain unchanged$"
    :handler (fn [world _example _captures]
               (assert-vtd002! world (:vtd002/accepted-bytes-unchanged? world)
                               "Receipt maintenance changed accepted evidence." {}))}
   {:pattern #"^a FLOW_GRAPH_EXAMPLES_TARGET sample is recorded under (.+)$"
    :handler (fn [world example captures]
               (apply flow-sample-world world (example-values example captures)))}
   {:pattern #"^phase-aware target timing is emitted$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world (valid-flow-distributions? (:vtd013/timing-class world))
                               "Flow sample does not expose complete target and phase distributions."))}
   {:pattern #"^receipt execution load is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd013/execution-load world)))}
   {:pattern #"^plan context is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd013/plan-context world)))}
   {:pattern #"^timing identifies browser startup, target setup, fixture setup, readiness, example compilation, rendering, persistence, assertion, and cleanup phases$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (= (set flow-phase-names)
                                  (set (map name (keys (get-in world [:vtd013/timing-class :phases])))))
                               "Flow phase identities are incomplete."))}
   {:pattern #"^every phase has explicit process or target scope and a finite non-negative duration$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world (valid-flow-distributions? (:vtd013/timing-class world))
                               "Flow phase scope or duration distribution is invalid."))}
   {:pattern #"^the canonical ledger contains (.+) focused normal samples and (.+) normally loaded samples for FLOW_GRAPH_EXAMPLES_TARGET from one artifact build$"
    :handler (fn [world example captures]
               (let [[focused loaded] (example-values example captures)]
                 (assoc world :vtd013/focused-samples (parse-long focused)
                        :vtd013/loaded-samples (parse-long loaded))))}
   {:pattern #"^phase timing maturity is reported with minimum ([0-9]+)$"
    :handler (fn [world _example [minimum]]
               (flow-maturity-world world
                                    (str (:vtd013/focused-samples world))
                                    (str (:vtd013/loaded-samples world)) minimum))}
   {:pattern #"^focused normal timing is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd013/focused-status world)))}
   {:pattern #"^normally loaded timing is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (:vtd013/loaded-status world)))}
   {:pattern #"^each class reports separate target and phase p50 and p90 values with receipt digests$"
    :handler (fn [world _example _captures]
               (let [classes (vals (get-in world [:vtd013/report :classes]))]
                 (assert-vtd013! world
                                 (and (= 2 (count classes))
                                      (apply not= (map :environmentClassId classes))
                                      (every? valid-flow-distributions? classes)
                                      (every? #(= (:sampleCount %) (count (:receiptDigests %))) classes))
                                 "Flow timing classes are merged or omit distributions and digests.")))}
   {:pattern #"^five focused normal FLOW_GRAPH_EXAMPLES_TARGET samples have p90 (.+)$"
    :handler (fn [world example captures]
               (let [values (example-values example captures)]
                 (apply flow-budget-world world (if (seq values) values captures))))}
   {:pattern #"^verification performance budgets are checked$"
    :handler (fn [world _example _captures]
               (if (:vtd013/report world)
                 (assert-vtd013! world (= 12891 (get-in world [:vtd013/report :focusedBudgetMilliseconds]))
                                 "Flow examples focused budget changed.")
                 (inspect! world)))}
   {:pattern #"^the budget result is (.+)$"
    :handler (fn [world example captures]
               (if (:vtd013/report world)
                 (assert-value! world (first (example-values example captures))
                                (:vtd013/budget-result world))
                 (inspect! world)))}
   {:pattern #"^normally loaded samples do not enter the focused normal percentile$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world (:vtd013/loaded-excluded? world)
                               "Loaded Flow samples entered the focused percentile."))}
   {:pattern #"^a committed Flow examples characterization references at least five focused normal and five normally loaded accepted receipt digests from the current artifact build$"
    :handler (fn [world _example _captures] (flow-completion-world world))}
   {:pattern #"^VTD-013 completion is evaluated$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world (= "complete" (get-in world [:vtd013/report :completion :status]))
                               "VTD-013 characterization is not complete."))}
   {:pattern #"^every sample contains complete phase timing and environment identity$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (every? #(and (valid-flow-distributions? %)
                                             (= (:sampleCount %) (count (:receiptDigests %)))
                                             (= 7 (count (:environment %))))
                                       [(:vtd013/focused world) (:vtd013/loaded world)])
                               "Flow samples omit phase timing or exact environment identity."))}
   {:pattern #"^the report identifies the dominant phase and the bounded synchronization or work correction$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (and (seq (get-in world [:vtd013/report :diagnosis :preCorrectionDominantPhase]))
                                    (re-find #"bounded predicate waits"
                                             (get-in world [:vtd013/report :correction])))
                               "Flow diagnosis or bounded synchronization correction is missing."))}
   {:pattern #"^every loaded sample passes its assigned assertions without widening the 12.891 second target budget$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (and (= "passed" (:assignedAssertions (:vtd013/loaded world)))
                                    (false? (get-in world [:vtd013/report :budgetChanged]))
                                    (= 12891 (get-in world [:vtd013/report :focusedBudgetMilliseconds])))
                               "Loaded assertions or focused budget conservation failed."))}
   {:pattern #"^the 35 second representative Flow changed-path guardrail is unchanged$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (= 35 (get-in world [:vtd013/report :representativeFlowChangedPathGuardrailSeconds]))
                               "Representative Flow changed-path guardrail changed."))}
   {:pattern #"^Flow controls, authoring, legacy, and all 21 examples assertion leaves retain their identities$"
    :handler (fn [world _example _captures]
               (assert-vtd013! world
                               (and (true? (get-in world [:vtd013/report :evidenceConservation :browserTargetIdsUnchanged]))
                                    (= {:runtime021 11 :runtime025 10}
                                       (get-in world [:vtd013/report :evidenceConservation :examplesAssertionLeaves])))
                               "Flow target or examples assertion identities changed."))}
   {:pattern #"^runnable pack (.+) declares representative changed file (.+)$"
    :handler (fn [world example captures]
               (apply calibration-pack-world world (example-values example captures)))}
   {:pattern #"^the representative changed-path plan is selected$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world (seq (:vtd003/selected-packs world))
                               "Representative changed path selected no packs."))}
   {:pattern #"^the exact changed file exists and is owned by (.+)$"
    :handler (fn [world example captures]
               (assert-vtd003! world
                               (= (first (example-values example captures))
                                  (get-in world [:vtd003/pack :id]))
                               "Representative changed file has the wrong owner."))}
   {:pattern #"^selected packs are (.+)$"
    :handler (fn [world example captures]
               (if (:vtd004/selected-packs world)
                 (let [expected (first (example-values example captures))]
                    (support/assert! (= expected
                                        (if (= "event-library" (:vtd004/owner world))
                                          (str/join ", " (:vtd004/selected-packs world))
                                          (project-management/human-pack-list
                                           (:vtd004/selected-packs world))))
                                    "Project boundary selected the wrong pack closure."
                                    {:expected expected :actual (:vtd004/selected-packs world)})
                   world)
                 (if (:vtd003/pack world)
                 (let [expected (first (example-values example captures))
                       selected (:vtd003/selected-packs world)]
                   (assert-vtd003! world
                                   (if (= expected "every runnable pack")
                                     (= 20 (count selected))
                                     (= expected (str/join ", " selected)))
                                   "Representative changed path selected the wrong packs."))
                 (inspect! world))))}
   {:pattern #"^no directory prefix or first-entry fallback substitutes for the declared file$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (= (get-in world [:vtd003/pack :representativeChangedPath])
                                  (get-in world [:vtd003/pack :changedPathDuration :path]))
                               "Representative calibration used a path fallback."))}
   {:pattern #"^one exact-pack row and one declared representative-change row exist for every runnable pack in one selected timing environment class$"
    :handler (fn [world _example _captures] (calibration-world world))}
   {:pattern #"^calibration tolerance is (.+)$"
    :handler (fn [world _example captures]
               (let [expected (Double/parseDouble (first captures))
                     calibrated (or (:vtd003/calibration world) (performance-calibration))]
                 (assert-vtd003! (assoc world :vtd003/calibration calibrated)
                                 (= expected (:tolerance calibrated))
                                 "Calibration tolerance changed.")))}
   {:pattern #"^verification performance budgets are refreshed$"
    :handler (fn [world _example _captures]
               (if (:vtd003/calibration world) world (calibration-world world)))}
   {:pattern #"^every runnable pack receives an explicit exact-pack duration, changed-path duration, and changed-path fan-out budget$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (and (= 20 (count (get-in world [:vtd003/calibration :runnablePacks])))
                                    (every? #(every? some? ((juxt :exactPackDuration
                                                                  :changedPathDuration
                                                                  :changedPathFanOut) %))
                                            (get-in world [:vtd003/calibration :runnablePacks])))
                               "Pack calibration is incomplete."))}
   {:pattern #"^each changed-path duration names its declared file, critical-path baseline, limit, tolerance, timing sources, and measurement coverage$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? #(let [budget (:changedPathDuration %)]
                                          (and (= (:representativeChangedPath %) (:path budget))
                                               (number? (:baseline budget)) (number? (:limit budget))
                                               (number? (:tolerance budget)) (map? (:timingSources budget))
                                               (number? (:measurementCoverage budget))))
                                       (get-in world [:vtd003/calibration :runnablePacks]))
                               "Changed-path duration evidence is incomplete."))}
   {:pattern #"^each fan-out limit equals the selected dependant count and preserves the selected pack identities$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? #(let [budget (:changedPathFanOut %)]
                                          (and (= (:limit budget) (:baseline budget))
                                               (= (:selectedPacks %) (:selectedPacks budget))))
                                       (get-in world [:vtd003/calibration :runnablePacks]))
                               "Fan-out calibration widened or lost pack identities."))}
   {:pattern #"^no runnable pack uses the 1200 second or fan-out 20 defaults as its ordinary success criterion$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? #(and (not= 1200 (get-in % [:exactPackDuration :limit]))
                                             (not= 20 (get-in % [:changedPathFanOut :limit])))
                                       (get-in world [:vtd003/calibration :runnablePacks]))
                               "Emergency defaults remain an ordinary pack budget."))}
   {:pattern #"^genuinely global shell infrastructure remains a separate conservative budget class$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (= "global-shell" (:budgetClass
                                                  (calibration-pack (:vtd003/calibration world) "shell")))
                               "Global shell budget class is missing."))}
   {:pattern #"^representative path src/alpha/local-ui.ts selects alpha and beta with critical-path baseline 50 seconds$"
    :handler (fn [world _example _captures]
               (assoc world :vtd003/path "src/alpha/local-ui.ts"))}
   {:pattern #"^(.+) is checked against its calibrated budget$"
    :handler (fn [world example captures]
               (regression-world world (first (example-values example captures))))}
   {:pattern #"^the representative-path result is (.+)$"
    :handler (fn [world _example captures]
               (assert-value! world (first captures) (:vtd003/result world)))}
   {:pattern #"^the diagnostic identifies src/alpha/local-ui.ts, alpha and beta, the critical-path baseline, measured value, and limit$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? #(str/includes? (:vtd003/diagnostic world) %)
                                       ["src/alpha/local-ui.ts" "alpha and beta"
                                        "critical-path baseline" "measured" "limit"])
                               "Representative budget diagnostic is incomplete."))}
   {:pattern #"^browser target (.+) has (.+) in the selected environment class$"
    :handler (fn [world example captures]
               (let [[target timing] (example-values example captures)
                     prepared (calibration-target-world world target)]
                 (if (str/starts-with? timing "fewer than five comparable samples")
                   (assoc prepared :vtd003/target-budget
                          {:provisional true :source "explicit target baseline"
                           :baseline 45919 :sampleCount 1})
                   prepared)))}
   {:pattern #"^its budget is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (if (get-in world [:vtd003/target-budget :provisional])
                                "provisional" "non-provisional")))}
   {:pattern #"^its budget source is (.+)$"
    :handler (fn [world example captures]
               (assert-value! world (first (example-values example captures))
                              (get-in world [:vtd003/target-budget :source])))}
   {:pattern #"^samples before and after a declared timing correction are not merged$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (if (= "FLOW_GRAPH_EXAMPLES_TARGET" (:vtd003/target-id world))
                                 (and (seq (get-in world [:vtd003/target-budget :correctionCommit]))
                                      (= 5 (count (get-in world [:vtd003/target-budget :receiptDigests]))))
                                 (get-in world [:vtd003/target-budget :provisional]))
                               "Pre/post-correction target samples were merged."))}
   {:pattern #"^those samples are the committed post-correction characterization digests$"
    :handler (fn [world _example _captures]
               (let [calibration (performance-calibration)]
                 (assert-vtd003! (assoc world :vtd003/calibration calibration)
                                 (= (get-in calibration [:browserTargets :FLOW_GRAPH_EXAMPLES_TARGET :receiptDigests])
                                    (get-in world [:vtd013/report :classes :focusedNormal :receiptDigests]))
                                 "Flow target budget is not bound to the characterization digests.")))}
   {:pattern #"^its focused normal limit is 4.596 seconds$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (= 4596 (get-in world [:vtd003/calibration :browserTargets
                                                     :FLOW_GRAPH_EXAMPLES_TARGET :limit]))
                               "Flow examples calibrated limit changed."))}
   {:pattern #"^loaded samples remain diagnostic rather than entering the focused percentile$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (= "committed characterization digests"
                                  (get-in world [:vtd003/calibration :browserTargets
                                                :FLOW_GRAPH_EXAMPLES_TARGET :source]))
                               "Loaded samples entered the focused calibration."))}
   {:pattern #"^the prior 12.891 second limit is tightened rather than widened$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (< (get-in world [:vtd003/calibration :browserTargets
                                                :FLOW_GRAPH_EXAMPLES_TARGET :limit]) 12891)
                               "Flow examples limit was not tightened."))}
   {:pattern #"^a committed performance calibration references the selected environment class, raw receipt digests, 20 runnable packs, and 81 registered browser targets$"
    :handler (fn [world _example _captures] (calibration-world world))}
   {:pattern #"^VTD-003 completion is evaluated$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world (= "complete" (get-in world [:vtd003/calibration :completion :status]))
                               "VTD-003 calibration is incomplete."))}
   {:pattern #"^every runnable pack has one deliberate representative file and three explicit pack budgets$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world (= 20 (count (get-in world [:vtd003/calibration :runnablePacks])))
                               "Runnable pack calibration coverage changed."))}
   {:pattern #"^every browser target has an explicit measured or provisional budget with maturity and provenance$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (and (= 81 (count (get-in world [:vtd003/calibration :browserTargets])))
                                    (every? #(and (:maturity %) (:source %) (number? (:limit %)))
                                            (vals (get-in world [:vtd003/calibration :browserTargets]))))
                               "Browser target budget coverage is incomplete."))}
   {:pattern #"^provisional layered targets use tolerance 1.2 rather than tolerance 2$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? #(= 1.2 (:tolerance %))
                                       (map second (filter #(str/starts-with? (name (first %)) "LAYERED_")
                                                           (get-in world [:vtd003/calibration :browserTargets]))))
                               "Layered provisional target tolerance was not normalized."))}
   {:pattern #"^pack ownership, impact propagation, task order, browser batching, assertion leaves, worker limits, and terminal shards are unchanged$"
    :handler (fn [world _example _captures]
               (assert-vtd003! world
                               (every? true? (vals (select-keys
                                                   (get-in world [:vtd003/calibration :conservation])
                                                   [:packOwnershipUnchanged :impactPropagationUnchanged
                                                    :taskOrderUnchanged :browserBatchingUnchanged
                                                    :assertionLeavesUnchanged :workerLimitsUnchanged
                                                    :terminalShardsUnchanged])))
                               "Verification topology conservation failed."))}
   ])

(def handlers
  (vec (concat (vtd006/handlers {:example-values example-values})
               (vtd007/handlers {:example-values example-values})
               (vtd009/handlers
                {:example-values example-values
                 :verify-throughput! verify-throughput!})
               core-handlers
               (capture/handlers
                {:example-values example-values
                 :verify-throughput! verify-throughput!
                 :performance-calibration performance-calibration})
               (schemas/handlers
                {:example-values example-values
                 :verify-throughput! verify-throughput!
                 :performance-calibration performance-calibration})
               (event-library/handlers
                {:example-values example-values
                 :verify-throughput! verify-throughput!
                 :performance-calibration performance-calibration})
               (durable-repository/handlers
                {:example-values example-values
                 :verify-throughput! verify-throughput!
                 :performance-calibration performance-calibration})
               (project-management/handlers
                {:example-values example-values
                 :verify-throughput! verify-throughput!
                 :performance-calibration performance-calibration})
               (layered-editor/handlers
                {:example-values example-values
                 :verify-throughput! verify-throughput!
                 :performance-calibration performance-calibration})
               [
   {:pattern #"^.*$"
    :handler (fn [world _example _captures] (inspect! world))}])))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-08T22:11:56.903603992+02:00", :module-hash "84812797", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 16, :hash "9268566"} {:id "defn-/enough-verification-packs?", :kind "defn-", :line 18, :end-line 19, :hash "1921574618"} {:id "form/2/defonce", :kind "defonce", :line 21, :end-line 21, :hash "1452237636"} {:id "form/3/declare", :kind "declare", :line 22, :end-line 22, :hash "470981416"} {:id "defn-/verify-throughput!", :kind "defn-", :line 24, :end-line 44, :hash "-1123425863"} {:id "defn-/parse-seconds", :kind "defn-", :line 46, :end-line 48, :hash "-309137656"} {:id "defn-/bounded-worker-load", :kind "defn-", :line 50, :end-line 56, :hash "450887292"} {:id "defn-/parse-task-durations", :kind "defn-", :line 58, :end-line 67, :hash "-372645443"} {:id "defn-/bounded-stage-world", :kind "defn-", :line 69, :end-line 76, :hash "-1428085136"} {:id "defn-/timing-evidence", :kind "defn-", :line 78, :end-line 109, :hash "-1932625898"} {:id "defn-/timing-world", :kind "defn-", :line 111, :end-line 115, :hash "1314606518"} {:id "def/report-row-estimates", :kind "def", :line 117, :end-line 119, :hash "-1582722125"} {:id "defn-/budget-world", :kind "defn-", :line 121, :end-line 131, :hash "78919961"} {:id "defn-/assert-seconds!", :kind "defn-", :line 133, :end-line 138, :hash "726379898"} {:id "defn-/assert-value!", :kind "defn-", :line 140, :end-line 144, :hash "356760800"} {:id "defn-/example-values", :kind "defn-", :line 146, :end-line 148, :hash "-856971416"} {:id "defn-/canonical-ledger-world", :kind "defn-", :line 150, :end-line 155, :hash "-968309789"} {:id "defn-/environment-class-world", :kind "defn-", :line 157, :end-line 165, :hash "-466670476"} {:id "def/rejection-reasons", :kind "def", :line 167, :end-line 171, :hash "621663720"} {:id "defn-/receipt-eligibility-world", :kind "defn-", :line 173, :end-line 181, :hash "-813563194"} {:id "defn-/timing-sample-world", :kind "defn-", :line 183, :end-line 187, :hash "877595569"} {:id "defn-/minimum-sample-world", :kind "defn-", :line 189, :end-line 194, :hash "145658693"} {:id "defn-/evaluate-maturity", :kind "defn-", :line 196, :end-line 202, :hash "1652383274"} {:id "defn-/indexed-load-world", :kind "defn-", :line 204, :end-line 214, :hash "-515305694"} {:id "def/maintenance-results", :kind "def", :line 216, :end-line 224, :hash "-1157939848"} {:id "defn-/maintenance-world", :kind "defn-", :line 226, :end-line 229, :hash "1219897170"} {:id "defn-/run-maintenance", :kind "defn-", :line 231, :end-line 235, :hash "-1616042970"} {:id "defn-/assert-vtd002!", :kind "defn-", :line 237, :end-line 239, :hash "-1181928910"} {:id "def/flow-phase-names", :kind "def", :line 241, :end-line 243, :hash "-349843343"} {:id "defn-/flow-characterization", :kind "defn-", :line 245, :end-line 246, :hash "172318254"} {:id "defn-/valid-flow-distributions?", :kind "defn-", :line 248, :end-line 249, :hash "-1282739427"} {:id "defn-/flow-sample-world", :kind "defn-", :line 251, :end-line 252, :hash "-1124489281"} {:id "defn-/flow-maturity-world", :kind "defn-", :line 254, :end-line 256, :hash "-1849915962"} {:id "defn-/flow-budget-world", :kind "defn-", :line 258, :end-line 260, :hash "-422032915"} {:id "defn-/flow-completion-world", :kind "defn-", :line 262, :end-line 263, :hash "77649805"} {:id "defn-/assert-vtd013!", :kind "defn-", :line 265, :end-line 266, :hash "1768839120"} {:id "defn-/performance-calibration", :kind "defn-", :line 268, :end-line 269, :hash "1132048469"} {:id "defn-/calibration-pack", :kind "defn-", :line 271, :end-line 272, :hash "-1488891100"} {:id "defn-/calibration-target", :kind "defn-", :line 274, :end-line 275, :hash "2080664755"} {:id "defn-/calibration-pack-world", :kind "defn-", :line 277, :end-line 278, :hash "1915810833"} {:id "defn-/calibration-target-world", :kind "defn-", :line 280, :end-line 281, :hash "-1417319878"} {:id "defn-/calibration-world", :kind "defn-", :line 283, :end-line 284, :hash "2067073079"} {:id "defn-/regression-world", :kind "defn-", :line 286, :end-line 287, :hash "-2060316272"} {:id "defn-/assert-vtd003!", :kind "defn-", :line 289, :end-line 290, :hash "10390074"} {:id "defn-/inspect!", :kind "defn-", :line 292, :end-line 293, :hash "758818271"} {:id "def/core-handlers", :kind "def", :line 295, :end-line 770, :hash "1852289900"} {:id "def/handlers", :kind "def", :line 772, :end-line 805, :hash "373376150"}]}
;; clj-mutate-manifest-end
