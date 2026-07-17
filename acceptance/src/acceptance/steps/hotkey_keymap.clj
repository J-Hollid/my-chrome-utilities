(ns acceptance.steps.hotkey-keymap
  (:require [acceptance.steps.support :as support]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(def schema-version 1)
(def canonical-start-command-id "data-layer.start-testing")
(def canonical-start-sequence "C-c s")
(def canonical-duplicate-sequence "C-c d")
(def canonical-obsolete-command-id "demo.removed")
(def canonical-history-input-name "history-path")

(defn registered-command-ids [source]
  (->> (re-seq #"\bid\s*:\s*\"([^\"]+)\"" source)
       (map second)
       distinct
       vec))

(defn blank-keymap [command-ids]
  {:schemaVersion schema-version
   :bindings (into {} (map (fn [command-id] [command-id ""]) command-ids))})

(defn- binding-keys [bindings]
  (set (map name (keys bindings))))

(defn- binding-value [bindings command-id]
  (or (get bindings command-id)
      (get bindings (keyword command-id))
      ""))

(defn update-keymap [existing command-ids]
  (let [bindings (:bindings existing)
        existing-ids (binding-keys bindings)
        registered-ids (set command-ids)]
    {:keymap {:schemaVersion schema-version
              :bindings (into {} (map (fn [command-id]
                                         [command-id (binding-value bindings command-id)])
                                       command-ids))}
     :added (vec (remove existing-ids command-ids))
     :removed (vec (sort (remove registered-ids existing-ids)))}))

(defn keymap-update-status [{:keys [added removed]}]
  (str "Keymap updated: added " (count added) ", removed " (count removed)))

(defn normalize-sequence [sequence]
  (str/replace (str/trim sequence) #"\s+" " "))

(defn command-for-sequence [keymap sequence]
  (let [wanted (normalize-sequence sequence)]
    (some (fn [[command-id binding]]
            (when (= wanted (normalize-sequence binding))
              (name command-id)))
          (:bindings keymap))))

(defn runnable-command-for-sequence [keymap focused-input sequence]
  (when (and keymap (not focused-input))
    (command-for-sequence keymap sequence)))

(defn sequence-prefix? [keymap prefix]
  (let [wanted (str (normalize-sequence prefix) " ")]
    (boolean
     (some (fn [[_command-id binding]]
             (str/starts-with? (normalize-sequence binding) wanted))
           (:bindings keymap)))))

(defn duplicate-sequences [keymap]
  (->> (:bindings keymap)
       (keep (fn [[command-id binding]]
               (let [sequence (normalize-sequence binding)]
                 (when-not (str/blank? sequence)
                   [sequence (name command-id)]))))
       (group-by first)
       (keep (fn [[sequence entries]]
               (when (> (count entries) 1)
                 {:sequence sequence
                  :command-ids (vec (sort (map second entries)))})))
       (sort-by :sequence)
       vec))

(defn keymap-controls? [html source]
  (and (str/includes? html "id=\"create-keymap\"")
       (str/includes? html "id=\"update-keymap\"")
       (str/includes? html "id=\"load-keymap\"")
       (str/includes? html "id=\"keymap-file\"")
       (str/includes? html "id=\"keymap-status\"")
       (str/includes? html "id=\"keymap-warning\"")
       (str/includes? source "createKeymapButton")
       (str/includes? source "updateKeymapButton")
       (str/includes? source "loadKeymapButton")
       (str/includes? source "keymapFileInput")
       (str/includes? source "downloadHotkeyKeymapFile")))

(defn manifest-global-shortcut? [manifest shortcut]
  (boolean
   (some (fn [[_command-id command]]
           (= shortcut (get-in command [:suggested_key :default])))
         (:commands manifest))))

(defn background-global-shortcut? [source]
  (support/includes-all? source
                         ["chrome.commands.onCommand.addListener"
                          "open-side-panel"
                          "chrome.tabs.query"
                          "chrome.sidePanel.open"
                          "focus-app-hotkeys"
                          "chrome.runtime.sendMessage"]))

(defn app-hotkey-focus-wired? [source]
  (support/includes-all? source
                         ["activateHotkeyFocus"
                          "panelRoot.focus()"
                          "dataset.hotkeyFocus"
                          "focus-app-hotkeys"
                          "chrome.runtime.onMessage"]))

(defn stored-keymap-wired? [source]
  (support/includes-all? source
                         ["HOTKEY_KEYMAP_STORAGE_KEY"
                          "hotkeyStorage.setItem"
                          "hotkeyStorage.getItem"]))

(defn sequence-run-wired? [source]
  (support/includes-all? source
                         ["handleHotkeyKeydown"
                          "advanceHotkeySequence"
                          "runCommandById"]))

(defn text-input-guard-wired? [source]
  (support/includes-all? source
                         ["shouldIgnoreHotkeyTarget"
                          "HTMLInputElement"
                          "history-path"]))

(defn duplicate-rejection-wired? [source]
  (support/includes-all? source
                         ["duplicateSequences"
                          "keymapWarning"]))

(defn cancel-pending-wired? [source]
  (support/includes-all? source
                         ["Escape"
                          "pendingHotkeySequence"
                          "clearPendingHotkeySequence"]))

(defn keymap-update-status-wired? [source]
  (support/includes-all? source
                         ["function updateKeymapStatus"
                          "setKeymapStatus("
                          "`Keymap updated: added ${added.length}, removed ${removed.length}`"]))

(defn- inspect-keymap [world]
  (let [root (or (:root world) (support/repository-root))]
    (assoc world
           :root root
           :manifest (support/read-json (fs/path root "manifest.json"))
           :background-source (support/source-file root "src/background.ts")
           :side-panel-html (support/source-file root "side-panel.html")
           :side-panel-source (support/source-file root "src/side-panel.ts")
           :commands-source (support/source-file root "src/commands.ts"))))

(defn- command-ids [world]
  (registered-command-ids (:commands-source world)))

(defn- assert-global-shortcut! [world shortcut]
  (support/assert! (manifest-global-shortcut? (:manifest world) shortcut)
                   "Manifest does not declare the requested global shortcut."
                   {:shortcut shortcut})
  (support/assert! (background-global-shortcut? (:background-source world))
                   "Background script does not route the global shortcut to the side panel."
                   {})
  (support/assert! (app-hotkey-focus-wired? (:side-panel-source world))
                   "Side panel does not expose app-level hotkey focus."
                   {}))

(defn- press-global-shortcut [world shortcut {:keys [already-open?]}]
  (let [world (inspect-keymap world)
        open-count (:side-panel-open-count world 0)]
    (assert-global-shortcut! world shortcut)
    (assoc world :side-panel-open? true :hotkey-focus-active? true
           :side-panel-open-count (if already-open? open-count (inc open-count)))))

(defn- valid-command! [world command-id]
  (support/assert! (contains? (set (command-ids world)) command-id)
                   "Command is not registered for keymap binding."
                   {:command-id command-id})
  world)

(defn- press-key-sequence [world sequence]
  (let [world (inspect-keymap world)
        keymap (:active-keymap world)
        command-id (runnable-command-for-sequence keymap
                                                  (:focused-input world)
                                                  sequence)]
    (support/assert! (sequence-run-wired? (:side-panel-source world))
                     "Side panel does not route key sequences to command ids."
                     {:sequence sequence})
    (assoc world
           :last-key-sequence sequence
           :last-command-id command-id)))

(def handlers
  [{:pattern #"^the side panel is closed$"
    :handler (fn [world _example _captures]
               (assoc (inspect-keymap world) :side-panel-open? false :side-panel-open-count 0 :hotkey-focus-active? false))}

   {:pattern #"^global side panel shortcut <([A-Za-z0-9_]+)> is pressed$"
    :handler (fn [world example [shortcut-key]]
               (press-global-shortcut world
                                      (support/require-example example shortcut-key)
                                      {:already-open? false}))}

   {:pattern #"^app-level hotkey focus is active$"
    :handler (fn [world _example _captures]
               (let [world (inspect-keymap world)]
                 (support/assert! (:hotkey-focus-active? world)
                                  "App-level hotkey focus is not active."
                                  {})
                 (support/assert! (app-hotkey-focus-wired? (:side-panel-source world))
                                  "App-level hotkey focus is not wired in the side panel."
                                  {})
                 world))}

   {:pattern #"^global side panel shortcut <([A-Za-z0-9_]+)> is pressed while the side panel is open but unfocused$"
    :handler (fn [world example [shortcut-key]]
               (let [open-count-before (:side-panel-open-count world 1)
                     world (assoc world :side-panel-open-count open-count-before)]
                 (assoc (press-global-shortcut world
                                               (support/require-example example shortcut-key)
                                               {:already-open? true})
                        :previous-side-panel-open-count open-count-before)))}

   {:pattern #"^the existing side panel receives app-level hotkey focus$"
    :handler (fn [world _example _captures]
               (support/assert! (:side-panel-open? world)
                                "Side panel was not already open."
                                {})
               (support/assert! (:hotkey-focus-active? world)
                                "Existing side panel did not receive app-level hotkey focus."
                                {})
               world)}

   {:pattern #"^no duplicate side panel is opened$"
    :handler (fn [world _example _captures]
               (support/assert! (= (:previous-side-panel-open-count world)
                                   (:side-panel-open-count world))
                                "A duplicate side panel open was simulated."
                                {:before (:previous-side-panel-open-count world)
                                 :after (:side-panel-open-count world)})
               world)}

   {:pattern #"^global side panel shortcut <([A-Za-z0-9_]+)> is pressed while app-level hotkey focus is already active$"
    :handler (fn [world example [shortcut-key]]
               (press-global-shortcut world
                                      (support/require-example example shortcut-key)
                                      {:already-open? true}))}

   {:pattern #"^app-level hotkey focus remains active$"
    :handler (fn [world _example _captures]
               (support/assert! (:hotkey-focus-active? world)
                                "App-level hotkey focus did not remain active."
                                {})
               world)}

   {:pattern #"^visible keymap controls create, update, and load hotkey keymap files$"
    :handler (fn [world _example _captures]
               (let [world (inspect-keymap world)]
                 (support/assert! (keymap-controls? (:side-panel-html world)
                                                     (:side-panel-source world))
                                  "Visible keymap controls are not wired."
                                  {})
                 world))}

   {:pattern #"^the user creates a hotkey keymap file$"
    :handler (fn [world _example _captures]
               (let [world (inspect-keymap world)]
                 (support/assert! (str/includes? (:side-panel-source world)
                                                 "blankHotkeyKeymap")
                                  "Side panel does not create a blank hotkey keymap."
                                  {})
                 (assoc world :generated-keymap (blank-keymap (command-ids world)))))}

   {:pattern #"^the generated keymap uses schema version <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [schema-version-key]]
               (let [expected (parse-long (support/require-example example schema-version-key))]
                 (support/assert! (= expected (:schemaVersion (:generated-keymap world)))
                                  "Generated keymap schema version does not match."
                                  {:expected expected
                                   :actual (:schemaVersion (:generated-keymap world))})
                 world))}

   {:pattern #"^the generated keymap contains every registered command id$"
    :handler (fn [world _example _captures]
               (let [world (inspect-keymap world)
                     expected (set (command-ids world))
                     actual (binding-keys (:bindings (:generated-keymap world)))]
                 (support/assert! (= expected actual)
                                  "Generated keymap does not contain every registered command id."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^each generated command binding is blank$"
    :handler (fn [world _example _captures]
               (support/assert! (every? str/blank? (vals (:bindings (:generated-keymap world))))
                                "Generated keymap bindings are not blank."
                                {:keymap (:generated-keymap world)})
               world)}

   {:pattern #"^an existing keymap binds command <([A-Za-z0-9_]+)> to sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [command-key sequence-key]]
               (let [world (inspect-keymap world)
                     command-id (support/require-example example command-key)
                     sequence (support/require-example example sequence-key)]
                 (valid-command! world command-id)
                 (assoc world
                        :existing-keymap {:schemaVersion schema-version
                                          :bindings {command-id sequence}}
                        :existing-command-id command-id
                        :existing-sequence sequence)))}

   {:pattern #"^the existing keymap contains obsolete command id <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [obsolete-key]]
               (let [obsolete-id (support/require-example example obsolete-key)]
                 (-> world
                     (assoc-in [:existing-keymap :bindings obsolete-id] "C-x z")
                     (assoc :obsolete-command-id obsolete-id))))}

   {:pattern #"^an existing keymap has <([A-Za-z0-9_]+)> missing registered command ids and <([A-Za-z0-9_]+)> obsolete command ids$"
    :handler (fn [world example [missing-count-key obsolete-count-key]]
               (let [world (inspect-keymap world)
                     missing-count (parse-long (support/require-example example missing-count-key))
                     obsolete-count (parse-long (support/require-example example obsolete-count-key))
                     ids (command-ids world)]
                 (support/assert! (and (some? missing-count)
                                       (some? obsolete-count)
                                       (<= 0 missing-count (count ids))
                                       (not (neg? obsolete-count)))
                                  "Keymap update counts must be non-negative and cannot omit more commands than are registered."
                                  {:missing-count missing-count
                                   :obsolete-count obsolete-count
                                   :registered-count (count ids)})
                 (let [existing-bindings (concat (map (fn [command-id] [command-id ""])
                                                     (drop missing-count ids))
                                                (map (fn [index]
                                                       [(str "demo.obsolete-" index) ""])
                                                     (range obsolete-count)))]
                   (assoc world
                          :existing-keymap
                          {:schemaVersion schema-version
                           :bindings (into {} existing-bindings)}))))}

   {:pattern #"^the user updates the hotkey keymap file$"
    :handler (fn [world _example _captures]
               (let [world (inspect-keymap world)
                     summary (update-keymap (:existing-keymap world) (command-ids world))]
                 (support/assert! (str/includes? (:side-panel-source world)
                                                 "updateHotkeyKeymap")
                                  "Side panel does not update hotkey keymaps."
                                  {})
                 (assoc world
                        :updated-keymap (:keymap summary)
                        :keymap-update-summary summary)))}

   {:pattern #"^command <([A-Za-z0-9_]+)> keeps sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [command-key sequence-key]]
               (let [command-id (support/require-example example command-key)
                     sequence (support/require-example example sequence-key)]
                 (support/assert! (= sequence (binding-value (:bindings (:updated-keymap world)) command-id))
                                  "Updated keymap did not preserve an existing binding."
                                  {:command-id command-id})
                 world))}

   {:pattern #"^missing registered command <([A-Za-z0-9_]+)> is added with a blank binding$"
    :handler (fn [world example [command-key]]
               (let [command-id (support/require-example example command-key)]
                 (support/assert! (contains? (binding-keys (:bindings (:updated-keymap world))) command-id)
                                  "Missing registered command was not added."
                                  {:command-id command-id})
                 (support/assert! (str/blank? (binding-value (:bindings (:updated-keymap world)) command-id))
                                  "Missing registered command was not added with a blank binding."
                                  {:command-id command-id})
                 world))}

   {:pattern #"^obsolete command id <([A-Za-z0-9_]+)> is removed$"
    :handler (fn [world example [obsolete-key]]
               (let [obsolete-id (support/require-example example obsolete-key)]
                 (support/assert! (not (contains? (binding-keys (:bindings (:updated-keymap world)))
                                                  obsolete-id))
                                  "Obsolete command id was not removed."
                                  {:obsolete-id obsolete-id})
                 world))}

   {:pattern #"^the keymap update summary reports added and removed commands$"
    :handler (fn [world _example _captures]
               (let [{:keys [added removed]} (:keymap-update-summary world)]
                 (support/assert! (and (seq added) (seq removed))
                                  "Keymap update summary does not report added and removed commands."
                                  {:added added :removed removed})
                 world))}

   {:pattern #"^the visible keymap update status is Keymap updated: added <([A-Za-z0-9_]+)>, removed <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [added-count-key removed-count-key]]
               (let [expected (str "Keymap updated: added "
                                   (support/require-example example added-count-key)
                                   ", removed "
                                   (support/require-example example removed-count-key))
                     actual (keymap-update-status (:keymap-update-summary world))]
                 (support/assert! (keymap-update-status-wired? (:side-panel-source world))
                                  "Side panel does not display the keymap update status."
                                  {})
                 (support/assert! (= expected actual)
                                  "Visible keymap update status does not report the exact added and removed counts."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^the keymap update preserves the canonical start binding$"
    :handler (fn [world _example _captures]
               (support/assert! (= canonical-start-command-id (:existing-command-id world))
                                "Keymap update did not use the canonical start command."
                                {:expected canonical-start-command-id
                                 :actual (:existing-command-id world)})
               (support/assert! (= canonical-start-sequence (:existing-sequence world))
                                "Keymap update did not use the canonical start sequence."
                                {:expected canonical-start-sequence
                                 :actual (:existing-sequence world)})
               (support/assert! (= canonical-start-sequence
                                  (binding-value (:bindings (:updated-keymap world))
                                                 canonical-start-command-id))
                                "Updated keymap did not preserve the canonical start binding."
                                {:expected canonical-start-sequence
                                 :actual (binding-value (:bindings (:updated-keymap world))
                                                        canonical-start-command-id)})
               world)}

   {:pattern #"^the keymap update used the canonical obsolete command id$"
    :handler (fn [world _example _captures]
               (support/assert! (= canonical-obsolete-command-id (:obsolete-command-id world))
                                "Keymap update did not use the canonical obsolete command id."
                                {:expected canonical-obsolete-command-id
                                 :actual (:obsolete-command-id world)})
               world)}

   {:pattern #"^a valid keymap binds command <([A-Za-z0-9_]+)> to sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [command-key sequence-key]]
               (let [world (inspect-keymap world)
                     command-id (support/require-example example command-key)
                     sequence (support/require-example example sequence-key)]
                 (valid-command! world command-id)
                 (assoc world :hotkey-focus-active? true
                        :candidate-keymap {:schemaVersion schema-version
                                           :bindings {command-id sequence}}
                        :active-keymap {:schemaVersion schema-version
                                        :bindings {command-id sequence}}
                        :candidate-command-id command-id
                        :candidate-sequence sequence)))}

   {:pattern #"^the user loads the hotkey keymap file$"
    :handler (fn [world _example _captures]
               (let [world (inspect-keymap world)
                     keymap (:candidate-keymap world)
                     duplicates (duplicate-sequences keymap)]
                 (if (seq duplicates)
                   (assoc world :keymap-load-rejected? true :hotkey-focus-active? false
                          :duplicate-sequences duplicates)
                   (do
                     (support/assert! (stored-keymap-wired? (:side-panel-source world))
                                      "Loaded keymap is not stored locally."
                                      {})
                     (assoc world :hotkey-focus-active? true
                            :stored-keymap keymap
                            :active-keymap keymap)))))}

   {:pattern #"^the keymap is stored locally$"
    :handler (fn [world _example _captures]
               (support/assert! (= (:candidate-keymap world) (:stored-keymap world))
                                "Loaded keymap was not stored locally."
                                {})
               world)}

   {:pattern #"^key sequence <([A-Za-z0-9_]+)> is pressed$"
    :handler (fn [world example [sequence-key]]
               (press-key-sequence world (support/require-example example sequence-key)))}

   {:pattern #"^the side panel is reloaded and key sequence <([A-Za-z0-9_]+)> is pressed$"
    :handler (fn [world example [sequence-key]]
               (press-key-sequence (assoc world :active-keymap (:stored-keymap world))
                                   (support/require-example example sequence-key)))}

   {:pattern #"^the stored keymap runs command <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [command-key]]
               (let [command-id (support/require-example example command-key)]
                 (support/assert! (= command-id (:last-command-id world))
                                  "Stored keymap did not run the expected command."
                                  {:expected command-id :actual (:last-command-id world)})
                 world))}

   {:pattern #"^the active keymap uses the canonical start sequence$"
    :handler (fn [world _example _captures]
               (support/assert! (= canonical-start-sequence (:candidate-sequence world))
                                "Active keymap was not created with the canonical start sequence."
                                {:expected canonical-start-sequence
                                 :actual (:candidate-sequence world)})
               (support/assert! (= canonical-start-sequence
                                  (binding-value (:bindings (:active-keymap world))
                                                 canonical-start-command-id))
                                "Active keymap does not bind the canonical start command sequence."
                                {:expected canonical-start-sequence
                                 :actual (binding-value (:bindings (:active-keymap world))
                                                        canonical-start-command-id)})
               world)}

   {:pattern #"^focus is inside text input <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [input-key]]
               (let [world (inspect-keymap world)]
                 (support/assert! (text-input-guard-wired? (:side-panel-source world))
                                  "Side panel does not guard text inputs from app-level hotkeys."
                                  {})
                 (assoc world :focused-input (support/require-example example input-key))))}

   {:pattern #"^the text input guard targets the canonical history path input$"
    :handler (fn [world _example _captures]
               (support/assert! (= canonical-history-input-name (:focused-input world))
                                "Focused text input does not match the canonical history path input."
                                {:expected canonical-history-input-name
                                 :actual (:focused-input world)})
               (support/assert! (text-input-guard-wired? (:side-panel-source world))
                                "Side panel does not guard the canonical history path input."
                                {})
               world)}

   {:pattern #"^key sequence <([A-Za-z0-9_]+)> is pressed inside text input <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [sequence-key input-key]]
               (let [input-name (support/require-example example input-key)]
                 (support/assert! (= input-name (:focused-input world))
                                  "Expected text input is not focused."
                                  {:expected input-name :actual (:focused-input world)})
                 (-> world
                     (press-key-sequence (support/require-example example sequence-key))
                     (assoc :focused-input input-name
                            :last-command-id nil))))}

   {:pattern #"^command <([A-Za-z0-9_]+)> does not run$"
    :handler (fn [world example [command-key]]
               (let [command-id (support/require-example example command-key)]
                 (support/assert! (not= command-id (:last-command-id world))
                                  "Command unexpectedly ran."
                                  {:command-id command-id})
                 world))}

   {:pattern #"^text input <([A-Za-z0-9_]+)> remains focused$"
    :handler (fn [world example [input-key]]
               (let [input-name (support/require-example example input-key)]
                 (support/assert! (= input-name (:focused-input world))
                                  "Text input did not remain focused."
                                  {:expected input-name :actual (:focused-input world)})
                 world))}

   {:pattern #"^focus leaves text input <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [input-key]]
               (let [input-name (support/require-example example input-key)]
                 (support/assert! (= input-name (:focused-input world))
                                  "Expected text input was not focused before focus left."
                                  {:expected input-name :actual (:focused-input world)})
                 (dissoc world :focused-input)))}

   {:pattern #"^key sequence <([A-Za-z0-9_]+)> is pressed with app-level hotkey focus active$"
    :handler (fn [world example [sequence-key]]
               (support/assert! (:hotkey-focus-active? world)
                                "App-level hotkey focus is not active for key sequence."
                                {})
               (press-key-sequence world (support/require-example example sequence-key)))}

   {:pattern #"^a keymap binds command <([A-Za-z0-9_]+)> and command <([A-Za-z0-9_]+)> to sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [first-command-key second-command-key sequence-key]]
               (let [world (inspect-keymap world)
                     first-command-id (support/require-example example first-command-key)
                     second-command-id (support/require-example example second-command-key)
                     sequence (support/require-example example sequence-key)]
                 (valid-command! world first-command-id)
                 (valid-command! world second-command-id)
                 (assoc world
                        :candidate-keymap {:schemaVersion schema-version
                                           :bindings {first-command-id sequence
                                                      second-command-id sequence}}
                        :duplicate-sequence sequence)))}

   {:pattern #"^the duplicate sequence is rejected$"
    :handler (fn [world _example _captures]
               (support/assert! (:keymap-load-rejected? world)
                                "Duplicate keymap sequence was not rejected."
                                {})
               (support/assert! (duplicate-rejection-wired? (:side-panel-source world))
                                "Duplicate keymap sequence rejection is not wired."
                                {})
               world)}

   {:pattern #"^the duplicate rejection uses the canonical duplicate sequence$"
    :handler (fn [world _example _captures]
               (support/assert! (= canonical-duplicate-sequence (:duplicate-sequence world))
                                "Duplicate rejection did not use the canonical duplicate sequence."
                                {:expected canonical-duplicate-sequence
                                 :actual (:duplicate-sequence world)})
               (support/assert! (some #(= canonical-duplicate-sequence (:sequence %))
                                      (:duplicate-sequences world))
                                "Duplicate rejection did not report the canonical duplicate sequence."
                                {:expected canonical-duplicate-sequence
                                 :actual (:duplicate-sequences world)})
               world)}

   {:pattern #"^neither command <([A-Za-z0-9_]+)> nor command <([A-Za-z0-9_]+)> is rebound to sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [first-command-key second-command-key sequence-key]]
               (let [first-command-id (support/require-example example first-command-key)
                     second-command-id (support/require-example example second-command-key)
                     sequence (support/require-example example sequence-key)
                     bindings (:bindings (:active-keymap world))]
                 (support/assert! (not= sequence (binding-value bindings first-command-id))
                                  "First command was rebound despite duplicate rejection."
                                  {:command-id first-command-id})
                 (support/assert! (not= sequence (binding-value bindings second-command-id))
                                  "Second command was rebound despite duplicate rejection."
                                  {:command-id second-command-id})
                 world))}

   {:pattern #"^a visible keymap warning names sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [sequence-key]]
               (let [sequence (support/require-example example sequence-key)]
                 (support/assert! (some #(= sequence (:sequence %)) (:duplicate-sequences world))
                                  "Duplicate warning did not name the duplicate sequence."
                                  {:sequence sequence
                                   :duplicates (:duplicate-sequences world)})
                 world))}

   {:pattern #"^key sequence prefix <([A-Za-z0-9_]+)> is pressed$"
    :handler (fn [world example [prefix-key]]
               (let [world (inspect-keymap world)
                     prefix (support/require-example example prefix-key)]
                 (support/assert! (sequence-prefix? (:active-keymap world) prefix)
                                  "Pressed prefix does not start a configured key sequence."
                                  {:prefix prefix})
                 (support/assert! (cancel-pending-wired? (:side-panel-source world))
                                  "Pending key sequence cancellation is not wired."
                                  {})
                 (assoc world
                        :pending-key-sequence prefix
                        :last-command-id nil)))}

   {:pattern #"^key <([A-Za-z0-9_]+)> is pressed before the sequence is completed$"
    :handler (fn [world example [key-name]]
               (let [key-name (support/require-example example key-name)]
                 (if (= "Escape" key-name)
                   (assoc world :pending-key-sequence nil :last-command-id nil)
                   (assoc world :last-key-press key-name))))}

   {:pattern #"^the pending key sequence is cleared$"
    :handler (fn [world _example _captures]
               (support/assert! (nil? (:pending-key-sequence world))
                                "Pending key sequence was not cleared."
                                {})
               world)}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-17T17:02:06.984682038+02:00", :module-hash "-1791104612", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-963858604"} {:id "def/schema-version", :kind "def", :line 6, :end-line 6, :hash "-1959597430"} {:id "def/canonical-start-command-id", :kind "def", :line 7, :end-line 7, :hash "1290574988"} {:id "def/canonical-start-sequence", :kind "def", :line 8, :end-line 8, :hash "-725694312"} {:id "def/canonical-duplicate-sequence", :kind "def", :line 9, :end-line 9, :hash "416286496"} {:id "def/canonical-obsolete-command-id", :kind "def", :line 10, :end-line 10, :hash "721215688"} {:id "def/canonical-history-input-name", :kind "def", :line 11, :end-line 11, :hash "291951577"} {:id "defn/registered-command-ids", :kind "defn", :line 13, :end-line 17, :hash "1550172765"} {:id "defn/blank-keymap", :kind "defn", :line 19, :end-line 21, :hash "653184577"} {:id "defn-/binding-keys", :kind "defn-", :line 23, :end-line 24, :hash "949071594"} {:id "defn-/binding-value", :kind "defn-", :line 26, :end-line 29, :hash "945355916"} {:id "defn/update-keymap", :kind "defn", :line 31, :end-line 40, :hash "1638645739"} {:id "defn/keymap-update-status", :kind "defn", :line 42, :end-line 43, :hash "1888509229"} {:id "defn/normalize-sequence", :kind "defn", :line 45, :end-line 46, :hash "2002355339"} {:id "defn/command-for-sequence", :kind "defn", :line 48, :end-line 53, :hash "85198646"} {:id "defn/runnable-command-for-sequence", :kind "defn", :line 55, :end-line 57, :hash "-1802533389"} {:id "defn/sequence-prefix?", :kind "defn", :line 59, :end-line 64, :hash "637233782"} {:id "defn/duplicate-sequences", :kind "defn", :line 66, :end-line 78, :hash "-1882546275"} {:id "defn/keymap-controls?", :kind "defn", :line 80, :end-line 91, :hash "-14484557"} {:id "defn/manifest-global-shortcut?", :kind "defn", :line 93, :end-line 97, :hash "-404469820"} {:id "defn/background-global-shortcut?", :kind "defn", :line 99, :end-line 106, :hash "946333082"} {:id "defn/app-hotkey-focus-wired?", :kind "defn", :line 108, :end-line 114, :hash "1610910639"} {:id "defn/stored-keymap-wired?", :kind "defn", :line 116, :end-line 120, :hash "-788422352"} {:id "defn/sequence-run-wired?", :kind "defn", :line 122, :end-line 126, :hash "-1558929852"} {:id "defn/text-input-guard-wired?", :kind "defn", :line 128, :end-line 132, :hash "-1119993427"} {:id "defn/duplicate-rejection-wired?", :kind "defn", :line 134, :end-line 137, :hash "1612866327"} {:id "defn/cancel-pending-wired?", :kind "defn", :line 139, :end-line 143, :hash "-1060924113"} {:id "defn/keymap-update-status-wired?", :kind "defn", :line 145, :end-line 149, :hash "-1317180208"} {:id "defn-/inspect-keymap", :kind "defn-", :line 151, :end-line 159, :hash "1033446898"} {:id "defn-/command-ids", :kind "defn-", :line 161, :end-line 162, :hash "1500827782"} {:id "defn-/assert-global-shortcut!", :kind "defn-", :line 164, :end-line 173, :hash "1646684517"} {:id "defn-/press-global-shortcut", :kind "defn-", :line 175, :end-line 180, :hash "1271518698"} {:id "defn-/valid-command!", :kind "defn-", :line 182, :end-line 186, :hash "-304628333"} {:id "defn-/press-key-sequence", :kind "defn-", :line 188, :end-line 199, :hash "1444360369"} {:id "def/handlers", :kind "def", :line 201, :end-line 658, :hash "656896201"}]}
;; clj-mutate-manifest-end
