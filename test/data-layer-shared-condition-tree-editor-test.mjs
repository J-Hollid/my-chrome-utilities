import assert from "node:assert/strict";
import {
  sharedConditionOperators,
  sharedConditionValueMounted,
  sharedTypedConditionValue,
} from "../dist/data-layer-shared-condition-tree-editor.js";
import {projectConditionEditorDraft} from "../dist/data-layer-project-condition-editor.js";
import {conditionMatches} from "../dist/data-layer-specification-project.js";

assert.deepEqual(
  sharedConditionOperators("string"),
  ["Exists","Does not exist","Equals","Does not equal","Is one of","Starts with","Contains","Matches pattern"],
  "string predicates expose only compatible operators",
);
assert.ok(sharedConditionOperators("array").includes("Contains any of"));
assert.deepEqual(
  sharedConditionOperators("number"),
  ["Exists","Does not exist","Equals","Does not equal","Greater than","At least","Less than","At most"],
  "numeric predicates expose comparison operators",
);
assert.equal(sharedConditionValueMounted("Exists"),false);
assert.equal(sharedConditionValueMounted("Equals"),true);
assert.equal(sharedTypedConditionValue("integer","7"),7);
assert.equal(sharedTypedConditionValue("boolean","true"),true);

const nested={
  kind:"all",
  conditions:[
    {kind:"predicate",field:"flowId",operator:"equals",value:"flow:retail"},
    {
      kind:"any",
      conditions:[
        {kind:"predicate",field:"payload.market",operator:"is one of",values:["retail","trade"]},
        {
          kind:"not",
          conditions:[
            {kind:"predicate",field:"payload.path",operator:"matches pattern",pattern:"^/internal"},
          ],
        },
      ],
    },
    {
      kind:"predicate",
      field:"payload.total",
      operator:"is greater than",
      valuePath:"payload.minimum",
    },
  ],
};
const before=structuredClone(nested);
const draft=projectConditionEditorDraft(nested);
assert.deepEqual(draft,nested,"the Studio adapter retains every nested project-condition field");
assert.notEqual(draft,nested,"the editor receives an isolated staged tree");
assert.deepEqual(nested,before,"opening a project condition is read-only");
assert.equal(
  conditionMatches(draft,{flowId:"flow:retail",payload:{market:"retail",path:"/shop",total:20,minimum:10}}),
  true,
  "the adapted tree retains its matching semantics",
);
assert.equal(
  conditionMatches(draft,{flowId:"flow:retail",payload:{market:"wholesale",path:"/internal",total:20,minimum:10}}),
  false,
  "nested Not and pattern semantics survive the adapter",
);
assert.deepEqual(
  projectConditionEditorDraft(undefined),
  {kind:"all",conditions:[]},
  "a blank Studio condition retains the production match-all representation",
);
