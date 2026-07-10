(ns acceptance.palette-steps-test
  (:require [acceptance.steps.palette :as palette]
            [acceptance.runtime :as runtime]
            [clojure.test :refer [deftest is]]))

(def palette-html
  "<main id=\"side-panel-root\">
     <button id=\"open-palette\" type=\"button\">Commands</button>
     <section id=\"palette\" hidden>
       <input id=\"palette-filter\" />
       <ul id=\"palette-results\"></ul>
     </section>
     <output id=\"command-log\"></output>
   </main>")

(def palette-source
  "const panelRoot = document.querySelector('#side-panel-root');
   const openButton = document.querySelector('#open-palette');
   const palette = document.querySelector('#palette');
   const filter = document.querySelector('#palette-filter');
   const results = document.querySelector('#palette-results');
   function showPalette() { palette.hidden = false; }
   function hidePalette() { palette.hidden = true; }
   function filterCommands(text) { return listCommands().filter((command) => command.title.toLowerCase().includes(text)); }
   function runSelectedCommand() { runCommandById('demo.say-hello', { record }); }
   openButton.addEventListener('click', showPalette);
   panelRoot.addEventListener('keyup', (event) => { if (event.ctrlKey && event.key.toLowerCase() === 'k') showPalette(); });
   filter.addEventListener('keyup', (event) => { if (event.key === 'Enter') runSelectedCommand(); if (event.key === 'Escape') hidePalette(); });")

(deftest recognizes-visible-palette-controls
  (is (palette/visible-open-button? palette-html palette-source))
  (is (palette/palette-markup? palette-html)))

(deftest recognizes-local-shortcut-and-key-actions
  (is (palette/opens-on-shortcut? palette-source "Ctrl+K"))
  (is (palette/runs-selected-command-on-key? palette-source "Enter"))
  (is (palette/closes-on-key? palette-source "Escape")))

(deftest recognizes-listing-and-filtering
  (is (palette/lists-registered-commands? palette-source))
  (is (palette/palette-backed-by-registry? palette-source))
  (is (palette/filters-commands? palette-source "hello")))

(deftest canonical-filter-query-dispatches
  (let [state {:filter-text palette/canonical-filter-text}
        result (runtime/execute-step!
                state
                {}
                {:keyword "And"
                 :text "the command filter uses the canonical hello query"}
                palette/handlers)]
    (is (= state result))))

(deftest reports-disallowed-palette-scope
  (is (empty?
       (palette/forbidden-palette-scope-findings
        {:package {:dependencies {}
                   :devDependencies {:typescript "^5.9.3"}}
         :manifest {:permissions ["sidePanel"]}
         :files {"src/side-panel.ts" palette-source}})))
  (is (= [{:kind :fuzzy-package :path "package.json"}
          {:kind :global-shortcut :path "manifest.json"}
          {:kind :keybinding-editor :path "src/settings.ts"}]
         (palette/forbidden-palette-scope-findings
          {:package {:dependencies {:fuse.js "^7.0.0"}}
           :manifest {:commands {:open-palette {:suggested_key "Ctrl+K"}}}
           :files {"src/settings.ts" "export function openKeybindingEditor() {}"}}))))

(deftest filters-disallowed-palette-scope-by-kind
  (let [scope {:package {:dependencies {:fuse.js "^7.0.0"}}
               :manifest {:commands {:open-palette {:suggested_key "Ctrl+K"}}}
               :files {"src/settings.ts" "export function openKeybindingEditor() {}"}}]
    (is (= [{:kind :fuzzy-package :path "package.json"}]
           (vec (palette/forbidden-palette-scope-findings-of-kind
                 scope
                 :fuzzy-package))))
    (is (= [{:kind :global-shortcut :path "manifest.json"}]
           (vec (palette/forbidden-palette-scope-findings-of-kind
                 scope
                 :global-shortcut))))
    (is (= [{:kind :keybinding-editor :path "src/settings.ts"}]
           (vec (palette/forbidden-palette-scope-findings-of-kind
                 scope
                 :keybinding-editor))))))
