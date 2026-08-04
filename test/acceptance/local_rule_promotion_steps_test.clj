(ns acceptance.local-rule-promotion-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.local-rule-promotion :as promotion]
            [clojure.test :refer [deftest is]]))

(deftest accepts-layout-independent-rule-restoration-evidence
  (let [restored? #'promotion/restored-rule-context?]
    (is (restored? {:focus "local-41" :open true :scroll 3585} "local-41"))
    (is (restored? {:focus "reusable-51" :open true :scroll 3043} "reusable-51"))
    (is (not (restored? {:focus "local-41" :open true :scroll -1} "local-41")))
    (is (not (restored? {:focus "another-rule" :open true :scroll 3585} "local-41")))))

(deftest verifies-local-rule-promotion-features
  (feature-support/verify-feature-suite!
   promotion/feature-files promotion/handlers all/handlers))
