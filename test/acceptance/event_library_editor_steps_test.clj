(ns acceptance.event-library-editor-steps-test
  (:require [acceptance.steps.event-library-editor :as editor]
            [clojure.string :as str]
            [clojure.test :refer [deftest is testing]]))

(deftest verifies-event-library-editor-semantics
  (is (editor/event-library-editor-semantics? ".")))

(deftest every-event-library-editor-step-has-a-specific-handler
  (doseq [path ["features/data-layer-event-template-library.feature" "features/data-layer-event-property-editor.feature"]
          step (->> (str/split-lines (slurp path))
                    (keep #(second (re-matches #"\s*(?:Given|When|Then|And) (.+)" %)))
                    (remove #{"a repository for project <project_name>"}))]
    (testing (str path ": " step)
      (is (editor/event-library-editor-step-covered? step)))))
