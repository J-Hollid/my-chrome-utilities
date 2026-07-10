(ns acceptance.steps.event-library-editor
  (:require [acceptance.steps.event-library-editor-support :as support]
            [acceptance.steps.event-property-editor :as property]
            [acceptance.steps.event-template-library :as library]))

(def event-library-editor-wired? support/wired?)
(def handlers (vec (concat library/handlers property/handlers)))

(defn event-library-editor-step-covered? [text]
  (some #(re-matches (:pattern %) text) handlers))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-10T15:11:46.178635962+02:00", :module-hash "1381316465", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "251843286"} {:id "def/event-library-editor-wired?", :kind "def", :line 6, :end-line nil, :hash "900186052"} {:id "def/handlers", :kind "def", :line 7, :end-line nil, :hash "1739808343"} {:id "defn/event-library-editor-step-covered?", :kind "defn", :line 9, :end-line nil, :hash "-22777240"}]}
;; clj-mutate-manifest-end
