(ns acceptance.steps.required-property-defect-schema-choices
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-required-property-defect-schema-choices.feature"
   "features/data-layer-required-property-defect-schema-choices-runtime.feature"])

(def entry-modes
  {"captured pageview is assigned to Generic pageview revision 7" :model
   "the built extension side panel is running with production Live validation, schema resolution, defect reporting, Jira export, and Defect Library persistence" :runtime})

(defonce model-verified? (atom false))
(defonce browser-observation (atom nil))

(defn- verify-model! []
  (support/cached-command-verification!
   model-verified? "Required-property schema-choice model verification failed. "
   "node" "test/data-layer-required-property-defect-schema-choices-test.mjs"))

(defn- runtime-observation! []
  (support/cached-browser-observation!
   browser-observation
   {:adapter-env "REQUIRED_PROPERTY_DEFECT_SCHEMA_CHOICES_BROWSER_ADAPTER"
    :observation-key :requiredPropertyDefectSchemaChoices
    :runtime-error "Required-property schema-choice browser runtime failed."
    :missing-error "Required-property schema-choice browser evidence is missing."}))

(defn- assert-runtime! [{:keys [initial deselected reselected changed clipboard saved reopened recopied typed pointers effective conflict conditional noRule rendered immutable layout runtimeErrors] :as observed}]
  (support/assert! (and (= ["Required value"] (:issues initial))
                        (= {:status "not-applicable" :reason "target-absent"} (:evaluation initial))
                        (str/includes? (:issue initial) "Required value")
                        (= [["product_detail" "Generic pageview revision 7"]
                            ["product_listing" "Generic pageview revision 7"]]
                           (->> (:choices initial)
                                (filter #(= "Generic pageview revision 7" (:source %)))
                                (mapv (juxt :value :source)))))
                   "Production validation or rendered revision-scoped controls were incorrect." initial)
  (support/assert! (and (not (str/includes? (:preview deselected) "product_detail"))
                        (str/includes? (:preview reselected) "product_detail")
                        (str/includes? (:preview changed) "product_listing")
                        (= 1 (:inputs changed))
                        (:focus deselected) (:focus reselected) (:focus changed)
                        (= 43 (:scroll deselected) (:scroll reselected) (:scroll changed)))
                   "Issue selection or response changes were not idempotent and focus-stable." observed)
  (support/assert! (and (= {:page_type "product_detail"} (:expected saved))
                        (= [["/page_type" "add"]] (mapv (juxt :pointer :operation) (:corrections saved)))
                        (= 7 (get-in saved [:corrections 0 :responseProvenance :schema :version]))
                        (not (str/includes? (get-in clipboard [:rich :text]) "value-rule provenance:"))
                        (not (str/includes? (:plain clipboard) "response source:"))
                        (str/includes? (:plain clipboard) "product_detail")
                        (str/includes? reopened "Required value")
                        (str/includes? recopied "product_detail"))
                   "Clipboard or persisted representations lost the typed add correction or exposed provenance prose." observed)
  (support/assert! (and (= [["string" "add"] ["number" "add"] ["boolean" "add"]]
                           (mapv (juxt :type :operation) typed))
                        (= [{:page_type "content"} {:market_id 2} {:logged_in false}]
                           (mapv :expected typed))
                        (= [{:commerce {:currency "EUR"}}
                            {:products [{:name "robot"}]}
                            (hash-map (keyword "a/b") "enabled")
                            (hash-map (keyword "tilde~name") "retained")]
                           (mapv :expected pointers)))
                   "Typed values or canonical JSON pointers were not preserved." observed)
  (support/assert! (and (= ["product_detail"] (:values effective))
                        (= 2 (count (get-in effective [:provenance :rules])))
                        (= {:retail ["product_detail" "product_listing"] :trade []} conditional)
                        (empty? (:values conflict))
                        (str/includes? (:conflict conflict) "Products and Listings")
                        (empty? (:values noRule))
                        (= ["product_detail"] (get-in rendered [:effective :schema]))
                        (= ["product_detail" "product_listing"] (get-in rendered [:retail :schema]))
                        (empty? (get-in rendered [:trade :schema]))
                        (empty? (get-in rendered [:conflict :schema]))
                        (str/includes? (get-in rendered [:conflict :conflict]) "Products and Listings")
                        (get-in rendered [:conflict :custom])
                        (empty? (get-in rendered [:noRule :schema]))
                        (get-in rendered [:noRule :generic])
                        (get-in rendered [:noRule :custom])
                        immutable
                        (<= (:body layout) (:width layout))
                        (<= (:group layout) (:builder layout))
                        (empty? runtimeErrors))
                   "Effective constraints, immutability, or constrained layout regressed." observed)
  observed)

(def model-example-values
  {"schema_constraint" #{"allowed strings product and content" "allowed numbers 1 and 2" "allowed booleans true and false" "exact string product_detail"}
   "schema_values" #{"product and content" "1 and 2" "true and false" "product_detail"}
   "json_type" #{"string" "number" "boolean"}
   "concrete_pointer" #{"/commerce/currency" "/products/0/name" "/a~1b" "/tilde~0name"}
   "template_pointer" #{"/commerce/currency" "/products/*/name" "/a~1b" "/tilde~0name" "/commerce/country"}
   "matching_result" #{"matches" "does not match"}
   "choice_result" #{"its values are offered" "its values are offered for products item 1" "its values are offered for property a/b" "its values are offered for property tilde~name" "its values are not offered"}
   "market" #{"retail" "trade"}
   "availability" #{"offered" "excluded"}})

(def runtime-example-values
  {"pointer" #{"/page_type" "/market_id" "/logged_in" "/commerce/currency" "/products/0/name" "/a~1b" "/tilde~0name"}
   "configured_values" #{"product and content" "1 and 2" "true and false"}
   "selected_value" #{"content" "2" "false"}
   "stored_value" #{"content" "2" "false"}
   "json_type" #{"string" "number" "boolean"}
   "rule_pointer" #{"/commerce/currency" "/products/*/name" "/a~1b" "/tilde~0name"}
   "expected_value" #{"EUR" "robot" "enabled" "retained"}})

(defn- validate-example! [mode example]
  (support/validate-mode-example-domain!
   mode runtime-example-values model-example-values example
   "Required-property schema-choice example value was outside the specified contract."))

(def handlers
  (support/verified-feature-mode-handlers
   feature-files entry-modes :required-property-defect-schema-choices-mode
   verify-model! validate-example! runtime-observation! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T04:00:42.279744764+02:00", :module-hash "-504671305", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "913455753"} {:id "def/feature-files", :kind "def", :line 5, :end-line 7, :hash "1745956364"} {:id "def/entry-modes", :kind "def", :line 9, :end-line 11, :hash "461692332"} {:id "form/3/defonce", :kind "defonce", :line 13, :end-line 13, :hash "344781070"} {:id "form/4/defonce", :kind "defonce", :line 14, :end-line 14, :hash "-1618529344"} {:id "defn-/verify-model!", :kind "defn-", :line 16, :end-line 19, :hash "1351604940"} {:id "defn-/runtime-observation!", :kind "defn-", :line 21, :end-line 27, :hash "414377822"} {:id "defn-/assert-runtime!", :kind "defn-", :line 29, :end-line 84, :hash "270288215"} {:id "def/model-example-values", :kind "def", :line 86, :end-line 95, :hash "506791056"} {:id "def/runtime-example-values", :kind "def", :line 97, :end-line 104, :hash "290371615"} {:id "defn-/validate-example!", :kind "defn-", :line 106, :end-line 109, :hash "269278485"} {:id "def/handlers", :kind "def", :line 111, :end-line 114, :hash "1429757079"}]}
;; clj-mutate-manifest-end
