(ns acceptance.steps.schema-property-rule-picker
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-file "features/data-layer-schema-property-rule-picker.feature")
(defonce ^:private observation (atom nil))
(def ^:private entry-step "schema Page view working draft is open at 320 CSS px wide")

(defn- load-observation! []
  (reset! observation
          (support/load-browser-observation!
           {:adapter-env "SCHEMA_PROPERTY_RULE_PICKER_BROWSER_ADAPTER"
            :observation-key :schemaPropertyRulePicker
            :runtime-error "Schema property rule picker browser runtime failed."
            :missing-error "Schema property rule picker browser observation is missing."})))

(defn- observation! [] (or @observation (load-observation!)))

(defn- assert-example! [example observed]
  (when-let [property-type (support/example-value example "property_type")]
    (let [rule-type (support/require-example example "rule_type")
          expected (support/require-example example "availability")]
      (support/assert! (= expected (get-in observed [:availability (keyword (str property-type ":" rule-type))]))
                       "Property type compatibility changed." {:example example})))
  (when-let [metadata (support/example-value example "matched_metadata")]
    (support/assert! (= ["Approved pages version 2"] (get-in observed [:searches (keyword metadata)]))
                     "Reusable rule metadata search changed." {:example example})))

(defn- assert-picker! [example observed]
  (support/assert! (= {:label "Add rule" :pickerAbsent true :inlineResults true :expandedMenu true} (:closed observed))
                   "Closed property rows exposed inline rule results." observed)
  (support/assert! (= {:heading "Add rule for page_type · type string" :searchFocused true :bounded true :scrolls true :modal true :backgroundExcluded true} (:opened observed))
                   "The property rule picker did not open as a focused bounded modal." observed)
  (support/assert! (= ["Create a rule" "Attach from Rule Library"] (:groups observed))
                   "Built-in and reusable rule groups were not kept distinct." observed)
  (support/assert! (and (some #(str/includes? % "regular expression · no parameters · type string") (:metadata observed))
                        (some #(str/includes? % "homepage, checkout · type string · version 2") (:metadata observed)))
                   "Rule results omitted readable compatibility metadata." observed)
  (support/assert! (str/includes? (:builtInConfiguration observed) "Configure Regular expression for page_type")
                   "Built-in rule selection did not open local configuration." observed)
  (support/assert! (= {:pickerClosed true :focusReturned true :activeCount " (1 active rules)" :draftRules 1 :currentRules 0 :currentVersion 3} (:attached observed))
                   "Reusable rule attachment did not remain isolated in the working draft." observed)
  (support/assert! (= {:disabled true :label "Approved pages version 2 · already attached"} (:already observed))
                   "Duplicate reusable rule attachment remained available." observed)
  (support/assert! (= {:message "No compatible rules match this search" :clearAvailable true :restored true :unchanged true} (:empty observed))
                   "Empty search recovery changed the working draft or failed to restore results." observed)
  (support/assert! (= {:selected "Required" :configured true :escapeClosed true :layoutUnchanged true} (:keyboard observed))
                   "Keyboard selection or dismissal changed the schema editor layout." observed)
  (assert-example! example observed))

(defn- transition [world example _captures {:keys [text]}]
  (let [world (if (= text entry-step) (assoc world :schema-property-rule-picker (observation!)) world)
        observed (:schema-property-rule-picker world)]
    (support/assert! observed "Schema property rule picker browser adapter was not executed." {:step text})
    (assert-picker! example observed)
    world))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world] (or (= entry-step (:text spec)) (:schema-property-rule-picker world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs [feature-file] #{})))
