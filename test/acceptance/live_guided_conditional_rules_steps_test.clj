(ns acceptance.live-guided-conditional-rules-steps-test
  (:require [acceptance.feature-support :as feature-support]
            [acceptance.steps.all :as all]
            [acceptance.steps.live-guided-conditional-rules :as guided-conditional]
            [clojure.test :refer [deftest is]]))

(deftest verifies-live-guided-conditional-rule-features
  (feature-support/verify-feature-suite!
   guided-conditional/feature-files guided-conditional/handlers all/handlers))

(deftest validates-complete-string-condition-operator-set
  (let [assert-authoring! (deref (ns-resolve 'acceptance.steps.live-guided-conditional-rules 'assert-authoring!))
        operators ["Exists" "Does not exist" "Equals" "Does not equal" "Is one of" "Starts with" "Contains" "Matches pattern"]
        observed {:requirement {:heading "Define requirement" :applyOnlyWhen true :schemaEditorHidden true :pickerClosed true}
                  :initial {:type "Detected type: string" :comparison "product_detail" :operators operators
                            :customerCount 1 :currentPageCount 1 :noConsequenceOption true :withinWidth true
                            :summary "When page_type equals product_detail"}
                  :absent {:type "Detected type: string" :comparison "" :operators operators}
                  :invalidEmpty {:storageUnchanged true :assistance "Enter a comparison value"}
                  :invalidPattern {:storageUnchanged true :assistance "Correct the regular expression"}
                  :invalidNoPredicates {:storageUnchanged true :assistance "Add at least one condition"}
                  :preview {:allResult "Failed for the current event" :allFalse "Not applicable for the current event" :anyResult "Failed for the current event"}
                  :confirmation {:open true :retained true :discarded true}}]
    (is (nil? (assert-authoring! observed)))
    (is (thrown-with-msg? clojure.lang.ExceptionInfo #"Trigger options"
                          (assert-authoring! (update-in observed [:initial :operators] #(vec (remove #{"Contains"} %))))))))
