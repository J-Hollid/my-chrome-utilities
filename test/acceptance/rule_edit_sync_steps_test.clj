(ns acceptance.rule-edit-sync-steps-test
  (:require [acceptance.steps.local-rule-editing]
            [acceptance.steps.reusable-rule-sync]
            [clojure.test :refer [deftest is]]))

(defn- private-function [namespace function-name]
  (deref (ns-resolve namespace function-name)))

(deftest validates-local-rule-editing-runtime-observation
  (let [observed
        {:opened {:values ["page" "product"]
                  :severity "warning"
                  :enabled true
                  :reusableMetadata false
                  :context "Local rule origin at /page_type"
                  :focused true}
         :cancelled {:storageUnchanged true
                     :reopened ["page" "product"]}
         :saved {:version 3
                 :published ["page" "product"]
                 :draft ["page" "product" "checkout"]
                 :index 1
                 :pending ["Edit Known page types at /page_type"]
                 :open true}
         :previewIssues 0
         :invalid {:assistance "Correct the regular expression"
                   :button true
                   :storageUnchanged true}
         :routed {:ruleLibrary "true"
                  :reusableEditor true
                  :name "Approved page names"
                  :localDialog false}}]
    (is (= observed
           ((private-function 'acceptance.steps.local-rule-editing 'assert-runtime!) observed)))))

(deftest validates-reusable-rule-sync-runtime-observation
  (let [observed
        {:saved {:schemasUnchanged true
                 :version 2
                 :values ["page" "product" "checkout"]
                 :action true}
         :review {:summary (str "2 schemas and 3 attachments; "
                                "Page view revision 3 to 4; "
                                "Product detail revision 5 to 6")
                  :confirmDisabled false
                  :cancelled true}
         :failure {:unchanged true
                   :message "No schema revision was published"}
         :published {:versions [4 6 7]
                     :pageRules [["reusable-51" 2] ["reusable-51" 2]]
                     :productRules [["reusable-51" 2]]
                     :historical [[1 1] [1]]
                     :values ["page" "product" "checkout"]
                     :workingDrafts 0
                     :actionRemoved true}
         :blocked {:summary "Publish or discard the Product detail draft first"
                   :disabled true
                   :draft ["Unrelated"]}}]
    (is (= observed
           ((private-function 'acceptance.steps.reusable-rule-sync 'assert-runtime!) observed)))))

(deftest validates-rule-edit-and-sync-example-relations
  (let [validate-local
        (private-function 'acceptance.steps.local-rule-editing 'validate-example!)
        local-example
        {"configuration" "page, product, and checkout"
         "completion" "cancelling"
         "edit_outcome" "the local rule configuration closes"}
        validate-sync
        (private-function 'acceptance.steps.reusable-rule-sync 'validate-example!)
        sync-example
        {"completion_event" "publication fails"
         "schema_outcome" "no attached schema receives a partial new revision"}]
    (is (= local-example (validate-local :model local-example)))
    (is (thrown? Exception
                 (validate-local :model (assoc local-example "completion" "saving the changes"))))
    (is (= sync-example (validate-sync :model sync-example)))
    (is (thrown? Exception
                 (validate-sync :model (assoc sync-example "schema_outcome"
                                              "all reviewed schema revisions are published"))))))
