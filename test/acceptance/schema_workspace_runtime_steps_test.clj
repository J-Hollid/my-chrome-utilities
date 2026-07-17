(ns acceptance.schema-workspace-runtime-steps-test
  (:require [acceptance.steps.schema-workspace-runtime :as workspace]
            [acceptance.steps.schema-workspace-runtime-browser-assertions :as browser]
            [acceptance.steps.schema-workspace-runtime-editor-transitions :as editor]
            [acceptance.steps.schema-workspace-runtime-export-transitions :as export]
            [acceptance.steps.schema-workspace-runtime-support :as runtime]
            [acceptance.steps.schema-workspace-runtime-validation-transitions :as validation]
            [clojure.test :refer [deftest is testing]]))

(def valid-observation
  {:mounted true
   :sourceCreation {:name "Order complete schema"
                    :paths ["page_type" "page_name" "commerce" "commerce.order" "commerce.order.id"]}
   :transfer {:downloadName "schema-library-v1.json"
              :before {:schemas ["schema:checkout" "schema:order"]
                       :rules ["rule:page-type" "rule:channel"]}
              :content {:version 1
                        :schemas ["schema:checkout" "schema:order"]
                        :rules ["rule:page-type" "rule:channel"]}
              :reloaded {:schemas ["schema:checkout" "schema:order"]
                         :rules ["rule:page-type" "rule:channel"]}}
   :reload {:stored 2 :rendered 2}
   :rules {:actions ["Edit" "Disable" "Remove"]
           :menuOpen true :returnFocus true :stateReturnFocus true
           :reenable "Re-enable" :revisionReview {:open true}}
   :assignment {:sourceId "event-history" :priority 120}
   :inheritance {:groups [{:state "active-inherited"}]
                 :preview ["/example · Known page types v1 · inherited from Checkout schema v2"]}
   :validation {:validation "Valid"}})

(deftest shared-export-preflight-is-independent-of-outline-counts
  (is (= valid-observation
         (#'workspace/assert-export-preflight! valid-observation))))

(deftest shared-export-preflight-keeps-envelope-and-identity-checks-separate
  (testing "a valid format version cannot hide a missing schema identity"
    (is (thrown-with-msg? clojure.lang.ExceptionInfo
                          #"schema identities"
                          (#'workspace/assert-export-preflight!
                           (assoc-in valid-observation [:transfer :content :schemas] ["schema:checkout"])))))
  (testing "schema identity equality cannot hide an invalid envelope version"
    (is (thrown-with-msg? clojure.lang.ExceptionInfo
                          #"format version"
                          (#'workspace/assert-export-preflight!
                           (assoc-in valid-observation [:transfer :content :version] 2))))))

(deftest visibility-observation-starts-only-at-feature-entry-steps
  (let [world {:browser-observation {:ruleEditorVisibility {}}}
        example {}]
    (is (true? (:schema-rule-visibility?
                (#'workspace/begin-visibility-observation
                 world example "Data Layer view <view_name> is active"))))
    (is (= world
           (#'workspace/begin-visibility-observation
            world example "Rule configuration is not visible")))))

(deftest browser-workspace-reuses-a-validated-observation-for-the-same-fixture
  (let [observation {:mounted true}]
    (reset! @#'workspace/browser-workspace-observations {nil observation})
    (is (= {:browser-observation observation}
           (#'workspace/browser-workspace! {} {})))
    (reset! @#'workspace/browser-workspace-observations {})))

(deftest support-keeps-example-and-export-invariants
  (is (runtime/canonical-source? "Live event" "captured event event-7"))
  (is (not (runtime/canonical-source? "Live event" "template Order complete")))
  (is (= "2:4" (runtime/export-fixture {"schema_count" "2" "rule_count" "4"})))
  (is (nil? (runtime/export-fixture {})))
  (is (= {:ready true} (runtime/require-world! {:ready true} :ready "missing")))
  (is (thrown? clojure.lang.ExceptionInfo (runtime/require-world! {} :ready "missing")))
  (is (= 4 (runtime/count-value {"rule_count" "4"} "rule_count")))
  (is (= valid-observation (runtime/assert-export-preflight! valid-observation)))
  (is (nil? (runtime/assert-export-counts!
             (assoc valid-observation :reload {:stored 2 :rendered 2 :storedRules 4}
                    :transfer (assoc (:transfer valid-observation)
                                     :content {:version 1 :schemas [:a :b] :rules [:a :b :c :d]}))
             {"schema_count" "2" "rule_count" "4"}))))

(deftest browser-assertion-groups-dispatch-to-their-own-evidence
  (let [representative-steps
        ["the operator activates Create schema from this <source_kind>"
         "the affected property rows immediately show their active-rule counts and states"
         "inherited and general rules are displayed in the editor"
         "the operator activates Export Schema Library"
         "the operator edits it to include confirmation"
         "page_view is captured from https://shop.example/order-confirmation"
         "shared browser setup observes an export envelope with format version, schema identities, and rule identities"]]
    (is (= [nil nil nil nil nil nil valid-observation]
           (mapv #(browser/assert-browser-step! % valid-observation)
                 representative-steps))))
  (is (nil? (browser/assert-browser-step! "unclassified validation step" valid-observation)))
  (is (thrown? clojure.lang.ExceptionInfo
               (browser/assert-browser-step! "the operator activates Create schema from this <source_kind>"
                                             (assoc-in valid-observation [:sourceCreation :paths] [])))))

(deftest editor-transitions-preserve-draft-and-inheritance-state
  (let [source-step (get editor/transitions "<source_kind> <source_name> contains nested payload properties page_type, page_name, and commerce.order.id")
        create-step (get editor/transitions "the operator activates Create schema from this <source_kind>")
        rule-step (get editor/transitions "the operator adds, edits, disables, re-enables, and removes property rules through the rendered rule menus")
        parent-step (get editor/transitions "Generic page view version 4 is the parent of an Order confirmation schema draft")
        source-world (source-step {:browser-observation valid-observation}
                                  {"source_kind" "Live event" "source_name" "captured event event-7"})]
    (is (= #{"page_type" "page_name" "commerce.order.id"} (get-in source-world [:source :paths])))
    (is (thrown? clojure.lang.ExceptionInfo
                 (source-step {:browser-observation valid-observation}
                              {"source_kind" "Live event" "source_name" "wrong"})))
    (is (= {} (get-in (create-step source-world {}) [:draft :rules])))
    (is (= {:operator "allowed-values" :enabled true :version 1}
           (get-in (rule-step {} {}) [:draft :rules "page_type"])))
    (is (= {:parent "Generic page view" :version 4
            :overrides #{"inherit" "enabled" "disabled"}}
           (:inheritance (parent-step {} {}))))))

(deftest validation-and-export-transitions-preserve-typed-state
  (let [saved ((get validation/transitions "reusable rule Approved page types version 1 is saved") {} {})
        edited ((get validation/transitions "the operator edits it to include confirmation") saved {})
        library ((get export/transitions "the current Schema Library contains <schema_count> schemas and <rule_count> reusable rules")
                 {} {"schema_count" "2" "rule_count" "4"})]
    (is (= {:version 1 :pinned true} (:reusable-rule saved)))
    (is (= 2 (get-in edited [:reusable-rule :version])))
    (is (= {:schemas 2 :rules 4} (:schema-library-export-example library)))
    (is (thrown? clojure.lang.ExceptionInfo
                 ((get export/transitions "no scenario-specific library size is required before an export-count example is active")
                  library {})))
    (is (= true (:shared-export-preflight?
                 ((get export/transitions "shared browser setup observes an export envelope with format version, schema identities, and rule identities")
                  {} {}))))))

(deftest coordinator-validates-the-complete-browser-contract
  (is (= valid-observation (#'workspace/validate-browser-workspace! valid-observation)))
  (is (thrown? clojure.lang.ExceptionInfo
               (#'workspace/validate-browser-workspace! (assoc valid-observation :mounted false))))
  (is (true? (:schema-workspace-runtime?
              (#'workspace/begin-runtime-observation
               {:browser-observation valid-observation} {}
               "the rendered Data Layer Schemas workspace is displayed"))))
  (is (thrown? clojure.lang.ExceptionInfo
               (#'workspace/transition {:browser-observation valid-observation}
                                       {} [] {:text "unsupported step"}))))
