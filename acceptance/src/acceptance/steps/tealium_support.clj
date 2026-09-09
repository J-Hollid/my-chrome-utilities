(ns acceptance.steps.tealium-support
  (:require [acceptance.steps.support :as support]))

(defn observation [group kind observation-key]
  (let [cache (atom nil)]
    (fn []
      (support/cached-command-observation! cache
        {:command ["node" (str "test/tealium/" group "/" kind ".mjs")]
         :observation-key observation-key
         :runtime-error "Tealium executable check failed."
         :missing-error "Tealium evidence is missing."}))))

(defn example! [example rows]
  (when (seq example)
    (let [expected (into {} (map (fn [[key value]] [(keyword key) (str value)]) example))]
      (support/assert! (some #(= expected (select-keys % (keys expected))) rows)
        "The Tealium example does not match executable evidence." {:example expected :observed rows}))))

(defn flags! [observed keys]
  (support/assert! (and (map? observed) (every? #(true? (get observed %)) keys))
    "Required Tealium runtime observations did not pass." {:observed observed :required keys}))

(defn handlers [feature-files entry-modes state-key model! runtime! rows! assert-runtime!]
  (support/verified-feature-mode-handlers feature-files entry-modes state-key
    model!
    (fn [mode example]
      (example! example (if (= mode :runtime) (rows! (runtime!)) (:examples (model!)))))
    runtime! assert-runtime!))
