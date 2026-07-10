(ns acceptance.saved-sessions-steps-test
  (:require [acceptance.steps.saved-sessions :as saved-sessions]
            [clojure.string :as str]
            [clojure.test :refer [deftest is testing]]))

(deftest recognizes-saved-session-wiring
  (is (saved-sessions/saved-sessions-wired?
       "data-layer-panel-sessions saved-session-search saved-session-list saved-session-confirmation cancel-saved-session-delete confirm-saved-session-delete"
       "createSavedSessionLibrary saveCompletedSession openSavedSession resumeSavedSession exportSavedSession importSavedSession searchSavedSessions renameSavedSession requestSavedSessionDeletion confirmSavedSessionDeletion")))

(deftest every-saved-session-step-has-a-specific-handler
  (doseq [step (->> (str/split-lines (slurp "features/data-layer-saved-session-library.feature"))
                    (keep #(second (re-matches #"\s*(?:Given|When|Then|And) (.+)" %)))
                    (remove #{"a repository for project <project_name>"
                              "a completed data layer testing session contains captured events"}))]
    (testing step
      (is (saved-sessions/saved-session-step-covered? step)))))
