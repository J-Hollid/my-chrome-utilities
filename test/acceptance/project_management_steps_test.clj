(ns acceptance.project-management-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.project-management :as project-management]
            [clojure.test :refer [deftest is]]))

(deftest project-management-namespace-owns-every-active-step
  (is (empty? (feature-support/unhandled-step-texts
               project-management/feature-files
               project-management/handlers))))

(def complete-evidence
  (into {:installedBoundary true}
        (concat
         (map (fn [index] [(keyword (format "context%03d" index)) true])
              (range 1 11))
         (map (fn [index] [(keyword (format "portability%03d" index)) true])
              (range 1 6)))))

(deftest browser-evidence-requires-the-exact-non-vacuous-contract
  (is (false? (project-management/complete-browser-evidence? nil)))
  (is (false? (project-management/complete-browser-evidence? {})))
  (is (false? (project-management/complete-browser-evidence?
               (dissoc complete-evidence :context010))))
  (is (false? (project-management/complete-browser-evidence?
               (assoc complete-evidence :unexpected true))))
  (is (false? (project-management/complete-browser-evidence?
               (assoc complete-evidence :portability005 false))))
  (is (true? (project-management/complete-browser-evidence? complete-evidence))))
