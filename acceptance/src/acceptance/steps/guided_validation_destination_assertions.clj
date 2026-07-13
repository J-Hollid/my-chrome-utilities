(ns acceptance.steps.guided-validation-destination-assertions
  (:require [acceptance.steps.guided-validation-step-assertions :as steps]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- example-value [example key]
  (support/require-example example key))

(defn- find-first [predicate values]
  (first (filter predicate values)))

(defn- destination-choice [_example observation]
  (support/assert! (= {:heading "Choose schema destination"
                       :choices ["Create a new schema" "Add to an existing schema"]
                       :selected nil
                       :persistedUnchanged true}
                      (:destinationInitial observation))
                   "Schema destination stage selected or persisted without operator input."
                   {:observation observation}))

(defn- new-schema-name [example observation]
  (let [name (example-value example "schema_name")
        continuation (example-value example "continuation_result")
        assistance (example-value example "assistance")
        observed (get {"Signal Shop pageview" :newNameAssistance
                       "blank" :blankNameAssistance
                       "Existing pageview" :duplicateNameAssistance}
                      name)]
    (support/assert! (= assistance (get observation observed))
                     "New schema name assistance did not match the entered name."
                     {:example example :observation observation})
    (support/assert! (contains? #{"allowed" "blocked"} continuation)
                     "Schema-name continuation must use the supported result vocabulary."
                     {:example example})
    (support/assert! (= (= name "Signal Shop pageview") (= continuation "allowed"))
                     "New schema name continuation result was incorrect."
                     {:example example})))

(defn- existing-option [example observation]
  (let [name (example-value example "schema_name")
        expected-target (example-value example "schema_target")
        expected-property-state (example-value example "property_state")
        expected-availability (example-value example "availability")
        expected-explanation (example-value example "explanation")
        unavailable? (= expected-availability "unavailable")
        option (find-first #(= [unavailable? expected-explanation]
                               [(:disabled %) (:explanation %)])
                           (:existingOptions observation))
        production-option (find-first #(= name (:name %)) (get-in observation [:production :destinationOptions]))]
    (support/assert! option "Specified compatibility state was not displayed." {:example example})
    (support/assert! (contains? #{"selectable" "unavailable"} expected-availability)
                     "Schema availability must use the supported result vocabulary."
                     {:example example})
    (support/assert! (= [expected-target expected-property-state (= expected-availability "selectable") expected-explanation]
                        [(:target production-option) (:propertyState production-option) (:available production-option) (:explanation production-option)])
                     "Production schema destination option did not match its specification row."
                     {:example example :production-option production-option})
    (support/assert! (= [unavailable? expected-explanation]
                        [(:disabled option) (:explanation option)])
                     "Existing schema compatibility did not match its target and property type."
                     {:example example :option option})))

(defn- isolated-working-draft-review? [review]
  (= [true true false]
     [(str/includes? review "working draft based on version 3")
      (str/includes? review "version 3 remains current until the working draft is published")
      (str/includes? review "version 4")]))

(defn- revision-review [example observation]
  (let [state (example-value example "assignment_state")
        expected-action (example-value example "assignment_action")
        key (if (= state "matching exists") :matching :absent)
        result (get-in observation [:production :destinations key])]
    (support/assert! (contains? #{"matching exists" "matching absent"} state)
                     "Assignment state must use the supported matching vocabulary."
                     {:example example})
    (support/assert! (str/includes? (:review result) "Rule attachment path: page_type")
                     "Existing schema review omitted the rule attachment path." {:result result})
    (support/assert! (isolated-working-draft-review? (:review result))
                     "Existing schema review omitted working-draft isolation." {:result result})
    (support/assert! (= expected-action (:assignmentAction result))
                     "Existing schema review used the wrong assignment action."
                     {:example example :result result})))

(defn- successful-save [example observation]
  (let [destination (example-value example "schema_destination")
        saved-result (example-value example "saved_result")
        result (if (str/starts-with? destination "new ") (:saved observation) (:existingSaved observation))]
    (support/assert! (contains? #{"new Signal Shop pageview" "existing Product listing v3"} destination)
                     "Schema destination must identify a supported reviewed destination."
                     {:example example})
    (support/assert! (= [true true true]
                        [(:flowClosed result) (:inspectorRestored result) (:focusReturned result)])
                     "Successful schema-destination save did not close, restore, and return focus."
                     {:example example :result result})
    (support/assert! (str/includes? (str/lower-case (:status result)) (str/lower-case saved-result))
                     "Successful schema-destination save did not show its confirmation."
                     {:example example :result result})))

(defn- failed-save [_example observation]
  (support/assert! (= [true true "Saving failed. Check storage access and try again."]
                      [(get-in observation [:saveFailure :flowVisible])
                       (get-in observation [:saveFailure :unchanged])
                       (get-in observation [:saveFailure :error])])
                   "Failed persistence did not preserve the review and storage state."
                   {:observation observation}))

(defn- schema-prefill [_example observation]
  (support/assert! (= [{:expectedType "String"
                        :expectedTypeSource "String — Generic pageview version 4"
                        :target "payload"}
                       {:domain "shop.example"
                        :domainSource "Generic shop pages assignment"
                        :eventName "pageview"
                        :eventNameSource "Generic shop pages assignment"
                        :source "event-history"
                        :sourceSource "Generic shop pages assignment"
                        :pathCondition "/products/*"}]
                      [(:schemaPrefillRequirement observation) (:schemaPrefillScope observation)])
                   "Schema and compatible-assignment values were not prefilled with readable provenance."
                   {:observation observation}))

(def assignment-scope-expectations
  {"use captured event values as editable defaults" ["127.0.0.1" false]
   "prefill its domain and path conditions" ["shop.example" true]
   "do not prefill scope before the operator chooses" ["127.0.0.1" false]})

(defn- assignment-resolution [example observation]
  (let [count (parse-long (example-value example "compatible_assignment_count"))
        expected-selection (example-value example "assignment_selection")
        expected-scope (get assignment-scope-expectations (example-value example "scope_behavior"))
        result (find-first #(= count (:count %)) (get-in observation [:production :assignmentResolutions]))
        observed-scope [(:domain result) (boolean (seq (:pathConditions result)))]]
    (support/assert! (= [expected-selection expected-scope] [(:selection result) observed-scope])
                     "Compatible-assignment cardinality produced the wrong selection or scope behavior."
                     {:example example :result result})))

(defn- replacement-review [_example observation]
  (support/assert! (= [["Keep current values" "Accept schema-derived values"]
                       "Current values kept."
                       "Schema-derived values accepted."
                       true]
                      [(get-in observation [:replacementReview :actions])
                       (:keptStatus observation)
                       (:acceptedStatus observation)
                       (every? #(str/includes? % "would be replaced by")
                               (get-in observation [:replacementReview :items]))])
                   "Edited schema-derived values were overwritten without an explicit replacement review."
                   {:observation observation}))

(def assertions
  (steps/step-assertions
   #{"property selection continues"
     "the schema destination stage is displayed before requirement and scope"
     "the schema destination stage is displayed"
     "the operator can choose Create a new schema or Add to an existing schema"
     "no schema destination is selected without operator input"
     "persistence remains unchanged before a destination is reviewed"}
   destination-choice
   #{"Create a new schema is chosen"
     "schema name <schema_name> is entered"
     "continuation result is <continuation_result>"
     "schema-name assistance states <assistance>"}
   new-schema-name
   #{"Add to an existing schema is chosen"
     "schema <schema_name> has target <schema_target> and page_type state <property_state>"
     "available schemas are displayed for payload property page_type with expected type String"
     "available schemas are displayed in the schema-picker dialog for payload property page_type with expected type String"
     "schema <schema_name> has availability <availability>"
     "its compatibility explanation is <explanation>"}
   existing-option
   #{"the destination targets existing Product listing version 3"
     "the draft defines an allowed-values rule for page_type"
     "existing schema Product listing version 3 is selected"
     "matching assignment state is <assignment_state>"
     "the validation review is displayed"
     "it identifies page_type as the rule attachment path"
     "it states that the rule will be added to the Product listing working draft based on version 3"
     "Product listing version 3 remains current until the working draft is published"
     "no Product listing version 4 exists before publication"
     "assignment action is <assignment_action>"}
   revision-review
   #{"the review has destination <schema_destination>"
     "the operator activates Add validation to draft and persistence completes"
     "the review and guided validation flow close"
     "the originating Live event inspector is restored"
     "a visible status confirms <saved_result>"
     "keyboard focus returns to Create validation from this event"}
   successful-save
   #{"a saveable draft is at its final stage"
     "persistence returns an error"
     "the review remains open with the entered draft intact"
     "a specific error explains how to recover"
     "no partial schema, rule, assignment, or revision is persisted"}
   failed-save
   #{"the destination choice has accepted Generic pageview version 4"
     "it has one enabled assignment compatible with the captured event"
     "the requirement stage is displayed"
     "page_type expected type is prefilled from Generic pageview version 4"
     "validation target is prefilled from the schema"
     "event source, event name, domain, and path conditions are prefilled from the compatible assignment"
     "every prefilled value identifies Generic pageview version 4 or its assignment as its source"
     "the operator can change each prefilled value before review"}
   schema-prefill
   #{"the selected destination has <compatible_assignment_count> compatible assignments"
     "assignment resolution runs"
     "assignment selection is <assignment_selection>"
     "scope behavior is <scope_behavior>"}
   assignment-resolution
   #{"the operator has changed a schema-derived scope value"
     "a different schema destination or assignment is selected"
     "the changed value is not silently overwritten"
     "a review identifies each value that would be replaced"
     "the operator can keep current values or accept the new schema-derived values"}
   replacement-review))

(defn default-assertion [text observation]
  (support/assert! (:destinationInitial observation)
                   "Guided schema destination browser boundary was not exercised."
                   {:step text}))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-13T23:04:07.149566977+02:00", :module-hash "-866699086", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1678299692"} {:id "defn-/example-value", :kind "defn-", :line 6, :end-line nil, :hash "-1416813660"} {:id "defn-/find-first", :kind "defn-", :line 9, :end-line nil, :hash "942117298"} {:id "defn-/destination-choice", :kind "defn-", :line 12, :end-line nil, :hash "874551229"} {:id "defn-/new-schema-name", :kind "defn-", :line 21, :end-line nil, :hash "-1054318475"} {:id "defn-/existing-option", :kind "defn-", :line 39, :end-line nil, :hash "2064311428"} {:id "defn-/isolated-working-draft-review?", :kind "defn-", :line 60, :end-line nil, :hash "1136396150"} {:id "defn-/revision-review", :kind "defn-", :line 66, :end-line nil, :hash "-1169592804"} {:id "defn-/successful-save", :kind "defn-", :line 82, :end-line nil, :hash "1710354139"} {:id "defn-/failed-save", :kind "defn-", :line 97, :end-line nil, :hash "327703264"} {:id "defn-/schema-prefill", :kind "defn-", :line 105, :end-line nil, :hash "-620786608"} {:id "def/assignment-scope-expectations", :kind "def", :line 120, :end-line nil, :hash "1672998917"} {:id "defn-/assignment-resolution", :kind "defn-", :line 125, :end-line nil, :hash "-1110233269"} {:id "defn-/replacement-review", :kind "defn-", :line 135, :end-line nil, :hash "1239151997"} {:id "def/assertions", :kind "def", :line 148, :end-line nil, :hash "-1057327777"} {:id "defn/default-assertion", :kind "defn", :line 214, :end-line nil, :hash "2057136094"}]}
;; clj-mutate-manifest-end
