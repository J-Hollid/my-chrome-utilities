(ns acceptance.observability-library-steps-test
  (:require [acceptance.steps.observability-library :as observability]
            [clojure.test :refer [deftest is]]))

(deftest recognizes-observability-library-contract
  (is (observability/observability-library?
       "export interface SourceAdapter {} export interface SourceEvent {}\nnormalizeSourceEvent saveEventTemplate reviseTemplate duplicateTemplate saveSession sequenceFromSession eventFeed runnableSteps"))
  (is (not (observability/observability-library?
            "normalizeSourceEvent saveEventTemplate"))))
