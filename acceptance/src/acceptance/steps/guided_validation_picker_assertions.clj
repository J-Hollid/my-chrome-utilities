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

(def search-result-validations
  {"schema name" #(= ["Product listing version 3"] (:names %))
   "schema version" #(= ["Product archive version 4"] (:names %))
   "validation target" #(= [true true] [(boolean (seq (:targets %)))
                                          (every? (fn [target] (= "Target: payload" target)) (:targets %))])
   "property path" #(= #{"Product listing version 3" "Numeric page types version 1"} (set (:names %)))
   "assignment domain" #(= ["Product listing version 3"] (:names %))
   "assignment path" #(= ["Product listing version 3"] (:names %))})

(defn- searched [example observation]
  (let [query (support/require-example example "query")
        metadata (support/require-example example "matched_metadata")
        result (get-in (picker observation) [:searches (query-key query)])
        validator (get search-result-validations metadata (constantly false))]
    (support/assert! (= [true true]
                        [(boolean (validator result))
                         (boolean (re-matches #"\d+ of 50 schemas" (:count result)))])
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
    (support/assert! (= [true true true true]
                        [(:incompatibleDisabled result)
                         (:skippedIncompatible result)
                         (every? #(some (fn [text] (str/includes? text %)) (:product result))
                                 ["Product listing version 3" "Target: payload" "Property compatibility:" "Assignment scope:"])
                         (boolean (some #(str/includes? % "schema validates raw input, not payload") (:incompatible result)))])
                     "Schema results omitted metadata, compatibility reasons, or keyboard skipping."
                     {:result result})))

(def selection-result-keys
  {"Enter" :enterSelection
   "Select button" :buttonSelection})

(def selection-result-validations
  {"Enter" #(= ["Product listing version 3" true true "payload" "String — Product listing version 3"]
                [(:summary %) (:changeFocused %) (:dialogClosed %) (:target %) (:expectedTypeSource %)])
   "Select button" #(= ["Product listing version 3" true] [(:summary %) (:changeFocused %)])})

(defn- selected [example observation]
  (let [selection-input (support/require-example example "selection_input")
        result (get (picker observation) (get selection-result-keys selection-input))
        validator (get selection-result-validations selection-input (constantly false))]
    (support/assert! (validator result)
                     "Schema selection did not close to a focused compact summary with derived prefills."
                     {:example example :result result})))

(def dismissal-result-keys
  {"Escape" :escapeDismissal
   "Close button" :closeDismissal})

(defn- dismissed [example observation]
  (let [dismissal (support/require-example example "dismissal")
        result (get (picker observation) (get dismissal-result-keys dismissal))]
    (support/assert! (= [true true true]
                        [(:dialogClosed result) (:restored result) (not= false (:unchanged result))])
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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-13T00:25:03.246114686+02:00", :module-hash "-581138435", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-886051003"} {:id "defn-/picker", :kind "defn-", :line 6, :end-line nil, :hash "-1750113437"} {:id "defn-/closed-layout", :kind "defn-", :line 9, :end-line nil, :hash "1966481501"} {:id "defn-/opened-layout", :kind "defn-", :line 17, :end-line nil, :hash "458920340"} {:id "def/query-key", :kind "def", :line 31, :end-line nil, :hash "-2125283390"} {:id "def/search-result-validations", :kind "def", :line 39, :end-line nil, :hash "2128208011"} {:id "defn-/searched", :kind "defn-", :line 48, :end-line nil, :hash "-840189061"} {:id "defn-/empty-result", :kind "defn-", :line 59, :end-line nil, :hash "-1962546836"} {:id "defn-/compatibility", :kind "defn-", :line 68, :end-line nil, :hash "-2119326476"} {:id "def/selection-result-keys", :kind "def", :line 79, :end-line nil, :hash "436818306"} {:id "def/selection-result-validations", :kind "def", :line 83, :end-line nil, :hash "-1794472782"} {:id "defn-/selected", :kind "defn-", :line 88, :end-line nil, :hash "461923007"} {:id "def/dismissal-result-keys", :kind "def", :line 96, :end-line nil, :hash "2098025121"} {:id "defn-/dismissed", :kind "defn-", :line 100, :end-line nil, :hash "1905144929"} {:id "def/assertions", :kind "def", :line 108, :end-line nil, :hash "-1076681136"} {:id "defn/default-assertion", :kind "defn", :line 155, :end-line nil, :hash "-837631842"}]}
;; clj-mutate-manifest-end
