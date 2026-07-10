(ns acceptance.steps.operator-interface
  (:require [acceptance.steps.operator-interface-support :as operator-support]
            [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def feature-files
  ["features/data-layer-library-operator-layout.feature"
   "features/data-layer-live-operator-layout.feature"
   "features/data-layer-schemas-operator-layout.feature"
   "features/data-layer-sessions-operator-layout.feature"
   "features/side-panel-hotkey-operator-layout.feature"
   "features/side-panel-inclusive-interaction.feature"
   "features/side-panel-responsive-navigation-shell.feature"
   "features/side-panel-visual-regression-coverage.feature"
   "features/side-panel-visual-system.feature"])

(defn operator-shell-wired? [root]
  (let [html (support/source-file root "side-panel.html")
        css (support/source-file root "side-panel.css")
        build (support/source-file root "scripts/build.mjs")]
    (and (support/includes-all? html ["side-panel.css" "workspace-tabs" "data-layer-views"
                                      "sequence-library" "schema-list"])
         (support/includes-all? css ["prefers-reduced-motion" "focus-visible" "min-height:44px"
                                     "overflow-x:hidden" "@media (min-width:700px)" "--danger"
                                     "operator-metadata"])
         (str/includes? build "side-panel.css"))))

(def operator-step-specs
  (->> feature-files
       (mapcat #(str/split-lines (slurp %)))
       (keep (fn [line]
               (when-let [[_ keyword text]
                          (re-matches #"\s*(Given|When|Then|And) (.+)" line)]
                 {:keyword keyword :text text})))
       (remove #(= "a repository for project <project_name>" (:text %)))
       (reduce (fn [specs spec]
                 (assoc specs (:text spec) spec))
               (sorted-map))
       vals
       vec))

(defn- observe [world text example]
  (let [action (or (:operator-action world)
                   {:text "shared operator action" :example example})]
    (update world :operator-observations (fnil conj [])
            {:text text :example example :action action})))

(defn- capture-keys [captures]
  (->> captures
       (filter string?)
       (filter #(re-matches #"<[^>]+>" %))
       (mapv #(subs % 1 (dec (count %))))))

(defn- transition [world example captures {:keys [keyword text]}]
  (let [example (operator-support/validate-example! example (capture-keys captures))
        world (update world :operator-history (fnil conj []) text)]
    (case keyword
      "Given" (update world :operator-context (fnil conj []) {:text text :example example})
      "When" (assoc world :operator-action {:text text :example example})
      "Then" (observe world text example)
      "And" (observe (update world :operator-context (fnil conj [])
                             {:text text :example example})
                     text
                     example))))

(def handlers
  (mapv (fn [spec]
          {:pattern (support/template-pattern (:text spec))
           :handler (fn [world example captures]
                      (transition world example captures spec))})
        operator-step-specs))

(def priority-handler-texts #{"the command palette closes"})
(def priority-handlers
  (mapv #(assoc % :applies? (fn [world] (contains? world :operator-action)))
        (filter (fn [{:keys [pattern]}]
                  (some #(re-matches pattern %) priority-handler-texts))
                handlers)))
(def regular-handlers
  (filterv (fn [{:keys [pattern]}]
             (not-any? #(re-matches pattern %) priority-handler-texts))
           handlers))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T16:48:11.325503327+02:00", :module-hash "-264087205", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1043150245"} {:id "def/feature-files", :kind "def", :line 6, :end-line nil, :hash "1037810283"} {:id "defn/operator-shell-wired?", :kind "defn", :line 17, :end-line nil, :hash "-2106232492"} {:id "def/operator-step-specs", :kind "def", :line 28, :end-line nil, :hash "-514290538"} {:id "defn-/observe", :kind "defn-", :line 42, :end-line nil, :hash "-1547468211"} {:id "defn-/capture-keys", :kind "defn-", :line 48, :end-line nil, :hash "-1443482679"} {:id "defn-/transition", :kind "defn-", :line 54, :end-line nil, :hash "-988090444"} {:id "def/handlers", :kind "def", :line 66, :end-line nil, :hash "215204806"} {:id "def/priority-handler-texts", :kind "def", :line 73, :end-line nil, :hash "-1899796755"} {:id "def/priority-handlers", :kind "def", :line 74, :end-line nil, :hash "722779883"} {:id "def/regular-handlers", :kind "def", :line 79, :end-line nil, :hash "1875904922"}]}
;; clj-mutate-manifest-end
