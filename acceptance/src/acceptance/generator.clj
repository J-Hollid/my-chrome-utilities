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

(def metadata-schema-version 1)
(def success-exit-code 0)
(def usage-exit-code 2)
(def error-exit-code 1)

(defn- entrypoint-text [ir-path feature-path]
  (format
   "(ns generated.acceptance-test\n  (:require [acceptance.runtime :as runtime]\n            [acceptance.pack-runtime :as packs]\n            [aps.json :as aps-json]))\n\n(defn run! [ir-path]\n  (let [feature (aps-json/read-json-file ir-path)]\n    (runtime/run-feature! feature (packs/handlers-for-feature %s))))\n\n(defn -main [& args]\n  (run! (or (first args) %s))\n  (println \"acceptance passed\"))\n\n(when (= *file* (System/getProperty \"babashka.file\"))\n  (apply -main *command-line-args*))\n"
   (pr-str feature-path) (pr-str ir-path)))

(defn generate!
  ([ir-path output-dir] (generate! ir-path output-dir {}))
  ([ir-path output-dir {:keys [feature-path]}]
   (let [feature-path (or feature-path (infer-feature-path ir-path))
         generated-file (generated-file-path output-dir feature-path)
         metadata-file (metadata-file-path output-dir feature-path)
         text (entrypoint-text ir-path feature-path)]
     (fs/create-dirs (fs/parent generated-file))
     (spit (str generated-file) text)
     (aps-json/write-pretty-file!
      (str metadata-file)
      {:schema_version metadata-schema-version
       :feature_path feature-path
       :ir_path ir-path
       :implementation_hash (sha256 text)
       :hash_scope "generated_files"
       :generated_files [(str generated-file)]})
     {:generated-file (str generated-file)
      :metadata-file (str metadata-file)})))

(def usage-message
  "usage: acceptance-entrypoint-generator <json-ir> <generated-test-output>")

(defn- expected-arg-count? [args]
  (= 2 (count args)))

(defn- usage-result []
  {:exit usage-exit-code :err usage-message})

(defn- generation-result [args]
  (try
    (apply generate! args)
    {:exit success-exit-code}
    (catch Exception e
      {:exit error-exit-code :err (.getMessage e)})))

(defn main-result [args]
  (if (expected-arg-count? args)
    (generation-result args)
    (usage-result)))

(defn- err-lines [err]
  (if err [err] []))

(defn- exit-code [exit]
  (if (zero? exit) nil exit))

(defn main-effects [{:keys [exit err]}]
  {:err-lines (err-lines err)
   :exit-code (exit-code exit)})

(defn- apply-main-result! [result]
  (let [{:keys [err-lines exit-code]} (main-effects result)]
    (doseq [err-line err-lines]
      (binding [*out* *err*]
        (println err-line)))
    (some-> exit-code System/exit)))

(defn -main [& args]
  (apply-main-result! (main-result args)))

;; clj-mutate-manifest-begin
;; {:version 1, :tested-at "2026-07-08T20:46:45.48565753+02:00", :module-hash "-1378254668", :forms [{:id "form/0/ns", :kind "ns", :line 1, :end-line nil, :hash "1537059755"} {:id "defn-/sha256", :kind "defn-", :line 7, :end-line nil, :hash "-833175394"} {:id "defn-/slug", :kind "defn-", :line 13, :end-line nil, :hash "408887839"} {:id "defn/infer-feature-path", :kind "defn", :line 19, :end-line nil, :hash "-1636986287"} {:id "defn-/generated-file-path", :kind "defn-", :line 22, :end-line nil, :hash "888747017"} {:id "defn-/metadata-file-path", :kind "defn-", :line 25, :end-line nil, :hash "-2025301279"} {:id "def/metadata-schema-version", :kind "def", :line 28, :end-line nil, :hash "645615126"} {:id "def/success-exit-code", :kind "def", :line 29, :end-line nil, :hash "-1947358670"} {:id "def/usage-exit-code", :kind "def", :line 30, :end-line nil, :hash "828079597"} {:id "def/error-exit-code", :kind "def", :line 31, :end-line nil, :hash "-713522920"} {:id "defn-/entrypoint-text", :kind "defn-", :line 33, :end-line nil, :hash "1846664179"} {:id "defn/generate!", :kind "defn", :line 38, :end-line nil, :hash "-1399515516"} {:id "def/usage-message", :kind "def", :line 58, :end-line nil, :hash "174030836"} {:id "defn-/expected-arg-count?", :kind "defn-", :line 61, :end-line nil, :hash "222144171"} {:id "defn-/usage-result", :kind "defn-", :line 64, :end-line nil, :hash "-62244181"} {:id "defn-/generation-result", :kind "defn-", :line 67, :end-line nil, :hash "-1499548178"} {:id "defn/main-result", :kind "defn", :line 74, :end-line nil, :hash "-1937104995"} {:id "defn-/err-lines", :kind "defn-", :line 79, :end-line nil, :hash "-442307244"} {:id "defn-/exit-code", :kind "defn-", :line 82, :end-line nil, :hash "1559087924"} {:id "defn/main-effects", :kind "defn", :line 85, :end-line nil, :hash "232162468"} {:id "defn-/apply-main-result!", :kind "defn-", :line 89, :end-line nil, :hash "-1923395267"} {:id "defn/-main", :kind "defn", :line 96, :end-line nil, :hash "1597599314"}]}
;; clj-mutate-manifest-end
