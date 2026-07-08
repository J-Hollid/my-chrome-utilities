(ns acceptance.steps.palette
  (:require [aps.json :as aps-json]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(defn- example-value [example key]
  (or (get example key)
      (get example (keyword key))))

(defn- require-example [example key]
  (let [value (example-value example key)]
    (when (str/blank? value)
      (throw (ex-info (format "Missing example value: %s" key) {:key key})))
    value))

(defn- assert! [condition message data]
  (when-not condition
    (throw (ex-info message data))))

(defn- repository-root []
  (fs/cwd))

(defn- read-json [path]
  (aps-json/read-json-file (str path)))

(defn- source-files [root]
  (->> (file-seq (fs/file (fs/path root "src")))
       (filter fs/regular-file?)
       (map (fn [file]
              [(str (fs/relativize root file)) (slurp (str file))]))
       (into (sorted-map))))

(defn visible-open-button? [html source]
  (and (str/includes? html "id=\"open-palette\"")
       (str/includes? html "<button")
       (str/includes? source "openButton")
       (str/includes? source "addEventListener")
       (str/includes? source "click")
       (str/includes? source "showPalette")))

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
         (str/includes? source "panelRoot")
         (str/includes? source "addEventListener")
         (str/includes? source "keyup")
         (str/includes? source "event.ctrlKey")
         (str/includes? source "event.key.toLowerCase()")
         (str/includes? source "k")
         (str/includes? source "showPalette"))))

(defn lists-registered-commands? [source]
  (and (str/includes? source "listCommands()")
       (str/includes? source "palette-results")))

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

(def fuzzy-package-names #{"fuse.js" "fuzzysort" "minisearch"})

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

(defn- inspect-side-panel [world]
  (let [root (or (:root world) (repository-root))]
    (assoc world
           :root root
           :side-panel-html (slurp (str (fs/path root "side-panel.html")))
           :side-panel-source (slurp (str (fs/path root "src" "side-panel.ts"))))))

(def handlers
  [{:pattern #"^the side panel is displayed$"
    :handler (fn [world _example _captures]
               (inspect-side-panel world))}

   {:pattern #"^a visible button opens the command palette$"
    :handler (fn [world _example _captures]
               (assert! (visible-open-button? (:side-panel-html world)
                                              (:side-panel-source world))
                        "Visible palette button is not wired to open the palette."
                        {})
               world)}

   {:pattern #"^shortcut <([A-Za-z0-9_]+)> is pressed inside the side panel$"
    :handler (fn [world example [shortcut-key]]
               (assoc world :shortcut (require-example example shortcut-key)))}

   {:pattern #"^the command palette opens$"
    :handler (fn [world _example _captures]
               (assert! (palette-markup? (:side-panel-html world))
                        "Palette markup is missing."
                        {})
               (assert! (opens-on-shortcut? (:side-panel-source world)
                                            (:shortcut world))
                        "Palette is not opened by the requested side-panel shortcut."
                        {:shortcut (:shortcut world)})
               world)}

   {:pattern #"^the command palette is open$"
    :handler (fn [world _example _captures]
               (inspect-side-panel world))}

   {:pattern #"^registered commands are listed$"
    :handler (fn [world _example _captures]
               (assert! (lists-registered-commands? (:side-panel-source world))
                        "Registered commands are not rendered in the palette."
                        {})
               world)}

   {:pattern #"^the user types <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [filter-key]]
               (assoc world :filter-text (require-example example filter-key)))}

   {:pattern #"^only matching commands are shown$"
    :handler (fn [world _example _captures]
               (assert! (filters-commands? (:side-panel-source world)
                                           (:filter-text world))
                        "Palette does not filter command results."
                        {:filter-text (:filter-text world)})
               world)}

   {:pattern #"^command <([A-Za-z0-9_]+)> is selected in the command palette$"
    :handler (fn [world example [command-key]]
               (-> world
                   inspect-side-panel
                   (assoc :selected-command-id (require-example example command-key))))}

   {:pattern #"^key <([A-Za-z0-9_]+)> is pressed$"
    :handler (fn [world example [key-name]]
               (assoc world :pressed-key (require-example example key-name)))}

   {:pattern #"^command <([A-Za-z0-9_]+)> runs$"
    :handler (fn [world example [command-key]]
               (let [command-id (require-example example command-key)]
                 (assert! (= command-id (:selected-command-id world))
                          "Selected command does not match the command expected to run."
                          {:expected command-id :actual (:selected-command-id world)})
                 (assert! (runs-selected-command-on-key? (:side-panel-source world)
                                                         (:pressed-key world))
                          "Palette does not run the selected command for the requested key."
                          {:key (:pressed-key world)})
                 world))}

   {:pattern #"^visible command log records that command <([A-Za-z0-9_]+)> ran$"
    :handler (fn [world example [command-key]]
               (let [command-id (require-example example command-key)]
                 (assert! (and (re-find #"command-log" (:side-panel-source world))
                               (re-find (re-pattern (java.util.regex.Pattern/quote command-id))
                                        (slurp (str (fs/path (:root world) "src" "commands.ts")))))
                          "Visible command log is not connected to the command run."
                          {:command-id command-id})
                 world))}

   {:pattern #"^the command palette closes$"
    :handler (fn [world _example _captures]
               (assert! (closes-on-key? (:side-panel-source world)
                                        (:pressed-key world))
                        "Palette does not close for the requested key."
                        {:key (:pressed-key world)})
               world)}

   {:pattern #"^command palette implementation is inspected$"
    :handler (fn [world _example _captures]
               (let [root (or (:root world) (repository-root))]
                 (assoc world
                        :root root
                        :package (read-json (fs/path root "package.json"))
                        :manifest (read-json (fs/path root "manifest.json"))
                        :implementation-files (source-files root))))}

   {:pattern #"^no fuzzy-search package dependency is declared$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :fuzzy-package (:kind %))
                                      (forbidden-palette-scope-findings
                                       {:package (:package world)
                                        :manifest (:manifest world)
                                        :files (:implementation-files world)}))]
                 (assert! (empty? findings)
                          "Fuzzy-search dependency was found."
                          {:findings (vec findings)})
                 world))}

   {:pattern #"^no global shortcuts are declared$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :global-shortcut (:kind %))
                                      (forbidden-palette-scope-findings
                                       {:package (:package world)
                                        :manifest (:manifest world)
                                        :files (:implementation-files world)}))]
                 (assert! (empty? findings)
                          "Global shortcut declaration was found."
                          {:findings (vec findings)})
                 world))}

   {:pattern #"^no user keybinding editor is present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :keybinding-editor (:kind %))
                                      (forbidden-palette-scope-findings
                                       {:package (:package world)
                                        :manifest (:manifest world)
                                        :files (:implementation-files world)}))]
                 (assert! (empty? findings)
                          "User keybinding editor was found."
                          {:findings (vec findings)})
                 world))}])
