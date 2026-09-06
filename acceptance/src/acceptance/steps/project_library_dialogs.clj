(ns acceptance.steps.project-library-dialogs
  (:require [acceptance.steps.support :as support]))

(def feature "features/project-library-dialog-decomposition.feature")
(def relations
  [{:keys ["workflow"] :rows #{["edit project"] ["switch review"] ["create project"] ["import review"]}}
   {:keys ["completion"] :rows #{["confirmation"] ["cancellation"] ["Escape"] ["native close"]}}])
(defonce evidence (atom nil))
(defn- verify! []
  (or @evidence
      (let [structure (support/verified-command-result "node" "test/project-library-dialogs/structure-test.mjs")
            callbacks (support/verified-command-result "node" "test/project-library-dialogs/lifecycle-test.mjs")
            browser (support/verified-command-result "node" "test/twatility-projects-browser-test.mjs")]
        (support/assert! (every? #(zero? (:exit %)) [structure callbacks browser])
                         "Project Library dialog checks failed." {:structure structure :callbacks callbacks :browser browser})
        (support/assert! (= {:modules true :callbacks true :presentation true :completeArchitecture true}
                            (support/json-observation (:out structure) :projectLibraryDialogStructure))
                         "Complete dialog architecture evidence is required." {:result structure})
        (support/assert! (= {:installed true :lifecycle true :coordinator true}
                            (support/json-observation (:out browser) :projectLibraryDialogs))
                         "Installed coordinator and native lifecycle evidence is required." {:result browser})
        (reset! evidence true))))
(defn- transition [world example captures _]
  (verify!)
  (doseq [key (support/capture-placeholder-keys captures)] (support/require-example example key))
  (support/validate-example-relations! relations example "Unsupported dialog workflow or completion.")
  (assoc world :project-library-dialogs/active true))
(def handlers
  (support/feature-scoped-stateful-handlers [feature]
    #{"reviewed architecture declaration ownership is integrated into QA"}
    :project-library-dialogs/active transition))
