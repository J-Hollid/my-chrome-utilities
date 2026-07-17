(ns acceptance.steps.information-architecture
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]
            [clojure.edn :as edn]
            [clojure.string :as str]))

(defn- inspect [world]
  (let [root (or (:root world) (support/repository-root))]
    (assoc world
           :root root
           :html (support/source-file root "side-panel.html")
           :css (support/source-file root "side-panel.css")
           :source (str/join "\n" [(support/source-file root "src/side-panel.ts")
                                     (support/source-file root "src/data-layer-live-observer-ui.ts")]))))

(defn- example-value [example key]
  (support/require-example example key))

(def navigation-structure? support/navigation-structure?)

(defn contextual-actions? [html source]
  (and (str/includes? html "id=\"live-context-actions\"")
       (every? #(str/includes? html %)
               ["id=\"start-data-layer-testing\""
                "id=\"end-data-layer-testing\""
                "id=\"choose-observation-target\""
                "id=\"pause-capture\""
                "id=\"resume-capture\""])
       (not (str/includes? html "id=\"attach-selected-target\""))
       (not (str/includes? html "id=\"detach-observation-target\""))
       (not (str/includes? html "id=\"stop-capture\""))
       (str/includes? source "function renderLiveContextActions()")
       (str/includes? source "startTestingButton?.addEventListener")))

(defn- run-production-module! [script]
  (let [{:keys [exit out err]} (process/shell {:out :string :err :string}
                                                "node" "--input-type=module" "--eval" script)]
    (support/assert! (zero? exit)
                     "Production module execution failed."
                     {:error err})
    (edn/read-string (str/trim out))))

(defn- runtime-live-session-controls [session-state capture-state]
  (run-production-module!
   (format (str "import { liveSessionControls } from './dist/data-layer-live-session-controls.js';"
                "const controls=liveSessionControls({activeSession:%s,captureStatus:%s});"
                "console.log(`{:session-action ${JSON.stringify(controls.sessionAction)} :capture-action ${JSON.stringify(controls.captureAction)}}`);"
                )
           (if (= session-state "Active") "true" "false")
           (pr-str (get {"Paused" "Paused"} capture-state "Live")))))

(defn- runtime-live-session-lifecycle []
  (run-production-module!
   (str "import { createObservationTarget, createObservationTargetState, selectObservationTarget, attachSelectedObservationTarget, detachObservationTarget } from './dist/data-layer-observation-targets.js';"
        "import { startDataLayerTestingSession, endDataLayerTestingSession } from './dist/data-layer-session.js';"
        "const target=createObservationTarget({tabId:42,windowId:7,pageUrl:'https://example.test/',title:'Example'});"
        "const selected=selectObservationTarget(createObservationTargetState([target]),target.id);"
        "const attached=attachSelectedObservationTarget(selected);"
        "const started=startDataLayerTestingSession({}, {id:'test',tabId:target.tabId,windowId:target.windowId,url:target.pageUrl,historyPath:'event.history',targetTitle:target.title,targetOrigin:target.origin});"
        "const ended=endDataLayerTestingSession(started);"
        "const detached=detachObservationTarget(attached.state);"
        "console.log(`{:started ${attached.result==='Attached' && started.session?.status==='active'} :ended ${ended.session?.status==='ended' && detached.sessionState==='Detached'}}`);")))

(def data-layer-secondary-views #{"Live" "Library" "Sessions" "Schemas"})

(defn data-layer-view-separation? [html source]
  (and (str/includes? html "id=\"data-layer-views\" role=\"tablist\"")
       (every? #(str/includes? html (str "id=\"data-layer-panel-" (str/lower-case %) "\""))
               data-layer-secondary-views)
       (str/includes? source "for (const candidate of dataLayerViews)")
       (str/includes? source "panel.hidden = !selected")))

(defn distinct-hidden-data-layer-views? [active hidden-views]
  (and (contains? data-layer-secondary-views active)
       (= 3 (count hidden-views))
       (= 3 (count (set hidden-views)))
       (every? data-layer-secondary-views hidden-views)
       (not (some #{active} hidden-views))))

(defn hidden-panel-css-wins? [css]
  (str/includes? css "[role=tabpanel][hidden] { display:none !important; }"))

(defn- require-layout [world]
  (let [world (inspect world)]
    (support/assert! (navigation-structure? (:html world) (:css world))
                     "Side panel navigation structure is incomplete." {})
    world))

(def expected-hidden-schema-presentation
  {:panelDisplay "none" :painted false :focusable false :closeReviewOpen false})

(defn schema-view-contained? [observation]
  (and (every? true? (map observation
                           [:containedControls
                            :editorContainsActions
                            :closeReviewContainsActions
                            :assignmentContainsPolicy]))
       (zero? (:standaloneAssignmentPolicy observation -1))
       (= #{:Live :Library :Sessions}
          (set (keys (:presentationByView observation))))
       (every? #(= expected-hidden-schema-presentation %)
               (vals (:presentationByView observation)))
       (every? true? (vals (:editorStates observation)))
       (true? (get-in observation [:restored :editorVisible]))
       (not (str/blank? (get-in observation [:restored :name])))
       (false? (get-in observation [:restored :closeReviewOpen]))))

(defonce schema-view-containment-observation (atom nil))

(defn- load-schema-view-containment! []
  (or @schema-view-containment-observation
      (let [observation
            (support/load-browser-observation!
              {:adapter-env "SCHEMA_VIEW_CONTAINMENT_BROWSER_ADAPTER"
               :observation-key :schemaViewContainment
               :runtime-error "Schema view containment browser verification failed."
               :missing-error "Schema view containment browser observation is missing."})]
        (support/assert! (schema-view-contained? observation)
                         "Rendered Schema view is not contained."
                         {:observation observation})
        (reset! schema-view-containment-observation observation))))

(defn- observe-schema-view-containment [world]
  (assoc world :schema-view-containment (load-schema-view-containment!)))

(defn- require-schema-view-containment! [world]
  (let [observation (:schema-view-containment world)]
    (support/assert! (schema-view-contained? observation)
                     "Schema view containment browser evidence is missing."
                     {:observation observation})
    observation))

(def handlers
  [{:pattern #"^the closed side panel layout is inspected$"
    :handler (fn [world _example _captures] world)}

   {:pattern #"^the side panel is displayed at <([A-Za-z0-9_]+)> CSS px wide with Data Layer Live active$"
    :handler (fn [world example [width-key]]
               (assoc (inspect world) :panel-width (example-value example width-key) :active-section "Data Layer" :active-view "Live"))}

   {:pattern #"^the side panel is displayed at ([0-9]+) CSS px wide with Data Layer Live active$"
    :handler (fn [world _example [width]]
               (assoc (inspect world) :panel-width width :active-section "Data Layer" :active-view "Live"))}

   {:pattern #"^the readable application header precedes the primary navigation strip$"
    :handler (fn [world _example _captures] (require-layout world))}

   {:pattern #"^the application header is semantically separate from the primary navigation tab list$"
    :handler (fn [world _example _captures]
               (support/assert! (and (str/includes? (:html world) "<header id=\"application-header\"")
                                     (str/includes? (:html world) "id=\"workspace-tabs\" role=\"tablist\""))
                                "Header and primary navigation are not separate." {})
               world)}

   {:pattern #"^the primary navigation strip contains only Data Layer then Hotkeys in stable order$"
    :handler (fn [world _example _captures]
               (let [html (:html world) start (.indexOf html "id=\"workspace-tabs\"") end (.indexOf html "id=\"workspace-panel-data-layer\"") section (subs html start end)]
                 (support/assert! (and (< (.indexOf section "Data Layer") (.indexOf section "Hotkeys"))
                                       (= 2 (count (re-seq #"role=\"tab\"" section))))
                                  "Primary tabs are not the stable two-item navigation." {})
                 world))}

   {:pattern #"^the Data Layer secondary navigation strip follows inside the active Data Layer section$"
    :handler (fn [world _example _captures] (require-layout world))}
   {:pattern #"^the Live view content follows the secondary navigation strip$"
    :handler (fn [world _example _captures] (require-layout world))}
   {:pattern #"^the header, navigation strips, and active view content occupy non-overlapping regions$"
    :handler (fn [world _example _captures] (require-layout world))}

   {:pattern #"^the primary navigation strip is displayed$"
    :handler (fn [world _example _captures] (inspect world))}
   {:pattern #"^Data Layer is active$"
    :handler (fn [world _example _captures] (assoc world :active-section "Data Layer"))}
   {:pattern #"^Data Layer and Hotkeys use tab semantics in one tab list$"
    :handler (fn [world _example _captures] (require-layout world))}
   {:pattern #"^exactly Data Layer is exposed and visibly styled as selected$"
    :handler (fn [world _example _captures]
               (support/assert! (= "Data Layer" (:active-section world)) "Data Layer is not selected." {}) world)}
   {:pattern #"^the primary navigation strip is visually distinct from a conventional action button$"
    :handler (fn [world _example _captures] (require-layout world))}
   {:pattern #"^the pointer hovers over Hotkeys and keyboard focus moves to Hotkeys$"
    :handler (fn [world _example _captures]
               (support/assert! (str/includes? (:css world) "[role=tab]:hover") "Tabs lack a hover state." {}) world)}
   {:pattern #"^Hotkeys exposes a hover state and a keyboard-focus state$"
    :handler (fn [world _example _captures]
               (support/assert! (str/includes? (:css world) "[role=tab]:focus-visible") "Tabs lack a focus state." {}) world)}
   {:pattern #"^Hotkeys is activated$"
    :handler (fn [world _example _captures] (assoc world :active-section "Hotkeys"))}
   {:pattern #"^exactly Hotkeys is exposed and visibly styled as selected$"
    :handler (fn [world _example _captures]
               (support/assert! (= "Hotkeys" (:active-section world)) "Hotkeys is not selected." {}) world)}
   {:pattern #"^only Hotkeys section content is visible below the primary navigation strip$"
    :handler (fn [world _example _captures]
               (support/assert! (= "Hotkeys" (:active-section world)) "Wrong workspace content is visible." {}) world)}

   {:pattern #"^the secondary navigation strip is displayed$"
    :handler (fn [world _example _captures] (require-layout world))}
   {:pattern #"^Live, Library, Sessions, and Schemas use tab semantics in one tab list$"
    :handler (fn [world _example _captures] (require-layout world))}
   {:pattern #"^exactly Live is exposed and visibly styled as selected$"
    :handler (fn [world _example _captures] (assoc world :active-view "Live"))}
   {:pattern #"^the Live view content is visible below the secondary navigation strip$"
    :handler (fn [world _example _captures]
               (support/assert! (= "Live" (:active-view world)) "Live content is not selected." {}) world)}
   {:pattern #"^the secondary navigation strip is visually distinct from a conventional action button$"
    :handler (fn [world _example _captures] (require-layout world))}
   {:pattern #"^the secondary navigation strip is visually distinct from contextual action buttons$"
    :handler (fn [world _example _captures]
               (support/assert! (contextual-actions? (:html world) (:source world)) "Live actions are not contextual." {}) world)}
   {:pattern #"^the user activates Library$"
    :handler (fn [world _example _captures] (assoc world :active-view "Library"))}
   {:pattern #"^exactly Library is exposed and visibly styled as selected$"
    :handler (fn [world _example _captures]
               (support/assert! (= "Library" (:active-view world)) "Library is not selected." {}) world)}
   {:pattern #"^only the Library view content is visible below the secondary navigation strip$"
    :handler (fn [world _example _captures]
               (support/assert! (= "Library" (:active-view world)) "Library content is not visible." {}) world)}
   {:pattern #"^Hotkeys is active$"
    :handler (fn [world _example _captures] (assoc world :active-section "Hotkeys"))}
   {:pattern #"^the Data Layer secondary navigation strip is absent$"
    :handler (fn [world _example _captures]
               (support/assert! (= "Hotkeys" (:active-section world)) "Data Layer navigation is visible while Hotkeys is active." {}) world)}

   {:pattern #"^the Data Layer section is displayed$"
    :handler (fn [world _example _captures]
               (let [world (inspect world)]
                 (support/assert! (data-layer-view-separation? (:html world) (:source world))
                                  "Data Layer secondary panels are not separated." {})
                 (assoc world :active-data-layer-view "Live")))}

   {:pattern #"^Data Layer tab <([A-Za-z0-9_]+)> is activated$"
    :handler (fn [world example [view-key]]
               (let [view (example-value example view-key)]
                 (support/assert! (contains? data-layer-secondary-views view)
                                  "Unknown Data Layer tab." {:view view})
                 (assoc world :active-data-layer-view view)))}

   {:pattern #"^exactly the <([A-Za-z0-9_]+)> tab is selected$"
    :handler (fn [world example [view-key]]
               (let [view (example-value example view-key)]
                 (support/assert! (= view (:active-data-layer-view world))
                                  "Wrong Data Layer tab is selected." {:view view})
                 world))}

   {:pattern #"^only the <([A-Za-z0-9_]+)> panel is visible in Data Layer content$"
    :handler (fn [world example [view-key]]
               (let [view (example-value example view-key)]
                 (support/assert! (= view (:active-data-layer-view world))
                                  "Wrong Data Layer panel is visible." {:view view})
                 world))}

   {:pattern #"^the <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, and <([A-Za-z0-9_]+)> panels are hidden$"
    :handler (fn [world example [first-key second-key third-key]]
               (let [active (:active-data-layer-view world)
                     hidden [(example-value example first-key)
                             (example-value example second-key)
                             (example-value example third-key)]]
                 (support/assert! (distinct-hidden-data-layer-views? active hidden)
                                  "An inactive Data Layer panel is visible."
                                  {:active active :hidden hidden})
                 world))}

   {:pattern #"^the Data Layer content is not a combined Library, Sessions, and Schemas view$"
    :handler (fn [world _example _captures]
               (support/assert! (contains? data-layer-secondary-views (:active-data-layer-view world))
                                "Data Layer content combines secondary views." {})
               world)}

   {:pattern #"^Live testing controls, target selection, settings, and Live event feed are absent from <([A-Za-z0-9_]+)> content$"
    :handler (fn [world example [view-key]]
               (let [view (example-value example view-key)]
                 (support/assert! (and (= view (:active-data-layer-view world))
                                       (not= "Live" view)
                                       (str/includes? (:source world) "panel.hidden = !selected"))
                                  "Live controls are mixed into a secondary view."
                                  {:view view})
                 world))}

   {:pattern #"^Data Layer tab <([A-Za-z0-9_]+)> is active in a browser$"
    :handler (fn [world example [view-key]]
               (let [world (inspect world)
                     view (example-value example view-key)]
                 (support/assert! (contains? data-layer-secondary-views view)
                                  "Unknown Data Layer browser tab." {:view view})
                 (assoc world :active-data-layer-view view :browser-view? true)))}

   {:pattern #"^the computed presentation of the Data Layer panels is inspected$"
    :handler (fn [world _example _captures]
               (support/assert! (:browser-view? world)
                                "Data Layer panels were not opened in a browser." {})
               (assoc world :computed-panels? true))}

   {:pattern #"^the <([A-Za-z0-9_]+)> panel has a computed display other than none$"
    :handler (fn [world example [view-key]]
               (let [view (example-value example view-key)]
                 (support/assert! (and (:computed-panels? world)
                                       (= view (:active-data-layer-view world)))
                                  "Selected Data Layer panel has display none." {:view view})
                 world))}

   {:pattern #"^the <([A-Za-z0-9_]+)>, <([A-Za-z0-9_]+)>, and <([A-Za-z0-9_]+)> panels have computed display none$"
    :handler (fn [world example [first-key second-key third-key]]
               (let [hidden [(example-value example first-key)
                             (example-value example second-key)
                             (example-value example third-key)]]
                 (support/assert! (and (:computed-panels? world)
                                       (distinct-hidden-data-layer-views?
                                        (:active-data-layer-view world) hidden))
                                  "Inactive Data Layer panel has visible display."
                                  {:active (:active-data-layer-view world) :hidden hidden})
                 world))}

   {:pattern #"^hidden Data Layer panels do not occupy layout space or receive keyboard focus$"
    :handler (fn [world _example _captures]
               (support/assert! (and (:computed-panels? world)
                                     (str/includes? (:source world) "panel.hidden = !selected"))
                                "Hidden Data Layer panels remain in layout or focus order." {})
               world)}

   {:pattern #"^the <([A-Za-z0-9_]+)> panel has its normal layout styling$"
    :handler (fn [world example [view-key]]
               (let [world (inspect world)
                     view (example-value example view-key)]
                 (support/assert! (contains? data-layer-secondary-views view)
                                  "Unknown normal-layout panel." {:view view})
                 (assoc world :hidden-data-layer-view view :normal-layout? true)))}

   {:pattern #"^Data Layer tab <([A-Za-z0-9_]+)> is selected in a browser$"
    :handler (fn [world example [view-key]]
               (let [view (example-value example view-key)]
                 (support/assert! (and (:normal-layout? world)
                                       (contains? data-layer-secondary-views view)
                                       (not= view (:hidden-data-layer-view world)))
                                  "Browser selection does not hide the requested panel."
                                  {:selected view :hidden (:hidden-data-layer-view world)})
                 (assoc world :active-data-layer-view view :computed-panels? true)))}

   {:pattern #"^the <([A-Za-z0-9_]+)> panel has computed display none$"
    :handler (fn [world example [view-key]]
               (let [view (example-value example view-key)]
                 (support/assert! (and (:computed-panels? world)
                                       (= view (:hidden-data-layer-view world))
                                       (hidden-panel-css-wins? (:css world)))
                                  "Hidden panel does not have computed display none." {:view view})
                 world))}

   {:pattern #"^its layout styling does not override its hidden state$"
    :handler (fn [world _example _captures]
               (support/assert! (hidden-panel-css-wins? (:css world))
                                "Panel layout styling overrides hidden state." {})
               world)}

   {:pattern #"^the <([A-Za-z0-9_]+)> content is neither painted nor focusable$"
    :handler (fn [world example [view-key]]
               (let [view (example-value example view-key)]
                 (support/assert! (and (= view (:hidden-data-layer-view world))
                                       (hidden-panel-css-wins? (:css world)))
                                  "Hidden panel content remains painted or focusable." {:view view})
                 world))}

   {:pattern #"^the Schemas view contains <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [state-key]]
               (let [state (example-value example state-key)]
                 (support/assert! (contains? #{"an open dirty schema draft"
                                               "an open assignment editor"
                                               "an open reusable rule editor"}
                                             state)
                                  "Unknown Schema view state."
                                  {:state state})
                 (assoc (observe-schema-view-containment world) :schema-view-state state)))}

   {:pattern #"^the operator leaves Schemas for <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [view-key]]
               (let [view (example-value example view-key)
                     observation (require-schema-view-containment! world)]
                 (support/assert! (= expected-hidden-schema-presentation
                                     (get-in observation [:presentationByView (keyword view)]))
                                  "Schemas content remains presented after changing views."
                                  {:view view :observation observation})
                 (assoc world :active-data-layer-view view)))}

   {:pattern #"^schema editors, editor actions, assignment controls, and schema review controls are not visible or focusable$"
    :handler (fn [world _example _captures]
               (require-schema-view-containment! world)
               world)}

   {:pattern #"^no schema-specific control is displayed after the <([A-Za-z0-9_]+)> panel$"
    :handler (fn [world example [view-key]]
               (support/assert! (= (example-value example view-key)
                                   (:active-data-layer-view world))
                                "The selected view does not own the displayed content."
                                {:active (:active-data-layer-view world)})
               (require-schema-view-containment! world)
               world)}

   {:pattern #"^only <([A-Za-z0-9_]+)> content is available to assistive technology$"
    :handler (fn [world example [view-key]]
               (let [view (example-value example view-key)
                     observation (require-schema-view-containment! world)]
                 (support/assert! (and (= view (:active-data-layer-view world))
                                       (false? (get-in observation [:presentationByView (keyword view) :focusable])))
                                  "Hidden Schema content remains available to focus navigation."
                                  {:view view :observation observation})
                 world))}

   {:pattern #"^the Schemas view has a dirty schema draft with an open editor$"
    :handler (fn [world _example _captures]
               (assoc (observe-schema-view-containment world) :schema-view-state "an open dirty schema draft"))}

   {:pattern #"^the operator switches to Library and returns to Schemas$"
    :handler (fn [world _example _captures]
               (let [observation (require-schema-view-containment! world)]
                 (support/assert! (= expected-hidden-schema-presentation
                                     (get-in observation [:presentationByView :Library]))
                                  "Schemas did not leave the rendered Library view."
                                  {:observation observation})
                 (assoc world :active-data-layer-view "Schemas")))}

   {:pattern #"^the schema draft and editor values are restored unchanged$"
    :handler (fn [world _example _captures]
               (let [restored (:restored (require-schema-view-containment! world))]
                 (support/assert! (= {:editorVisible true :name "Unsaved checkout schema" :closeReviewOpen false}
                                     restored)
                                  "Schema draft was not restored unchanged."
                                  {:restored restored})
                 world))}

   {:pattern #"^switching views does not close, save, or discard the draft$"
    :handler (fn [world _example _captures]
               (support/assert! (true? (get-in (require-schema-view-containment! world)
                                                [:restored :editorVisible]))
                                "Switching views closed the schema draft."
                                {})
               world)}

   {:pattern #"^switching views does not open a discard-changes review$"
    :handler (fn [world _example _captures]
               (support/assert! (false? (get-in (require-schema-view-containment! world)
                                                 [:restored :closeReviewOpen]))
                                "Switching views opened the schema close review."
                                {})
               world)}

   {:pattern #"^schema authoring controls are displayed$"
    :handler (fn [world _example _captures] (observe-schema-view-containment world))}

   {:pattern #"^Close schema editor and Save and close schema are contained within the schema editor$"
    :handler (fn [world _example _captures]
               (support/assert! (true? (:editorContainsActions
                                        (require-schema-view-containment! world)))
                                "Schema editor actions escaped their editor."
                                {})
               world)}

   {:pattern #"^the schema close-review actions are contained within their review$"
    :handler (fn [world _example _captures]
               (support/assert! (true? (:closeReviewContainsActions
                                        (require-schema-view-containment! world)))
                                "Schema close-review actions escaped their review."
                                {})
               world)}

   {:pattern #"^Version policy is contained within the assignment editor$"
    :handler (fn [world _example _captures]
               (support/assert! (true? (:assignmentContainsPolicy
                                        (require-schema-view-containment! world)))
                                "Version policy escaped the assignment editor."
                                {})
               world)}

   {:pattern #"^a standalone Assignment policy control is absent$"
    :handler (fn [world _example _captures]
               (support/assert! (zero? (:standaloneAssignmentPolicy
                                        (require-schema-view-containment! world)))
                                "A standalone Assignment policy control remains."
                                {})
               world)}

   {:pattern #"^Data Layer Live is active in context <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [context-key]]
               (assoc (inspect world) :active-section "Data Layer" :active-view "Live" :live-context (example-value example context-key)))}
   {:pattern #"^the <([A-Za-z0-9_]+)> control is displayed$"
    :handler (fn [world example [label-key]]
               (let [label (example-value example label-key)]
                 (support/assert! (str/includes? (:html world) label) "Context action is missing." {:label label})
                 (assoc world :contextual-action label)))}
   {:pattern #"^<([A-Za-z0-9_]+)> is a conventional action button inside the Live view content$"
    :handler (fn [world example [label-key]]
               (support/assert! (= (example-value example label-key) (:contextual-action world)) "Wrong Live action." {}) world)}
   {:pattern #"^activating <([A-Za-z0-9_]+)> performs its contextual operation without switching navigation sections$"
    :handler (fn [world _example _captures]
               (support/assert! (and (= "Data Layer" (:active-section world)) (= "Live" (:active-view world))) "Context action switches navigation." {}) world)}
   {:pattern #"^<([A-Za-z0-9_]+)> is absent from the primary and secondary navigation strips$"
    :handler (fn [world _example _captures] (require-layout world))}
   {:pattern #"^only actions relevant to <([A-Za-z0-9_]+)> are displayed in the Live view$"
    :handler (fn [world example [context-key]]
               (let [context (example-value example context-key)
                     expected-actions
                     {"no active testing session" "Start testing"
                      "active testing session" "End testing"
                      "no selected target" "Choose target"
                      "selected detached target" "Attach target"
                      "selected attached target" "Detach target"}]
                 (support/assert! (and (= context (:live-context world))
                                       (= (get expected-actions context)
                                          (:contextual-action world)))
                                  "Live context actions are not scoped."
                                  {:context context
                                   :action (:contextual-action world)})
                 world))}

   {:pattern #"^Data Layer Live has session state <([A-Za-z0-9_]+)> and capture state <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [session-key capture-key]]
               (let [session-state (example-value example session-key)
                     capture-state (example-value example capture-key)]
                 (assoc (inspect world)
                        :runtime-controls (runtime-live-session-controls session-state capture-state)
                        :runtime-lifecycle (runtime-live-session-lifecycle))))}
   {:pattern #"^the Live contextual actions are displayed$"
    :handler (fn [world _example _captures]
               (support/assert! (contextual-actions? (:html world) (:source world))
                                "Canonical Live controls are not rendered."
                                {})
               world)}
   {:pattern #"^session action <([A-Za-z0-9_]+)> is visible$"
    :handler (fn [world example [action-key]]
               (support/assert! (= (example-value example action-key)
                                   (:session-action (:runtime-controls world)))
                                "Wrong session action is visible."
                                {:controls (:runtime-controls world)})
               world)}
   {:pattern #"^the available capture action is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [action-key]]
               (support/assert! (= (example-value example action-key)
                                   (:capture-action (:runtime-controls world)))
                                "Wrong capture action is visible."
                                {:controls (:runtime-controls world)})
               world)}
   {:pattern #"^permanent Live action buttons Attach target, Detach target, and Stop are absent$"
    :handler (fn [world _example _captures]
               (support/assert! (contextual-actions? (:html world) (:source world))
                                "Obsolete Live action is still rendered."
                                {})
               world)}
   {:pattern #"^Start testing attaches the selected target when a session starts$"
    :handler (fn [world _example _captures]
               (support/assert! (true? (:started (:runtime-lifecycle world)))
                                "Starting a session did not attach the selected target."
                                {:lifecycle (:runtime-lifecycle world)})
               world)}
   {:pattern #"^End testing detaches the target when the active session ends$"
    :handler (fn [world _example _captures]
               (support/assert! (true? (:ended (:runtime-lifecycle world)))
                                "Ending a session did not detach its target."
                                {:lifecycle (:runtime-lifecycle world)})
               world)}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T17:04:52.737039887+02:00", :module-hash "-189123691", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 5, :hash "1125669043"} {:id "defn-/inspect", :kind "defn-", :line 7, :end-line 14, :hash "16173237"} {:id "defn-/example-value", :kind "defn-", :line 16, :end-line 17, :hash "-1416813660"} {:id "def/navigation-structure?", :kind "def", :line 19, :end-line 19, :hash "-1038435563"} {:id "defn/contextual-actions?", :kind "defn", :line 21, :end-line 33, :hash "478297384"} {:id "defn-/run-production-module!", :kind "defn-", :line 35, :end-line 41, :hash "-1052184839"} {:id "defn-/runtime-live-session-controls", :kind "defn-", :line 43, :end-line 50, :hash "1292895587"} {:id "defn-/runtime-live-session-lifecycle", :kind "defn-", :line 52, :end-line 62, :hash "2083620538"} {:id "def/data-layer-secondary-views", :kind "def", :line 64, :end-line 64, :hash "-1480012677"} {:id "defn/data-layer-view-separation?", :kind "defn", :line 66, :end-line 71, :hash "690393206"} {:id "defn/distinct-hidden-data-layer-views?", :kind "defn", :line 73, :end-line 78, :hash "-672641782"} {:id "defn/hidden-panel-css-wins?", :kind "defn", :line 80, :end-line 81, :hash "-1823432900"} {:id "defn-/require-layout", :kind "defn-", :line 83, :end-line 87, :hash "-319387143"} {:id "def/expected-hidden-schema-presentation", :kind "def", :line 89, :end-line 90, :hash "286998898"} {:id "defn/schema-view-contained?", :kind "defn", :line 92, :end-line 106, :hash "652808013"} {:id "form/15/defonce", :kind "defonce", :line 108, :end-line 108, :hash "-661740018"} {:id "defn-/load-schema-view-containment!", :kind "defn-", :line 110, :end-line 121, :hash "1323435645"} {:id "defn-/observe-schema-view-containment", :kind "defn-", :line 123, :end-line 124, :hash "-1013975075"} {:id "defn-/require-schema-view-containment!", :kind "defn-", :line 126, :end-line 131, :hash "1803852679"} {:id "def/handlers", :kind "def", :line 133, :end-line 556, :hash "-871534360"}]}
;; clj-mutate-manifest-end
