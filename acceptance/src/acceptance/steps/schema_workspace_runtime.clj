(ns acceptance.steps.schema-workspace-runtime
  (:require [acceptance.steps.support :as support]
            [babashka.process :as process]))

(def feature-file "features/data-layer-schema-workspace-runtime-completion.feature")

(defn- run-browser-runtime! [world]
  (if (:schema-workspace-runtime-verified world)
    world
    (let [result (process/shell support/build-shell-options "npm run test:unit:component-layout")]
      (support/assert! (zero? (:exit result))
                       "Schema workspace browser runtime verification failed."
                       {:out (:out result) :err (:err result)})
      (assoc world :schema-workspace-runtime-verified true))))

(defn- transition [world _example _captures spec]
  (let [verified (run-browser-runtime! world)]
    (support/assert! (:schema-workspace-runtime-verified verified)
                     "Schema workspace runtime was not exercised in the browser."
                     {:step (:text spec)})
    verified))

(def handlers
  (support/semantic-handlers
   (support/feature-step-specs [feature-file] #{})
   transition))
