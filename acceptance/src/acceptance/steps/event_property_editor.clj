(ns acceptance.steps.event-property-editor
  (:require [acceptance.steps.event-library-editor-support :as editor]
            [acceptance.steps.support :as support]))

(def templates
  ["event template <template_name> is open for editing" "the property editor is displayed"
   "Properties, JSON, and Validation views edit the same draft"
   "the Properties view preserves string, number, boolean, null, object, and array value types"
   "switching views does not save or discard draft changes"
   "property <property_path> has value <old_value>" "draft field <property_path> currently equals <old_value>" "the user performs <edit_action>"
   "the structured draft and JSON draft both reflect <expected_result>"
   "the original template remains unchanged until the draft is saved"
   "the JSON draft contains <invalid_content>" "the user attempts to save or push the draft"
   "the action is blocked" "a visible error identifies the invalid JSON location"
   "template <template_name> remains unchanged"
   "event template <template_name> has version <old_version>" "revision history for <template_name> ends at <old_version>" "the draft contains valid changes"
   "the user saves the draft as a revision" "template <template_name> has version <new_version>" "saving appends revision <new_version> to <template_name>"
   "version <old_version> remains available to pinned test sequences"
   "a valid unsaved draft targets <destination>" "the user pushes the draft to the active page" "the user reviews and confirms pushing the draft to the active page"
   "the exact draft payload is sent to <destination>"
   "the editor reports the active page, adapter, destination, and result"
   "template <template_name> retains its last saved version" "the draft has unsaved changes"
   "the user leaves the property editor" "the user can keep editing, discard the draft, or save it"
   "unsaved changes are not discarded without an explicit choice"
   "nested property <property_path> has value <old_value>" "within a nested structure <property_path> currently equals <old_value>"
   "the user expands its parent and changes it to <new_value>"
   "the draft retains the surrounding object and array structure"
   "nested property <property_path> has value <new_value> in Properties and JSON views" "Properties and JSON views both show <new_value> at nested path <property_path>"])

(defn- name! [example]
  (let [name (editor/value example "template_name")]
    (editor/assert-value! name "Purchase confirmation" "Editor template fixture is not canonical.") name))

(defn- open-editor [world example]
  (let [template (editor/event-template (name! example))]
    (assoc (editor/inspect world) :template template :original template
           :draft editor/canonical-payload :json-draft (pr-str editor/canonical-payload) :dirty false)))

(defn- transition [step world example]
  (case step
    "event template <template_name> is open for editing" (open-editor world example)
    "the property editor is displayed" (assoc world :editor-visible true)
    "Properties, JSON, and Validation views edit the same draft"
    (do (support/assert! (:editor-visible world) "Property editor is hidden." {})
        (assoc world :views ["Properties" "JSON" "Validation"] :shared-draft (:draft world)))
    "the Properties view preserves string, number, boolean, null, object, and array value types"
    (let [d (:draft world)]
      (support/assert! (and (string? (:transaction_id d)) (boolean? (:debug d)) (nil? (:revenue d))
                            (map? (:metadata d)) (vector? (:items d)))
                       "Property value types were not preserved." {}) world)
    "switching views does not save or discard draft changes"
    (do (editor/assert-value! (:draft world) (:shared-draft world) "Switching views changed the draft.")
        (support/assert! (false? (:dirty world)) "Switching views saved the draft." {}) world)
    "property <property_path> has value <old_value>"
    (let [fixture [(editor/value example "property_path") (editor/value example "old_value")]]
      (support/assert! (contains? #{["transaction_id" "test-123"] ["debug" "true"] ["revenue" "absent"]} fixture)
                       "Property edit fixture is not canonical." {})
      (assoc world :property-fixture fixture))
    "draft field <property_path> currently equals <old_value>" (transition "property <property_path> has value <old_value>" world example)
    "the user performs <edit_action>"
    (let [action (editor/value example "edit_action")]
      (case action
        "change value to test-456" (assoc world :draft (assoc (:draft world) :transaction_id "test-456") :expected "test-456" :dirty true)
        "remove property" (assoc world :draft (dissoc (:draft world) :debug) :expected "property absent" :dirty true)
        "add number 49.95" (assoc world :draft (assoc (:draft world) :revenue 49.95) :expected "number 49.95" :dirty true)
        (throw (ex-info "Unknown property edit action." {:action action}))))
    "the structured draft and JSON draft both reflect <expected_result>"
    (let [expected (editor/value example "expected_result") d (:draft world)]
      (editor/assert-value! expected (:expected world) "Property edit result is incorrect.")
      (case expected
        "test-456" (editor/assert-value! (:transaction_id d) "test-456" "Draft value is incorrect.")
        "property absent" (support/assert! (not (contains? d :debug)) "Removed property remains." {})
        "number 49.95" (editor/assert-value! (:revenue d) 49.95 "Numeric property is incorrect."))
      (assoc world :json-draft (pr-str d)))
    "the original template remains unchanged until the draft is saved"
    (do (support/assert! (:dirty world) "Edited draft is not marked dirty." {})
        (editor/assert-value! (:template world) (:original world) "Draft mutated the original template.") world)
    "the JSON draft contains <invalid_content>"
    (do (editor/assert-value! (editor/value example "invalid_content") "missing closing brace" "Invalid JSON fixture is not canonical.")
        (assoc world :json-draft "{" :json-error "Invalid JSON at position 1." :dirty true))
    "the user attempts to save or push the draft" (assoc world :invalid-action-attempted true)
    "the action is blocked" (do (support/assert! (and (:invalid-action-attempted world) (:json-error world) (:dirty world)) "Invalid action was not blocked." {}) world)
    "a visible error identifies the invalid JSON location"
    (do (support/assert! (re-find #"position [0-9]+" (:json-error world)) "Invalid JSON location is missing." {}) world)
    "template <template_name> remains unchanged"
    (do (name! example) (editor/assert-value! (:template world) (:original world) "Invalid draft changed template.") world)
    "event template <template_name> has version <old_version>"
    (let [version (parse-long (editor/value example "old_version"))]
      (name! example) (editor/assert-value! version 3 "Revision fixture is not canonical.")
      (let [t (editor/event-template "Purchase confirmation" version)] (assoc world :template t :original t :revisions [])))
    "revision history for <template_name> ends at <old_version>" (transition "event template <template_name> has version <old_version>" world example)
    "the draft contains valid changes" (assoc world :draft (assoc (:payload (:template world)) :transaction_id "test-456") :dirty true)
    "the user saves the draft as a revision"
    (do (support/assert! (:dirty world) "Valid draft is not marked dirty." {})
        (assoc world :revisions [(:template world)] :template (assoc (:template world) :payload (:draft world) :version (inc (:version (:template world)))) :dirty false))
    "template <template_name> has version <new_version>"
    (do (name! example) (support/assert! (false? (:dirty world)) "Saved revision remains dirty." {})
        (editor/assert-value! (parse-long (editor/value example "new_version")) (:version (:template world)) "New version is incorrect.") world)
    "saving appends revision <new_version> to <template_name>" (transition "template <template_name> has version <new_version>" world example)
    "version <old_version> remains available to pinned test sequences"
    (do (editor/assert-value! (parse-long (editor/value example "old_version")) (:version (first (:revisions world))) "Pinned revision is unavailable.") world)
    "a valid unsaved draft targets <destination>"
    (let [destination (editor/value example "destination")]
      (editor/assert-value! destination "event.history" "Draft destination is not canonical.")
      (assoc world :draft (assoc (:draft world) :transaction_id "test-456") :destination destination :saved-version (:version (:template world)) :dirty true))
    "the user pushes the draft to the active page"
    (do (support/assert! (:dirty world) "Unsaved draft is not marked dirty." {})
        (assoc world :push {:payload (:draft world) :destination (:destination world) :page "https://example.test/" :adapter "Event history" :success true}))
    "the user reviews and confirms pushing the draft to the active page" (transition "the user pushes the draft to the active page" world example)
    "the exact draft payload is sent to <destination>"
    (do (editor/assert-value! (editor/value example "destination") (:destination (:push world)) "Draft push destination is incorrect.")
        (editor/assert-value! (:payload (:push world)) (:draft world) "Draft push payload is incorrect.") world)
    "the editor reports the active page, adapter, destination, and result"
    (do (support/assert! (and (every? #(contains? (:push world) %) [:page :adapter :destination :success])
                              (:success (:push world))) "Draft push result is incomplete." {}) world)
    "template <template_name> retains its last saved version"
    (do (name! example) (editor/assert-value! (:version (:template world)) (:saved-version world) "Push changed saved version.") world)
    "the draft has unsaved changes" (assoc world :dirty true :draft-before-leave (:draft world))
    "the user leaves the property editor" (assoc world :leave-requested true)
    "the user can keep editing, discard the draft, or save it"
    (do (support/assert! (and (:leave-requested world) (:dirty world)) "Dirty leave choices are missing." {})
        (assoc world :leave-options ["keep editing" "discard draft" "save"]))
    "unsaved changes are not discarded without an explicit choice"
    (do (editor/assert-value! (:draft world) (:draft-before-leave world) "Leaving discarded draft." ) world)
    "nested property <property_path> has value <old_value>"
    (do (editor/assert-value! [(editor/value example "property_path") (editor/value example "old_value")]
                              ["/items/0/product_id" "sku-123"] "Nested fixture is not canonical.")
        (assoc world :property-path "/items/0/product_id"))
    "within a nested structure <property_path> currently equals <old_value>" (transition "nested property <property_path> has value <old_value>" world example)
    "the user expands its parent and changes it to <new_value>"
    (let [v (editor/value example "new_value")]
      (editor/assert-value! v "sku-456" "Nested value fixture is not canonical.")
      (assoc-in (assoc world :expanded "/items/0" :dirty true) [:draft :items 0 :product_id] v))
    "the draft retains the surrounding object and array structure"
    (do (support/assert! (and (:dirty world) (= "/items/0" (:expanded world))
                              (map? (:draft world)) (vector? (get-in world [:draft :items]))
                              (= 1 (count (get-in world [:draft :items])))
                              (= "web" (get-in world [:draft :metadata :channel]))) "Nested structure changed." {}) world)
    "nested property <property_path> has value <new_value> in Properties and JSON views"
    (do (editor/assert-value! [(editor/value example "property_path") (editor/value example "new_value")]
                              [(:property-path world) (get-in world [:draft :items 0 :product_id])] "Nested views disagree.")
        (assoc world :json-draft (pr-str (:draft world))))
    "Properties and JSON views both show <new_value> at nested path <property_path>" (transition "nested property <property_path> has value <new_value> in Properties and JSON views" world example)))

(def handlers
  (mapv (fn [step] {:pattern (editor/property-pattern step)
                    :applies? (when (= step "event template <template_name> has version <old_version>")
                                (fn [world] (contains? world :draft)))
                    :handler (fn [world example _] (transition step world example))}) templates))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T15:32:36.527491147+02:00", :module-hash "117075700", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1766907959"} {:id "def/templates", :kind "def", :line 5, :end-line nil, :hash "65127469"} {:id "defn-/name!", :kind "defn-", :line 30, :end-line nil, :hash "1476283729"} {:id "defn-/open-editor", :kind "defn-", :line 34, :end-line nil, :hash "-1046023692"} {:id "defn-/transition", :kind "defn-", :line 39, :end-line nil, :hash "-420976978"} {:id "def/handlers", :kind "def", :line 139, :end-line nil, :hash "698096313"}]}
;; clj-mutate-manifest-end
