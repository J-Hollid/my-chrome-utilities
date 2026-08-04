(ns acceptance.package-flow-steps-test
  (:require [acceptance.steps.package-flow :as package-flow]
            [babashka.fs :as fs]
            [cheshire.core :as json]
            [clojure.test :refer [deftest is]])
  (:import [java.nio.file Files OpenOption]))

(defn- temp-zip-with-bytes [bytes]
  (let [path (fs/create-temp-file {:prefix "package-flow" :suffix ".zip"})]
    (Files/write path bytes (make-array OpenOption 0))
    path))

(defn- local-header-only-bytes []
  (doto (byte-array 30)
    (aset-byte 0 (unchecked-byte 0x50))
    (aset-byte 1 (unchecked-byte 0x4b))
    (aset-byte 2 (unchecked-byte 0x03))
    (aset-byte 3 (unchecked-byte 0x04))))

(defn- write-uint16-le! [bytes offset value]
  (aset-byte bytes offset (unchecked-byte (bit-and value 0xff)))
  (aset-byte bytes (inc offset) (unchecked-byte (bit-and (bit-shift-right value 8) 0xff))))

(defn- write-uint32-le! [bytes offset value]
  (write-uint16-le! bytes offset value)
  (write-uint16-le! bytes (+ offset 2) (bit-shift-right value 16)))

(defn- stored-zip-entry [name content]
  (let [name-bytes (.getBytes name "UTF-8")
        bytes (byte-array (+ 30 (count name-bytes) (count content)))
        data-offset (+ 30 (count name-bytes))]
    (write-uint32-le! bytes 0 0x04034b50)
    (write-uint16-le! bytes 4 20)
    (write-uint32-le! bytes 18 (count content))
    (write-uint32-le! bytes 22 (count content))
    (write-uint16-le! bytes 26 (count name-bytes))
    (System/arraycopy name-bytes 0 bytes 30 (count name-bytes))
    (System/arraycopy content 0 bytes data-offset (count content))
    bytes))

(defn- concatenate-bytes [& values]
  (let [result (byte-array (reduce + (map count values)))]
    (loop [offset 0 [value & remaining] values]
      (when value
        (System/arraycopy value 0 result offset (count value))
        (recur (+ offset (count value)) remaining)))
    result))

(deftest validates-loadable-extension-build-files
  (is (package-flow/loadable-extension-build?
       {"manifest.json" "{\"manifest_version\":3,\"background\":{\"service_worker\":\"background.js\"},\"side_panel\":{\"default_path\":\"side-panel.html\"},\"icons\":{\"16\":\"assets/brand/icons/icon-16.png\"},\"action\":{\"default_icon\":{\"32\":\"assets/brand/icons/icon-32.png\"}}}"
        "background.js" "console.log('ready');"
        "side-panel.html" "<main>my-chrome-utilities</main>"
        "assets/brand/icons/icon-16.png" "png"
        "assets/brand/icons/icon-32.png" "png"}))
  (is (not (package-flow/loadable-extension-build?
            {"manifest.json" "{\"manifest_version\":3,\"background\":{\"service_worker\":\"background.js\"},\"side_panel\":{\"default_path\":\"side-panel.html\"},\"icons\":{\"16\":\"assets/brand/icons/icon-16.png\"}}"
             "background.js" "console.log('ready');"
             "side-panel.html" "<main>my-chrome-utilities</main>"})))
  (is (not (package-flow/loadable-extension-build?
            {"manifest.json" "{\"manifest_version\":2}"
             "background.js" ""})))
  (is (not (package-flow/loadable-extension-build?
            {"manifest.json" "not-json"})))
  (is (not (package-flow/loadable-extension-build? {}))))

(deftest ignores-malformed-zip-data
  (is (= [] (package-flow/zip-entry-names (temp-zip-with-bytes (byte-array 0)))))
  (is (= [] (package-flow/zip-entry-names (temp-zip-with-bytes (local-header-only-bytes))))))

(deftest requires-the-package-to-match-the-complete-dist-inventory
  (let [dist-files ["manifest.json"
                    "side-panel.html"
                    "assets/brand/side-panel-title.png"]]
    (is (package-flow/package-matches-dist? dist-files dist-files))
    (is (not (package-flow/package-matches-dist?
              dist-files
              ["manifest.json" "side-panel.html"])))
    (is (not (package-flow/package-matches-dist?
              dist-files
              (conj dist-files "unexpected.txt"))))))

(deftest requires-the-package-to-preserve-every-dist-file-byte
  (let [root (fs/create-temp-dir {:prefix "package-content"})
        dist (fs/path root "dist")
        nested (fs/path dist "nested")
        source (fs/path nested "example.bin")
        archive (fs/path root "artifact.zip")
        content (.getBytes "exact extension bytes" "UTF-8")]
    (try
      (fs/create-dirs nested)
      (Files/write source content (make-array OpenOption 0))
      (Files/write archive (stored-zip-entry "nested/example.bin" content)
                   (make-array OpenOption 0))
      (is (package-flow/package-contents-match-dist? root "dist" archive))
      (Files/write archive
                   (stored-zip-entry "nested/example.bin"
                                     (.getBytes "wrong extension bytes" "UTF-8"))
                   (make-array OpenOption 0))
      (is (not (package-flow/package-contents-match-dist? root "dist" archive)))
      (finally
        (fs/delete-tree root)))))

(deftest validates-a-receipt-reused-package-against-its-embedded-artifact-manifest
  (let [archive (fs/create-temp-file {:prefix "prepared-package" :suffix ".zip"})
        content (.getBytes "prepared extension bytes" "UTF-8")
        outputs [{:path "nested/example.bin"
                  :kind "file"
                  :bytes (count content)
                  :sha256 (package-flow/content-sha256 content)}]
        manifest-for (fn [manifest-outputs]
                       (let [with-output {:schemaVersion 1
                                          :inputDigest "prepared-input"
                                          :outputDigest (package-flow/artifact-output-digest
                                                         manifest-outputs)
                                          :toolchain {:node "24.19.0"
                                                      :typescript "5.9.3"}
                                          :outputs manifest-outputs}]
                         (assoc with-output :buildIdentity
                                (package-flow/artifact-build-identity with-output))))
        manifest-map (manifest-for outputs)
        manifest (.getBytes (json/generate-string manifest-map) "UTF-8")]
    (try
      (Files/write archive
                   (concatenate-bytes
                    (stored-zip-entry "nested/example.bin" content)
                    (stored-zip-entry ".dist-artifact.json" manifest))
                   (make-array OpenOption 0))
      (is (package-flow/package-matches-embedded-artifact? archive))
      (Files/write archive
                   (concatenate-bytes
                    (stored-zip-entry "nested/example.bin"
                                      (.getBytes "changed bytes" "UTF-8"))
                    (stored-zip-entry ".dist-artifact.json" manifest))
                   (make-array OpenOption 0))
      (is (not (package-flow/package-matches-embedded-artifact? archive)))
      (Files/write archive
                   (concatenate-bytes
                    (stored-zip-entry "nested/example.bin" content)
                    (stored-zip-entry
                     ".dist-artifact.json"
                     (.getBytes
                      (json/generate-string (assoc manifest-map :outputDigest "mismatched"))
                      "UTF-8")))
                   (make-array OpenOption 0))
      (is (not (package-flow/package-matches-embedded-artifact? archive)))
      (Files/write archive
                   (concatenate-bytes
                    (stored-zip-entry "nested/example.bin" content)
                    (stored-zip-entry
                     ".dist-artifact.json"
                     (.getBytes (json/generate-string (manifest-for [])) "UTF-8")))
                   (make-array OpenOption 0))
      (is (not (package-flow/package-matches-embedded-artifact? archive)))
      (let [other-outputs [(assoc (first outputs) :path "nested/other.bin")]
            other-manifest (manifest-for other-outputs)]
        (Files/write archive
                     (concatenate-bytes
                      (stored-zip-entry "nested/example.bin" content)
                      (stored-zip-entry ".dist-artifact.json"
                                        (.getBytes (json/generate-string other-manifest)
                                                   "UTF-8")))
                     (make-array OpenOption 0)))
      (is (not (package-flow/package-matches-embedded-artifact? archive)))
      (Files/write archive (stored-zip-entry "nested/example.bin" content)
                   (make-array OpenOption 0))
      (is (not (package-flow/package-matches-embedded-artifact? archive)))
      (finally
        (fs/delete-if-exists archive)))))

(deftest recognizes-readme-portability-documentation
  (let [readme "Copy build/package/my-chrome-utilities.zip to another machine.
Copy dist to another machine for unpacked testing.
Open Chrome extensions and load unpacked from dist.
Smoke test:
- Open the side panel.
- Run demo.say-hello."]
    (is (package-flow/readme-documents-artifact-copy? readme "zip"))
    (is (package-flow/readme-documents-dist-copy? readme "dist"))
    (is (package-flow/readme-documents-unpacked-load? readme))
    (is (package-flow/readme-documents-smoke-test? readme))))

(deftest reports-forbidden-package-flow-scope
  (is (empty?
       (package-flow/forbidden-package-scope-findings
        {"package.json" "{\"scripts\":{\"package\":\"node scripts/package.mjs\"}}"
         "README.md" "Local portable package flow."
         "scripts/package.mjs" "writeZip();"})))
  (is (= [{:kind :store-packaging :path "README.md"}
          {:kind :signing :path "scripts/package.mjs"}
          {:kind :auto-update :path "src/update.ts"}]
         (package-flow/forbidden-package-scope-findings
          {"README.md" "Chrome Web Store package"
           "scripts/package.mjs" "signing key"
           "src/update.ts" "autoUpdate();"}))))

(deftest filters-forbidden-package-flow-scope-by-kind
  (let [files {"README.md" "Chrome Web Store package"
               "scripts/package.mjs" "signing key"
               "src/update.ts" "autoUpdate();"}]
    (is (= [{:kind :store-packaging :path "README.md"}]
           (vec (package-flow/forbidden-package-scope-findings-of-kind
                 files
                 :store-packaging))))
    (is (= [{:kind :signing :path "scripts/package.mjs"}]
           (vec (package-flow/forbidden-package-scope-findings-of-kind
                 files
                 :signing))))
    (is (= [{:kind :auto-update :path "src/update.ts"}]
           (vec (package-flow/forbidden-package-scope-findings-of-kind
                 files
                 :auto-update))))))
