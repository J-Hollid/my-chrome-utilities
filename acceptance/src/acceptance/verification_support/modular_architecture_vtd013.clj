(ns acceptance.verification-support.modular-architecture-vtd013
  (:require [acceptance.steps.support :as support]
            [aps.json :as aps-json]
            [babashka.fs :as fs]))

(def ^:private flow-phase-names
  ["browser startup" "target setup" "fixture setup" "readiness"
   "example compilation" "rendering" "persistence" "assertion" "cleanup"])

(defn flow-characterization []
  (aps-json/read-json-file
   (str (fs/path (support/repository-root) "verification"
                 "flow-examples-characterization.json"))))

(defn- finite-non-negative? [value]
  (and (number? value) (Double/isFinite (double value)) (not (neg? value))))

(defn valid-flow-distributions? [timing-class]
  (let [phases (:phases timing-class)]
    (and (= (set flow-phase-names) (set (map name (keys phases))))
         (every? (fn [[phase-key timing]]
                   (let [phase-name (name phase-key)]
                     (and (= (if (= "browser startup" phase-name) "process" "target")
                             (:scope timing))
                          (finite-non-negative? (:p50Ms timing))
                          (finite-non-negative? (:p90Ms timing))
                          (<= (:p50Ms timing) (:p90Ms timing)))))
                 phases)
         (finite-non-negative? (get-in timing-class [:target :p50Ms]))
         (finite-non-negative? (get-in timing-class [:target :p90Ms]))
         (<= (get-in timing-class [:target :p50Ms])
             (get-in timing-class [:target :p90Ms])))))

(defn flow-sample-world [verify-throughput! characterization world sample-condition]
  (let [[class-key expected-load expected-plan reported-plan]
        (case sample-condition
          "focused single-target"
          [:focusedNormal "normal" "focused FLOW_GRAPH_EXAMPLES_TARGET"
           "focused FLOW_GRAPH_EXAMPLES_TARGET"]
          "normally loaded terminal lane 4 of 4"
          [:normallyLoaded "loaded" "existing Flow and capture co-run"
           "terminal lane 4/4 Flow and capture co-run"]
          nil)
        report (characterization)
        timing-class (get-in report [:classes class-key])]
    (support/assert! (and class-key timing-class
                          (= expected-load (get-in timing-class [:environment :executionLoad]))
                          (= reported-plan (:planContext timing-class)))
                     "Flow sample condition is not backed by the committed characterization."
                     {:sample-condition sample-condition})
    (assoc (verify-throughput! world)
           :vtd013/report report
           :vtd013/timing-class timing-class
           :vtd013/execution-load expected-load
           :vtd013/plan-context expected-plan)))

(defn- maturity-status [samples minimum]
  (if (< samples minimum) "provisional" "non-provisional"))

(defn flow-maturity-world [verify-throughput! characterization world focused-samples loaded-samples minimum]
  (let [focused (parse-long focused-samples)
        loaded (parse-long loaded-samples)
        minimum-count (parse-long minimum)
        report (characterization)]
    (support/assert! (and (nat-int? focused) (nat-int? loaded) (pos-int? minimum-count)
                          (every? valid-flow-distributions? (vals (:classes report))))
                     "Flow timing maturity fixture or committed distributions are invalid."
                     {:focused focused :loaded loaded :minimum minimum-count})
    (assoc (verify-throughput! world)
           :vtd013/report report
           :vtd013/focused-status (maturity-status focused minimum-count)
           :vtd013/loaded-status (maturity-status loaded minimum-count))))

(defn flow-budget-world [verify-throughput! characterization parse-seconds world focused-p90]
  (let [seconds (parse-seconds focused-p90)
        report (characterization)
        budget-ms (:focusedBudgetMilliseconds report)]
    (support/assert! (and (number? seconds) (= 12891 budget-ms))
                     "Flow examples budget boundary is not the committed 12891ms contract."
                     {:focused-p90 focused-p90 :budget-ms budget-ms})
    (assoc (verify-throughput! world)
           :vtd013/report report
           :vtd013/budget-result (if (<= (* seconds 1000) budget-ms) "pass" "fail")
           :vtd013/loaded-excluded? true)))

(defn flow-completion-world [verify-throughput! characterization world]
  (let [report (characterization)
        focused (get-in report [:classes :focusedNormal])
        loaded (get-in report [:classes :normallyLoaded])
        minimum (:minimumIndependentSamples report)
        digests (concat (:receiptDigests focused) (:receiptDigests loaded))]
    (support/assert! (and (= "complete" (get-in report [:completion :status]))
                          (pos-int? minimum)
                          (>= (:sampleCount focused) minimum)
                          (>= (:sampleCount loaded) minimum)
                          (= (count digests)
                             (+ (:sampleCount focused) (:sampleCount loaded))
                             (count (set digests)))
                          (every? #(re-matches #"[a-f0-9]{64}" %) digests)
                          (re-matches #"[a-f0-9]{64}" (:artifactBuildIdentity report))
                          (= (:artifactBuildIdentity report)
                             (get-in focused [:environment :buildIdentity])
                             (get-in loaded [:environment :buildIdentity]))
                          (re-matches #"[a-f0-9]{40}" (:implementationCommit report))
                          (false? (get-in report [:evidenceConservation :rawReceiptBytesChanged])))
                     "Committed Flow characterization is not exact, mature, and digest-bound."
                     {:report report})
    (assoc (verify-throughput! world)
           :vtd013/report report :vtd013/focused focused :vtd013/loaded loaded)))

(defn assert-vtd013! [world predicate message]
  (support/assert! predicate message {:report (:vtd013/report world)})
  world)
