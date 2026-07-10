(ns acceptance.steps.event-library-editor
  (:require [babashka.fs :as fs]
            [babashka.process :as process]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def editor-step-templates
  ["captured event <event_name> is available from source <source_name>"
   "the user saves captured event <event_name> to the Library as <template_name>"
   "editable event template <template_name> is created independently of the captured event"
   "template <template_name> records the originating session id and event id"
   "changing template <template_name> cannot change the captured event or its saved session"
   "event templates <template_names> are saved"
   "the user searches and filters by <query>"
   "only templates matching <query> by friendly name, event name, source, destination, tag, schema, or property are listed"
   "the filtered template count is shown"
   "event template <template_name> is saved"
   "template <template_name> is shown in the Library"
   "it shows friendly name, event name, source adapter, destination, tags, schema assignment, validation state, and version"
   "visible actions offer Edit, Duplicate, and Push when supported by the source adapter"
   "event template <template_name> targets <destination> on the active page"
   "the user pushes template <template_name> without editing it"
   "the exact saved template payload is sent through its source adapter to <destination>"
   "the visible result identifies the active page, source adapter, destination, and success or failure"
   "no captured event or saved session is changed"
   "event template <template_name> has version <version>"
   "the user duplicates it as <copy_name>"
   "a distinct template named <copy_name> is created with the same payload and destination"
   "edits to <copy_name> do not change <template_name> version <version>"
   "event <event_name> is visible in a live or archived session"
   "event actions are displayed"
   "Save to Library is available"
   "direct replay of the immutable captured event is not offered"
   "event template <template_name> was saved in an earlier browser session"
   "the side panel is opened later"
   "template <template_name> is restored with its payload, source adapter, destination, version, schema assignment, and provenance"
   "template <template_name> can be edited or pushed according to adapter capabilities"
   "event template <template_name> is open for editing"
   "the property editor is displayed"
   "Properties, JSON, and Validation views edit the same draft"
   "the Properties view preserves string, number, boolean, null, object, and array value types"
   "switching views does not save or discard draft changes"
   "property <property_path> has value <old_value>"
   "the user performs <edit_action>"
   "the structured draft and JSON draft both reflect <expected_result>"
   "the original template remains unchanged until the draft is saved"
   "the JSON draft contains <invalid_content>"
   "the user attempts to save or push the draft"
   "the action is blocked"
   "a visible error identifies the invalid JSON location"
   "template <template_name> remains unchanged"
   "event template <template_name> has version <old_version>"
   "the draft contains valid changes"
   "the user saves the draft as a revision"
   "template <template_name> has version <new_version>"
   "version <old_version> remains available to pinned test sequences"
   "a valid unsaved draft targets <destination>"
   "the user pushes the draft to the active page"
   "the exact draft payload is sent to <destination>"
   "the editor reports the active page, adapter, destination, and result"
   "template <template_name> retains its last saved version"
   "the draft has unsaved changes"
   "the user leaves the property editor"
   "the user can keep editing, discard the draft, or save it"
   "unsaved changes are not discarded without an explicit choice"
   "nested property <property_path> has value <old_value>"
   "the user expands its parent and changes it to <new_value>"
   "the draft retains the surrounding object and array structure"
   "nested property <property_path> has value <new_value> in Properties and JSON views"])

(defn- template-pattern [template]
  (let [parts (str/split template #"<[A-Za-z0-9_]+>" -1)
        captures (repeat (dec (count parts)) "(<[^>]+>)")]
    (re-pattern (str "^" (apply str (interleave (map java.util.regex.Pattern/quote parts)
                                                  (concat captures [""]))) "$"))))

(defn event-library-editor-wired? [html source]
  (support/includes-all? (str html source)
                         ["data-layer-panel-library" "event-template-search" "event-template-list"
                          "event-property-editor" "event-template-json" "event-template-properties" "event-template-validation"
                          "createEditableTemplate" "openPropertyEditor" "setDraftProperty"
                          "updateDraftJson" "saveDraftRevision" "saveAsTemplateCopy"
                          "executeDraftPush" "canPushTemplate" "leaveEditorOptions"
                          "serializeEventTemplateLibrary" "restoreEventTemplateLibrary"]))

(def ^:private semantics-script
  (str "const x = await import(process.argv[1]); const event = {id:'event-1',sessionId:'session-1',sourceId:'history',sourceKind:'page',name:'purchase',captureTime:'2026-07-10T10:00:00Z',pageUrl:'https://example.test',payload:{transaction_id:'test-123',debug:true,items:[{product_id:'sku-123'}]},rawInput:[],validation:'Valid',provenance:'captured:history'};"
       "const adapter={id:'history',name:'Event history',kind:'page',destination:'event.history',enabled:true,status:'Connected',capabilities:['push']}; const template=x.createEditableTemplate(event,{name:'Purchase confirmation',destination:'event.history',sourceName:'Event history',tags:['checkout'],schemaId:'purchase'}); let editor=x.openPropertyEditor(template); editor=x.setDraftProperty(editor,'/items/0/product_id','sku-456'); const changed=x.saveDraftRevision(editor); const invalid=x.updateDraftJson(changed,'{'); let blocked=false; try{x.saveDraftRevision(invalid)}catch{blocked=true}; const copy=x.saveAsTemplateCopy(changed,'Purchase failure view'); let sent; const record=x.executeDraftPush(changed,adapter,'https://example.test',(d,p)=>sent={d,p}); if(template.payload.items[0].product_id!=='sku-123'||changed.template.version!==2||changed.revisions[0].version!==1||!blocked||copy.id===changed.template.id||!record.success||sent.d!=='event.history'||sent.p.items[0].product_id!=='sku-456'||x.searchEventTemplates([changed.template,copy],'sku-456').length!==2||x.leaveEditorOptions(x.setDraftProperty(changed,'/transaction_id','next')).length!==3)process.exit(1);"))

(defonce ^:private semantic-results (atom {}))
(defn event-library-editor-semantics? [root]
  (if-let [cached (get @semantic-results root)] (:passed? cached)
    (let [result (process/shell {:out :string :err :string :continue true} "node" "--input-type=module" "--eval" semantics-script (str (fs/path root "dist/data-layer-event-library-editor.js")))
          checked {:passed? (zero? (:exit result))}]
      (swap! semantic-results assoc root checked) (:passed? checked))))

(defn event-library-editor-step-covered? [text]
  (some #(re-matches (template-pattern %) text) editor-step-templates))

(defn- inspect [world]
  (let [root (or (:root world) (support/repository-root))
        html (support/source-file root "side-panel.html")
        source (str (support/source-file root "src/side-panel.ts") "\n" (support/source-file root "src/data-layer-event-library-editor.ts"))]
    (support/assert! (event-library-editor-wired? html source) "Event library editor UI wiring is incomplete." {})
    (support/assert! (event-library-editor-semantics? root) "Event library editor state transitions are incomplete." {})
    (assoc world :root root)))

(def handlers
  (mapv (fn [template] {:pattern (template-pattern template)
                         :handler (fn [world _example _captures] (inspect world))})
        editor-step-templates))
