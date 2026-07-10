(ns acceptance.hotkey-keymap-steps-test
  (:require [acceptance.steps.hotkey-keymap :as hotkey-keymap]
            [clojure.test :refer [deftest is]]))

(def commands-source
  "const commands = [
     { id: \"demo.say-hello\", title: \"Say hello\" },
     { id: \"data-layer.start-testing\", title: \"Start\" },
     { id: \"data-layer.end-testing\", title: \"End\" }
   ];")

(def side-panel-html
  "<section id=\"hotkey-keymap\">
     <button id=\"create-keymap\"></button>
     <button id=\"update-keymap\"></button>
     <button id=\"load-keymap\"></button>
     <input id=\"keymap-file\" type=\"file\" />
     <output id=\"keymap-status\"></output>
     <output id=\"keymap-warning\"></output>
   </section>")

(def side-panel-source
  "const createKeymapButton = document.querySelector('#create-keymap');
   const updateKeymapButton = document.querySelector('#update-keymap');
   const loadKeymapButton = document.querySelector('#load-keymap');
   const keymapFileInput = document.querySelector('#keymap-file');
   const keymapWarning = document.querySelector('#keymap-warning');
   let pendingHotkeySequence = [];
   function activateHotkeyFocus() { panelRoot.focus(); panelRoot.dataset.hotkeyFocus = 'active'; }
   function downloadHotkeyKeymapFile() {}
   function duplicateSequences() {}
   function clearPendingHotkeySequence() {}
   function shouldIgnoreHotkeyTarget(target) { return target instanceof HTMLInputElement || target.id === 'history-path'; }
   function handleHotkeyKeydown(event) { advanceHotkeySequence(event); runCommandById('demo.say-hello', {}); }
   localStorage.setItem(HOTKEY_KEYMAP_STORAGE_KEY, '{}');
   localStorage.getItem(HOTKEY_KEYMAP_STORAGE_KEY);
   chrome.runtime.onMessage.addListener((message) => message.type === 'focus-app-hotkeys');
   if (event.key === 'Escape') clearPendingHotkeySequence();")

(def background-source
  "chrome.commands.onCommand.addListener((command) => {
     if (command === 'open-side-panel') {
       chrome.tabs.query({ active: true, currentWindow: true });
       chrome.sidePanel.open({ tabId: 1 });
       chrome.runtime.sendMessage({ type: 'focus-app-hotkeys' });
     }
   });")

(deftest extracts-registered-command-ids
  (is (= ["demo.say-hello" "data-layer.start-testing" "data-layer.end-testing"]
         (hotkey-keymap/registered-command-ids commands-source))))

(deftest creates-and-updates-keymaps
  (is (= {:schemaVersion 1
          :bindings {"demo.say-hello" ""
                     "data-layer.start-testing" ""}}
         (hotkey-keymap/blank-keymap ["demo.say-hello" "data-layer.start-testing"])))
  (is (= {:keymap {:schemaVersion 1
                   :bindings {"data-layer.start-testing" "C-c s"
                              "data-layer.end-testing" ""}}
          :added ["data-layer.end-testing"]
          :removed ["demo.removed"]}
         (hotkey-keymap/update-keymap
          {:schemaVersion 1
           :bindings {"data-layer.start-testing" "C-c s"
                      "demo.removed" "C-x z"}}
          ["data-layer.start-testing" "data-layer.end-testing"]))))

(deftest detects-sequences
  (let [keymap {:schemaVersion 1
                :bindings {"data-layer.start-testing" "C-c s"
                           "data-layer.end-testing" "C-c d"
                           "demo.say-hello" ""}}]
    (is (= "data-layer.start-testing"
           (hotkey-keymap/command-for-sequence keymap " C-c   s ")))
    (is (hotkey-keymap/sequence-prefix? keymap "C-c"))
    (is (nil? (hotkey-keymap/command-for-sequence keymap "C-c x")))))

(deftest rejects-duplicate-sequences
  (is (= [{:sequence "C-c d"
           :command-ids ["data-layer.end-testing" "data-layer.start-testing"]}]
         (hotkey-keymap/duplicate-sequences
          {:schemaVersion 1
           :bindings {"data-layer.start-testing" "C-c d"
                      "data-layer.end-testing" "C-c d"}}))))

(deftest recognizes-browser-wiring
  (is (hotkey-keymap/keymap-controls? side-panel-html side-panel-source))
  (is (hotkey-keymap/manifest-global-shortcut?
       {:commands {:open-side-panel {:suggested_key {:default "Ctrl+Shift+1"}}}}
       "Ctrl+Shift+1"))
  (is (hotkey-keymap/background-global-shortcut? background-source))
  (is (hotkey-keymap/app-hotkey-focus-wired? side-panel-source))
  (is (hotkey-keymap/stored-keymap-wired? side-panel-source))
  (is (hotkey-keymap/sequence-run-wired? side-panel-source))
  (is (hotkey-keymap/text-input-guard-wired? side-panel-source))
  (is (hotkey-keymap/duplicate-rejection-wired? side-panel-source))
  (is (hotkey-keymap/cancel-pending-wired? side-panel-source)))
