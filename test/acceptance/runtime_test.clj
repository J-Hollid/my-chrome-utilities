(ns acceptance.runtime-test
  (:require [acceptance.runtime :as runtime]
            [clojure.test :refer [deftest is testing]]))

(deftest expands-background-for-each-scenario-example
  (let [feature {:name "Demo"
                 :background [{:keyword "Given"
                               :text "a configured repository"}]
                 :scenarios [{:name "First"
                              :steps [{:keyword "Then"
                                       :text "the first assertion passes"}]
                              :examples [{"project_name" "my-chrome-utilities"}
                                         {"project_name" "other"}]}
                             {:name "Second"
                              :steps [{:keyword "Then"
                                       :text "the second assertion passes"}]
                              :examples []}]}
        executions (runtime/expand-executions feature)]
    (is (= ["First/example_1" "First/example_2" "Second/example_1"]
           (mapv :name executions)))
    (is (= ["a configured repository" "the first assertion passes"]
           (mapv :text (:steps (first executions)))))
    (is (= {"project_name" "my-chrome-utilities"}
           (:example (first executions))))
    (is (= {} (:example (last executions))))))

(deftest dispatches-steps-with-regex-captured-placeholder-names
  (let [handlers [{:pattern #"^a repository for project <([A-Za-z0-9_]+)>$"
                   :handler (fn [world example [project-key]]
                              (assoc world :project-name (get example project-key)))}
                  {:pattern #"^package metadata identifies the project as <([A-Za-z0-9_]+)>$"
                   :handler (fn [world example [project-key]]
                              (assoc world :metadata-name (get example project-key)))}]
        example {"project_name" "my-chrome-utilities"}]
    (is (= {:project-name "my-chrome-utilities"}
           (runtime/execute-step! {} example
                                  {:keyword "Given"
                                   :text "a repository for project <project_name>"}
                                  handlers)))
    (is (= {:metadata-name "my-chrome-utilities"}
           (runtime/execute-step! {} example
                                  {:keyword "Then"
                                   :text "package metadata identifies the project as <project_name>"}
                                  handlers)))))

(deftest unsupported-steps-fail-with-diagnostics
  (testing "unsupported steps are test failures, not silent skips"
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo
         #"Unsupported acceptance step"
         (runtime/execute-step! {} {}
                                {:keyword "Then"
                                 :text "an unsupported step appears"}
                                [])))))

(deftest exposes-feature-identity-to-step-handlers
  (let [seen (atom nil)
        feature {:name "Feature identity"
                 :background []
                 :scenarios [{:name "Scenario"
                              :steps [{:keyword "Then" :text "identity is visible"}]
                              :examples []}]}
        handlers [{:pattern #"^identity is visible$"
                   :handler (fn [world _ _]
                              (reset! seen (:acceptance/feature-name world))
                              world)}]]
    (runtime/run-feature! feature handlers)
    (is (= "Feature identity" @seen))))
