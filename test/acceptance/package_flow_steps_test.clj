(ns acceptance.package-flow-steps-test
  (:require [acceptance.steps.package-flow :as package-flow]
            [babashka.fs :as fs]
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

(deftest validates-loadable-extension-build-files
  (is (package-flow/loadable-extension-build?
       {"manifest.json" "{\"manifest_version\":3,\"background\":{\"service_worker\":\"background.js\"},\"side_panel\":{\"default_path\":\"side-panel.html\"}}"
        "background.js" "console.log('ready');"
        "side-panel.html" "<main>my-chrome-utilities</main>"}))
  (is (not (package-flow/loadable-extension-build?
            {"manifest.json" "{\"manifest_version\":2}"
             "background.js" ""})))
  (is (not (package-flow/loadable-extension-build?
            {"manifest.json" "not-json"})))
  (is (not (package-flow/loadable-extension-build? {}))))

(deftest ignores-malformed-zip-data
  (is (= [] (package-flow/zip-entry-names (temp-zip-with-bytes (byte-array 0)))))
  (is (= [] (package-flow/zip-entry-names (temp-zip-with-bytes (local-header-only-bytes))))))

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
