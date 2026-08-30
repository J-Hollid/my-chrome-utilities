(ns acceptance.source-inspection.palette
  (:require [acceptance.steps.support :as support]
            [clojure.string :as str]))

(def fuzzy-package-names #{"fuse.js" "fuzzysort" "minisearch"})

(defn visible-open-button? [html]
  (and (str/includes? html "id=\"open-palette\"")
       (str/includes? html "<button")))

(defn palette-markup? [html]
  (boolean
   (and (re-find #"id=\"palette\"" html)
        (re-find #"hidden" html)
        (re-find #"id=\"palette-filter\"" html)
        (re-find #"id=\"palette-results\"" html))))

(defn opens-on-shortcut? [source shortcut]
  (let [[modifier key] (str/split shortcut #"\+" 2)]
    (and (= "Ctrl" modifier)
         (= "K" key)
         (or (str/includes? source "panelRoot")
             (support/includes-all? source
                                    ["const rootKeyup"
                                     "root?.addEventListener(\"keyup\", rootKeyup)"]))
         (str/includes? source "addEventListener")
         (str/includes? source "keyup")
         (str/includes? source "event.ctrlKey")
         (str/includes? source "event.key.toLowerCase()")
         (str/includes? source "k")
         (str/includes? source "showPalette"))))

(defn lists-registered-commands? [source]
  (and (str/includes? source "listCommands()")
       (str/includes? source "palette-results")))

(defn palette-backed-by-registry? [source]
  (and (str/includes? source "listCommands()")
       (str/includes? source "runCommandById")
       (not (re-find #"\bid\s*:\s*\"[^\"]+\"[\s\S]{0,240}\brun\s*\(" source))))

(defn filters-commands? [source filter-text]
  (and (seq filter-text)
       (str/includes? source "filterCommands")
       (str/includes? source ".filter(")
       (str/includes? source ".includes(")))

(defn runs-selected-command-on-key? [source key]
  (and (= "Enter" key)
       (str/includes? source "event.key")
       (str/includes? source "Enter")
       (str/includes? source "runSelectedCommand")
       (str/includes? source "runCommandById")))

(defn closes-on-key? [source key]
  (and (= "Escape" key)
       (str/includes? source "event.key")
       (str/includes? source "Escape")
       (str/includes? source "hidePalette")))

(defn- dependency-names [package]
  (set (concat (keys (:dependencies package))
               (keys (:devDependencies package)))))

(defn forbidden-palette-scope-findings [{:keys [package manifest files]}]
  (vec
   (concat
    (for [dependency (sort (dependency-names package))
          :when (contains? fuzzy-package-names (name dependency))]
      {:kind :fuzzy-package :path "package.json"})
    (when (:commands manifest)
      [{:kind :global-shortcut :path "manifest.json"}])
    (for [path (sort (keys files))
          :let [source (get files path)]
          :when (re-find #"(?i)keybinding|shortcut editor" source)]
      {:kind :keybinding-editor :path path}))))

(defn forbidden-palette-scope-findings-of-kind [scope kind]
  (filter #(= kind (:kind %)) (forbidden-palette-scope-findings scope)))

(defn palette-dialog? [html css source]
  (and (str/includes? html "id=\"palette\" role=\"dialog\" aria-modal=\"true\"")
       (str/includes? html "id=\"palette-filter\"")
       (str/includes? html "id=\"palette-results\" role=\"listbox\"")
       (str/includes? css "#palette { position:fixed")
       (str/includes? css "#palette[hidden] { display:none")
       (str/includes? source "sidePanelContent?.setAttribute(\"inert\", \"\")")
       (str/includes? source "filter?.focus()")))

(defn no-permanent-command-buttons? [html source]
  (and (not (str/includes? html "id=\"commands\""))
       (not (str/includes? source "commandList"))
       (not (str/includes? source "commandList.append"))))
