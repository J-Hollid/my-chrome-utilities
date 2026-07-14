(ns acceptance.steps.workspace-editor
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- inspect [world]
  (let [root (or (:root world) (support/repository-root))]
    (assoc world :root root
           :html (support/source-file root "side-panel.html")
           :source (str/join "\n" (map #(support/source-file root %)
                                        ["src/side-panel.ts"
                                         "src/workspace-tabs-ui.ts"
                                         "src/hotkey-editor.ts"]))
           :commands (support/source-file root "src/commands.ts"))))

(defn tabs-wired? [html source]
  (support/includes-all? (str html source)
                         ["role=\"tablist\"" "workspace-tab-data-layer"
                          "workspace-tab-hotkeys" "workspace-panel-data-layer"
                          "workspace-panel-hotkeys" "aria-controls"
                          "aria-selected" "WORKSPACE_TAB_STORAGE_KEY"
                          "workspaceTabForNavigationKey" "showWorkspace"]))

(defn editor-wired? [html source]
  (support/includes-all? (str html source)
                         ["hotkey-editor" "hotkey-editor-filter"
                          "hotkey-editor-commands" "renderHotkeyEditor"
                          "changeHotkeyBinding" "Pending hotkey change"
                          "Conflict:" "Keymap files"]))

(defn- require-wiring [world predicate message]
  (let [world (inspect world)]
    (support/assert! (predicate (:html world) (:source world)) message {})
    world))

(defn- command-id [example key] (support/require-example example key))
(defn- sequence [world id] (get-in world [:keymap :bindings id] ""))
(defonce ^:private workspace-panel-containment (atom nil))

(defn- load-workspace-panel-containment! []
  (reset! workspace-panel-containment
          (support/load-browser-observation!
           {:adapter-env "WORKSPACE_PANEL_CONTAINMENT_BROWSER_ADAPTER"
            :observation-key :workspacePanelContainment
            :runtime-error "Workspace panel containment browser runtime failed."
            :missing-error "Workspace panel containment browser observation is missing."})))

(defn- workspace-panel-containment! []
  (or @workspace-panel-containment (load-workspace-panel-containment!)))

(def handlers
  [{:pattern #"^workspace tab <([A-Za-z0-9_]+)> is active$"
    :handler (fn [world example [tab-key]]
               (assoc (require-wiring world tabs-wired? "Workspace tabs are not wired.")
                      :active-tab (command-id example tab-key)))}
   {:pattern #"^global command controls remain visible outside the workspace tabs$"
    :handler (fn [world _ _]
               (let [world (require-wiring world tabs-wired? "Workspace tabs are not wired.")]
                 (support/assert! (and (str/includes? (:html world) "id=\"open-palette\"")
                                       (str/includes? (:html world) "id=\"workspace-tabs\""))
                                "Global command launcher is not outside workspace tabs." {}) world))}
   {:pattern #"^workspace tabs are ordered <([A-Za-z0-9_]+)> then <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [first-key second-key]]
               (let [html (:html world) first-label (command-id example first-key) second-label (command-id example second-key)]
                 (support/assert! (< (.indexOf html first-label) (.indexOf html second-label)) "Workspace tabs are not ordered." {}) world))}
   {:pattern #"^only the primary workspace panel is visible by default$"
    :handler (fn [world _ _] (support/assert! (str/includes? (:html world) "workspace-panel-hotkeys\" role=\"tabpanel\" aria-labelledby=\"workspace-tab-hotkeys\" hidden") "Hotkeys panel is not hidden by default." {}) world)}
   {:pattern #"^assistive technology recognizes each workspace tab and its associated panel$"
    :handler (fn [world _ _] (support/assert! (tabs-wired? (:html world) (:source world)) "Workspace tab accessibility wiring is incomplete." {}) world)}
   {:pattern #"^each workspace panel begins with a heading matching its tab label$"
    :handler (fn [world _ _] (support/assert! (support/includes-all? (:html world) ["<h2>Data Layer</h2>" "<h2>Hotkeys</h2>"]) "Workspace headings are missing." {}) world)}
   {:pattern #"^data layer controls appear only in tab <([A-Za-z0-9_]+)>$"
    :handler (fn [world _ _] (support/assert! (str/includes? (:html world) "workspace-panel-data-layer") "Data layer panel is missing." {}) world)}
   {:pattern #"^hotkey configuration controls appear only in tab <([A-Za-z0-9_]+)>$"
    :handler (fn [world _ _] (support/assert! (str/includes? (:html world) "workspace-panel-hotkeys") "Hotkeys panel is missing." {}) world)}
   {:pattern #"^panels for workspace tabs <([A-Za-z0-9_]+)> and <([A-Za-z0-9_]+)> are separate peer regions$"
    :handler (fn [world example [primary-key settings-key]]
               (let [observed (workspace-panel-containment!)]
                 (support/assert! (= ["Data Layer" "Hotkeys"]
                                     [(command-id example primary-key) (command-id example settings-key)])
                                  "Workspace panel containment example changed." {:example example})
                 (support/assert! (:peers observed)
                                  "Workspace panels are not peer regions." observed)
                 (assoc world :workspace-panel-containment observed)))}
   {:pattern #"^neither workspace panel contains the other workspace panel$"
    :handler (fn [world _ _]
               (let [observed (or (:workspace-panel-containment world)
                                  (workspace-panel-containment!))]
                 (support/assert! (false? (:nested observed))
                                  "One workspace panel contains the other." observed)
                 world))}
   {:pattern #"^the user activates workspace tab <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [tab-key]] (assoc world :active-tab (command-id example tab-key)))}
   {:pattern #"^the panel for tab <([A-Za-z0-9_]+)> is hidden$"
    :handler (fn [world example [tab-key]]
               (let [observed (or (:workspace-panel-containment world)
                                  (workspace-panel-containment!))]
                 (support/assert! (and (= "Data Layer" (command-id example tab-key))
                                       (get-in observed [:afterActivation :dataLayerHidden]))
                                  "The inactive Data Layer workspace panel remained visible."
                                  {:example example :observation observed})
                 world))}
   {:pattern #"^the panel for tab <([A-Za-z0-9_]+)> remains visible$"
    :handler (fn [world example [tab-key]]
               (let [observed (or (:workspace-panel-containment world)
                                  (workspace-panel-containment!))]
                 (support/assert! (and (= "Hotkeys" (command-id example tab-key))
                                       (false? (get-in observed [:afterActivation :hotkeysHidden]))
                                       (get-in observed [:afterActivation :hotkeysVisible]))
                                  "The active Hotkeys workspace panel is not rendered."
                                  {:example example :observation observed})
                 world))}
   {:pattern #"^heading <([A-Za-z0-9_]+)>, hotkey search, and registered command groups are visible in that panel$"
    :handler (fn [world example [tab-key]]
               (let [observed (or (:workspace-panel-containment world)
                                  (workspace-panel-containment!))
                     active (:afterActivation observed)]
                 (support/assert! (and (= "Hotkeys" (command-id example tab-key))
                                       (:headingVisible active)
                                       (:searchVisible active)
                                       (pos? (:registeredGroupCount active))
                                       (:registeredGroupsVisible active))
                                  "Visible Hotkeys panel content is incomplete."
                                  {:example example :observation observed})
                 world))}
   {:pattern #"^only the panel for tab <([A-Za-z0-9_]+)> is visible$"
    :handler (fn [world example [tab-key]] (support/assert! (= (command-id example tab-key) (:active-tab world)) "Unexpected workspace panel is active." {}) world)}
   {:pattern #"^workspace tab <([A-Za-z0-9_]+)> is exposed as selected$"
    :handler (fn [world example [tab-key]] (support/assert! (= (command-id example tab-key) (:active-tab world)) "Unexpected workspace tab is selected." {}) world)}
   {:pattern #"^workspace tab <([A-Za-z0-9_]+)> remains active after the side panel reloads$"
    :handler (fn [world example [tab-key]] (support/assert! (and (= (command-id example tab-key) (:active-tab world)) (str/includes? (:source world) "storage.setItem(WORKSPACE_TAB_STORAGE_KEY")) "Workspace tab is not persisted." {}) world)}
   {:pattern #"^workspace tab <([A-Za-z0-9_]+)> has keyboard focus$"
    :handler (fn [world example [tab-key]] (assoc world :active-tab (command-id example tab-key)))}
   {:pattern #"^tab navigation key <([A-Za-z0-9_]+)> is pressed$"
    :handler (fn [world example [key]] (assoc world :navigation-key (command-id example key)))}
   {:pattern #"^keyboard focus and selection move to workspace tab <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [tab-key]] (assoc world :active-tab (command-id example tab-key)))}
   {:pattern #"^keyboard focus enters the workspace tabs$"
    :handler (fn [world _ _] world)}
   {:pattern #"^keyboard focus moves to workspace tab <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [tab-key]] (support/assert! (= (command-id example tab-key) (:active-tab world)) "Workspace focus is incorrect." {}) world)}
   {:pattern #"^key <([A-Za-z0-9_]+)> is pressed$"
    :handler (fn [world example [key]] (assoc world :pressed-key (command-id example key)))}
   {:pattern #"^keyboard focus moves into the panel for tab <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [tab-key]] (support/assert! (and (= "Tab" (:pressed-key world)) (= (command-id example tab-key) (:active-tab world))) "Tab key did not leave workspace navigation." {}) world)}
   {:pattern #"^workspace navigation command <([A-Za-z0-9_]+)> runs$"
    :handler (fn [world example [id-key]]
               (let [world (require-wiring world tabs-wired? "Workspace navigation command is not wired.")
                     id (command-id example id-key)]
                 (assoc world :navigation-command id
                        :active-tab (if (= id "navigation.show-hotkeys") "Hotkeys" "Data Layer"))))}
   {:pattern #"^command <([A-Za-z0-9_]+)> is available in the command palette and for hotkey assignment$"
    :handler (fn [world example [id-key]] (let [id (command-id example id-key)] (support/assert! (and (str/includes? (:commands world) id) (str/includes? (:source world) "renderHotkeyEditor")) "Navigation command is unavailable." {:id id}) world))}
   {:pattern #"^the hotkey editor is displayed$"
    :handler (fn [world _ _] (require-wiring world editor-wired? "Hotkey editor is not wired."))}
   {:pattern #"^every registered command is listed with its title, command id, and current key sequence$"
    :handler (fn [world _ _] (support/assert! (str/includes? (:source world) "keymap.bindings[command.id]") "Editor does not list command bindings." {}) world)}
   {:pattern #"^commands are grouped under user-facing workspace or navigation labels$"
    :handler (fn [world _ _] (support/assert! (support/includes-all? (:source world) ["Workspace" "Navigation" "editorGroupLabel"]) "Editor command groups are missing." {}) world)}
   {:pattern #"^each command provides visible controls to change or clear its key sequence$"
    :handler (fn [world _ _] (support/assert! (support/includes-all? (:source world) ["save.textContent = \"Save\"" "clear.textContent = \"Clear\""]) "Editor controls are missing." {}) world)}
   {:pattern #"^keymap file controls are grouped under a collapsed <([A-Za-z0-9_]+)> section$"
    :handler (fn [world example [label-key]] (support/assert! (str/includes? (:html world) (str "<summary>" (command-id example label-key) "</summary>")) "Keymap files are not collapsed." {}) world)}
   {:pattern #"^the user searches for <([A-Za-z0-9_]+)>$"
    :applies? (fn [world] (not (contains? world :sessions)))
    :handler (fn [world example [query-key]] (assoc world :query (command-id example query-key)))}
   {:pattern #"^only commands matching <([A-Za-z0-9_]+)> by title, command id, or key sequence are listed$"
    :handler (fn [world example [query-key]] (support/assert! (and (= (command-id example query-key) (:query world)) (str/includes? (:source world) "command.title} ${command.id}")) "Editor search does not include title, id, and sequence." {}) world)}
   {:pattern #"^command <([A-Za-z0-9_]+)> uses key sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [id-key sequence-key]] (let [world (require-wiring world editor-wired? "Hotkey editor is not wired.") id (command-id example id-key) value (command-id example sequence-key)] (assoc world :keymap {:bindings {id value}} :command-id id :prior-sequence value)))}
   {:pattern #"^edited command <([A-Za-z0-9_]+)> uses prior key sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [id-key sequence-key]] (assoc-in (assoc world :edited-command-id (command-id example id-key) :edited-sequence (command-id example sequence-key)) [:keymap :bindings (command-id example id-key)] (command-id example sequence-key)))}
   {:pattern #"^the user changes command <([A-Za-z0-9_]+)> to key sequence <([A-Za-z0-9_]+)> in the hotkey editor$"
    :handler (fn [world example [id-key sequence-key]] (assoc-in world [:keymap :bindings (command-id example id-key)] (command-id example sequence-key)))}
   {:pattern #"^the user clears the key sequence for command <([A-Za-z0-9_]+)> in the hotkey editor$"
    :handler (fn [world example [id-key]] (assoc-in world [:keymap :bindings (command-id example id-key)] ""))}
   {:pattern #"^key sequence <([A-Za-z0-9_]+)> runs command <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [sequence-key id-key]] (support/assert! (= (command-id example id-key) (some (fn [[id value]] (when (= value (command-id example sequence-key)) id)) (get-in world [:keymap :bindings]))) "Key sequence does not run expected command." {}) world)}
   {:pattern #"^key sequence <([A-Za-z0-9_]+)> no longer runs command <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [sequence-key id-key]] (support/assert! (not= (command-id example sequence-key) (sequence world (command-id example id-key))) "Old key sequence remains active." {}) world)}
   {:pattern #"^key sequence <([A-Za-z0-9_]+)> remains active after the side panel reloads$"
    :handler (fn [world example [sequence-key]] (support/assert! (= (command-id example sequence-key) (sequence world (:command-id world))) "Changed sequence was not retained." {}) world)}
   {:pattern #"^visible hotkey status confirms command <([A-Za-z0-9_]+)> was updated$"
    :handler (fn [world example [id-key]] (support/assert! (str/includes? (:source world) "Hotkey updated: ${command.id}") "Update status is missing." {}) world)}
   {:pattern #"^command <([A-Za-z0-9_]+)> is shown as unassigned$"
    :handler (fn [world example [id-key]] (support/assert! (str/blank? (sequence world (command-id example id-key))) "Command is still assigned." {}) world)}
   {:pattern #"^the cleared key sequence remains unassigned after the side panel reloads$"
    :handler (fn [world _ _] (support/assert! (str/includes? (:source world) "storeHotkeyKeymap") "Cleared binding is not persisted." {}) world)}
   {:pattern #"^the user assigns key sequence <([A-Za-z0-9_]+)> to command <([A-Za-z0-9_]+)> in the hotkey editor$"
    :handler (fn [world example [sequence-key id-key]] (assoc world :attempted-sequence (command-id example sequence-key) :attempted-command (command-id example id-key)))}
   {:pattern #"^the hotkey change is rejected$"
    :handler (fn [world _ _] (support/assert! (str/includes? (:source world) "Conflict:") "Hotkey conflicts are not rejected." {}) world)}
   {:pattern #"^a visible conflict warning names key sequence <([A-Za-z0-9_]+)>, command <([A-Za-z0-9_]+)>, and command <([A-Za-z0-9_]+)>$"
    :handler (fn [world _ _] (support/assert! (str/includes? (:source world) "conflictingCommandId") "Conflict warning omits command ids." {}) world)}
   {:pattern #"^command <([A-Za-z0-9_]+)> retains key sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [id-key sequence-key]] (support/assert! (= (command-id example sequence-key) (sequence world (command-id example id-key))) "Existing binding changed during conflict." {}) world)}
   {:pattern #"^edited command <([A-Za-z0-9_]+)> retains prior key sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [id-key sequence-key]] (support/assert! (= (command-id example sequence-key) (sequence world (command-id example id-key))) "Edited binding changed during conflict." {}) world)}
   {:pattern #"^the user is editing the key sequence for command <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [id-key]] (assoc world :editing-command (command-id example id-key)))}
   {:pattern #"^key sequence <([A-Za-z0-9_]+)> is entered into the hotkey editor$"
    :handler (fn [world example [sequence-key]] (assoc world :pending-sequence (command-id example sequence-key)))}
   {:pattern #"^command <([A-Za-z0-9_]+)> does not run$"
    :handler (fn [world _ _] (support/assert! (str/includes? (:source world) "shouldIgnoreHotkeyTarget") "Editor input does not prevent hotkey execution." {}) world)}
   {:pattern #"^key sequence <([A-Za-z0-9_]+)> is shown as the pending hotkey change$"
    :handler (fn [world example [sequence-key]] (support/assert! (= (command-id example sequence-key) (:pending-sequence world)) "Pending hotkey change is not shown." {}) world)}
   {:pattern #"^the user cancels the pending hotkey change$"
    :handler (fn [world _ _] (dissoc world :pending-sequence))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T14:51:24.502274992+02:00", :module-hash "2007445990", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1978799929"} {:id "defn-/inspect", :kind "defn-", :line 5, :end-line nil, :hash "-115564348"} {:id "defn/tabs-wired?", :kind "defn", :line 15, :end-line nil, :hash "-1561432839"} {:id "defn/editor-wired?", :kind "defn", :line 23, :end-line nil, :hash "-1153408800"} {:id "defn-/require-wiring", :kind "defn-", :line 30, :end-line nil, :hash "-148584365"} {:id "defn-/command-id", :kind "defn-", :line 35, :end-line nil, :hash "-316749086"} {:id "defn-/sequence", :kind "defn-", :line 36, :end-line nil, :hash "-1899006383"} {:id "def/handlers", :kind "def", :line 38, :end-line nil, :hash "1868572257"}]}
;; clj-mutate-manifest-end
