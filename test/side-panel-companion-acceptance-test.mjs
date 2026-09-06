import {execFileSync} from "node:child_process";

execFileSync("bb",["-e",`
(require '[acceptance.pack-runtime :as packs]
         '[acceptance.steps.side-panel-companion :as subject]
         '[acceptance.steps.support :as support])
(let [valid {:minimumContrast 4.5 :widths [360 420 512]
             :views ["projects" "live" "library" "sessions" "defects" "schemas" "hotkeys"]
             :populatedObservations 21 :accessibilityModes 4 :dialogClosures 12 :longRecordWidths 3
             :recovery true :archive true :studio true :emptyFilterPreservedActive true}]
  (subject/assert-runtime! valid)
  (doseq [[key value] [[:minimumContrast 4.49] [:widths [420]] [:views ["projects"]]
                       [:populatedObservations 0] [:accessibilityModes 3] [:dialogClosures 11]
                       [:longRecordWidths 0] [:recovery false] [:archive false] [:studio false]
                       [:emptyFilterPreservedActive false]]]
    (assert (try (subject/assert-runtime! (assoc valid key value)) false (catch Exception _ true)))))
(doseq [feature subject/feature-files]
  (let [world {:acceptance/feature-name (:name (aps.gherkin/parse-file feature))}
        entry (if (.endsWith feature "-runtime.feature")
                "the production side panel is installed and running in Chrome"
                "the side panel uses the Specification Studio companion presentation")
        selected (first (filter #(and (re-matches (:pattern %) entry)
                                     (or (nil? (:applies? %)) ((:applies? %) world)))
                                (packs/handlers-for-feature feature)))]
    (assert (some #{selected} subject/handlers))))
(assert (try (support/validate-authoritative-example! subject/authoritative-examples
              {"view_name" "Unsupported view"} "invalid view") false (catch Exception _ true)))
`],{encoding:"utf8",timeout:10000,stdio:"pipe"});
console.log("Companion acceptance dispatch and incomplete-evidence rejection passed");
