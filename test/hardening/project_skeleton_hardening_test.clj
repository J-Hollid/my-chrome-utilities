(ns hardening.project-skeleton-hardening-test
  (:require [acceptance.steps.project-skeleton :as project]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(def dispatch (partial support/dispatch project/handlers))
(def project-example {"project_name" "my-chrome-utilities"})

(deftest hardens-project-and-production-contracts
  (let [repository (dispatch {} project-example
                             "a repository for project <project_name>")
        inspected (dispatch repository "the project skeleton is inspected")]
    (is (= inspected
           (dispatch inspected project-example
                     "package metadata identifies the project as <project_name>")))
    (is (= inspected (dispatch inspected "the skeleton includes TypeScript source")))
    (is (= inspected (dispatch inspected "the skeleton includes a browser app entry point")))
    (is (= (assoc repository :build-result {:exit 0})
           (dispatch (assoc repository :build-result {:exit 0})
                     project-example
                     "a production build for <project_name> completes")))))
