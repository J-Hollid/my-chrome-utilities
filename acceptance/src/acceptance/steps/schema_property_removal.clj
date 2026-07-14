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

(def ancestor-examples
  {{:removed_property "/commerce/order/id"
    :ancestor "/commerce/order"
    :ancestor_origin "manual"
    :ancestor_outcome "removed from the working draft"} :manualRemoved
   {:removed_property "/commerce/order/id"
    :ancestor "/commerce"
    :ancestor_origin "observed"
    :ancestor_outcome "retained in the working draft"} :observedRetained})

(def focus-examples
  {{:removed_property "/debug" :tree_order "before /items" :focus_destination "/items"}
   {:path [:initial :immediate :focus] :expected "items"}
   {:removed_property "/items" :tree_order "after /debug" :focus_destination "/debug"}
   {:path [:initial :itemsFocus] :expected "debug"}
   {:removed_property "/page_type" :tree_order "only property" :focus_destination "Add property"}
   {:path [:reload :empty :focus] :expected true}})

(defn- assert-outline-example! [example observed]
  (when-let [ancestor-origin (support/example-value example "ancestor_origin")]
    (let [values {:removed_property (support/require-example example "removed_property")
                  :ancestor (support/require-example example "ancestor")
                  :ancestor_origin ancestor-origin
                  :ancestor_outcome (support/require-example example "ancestor_outcome")}
          outcome (get ancestor-examples values)]
      (support/assert! (and outcome (true? (get-in observed [:reload :ancestorOutcomes outcome])))
                       "The empty-ancestor example changed."
                       {:example values :outcome outcome})))
  (when-let [tree-order (support/example-value example "tree_order")]
    (let [values {:removed_property (support/require-example example "removed_property")
                  :tree_order tree-order
                  :focus_destination (support/require-example example "focus_destination")}
          expectation (get focus-examples values)]
      (support/assert! (and expectation (= (:expected expectation) (get-in observed (:path expectation))))
                       "The post-removal focus example changed."
                       {:example values :expectation expectation}))))

(defn- assert-observation!
  ([observed] (assert-observation! {} observed))
  ([example observed]
   (assert-actions! (:initial observed))
   (assert-immediate-and-undo! (:initial observed))
   (assert-confirmed-and-empty! (:reload observed))
   (assert-outline-example! example observed)))

(defn- transition [world example _captures {:keys [text]}]
  (support/stateful-transition
   world example text entry-steps :schema-property-removal observation!
   "Schema property removal browser adapter was not executed."
   assert-observation!))

(def handlers
  (support/stateful-semantic-handlers
   (support/feature-step-specs feature-files #{})
   entry-steps
   :schema-property-removal
   transition))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-14T12:57:15.353300319+02:00", :module-hash "-1425287839", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 3, :hash "-2138934778"} {:id "def/feature-files", :kind "def", :line 5, :end-line 5, :hash "475595923"} {:id "def/entry-steps", :kind "def", :line 6, :end-line 14, :hash "-1637132162"} {:id "form/3/defonce", :kind "defonce", :line 15, :end-line 15, :hash "-1819867165"} {:id "defn-/observation!", :kind "defn-", :line 17, :end-line 24, :hash "-1536960871"} {:id "defn-/assert-actions!", :kind "defn-", :line 26, :end-line 35, :hash "159843367"} {:id "defn-/assert-immediate-and-undo!", :kind "defn-", :line 37, :end-line 49, :hash "-444773895"} {:id "defn-/assert-confirmed-and-empty!", :kind "defn-", :line 51, :end-line 72, :hash "-99091577"} {:id "def/ancestor-examples", :kind "def", :line 74, :end-line 82, :hash "-313111910"} {:id "def/focus-examples", :kind "def", :line 84, :end-line 90, :hash "1232594176"} {:id "defn-/assert-outline-example!", :kind "defn-", :line 92, :end-line 109, :hash "860942701"} {:id "defn-/assert-observation!", :kind "defn-", :line 111, :end-line 117, :hash "2017158343"} {:id "defn-/transition", :kind "defn-", :line 119, :end-line 123, :hash "1411388438"} {:id "def/handlers", :kind "def", :line 125, :end-line 130, :hash "784379959"}]}
;; clj-mutate-manifest-end
