(ns acceptance.steps.schema-manual-property
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-file "features/data-layer-schema-manual-property-authoring.feature")
(defonce ^:private observation (atom nil))
(def ^:private entry-step "schema Page view has current revision 3")

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
  (let [world (if (= text entry-step) (assoc world :schema-manual-property (observation!)) world)
        observed (:schema-manual-property world)]
    (support/assert! observed "Schema manual property browser adapter was not executed." {:step text})
    (assert-observation! example observed)
    world))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world] (or (= entry-step (:text spec)) (:schema-manual-property world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs [feature-file] #{})))
