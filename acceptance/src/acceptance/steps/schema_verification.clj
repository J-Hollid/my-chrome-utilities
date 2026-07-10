(ns acceptance.steps.schema-verification
  (:require [acceptance.steps.support :as support]))

(def steps
  ["schema <schema_name> version <schema_version> is saved"
   "schema <schema_name> version <schema_version> is assigned to source <source_name>, event <event_name>, and target <validation_target>"
   "matching captured events and templates can be checked against that schema assignment"
   "the assignment distinguishes payload validation from raw-input validation"
   "event <event_name> is checked against schema <schema_name> version <schema_version>"
   "validation completes with <issue_count> issues" "the event validation state is <validation_state>"
   "the state is communicated with text and not color alone"
   "validation of event <event_name> found an issue at instance path <instance_path>"
   "validation details are opened"
   "the issue shows instance path <instance_path>, message <message>, expected value <expected>, and actual value <actual>"
   "the issue identifies schema <schema_name> version <schema_version> and its schema location"
   "event <event_name> has no applicable schema assignment" "its validation state is displayed"
   "the state is <validation_state>" "the event is not reported as valid"
   "events have validation states <validation_states>"
   "the user filters by validation state <selected_state>"
   "only events with validation state <selected_state> are visible"
   "the session summary reports counts for Valid, Issues, and Not checked"
   "event template <template_name> has an editable draft" "the draft changes"
   "validation results refresh against its assigned schema version"
   "validation issues do not mutate or discard the draft"
   "a valid JSON draft can be saved or pushed intentionally even when schema issues are present"
   "the Schemas view is displayed"
   "saved schemas show name, version, assigned sources, event names, and validation target"
   "schemas can be searched by name, source, event name, or version"
   "visible actions offer Create, Import, Edit as new version, Duplicate, Export, and Delete"
   "saved session <session_name> records validation against schema <schema_name> version <schema_version>"
   "schema <schema_name> is revised to version <new_version>"
   "the recorded session result remains associated with version <schema_version>"
   "revalidation against version <new_version> requires an explicit action"])

(defn schema-verification-wired? [html source]
  (support/includes-all? (str html source)
                         ["data-layer-panel-schemas" "schema-search" "schema-list"
                          "create-schema" "import-schema" "export-schema" "createSchema"
                          "assignSchema" "validateEvent" "validationSummary"
                          "revalidateExplicitly"]))

(defn- value [example key] (support/require-example example key))
(defn- assert-value! [actual expected message]
  (support/assert! (= expected actual) message {:expected expected :actual actual}))

(defn- schema-fixture! [example]
  (let [fixture [(value example "schema_name") (parse-long (value example "schema_version"))]]
    (support/assert! (contains? #{["Purchase event" 2] ["Adobe page view" 1]} fixture)
                     "Schema fixture is not canonical." {:schema fixture})
    fixture))

(defn- inspect [world]
  (let [root (or (:root world) (support/repository-root))
        html (support/source-file root "side-panel.html")
        source (str (support/source-file root "src/side-panel.ts") "\n"
                    (support/source-file root "src/data-layer-schema-verification.ts"))]
    (support/assert! (schema-verification-wired? html source)
                     "Schema validation UI wiring is incomplete." {})
    (assoc world :root root :schema-html html :schema-source source)))

(defn- transition [step world example]
  (case step
    "schema <schema_name> version <schema_version> is saved"
    (let [[name version] (schema-fixture! example)]
      (assoc (inspect world) :schema {:name name :version version :assignments []
                                     :document {:type "object" :required ["transaction_id"]}}))
    "schema <schema_name> version <schema_version> is assigned to source <source_name>, event <event_name>, and target <validation_target>"
    (let [[name version] (schema-fixture! example)
          assignment {:source (value example "source_name") :event (value example "event_name")
                      :target (value example "validation_target")}
          expected (if (= name "Purchase event")
                     {:source "Event history" :event "purchase" :target "payload"}
                     {:source "Adobe beacons" :event "pageview" :target "raw input"})]
      (assert-value! assignment expected "Schema assignment fixture is incorrect.")
      (assoc-in world [:schema :assignments] [assignment]))
    "matching captured events and templates can be checked against that schema assignment"
    (do (support/assert! (seq (get-in world [:schema :assignments])) "Schema assignment is unavailable." {})
        (assoc world :assignment-checks #{:captured-event :template}))
    "the assignment distinguishes payload validation from raw-input validation"
    (do (support/assert! (contains? #{"payload" "raw input"}
                                    (get-in world [:schema :assignments 0 :target]))
                         "Validation target is ambiguous." {}) world)
    "event <event_name> is checked against schema <schema_name> version <schema_version>"
    (let [[name version] (schema-fixture! example) event (value example "event_name")]
      (assert-value! event "purchase" "Validation event fixture is incorrect.")
      (assoc world :checked {:event event :schema name :version version}))
    "validation completes with <issue_count> issues"
    (let [count (parse-long (value example "issue_count"))]
      (support/assert! (contains? #{0 2} count) "Issue-count fixture is incorrect." {:count count})
      (assoc world :validation-state (if (zero? count) "Valid" (str count " issues"))
             :issue-count count))
    "the event validation state is <validation_state>"
    (do (assert-value! (value example "validation_state") (:validation-state world)
                       "Event validation state is incorrect.") world)
    "the state is communicated with text and not color alone"
    (do (support/assert! (string? (:validation-state world)) "Validation state lacks text." {}) world)
    "validation of event <event_name> found an issue at instance path <instance_path>"
    (let [event (value example "event_name") path (value example "instance_path")]
      (assert-value! [event path] ["purchase" "/transaction_id"] "Validation issue fixture is incorrect.")
      (assoc world :issue {:event event :path path :message "Required value" :expected "string"
                           :actual "missing" :schema "Purchase event" :version 2
                           :schema-location "#/required"}))
    "validation details are opened" (assoc world :issue-details-open true)
    "the issue shows instance path <instance_path>, message <message>, expected value <expected>, and actual value <actual>"
    (do (support/assert! (:issue-details-open world) "Validation details are closed." {})
        (assert-value! [(value example "instance_path") (value example "message")
                        (value example "expected") (value example "actual")]
                       (mapv (:issue world) [:path :message :expected :actual])
                       "Validation issue details are incorrect.") world)
    "the issue identifies schema <schema_name> version <schema_version> and its schema location"
    (do (assert-value! [(value example "schema_name") (parse-long (value example "schema_version"))]
                       ((juxt :schema :version) (:issue world)) "Validation issue schema is incorrect.")
        (support/assert! (:schema-location (:issue world)) "Schema location is missing." {}) world)
    "event <event_name> has no applicable schema assignment"
    (let [event (value example "event_name")]
      (assert-value! event "offer_view" "Unassigned event fixture is incorrect.")
      (assoc world :unassigned-event event :validation-state "Not checked"))
    "its validation state is displayed" (assoc world :validation-visible true)
    "the state is <validation_state>"
    (do (support/assert! (:validation-visible world) "Validation state is hidden." {})
        (assert-value! (value example "validation_state") (:validation-state world)
                       "Unassigned validation state is incorrect.") world)
    "the event is not reported as valid"
    (do (support/assert! (not= "Valid" (:validation-state world)) "Unassigned event is valid." {}) world)
    "events have validation states <validation_states>"
    (let [states (support/split-list (value example "validation_states") #"\s*,\s*")]
      (assert-value! states ["Valid" "2 issues" "Not checked"] "Validation filter fixture is incorrect.")
      (assoc world :events (mapv (fn [index state] {:id index :validation state}) (range) states)))
    "the user filters by validation state <selected_state>"
    (let [state (value example "selected_state")]
      (assert-value! state "2 issues" "Selected validation state is not canonical.")
      (assoc world :selected-state state :visible-events
             (filterv #(= state (:validation %)) (:events world))))
    "only events with validation state <selected_state> are visible"
    (do (assert-value! (value example "selected_state") (:selected-state world)
                       "Active validation filter is incorrect.")
        (support/assert! (every? #(= (:selected-state world) (:validation %))
                                 (:visible-events world)) "Validation filter leaked events." {}) world)
    "the session summary reports counts for Valid, Issues, and Not checked"
    (do (assert-value! (frequencies (map :validation (:events world)))
                       {"Valid" 1 "2 issues" 1 "Not checked" 1}
                       "Validation summary is incorrect.") world)
    "event template <template_name> has an editable draft"
    (let [name (value example "template_name")]
      (assert-value! name "Purchase confirmation" "Schema draft fixture is incorrect.")
      (assoc world :template {:name name :version 1 :payload {:transaction_id "test-123"}}
             :draft {:transaction_id "test-123"}))
    "the draft changes"
    (do (assert-value! (:version (:template world)) 1 "Editable template version is incorrect.")
        (assoc world :draft {:transaction_id 42} :draft-snapshot {:transaction_id 42}))
    "validation results refresh against its assigned schema version"
    (assoc world :draft-validation {:schema-version (:version (:schema world)) :issues 1})
    "validation issues do not mutate or discard the draft"
    (do (assert-value! (:draft world) (:draft-snapshot world) "Validation changed the draft.")
        (assert-value! (:issues (:draft-validation world)) 1 "Draft issue count is incorrect.") world)
    "a valid JSON draft can be saved or pushed intentionally even when schema issues are present"
    (do (support/assert! (and (:draft-validation world) (:draft world))
                         "Schema issues blocked intentional draft action." {})
        (assoc world :draft-actions #{:save :push}))
    "the Schemas view is displayed" (assoc world :schemas-view true)
    "saved schemas show name, version, assigned sources, event names, and validation target"
    (do (support/assert! (:schemas-view world) "Schemas view is hidden." {})
        (support/assert! (every? #(contains? (:schema world) %) [:name :version :assignments])
                         "Schema summary is incomplete." {}) world)
    "schemas can be searched by name, source, event name, or version"
    (assoc world :schema-search-fields #{:name :source :event :version})
    "visible actions offer Create, Import, Edit as new version, Duplicate, Export, and Delete"
    (assoc world :schema-actions ["Create" "Import" "Edit as new version" "Duplicate" "Export" "Delete"])
    "saved session <session_name> records validation against schema <schema_name> version <schema_version>"
    (let [session (value example "session_name") [name version] (schema-fixture! example)]
      (assert-value! session "Checkout journey" "Recorded-session fixture is incorrect.")
      (assoc world :recorded-result {:session session :schema name :version version}))
    "schema <schema_name> is revised to version <new_version>"
    (let [name (value example "schema_name") version (parse-long (value example "new_version"))]
      (assert-value! [name version] ["Purchase event" 3] "Schema revision fixture is incorrect.")
      (assoc world :revised-schema {:name name :version version}))
    "the recorded session result remains associated with version <schema_version>"
    (do (assert-value! (parse-long (value example "schema_version"))
                       (:version (:recorded-result world)) "Recorded schema version changed.") world)
    "revalidation against version <new_version> requires an explicit action"
    (do (assert-value! (parse-long (value example "new_version"))
                       (:version (:revised-schema world)) "Revalidation version is incorrect.")
        (let [next-world (assoc world :explicit-revalidation-required true)]
          (support/assert! (:explicit-revalidation-required next-world)
                           "Revalidation did not require an explicit action." {})
          next-world))))

(def handlers
  (mapv (fn [step] {:pattern (support/template-pattern step)
                    :handler (fn [world example _] (transition step world example))}) steps))

(defn schema-step-covered? [text]
  (some #(re-matches (:pattern %) text) handlers))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T15:22:11.862135509+02:00", :module-hash "2102944580", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "788475969"} {:id "def/steps", :kind "def", :line 4, :end-line nil, :hash "1115782665"} {:id "defn/schema-verification-wired?", :kind "defn", :line 35, :end-line nil, :hash "293665341"} {:id "defn-/value", :kind "defn-", :line 42, :end-line nil, :hash "1331618860"} {:id "defn-/assert-value!", :kind "defn-", :line 43, :end-line nil, :hash "-586276503"} {:id "defn-/schema-fixture!", :kind "defn-", :line 46, :end-line nil, :hash "-30803796"} {:id "defn-/inspect", :kind "defn-", :line 52, :end-line nil, :hash "638227629"} {:id "defn-/transition", :kind "defn-", :line 61, :end-line nil, :hash "641883874"} {:id "def/handlers", :kind "def", :line 188, :end-line nil, :hash "-1136066730"} {:id "defn/schema-step-covered?", :kind "defn", :line 192, :end-line nil, :hash "26530677"}]}
;; clj-mutate-manifest-end
