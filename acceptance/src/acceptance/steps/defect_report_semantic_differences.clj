(ns acceptance.steps.defect-report-semantic-differences
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-defect-report-semantic-differences.feature"
   "features/data-layer-defect-report-semantic-differences-runtime.feature"])

(def entry-modes
  {"captured error event contains undeclared /action and /code properties" :model
   "the built extension side panel is running with production validation, defect reporting, Jira export, and Defect Library persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Defect-report semantic-difference model verification failed. "
   "node" "test/data-layer-defect-report-semantic-differences-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "DEFECT_REPORT_SEMANTIC_DIFFERENCES_BROWSER_ADAPTER"
    :observation-key :defectReportSemanticDifferences
    :runtime-error "Defect-report semantic-difference browser runtime failed."
    :missing-error "Defect-report semantic-difference browser evidence is missing."}))

(def actual-descriptions
  ["undeclared property is present in the actual payload"
   "required property is missing from the actual payload"
   "actual value is not allowed"
   "actual value has the wrong type"
   "actual value does not equal the required value"
   "validation failed: Value violates partner contract"
   "validation failed"])

(def expected-descriptions
  ["was added to the expected payload"
   "was replaced in the expected payload"
   "was removed from the expected payload"
   nil])

(defn- assert-runtime! [{:keys [initial deselected reselected semantic mappings pointerCases duplicate legacy immutable layout runtimeErrors] :as observed}]
  (let [actual-lines (filter #(= "actual" (:group %)) (:lines initial))
        expected-lines (filter #(= "expected" (:group %)) (:lines initial))]
    (support/assert! (and (= 4 (count actual-lines) (count expected-lines))
                          (= #{["/action" "Undeclared property"]
                               ["/code" "Undeclared property"]
                               ["/error_action" "Required value"]
                               ["/error_code" "Required value"]}
                             (set (:issues initial)))
                          (= ["add" "add" "remove" "remove"]
                             (sort (map :operation expected-lines)))
                          (not-any? #(or (str/includes? (:text %) "invalid actual value")
                                         (str/includes? (:text %) "corrected expected value"))
                                    (:lines initial)))
                     "The production difference model lost semantic identity or operation data." initial))
  (support/assert! (and (not-any? #(= "error_action" (:issueId %)) (:lines deselected))
                        (= 2 (count (filter #(= "error_action" (:issueId %)) (:lines reselected))))
                        (:focus deselected) (:focus reselected)
                        (= 47 (:scroll deselected) (:scroll reselected)))
                   "Difference refresh did not follow selection while retaining focus and scroll."
                   {:deselected deselected :reselected reselected})
  (support/assert! (and (= actual-descriptions (:actual mappings))
                        (= expected-descriptions (:expected mappings))
                        (apply = (vals semantic))
                        (every? (fn [{:keys [pointer text html]}]
                                  (and (str/includes? text pointer) (str/includes? html pointer)))
                                pointerCases)
                        (str/includes? duplicate "same-a")
                        (str/includes? duplicate "same-b"))
                   "Rich, plain, persisted, mapped, or canonical-pointer semantics diverged." observed)
  (support/assert! (and (str/includes? (:line legacy) "validation failed")
                        (not-any? #(str/includes? (:line legacy) %)
                                  ["undeclared" "missing" "not allowed" "wrong type" "does not equal"])
                        (:unchanged legacy)
                        immutable
                        (<= (:body layout) (:width layout))
                        (:lines layout)
                        (empty? runtimeErrors))
                   "Legacy neutrality, immutability, or constrained layout regressed." observed)
  observed)

(def shared-example-values
  {"pointer" #{"/action" "/error_action" "/page_type" "/transaction_id" "/reference"
                "/commerce/currency" "/products/0/name" "/a~1b" "/tilde~0name" "/coupon"}
   "violation" #{"Undeclared property" "Required value" "Value is not allowed" "Type mismatch" "Value is not exact"}
   "operation" #{"add" "replace" "remove" "none"}})

(def model-example-values
  (assoc shared-example-values
         "description" (set (concat (take 5 actual-descriptions) (take 3 expected-descriptions) ["no Expected difference line is displayed"]))))

(def runtime-example-values
  (assoc shared-example-values
         "description" (set (concat (take 5 actual-descriptions) (take 3 expected-descriptions) ["no Expected difference line is rendered"]))))

(def actual-relations
  #{["/action" "Undeclared property" "undeclared property is present in the actual payload"]
    ["/error_action" "Required value" "required property is missing from the actual payload"]
    ["/page_type" "Value is not allowed" "actual value is not allowed"]
    ["/transaction_id" "Type mismatch" "actual value has the wrong type"]
    ["/reference" "Value is not exact" "actual value does not equal the required value"]})

(def expected-model-relations
  #{["/action" "remove" "was removed from the expected payload"]
    ["/error_action" "add" "was added to the expected payload"]
    ["/page_type" "replace" "was replaced in the expected payload"]
    ["/coupon" "none" "no Expected difference line is displayed"]})

(def expected-runtime-relations
  #{["/action" "remove" "was removed from the expected payload"]
    ["/error_action" "add" "was added to the expected payload"]
    ["/page_type" "replace" "was replaced in the expected payload"]
    ["/coupon" "none" "no Expected difference line is rendered"]})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Semantic-difference example value was outside the specified contract.")
  (support/validate-example-relations!
   [{:keys ["pointer" "violation" "description"] :rows actual-relations}
    {:keys ["pointer" "operation" "description"]
     :rows (if (= mode :runtime) expected-runtime-relations expected-model-relations)}]
   example
   "Semantic-difference example row was outside the specified relationship."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :defect-report-semantic-differences-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T17:15:33.867788499+02:00", :module-hash "-1018866924", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-1186672438"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "575296350"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-36976987"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 19, :hash "841979124"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 27, :hash "-510276829"} {:id "def/actual-descriptions", :kind "def", :line 29, :end-line 36, :hash "1778764651"} {:id "def/expected-descriptions", :kind "def", :line 38, :end-line 42, :hash "791080257"} {:id "defn-/assert-runtime!", :kind "defn-", :line 44, :end-line 83, :hash "1981590324"} {:id "def/shared-example-values", :kind "def", :line 85, :end-line 89, :hash "-1171569704"} {:id "def/model-example-values", :kind "def", :line 91, :end-line 93, :hash "-401963778"} {:id "def/runtime-example-values", :kind "def", :line 95, :end-line 97, :hash "1386472355"} {:id "def/actual-relations", :kind "def", :line 99, :end-line 104, :hash "1246596353"} {:id "def/expected-model-relations", :kind "def", :line 106, :end-line 110, :hash "-583477128"} {:id "def/expected-runtime-relations", :kind "def", :line 112, :end-line 116, :hash "-589756554"} {:id "defn-/validate-example!", :kind "defn-", :line 118, :end-line 127, :hash "-671739017"} {:id "def/handlers", :kind "def", :line 129, :end-line 132, :hash "-2067247089"}]}
;; clj-mutate-manifest-end
