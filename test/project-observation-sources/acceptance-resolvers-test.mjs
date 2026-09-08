import {execFileSync} from 'node:child_process';
execFileSync('bb', ['-e', `(require 'acceptance.project-observation-source-resolvers-test)
  (let [result (clojure.test/run-tests 'acceptance.project-observation-source-resolvers-test)]
    (when (pos? (+ (:fail result) (:error result))) (System/exit 1)))`], {stdio: 'inherit'});
