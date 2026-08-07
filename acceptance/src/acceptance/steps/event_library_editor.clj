(ns acceptance.steps.event-library-editor
  (:require [acceptance.steps.event-library-editor-support :as support]
            [acceptance.steps.event-property-editor :as property]
            [acceptance.steps.event-template-library :as library]))

(def event-library-editor-wired? support/wired?)
(def feature-files ["features/data-layer-event-template-library.feature"])
(def handlers (vec (concat library/handlers property/handlers)))

(defn event-library-editor-step-covered? [text]
  (some #(re-matches (:pattern %) text) handlers))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-08-07T09:44:39.301177706+02:00", :module-hash "137826328", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "251843286"} {:id "def/event-library-editor-wired?", :kind "def", :line 6, :end-line 6, :hash "900186052"} {:id "def/feature-files", :kind "def", :line 7, :end-line 7, :hash "-1650299248"} {:id "def/handlers", :kind "def", :line 8, :end-line 8, :hash "1739808343"} {:id "defn/event-library-editor-step-covered?", :kind "defn", :line 10, :end-line 11, :hash "-689583713"}]}
;; clj-mutate-manifest-end
