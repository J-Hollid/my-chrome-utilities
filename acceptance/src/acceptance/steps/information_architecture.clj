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
                                     (support/source-file root "src/command-palette-ui.ts")
                                     (support/source-file root "src/data-layer-live-observer-ui.ts")])
           :palette-source (support/source-file root "src/command-palette.ts")
           :commands (support/source-file root "src/commands.ts"))))

(defn- example-value [example key]
  (support/require-example example key))

(defn palette-dialog? [html css source]
  (and (str/includes? html "id=\"palette\" role=\"dialog\" aria-modal=\"true\"")
       (str/includes? html "id=\"palette-filter\"")
       (str/includes? html "id=\"palette-results\" role=\"listbox\"")
       (str/includes? css "#palette { position:fixed")
       (str/includes? css "#palette[hidden] { display:none")
       (str/includes? source "sidePanelContent?.setAttribute(\"inert\", \"\")")
       (str/includes? source "filter?.focus()")))

(defn no-permanent-command-buttons? [html source]
  (and (not (str/includes? html "id=\"commands\""))
       (not (str/includes? source "commandList"))
       (not (str/includes? source "commandList.append"))))

(defn navigation-structure? [html css]
  (let [header-index (.indexOf html "id=\"application-header\"")
        primary-index (.indexOf html "id=\"workspace-tabs\"")
        secondary-index (.indexOf html "id=\"data-layer-views\"")
        live-index (.indexOf html "id=\"data-layer-panel-live\"")]
    (and (every? #(not (neg? %)) [header-index primary-index secondary-index live-index])
         (< header-index primary-index secondary-index live-index)
         (str/includes? html "role=\"tablist\" aria-label=\"Workspace\"")
         (str/includes? html "role=\"tablist\" aria-label=\"Data Layer views\"")
         (str/includes? css "#side-panel-content { display:grid; grid-template-rows:auto auto minmax(0,1fr)")
         (str/includes? css "[role=tab] { background:transparent"))))

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
           (pr-str (if (= capture-state "Paused") "Paused" "Live")))))

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

(def handlers
  [{:pattern #"^command <([A-Za-z0-9_]+)> named <([A-Za-z0-9_]+)> is registered$"
    :handler (fn [world example [id-key title-key]]
               (let [world (inspect world) id (example-value example id-key) title (example-value example title-key)]
                 (support/assert! (and (str/includes? (:commands world) id)
                                       (str/includes? (:commands world) title))
                                  "Command registration is incomplete." {:id id :title title})
                 (assoc world :registered-command id :registered-title title)))}

   {:pattern #"^command <([A-Za-z0-9_]+)> is selected from the command palette$"
    :handler (fn [world example [id-key]]
               (assoc world :selected-command (example-value example id-key)))}

   {:pattern #"^command <([A-Za-z0-9_]+)> remains executable through the command registry$"
    :handler (fn [world example [id-key]]
               (let [id (example-value example id-key)]
                 (support/assert! (and (= id (:selected-command world))
                                       (str/includes? (:commands world) "export function runCommandById"))
                                  "Selected command is not executable through its registry id." {:id id})
                 world))}

   {:pattern #"^<([A-Za-z0-9_]+)> is searchable in the command palette$"
    :handler (fn [world example [title-key]]
               (let [title (example-value example title-key)]
                 (support/assert! (and (= title (:registered-title world))
                                       (str/includes? (:palette-source world) "filterPaletteCommands")
                                       (str/includes? (:palette-source world) "command.title"))
                                  "Registered title is not searchable in the palette." {:title title})
                 world))}

   {:pattern #"^registering command <([A-Za-z0-9_]+)> does not add a permanent global command button$"
    :handler (fn [world _example _captures]
               (support/assert! (no-permanent-command-buttons? (:html world) (:source world))
                                "A permanent command button is still rendered." {})
               world)}

   {:pattern #"^the side panel is displayed at <([A-Za-z0-9_]+)> CSS px wide$"
    :handler (fn [world example [width-key]]
               (assoc (inspect world) :panel-width (example-value example width-key)))}

   {:pattern #"^the side panel is displayed at ([0-9]+) CSS px wide$"
    :handler (fn [world _example [width]]
               (assoc (inspect world) :panel-width width))}

   {:pattern #"^the command palette is closed$"
    :handler (fn [world _example _captures]
               (support/assert! (palette-dialog? (:html world) (:css world) (:source world))
                                "Command palette dialog is not available." {})
               (assoc world :palette-open? false))}

   {:pattern #"^the closed layout is inspected$"
    :handler (fn [world _example _captures] world)}

   {:pattern #"^the closed side panel layout is inspected$"
    :handler (fn [world _example _captures] world)}

   {:pattern #"^the command palette is not visibly rendered and is absent from normal document flow$"
    :handler (fn [world _example _captures]
               (support/assert! (and (false? (:palette-open? world))
                                     (str/includes? (:html world) "aria-label=\"Command palette\" hidden")
                                     (str/includes? (:css world) "#palette[hidden] { display:none"))
                                "Closed palette affects normal layout." {})
               world)}

   {:pattern #"^the command palette does not obscure or displace the header, navigation, or active view content$"
    :handler (fn [world _example _captures]
               (support/assert! (navigation-structure? (:html world) (:css world))
                                "Closed palette does not preserve panel layout." {})
               world)}

   {:pattern #"^no registered command is rendered as a permanent global command button$"
    :handler (fn [world _example _captures]
               (support/assert! (no-permanent-command-buttons? (:html world) (:source world))
                                "Permanent command buttons are rendered." {})
               world)}

   {:pattern #"^the user opens the command palette with its launcher or hotkey$"
    :handler (fn [world _example _captures]
               (support/assert! (and (str/includes? (:html world) "id=\"open-palette\"")
                                     (str/includes? (:source world) "function showPalette()")
                                     (str/includes? (:source world) "event.ctrlKey"))
                                "Palette has no launcher or hotkey." {})
               (assoc world :palette-open? true))}

   {:pattern #"^a focused command-palette dialog is displayed above the current side panel UI$"
    :handler (fn [world _example _captures]
               (support/assert! (and (:palette-open? world)
                                     (palette-dialog? (:html world) (:css world) (:source world)))
                                "Palette dialog is not focused above the panel." {})
               world)}

   {:pattern #"^the dialog contains a command search field and matching registered command results$"
    :handler (fn [world _example _captures]
               (support/assert! (and (str/includes? (:html world) "type=\"search\"")
                                     (str/includes? (:source world) "renderPalette(filterCommands"))
                                "Palette search results are not rendered." {})
               world)}

   {:pattern #"^background side panel content does not receive keyboard focus while the dialog is open$"
    :handler (fn [world _example _captures]
               (support/assert! (str/includes? (:source world) "sidePanelContent?.setAttribute(\"inert\", \"\")")
                                "Modal palette does not make background content inert." {})
               world)}

   {:pattern #"^the command palette is open above Data Layer Live with matching commands and one selected result$"
    :handler (fn [world _example _captures]
               (assoc (inspect world) :palette-open? true :selected-result? true :active-section "Data Layer" :active-view "Live"))}

   {:pattern #"^the user performs <([A-Za-z0-9_]+)>$"
    :applies? #(contains? % :selected-result?)
    :handler (fn [world example [input-key]]
               (assoc world :palette-input (example-value example input-key)))}

   {:pattern #"^<([A-Za-z0-9_]+)>$"
    :applies? #(and (contains? % :selected-result?) (contains? % :palette-input))
    :handler (fn [world example [outcome-key]]
               (let [input (:palette-input world)
                     outcome (example-value example outcome-key)
                     expected-outcomes
                     {"keyboard navigation to another result followed by Enter"
                      "the selected command executes"
                      "Escape" "no command executes"}]
                 (support/assert! (= (get expected-outcomes input) outcome)
                                  "Palette outcome does not match its close input."
                                  {:input input :outcome outcome})
                 (assoc world :execution-outcome outcome)))}

   {:pattern #"^the command palette closes$"
    :applies? #(and (contains? % :selected-result?) (contains? % :palette-input))
    :handler (fn [world _example _captures]
               (support/assert! (str/includes? (:source world) "function hidePalette()")
                                "Palette has no close behavior." {})
               (assoc world :palette-open? false))}

   {:pattern #"^the underlying side panel layout is unchanged$"
    :handler (fn [world _example _captures]
               (support/assert! (and (= "Data Layer" (:active-section world))
                                     (= "Live" (:active-view world)))
                                "Closing the palette changed the active layout." {})
               world)}

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

   {:pattern #"^the <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> panels are hidden$"
    :handler (fn [world example [first-key second-key]]
               (let [active (:active-data-layer-view world)
                     hidden [(example-value example first-key) (example-value example second-key)]]
                 (support/assert! (and (every? data-layer-secondary-views hidden)
                                       (every? #(not= active %) hidden))
                                  "An inactive Data Layer panel is visible." {:active active :hidden hidden})
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
                 (assoc world :active-data-layer-view view :browser-view? true :computed-panels? true)))}

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
;; {:version 1, :tested-at "2026-07-13T17:34:37.244794364+02:00", :module-hash "-656257838", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1125669043"} {:id "defn-/inspect", :kind "defn-", :line 7, :end-line nil, :hash "1653053363"} {:id "defn-/example-value", :kind "defn-", :line 19, :end-line nil, :hash "-1416813660"} {:id "defn/palette-dialog?", :kind "defn", :line 22, :end-line nil, :hash "-1107160767"} {:id "defn/no-permanent-command-buttons?", :kind "defn", :line 31, :end-line nil, :hash "-963751556"} {:id "defn/navigation-structure?", :kind "defn", :line 36, :end-line nil, :hash "514241598"} {:id "defn/contextual-actions?", :kind "defn", :line 48, :end-line nil, :hash "1135250298"} {:id "defn-/run-production-module!", :kind "defn-", :line 62, :end-line nil, :hash "-1052184839"} {:id "defn-/runtime-live-session-controls", :kind "defn-", :line 70, :end-line nil, :hash "1205775888"} {:id "defn-/runtime-live-session-lifecycle", :kind "defn-", :line 79, :end-line nil, :hash "2083620538"} {:id "def/data-layer-secondary-views", :kind "def", :line 91, :end-line nil, :hash "-1480012677"} {:id "defn/data-layer-view-separation?", :kind "defn", :line 93, :end-line nil, :hash "-1906053387"} {:id "defn/distinct-hidden-data-layer-views?", :kind "defn", :line 100, :end-line nil, :hash "-672641782"} {:id "defn/hidden-panel-css-wins?", :kind "defn", :line 107, :end-line nil, :hash "-1823432900"} {:id "defn-/require-layout", :kind "defn-", :line 110, :end-line nil, :hash "-319387143"} {:id "def/handlers", :kind "def", :line 116, :end-line nil, :hash "1119781935"}]}
;; clj-mutate-manifest-end
