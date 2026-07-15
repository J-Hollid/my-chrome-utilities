(ns acceptance.steps.live-schema-property-declaration
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-live-schema-property-declaration.feature" "features/data-layer-live-schema-property-declaration-runtime.feature"])
(def entry-modes {"captured product_view is selected in the Live event inspector" :model
                  "the built extension side panel is running with production Live inspection, Schema Library drafts, persistence, and validation" :runtime})
(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))
(defn- verify-model! [] (support/cached-command-verification! model-verified? "Live property declaration model failed. " "npm" "run" "pretest:unit:schema-verification"))
(defn- observe! [] (support/cached-browser-observation! browser-observation {:adapter-env "LIVE_SCHEMA_PROPERTY_DECLARATION_BROWSER_ADAPTER" :observation-key :liveSchemaPropertyDeclaration :runtime-error "Live property declaration browser failed." :missing-error "Live property declaration evidence is missing."}))
(defn- assert-runtime! [{:keys [actions reviewCases saved validation separate published reloaded] :as observed}]
  (support/assert! (and (:addToSchema actions) (:addValidation actions) (:reachable actions) (str/includes? (:destination actions) "Product detail")) "Live property actions were not distinct and reachable." observed)
  (support/assert! (and (str/includes? (get-in reviewCases [:productName :text]) "/products/*/product_name")
                        (str/includes? (get-in reviewCases [:productName :text]) "String")
                        (str/includes? (get-in reviewCases [:productId :text]) "/products/*/product_id")
                        (str/includes? (get-in reviewCases [:productId :text]) "Number")
                        (every? #(and (:noValidationControls %) (:storageUnchanged %) (:guidedHidden %)) (vals reviewCases)))
                   "Declaration review crossed into validation configuration, persisted early, or skipped a detected type." reviewCases)
  (support/assert! (and (= {:type "string"} (:productName saved))
                        (= {:type "number"} (:productId saved))
                        (= 1 (count (:assignments saved)))
                        (= 1 (count (:rules saved)))
                        (= 3 (:version saved))
                        (:siblingPreserved saved)
                        (:collectionsPreserved saved)
                        (= "/products/0/product_name" (get-in saved [:nameFocus :path]))
                        (= "/products/0/product_id" (get-in saved [:idFocus :path]))
                        (every? empty? [(get-in validation [:present :issues])
                                       (get-in validation [:present :evaluations])
                                       (get-in validation [:absent :issues])
                                       (get-in validation [:absent :evaluations])])
                        (:guidedVisible separate)
                        (zero? (:declarationDialogs separate))
                        (= 4 (:version published))
                        (:workingDraftAbsent published)
                        (= "string" (:type reloaded))
                        (= 1 (:treeRows reloaded))
                        (str/includes? (:activeRules reloaded) "0 active rules"))
                   "Declaration persistence, validation, focus, publication, reload, or the validation boundary was incorrect." observed)
  observed)
(def model-values {"concrete_path" #{"/page_type" "/commerce/currency" "/products/0/product_name" "/products/0/product_id"}
                   "canonical_path" #{"/page_type" "/commerce/currency" "/products/*/product_name" "/products/*/product_id"}
                   "detected_type" #{"String" "Number"}})
(def runtime-values {"concrete_path" #{"/products/0/product_name" "/products/0/product_id"}
                     "canonical_path" #{"/products/*/product_name" "/products/*/product_id"}
                     "detected_type" #{"String" "Number"}})
(defn- validate-example! [mode example] (support/validate-mode-example-domain! mode runtime-values model-values example "Live property declaration example is outside the contract."))
(def handlers (support/verified-feature-mode-handlers feature-files entry-modes :live-schema-property-declaration-mode verify-model! validate-example! observe! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T20:50:28.485977777+02:00", :module-hash "95145973", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-788643357"} {:id "def/feature-files", :kind "def", :line 5, :end-line 5, :hash "1378371186"} {:id "def/entry-modes", :kind "def", :line 6, :end-line 7, :hash "753401351"} {:id "form/3/defonce", :kind "defonce", :line 8, :end-line 8, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 9, :end-line 9, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 10, :end-line 10, :hash "1479345359"} {:id "defn-/observe!", :kind "defn-", :line 11, :end-line 11, :hash "1952677063"} {:id "defn-/assert-runtime!", :kind "defn-", :line 12, :end-line 41, :hash "1417133984"} {:id "def/model-values", :kind "def", :line 42, :end-line 44, :hash "251902642"} {:id "def/runtime-values", :kind "def", :line 45, :end-line 47, :hash "-775960587"} {:id "defn-/validate-example!", :kind "defn-", :line 48, :end-line 48, :hash "-181206014"} {:id "def/handlers", :kind "def", :line 49, :end-line 49, :hash "451545870"}]}
;; clj-mutate-manifest-end
