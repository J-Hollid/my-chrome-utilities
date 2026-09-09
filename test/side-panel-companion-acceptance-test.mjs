import {execFileSync} from "node:child_process";
import assert from "node:assert/strict";
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {timeoutIncidentDigest} from "../scripts/verification-reliability-values.mjs";

execFileSync("bb",["-e",`
(require '[acceptance.pack-runtime :as packs]
         '[acceptance.runtime :as runtime]
         '[cheshire.core :as json]
         '[acceptance.steps.side-panel-companion :as subject]
         '[acceptance.steps.support :as support])
(let [valid {:minimumContrast 4.5 :widths [360 420 512]
             :views ["projects" "live" "library" "sessions" "defects" "schemas" "hotkeys"]
             :populatedObservations 21 :accessibilityModes 4 :dialogClosures 12 :longRecordWidths 3
             :recovery true :archive true :studio true :emptyFilterPreservedActive true}]
  (subject/assert-runtime! valid)
  (doseq [[key value] [[:minimumContrast 4.49] [:widths [420]] [:views ["projects"]]
                       [:populatedObservations 0] [:accessibilityModes 3] [:dialogClosures 11]
                       [:longRecordWidths 0] [:recovery false] [:archive false] [:studio false]
                       [:emptyFilterPreservedActive false]]]
    (assert (try (subject/assert-runtime! (assoc valid key value)) false (catch Exception _ true))))
  ;; Protocol controls test that model acceptance obtains both required results.
  ;; Installed browser proof is supplied by the registered browser task.
  (let [commands (atom [])]
    (with-redefs [support/verified-command-result
                  (fn [& command]
                    (swap! commands conj (vec command))
                    {:exit 0 :out (json/generate-string {:sidePanelCompanion valid})})]
      (runtime/run-feature! (aps.gherkin/parse-file (first subject/feature-files)) subject/handlers))
    (assert (= [["node" "test/side-panel-companion-presentation-test.mjs"]
                ["node" "test/twatility-projects-browser-test.mjs"]] @commands))))
(doseq [feature subject/feature-files]
  (let [world {:acceptance/feature-name (:name (aps.gherkin/parse-file feature))}
        entry (if (.endsWith feature "-runtime.feature")
                "the production side panel is installed and running in Chrome"
                "the side panel uses the Specification Studio companion presentation")
        selected (first (filter #(and (re-matches (:pattern %) entry)
                                     (or (nil? (:applies? %)) ((:applies? %) world)))
                                (packs/handlers-for-feature feature)))]
    (assert (some #{selected} subject/handlers))))
(assert (try (support/validate-authoritative-example! subject/authoritative-examples
              {"view_name" "Unsupported view"} "invalid view") false (catch Exception _ true)))
`],{encoding:"utf8",timeout:10000,stdio:"pipe"});
console.log("Companion acceptance dispatch and incomplete-evidence rejection passed");

// Exercise the producer's final output statement without starting Chrome.
// Both consumers read the last JSON record from this command.
const beforeCommit="6ca429f0";
const historical=path=>execFileSync("git",["show",`${beforeCommit}:${path}`],
  {encoding:"utf8",timeout:5000,maxBuffer:1024*1024});
function finalDocument(source) {
  const marker="console.log(JSON.stringify({sidePanelCompanion:";
  const start=source.lastIndexOf(marker);
  assert.ok(start>=0,"The browser producer publishes companion evidence");
  const output=[];
  runInNewContext(source.slice(start),{console:{log:line=>output.push(line)},
    companionEvidence:{measured:true}},{timeout:1000});
  return JSON.parse(output.filter(line=>line.startsWith("{")).at(-1));
}
const browserPath="test/twatility-projects-browser-test.mjs";
const beforeDocument=finalDocument(historical(browserPath));
const currentDocument=finalDocument(readFileSync(browserPath,"utf8"));
assert.equal(beforeDocument.sidePanelCompanion,undefined);
assert.deepEqual(currentDocument.sidePanelCompanion,{measured:true});
assert.deepEqual(currentDocument.projectLibraryDialogs,{installed:true,lifecycle:true,coordinator:true});

const inspectionPath="acceptance/src/acceptance/verification_support/modular_architecture_repository_inspection.clj";
const temporary=mkdtempSync("tmp/companion-acceptance-regression-");
let handlerResults;
try {
  const priorInspection=`${temporary}/prior.clj`,priorHtml=`${temporary}/prior.html`;
  const utilityInspection=`${temporary}/utility-prior.clj`;
  writeFileSync(utilityInspection,execFileSync("git",["show",`9d876dbb:${inspectionPath}`],{encoding:"utf8"}));
  writeFileSync(priorInspection,historical(inspectionPath));
  writeFileSync(priorHtml,historical("side-panel.html"));
  handlerResults=JSON.parse(execFileSync("bb",["-e",`
(require '[cheshire.core :as json]
         '[acceptance.steps.workspace-editor :as workspace]
         '[acceptance.verification-support.modular-architecture-repository-inspection :as inspection])
(let [context (#'inspection/inspection-context)
      signals (fn [sources] (try (#'inspection/assert-source-signals! sources) true (catch Exception _ false)))
      html (slurp "side-panel.html")
      old-html (slurp (second *command-line-args*))]
  (load-file (first *command-line-args*))
  (let [before (signals (:sources context))
        _ (load-file (nth *command-line-args* 3))
        before-utility (signals (:sources context))]
    (load-file (nth *command-line-args* 2))
    (assert (not (signals (assoc (:sources context) "scripts/browser-observation/results.mjs" ""))))
    (assert (not (workspace/workspace-headings? (clojure.string/replace html "Data Layer</h2>" "Wrong</h2>"))))
    (assert (clojure.string/includes? html "<h2 class=\\\"visually-hidden\\\">Data Layer</h2>"))
    (println (json/generate-string {:beforeSignals before :beforeUtilitySignals before-utility :afterSignals (signals (:sources context))
                                  :beforeHeadings (workspace/workspace-headings? old-html)
                                  :afterHeadings (workspace/workspace-headings? html)}))))
`,priorInspection,priorHtml,inspectionPath,utilityInspection],{encoding:"utf8",timeout:10000,maxBuffer:1024*1024}));
} finally {rmSync(temporary,{recursive:true});}
assert.deepEqual(handlerResults,{beforeSignals:false,beforeUtilitySignals:false,afterSignals:true,beforeHeadings:false,afterHeadings:true});
const context=process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION
  ?JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION):null;
if(["other:companion Shell acceptance integration","other:utility modular source signals"].includes(context?.causalCategory)) {
  const utility=context.causalCategory==="other:utility modular source signals";
  const before={evidence:Boolean((utility?currentDocument:beforeDocument).sidePanelCompanion),
    signals:utility?handlerResults.beforeUtilitySignals:handlerResults.beforeSignals,
    headings:utility?handlerResults.afterHeadings:handlerResults.beforeHeadings};
  const after={evidence:Boolean(currentDocument.sidePanelCompanion),signals:handlerResults.afterSignals,
    headings:handlerResults.afterHeadings};
  const fixture={id:"companion-shell-acceptance-integration-v1",causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:timeoutIncidentDigest(context.diagnosedBoundary),
    input:{beforeCommit:utility?"9d876dbb":beforeCommit,browserPath,inspectionPath},
    expectedPreRepairFailure:{evidence:utility,signals:false,headings:utility},
    expectedRepairResult:{evidence:true,signals:true,headings:true}};
  const fixtureDigest=timeoutIncidentDigest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:before},
    repairResult:{status:"passed",fixtureDigest,observed:after}}}));
}
console.log("Companion final evidence, modular source signals, and accessible headings passed");
