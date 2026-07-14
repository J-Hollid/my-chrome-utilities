(ns acceptance.steps.missing-event-payload-hardening
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-missing-event-expected-payload-hardening.feature"
   "features/data-layer-missing-event-expected-payload-hardening-runtime.feature"])

(def entry-modes
  {"Generic pageview revision 4 stores schema properties by canonical paths /page_levels, /page_levels/0, /page_type, /page_section, /login_status, and /b_id" :model
   "the built extension side panel is running with production missing-event reporting, schema validation, Jira export, and Defect Library persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified?
   "Missing-event payload hardening model verification failed. "
   "node" "test/data-layer-unified-defect-builder-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "UNIFIED_DEFECT_BUILDER_BROWSER_ADAPTER"
    :observation-key :unifiedDefectBuilder
    :runtime-error "Missing-event payload hardening browser runtime failed."
    :missing-error "Missing-event payload hardening browser evidence is missing."}))

(defn- assert-runtime! [observed]
  (let [flat (get-in observed [:unified :flat])
        payload {:page_levels ["d"]
                 :page_type "product_detail"
                 :page_section "product"
                 :login_status "logged in"
                 :b_id "123"}]
    (support/assert! (and (= payload (:payload flat))
                          (= payload (:savedPayload flat))
                          (:copiedSame flat))
                     "Production payload assembly, clipboard export, and persistence diverged."
                     flat)
    (support/assert! (and (:escapedAbsent flat)
                          (:schemaUnchanged flat)
                          (empty? (:runtimeErrors flat))
                          (= {:input "" :focused true} (:initialItem flat))
                          (every? (set (:pointers flat)) ["/page_levels" "/page_levels/0" "/page_type" "/page_section" "/login_status" "/b_id"]))
                     "Canonical paths were escaped, lost, or written back into the stored schema."
                     flat)
    (support/assert! (and (= "logged in" (:value (last (:typed flat))))
                          (every? (fn [{:keys [value same focused caret]}]
                                    (and same focused (= caret (count value))))
                                  (:typed flat)))
                     "Incremental custom typing replaced the field or lost its value, focus, or caret."
                     (:typed flat))
    (support/assert! (and (= [true true true] (get-in flat [:invalid :actions]))
                          (str/includes? (get-in flat [:invalid :issue]) "allowed")
                          (= "Valid" (:validation flat))
                          (= [false false false] (:actions flat)))
                     "Schema validation did not gate and then enable report completion actions."
                     flat)
    (support/assert! (= {:id "page-levels"
                         :name "Page level values"
                         :version 2
                         :propertyPath "/page_levels/*"}
                        (get-in flat [:provenance (keyword "/page_levels/0")]))
                     "Allowed-value rule provenance was not retained."
                     (:provenance flat))
    (support/assert! (and (= {:disabled true :assistance true} (:untyped flat))
                          (:fits flat)
                          (= [1 1 true] [(:narrativeCount flat) (:preCount flat) (:compactAbsent flat)]))
                     "Untyped arrays, constrained layout, or single-block Expected result presentation regressed."
                     flat))
  observed)

(def model-example-values
  {"schema_entry" #{"root path /page_type" "array path /page_levels" "indexed path /page_levels/0" "wildcard path /products/*/name"}
   "editor_field" #{"page_type string" "page_levels array" "page_levels.0 string" "products.0.name string"
                     "page_levels.0" "page_type" "login_status" "consent"}
   "payload_pointer" #{"/page_type" "/page_levels" "/page_levels/0" "/products/0/name"}
   "payload_shape" #{"property page_type" "property page_levels" "item 1 of page_levels" "name in item 1 of products"}
   "rule_identity" #{"Page level values v2" "Indexed page level v4" "Page type values v3" "Login values v1" "Consent values v1"}
   "rule_path" #{"/page_levels/*" "/page_levels/0" "/page_type" "/login_status" "/consent"}
   "allowed_values" #{"d and c" "d and e" "product_detail and content" "not logged in and logged in" "boolean false and true"}
   "selected_value" #{"d" "e" "product_detail" "logged in" "boolean false"}
   "stored_value" #{"d" "e" "product_detail" "logged in" "boolean false"}
   "json_type" #{"string" "boolean"}})

(def runtime-example-values
  {"rule_id" #{"page-levels" "indexed-levels" "page-type" "login-state"}
   "rule_revision" #{"1" "2" "3" "4"}
   "template_path" #{"/page_levels/*" "/page_levels/0" "/page_type" "/login_status"}
   "field_pointer" #{"/page_levels/0" "/page_type" "/login_status"}
   "allowed_values" #{"d and c" "d and e" "product_detail and content" "not logged in and logged in"}
   "selected_value" #{"d" "e" "product_detail" "logged in"}
   "stored_value" #{"d" "e" "product_detail" "logged in"}})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Missing-event payload hardening example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :missing-event-payload-hardening-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T00:57:21.111835248+02:00", :module-hash "1222543768", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "1617418705"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "-1556493410"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "-1272479189"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 20, :hash "-626384650"} {:id "defn-/runtime-observation!", :kind "defn-", :line 22, :end-line 28, :hash "-1216782882"} {:id "defn-/assert-runtime!", :kind "defn-", :line 30, :end-line 73, :hash "1500628485"} {:id "def/model-example-values", :kind "def", :line 75, :end-line 86, :hash "-77094124"} {:id "def/runtime-example-values", :kind "def", :line 88, :end-line 95, :hash "767240036"} {:id "defn-/validate-example!", :kind "defn-", :line 97, :end-line 100, :hash "-376045871"} {:id "def/handlers", :kind "def", :line 102, :end-line 105, :hash "-398579982"}]}
;; clj-mutate-manifest-end
