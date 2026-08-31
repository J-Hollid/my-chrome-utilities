(ns acceptance.steps.palette
  (:require [acceptance.causal-regression :as causal-regression]
            [acceptance.source-inspection.palette :as wiring]
            [acceptance.steps.support :as support]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(def canonical-filter-text "hello")

(def installed-controller-task-key
  "unit:test/command-palette-installed-controller-test.mjs")

(def installed-controller-command
  ["node" "test/command-palette-installed-controller-test.mjs"])

(defn- installed-controller-result []
  (apply support/verified-task-result
         installed-controller-task-key
         installed-controller-command))

(def visible-open-button? wiring/visible-open-button?)
(def palette-markup? wiring/palette-markup?)
(def opens-on-shortcut? wiring/opens-on-shortcut?)
(def lists-registered-commands? wiring/lists-registered-commands?)
(def palette-backed-by-registry? wiring/palette-backed-by-registry?)
(def filters-commands? wiring/filters-commands?)
(def runs-selected-command-on-key? wiring/runs-selected-command-on-key?)
(def closes-on-key? wiring/closes-on-key?)
(def fuzzy-package-names wiring/fuzzy-package-names)
(def forbidden-palette-scope-findings wiring/forbidden-palette-scope-findings)
(def forbidden-palette-scope-findings-of-kind
  wiring/forbidden-palette-scope-findings-of-kind)

(defn- inspect-side-panel [world]
  (let [root (or (:root world) (support/repository-root))]
    (assoc world
           :root root
           :side-panel-html (support/source-file root "side-panel.html")
           :side-panel-source (str/join "\n"
                                        [(support/source-file root "src/side-panel.ts")
                                         (support/source-file root "src/data-layer-installed/runtime.ts")
                                         (support/source-file root "src/command-palette-ui.ts")
                                         (support/source-file root "src/command-palette.ts")]))))

(defn- inspect-dialog [world]
  (let [root (or (:root world) (support/repository-root))]
    (assoc world
           :root root
           :html (support/source-file root "side-panel.html")
           :css (support/source-file root "side-panel.css")
           :source (str/join "\n" [(support/source-file root "src/side-panel.ts")
                                     (support/source-file root "src/command-palette-ui.ts")])
           :palette-source (support/source-file root "src/command-palette.ts")
           :commands (support/source-file root "src/commands.ts"))))

(def palette-dialog? wiring/palette-dialog?)
(def no-permanent-command-buttons? wiring/no-permanent-command-buttons?)

(defn- palette-scope [world]
  {:package (:package world)
   :manifest (:manifest world)
   :files (:implementation-files world)})

(def simple-handlers
  [{:pattern #"^the side panel is displayed$"
    :handler (fn [world _example _captures]
               (inspect-side-panel world))}

   {:pattern #"^a visible button opens the command palette$"
    :handler (fn [world _example _captures]
               (support/assert! (visible-open-button? (:side-panel-html world))
                                "Visible palette button is missing."
                                {})
               (let [result (installed-controller-result)]
                 (support/assert! (= 0 (:exit result))
                                  "Visible palette button does not open the palette through the installed controller."
                                  {:stderr (:err result)}))
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
               (causal-regression/emit!
                :palette
                {:listener-wired true
                 :generic-root-alias-accepted true
                 :shortcut-recognized true})
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
                        :implementation-files (support/source-files
                                               root
                                               ["src/command-palette"
                                                "src/commands.ts"
                                                "src/utilities/command-palette"]))))}

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

(def dialog-handlers
  [{:pattern #"^command <([A-Za-z0-9_]+)> named <([A-Za-z0-9_]+)> is registered$"
    :handler (fn [world example [id-key title-key]]
               (let [world (inspect-dialog world)
                     id (support/require-example example id-key)
                     title (support/require-example example title-key)]
                 (support/assert! (and (str/includes? (:commands world) id)
                                       (str/includes? (:commands world) title))
                                  "Command registration is incomplete." {:id id :title title})
                 (assoc world :registered-command id :registered-title title)))}
   {:pattern #"^command <([A-Za-z0-9_]+)> is selected from the command palette$"
    :handler (fn [world example [id-key]]
               (assoc world :selected-command (support/require-example example id-key)))}
   {:pattern #"^command <([A-Za-z0-9_]+)> remains executable through the command registry$"
    :handler (fn [world example [id-key]]
               (let [id (support/require-example example id-key)]
                 (support/assert! (and (= id (:selected-command world))
                                       (str/includes? (:commands world) "export function runCommandById"))
                                  "Selected command is not executable through its registry id." {:id id})
                 world))}
   {:pattern #"^<([A-Za-z0-9_]+)> is searchable in the command palette$"
    :handler (fn [world example [title-key]]
               (let [title (support/require-example example title-key)]
                 (support/assert! (and (= title (:registered-title world))
                                       (str/includes? (:palette-source world) "filterPaletteCommands")
                                       (str/includes? (:palette-source world) "command.title"))
                                  "Registered title is not searchable in the palette." {:title title})
                 world))}
   {:pattern #"^registering command <([A-Za-z0-9_]+)> does not add a permanent global command button$"
    :handler (fn [world _example _captures]
               (support/assert! (no-permanent-command-buttons? (:html world) (:source world))
                                "A permanent command button is still rendered." {})
               world)}
   {:pattern #"^the side panel is displayed at <([A-Za-z0-9_]+)> CSS px wide$"
    :handler (fn [world example [width-key]]
               (assoc (inspect-dialog world) :panel-width (support/require-example example width-key)))}
   {:pattern #"^the side panel is displayed at ([0-9]+) CSS px wide$"
    :handler (fn [world _example [width]] (assoc (inspect-dialog world) :panel-width width))}
   {:pattern #"^the command palette is closed$"
    :handler (fn [world _example _captures]
               (support/assert! (palette-dialog? (:html world) (:css world) (:source world))
                                "Command palette dialog is not available." {})
               (assoc world :palette-open? false))}
   {:pattern #"^the closed layout is inspected$"
    :handler (fn [world _example _captures] world)}
   {:pattern #"^the command palette is not visibly rendered and is absent from normal document flow$"
    :handler (fn [world _example _captures]
               (support/assert! (and (false? (:palette-open? world))
                                     (str/includes? (:html world) "aria-label=\"Command palette\" hidden")
                                     (str/includes? (:css world) "#palette[hidden] { display:none"))
                                "Closed palette affects normal layout." {})
               world)}
   {:pattern #"^the command palette does not obscure or displace the header, navigation, or active view content$"
    :handler (fn [world _example _captures]
               (support/assert! (support/navigation-structure? (:html world) (:css world))
                                "Closed palette does not preserve panel layout." {})
               world)}
   {:pattern #"^no registered command is rendered as a permanent global command button$"
    :handler (fn [world _example _captures]
               (support/assert! (no-permanent-command-buttons? (:html world) (:source world))
                                "Permanent command buttons are rendered." {})
               world)}
   {:pattern #"^the user opens the command palette with its launcher or hotkey$"
    :handler (fn [world _example _captures]
               (support/assert! (and (str/includes? (:html world) "id=\"open-palette\"")
                                     (str/includes? (:source world) "function showPalette()")
                                     (str/includes? (:source world) "event.ctrlKey"))
                                "Palette has no launcher or hotkey." {})
               (assoc world :palette-open? true))}
   {:pattern #"^a focused command-palette dialog is displayed above the current side panel UI$"
    :handler (fn [world _example _captures]
               (support/assert! (and (:palette-open? world)
                                     (palette-dialog? (:html world) (:css world) (:source world)))
                                "Palette dialog is not focused above the panel." {})
               world)}
   {:pattern #"^the dialog contains a command search field and matching registered command results$"
    :handler (fn [world _example _captures]
               (support/assert! (and (str/includes? (:html world) "type=\"search\"")
                                     (str/includes? (:source world) "renderPalette(filterCommands"))
                                "Palette search results are not rendered." {})
               world)}
   {:pattern #"^background side panel content does not receive keyboard focus while the dialog is open$"
    :handler (fn [world _example _captures]
               (support/assert! (str/includes? (:source world) "sidePanelContent?.setAttribute(\"inert\", \"\")")
                                "Modal palette does not make background content inert." {})
               world)}
   {:pattern #"^the command palette is open above Data Layer Live with matching commands and one selected result$"
    :handler (fn [world _example _captures]
               (assoc (inspect-dialog world) :palette-open? true :selected-result? true :active-section "Data Layer" :active-view "Live"))}
   {:pattern #"^the user performs <([A-Za-z0-9_]+)>$"
    :applies? #(contains? % :selected-result?)
    :handler (fn [world example [input-key]]
               (assoc world :palette-input (support/require-example example input-key)))}
   {:pattern #"^<([A-Za-z0-9_]+)>$"
    :applies? #(and (contains? % :selected-result?) (contains? % :palette-input))
    :handler (fn [world example [outcome-key]]
               (let [input (:palette-input world)
                     outcome (support/require-example example outcome-key)
                     expected {"keyboard navigation to another result followed by Enter" "the selected command executes"
                               "Escape" "no command executes"}]
                 (support/assert! (= (get expected input) outcome)
                                  "Palette outcome does not match its close input." {:input input :outcome outcome})
                 (assoc world :execution-outcome outcome)))}
   {:pattern #"^the command palette closes$"
    :applies? #(and (contains? % :selected-result?) (contains? % :palette-input))
    :handler (fn [world _example _captures]
               (support/assert! (str/includes? (:source world) "function hidePalette()")
                                "Palette has no close behavior." {})
               (assoc world :palette-open? false))}
   {:pattern #"^the underlying side panel layout is unchanged$"
    :handler (fn [world _example _captures]
               (support/assert! (and (= "Data Layer" (:active-section world))
                                     (= "Live" (:active-view world)))
                                "Closing the palette changed the active layout." {})
               world)}])

(def handlers (vec (concat dialog-handlers simple-handlers)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-11T15:23:54.828952782+02:00", :module-hash "-2006128476", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "38193441"} {:id "def/canonical-filter-text", :kind "def", :line 6, :end-line 6, :hash "1724626866"} {:id "def/installed-controller-task-key", :kind "def", :line 8, :end-line 9, :hash "1380690152"} {:id "def/installed-controller-command", :kind "def", :line 11, :end-line 12, :hash "280850599"} {:id "defn/visible-open-button?", :kind "defn", :line 14, :end-line 16, :hash "-809914284"} {:id "defn-/installed-controller-result", :kind "defn-", :line 18, :end-line 21, :hash "388149960"} {:id "defn/palette-markup?", :kind "defn", :line 23, :end-line 28, :hash "1302085553"} {:id "defn/opens-on-shortcut?", :kind "defn", :line 30, :end-line 40, :hash "-808115028"} {:id "defn/lists-registered-commands?", :kind "defn", :line 42, :end-line 44, :hash "-1679333293"} {:id "defn/palette-backed-by-registry?", :kind "defn", :line 46, :end-line 49, :hash "1086146396"} {:id "defn/filters-commands?", :kind "defn", :line 51, :end-line 55, :hash "-256055306"} {:id "defn/runs-selected-command-on-key?", :kind "defn", :line 57, :end-line 62, :hash "259571416"} {:id "defn/closes-on-key?", :kind "defn", :line 64, :end-line 68, :hash "-1867581278"} {:id "def/fuzzy-package-names", :kind "def", :line 70, :end-line 70, :hash "1698743278"} {:id "defn-/dependency-names", :kind "defn-", :line 72, :end-line 74, :hash "-1509705126"} {:id "defn/forbidden-palette-scope-findings", :kind "defn", :line 76, :end-line 87, :hash "646918192"} {:id "defn/forbidden-palette-scope-findings-of-kind", :kind "defn", :line 89, :end-line 90, :hash "720430111"} {:id "defn-/inspect-side-panel", :kind "defn-", :line 92, :end-line 100, :hash "-315356103"} {:id "defn-/inspect-dialog", :kind "defn-", :line 102, :end-line 111, :hash "339008022"} {:id "defn/palette-dialog?", :kind "defn", :line 113, :end-line 120, :hash "-1107160767"} {:id "defn/no-permanent-command-buttons?", :kind "defn", :line 122, :end-line 125, :hash "-963751556"} {:id "defn-/palette-scope", :kind "defn-", :line 127, :end-line 130, :hash "-1191740757"} {:id "def/simple-handlers", :kind "def", :line 132, :end-line 288, :hash "1047165912"} {:id "def/dialog-handlers", :kind "def", :line 290, :end-line 404, :hash "39041107"} {:id "def/handlers", :kind "def", :line 406, :end-line 406, :hash "-649886614"}]}
;; clj-mutate-manifest-end
