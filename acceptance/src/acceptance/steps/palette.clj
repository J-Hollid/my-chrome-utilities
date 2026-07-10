(ns acceptance.steps.palette
  (:require [acceptance.steps.support :as support]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(def canonical-filter-text "hello")

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

(defn forbidden-palette-scope-findings-of-kind [scope kind]
  (filter #(= kind (:kind %)) (forbidden-palette-scope-findings scope)))

(defn- inspect-side-panel [world]
  (let [root (or (:root world) (support/repository-root))]
    (assoc world
           :root root
           :side-panel-html (support/source-file root "side-panel.html")
           :side-panel-source (str/join "\n"
                                       [(support/source-file root "src/side-panel.ts")
                                        (support/source-file root "src/command-palette-ui.ts")
                                        (support/source-file root "src/command-palette.ts")]))))

(defn- palette-scope [world]
  {:package (:package world)
   :manifest (:manifest world)
   :files (:implementation-files world)})

(def handlers
  [{:pattern #"^the side panel is displayed$"
    :handler (fn [world _example _captures]
               (inspect-side-panel world))}

   {:pattern #"^a visible button opens the command palette$"
    :handler (fn [world _example _captures]
               (support/assert! (visible-open-button? (:side-panel-html world)
                                                       (:side-panel-source world))
                                "Visible palette button is not wired to open the palette."
                                {})
               world)}

   {:pattern #"^shortcut <([A-Za-z0-9_]+)> is pressed inside the side panel$"
    :handler (fn [world example [shortcut-key]]
               (assoc world :shortcut (support/require-example example shortcut-key)))}

   {:pattern #"^the command palette opens$"
    :handler (fn [world _example _captures]
               (support/assert! (palette-markup? (:side-panel-html world))
                                "Palette markup is missing."
                                {})
               (support/assert! (opens-on-shortcut? (:side-panel-source world)
                                                    (:shortcut world))
                                "Palette is not opened by the requested side-panel shortcut."
                                {:shortcut (:shortcut world)})
               world)}

   {:pattern #"^the command palette is open$"
    :handler (fn [world _example _captures]
               (inspect-side-panel world))}

   {:pattern #"^registered commands are listed$"
    :handler (fn [world _example _captures]
               (support/assert! (lists-registered-commands? (:side-panel-source world))
                                "Registered commands are not rendered in the palette."
                                {})
               world)}

   {:pattern #"^the user types <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [filter-key]]
               (assoc world :filter-text (support/require-example example filter-key)))}

   {:pattern #"^only matching commands are shown$"
    :handler (fn [world _example _captures]
               (support/assert! (filters-commands? (:side-panel-source world)
                                                   (:filter-text world))
                                "Palette does not filter command results."
                                {:filter-text (:filter-text world)})
               world)}

   {:pattern #"^the command filter uses the canonical hello query$"
    :handler (fn [world _example _captures]
               (support/assert! (= canonical-filter-text (:filter-text world))
                                "Command filter did not use the canonical query."
                                {:expected canonical-filter-text
                                 :actual (:filter-text world)})
               world)}

   {:pattern #"^command <([A-Za-z0-9_]+)> is selected in the command palette$"
    :handler (fn [world example [command-key]]
               (-> world
                   inspect-side-panel
                   (assoc :selected-command-id (support/require-example example command-key))))}

   {:pattern #"^key <([A-Za-z0-9_]+)> is pressed$"
    :handler (fn [world example [key-name]]
               (assoc world :pressed-key (support/require-example example key-name)))}

   {:pattern #"^command <([A-Za-z0-9_]+)> runs$"
    :handler (fn [world example [command-key]]
               (let [command-id (support/require-example example command-key)]
                 (if (contains? world :last-command-id)
                   (support/assert! (= command-id (:last-command-id world))
                                    "Hotkey keymap did not run the expected command."
                                    {:expected command-id :actual (:last-command-id world)})
                   (do
                     (support/assert! (= command-id (:selected-command-id world))
                                      "Selected command does not match the command expected to run."
                                      {:expected command-id :actual (:selected-command-id world)})
                     (support/assert! (runs-selected-command-on-key? (:side-panel-source world)
                                                                     (:pressed-key world))
                                      "Palette does not run the selected command for the requested key."
                                      {:key (:pressed-key world)})))
                 world))}

   {:pattern #"^visible command log records that command <([A-Za-z0-9_]+)> ran$"
    :handler (fn [world example [command-key]]
               (let [command-id (support/require-example example command-key)]
                 (support/assert! (and (re-find #"command-log" (:side-panel-source world))
                                       (re-find (re-pattern (java.util.regex.Pattern/quote command-id))
                                                (support/source-file (:root world) "src/commands.ts")))
                                  "Visible command log is not connected to the command run."
                                  {:command-id command-id})
                 world))}

   {:pattern #"^the command palette closes$"
    :handler (fn [world _example _captures]
               (support/assert! (closes-on-key? (:side-panel-source world)
                                                (:pressed-key world))
                                "Palette does not close for the requested key."
                                {:key (:pressed-key world)})
               world)}

   {:pattern #"^command palette implementation is inspected$"
    :handler (fn [world _example _captures]
               (let [root (or (:root world) (support/repository-root))]
                 (assoc world
                        :root root
                        :package (support/read-json (fs/path root "package.json"))
                        :manifest (support/read-json (fs/path root "manifest.json"))
                        :implementation-files (support/source-files root))))}

   {:pattern #"^no fuzzy-search package dependency is declared$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-palette-scope-findings-of-kind
                               (palette-scope world)
                               :fuzzy-package)]
                 (support/assert! (empty? findings)
                                  "Fuzzy-search dependency was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^no global shortcuts are declared$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-palette-scope-findings-of-kind
                               (palette-scope world)
                               :global-shortcut)]
                 (support/assert! (empty? findings)
                                  "Global shortcut declaration was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^no user keybinding editor is present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-palette-scope-findings-of-kind
                               (palette-scope world)
                               :keybinding-editor)]
                 (support/assert! (empty? findings)
                                  "User keybinding editor was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^command palette commands are backed by the command registry$"
    :handler (fn [world _example _captures]
               (let [world (inspect-side-panel world)]
                 (support/assert! (palette-backed-by-registry? (:side-panel-source world))
                                  "Command palette commands are not backed by the command registry."
                                  {})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T23:13:01.442160559+02:00", :module-hash "-564632470", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "38193441"} {:id "def/canonical-filter-text", :kind "def", :line 6, :end-line nil, :hash "1724626866"} {:id "defn/visible-open-button?", :kind "defn", :line 8, :end-line nil, :hash "-316165643"} {:id "defn/palette-markup?", :kind "defn", :line 16, :end-line nil, :hash "1302085553"} {:id "defn/opens-on-shortcut?", :kind "defn", :line 23, :end-line nil, :hash "-808115028"} {:id "defn/lists-registered-commands?", :kind "defn", :line 35, :end-line nil, :hash "-1679333293"} {:id "defn/palette-backed-by-registry?", :kind "defn", :line 39, :end-line nil, :hash "1086146396"} {:id "defn/filters-commands?", :kind "defn", :line 44, :end-line nil, :hash "-256055306"} {:id "defn/runs-selected-command-on-key?", :kind "defn", :line 50, :end-line nil, :hash "259571416"} {:id "defn/closes-on-key?", :kind "defn", :line 57, :end-line nil, :hash "-1867581278"} {:id "def/fuzzy-package-names", :kind "def", :line 63, :end-line nil, :hash "1698743278"} {:id "defn-/dependency-names", :kind "defn-", :line 65, :end-line nil, :hash "-1509705126"} {:id "defn/forbidden-palette-scope-findings", :kind "defn", :line 69, :end-line nil, :hash "646918192"} {:id "defn/forbidden-palette-scope-findings-of-kind", :kind "defn", :line 82, :end-line nil, :hash "-2111391609"} {:id "defn-/inspect-side-panel", :kind "defn-", :line 85, :end-line nil, :hash "1052489983"} {:id "defn-/palette-scope", :kind "defn-", :line 94, :end-line nil, :hash "-1191740757"} {:id "def/handlers", :kind "def", :line 99, :end-line nil, :hash "102000136"}]}
;; clj-mutate-manifest-end
