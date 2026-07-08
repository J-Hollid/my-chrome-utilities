(ns acceptance.command-registry-steps-test
  (:require [acceptance.steps.command-registry :as command-registry]
            [clojure.test :refer [deftest is]]))

(def command-source
  "export const commands = [{
     id: \"demo.say-hello\",
     title: \"Say hello\",
     description: \"Records a command run.\",
     category: \"demo\",
     run(context) {
       context.record({ commandId: \"demo.say-hello\", message: \"demo.say-hello ran\" });
     }
   }];
   export function listCommands() { return commands; }
   export function runCommandById(id, context) { commands[0].run(context); }")

(deftest extracts-command-contract-fields
  (is (= #{"id" "title" "description" "category" "run"}
         (command-registry/defined-fields command-source)))
  (is (command-registry/listable-registry? command-source)))

(deftest detects-command-registration-and-run-behavior
  (is (command-registry/registered-command? command-source "demo.say-hello"))
  (is (command-registry/command-has-behavior? command-source "demo.say-hello"))
  (is (not (command-registry/registered-command? command-source "demo.missing"))))

(deftest keeps-registry-separated-from-rendering
  (is (command-registry/separate-from-rendering?
       command-source
       "import { listCommands } from './commands';
        document.querySelector('#commands');"))
  (is (not (command-registry/separate-from-rendering?
            command-source
            "const commands = [{ id: 'inline', run() {} }];
             document.querySelector('#commands');"))))

(deftest reports-disallowed-command-ui-scope
  (is (empty?
       (command-registry/forbidden-command-ui-findings
        {"src/commands.ts" command-source
         "src/side-panel.ts" "document.querySelector('#commands');"})))
  (is (= [{:kind :command-palette :path "src/palette.ts"}
          {:kind :keybindings :path "src/keys.ts"}]
         (command-registry/forbidden-command-ui-findings
          {"src/palette.ts" "export function openCommandPalette() {}"
           "src/keys.ts" "window.addEventListener('keydown', () => {});"}))))
