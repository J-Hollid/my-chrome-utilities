(ns acceptance.information-architecture-steps-test
  (:require [acceptance.steps.information-architecture :as information-architecture]
            [clojure.test :refer [deftest is]]))

(deftest excludes-command-palette-handler-ownership
  (is (empty? (filter #(re-find #"command palette|registered command" (str (:pattern %)))
                      information-architecture/handlers))))

(deftest recognizes-separated-information-architecture
  (is (information-architecture/navigation-structure?
       "<header id=\"application-header\"></header><div id=\"workspace-tabs\" role=\"tablist\" aria-label=\"Workspace\"><button role=\"tab\">Data Layer</button><button role=\"tab\">Hotkeys</button></div><div id=\"workspace-panel-data-layer\"><div id=\"data-layer-views\" role=\"tablist\" aria-label=\"Data Layer views\"></div><section id=\"data-layer-panel-live\"></section></div>"
       "#side-panel-content { display:grid; grid-template-rows:auto auto minmax(0,1fr) } [role=tab] { background:transparent }")))

(deftest recognizes-separate-data-layer-view-panels
  (is (information-architecture/data-layer-view-separation?
       "<div id=\"data-layer-views\" role=\"tablist\"></div><section id=\"data-layer-panel-live\"></section><section id=\"data-layer-panel-library\" hidden></section><section id=\"data-layer-panel-sessions\" hidden></section><section id=\"data-layer-panel-schemas\" hidden></section>"
       "for (const candidate of dataLayerViews) { if (panel) panel.hidden = !selected; }")))

(deftest recognizes-three-distinct-hidden-data-layer-views
  (is (information-architecture/distinct-hidden-data-layer-views?
       "Library" ["Live" "Sessions" "Schemas"]))
  (is (not (information-architecture/distinct-hidden-data-layer-views?
            "Library" ["Live" "Library" "Schemas"]))))

(deftest recognizes-hidden-panel-css-precedence
  (is (information-architecture/hidden-panel-css-wins?
       "#data-layer-panel-library { display:grid; } [role=tabpanel][hidden] { display:none !important; }")))

(deftest recognizes-canonical-live-session-controls
  (is (information-architecture/contextual-actions?
       "<section id=\"live-context-actions\"><button id=\"start-data-layer-testing\"></button><button id=\"end-data-layer-testing\"></button><button id=\"choose-observation-target\"></button></section><button id=\"pause-capture\"></button><button id=\"resume-capture\"></button>"
       "function renderLiveContextActions() {} startTestingButton?.addEventListener(() => {})"))
  (is (not (information-architecture/contextual-actions?
            "<section id=\"live-context-actions\"><button id=\"start-data-layer-testing\"></button><button id=\"end-data-layer-testing\"></button><button id=\"choose-observation-target\"></button><button id=\"stop-capture\"></button></section><button id=\"pause-capture\"></button><button id=\"resume-capture\"></button>"
            "function renderLiveContextActions() {} startTestingButton?.addEventListener(() => {})"))))

(def contained-schema-observation
  {:containedControls true
   :editorContainsActions true
   :closeReviewContainsActions true
   :assignmentContainsPolicy true
   :standaloneAssignmentPolicy 0
   :presentationByView
   {:Live {:panelDisplay "none" :painted false :focusable false :closeReviewOpen false}
    :Library {:panelDisplay "none" :painted false :focusable false :closeReviewOpen false}
    :Sessions {:panelDisplay "none" :painted false :focusable false :closeReviewOpen false}}
   :editorStates {:assignmentWasOpen true :assignmentHiddenWhileAway true
                  :ruleWasOpen true :ruleHiddenWhileAway true}
   :restored {:editorVisible true :name "Unsaved checkout schema" :closeReviewOpen false}})

(deftest recognizes-contained-schema-view-browser-observation
  (is (information-architecture/schema-view-contained? contained-schema-observation))
  (is (not (information-architecture/schema-view-contained?
            (assoc contained-schema-observation :containedControls false))))
  (is (not (information-architecture/schema-view-contained?
            (assoc-in contained-schema-observation [:restored :name] "")))))
