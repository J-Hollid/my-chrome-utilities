(ns acceptance.specification-studio-choice-controls-steps-test
  (:require [acceptance.steps.specification-studio-choice-controls :as choice]
            [clojure.test :refer [deftest is]]))

(def contracts
  #{:schema.only-defined :schema.copy-dependency :schema.destructive-confirmation
    :schema.specification-property :schema.specification-headings
    :documentation.concept-subheadings :documentation.concept-membership
    :documentation.section-membership :documentation.flow-context
    :documentation.property-row :documentation.metadata-column
    :documentation.matrix-context :documentation.profile-column
    :documentation.export-section :documentation.confirm-incomplete
    :documentation.theme-option :entity.creation-option :entity.editor-option
    :conflict.pending-field :bulk.staged-property :defect.issue-inclusion
    :defect.timeline-evidence :defect.expected-override :defect.acknowledgement
    :defect.report-section :defect.warning-acknowledgement
    :defect.expected-property :guided.conditional :guided.publish-rule})

(deftest choice-examples-preserve-approved-relations
  (is (map? (#'choice/validate-example!
             :model
             {"control" "Only defined fields"
              "consequence" "immediately applies one reversible Draft setting"
              "pattern" "switch"})))
  (is (map? (#'choice/validate-example!
             :runtime
             {"presentation" "360 CSS pixel Studio"})))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"invalid result"
       (#'choice/validate-example!
        :model
        {"control" "Only defined fields"
         "consequence" "immediately applies one reversible Draft setting"
         "pattern" "checkbox"}))))

(deftest installed-evidence-requires-the-exact-complete-contract-set
  (is (nil? (#'choice/assert-browser! (zipmap contracts (repeat true)))))
  (is (thrown? clojure.lang.ExceptionInfo
               (#'choice/assert-browser! (zipmap (disj contracts :schema.only-defined)
                                                 (repeat true)))))
  (is (thrown? clojure.lang.ExceptionInfo
               (#'choice/assert-browser! (assoc (zipmap contracts (repeat true))
                                                :schema.only-defined false)))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-29T18:24:20.735973203+02:00", :module-hash "-960771892", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1106186437"} {:id "def/contracts", :kind "def", :line 5, :end-line 17, :hash "-530677980"} {:id "form/2/deftest", :kind "deftest", :line 19, :end-line 35, :hash "-174209834"} {:id "form/3/deftest", :kind "deftest", :line 37, :end-line 44, :hash "-1568843162"}]}
;; clj-mutate-manifest-end
