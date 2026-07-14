(ns acceptance.steps.recursive-property-validation
  (:require [acceptance.steps.support :as support]
            [aps.gherkin :as gherkin]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-recursive-property-tree.feature"
   "features/data-layer-event-property-validation-entry.feature"
   "features/data-layer-validation-target-path-editor.feature"])

(def entry-steps
  #{"captured event order_complete contains object oOrder"
    "captured event order_complete is open in the Live event inspector"
    "Add validation was started from event property /oOrder/aProducts/*/sku"})

(def ^:private canonical-example-rows
  (->> feature-files
       (mapcat (fn [feature-file]
                 (mapcat :examples (:scenarios (gherkin/parse-file feature-file)))))
       set))

(defn- canonical-example? [example]
  (canonical-example-rows
   (into {} (map (fn [[key value]] [(name key) value])) example)))

(defonce ^:private observation (atom nil))

(defn- load-observation! []
  (reset! observation
          (support/load-browser-observation!
           {:adapter-env "RECURSIVE_PROPERTY_VALIDATION_BROWSER_ADAPTER"
            :observation-key :recursivePropertyValidation
            :runtime-error "Recursive property-validation browser runtime failed."
            :missing-error "Recursive property-validation browser observation is missing."})))

(defn- observation! [] (or @observation (load-observation!)))

(defn- assert-observation! [observed]
  (support/assert!
   (= [320 "Array · 6 items" "String · present in 5 of 6 items"
       "Mixed types · Number 4 · String 2" true true true]
      [(:width observed)
       (get-in observed [:hierarchy :arraySummary])
       (get-in observed [:hierarchy :missingSkuSummary])
       (get-in observed [:hierarchy :priceSummary])
       (get-in observed [:hierarchy :nestedSku])
       (get-in observed [:hierarchy :specific])
       (get-in observed [:hierarchy :empty])])
   "Recursive property hierarchy changed." observed)
  (support/assert!
   (let [paths (get-in observed [:hierarchy :paths])]
     (and (every? (set paths)
                  ["/oOrder" "/oOrder/aProducts" "/oOrder/aProducts/*"
                   "/oOrder/aProducts/*/pricing/amount" "/orders/*/items/*/sku"
                   "/oOrder/aProducts/1/sku" "/oOrder/a~1b/~0name"])
          (not-any? #{"/oOrder/a/b" "/oOrder/a/b/~name"} paths)))
   "Recursive technical paths are incomplete." observed)
  (support/assert!
   (= [true true true true true]
      [(get-in observed [:layout :actionsSeparate])
       (get-in observed [:layout :noOverflow])
       (every? #(>= % 44) (get-in observed [:layout :actionWidths]))
       (= ["/oOrder" "/oOrder/aProducts" "/oOrder/aProducts/*"
           "/oOrder/aProducts/*/pricing"]
          (get-in observed [:search :open]))
       (= ["/oOrder"] (get-in observed [:search :restored]))])
   "Search or narrow layout behavior changed." observed)
  (support/assert!
   (= ["destination" "/oOrder/aProducts/*/sku" "String" true true
       ["Copy payload" "Save to Library" "Revalidate"]]
      [(get-in observed [:entry :stage]) (get-in observed [:entry :path])
       (get-in observed [:entry :detectedType])
       (get-in observed [:entry :propertyStageAbsent])
       (get-in observed [:entry :statusIsSeparate])
       (get-in observed [:entry :eventActions])])
   "Property-row guided entry changed." observed)
  (support/assert!
   (= {:orderId "✓ 1 rule passed" :sku "○ No rules"
       :price "⚠ 1 warning" :productType "! 1 error"}
      (get-in observed [:entry :statuses]))
   "Status badges stopped being independent controls." observed)
  (support/assert!
   (= ["$[\"oOrder\"][\"aProducts\"][*][\"sku\"]" 4 true true true]
      [(get-in observed [:target :initial :expression])
       (count (get-in observed [:target :initial :segments]))
       (every? (set (get-in observed [:target :initial :actions]))
               ["Add Property segment" "Add Array index segment"
                "Reset to observed path" "Apply target path" "Cancel"])
       (str/includes? (get-in observed [:target :changed])
                      "$[\"oOrder\"][\"aProducts\"][*][\"details\"][1][\"sku\"]")
       (= "$[\"oOrder\"][\"aProducts\"][*][\"sku\"]"
          (get-in observed [:target :reset :expression]))])
   "Typed target editor changed." observed)
  (support/assert!
   (= [["accepted" 6 false] ["accepted" 6 true]
       ["blocked" "Enter a non-negative array index"]
       ["blocked" "Enter a non-negative whole-number array index"]
       ["blocked" "orderId is not an array"]
       ["blocked" "Choose Every item or a specific aProducts index"]
       ["unobserved" true]]
      [[(get-in observed [:target :inspections :valid :result])
        (get-in observed [:target :inspections :valid :matchedValueCount])
        (get-in observed [:target :inspections :valid :requiresExpectedType])]
       [(get-in observed [:target :inspections :mixed :result])
        (get-in observed [:target :inspections :mixed :matchedValueCount])
        (get-in observed [:target :inspections :mixed :requiresExpectedType])]
       [(get-in observed [:target :inspections :negative :result])
        (get-in observed [:target :inspections :negative :assistance])]
       [(get-in observed [:target :inspections :decimal :result])
        (get-in observed [:target :inspections :decimal :assistance])]
       [(get-in observed [:target :inspections :nonArray :result])
        (get-in observed [:target :inspections :nonArray :assistance])]
       [(get-in observed [:target :inspections :missingScope :result])
        (get-in observed [:target :inspections :missingScope :assistance])]
       [(get-in observed [:target :inspections :unobserved :result])
        (get-in observed [:target :inspections :unobserved :requiresExpectedType])]])
   "Target validation or assistance changed." observed)
  (support/assert!
   (= [["property" "oOrder"] ["property" "aProducts"] ["index" 0] ["property" "1"]]
      (get-in observed [:target :parsed]))
   "Numeric property identity changed." observed)
  (support/assert!
   (not= (get-in observed [:target :literalStar])
         (get-in observed [:target :wildcard]))
   "Literal-star and wildcard targets collapsed to one identity." observed)
  (support/assert!
   (= ["$[\"oOrder\"][\"aProducts\"][*][\"details\"][1]"
       "$[\"oOrder\"][\"a/b\"][\"~name\"]"]
      [(get-in observed [:target :slashArray])
       (get-in observed [:target :slashEscaped])])
   "Slash-path normalization changed." observed))

(defn- transition [world example _captures {:keys [text]}]
  (support/assert! (or (empty? example) (canonical-example? example))
                   "Scenario outline values do not match a supported behavior row."
                   {:step text :example example})
  (let [world (if (entry-steps text)
                (assoc world :recursive-property-validation (observation!))
                world)
        observed (:recursive-property-validation world)]
    (support/assert! observed "Recursive property-validation adapter was not executed." {:step text})
    (assert-observation! observed)
    world))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world]
                       (or (entry-steps (:text spec))
                           (:recursive-property-validation world)))
           :handler (fn [world example captures]
                      (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T11:26:27.959663486+02:00", :module-hash "1331680655", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1599784536"} {:id "def/feature-files", :kind "def", :line 6, :end-line nil, :hash "1775874140"} {:id "def/entry-steps", :kind "def", :line 11, :end-line nil, :hash "930167089"} {:id "def/canonical-example-rows", :kind "def", :line 16, :end-line nil, :hash "-978946583"} {:id "defn-/canonical-example?", :kind "defn-", :line 22, :end-line nil, :hash "-923902321"} {:id "form/5/defonce", :kind "defonce", :line 26, :end-line nil, :hash "-1819867165"} {:id "defn-/load-observation!", :kind "defn-", :line 28, :end-line nil, :hash "-2006733646"} {:id "defn-/observation!", :kind "defn-", :line 36, :end-line nil, :hash "-775394783"} {:id "defn-/assert-observation!", :kind "defn-", :line 38, :end-line nil, :hash "586752416"} {:id "defn-/transition", :kind "defn-", :line 133, :end-line nil, :hash "1561573305"} {:id "def/handlers", :kind "def", :line 145, :end-line nil, :hash "-801819168"}]}
;; clj-mutate-manifest-end
