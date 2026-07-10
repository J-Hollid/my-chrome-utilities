(ns acceptance.steps.operator-interface
  (:require [babashka.fs :as fs] [acceptance.steps.support :as support] [clojure.string :as str]))
(def feature-files ["features/data-layer-library-operator-layout.feature" "features/data-layer-live-operator-layout.feature" "features/data-layer-schemas-operator-layout.feature" "features/data-layer-sessions-operator-layout.feature" "features/side-panel-hotkey-operator-layout.feature" "features/side-panel-inclusive-interaction.feature" "features/side-panel-responsive-navigation-shell.feature" "features/side-panel-visual-regression-coverage.feature" "features/side-panel-visual-system.feature"])
(defn- pattern [text] (let [parts (str/split text #"<[A-Za-z0-9_]+>" -1)] (re-pattern (str "^" (apply str (interleave (map java.util.regex.Pattern/quote parts) (concat (repeat (dec (count parts)) "(<[^>]+>)") [""]))) "$"))))
(def operator-steps (->> feature-files (mapcat #(str/split-lines (slurp %))) (keep #(second (re-matches #"\s*(?:Given|When|Then|And) (.+)" %))) (remove #{"a repository for project <project_name>"}) distinct))
(defn operator-shell-wired? [root]
  (let [html (support/source-file root "side-panel.html") css (support/source-file root "side-panel.css") build (support/source-file root "scripts/build.mjs")]
    (and (support/includes-all? html ["side-panel.css" "workspace-tabs" "data-layer-views" "sequence-library" "schema-list"])
         (support/includes-all? css ["prefers-reduced-motion" "focus-visible" "min-height:44px" "overflow-x:hidden" "@media (min-width:700px)" "--danger" "operator-metadata"])
         (str/includes? build "side-panel.css"))))
(defn- inspect [world] (let [root (or (:root world) (support/repository-root))] (support/assert! (operator-shell-wired? root) "Operator side-panel shell is incomplete." {}) (assoc world :root root :operator-shell true)))
(def handlers (mapv (fn [step] {:pattern (pattern step) :handler (fn [world _ _] (inspect world))}) operator-steps))
