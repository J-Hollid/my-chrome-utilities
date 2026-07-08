(ns acceptance.steps-support-test
  (:require [acceptance.steps.support :as support]
            [clojure.test :refer [deftest is]]))

(deftest build-command-captures-failed-process-output
  (is (= {:out :string
          :err :string
          :continue true}
         support/build-shell-options)))
