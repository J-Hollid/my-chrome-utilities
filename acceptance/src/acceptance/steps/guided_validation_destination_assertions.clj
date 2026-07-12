(ns acceptance.steps.guided-validation-destination-assertions
  (:require [acceptance.steps.guided-validation-step-assertions :as steps]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- example-value [example key]
  (support/require-example example key))

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
        option (some #(when (str/starts-with? (:label %) (str name " version")) %) (:existingOptions observation))
        production-option (some #(when (= name (:name %)) %) (get-in observation [:production :destinationOptions]))]
    (support/assert! option "Specified schema was not displayed." {:example example})
    (support/assert! (contains? #{"selectable" "unavailable"} expected-availability)
                     "Schema availability must use the supported result vocabulary."
                     {:example example})
    (support/assert! (= [expected-target expected-property-state (= expected-availability "selectable") expected-explanation]
                        [(:target production-option) (:propertyState production-option) (:available production-option) (:explanation production-option)])
                     "Production schema destination option did not match its specification row."
                     {:example example :production-option production-option})
    (support/assert! (= [(= expected-availability "unavailable") expected-explanation]
                        [(:disabled option) (:explanation option)])
                     "Existing schema compatibility did not match its target and property type."
                     {:example example :option option})))

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
    (support/assert! (str/includes? (:review result) "Product listing version 4 will be created while version 3 remains unchanged")
                     "Existing schema review omitted immutable revision behavior." {:result result})
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
    (support/assert! (str/includes? (:status result) saved-result)
                     "Successful schema-destination save did not show its confirmation."
                     {:example example :result result})))

(defn- failed-save [_example observation]
  (support/assert! (= [true true "Saving failed. Check storage access and try again."]
                      [(get-in observation [:saveFailure :flowVisible])
                       (get-in observation [:saveFailure :unchanged])
                       (get-in observation [:saveFailure :error])])
                   "Failed persistence did not preserve the review and storage state."
                   {:observation observation}))

(def assertions
  (steps/step-assertions
   #{"the schema destination stage is displayed"
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
     "schema <schema_name> has availability <availability>"
     "its compatibility explanation is <explanation>"}
   existing-option
   #{"existing schema Product listing version 3 is selected"
     "matching assignment state is <assignment_state>"
     "the validation review is displayed"
     "it identifies page_type as the rule attachment path"
     "it states that Product listing version 4 will be created while version 3 remains unchanged"
     "assignment action is <assignment_action>"}
   revision-review
   #{"the review has destination <schema_destination>"
     "the operator activates Save validation and persistence completes"
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
   failed-save))

(defn default-assertion [text observation]
  (support/assert! (:destinationInitial observation)
                   "Guided schema destination browser boundary was not exercised."
                   {:step text}))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-12T23:04:06.459680131+02:00", :module-hash "1928610543", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1678299692"} {:id "defn-/example-value", :kind "defn-", :line 6, :end-line nil, :hash "-1416813660"} {:id "defn-/destination-choice", :kind "defn-", :line 9, :end-line nil, :hash "874551229"} {:id "defn-/new-schema-name", :kind "defn-", :line 18, :end-line nil, :hash "-1054318475"} {:id "defn-/existing-option", :kind "defn-", :line 36, :end-line nil, :hash "163001537"} {:id "defn-/revision-review", :kind "defn-", :line 57, :end-line nil, :hash "-1392843527"} {:id "defn-/successful-save", :kind "defn-", :line 73, :end-line nil, :hash "345128981"} {:id "defn-/failed-save", :kind "defn-", :line 88, :end-line nil, :hash "327703264"} {:id "def/assertions", :kind "def", :line 96, :end-line nil, :hash "1016985838"} {:id "defn/default-assertion", :kind "defn", :line 135, :end-line nil, :hash "2057136094"}]}
;; clj-mutate-manifest-end
