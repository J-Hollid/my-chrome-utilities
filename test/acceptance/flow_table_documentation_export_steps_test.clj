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
  (is (map? (flow-export/validate-example!
             :model
             {"package_boundary" "an unrecognized or active binary part"
              "diagnostic" "Use inert macro-free workbook content"})))
  (is (map? (flow-export/validate-example!
             :runtime
             {"worksheet" "Template Guide"
              "printer_settings_part" "xl/printerSettings/printerSettings2.bin"})))
  (doseq [invalid-metadata ["a missing valid validation state"
                            "a body digest different from its record digest"
                            "a nonpositive body byte length"
                            "an unsupported Excel contract version"]]
    (is (map? (flow-export/validate-example!
               :model
               {"invalid_metadata" invalid-metadata}))))
  (doseq [[page-instance documented-example] [["Cart" "cart"]
                                               ["Confirmation" "confirmation"]]]
    (is (map? (flow-export/validate-example!
               :model
               {"page_instance" page-instance
                "documented_example" documented-example}))))
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
         "heading_result" "rendered once before each non-empty concept"})))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"invalid result"
       (flow-export/validate-example!
        :model
        {"invalid_metadata" "a missing validation state"})))
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"invalid result"
       (flow-export/validate-example!
        :model
        {"page_instance" "Cart"
         "documented_example" "confirmation"}))))

(deftest flow-export-runtime-evidence-includes-documentation-concept-corrections
  (let [evidence (into {:installedBoundary true
                        :headingLifecycleStart true
                        :orderingControls true
                        :reorderEvidence
                        {:inventory [{:id "ecommerce"} {:id "Page"}
                                     {:id "technical"} {:id "Ungrouped"}]
                         :before ["ecommerce" "Page" "technical" "Ungrouped"]
                         :moved ["Ungrouped" "ecommerce" "Page" "technical"]
                         :moveSequences [1 1 1]
                         :undoTrace ["ecommerce|Ungrouped|Page|technical"
                                     "ecommerce|Page|Ungrouped|technical"
                                     "ecommerce|Page|technical|Ungrouped"]
                         :redoTrace ["ecommerce|Page|Ungrouped|technical"
                                     "ecommerce|Ungrouped|Page|technical"
                                     "Ungrouped|ecommerce|Page|technical"]
                         :appended ["Ungrouped" "ecommerce" "Page" "technical" "Acquisition"]}
                        :documentationTemplates true
                        :documentationTemplateStarters true
                        :documentationTemplateStarterParity true
                        :documentationTemplateStarterOverview true
                        :documentationTemplateStarterFlow true
                        :documentationTemplateStarterMatrix true
                        :documentationTemplateStarterProfile true
                        :documentationTemplateExcel true
                        :documentationTemplateSample true
                        :documentationTemplateStale true
                        :documentationTemplateValidation true
                        :documentationTemplateValidationBoundaries true
                        :documentationTemplateValidationScopedBinding true
                        :documentationTemplateValidationCrossing true
                        :documentationTemplateValidationUnsafePackage true
                        :documentationTemplateValidationSizeLimit true
                        :documentationTemplateValidationEncrypted true
                        :documentationTemplateValidationMalformed true
                        :documentationTemplateRichEditor true
                        :documentationTemplateRichRuntime true
                        :documentationTemplateRichPreviewClipboard true
                        :documentationTemplateRichSanitization true
                        :documentationTemplateRichHistory true
                        :documentationTemplateReload true
                        :documentationTemplatePortableReload true
                        :documentationTemplateMovedArea true
                        :documentationTemplateEmptyLogoArea true
                        :documentationTemplateFindingUi true
                        :documentationTemplatePresentation true
                        :documentationTemplateGuideExamples true
                        :documentationTemplateActiveContentFinding true
                        :documentationTemplatePurview true
                        :documentationTemplatePrinterSettings true
                        :documentationTemplateContractCompatibility true
                        :documentationTemplateAreaImageProperties true
                        :documentationTemplateRepeatSeparator true
                        :documentationTemplatePropertyFindings true
                        :documentationTemplateRecoveryFailure true
                        :documentationTemplateInvalidTransitions true
                        :documentationTemplateRecovery true
                        :flowTemplateEffectivePageProjection true
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
                            (range 1 21)))
        evidence (into evidence
                       (map (fn [index]
                              [(keyword (str "export" (format "%03d" index))) true])
                            (range 30 35)))]
    (is (nil? (#'flow-export/assert-runtime! evidence)))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-23T16:04:44.870047226+02:00", :module-hash "1915682873", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1511126195"} {:id "defn-/applicable-handler?", :kind "defn-", :line 5, :end-line 10, :hash "-1188712919"} {:id "form/2/deftest", :kind "deftest", :line 12, :end-line 18, :hash "497408386"} {:id "form/3/deftest", :kind "deftest", :line 20, :end-line 125, :hash "-1459277528"} {:id "form/4/deftest", :kind "deftest", :line 127, :end-line 197, :hash "871270606"}]}
;; clj-mutate-manifest-end
