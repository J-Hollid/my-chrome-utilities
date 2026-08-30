(ns acceptance.source-inspection.hotkey-keymap
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(defn- includes-any-alternative? [source alternatives]
  (boolean (some #(support/includes-all? source %) alternatives)))

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
       (or (str/includes? source "downloadHotkeyKeymapFile")
           (str/includes? source "my-chrome-utilities-hotkey-keymap.json"))))

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
  (includes-any-alternative?
   source
   [["activateHotkeyFocus" "panelRoot.focus()" "dataset.hotkeyFocus"
     "focus-app-hotkeys" "chrome.runtime.onMessage"]
    ["elements.root.focus()" "dataset.hotkeyFocus"
     "focus-app-hotkeys" "runtimeMessages"]]))

(defn stored-keymap-wired? [source]
  (and (str/includes? source "HOTKEY_KEYMAP_STORAGE_KEY")
       (includes-any-alternative?
        source
        [["hotkeyStorage.setItem" "hotkeyStorage.getItem"]
         ["storage.setItem" "storage.getItem"]])))

(defn sequence-run-wired? [source]
  (includes-any-alternative?
   source
   [["handleHotkeyKeydown" "advanceHotkeySequence" "runCommandById"]
    ["const keydown" "advanceHotkeySequence" "executeCommand"]]))

(defn text-input-guard-wired? [source]
  (and (str/includes? source "HTMLInputElement")
       (or (and (str/includes? source "history-path")
                (str/includes? source "shouldIgnoreHotkeyTarget"))
           (str/includes? source "ignoresTarget"))))

(defn duplicate-rejection-wired? [source]
  (support/includes-all? source ["duplicateSequences" "keymapWarning"]))

(defn cancel-pending-wired? [source]
  (and (str/includes? source "Escape")
       (includes-any-alternative?
        source
        [["pendingHotkeySequence" "clearPendingHotkeySequence"]
         ["pending.length > 0" "pending = []"]])))

(defn keymap-update-status-wired? [source]
  (includes-any-alternative?
   source
   [["function updateKeymapStatus" "setKeymapStatus("
     "`Keymap updated: added ${added.length}, removed ${removed.length}`"]
    ["updateHotkeyKeymap(keymap, commands)" "setStatus("
     "`Keymap updated: added ${summary.added.length}, removed ${summary.removed.length}`"]]))
