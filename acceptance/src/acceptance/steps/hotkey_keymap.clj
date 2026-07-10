(ns acceptance.steps.hotkey-keymap
  (:require [acceptance.steps.support :as support]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(def schema-version 1)

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
                          "localStorage.setItem"
                          "localStorage.getItem"]))

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
    (assoc world
           :side-panel-open? true
           :side-panel-open-count (if already-open? open-count (inc open-count))
           :hotkey-focus-active? true)))

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
               (assoc (inspect-keymap world)
                      :side-panel-open? false
                      :side-panel-open-count 0
                      :hotkey-focus-active? false))}

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
               (let [world (assoc world :hotkey-focus-active? false)
                     before (:side-panel-open-count world 1)]
                 (assoc (press-global-shortcut world
                                               (support/require-example example shortcut-key)
                                               {:already-open? true})
                        :previous-side-panel-open-count before)))}

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
                 (assoc-in world [:existing-keymap :bindings obsolete-id] "C-x z")))}

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

   {:pattern #"^a valid keymap binds command <([A-Za-z0-9_]+)> to sequence <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [command-key sequence-key]]
               (let [world (inspect-keymap world)
                     command-id (support/require-example example command-key)
                     sequence (support/require-example example sequence-key)]
                 (valid-command! world command-id)
                 (assoc world
                        :candidate-keymap {:schemaVersion schema-version
                                           :bindings {command-id sequence}}
                        :active-keymap {:schemaVersion schema-version
                                        :bindings {command-id sequence}}
                        :hotkey-focus-active? true
                        :candidate-command-id command-id
                        :candidate-sequence sequence)))}

   {:pattern #"^the user loads the hotkey keymap file$"
    :handler (fn [world _example _captures]
               (let [world (inspect-keymap world)
                     keymap (:candidate-keymap world)
                     duplicates (duplicate-sequences keymap)]
                 (if (seq duplicates)
                   (assoc world
                          :keymap-load-rejected? true
                          :duplicate-sequences duplicates
                          :hotkey-focus-active? false)
                   (do
                     (support/assert! (stored-keymap-wired? (:side-panel-source world))
                                      "Loaded keymap is not stored locally."
                                      {})
                     (assoc world
                            :stored-keymap keymap
                            :active-keymap keymap
                            :hotkey-focus-active? true)))))}

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

   {:pattern #"^focus is inside text input <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [input-key]]
               (let [world (inspect-keymap world)]
                 (support/assert! (text-input-guard-wired? (:side-panel-source world))
                                  "Side panel does not guard text inputs from app-level hotkeys."
                                  {})
                 (assoc world :focused-input (support/require-example example input-key))))}

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
                   (assoc world :pending-key-sequence nil))))}

   {:pattern #"^the pending key sequence is cleared$"
    :handler (fn [world _example _captures]
               (support/assert! (nil? (:pending-key-sequence world))
                                "Pending key sequence was not cleared."
                                {})
               world)}])
