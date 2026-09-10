(ns acceptance.steps.tealium-support
  (:require [acceptance.steps.support :as support]
            [cheshire.core :as json]
            [clojure.string :as str]))

(defn observation [group kind observation-key]
  (let [cache (atom nil)]
    (fn []
      (support/cached-command-observation! cache
        {:command ["node" (str "test/tealium/" group "/" kind ".mjs")]
         :observation-key observation-key
         :runtime-error "Tealium executable check failed."
         :missing-error "Tealium evidence is missing."}))))

(defn observations [files]
  (let [cache (atom nil)]
    (fn []
      (or @cache
        (reset! cache
          (reduce (fn [result file]
            (let [run (support/verified-command-result "node" (str "test/tealium/" file))
                  line (last (filter #(str/starts-with? % "{") (str/split-lines (:out run))))]
              (support/assert! (and (zero? (:exit run)) line) "A Tealium browser leaf failed." {:file file :result run})
              (merge result (json/parse-string line true)))) {} files))))))

(defn example! [example rows]
  (when (seq example)
    (let [expected (into {} (map (fn [[key value]] [(keyword key) (str value)]) example))]
      (support/assert! (some #(= expected (select-keys % (keys expected))) rows)
        "The Tealium example does not match executable evidence." {:example expected :observed rows}))))

(defn flags! [observed keys]
  (support/assert! (and (map? observed) (every? #(true? (get observed %)) keys))
    "Required Tealium runtime observations did not pass." {:observed observed :required keys}))

(defn build-handlers [feature-files entry-modes state-key model! runtime! rows! assert-runtime!]
  (support/verified-feature-mode-handlers feature-files entry-modes state-key
    model!
    (fn [mode example]
      (example! example (if (= mode :runtime) (rows! (runtime!)) (:examples (model!)))))
    runtime! assert-runtime!))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-09-10T02:46:22.405408094+02:00", :module-hash "1308996174", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line 4, :hash "-2122459357"} {:id "defn/observation", :kind "defn", :line 6, :end-line 13, :hash "793775598"} {:id "defn/observations", :kind "defn", :line 15, :end-line 24, :hash "1799845793"} {:id "defn/example!", :kind "defn", :line 26, :end-line 30, :hash "-255655961"} {:id "defn/flags!", :kind "defn", :line 32, :end-line 34, :hash "877529042"} {:id "defn/build-handlers", :kind "defn", :line 36, :end-line 41, :hash "1109102868"}]}
;; clj-mutate-manifest-end
