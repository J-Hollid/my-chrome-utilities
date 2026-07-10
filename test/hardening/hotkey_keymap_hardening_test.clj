(ns hardening.hotkey-keymap-hardening-test
  (:require [acceptance.runtime :as runtime]
            [acceptance.steps.hotkey-keymap :as hotkey-keymap]
            [clojure.string :as str]
            [clojure.test :refer [deftest is]]))

(defn- dispatch
  ([world text]
   (dispatch world {} text))
  ([world example text]
   (runtime/execute-step! world
                          example
                          {:keyword "Then" :text text}
                          hotkey-keymap/handlers)))

(deftest hardens-side-panel-and-shortcut-state-transitions
  (let [closed (dispatch {:root "."
                          :side-panel-open? true
                          :side-panel-open-count 4
                          :hotkey-focus-active? true}
                         "the side panel is closed")
        shortcut-example {"shortcut" "Ctrl+Shift+1"}
        opened (dispatch {:root "."}
                         shortcut-example
                         "global side panel shortcut <shortcut> is pressed")
        refocused (dispatch {:root "."
                             :side-panel-open? true
                             :side-panel-open-count 3}
                            shortcut-example
                            "global side panel shortcut <shortcut> is pressed while the side panel is open but unfocused")
        refocused-default (dispatch {:root "." :side-panel-open? true}
                                    shortcut-example
                                    "global side panel shortcut <shortcut> is pressed while the side panel is open but unfocused")
        already-focused (dispatch {:root "."
                                   :side-panel-open? true
                                   :side-panel-open-count 3
                                   :hotkey-focus-active? true}
                                  shortcut-example
                                  "global side panel shortcut <shortcut> is pressed while app-level hotkey focus is already active")]
    (is (= [false 0 false]
           ((juxt :side-panel-open? :side-panel-open-count :hotkey-focus-active?) closed)))
    (is (= [true 1 true]
           ((juxt :side-panel-open? :side-panel-open-count :hotkey-focus-active?) opened)))
    (is (= [3 3 true]
           ((juxt :previous-side-panel-open-count
                  :side-panel-open-count
                  :hotkey-focus-active?)
            refocused)))
    (is (= [1 1]
           ((juxt :previous-side-panel-open-count :side-panel-open-count)
            refocused-default)))
    (is (= 3 (:side-panel-open-count already-focused)))
    (is (= {:previous-side-panel-open-count 2 :side-panel-open-count 2}
           (dispatch {:previous-side-panel-open-count 2 :side-panel-open-count 2}
                     "no duplicate side panel is opened")))))

(deftest hardens-generated-and-updated-keymap-contracts
  (let [created (dispatch {:root "."} "the user creates a hotkey keymap file")
        generated (:generated-keymap created)
        command-ids (hotkey-keymap/registered-command-ids (slurp "src/commands.ts"))
        update-example {"missing" "1" "obsolete" "2"}
        existing (dispatch {:root "."}
                           update-example
                           "an existing keymap has <missing> missing registered command ids and <obsolete> obsolete command ids")
        updated (dispatch existing "the user updates the hotkey keymap file")]
    (is (= created
           (dispatch created {"schema" "1"}
                     "the generated keymap uses schema version <schema>")))
    (is (= created (dispatch created "the generated keymap contains every registered command id")))
    (is (= (set command-ids) (set (keys (:bindings generated)))))
    (is (= #{"demo.obsolete-0" "demo.obsolete-1"}
           (set (filter #(str/starts-with? % "demo.obsolete-")
                        (keys (get-in existing [:existing-keymap :bindings]))))))
    (is (= [1 2]
           ((juxt (comp count :added) (comp count :removed))
            (:keymap-update-summary updated))))
    (is (= updated
           (dispatch updated
                     {"added" "1" "removed" "2"}
                     "the visible keymap update status is Keymap updated: added <added>, removed <removed>")))
    (doseq [missing-count ["0" (str (count command-ids))]]
      (is (map? (dispatch {:root "."}
                          {"missing" missing-count "obsolete" "0"}
                          "an existing keymap has <missing> missing registered command ids and <obsolete> obsolete command ids"))))
    (let [preserved (assoc updated
                           :updated-keymap {:schemaVersion 1
                                            :bindings {"data-layer.start-testing" "C-c s"}})]
      (is (= preserved
             (dispatch preserved
                     {"command" "data-layer.start-testing" "sequence" "C-c s"}
                       "command <command> keeps sequence <sequence>"))))))

(deftest hardens-keymap-load-branches-and-storage
  (let [valid-example {"command" "data-layer.start-testing" "sequence" "C-c s"}
        candidate (dispatch {:root "."}
                            valid-example
                            "a valid keymap binds command <command> to sequence <sequence>")
        loaded (dispatch candidate "the user loads the hotkey keymap file")
        duplicate-example {"first" "data-layer.start-testing"
                           "second" "data-layer.end-testing"
                           "sequence" "C-c d"}
        duplicate (dispatch {:root "."}
                            duplicate-example
                            "a keymap binds command <first> and command <second> to sequence <sequence>")
        rejected (dispatch duplicate "the user loads the hotkey keymap file")]
    (is (:hotkey-focus-active? candidate))
    (is (= [(:candidate-keymap loaded) true]
           [(:stored-keymap loaded) (:hotkey-focus-active? loaded)]))
    (is (= loaded (dispatch loaded "the keymap is stored locally")))
    (let [ran (assoc loaded :last-command-id "data-layer.start-testing")]
      (is (= ran
             (dispatch ran
                     {"command" "data-layer.start-testing"}
                       "the stored keymap runs command <command>"))))
    (is (= [true false]
           ((juxt :keymap-load-rejected? :hotkey-focus-active?) rejected)))
    (is (= rejected (dispatch rejected "the duplicate sequence is rejected")))))

(deftest hardens-focus-and-duplicate-assertions
  (let [keymap {:schemaVersion 1
                :bindings {"data-layer.start-testing" "C-c s"
                           "data-layer.end-testing" ""}}
        input-example {"input" "history-path"
                       "sequence" "C-c s"
                       "command" "data-layer.start-testing"}
        guarded (dispatch {:root "."
                           :active-keymap keymap
                           :focused-input "history-path"}
                          input-example
                          "key sequence <sequence> is pressed inside text input <input>")
        remained (dispatch guarded input-example "text input <input> remains focused")
        unfocused (dispatch remained input-example "focus leaves text input <input>")
        duplicate-state {:active-keymap keymap
                         :duplicate-sequences [{:sequence "C-c d"
                                                :command-ids ["data-layer.end-testing"
                                                              "data-layer.start-testing"]}]}
        duplicate-example {"first" "data-layer.start-testing"
                           "second" "data-layer.end-testing"
                           "sequence" "C-c d"}]
    (is (= ["history-path" nil]
           ((juxt :focused-input :last-command-id) guarded)))
    (is (= guarded
           (dispatch guarded input-example "command <command> does not run")))
    (is (= "history-path" (:focused-input remained)))
    (is (not (contains? unfocused :focused-input)))
    (is (= duplicate-state
           (dispatch duplicate-state
                     duplicate-example
                     "neither command <first> nor command <second> is rebound to sequence <sequence>")))
    (is (= duplicate-state
           (dispatch duplicate-state
                     duplicate-example
                     "a visible keymap warning names sequence <sequence>")))
    (is (= {:existing-command-id hotkey-keymap/canonical-start-command-id
            :existing-sequence hotkey-keymap/canonical-start-sequence
            :updated-keymap {:schemaVersion 1
                             :bindings {hotkey-keymap/canonical-start-command-id
                                        hotkey-keymap/canonical-start-sequence}}}
           (dispatch {:existing-command-id hotkey-keymap/canonical-start-command-id
                      :existing-sequence hotkey-keymap/canonical-start-sequence
                      :updated-keymap {:schemaVersion 1
                                       :bindings {hotkey-keymap/canonical-start-command-id
                                                  hotkey-keymap/canonical-start-sequence}}}
                     "the keymap update preserves the canonical start binding")))
    (is (= {:obsolete-command-id hotkey-keymap/canonical-obsolete-command-id}
           (dispatch {:obsolete-command-id hotkey-keymap/canonical-obsolete-command-id}
                     "the keymap update used the canonical obsolete command id")))
    (is (= {:candidate-sequence hotkey-keymap/canonical-start-sequence
            :active-keymap {:schemaVersion 1
                            :bindings {hotkey-keymap/canonical-start-command-id
                                       hotkey-keymap/canonical-start-sequence}}}
           (dispatch {:candidate-sequence hotkey-keymap/canonical-start-sequence
                      :active-keymap {:schemaVersion 1
                                      :bindings {hotkey-keymap/canonical-start-command-id
                                                 hotkey-keymap/canonical-start-sequence}}}
                     "the active keymap uses the canonical start sequence")))
    (is (= {:focused-input hotkey-keymap/canonical-history-input-name
            :side-panel-source (slurp "src/side-panel.ts")}
           (dispatch {:focused-input hotkey-keymap/canonical-history-input-name
                      :side-panel-source (slurp "src/side-panel.ts")}
                     "the text input guard targets the canonical history path input")))
    (let [canonical-duplicate-state
          (assoc duplicate-state
                 :duplicate-sequence hotkey-keymap/canonical-duplicate-sequence)]
      (is (= canonical-duplicate-state
             (dispatch canonical-duplicate-state
                       "the duplicate rejection uses the canonical duplicate sequence"))))
    (is (= {:pending-key-sequence nil :last-command-id nil}
           (dispatch {:pending-key-sequence "C-c"
                      :last-command-id "data-layer.start-testing"}
                     {"key" "Escape"}
                     "key <key> is pressed before the sequence is completed")))))
