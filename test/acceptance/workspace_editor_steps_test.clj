(ns acceptance.workspace-editor-steps-test
  (:require [acceptance.steps.workspace-editor :as workspace-editor]
            [clojure.test :refer [deftest is]]))

(deftest recognizes-accessible-persistent-workspace-tabs
  (is (workspace-editor/tabs-wired?
       "<div role=\"tablist\"><button id=\"workspace-tab-data-layer\" aria-controls=\"workspace-panel-data-layer\" aria-selected=\"true\"></button><button id=\"workspace-tab-hotkeys\"></button><section id=\"workspace-panel-hotkeys\"></section>"
       "WORKSPACE_TAB_STORAGE_KEY workspaceTabForNavigationKey showWorkspace")))

(deftest recognizes-hotkey-editor-controls
  (is (workspace-editor/editor-wired?
       "hotkey-editor hotkey-editor-filter hotkey-editor-commands Keymap files"
       "renderHotkeyEditor changeHotkeyBinding Pending hotkey change Conflict:")))
