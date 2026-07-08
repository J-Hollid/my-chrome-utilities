(ns acceptance.generator-test
  (:require [acceptance.generator :as generator]
            [aps.json :as aps-json]
            [babashka.fs :as fs]
            [clojure.string :as str]
            [clojure.test :refer [deftest is]]))

(deftest generates-deterministic-entrypoint-and-metadata
  (let [tmp-dir (fs/create-temp-dir {:prefix "acceptance-generator-test"})
        ir-path (fs/path tmp-dir "ir" "demo.json")
        output-dir (fs/path tmp-dir "generated")
        feature {:name "Demo"
                 :scenarios [{:name "One"
                              :steps [{:keyword "Then" :text "it works"}]
                              :examples []}]}]
    (aps-json/write-pretty-file! (str ir-path) feature)
    (let [first-result (generator/generate! (str ir-path) (str output-dir)
                                            {:feature-path "features/Demo.feature"})
          generated-file (:generated-file first-result)
          first-text (slurp generated-file)
          second-result (generator/generate! (str ir-path) (str output-dir)
                                             {:feature-path "features/Demo.feature"})
          metadata (aps-json/read-json-file (:metadata-file second-result))]
      (is (= first-text (slurp (:generated-file second-result))))
      (is (str/includes? first-text "acceptance.runtime"))
      (is (= 1 (:schema_version metadata)))
      (is (= "features/Demo.feature" (:feature_path metadata)))
      (is (= (str ir-path) (:ir_path metadata)))
      (is (= "generated_files" (:hash_scope metadata)))
      (is (= [(str generated-file)] (:generated_files metadata)))
      (is (str/starts-with? (:implementation_hash metadata) "sha256:"))
      (is (fs/exists? (fs/path output-dir
                               "metadata"
                               "features-demo-feature.json"))))))
