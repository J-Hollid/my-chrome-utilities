(ns acceptance.steps.guided-validation-picker-assertions
  (:require [acceptance.steps.guided-validation-step-assertions :as steps]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- picker [observation]
  (:schemaPicker observation))

(defn- closed-layout [_example observation]
  (let [result (picker observation)]
    (support/assert! (= [true true]
                        [(get-in result [:closed :searchAbsent])
                         (get-in result [:closed :resultsAbsent])])
                     "Closed schema picker left its inventory in the guided flow."
                     {:result result})))

(defn- opened-layout [example observation]
  (let [result (picker observation)
        schema-count (support/require-example example "schema_count")]
    (support/assert! (= [true true (str schema-count " of " schema-count " schemas") true true true true]
                        [(get-in result [:opened :modal])
                         (get-in result [:opened :searchFocused])
                         (get-in result [:opened :count])
                         (get-in result [:opened :listScrolls])
                         (get-in result [:opened :dialogBounded])
                         (get-in result [:opened :flowUnexpanded])
                         (get-in result [:opened :backgroundExcluded])])
                     "The schema picker did not open as a bounded, focused modal inventory."
                     {:example example :result result})))

(def query-key
  {"Product listing" :name
   "version 4" :version
   "payload" :target
   "page_type" :property
   "shop.example" :domain
   "/products/*" :path})

(defn- searched [example observation]
  (let [query (support/require-example example "query")
        metadata (support/require-example example "matched_metadata")
        result (get-in (picker observation) [:searches (query-key query)])
        valid (case metadata
                "schema name" (= ["Product listing version 3"] (:names result))
                "schema version" (= ["Product archive version 4"] (:names result))
                "validation target" (and (seq (:targets result)) (every? #(= "Target: payload" %) (:targets result)))
                "property path" (= #{"Product listing version 3" "Numeric page types version 1"} (set (:names result)))
                "assignment domain" (= ["Product listing version 3"] (:names result))
                "assignment path" (= ["Product listing version 3"] (:names result))
                false)]
    (support/assert! (and valid (re-matches #"\d+ of 50 schemas" (:count result)))
                     "Schema search did not filter by the requested metadata or report its count."
                     {:example example :result result})))

(defn- empty-result [_example observation]
  (let [result (picker observation)]
    (support/assert! (= ["No schemas match the current search." nil "50 of 50 schemas"]
                        [(get-in result [:empty :message])
                         (get-in result [:empty :selected])
                         (get-in result [:empty :restoredCount])])
                     "Empty schema search did not preserve the draft and recover through Clear search."
                     {:result result})))

(defn- compatibility [_example observation]
  (let [result (get-in (picker observation) [:resultPresentation])]
    (support/assert! (and (= [true true] [(:incompatibleDisabled result) (:skippedIncompatible result)])
                          (every? #(some (fn [text] (str/includes? text %)) (:product result))
                                  ["Product listing version 3" "Target: payload" "Property compatibility:" "Assignment scope:"])
                          (some #(str/includes? % "schema validates raw input, not payload") (:incompatible result)))
                     "Schema results omitted metadata, compatibility reasons, or keyboard skipping."
                     {:result result})))

(defn- selected [example observation]
  (let [selection-input (support/require-example example "selection_input")
        result (get (picker observation) (if (= selection-input "Enter") :enterSelection :buttonSelection))]
    (support/assert! (and (= "Product listing version 3" (:summary result))
                          (:changeFocused result)
                          (if (= selection-input "Enter")
                            (and (:dialogClosed result)
                                 (= "payload" (:target result))
                                 (= "String — Product listing version 3" (:expectedTypeSource result)))
                            true))
                     "Schema selection did not close to a focused compact summary with derived prefills."
                     {:example example :result result})))

(defn- dismissed [example observation]
  (let [dismissal (support/require-example example "dismissal")
        result (get (picker observation) (if (= dismissal "Escape") :escapeDismissal :closeDismissal))]
    (support/assert! (and (:dialogClosed result) (:restored result) (not= false (:unchanged result)))
                     "Schema picker dismissal changed the draft or lost keyboard position."
                     {:example example :result result})))

(def assertions
  (steps/step-assertions
   #{"the schema picker is closed"
     "the destination layout is inspected"
     "schema search and schema results are absent from the guided flow"
     "existing schema rows do not expand or displace the destination stage"}
   closed-layout
   #{"<schema_count> existing schemas are available"
     "the operator activates Add to an existing schema"
     "a focused schema-picker dialog opens above the guided flow"
     "the dialog contains schema search and the matching schema results"
     "the result list scrolls within the bounded dialog"
     "opening the dialog does not expand the guided flow to fit <schema_count> schemas"
     "background guided-flow controls do not receive keyboard focus"}
   opened-layout
   #{"the schema-picker dialog contains unequal schema names, versions, targets, properties, events, domains, and paths"
     "the operator enters <query> in schema search"
     "only schemas matching <matched_metadata> are displayed"
     "the result count identifies the visible and total schema counts"}
   searched
   #{"query missing-schema filters the inventory to zero schemas"
     "the empty result is displayed"
     "it states that no schemas match the current search"
     "Clear search restores the unfiltered schema results"
     "the guided validation draft remains unchanged"}
   empty-result
   #{"the schema-picker dialog contains compatible and incompatible results"
     "schema results are displayed"
     "each result presents schema name, version, target, property compatibility, and assignment scope summary"
     "incompatible results identify why they cannot be selected"
     "keyboard result navigation skips incompatible results"}
   compatibility
   #{"compatible schema Product listing version 3 has keyboard focus"
     "the operator completes selection with <selection_input>"
     "Product listing version 3 becomes the existing schema destination"
     "the destination stage replaces the dialog"
     "the destination stage shows a compact Product listing version 3 summary"
     "Change existing schema receives focus"
     "schema-derived prefill rules are applied to the guided validation draft"}
   selected
   #{"the schema-picker dialog is open above an unchanged guided validation draft"
     "the operator dismisses it with <dismissal>"
     "no schema destination or inferred value changes"
     "the dialog is dismissed"
     "keyboard position is restored to the picker launcher"}
   dismissed))

(defn default-assertion [text observation]
  (support/assert! (:schemaPicker observation)
                   "Guided schema picker browser boundary was not exercised."
                   {:step text}))
