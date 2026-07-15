(ns acceptance.steps-support-test
  (:require [acceptance.steps.support :as support]
            [clojure.test :refer [deftest is]]))

(deftest build-command-captures-failed-process-output
  (is (= {:out :string
          :err :string
          :continue true}
         support/build-shell-options)))

(deftest checks-source-text-against-required-signals
  (is (support/includes-all? "alpha beta gamma" ["alpha" "gamma"]))
  (is (not (support/includes-all? "alpha beta" ["alpha" "gamma"])))
  (is (support/matches-all? "const answer = 42;" [#"answer" #"\d+"]))
  (is (not (support/matches-all? "const answer = value;" [#"answer" #"\d+"]))))

(deftest selects-example-domains-by-execution-mode
  (let [runtime-values {"value" #{"runtime"}}
        model-values {"value" #{"model"}}]
    (is (= {"value" "runtime"}
           (support/validate-mode-example-domain!
            :runtime runtime-values model-values {"value" "runtime"} "invalid runtime value")))
    (is (= {"value" "model"}
           (support/validate-mode-example-domain!
            :model runtime-values model-values {"value" "model"} "invalid model value")))
    (is (= :rejected
           (try
             (support/validate-mode-example-domain!
              :runtime runtime-values model-values {"value" "model"} "invalid runtime value")
             :accepted
             (catch Exception _ :rejected))))))

(deftest validates-example-relations-when-all-keys-are-present
  (let [relations [{:keys ["left" "right"]
                    :rows #{["a" "b"]}}]]
    (is (= {"left" "a" "right" "b"}
           (support/validate-example-relations!
            relations {"left" "a" "right" "b"} "invalid relation")))
    (is (= {"left" "a"}
           (support/validate-example-relations!
            relations {"left" "a"} "invalid relation")))
    (is (= :rejected
           (try
             (support/validate-example-relations!
              relations {"left" "a" "right" "c"} "invalid relation")
             :accepted
             (catch Exception _ :rejected))))))
