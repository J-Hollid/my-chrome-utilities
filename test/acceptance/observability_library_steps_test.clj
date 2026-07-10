(ns acceptance.observability-library-steps-test
  (:require [acceptance.steps.observability-library :as observability]
            [clojure.string :as str]
            [clojure.test :refer [deftest is testing]]))

(deftest recognizes-observability-library-contract
  (is (observability/observability-library?
       "export interface SourceAdapter {} export interface SourceEvent {} export interface SourceManager {}\nnormalizeAdapterInput adapterActions artifactLifecycle createSourceManager addObservationSource setObservationSourceEnabled removeObservationSource captureSourceInput sourceFeed sourceSummaries"))
  (is (not (observability/observability-library?
            "normalizeSourceEvent saveEventTemplate"))))

(def source-foundation-features
  ["features/data-layer-source-aware-event-model.feature"
   "features/data-layer-multiple-observation-sources.feature"])

(def shared-background-steps
  #{"a repository for project <project_name>"
    "a data layer testing session is active"})

(defn- feature-steps [path]
  (->> (str/split-lines (slurp path))
       (keep (fn [line]
               (second (re-matches #"\s*(?:Given|When|Then|And) (.+)" line))))
       (remove shared-background-steps)))

(deftest every-source-foundation-step-has-a-specific-handler
  (doseq [path source-foundation-features
          step (feature-steps path)]
    (testing (str path ": " step)
      (is (observability/source-foundation-step-covered? step)))))
