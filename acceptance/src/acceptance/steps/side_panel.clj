(ns acceptance.steps.side-panel
  (:require [acceptance.steps.support :as support]
            [babashka.fs :as fs]
            [clojure.string :as str]))

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

(defn forbidden-findings-of-kind [files kind]
  (filter #(= kind (:kind %)) (forbidden-scope-findings files)))

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
               (let [findings (forbidden-findings-of-kind (:implementation-files world)
                                                           :command-registry)]
                 (support/assert! (empty? findings)
                                  "Command registry implementation was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^no command palette is present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-findings-of-kind (:implementation-files world)
                                                           :command-palette)]
                 (support/assert! (empty? findings)
                                  "Command palette implementation was found."
                                  {:findings (vec findings)})
                 world))}

   {:pattern #"^no data layer functionality is present$"
    :handler (fn [world _example _captures]
               (let [findings (forbidden-findings-of-kind (:implementation-files world)
                                                           :data-layer)]
                 (support/assert! (empty? findings)
                                  "Data layer implementation was found."
                                  {:findings (vec findings)})
                 world))}])

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-08T20:48:09.779421747+02:00", :module-hash "1855647506", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "-1416017815"} {:id "defn/manifest-contract", :kind "defn", :line 6, :end-line nil, :hash "1603023069"} {:id "defn/opens-side-panel-for-active-tab?", :kind "defn", :line 13, :end-line nil, :hash "-1639308299"} {:id "def/forbidden-scopes", :kind "def", :line 19, :end-line nil, :hash "12635772"} {:id "defn/forbidden-scope-findings", :kind "defn", :line 27, :end-line nil, :hash "-395003359"} {:id "defn/forbidden-findings-of-kind", :kind "defn", :line 34, :end-line nil, :hash "-718440344"} {:id "defn-/source-files", :kind "defn-", :line 37, :end-line nil, :hash "1691080705"} {:id "defn-/implementation-files", :kind "defn-", :line 44, :end-line nil, :hash "1100226319"} {:id "defn-/inspect-manifest", :kind "defn-", :line 48, :end-line nil, :hash "195912726"} {:id "defn-/built-manifest", :kind "defn-", :line 54, :end-line nil, :hash "-1145936804"} {:id "defn-/dist-path", :kind "defn-", :line 57, :end-line nil, :hash "-442595191"} {:id "defn-/ensure-build-passed!", :kind "defn-", :line 60, :end-line nil, :hash "-1490812163"} {:id "def/handlers", :kind "def", :line 69, :end-line nil, :hash "-961300067"}]}
;; clj-mutate-manifest-end
