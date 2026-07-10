(ns acceptance.hotkey-keymap-steps-test
  (:require [acceptance.steps.hotkey-keymap :as hotkey-keymap]
            [acceptance.runtime :as runtime]
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
   function updateKeymapStatus(added, removed) { setKeymapStatus(`Keymap updated: added ${added.length}, removed ${removed.length}`); }
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

(deftest reports-exact-visible-keymap-update-status
  (is (= "Keymap updated: added 1, removed 0"
         (hotkey-keymap/keymap-update-status
          {:added ["data-layer.end-testing"]
           :removed []})))
  (is (= "Keymap updated: added 0, removed 1"
         (hotkey-keymap/keymap-update-status
          {:added []
           :removed ["demo.obsolete"]}))))

(deftest acceptance-steps-report-exact-visible-keymap-update-status
  (let [given-text "an existing keymap has <missing_count> missing registered command ids and <obsolete_count> obsolete command ids"
        status-text "the visible keymap update status is Keymap updated: added <missing_count>, removed <obsolete_count>"
        run-scenario (fn [missing-count obsolete-count]
                       (let [example {"missing_count" missing-count
                                      "obsolete_count" obsolete-count}
                             dispatch (fn [world text]
                                        (runtime/execute-step! world
                                                               example
                                                               {:keyword "And" :text text}
                                                               hotkey-keymap/handlers))
                             initial (dispatch {:root "."} given-text)
                             updated (dispatch initial "the user updates the hotkey keymap file")]
                         (is (= (str "Keymap updated: added " missing-count
                                     ", removed " obsolete-count)
                                (hotkey-keymap/keymap-update-status
                                 (:keymap-update-summary updated))))
                         (is (= updated (dispatch updated status-text)))))]
    (run-scenario "1" "0")
    (run-scenario "0" "1")))

(deftest detects-sequences
  (let [keymap {:schemaVersion 1
                :bindings {"data-layer.start-testing" "C-c s"
                           "data-layer.end-testing" "C-c d"
                           "demo.say-hello" ""}}]
    (is (= "data-layer.start-testing"
           (hotkey-keymap/command-for-sequence keymap " C-c   s ")))
    (is (= "data-layer.start-testing"
           (hotkey-keymap/runnable-command-for-sequence keymap nil " C-c   s ")))
    (is (hotkey-keymap/sequence-prefix? keymap "C-c"))
    (is (nil? (hotkey-keymap/command-for-sequence keymap "C-c x")))
    (is (nil? (hotkey-keymap/runnable-command-for-sequence keymap nil "C-c x")))
    (is (nil? (hotkey-keymap/runnable-command-for-sequence nil nil "C-c s")))
    (is (nil? (hotkey-keymap/runnable-command-for-sequence
               keymap
               "history-path"
               "C-c s")))))

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

(deftest canonical-hotkey-keymap-assertions-dispatch
  (let [dispatch (fn [state text]
                   (runtime/execute-step! state
                                          {}
                                          {:keyword "And" :text text}
                                          hotkey-keymap/handlers))
        update-state {:existing-command-id hotkey-keymap/canonical-start-command-id
                      :existing-sequence hotkey-keymap/canonical-start-sequence
                      :obsolete-command-id hotkey-keymap/canonical-obsolete-command-id
                      :updated-keymap {:schemaVersion hotkey-keymap/schema-version
                                       :bindings {hotkey-keymap/canonical-start-command-id
                                                  hotkey-keymap/canonical-start-sequence}}}
        active-state {:candidate-sequence hotkey-keymap/canonical-start-sequence
                      :active-keymap {:schemaVersion hotkey-keymap/schema-version
                                      :bindings {hotkey-keymap/canonical-start-command-id
                                                 hotkey-keymap/canonical-start-sequence}}}
        input-state {:focused-input hotkey-keymap/canonical-history-input-name
                     :side-panel-source side-panel-source}
        duplicate-state {:duplicate-sequence hotkey-keymap/canonical-duplicate-sequence
                         :duplicate-sequences [{:sequence hotkey-keymap/canonical-duplicate-sequence
                                                :command-ids ["data-layer.end-testing"
                                                              "data-layer.start-testing"]}]}]
    (is (= update-state
           (dispatch update-state
                     "the keymap update preserves the canonical start binding")))
    (is (= update-state
           (dispatch update-state
                     "the keymap update used the canonical obsolete command id")))
    (is (= active-state
           (dispatch active-state
                     "the active keymap uses the canonical start sequence")))
    (is (= input-state
           (dispatch input-state
                     "the text input guard targets the canonical history path input")))
    (is (= duplicate-state
           (dispatch duplicate-state
                     "the duplicate rejection uses the canonical duplicate sequence")))))

(deftest pending-sequence-cancellation-requires-escape
  (let [dispatch (fn [state key-name]
                   (runtime/execute-step!
                    state
                    {"cancel_key" key-name}
                    {:keyword "And"
                     :text "key <cancel_key> is pressed before the sequence is completed"}
                    hotkey-keymap/handlers))]
    (is (nil? (:pending-key-sequence
               (dispatch {:pending-key-sequence "C-c"
                          :last-command-id "data-layer.start-testing"}
                         "Escape"))))
    (is (= "C-c"
           (:pending-key-sequence
            (dispatch {:pending-key-sequence "C-c"}
                      "EsCape"))))))
