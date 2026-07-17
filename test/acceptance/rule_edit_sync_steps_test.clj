(ns acceptance.rule-edit-sync-steps-test
  (:require [acceptance.steps.local-rule-editing]
            [acceptance.steps.reusable-rule-sync]
            [clojure.test :refer [deftest is]]))

(defn- runtime-assertion [namespace]
  (deref (ns-resolve namespace 'assert-runtime!)))

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
           ((runtime-assertion 'acceptance.steps.local-rule-editing) observed)))))

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
                     :workingDrafts 0}
         :blocked {:summary "Publish or discard the Product detail draft first"
                   :disabled true
                   :draft ["Unrelated"]}}]
    (is (= observed
           ((runtime-assertion 'acceptance.steps.reusable-rule-sync) observed)))))
