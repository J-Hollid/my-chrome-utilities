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
         (data-layer/path-status {:queue {:value 1}} "queue.value")))
  (is (= "path missing"
         (data-layer/path-status {:queue 1} "queue.history"))))

(deftest recognizes-settings-and-persistence-contract
  (is (data-layer/settings-allow-history-path-entry? settings-html "queue.history"))
  (is (data-layer/settings-show-history-path?
       settings-html
       "historyPathDisplay.textContent = path;"
       "queue.history"))
  (is (data-layer/history-path-persisted-locally? data-layer-source)))

(deftest records-history-path-text-entry
  (let [state (data-layer/enter-history-array-path
               {:side-panel-html settings-html
                :side-panel-source (str "historyPathInput.addEventListener('input', () => { "
                                        "const path = setHistoryArrayPath(historyPathInput.value); "
                                        "renderHistoryPath(path); });")}
               "some.deep.object.history")]
    (is (= "some.deep.object.history" (:history-path-field-value state)))
    (is (= "some.deep.object.history" (:history-path state)))))

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

(deftest filters-disallowed-data-layer-scope-by-kind
  (let [files {"src/import.ts" "importConfig(file)"
               "src/export.ts" "exportConfig()"
               "src/schema.ts" "const validationSchema = z.object({});"}]
    (is (= [{:kind :config-import :path "src/import.ts"}]
           (vec (data-layer/forbidden-data-layer-scope-findings-of-kind
                 files
                 :config-import))))
    (is (= [{:kind :config-export :path "src/export.ts"}]
           (vec (data-layer/forbidden-data-layer-scope-findings-of-kind
                 files
                 :config-export))))
    (is (= [{:kind :validation-schema :path "src/schema.ts"}]
           (vec (data-layer/forbidden-data-layer-scope-findings-of-kind
                 files
                 :validation-schema))))))
