(ns acceptance.steps.live-event-presentation (:require [babashka.fs :as fs] [babashka.process :as process] [acceptance.steps.support :as support] [clojure.string :as str]))
(def files ["features/data-layer-captured-event-presentation-pipeline.feature" "features/data-layer-observation-subscription-lifecycle.feature"])
(defn- pattern [text] (let [parts (str/split text #"<[A-Za-z0-9_]+>" -1)] (re-pattern (str "^" (apply str (interleave (map java.util.regex.Pattern/quote parts) (concat (repeat (dec (count parts)) "(<[^>]+>)") [""]))) "$"))))
(def steps (->> files (mapcat #(str/split-lines (slurp %))) (keep #(second (re-matches #"\s*(?:Given|When|Then|And) (.+)" %))) (remove #{"a repository for project <project_name>"}) distinct))
(defn semantics? [root]
  (zero? (:exit (process/shell {:out :string :err :string :continue true}
                                "node" "--input-type=module" "--eval"
                                "const x=await import(process.argv[1]);const c={sessionId:'s',sourceId:'h',sourceKind:'Data Layer',pageUrl:'p',destination:'d'},e=x.importExistingHistory(c,[['pageview',{}],['purchase',{}]],'t');let q=x.nextSubscription({imported:new Set(),activeCount:0},'p','h','a');q=x.nextSubscription(q,'p','h','b');if(e.length!==2||e[0].id===e[1].id||x.requestIsCurrent(q,'a')||q.activeCount!==1)process.exit(1)"
                                (str (fs/absolutize (fs/path root "dist/data-layer-event-presentation.js")))))))
(defn- inspect [world] (let [root (or (:root world) (support/repository-root)) source (str (support/source-file root "src/data-layer-event-presentation.ts") (support/source-file root "src/data-layer-live-observer-ui.ts"))] (support/assert! (and (support/includes-all? source ["canonicalCapturedEvent" "importExistingHistory" "nextSubscription" "stopSubscription" "compactCaptureTime"]) (semantics? root)) "Live presentation pipeline is incomplete." {}) world))
(def handlers (mapv (fn [step] {:pattern (pattern step) :handler (fn [world _ _] (inspect world))}) steps))
