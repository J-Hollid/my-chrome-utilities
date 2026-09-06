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

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-06T20:22:59.521754948+02:00", :module-hash "1679521265", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 2, :hash "827579652"} {:id "def/feature", :kind "def", :line 4, :end-line 4, :hash "-1700473532"} {:id "def/relations", :kind "def", :line 5, :end-line 7, :hash "1404844526"} {:id "form/3/defonce", :kind "defonce", :line 8, :end-line 8, :hash "701185655"} {:id "defn-/verify!", :kind "defn-", :line 9, :end-line 22, :hash "2102637030"} {:id "defn-/transition", :kind "defn-", :line 23, :end-line 27, :hash "-1843782569"} {:id "def/handlers", :kind "def", :line 28, :end-line 31, :hash "-1959367288"}]}
;; clj-mutate-manifest-end
