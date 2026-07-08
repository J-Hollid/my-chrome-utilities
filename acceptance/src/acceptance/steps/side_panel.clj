(ns acceptance.steps.side-panel
  (:require [acceptance.steps.support :as support]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(def build-shell-options support/build-shell-options)

(defn manifest-contract [manifest]
  {:manifest-version (:manifest_version manifest)
   :extension-name (:name manifest)
   :default-path (get-in manifest [:side_panel :default_path])
   :permissions (set (:permissions manifest))
   :content-scripts? (contains? manifest :content_scripts)})

(defn opens-side-panel-for-active-tab? [source]
  (boolean
   (and (re-find #"chrome\.action\.onClicked\.addListener" source)
        (re-find #"chrome\.sidePanel\.open" source)
        (re-find #"tabId\s*:\s*tab\.id" source))))

(def forbidden-scopes
  [{:kind :command-registry
    :pattern #"(?i)commandRegistry|command registry|commands registry"}
   {:kind :command-palette
    :pattern #"(?i)commandPalette|command palette"}
   {:kind :data-layer
    :pattern #"(?i)chrome\.storage|localStorage|indexedDB|fetch\s*\(|data layer"}])

(defn forbidden-scope-findings [files]
  (support/pattern-findings forbidden-scopes files))

(defn- implementation-files [root]
  (assoc (support/source-files root)
         "manifest.json" (slurp (str (fs/path root "manifest.json")))))

(defn- inspect-manifest [world]
  (let [root (or (:root world) (support/repository-root))]
    (assoc world
           :root root
           :manifest (support/read-json (fs/path root "manifest.json")))))

(defn- built-manifest [world]
  (support/read-json (fs/path (:root world) "dist" "manifest.json")))

(defn- dist-path [world path]
  (fs/path (:root world) "dist" path))

(def handlers
  [{:pattern #"^the extension manifest is inspected$"
    :handler (fn [world _example _captures]
               (inspect-manifest world))}

   {:pattern #"^manifest_version is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [manifest-version-key]]
               (let [expected (parse-long (support/require-example example manifest-version-key))
                     actual (:manifest-version (manifest-contract (:manifest world)))]
                 (support/assert! (= expected actual)
                                  "Manifest version does not match."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^the extension name is <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [project-key]]
               (let [expected (support/require-example example project-key)
                     actual (:extension-name (manifest-contract (:manifest world)))]
                 (support/assert! (= expected actual)
                                  "Extension name does not match."
                                  {:expected expected :actual actual})
                 world))}

   {:pattern #"^side_panel\.default_path points to the side panel HTML entry$"
    :handler (fn [world _example _captures]
               (let [default-path (:default-path (manifest-contract (:manifest world)))
                     html-path (fs/path (:root world) default-path)]
                 (support/assert! (= "side-panel.html" default-path)
                                  "Manifest side panel default path is incorrect."
                                  {:actual default-path})
                 (support/assert! (fs/exists? html-path)
                                  "Side panel HTML entry does not exist."
                                  {:path (str html-path)})
                 world))}

   {:pattern #"^permission <([A-Za-z0-9_]+)> is declared$"
    :handler (fn [world example [permission-key]]
               (let [expected (support/require-example example permission-key)
                     permissions (:permissions (manifest-contract (:manifest world)))]
                 (support/assert! (contains? permissions expected)
                                  "Expected permission is not declared."
                                  {:expected expected :permissions permissions})
                 world))}

   {:pattern #"^no content scripts are declared$"
    :handler (fn [world _example _captures]
               (support/assert! (not (:content-scripts? (manifest-contract (:manifest world))))
                                "Manifest declares content scripts."
                                {})
               world)}

   {:pattern #"^the extension action is clicked$"
    :handler (fn [world _example _captures]
               (let [root (or (:root world) (support/repository-root))]
                 (assoc world
                        :root root
                        :background-source (slurp (str (fs/path root "src" "background.ts"))))))}

   {:pattern #"^the side panel opens for the active tab$"
    :handler (fn [world _example _captures]
               (support/assert! (opens-side-panel-for-active-tab? (:background-source world))
                                "Extension action does not open the side panel for the active tab."
                                {})
               world)}

   {:pattern #"^the production extension is built$"
    :handler (fn [world _example _captures]
               (support/run-build-command (assoc world :root (or (:root world) (support/repository-root)))))}

   {:pattern #"^dist can be loaded unpacked in Chrome$"
    :handler (fn [world _example _captures]
               (support/ensure-build-passed! world)
               (let [manifest (built-manifest world)
                     contract (manifest-contract manifest)
                     service-worker (get-in manifest [:background :service_worker])
                     side-panel-path (:default-path contract)]
                 (support/assert! (= 3 (:manifest-version contract))
                                  "Built manifest is not MV3."
                                  contract)
                 (support/assert! (not (:content-scripts? contract))
                                  "Built manifest declares content scripts."
                                  {})
                 (support/assert! (fs/exists? (dist-path world service-worker))
                                  "Built background service worker is missing."
                                  {:path service-worker})
                 (support/assert! (fs/exists? (dist-path world side-panel-path))
                                  "Built side panel HTML is missing."
                                  {:path side-panel-path})
                 world))}

   {:pattern #"^the built side panel HTML entry exists$"
    :handler (fn [world _example _captures]
               (support/ensure-build-passed! world)
               (support/assert! (fs/exists? (dist-path world "side-panel.html"))
                                "Built side panel HTML entry is missing."
                                {:path "dist/side-panel.html"})
               world)}

   {:pattern #"^the side panel displays <([A-Za-z0-9_]+)>$"
    :handler (fn [world example [project-key]]
               (support/ensure-build-passed! world)
               (let [expected (support/require-example example project-key)
                     html (slurp (str (dist-path world "side-panel.html")))]
                 (support/assert! (str/includes? html expected)
                                  "Side panel HTML does not display the project name."
                                  {:expected expected})
                 world))}

   {:pattern #"^the extension implementation is inspected$"
    :handler (fn [world _example _captures]
               (let [root (or (:root world) (support/repository-root))]
                 (assoc world
                        :root root
                        :implementation-files (implementation-files root))))}

   {:pattern #"^no command registry is present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :command-registry (:kind %))
                                      (forbidden-scope-findings (:implementation-files world)))]
                 (support/assert! (empty? findings)
                                  "Command registry implementation was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^no command palette is present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :command-palette (:kind %))
                                      (forbidden-scope-findings (:implementation-files world)))]
                 (support/assert! (empty? findings)
                                  "Command palette implementation was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^no data layer functionality is present$"
    :handler (fn [world _example _captures]
               (let [findings (filter #(= :data-layer (:kind %))
                                      (forbidden-scope-findings (:implementation-files world)))]
                 (support/assert! (empty? findings)
                                  "Data layer implementation was found."
                                  {:findings (vec findings)})
                 world))}])
