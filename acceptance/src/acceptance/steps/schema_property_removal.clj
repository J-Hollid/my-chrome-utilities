(ns acceptance.steps.schema-property-removal
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files ["features/data-layer-schema-property-removal.feature"])
(def entry-steps
  #{"the property tree is displayed"
    "local leaf property /debug has no attached rules"
    "local object property /commerce contains descendants /commerce/order/id and /commerce/order/value"
    "the removal confirmation is open for /commerce and its 3 attached rules"
    "removing leaf property <removed_property> leaves empty ancestor <ancestor> with origin <ancestor_origin>"
    "/page_type is the final property in the Page view working draft"
    "local property <removed_property> is selected in tree order <tree_order>"
    "/debug has been removed from the Page view working draft"})
(defonce ^:private observation (atom nil))

(defn- observation! []
  (or @observation
      (reset! observation
              (support/load-browser-observation!
               {:adapter-env "SCHEMA_PROPERTY_REMOVAL_BROWSER_ADAPTER"
                :observation-key :schemaPropertyRemoval
                :runtime-error "Schema property removal browser runtime failed."
                :missing-error "Schema property removal browser observation is missing."}))))

(defn- assert-actions! [initial]
  (let [actions (into {} (map (juxt :path :actions) (:actions initial)))]
    (support/assert! (every? #(some #{"Remove property"} (get actions %))
                            ["page_type" "commerce" "commerce.order" "commerce.order.id" "commerce.order.value" "debug" "items"])
                     "Editable rows lost their property-specific removal action." actions)
    (support/assert! (and (= ["Add rule" "Exclude inherited property"] (get actions "inherited_id"))
                          (not-any? #(str/includes? % "parent") (mapcat val actions)))
                     "Inherited property actions implied parent-schema mutation." actions)
    (support/assert! (= {:absent true :parentUnchanged true} (:excluded initial))
                     "Excluding an inherited property changed its parent schema." (:excluded initial))))

(defn- assert-immediate-and-undo! [initial]
  (support/assert! (= {:absent true :undo true :currentHasDebug true :draftHasDebug false :focus "items"}
                      (select-keys (:immediate initial) [:absent :undo :currentHasDebug :draftHasDebug :focus]))
                   "Leaf removal did not update only the working draft or move focus forward." (:immediate initial))
  (support/assert! (str/includes? (get-in initial [:immediate :feedback]) "/debug")
                   "Leaf-removal feedback did not identify /debug." (:immediate initial))
  (support/assert! (= {:type "boolean" :propertyOrigin "manual"} (get-in initial [:undone :definition]))
                   "Undo did not restore the prior /debug definition." (:undone initial))
  (support/assert! (= "debug" (:itemsFocus initial))
                   "Removing the final /items row did not move focus backward to /debug." initial)
  (support/assert! (and (= 3 (:currentVersion initial))
                        (str/includes? (:publication initial) "Remove property /debug and property-specific constraints"))
                   "Publication review omitted the persisted removal or changed revision 3." initial))

(defn- assert-confirmed-and-empty! [reload]
  (support/assert! (= {:draftAbsent true :currentHasDebug true :version 3} (:restored reload))
                   "Reload lost the working-draft/current-revision separation." (:restored reload))
  (support/assert! (and (= ["Remove property" "Cancel"] (get-in reload [:confirmation :actions]))
                        (every? #(str/includes? (get-in reload [:confirmation :summary]) %)
                                ["/commerce/order/id" "/commerce/order/value" "3 affected rule attachments" "Order identifier"]))
                   "Subtree confirmation omitted descendants, rules, or decisions." (:confirmation reload))
  (support/assert! (:cancelled reload) "Cancel changed the subtree or rule attachments." reload)
  (support/assert! (= {:commerceAbsent true
                        :required ["page_type" "items"]
                        :localRules 0
                        :reusable true
                        :currentCommerce true
                        :currentRequired ["page_type" "commerce" "debug" "items"]
                        :version 3}
                       (:confirmed reload))
                   "Confirmed removal changed current/reusable data or retained subtree constraints." (:confirmed reload))
  (support/assert! (= {:manualRemoved true :observedRetained true} (:ancestorOutcomes reload))
                   "Empty-ancestor pruning ignored property origin." (:ancestorOutcomes reload))
  (support/assert! (= {:count 0 :publishBlocked true :reason "Add at least one property" :addAvailable true :focus true :version 3}
                      (:empty reload))
                   "The empty working draft did not retain recovery or block publication." (:empty reload)))

(defn- assert-observation! [observed]
  (assert-actions! (:initial observed))
  (assert-immediate-and-undo! (:initial observed))
  (assert-confirmed-and-empty! (:reload observed)))

(defn- transition [world _example _captures {:keys [text]}]
  (let [world (if (entry-steps text) (assoc world :schema-property-removal (observation!)) world)
        observed (:schema-property-removal world)]
    (support/assert! observed "Schema property removal browser adapter was not executed." {:step text})
    (assert-observation! observed)
    world))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :applies? (fn [world] (or (entry-steps (:text spec)) (:schema-property-removal world)))
           :handler (fn [world example captures] (transition world example captures spec))})
        (support/feature-step-specs feature-files #{})))
