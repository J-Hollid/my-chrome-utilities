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
                        :orderingControls true
                        :export021 true
                        :export022 true
                        :export023 true
                        :export024 true
                        :export025 true
                        :export026 true
                        :export027 true
                        :export028 true
                        :export029 true}
                       (map (fn [index]
                              [(keyword (str "export" (format "%03d" index))) true])
                            (range 1 21)))]
    (is (nil? (#'flow-export/assert-runtime! evidence)))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-29T12:26:37.797581159+02:00", :module-hash "-283212130", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1511126195"} {:id "defn-/applicable-handler?", :kind "defn-", :line 5, :end-line 10, :hash "-1188712919"} {:id "form/2/deftest", :kind "deftest", :line 12, :end-line 18, :hash "497408386"} {:id "form/3/deftest", :kind "deftest", :line 20, :end-line 58, :hash "1346968272"} {:id "form/4/deftest", :kind "deftest", :line 60, :end-line 71, :hash "-251589860"}]}
;; clj-mutate-manifest-end
