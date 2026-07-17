(ns acceptance.steps.schema-publication-refresh
  (:require [acceptance.steps.schema-publication-refresh-support :as verification]
            [acceptance.steps.support :as support]))

(def feature-files
  ["features/data-layer-schema-publication-live-revalidation.feature"
   "features/data-layer-schema-publication-live-revalidation-runtime.feature"])

(def entry-modes
  {"a current Live testing session contains captured events" :model
   "the built extension side panel is running with production Live capture, Schema Library, validation, query, and Defect Library modules" :runtime})

(def example-values
  {"previous_result" #{"Valid" "1 error"}
   "revision_change" #{"add a failing Required rule" "relax the failing Allowed values rule" "add a failing warning-severity rule"}
   "published_result" #{"1 error" "Valid" "1 warning"}
   "schema_selection" #{"follow-latest assignment" "assignment pinned to revision 3" "manual Product listing override" "manual Checkout override"}
   "resolved_schema" #{"Product listing revision 4" "Product listing revision 3" "Checkout current revision"}
   "rule_evidence" #{"revision 4 rules" "retained revision 3 rules" "Checkout rules"}
   "resolved_revision" #{"Product listing revision 4" "Product listing revision 3" "Checkout current revision"}})

(defn- validate-example! [_mode example]
  (support/validate-example-domain!
   example-values example (filter #(support/example-value example %) (keys example-values))
   "Schema publication refresh example value was outside the specified contract."))

(defn- transition [world example _captures {:keys [text]}]
  (support/mode-transition
   world example text entry-modes :schema-publication-refresh-mode
   verification/verify-model! validate-example!
   #(verification/assert-runtime! (verification/runtime-observation!))))

(def handlers
  (support/feature-mode-handlers
   feature-files entry-modes :schema-publication-refresh-mode transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T19:47:04.921348073+02:00", :module-hash "-718809689", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "201491779"} {:id "def/feature-files", :kind "def", :line 5, :end-line 9, :hash "494106124"} {:id "def/entry-modes", :kind "def", :line 11, :end-line 15, :hash "1039492248"} {:id "form/3/defonce", :kind "defonce", :line 17, :end-line 17, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 18, :end-line 18, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 20, :end-line 24, :hash "256853804"} {:id "defn-/runtime-observation!", :kind "defn-", :line 26, :end-line 32, :hash "665333843"} {:id "defn-/assert-runtime!", :kind "defn-", :line 34, :end-line 77, :hash "-2049151256"} {:id "def/example-values", :kind "def", :line 79, :end-line 92, :hash "181850860"} {:id "defn-/validate-example!", :kind "defn-", :line 94, :end-line 97, :hash "1547868865"} {:id "defn-/transition", :kind "defn-", :line 99, :end-line 102, :hash "1975226849"} {:id "def/handlers", :kind "def", :line 104, :end-line 106, :hash "2072097348"}]}
;; clj-mutate-manifest-end
