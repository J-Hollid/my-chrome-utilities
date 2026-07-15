(ns acceptance.saved-event-feed-filters-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.saved-event-feed-filters :as saved-filters]
            [clojure.test :refer [deftest]]))

(deftest verifies-saved-event-feed-filter-features
  (feature-support/verify-feature-suite!
   saved-filters/feature-files saved-filters/handlers all/handlers))
