(ns acceptance.steps.defect-report-undeclared-property-removal
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-defect-report-undeclared-property-removal.feature"
   "features/data-layer-defect-report-undeclared-property-removal-runtime.feature"])

(def entry-modes
  {"Generic pageview revision 4 allows only declared properties" :model
   "the built extension side panel is running with production Live validation, defect reporting, Jira export, and Defect Library persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Undeclared-property removal model verification failed. "
   "node" "test/data-layer-defect-report-undeclared-property-removal-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "DEFECT_REPORT_UNDECLARED_REMOVAL_BROWSER_ADAPTER"
    :observation-key :defectReportUndeclaredRemoval
    :runtime-error "Undeclared-property removal browser runtime failed."
    :missing-error "Undeclared-property removal browser evidence is missing."}))

(defn- assert-runtime! [{:keys [initial deselected reselected clipboard saved reopened recopied refreshed historicalExpected immutable layout runtimeErrors] :as observed}]
  (support/assert! (and (str/includes? (:validationText initial) "Undeclared property")
                        (str/includes? (:issueLabel initial) "declared property (Undeclared property)")
                        (= "Remove undeclared property — schema declared-property policy" (:removalLabel initial))
                        (:selected initial) (= 1 (:inputCount initial))
                        (not (str/includes? (:expected initial) "debug")))
                   "The production builder did not derive one fixed automatic removal control." initial)
  (support/assert! (and (str/includes? (:expected deselected) "debug")
                        (not (str/includes? (:expected reselected) "debug"))
                        (= 1 (:removals reselected))
                        (:focus deselected) (:focus reselected)
                        (= 41 (:scroll deselected) (:scroll reselected)))
                   "Deselection or reselection did not reconstruct the expected payload idempotently." {:deselected deselected :reselected reselected})
  (support/assert! (and (str/includes? (get-in clipboard [:rich :text]) "/debug")
                        (str/includes? (get-in clipboard [:rich :text]) "was removed")
                        (str/includes? (:plain clipboard) "/debug")
                        (str/includes? (:plain clipboard) "was removed")
                        (= {:page_type "product_detail"} (:expected saved))
                        (= [["/debug" "remove"]] (mapv (juxt :pointer :operation) (:corrections saved)))
                        (str/includes? reopened "Undeclared property")
                        (str/includes? recopied "/debug")
                        (str/includes? recopied "was removed"))
                   "Preview, clipboard, persistence, reopen, or recopy lost removal semantics." observed)
  (support/assert! (and (empty? (:issues refreshed)) (empty? (:corrections refreshed))
                        (= {:page_type "product_detail"} historicalExpected)
                        (= {:payload true :validation true} immutable)
                        (<= (:body layout) (:width layout))
                        (<= (:group layout) (:builder layout))
                        (empty? runtimeErrors))
                   "Revalidation, immutability, or the constrained browser layout regressed." observed)
  observed)

(def model-example-values
  {"pointer" #{"/debug" "/commerce/debug" "/products/0/debug" "/a~1b" "/tilde~0name"}
   "payload_shape" #{"debug object with nested trace and page_type" "commerce with currency and debug" "products item 1 with id and debug" "properties a/b and page_type" "properties tilde~name and page_type"}
   "removed_content" #{"complete debug subtree" "commerce.debug" "debug from products item 1" "property a/b" "property tilde~name"}
   "retained_content" #{"page_type" "commerce.currency" "products item 1 id"}
   "selection_state" #{"selected when builder opens" "deselected by the operator" "selected again"}
   "expected_presence" #{"absent" "present"}
   "correction_state" #{"removal applied automatically" "removal excluded from the report" "one removal restored"}})

(def runtime-example-values
  {"pointer" #{"/debug" "/commerce/debug" "/products/0/debug" "/a~1b" "/tilde~0name"}
   "payload" #{"{\"page_type\":\"product\",\"debug\":{\"trace\":true}}" "{\"commerce\":{\"currency\":\"EUR\",\"debug\":true}}" "{\"products\":[{\"id\":1,\"debug\":true},{\"id\":2}]}" "{\"a/b\":true,\"page_type\":\"product\"}" "{\"tilde~name\":true,\"page_type\":\"product\"}"}
   "expected_payload" #{"{\"page_type\":\"product\"}" "{\"commerce\":{\"currency\":\"EUR\"}}" "{\"products\":[{\"id\":1},{\"id\":2}]}"}})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Undeclared-property removal example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :defect-report-undeclared-property-removal-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T03:31:13.143259973+02:00", :module-hash "265687813", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-517505415"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "656848543"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-739875432"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 19, :hash "-550758226"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 27, :hash "692334726"} {:id "defn-/assert-runtime!", :kind "defn-", :line 29, :end-line 56, :hash "-26652261"} {:id "def/model-example-values", :kind "def", :line 58, :end-line 65, :hash "1792879159"} {:id "def/runtime-example-values", :kind "def", :line 67, :end-line 70, :hash "-823895370"} {:id "defn-/validate-example!", :kind "defn-", :line 72, :end-line 75, :hash "716281071"} {:id "def/handlers", :kind "def", :line 77, :end-line 80, :hash "54427921"}]}
;; clj-mutate-manifest-end
