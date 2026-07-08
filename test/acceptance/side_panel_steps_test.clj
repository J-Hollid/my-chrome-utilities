(ns acceptance.side-panel-steps-test
  (:require [acceptance.steps.side-panel :as side-panel]
            [clojure.test :refer [deftest is]]))

(deftest extracts-side-panel-manifest-contract
  (is (= {:manifest-version 3
          :extension-name "my-chrome-utilities"
          :default-path "side-panel.html"
          :permissions #{"sidePanel"}
          :content-scripts? false}
         (side-panel/manifest-contract
          {:manifest_version 3
           :name "my-chrome-utilities"
           :side_panel {:default_path "side-panel.html"}
           :permissions ["sidePanel"]}))))

(deftest detects-action-click-side-panel-wiring
  (is (side-panel/opens-side-panel-for-active-tab?
       "chrome.action.onClicked.addListener((tab) => {
          if (tab.id !== undefined) {
            void chrome.sidePanel.open({ tabId: tab.id });
          }
        });"))
  (is (not (side-panel/opens-side-panel-for-active-tab?
            "chrome.action.onClicked.addListener(() => chrome.sidePanel.open({ windowId: 1 }));"))))

(deftest reports-forbidden-larger-scope-implementation
  (is (empty?
       (side-panel/forbidden-scope-findings
        {"src/background.ts" "chrome.action.onClicked.addListener((tab) => chrome.sidePanel.open({ tabId: tab.id }));"
         "src/side-panel.ts" "document.querySelector('#app')!.textContent = 'my-chrome-utilities';"})))
  (is (= [{:kind :command-registry :path "src/commands.ts"}
          {:kind :command-palette :path "src/palette.ts"}
          {:kind :data-layer :path "src/storage.ts"}]
         (side-panel/forbidden-scope-findings
          {"src/commands.ts" "export const commandRegistry = new Map();"
           "src/palette.ts" "export function openCommandPalette() {}"
           "src/storage.ts" "chrome.storage.local.set({ key: 'value' });"}))))

(deftest filters-forbidden-findings-by-kind
  (let [files {"src/commands.ts" "export const commandRegistry = new Map();"
               "src/palette.ts" "export function openCommandPalette() {}"
               "src/storage.ts" "chrome.storage.local.set({ key: 'value' });"}]
    (is (= [{:kind :command-registry :path "src/commands.ts"}]
           (vec (side-panel/forbidden-findings-of-kind files :command-registry))))
    (is (= [{:kind :command-palette :path "src/palette.ts"}]
           (vec (side-panel/forbidden-findings-of-kind files :command-palette))))
    (is (= [{:kind :data-layer :path "src/storage.ts"}]
           (vec (side-panel/forbidden-findings-of-kind files :data-layer))))))
