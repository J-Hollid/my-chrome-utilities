(ns acceptance.project-skeleton-steps-test
  (:require [acceptance.steps.project-skeleton :as steps]
            [clojure.test :refer [deftest is]]))

(deftest build-command-captures-failed-process-output
  (is (= {:out :string
          :err :string
          :continue true}
         steps/build-shell-options)))
