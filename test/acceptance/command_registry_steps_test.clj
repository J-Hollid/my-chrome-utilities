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
  (is (not (command-registry/registered-command? command-source "demo.missing")))
  (is (command-registry/stable-keymap-identifiers?
       (str command-source
            " export function findCommand(id) { return commands.find((command) => command.id === id); }")))
  (is (command-registry/command-id-execution?
       (str command-source
            " export function findCommand(id) { return commands.find((command) => command.id === id); }
              export function runCommandById(id, context) { const command = findCommand(id); command.run(context); }"))))

(deftest keeps-registry-separated-from-rendering
  (is (command-registry/separate-from-rendering?
       command-source
       "import { listCommands } from './commands';
        document.querySelector('#commands');"))
  (is (command-registry/separate-from-rendering?
       command-source
       "const source = { id: 'event-history', name: 'Event history' };
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

(deftest filters-command-ui-findings-by-kind
  (let [files {"src/palette.ts" "export function openCommandPalette() {}"
               "src/keys.ts" "window.addEventListener('keydown', () => {});"}]
    (is (= [{:kind :command-palette :path "src/palette.ts"}]
           (vec (command-registry/forbidden-command-ui-findings-of-kind
                 files
                 :command-palette))))
    (is (= [{:kind :keybindings :path "src/keys.ts"}]
           (vec (command-registry/forbidden-command-ui-findings-of-kind
                 files
                 :keybindings))))))
