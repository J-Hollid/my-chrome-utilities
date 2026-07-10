(ns acceptance.live-event-presentation-steps-test (:require [acceptance.steps.live-event-presentation :as presentation] [clojure.test :refer [deftest is]]))
(deftest presentation-pipeline-is-semantic (is (presentation/semantics? ".")))
