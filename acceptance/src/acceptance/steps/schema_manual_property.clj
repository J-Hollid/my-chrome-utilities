(ns acceptance.steps.schema-manual-property
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-file "features/data-layer-schema-manual-property-authoring.feature")
(defonce ^:private observation (atom nil))
(def ^:private background-steps
  #{"schema Page view has current revision 3"
    "its working draft is open in the schema editor"})
(def ^:private entry-steps
  #{"Property rules are displayed"
    "the operator activates Add property"
    "the manual-property form contains path <entered_path>"
    "the manual-property form defines commerce.order.id as string"
    "the manual-property form has property definition <property_definition>"
    "the manual-property form defines property items as array"
    "page_type already exists in the property tree"
    "the manual-property form contains an unsaved property definition"
    "manual property /commerce/order/id has been added to the Page view working draft"
    "manual property /commerce/order/id has been added without a rule"})

(defn- load-observation! []
  (reset! observation
          (support/load-browser-observation!
           {:adapter-env "SCHEMA_MANUAL_PROPERTY_BROWSER_ADAPTER"
            :observation-key :schemaManualProperty
            :runtime-error "Schema manual property browser runtime failed."
            :missing-error "Schema manual property browser observation is missing."})))

(defn- observation! [] (or @observation (load-observation!)))

(defn- assert-path-preview-example! [example interaction]
  (when-let [entered-path (support/example-value example "entered_path")]
    (let [state (get-in interaction [:pathPreviews (keyword entered-path)])
          normalized (support/require-example example "normalized_path")
          missing (support/require-example example "missing_object_path")]
      (support/assert! (= [true true]
                          [(str/includes? (:preview state) (str "Normalized path: " normalized))
                           (str/includes? (:preview state) (str "Missing object path: " missing))])
                       "Manual path normalization preview changed." {:example example :state state}))))

(defn- assert-validation-example! [example interaction]
  (when-let [definition (support/example-value example "property_definition")]
    (let [state (get-in interaction [:validation (keyword definition)])]
      (support/assert! (= {:result (support/require-example example "addition_result")
                           :assistance (support/require-example example "assistance")}
                          state)
                       "Manual property validation result changed." {:example example :state state}))))

(defn- assert-array-item-example! [example interaction]
  (when-let [item-type (support/example-value example "item_type")]
    (let [state (get-in interaction [:arrayItems (keyword item-type)])]
      (support/assert! (= [true true]
                          [(true? (:canAdd state))
                           (str/includes? (:preview state) (str "items is an array of " item-type))])
                       "Array item type preview or availability changed." {:example example :state state}))))

(defn- assert-example! [example interaction]
  (assert-path-preview-example! example interaction)
  (assert-validation-example! example interaction)
  (assert-array-item-example! example interaction))

(defn- assert-observation! [example observed]
  (let [{:keys [interaction reload]} observed]
    (support/assert! (= {:addProperty "Add property" :aboveTree true :noGlobalValidationRule true :rowRule true}
                        (:initial interaction))
                     "Property and rule authoring actions are not independent." observed)
    (support/assert! (and (= {:open true
                              :pathFocused true
                              :types ["string" "number" "boolean" "object" "array"]
                              :arrayTypeHidden true}
                             (dissoc (:opened interaction) :actions))
                          (= #{"Add property" "Cancel"}
                             (set (remove str/blank? (get-in interaction [:opened :actions])))))
                     "The focused manual-property form is incomplete." observed)
    (support/assert! (= {:closed true :unchanged true :selected true :visible true :focused true}
                        (:duplicate interaction))
                     "Duplicate-property recovery changed the draft or lost row focus." observed)
    (support/assert! (= {:closed true :unchanged true :focusReturned true}
                        (:cancelled interaction))
                     "Cancelling manual property authoring changed the draft." observed)
    (support/assert! (= {:closed true
                         :missingObjects ["object" "object"]
                         :leaf {:type "string" :propertyOrigin "manual"}
                         :selected true
                         :metadata "Manual · type string"
                         :activeCount " (0 active rules)"
                         :addRule true
                         :currentVersion 3
                         :currentUnchanged true}
                        (:added interaction))
                     "Nested manual property addition did not remain isolated in the working draft." observed)
    (support/assert! (= {:pathType "string" :attachedRules 0 :issueCount 1 :expected "string" :issuePath "/commerce/order/id"}
                        (:model interaction))
                     "Manual property authoring inferred a validation rule beyond its declared type." observed)
    (support/assert! (= {:present true :metadata "Manual · type string" :activeCount " (0 active rules)" :currentVersion 3 :currentUnchanged true}
                        reload)
                     "Manual property origin or type did not survive reload." observed)
    (assert-example! example interaction)))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (entry-steps text) (assoc world :schema-manual-property (observation!)) world)
        observed (:schema-manual-property world)]
    (support/assert! observed "Schema manual property browser adapter was not executed." {:step text})
    (assert-observation! example observed)
    world))

(def handlers
  (vec
   (concat
    (support/semantic-handlers
     (filterv #(background-steps (:text %)) (support/feature-step-specs [feature-file] #{}))
     (fn [world _example _captures _spec] world))
    (mapv
     (fn [handler]
       (if (re-matches (:pattern handler) "the operator activates Add property")
         (assoc handler :applies? #(not (contains? % :schema-container-child)))
         handler))
     (support/stateful-semantic-handlers
      (support/feature-step-specs [feature-file] background-steps)
      entry-steps
      :schema-manual-property
      transition)))))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-15T16:58:08.485165087+02:00", :module-hash "-2119441623", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-977688718"} {:id "def/feature-file", :kind "def", :line 5, :end-line 5, :hash "-2065882356"} {:id "form/2/defonce", :kind "defonce", :line 6, :end-line 6, :hash "-1819867165"} {:id "def/background-steps", :kind "def", :line 7, :end-line 9, :hash "242332076"} {:id "def/entry-steps", :kind "def", :line 10, :end-line 20, :hash "-1739970022"} {:id "defn-/load-observation!", :kind "defn-", :line 22, :end-line 28, :hash "-923451232"} {:id "defn-/observation!", :kind "defn-", :line 30, :end-line 30, :hash "-775394783"} {:id "defn-/assert-path-preview-example!", :kind "defn-", :line 32, :end-line 40, :hash "1160533904"} {:id "defn-/assert-validation-example!", :kind "defn-", :line 42, :end-line 48, :hash "-599702326"} {:id "defn-/assert-array-item-example!", :kind "defn-", :line 50, :end-line 56, :hash "1647259779"} {:id "defn-/assert-example!", :kind "defn-", :line 58, :end-line 61, :hash "-297448000"} {:id "defn-/assert-observation!", :kind "defn-", :line 63, :end-line 99, :hash "-1836551644"} {:id "defn-/transition", :kind "defn-", :line 101, :end-line 106, :hash "2112625307"} {:id "def/handlers", :kind "def", :line 108, :end-line 123, :hash "-237954673"}]}
;; clj-mutate-manifest-end
