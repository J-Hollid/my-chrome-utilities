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
        option (find-first #(= [true unavailable? expected-explanation]
                               [(str/starts-with? (:label %) (str name " version"))
                                (:disabled %)
                                (:explanation %)])
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
  (let [state (example-value example "assignment_coverage")
        expected-action (example-value example "assignment_action")
        key (get {"an enabled published assignment covers the event" :matching
                  "an enabled working-draft assignment covers the event" :pending
                  "no enabled published or pending assignment covers it" :absent}
                 state)
        result (get-in observation [:production :destinations key])]
    (support/assert! key
                     "Assignment coverage must use the supported published, pending, or absent vocabulary."
                     {:example example})
    (support/assert! (str/includes? (:review result) "Rule attachment path: page_type")
                     "Existing schema review omitted the rule attachment path." {:result result})
    (support/assert! (isolated-working-draft-review? (:review result))
                     "Existing schema review omitted working-draft isolation." {:result result})
    (support/assert! (= expected-action (:assignmentAction result))
                     "Existing schema review used the wrong assignment action."
                     {:example example :result result})))

(def ^:private successful-save-expectations
  {"new Signal Shop pageview"
   {:feature "draft Signal Shop pageview was created"
    :runtime "Draft Signal Shop pageview was created."}
   "existing Product listing v3"
   {:feature "validation was added to Product listing draft"
    :runtime "Validation was added to Product listing draft."}})

(defn- successful-save [example observation]
  (let [destination (example-value example "schema_destination")
        saved-result (example-value example "saved_result")
        expected (get successful-save-expectations destination)
        result (if (str/starts-with? destination "new ") (:saved observation) (:existingSaved observation))]
    (support/assert! expected
                     "Schema destination must identify a supported reviewed destination."
                     {:example example})
    (support/assert! (= (:feature expected) saved-result)
                     "Schema-destination confirmation example changed."
                     {:example example})
    (support/assert! (= [true true true]
                        [(:flowClosed result) (:inspectorRestored result) (:focusReturned result)])
                     "Successful schema-destination save did not close, restore, and return focus."
                     {:example example :result result})
    (support/assert! (= (:runtime expected) (:status result))
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
                       {:configurationAbsent true :selectionAbsent true}]
                      [(:schemaPrefillRequirement observation) (:schemaPrefillScope observation)])
                   "A covering assignment did not retain schema prefill while omitting redundant assignment controls."
                   {:observation observation}))

(defn- assignment-resolution [example observation]
  (let [state (example-value example "assignment_state")
        expected [(example-value example "configuration_visibility")
                  (example-value example "assignment_action")
                  (example-value example "continuation_result")]
        result (find-first #(= state (:state %)) (get-in observation [:production :assignmentCoverage]))]
    (support/assert! (= expected [(:configuration result) (:action result) (:continuation result)])
                     "Assignment coverage produced the wrong configuration, action, or continuation behavior."
                     {:example example :result result})))

(defn- assignment-action [example observation]
  (if (support/example-value example "assignment_coverage")
    (revision-review example observation)
    (assignment-resolution example observation)))

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
     "assignment coverage for the captured event is <assignment_coverage>"
     "the validation review is displayed"
     "it identifies page_type as the rule attachment path"
     "it states that the rule will be added to the Product listing working draft based on version 3"
     "Product listing version 3 remains current until the working draft is published"
     "no Product listing version 4 exists before publication"}
   revision-review
   #{"the review has destination <schema_destination>"
     "the operator activates Add validation to draft and persistence completes"
     "the review and guided validation flow close"
     "the originating Live event inspector is restored"
     "a visible status confirms <saved_result>"
     "keyboard focus returns to Add validation for page_type"}
   successful-save
   #{"a saveable draft is at its final stage"
     "persistence returns an error"
     "the review remains open with the entered draft intact"
     "a specific error explains how to recover"
     "no partial schema, rule, assignment, or revision is persisted"}
   failed-save
   #{"the destination choice has accepted Generic pageview version 4"
     "one enabled assignment covers the captured event"
     "the requirement stage is displayed"
     "page_type expected type is prefilled from Generic pageview version 4"
     "validation target is prefilled from the schema"
     "event source, event name, domain, and path conditions are prefilled from the compatible assignment"
     "every prefilled value identifies Generic pageview version 4 or its assignment as its source"
     "the operator can change each prefilled value before review"}
   schema-prefill
   #{"the selected schema has assignment state <assignment_state>"
     "assignment coverage is evaluated for the captured event"
     "assignment configuration is <configuration_visibility>"
     "property-rule creation is <continuation_result>"}
   assignment-resolution
   #{"assignment action is <assignment_action>"}
   assignment-action
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
;; {:version 1, :tested-at "2026-07-14T14:42:05.411841657+02:00", :module-hash "-1407487327", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-1678299692"} {:id "defn-/example-value", :kind "defn-", :line 6, :end-line 7, :hash "-1416813660"} {:id "defn-/find-first", :kind "defn-", :line 9, :end-line 10, :hash "942117298"} {:id "defn-/destination-choice", :kind "defn-", :line 12, :end-line 19, :hash "874551229"} {:id "defn-/new-schema-name", :kind "defn-", :line 21, :end-line 37, :hash "-1054318475"} {:id "defn-/existing-option", :kind "defn-", :line 39, :end-line 63, :hash "620402717"} {:id "defn-/isolated-working-draft-review?", :kind "defn-", :line 65, :end-line 69, :hash "1136396150"} {:id "defn-/revision-review", :kind "defn-", :line 71, :end-line 88, :hash "2124054012"} {:id "def/successful-save-expectations", :kind "def", :line 90, :end-line 96, :hash "23186373"} {:id "defn-/successful-save", :kind "defn-", :line 98, :end-line 115, :hash "-769240431"} {:id "defn-/failed-save", :kind "defn-", :line 117, :end-line 123, :hash "327703264"} {:id "defn-/schema-prefill", :kind "defn-", :line 125, :end-line 132, :hash "475918946"} {:id "defn-/assignment-resolution", :kind "defn-", :line 134, :end-line 142, :hash "299517715"} {:id "defn-/assignment-action", :kind "defn-", :line 144, :end-line 147, :hash "-70875715"} {:id "defn-/replacement-review", :kind "defn-", :line 149, :end-line 160, :hash "-2135809213"} {:id "def/assertions", :kind "def", :line 162, :end-line 227, :hash "257738528"} {:id "defn/default-assertion", :kind "defn", :line 229, :end-line 232, :hash "2057136094"}]}
;; clj-mutate-manifest-end
