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
  (is (map? (flow-export/validate-example!
             :runtime
             {"export_scope" "selected Checkout journey and Sitewide sections"
              "expected_sheets" "Checkout journey, Sitewide"})))
  (is (map? (flow-export/validate-example!
             :model
             {"headings" "off"
              "heading_result" "absent while concept filtering remains active"})))
  (is (map? (flow-export/validate-example!
             :runtime
             {"headings" "on"
              "heading_result" "one heading for each non-empty included group"})))
  (is (map? (flow-export/validate-example!
             :runtime
             {"image_type" "JPEG"
              "media_type" "image/jpeg"})))
  (is (map? (flow-export/validate-example!
             :runtime
             {"image_type" "PNG"
              "export_scope" "selected sections"})))
  (is (map? (flow-export/validate-example!
             :model
             {"invalid_logo" "a file whose image data cannot be read"
              "diagnostic" "The logo could not be read"})))
  (is (map? (flow-export/validate-example!
             :runtime
             {"invalid_logo" "a file that produces an image-read failure"
              "diagnostic" "The logo could not be read"})))
  (is (map? (flow-export/validate-example!
             :runtime
             {"declared_type" "GIF"
              "diagnostic" "Choose a valid GIF image"})))
  (let [example {"instance_count" "4"
                 "source_page" "Generic checkout page"
                 "first_name" "Customer details"
                 "second_name" "Payment"
                 "third_name" "Summary"
                 "fourth_name" "Confirmation"}]
    (is (= example (flow-export/validate-example! :model example))))
  (let [example {"source_page" "Generic checkout page"
                 "first_name" "Customer details"
                 "second_name" "Payment"
                 "third_name" "Summary"
                 "fourth_name" "Confirmation"}]
    (is (= example (flow-export/validate-example! :model example))))
  (doseq [example [{"scope" "Current section"
                    "checklist_state" "hidden"
                    "summary" "1 section — Checkout journey"}
                   {"scope" "Choose sections"
                    "checklist_state" "shown"
                    "summary" "2 sections — Checkout journey, Sitewide"}
                   {"scope" "Complete Documentation Set"
                    "checklist_state" "hidden"
                    "summary" "6 sections — the complete configured Documentation Set"}
                   {"export_action" "Copy rich documentation"
                    "output" "rich clipboard content"}
                   {"export_action" "Download Excel workbook"
                    "output" "an Excel workbook"}
                   {"viewport_width" "1280 pixels"
                    "workspace_layout" "the Build outline and selected configuration are shown together"}
                   {"viewport_width" "360 pixels"
                    "workspace_layout" "the Build outline and selected configuration open one at a time"}]]
    (is (= example (flow-export/validate-example! :model example))))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"invalid result"
       (flow-export/validate-example!
        :model
        {"definition" "fixed to checkout"
         "display" "Checkout"
         "detail" "exact effective value and provenance"})))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"invalid result"
       (flow-export/validate-example!
        :model
        {"headings" "off"
         "heading_result" "rendered once before each non-empty concept"}))))

(deftest flow-export-runtime-evidence-includes-documentation-concept-corrections
  (let [evidence (into {:installedBoundary true
                        :headingLifecycleStart true
                        :orderingControls true}
                       (map (fn [index]
                              [(keyword (str "export" (format "%03d" index))) true])
                            (range 1 33)))]
    (is (nil? (#'flow-export/assert-runtime! evidence)))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-16T12:59:45.54908431+02:00", :module-hash "-1508017198", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1511126195"} {:id "defn-/applicable-handler?", :kind "defn-", :line 5, :end-line 10, :hash "-1188712919"} {:id "form/2/deftest", :kind "deftest", :line 12, :end-line 18, :hash "497408386"} {:id "form/3/deftest", :kind "deftest", :line 20, :end-line 109, :hash "-1470724385"} {:id "form/4/deftest", :kind "deftest", :line 111, :end-line 118, :hash "-602234614"}]}
;; clj-mutate-manifest-end
