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

(deftest feature-mode-entry-handlers-are-scoped-to-their-own-feature
  (let [entry "the specification builder is open for Generic pageview revision 4"
        handlers (support/feature-mode-handlers
                  ["features/data-layer-schema-specification-example-selection.feature"]
                  {entry :model}
                  :example-mode
                  (fn [world _ _ _] world))
        handler (some #(when (re-matches (:pattern %) entry) %) handlers)]
    (is handler)
    (is ((:applies? handler) {:acceptance/feature-name "Data layer schema specification example selection"}))
    (is (not ((:applies? handler) {:acceptance/feature-name "Data layer schema specification builder customization"})))))

(deftest validates-mode-specific-example-domains-and-relations-together
  (let [runtime-values {"left" #{"runtime"} "right" #{"value"}}
        model-values {"left" #{"model"} "right" #{"value"}}
        runtime-relations [{:keys ["left" "right"] :rows #{["runtime" "value"]}}]
        model-relations [{:keys ["left" "right"] :rows #{["model" "value"]}}]]
    (is (= {"left" "runtime" "right" "value"}
           (support/validate-mode-example!
            :runtime runtime-values model-values runtime-relations model-relations
            {"left" "runtime" "right" "value"} "invalid domain" "invalid relation")))
    (is (thrown? Exception
                 (support/validate-mode-example!
                  :runtime runtime-values model-values runtime-relations model-relations
                  {"left" "model" "right" "value"} "invalid domain" "invalid relation")))))
