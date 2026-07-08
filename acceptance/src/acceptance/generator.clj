(ns acceptance.generator
  (:require [aps.json :as aps-json]
            [babashka.fs :as fs]
            [clojure.string :as str])
  (:import [java.security MessageDigest]))

(defn- sha256 [text]
  (let [digest (.digest (MessageDigest/getInstance "SHA-256")
                        (.getBytes text "UTF-8"))]
    (str "sha256:"
         (apply str (map #(format "%02x" (bit-and % 0xff)) digest)))))

(defn- slug [value]
  (-> value
      str/lower-case
      (str/replace #"[^a-z0-9]+" "-")
      (str/replace #"(^-+|-+$)" "")))

(defn infer-feature-path [ir-path]
  (str "features/" (fs/file-name (fs/strip-ext ir-path)) ".feature"))

(defn- generated-file-path [output-dir feature-path]
  (fs/path output-dir (str (slug feature-path) "_acceptance_test.clj")))

(defn- metadata-file-path [output-dir feature-path]
  (fs/path output-dir "metadata" (str (slug feature-path) ".json")))

(defn- entrypoint-text [ir-path]
  (format
   "(ns generated.acceptance-test\n  (:require [acceptance.runtime :as runtime]\n            [acceptance.steps.project-skeleton :as steps]\n            [aps.json :as aps-json]))\n\n(defn -main [& args]\n  (let [ir-path (or (first args) %s)\n        feature (aps-json/read-json-file ir-path)]\n    (runtime/run-feature! feature steps/handlers)\n    (println \"acceptance passed\")))\n\n(apply -main *command-line-args*)\n"
   (pr-str ir-path)))

(defn generate!
  ([ir-path output-dir] (generate! ir-path output-dir {}))
  ([ir-path output-dir {:keys [feature-path]}]
   (let [feature-path (or feature-path (infer-feature-path ir-path))
         generated-file (generated-file-path output-dir feature-path)
         metadata-file (metadata-file-path output-dir feature-path)
         text (entrypoint-text ir-path)]
     (fs/create-dirs (fs/parent generated-file))
     (spit (str generated-file) text)
     (aps-json/write-pretty-file!
      (str metadata-file)
      {:schema_version 1
       :feature_path feature-path
       :ir_path ir-path
       :implementation_hash (sha256 text)
       :hash_scope "generated_files"
       :generated_files [(str generated-file)]})
     {:generated-file (str generated-file)
      :metadata-file (str metadata-file)})))

(defn -main [& args]
  (if (not= 2 (count args))
    (do
      (binding [*out* *err*]
        (println "usage: acceptance-entrypoint-generator <json-ir> <generated-test-output>"))
      (System/exit 2))
    (try
      (apply generate! args)
      (catch Exception e
        (binding [*out* *err*]
          (println (.getMessage e)))
        (System/exit 1)))))
