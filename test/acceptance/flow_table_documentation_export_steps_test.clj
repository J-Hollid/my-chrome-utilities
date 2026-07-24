(ns acceptance.flow-table-documentation-export-steps-test
  (:require [acceptance.steps.flow-table-documentation-export :as flow-export]
            [clojure.test :refer [deftest is]]))

(defn- applicable-handler? [feature-name step]
  (boolean
   (some (fn [{:keys [pattern applies?]}]
           (and (re-matches pattern step)
                (applies? {:acceptance/feature-name feature-name})))
         flow-export/handlers)))

(deftest each-flow-export-feature-establishes-its-mode-from-its-first-given
  (is (applicable-handler?
       "Data layer Flow table documentation export"
       "Checkout journey relates Cart, Shipping, Payment, and Confirmation context-setting Page events"))
  (is (applicable-handler?
       "Data layer Flow table documentation export runtime"
       "the built extension is running with the production Flow editor, canonical compiler, table exporter, clipboard, and download adapter")))

(deftest flow-export-examples-conserve-approved-result-relations
  (is (map? (flow-export/validate-example!
             :model
             {"definition" "fixed to checkout"
              "display" "checkout"
              "detail" "exact effective value and provenance"})))
  (is (map? (flow-export/validate-example!
             :runtime
             {"view" "Data capture matrix"
              "heading_setting" "cleared"
              "copy_mode" "Rich table for Confluence or Jira"
              "output" "semantic rich HTML and unheaded plain fallback"})))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"invalid result"
       (flow-export/validate-example!
        :model
        {"definition" "fixed to checkout"
         "display" "Checkout"
         "detail" "exact effective value and provenance"}))))
