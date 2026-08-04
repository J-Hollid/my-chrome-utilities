(ns acceptance.schema-publication-refresh-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.runtime :as runtime]
            [acceptance.steps.all :as all]
            [acceptance.steps.non-applicable-property-visibility :as non-applicable]
            [acceptance.steps.schema-publication-refresh :as publication]
            [acceptance.steps.schema-publication-refresh-support :as publication-support]
            [acceptance.steps.support :as support]
            [clojure.test :refer [deftest is]]))

(deftest model-verification-cache-starts-unverified
  (is (false? @(#'publication-support/fresh-model-cache))))

(deftest verifies-schema-publication-refresh-features
  (feature-support/verify-feature-suite!
   publication/feature-files publication/handlers all/handlers))

(deftest non-applicable-feature-recovers-mode-after-a-shared-background-handler
  (let [feature-name "Data layer non-applicable property visibility"
        first-step "a captured event with an assigned schema is open in the Live inspector"
        second-step "its Properties view contains observed and schema-expected property paths"
        shared-handler {:pattern (support/template-pattern first-step)
                        :handler (fn [world _example _captures]
                                   (assoc world :shared-background-consumed true))}
        handlers (into [shared-handler] non-applicable/handlers)
        initial-world {:acceptance/feature-name feature-name}
        after-shared (runtime/execute-step!
                      initial-world {} {:keyword "Given" :text first-step} handlers)
        transition-evidence (atom nil)]
    (is (:shared-background-consumed after-shared))
    (is (nil? (:non-applicable-property-visibility-mode after-shared)))
    (with-redefs [publication-support/transition!
                  (fn [world example text entry-modes mode-key validate-example!]
                    (reset! transition-evidence
                            {:world world
                             :example example
                             :text text
                             :entry-modes entry-modes
                             :mode-key mode-key
                             :validate-example! validate-example!})
                    world)]
      (let [result (runtime/execute-step!
                    after-shared {} {:keyword "And" :text second-step} handlers)]
        (is (= :model (:non-applicable-property-visibility-mode result)))
        (is (= :model (get-in @transition-evidence
                              [:world :non-applicable-property-visibility-mode])))))
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo
         #"Unsupported acceptance step"
         (runtime/execute-step!
          {:acceptance/feature-name "Data layer live validation property presentation"}
          {} {:keyword "And" :text second-step} non-applicable/handlers)))))

(deftest verifies-non-applicable-property-visibility-features
  (feature-support/verify-feature-suite!
   non-applicable/feature-files non-applicable/handlers all/handlers))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T19:47:38.123416734+02:00", :module-hash "-1383996524", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "603028962"} {:id "form/1/deftest", :kind "deftest", :line 7, :end-line 9, :hash "1978211333"}]}
;; clj-mutate-manifest-end
