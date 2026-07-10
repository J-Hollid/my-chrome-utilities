(ns hardening.workspace-editor-hardening-test
  (:require [acceptance.steps.workspace-editor :as workspace-editor]
            [clojure.test :refer [deftest is]]
            [hardening.support :as support]))

(def dispatch (partial support/dispatch workspace-editor/handlers))

(deftest hardens-workspace-selection-and-navigation
  (let [tab-example {"tab" "Hotkeys"}
        active (dispatch {:root "."}
                         tab-example
                         "workspace tab <tab> is active")
        focused (assoc active :pressed-key "Tab")]
    (is (= active
           (dispatch active tab-example "only the panel for tab <tab> is visible")))
    (is (= active
           (dispatch active tab-example "workspace tab <tab> is exposed as selected")))
    (is (= active
           (dispatch active tab-example
                     "workspace tab <tab> remains active after the side panel reloads")))
    (is (= active
           (dispatch active tab-example "keyboard focus moves to workspace tab <tab>")))
    (is (= focused
           (dispatch focused tab-example
                     "keyboard focus moves into the panel for tab <tab>")))
    (is (thrown? clojure.lang.ExceptionInfo
                 (dispatch {:html "Hotkeys"}
                           {"first" "Hotkeys" "second" "Hotkeys"}
                           "workspace tabs are ordered <first> then <second>")))
    (is (= "Hotkeys"
           (:active-tab
            (dispatch {:root "."}
                      {"command" "navigation.show-hotkeys"}
                      "workspace navigation command <command> runs"))))
    (is (= "Data Layer"
           (:active-tab
            (dispatch {:root "."}
                      {"command" "navigation.show-data-layer"}
                      "workspace navigation command <command> runs"))))))

(deftest hardens-editor-search-and-binding-transitions
  (let [example {"command" "data-layer.start-testing"
                 "sequence" "C-c s"
                 "new_sequence" "C-c t"
                 "query" "data-layer"}
        initial (dispatch {:root "."}
                          example
                          "command <command> uses key sequence <sequence>")
        searched (dispatch initial example "the user searches for <query>")
        changed (dispatch searched
                          example
                          "the user changes command <command> to key sequence <new_sequence> in the hotkey editor")]
    (is (= searched
           (dispatch searched
                     example
                     "only commands matching <query> by title, command id, or key sequence are listed")))
    (is (= changed
           (dispatch changed
                     example
                     "key sequence <new_sequence> runs command <command>")))
    (is (= changed
           (dispatch changed
                     example
                     "key sequence <sequence> no longer runs command <command>")))
    (is (= changed
           (dispatch changed
                     example
                     "key sequence <new_sequence> remains active after the side panel reloads")))))

(deftest hardens-conflict-and-pending-change-state
  (let [example {"command" "data-layer.start-testing"
                 "edited" "data-layer.end-testing"
                 "sequence" "C-c s"
                 "edited_sequence" "C-c e"}
        initial (dispatch {:root "."}
                          example
                          "command <command> uses key sequence <sequence>")
        edited (dispatch initial
                         example
                         "edited command <edited> uses prior key sequence <edited_sequence>")
        pending (assoc edited :pending-sequence "C-c s")]
    (is (= edited
           (dispatch edited
                     example
                     "command <command> retains key sequence <sequence>")))
    (is (= edited
           (dispatch edited
                     example
                     "edited command <edited> retains prior key sequence <edited_sequence>")))
    (is (= pending
           (dispatch pending
                     example
                     "key sequence <sequence> is shown as the pending hotkey change")))))
