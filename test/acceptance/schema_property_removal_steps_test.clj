(ns acceptance.schema-property-removal-steps-test
  (:require [acceptance.steps.schema-property-removal :as schema-property-removal]
            [clojure.test :refer [deftest is]]))

(def valid-observation
  {:initial
   {:actions [{:path "page_type" :actions ["Add rule" "Remove property"]}
              {:path "commerce" :actions ["Add rule" "Remove property"]}
              {:path "commerce.order" :actions ["Add rule" "Remove property"]}
              {:path "commerce.order.id" :actions ["Add rule" "Remove property"]}
              {:path "commerce.order.value" :actions ["Add rule" "Remove property"]}
              {:path "debug" :actions ["Add rule" "Remove property"]}
              {:path "items" :actions ["Add rule" "Remove property"]}
              {:path "inherited_id" :actions ["Add rule" "Exclude inherited property"]}]
    :excluded {:absent true :parentUnchanged true}
    :immediate {:absent true
                :undo true
                :currentHasDebug true
                :draftHasDebug false
                :focus "items"
                :feedback "Removed /debug from the working draft."}
    :undone {:definition {:type "boolean" :propertyOrigin "manual"}}
    :itemsFocus "debug"
    :currentVersion 3
    :publication "Draft changes: Remove property /debug and property-specific constraints."}
   :reload
   {:restored {:draftAbsent true :currentHasDebug true :version 3}
    :confirmation {:actions ["Remove property" "Cancel"]
                   :summary "/commerce contains /commerce/order/id and /commerce/order/value with 3 affected rule attachments including Order identifier."}
    :cancelled true
    :confirmed {:commerceAbsent true
                :required ["page_type" "items"]
                :localRules 0
                :reusable true
                :currentCommerce true
                :currentRequired ["page_type" "commerce" "debug" "items"]
                :version 3}
    :ancestorOutcomes {:manualRemoved true :observedRetained true}
    :empty {:count 0
            :publishBlocked true
            :reason "Add at least one property"
            :addAvailable true
            :focus true
            :version 3}}})

(deftest accepts-a-complete-property-removal-browser-observation
  (is (nil? (#'schema-property-removal/assert-observation! valid-observation))))
