(ns acceptance.package-flow-steps-test
  (:require [acceptance.steps.package-flow :as package-flow]
            [clojure.test :refer [deftest is]]))

(deftest validates-loadable-extension-build-files
  (is (package-flow/loadable-extension-build?
       {"manifest.json" "{\"manifest_version\":3,\"background\":{\"service_worker\":\"background.js\"},\"side_panel\":{\"default_path\":\"side-panel.html\"}}"
        "background.js" "console.log('ready');"
        "side-panel.html" "<main>my-chrome-utilities</main>"}))
  (is (not (package-flow/loadable-extension-build?
            {"manifest.json" "{\"manifest_version\":2}"
             "background.js" ""}))))

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
