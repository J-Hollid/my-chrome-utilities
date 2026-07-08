(ns acceptance.data-layer-steps-test
  (:require [acceptance.steps.data-layer :as data-layer]
            [clojure.test :refer [deftest is]]))

(def settings-html
  "<section id=\"data-layer-settings\">
     <input id=\"history-path\" value=\"queue.history\" />
     <output id=\"history-path-display\">queue.history</output>
     <output id=\"history-path-status\">ready</output>
   </section>")

(def data-layer-source
  "const HISTORY_PATH_STORAGE_KEY = 'historyArrayPath';
   export function setHistoryArrayPath(path) {
     localStorage.setItem(HISTORY_PATH_STORAGE_KEY, path);
   }
   export function getPathStatus(pageObject, path) {
     const value = resolvePath(pageObject, path);
     if (value === undefined) return 'path missing';
     return Array.isArray(value) ? 'ready' : 'not an array';
   }")

(deftest resolves-history-array-path-status
  (is (= "ready"
         (data-layer/path-status {:queue {:history []}} "queue.history")))
  (is (= "path missing"
         (data-layer/path-status {:queue {:history []}} "missing.path")))
  (is (= "not an array"
         (data-layer/path-status {:queue {:value 1}} "queue.value"))))

(deftest recognizes-settings-and-persistence-contract
  (is (data-layer/settings-allow-history-path-entry? settings-html "queue.history"))
  (is (data-layer/settings-show-history-path?
       settings-html
       "historyPathDisplay.textContent = path;"
       "queue.history"))
  (is (data-layer/history-path-persisted-locally? data-layer-source)))

(deftest reports-disallowed-data-layer-scope
  (is (empty?
       (data-layer/forbidden-data-layer-scope-findings
        {"src/data-layer.ts" data-layer-source
         "src/side-panel.ts" "document.querySelector('#history-path');"})))
  (is (= [{:kind :config-import :path "src/import.ts"}
          {:kind :config-export :path "src/export.ts"}
          {:kind :validation-schema :path "src/schema.ts"}]
         (data-layer/forbidden-data-layer-scope-findings
          {"src/import.ts" "importConfig(file)"
           "src/export.ts" "exportConfig()"
           "src/schema.ts" "const validationSchema = z.object({});"}))))
