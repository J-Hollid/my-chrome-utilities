import assert from "node:assert/strict";

import {
  addAllowedValue,
  advanceGuidedValidation,
  assignmentScopeSummary,
  backGuidedValidation,
  createGuidedValidationDraft,
  existingSchemaDestination,
  guidedAssignmentsMatch,
  pathConditionResult,
  searchSchemaDestinationOptions,
  schemaDestinationOptions,
  selectGuidedProperty,
  setAllowedValue,
  setGuidedRequirement,
  setGuidedSchemaDestination,
  validateNewSchemaName,
  validateAllowedValues,
} from "../dist/data-layer-guided-validation.js";

let seed = 0x6d2b79f5;

function nextToken() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed.toString(36);
}

for (let sample = 0; sample < 200; sample += 1) {
  const segment = `product-${nextToken()}`;
  const pathname = `/products/${segment}`;
  const url = `https://shop.example${pathname}?sample=${sample}#details`;

  assert.deepEqual(
    pathConditionResult({ matchType:"Exact path", expression:pathname }, url),
    { valid:true, matches:true },
  );
  assert.equal(
    pathConditionResult({ matchType:"Exact path", expression:"/products" }, url).matches,
    false,
  );
  assert.equal(
    pathConditionResult({ matchType:"Path pattern", expression:"/products/*" }, url).matches,
    true,
  );

  const values = [`value-${sample}`, `value-${nextToken()}`];
  assert.deepEqual(validateAllowedValues(values), { valid:true, assistance:"2 allowed values" });
  assert.equal(validateAllowedValues([values[0], values[0]]).valid, false);
  assert.equal(validateAllowedValues([values[0], " "]).valid, false);

  const initial = createGuidedValidationDraft({
    id:`event:${sample}`,
    name:"pageview",
    sourceId:"event-history",
    pageUrl:url,
    payload:{ page_type:values[0] },
  });
  const selected = selectGuidedProperty(initial, "page_type");
  const configured = setGuidedRequirement(selected, "Must be one of these values");
  const withBlank = addAllowedValue(configured);
  const completed = setAllowedValue(withBlank, 1, values[1]);

  assert.deepEqual(configured.allowedValues, [values[0]]);
  assert.deepEqual(completed.allowedValues, values);
  assert.equal(backGuidedValidation(initial).stage, "property");

  const destination = advanceGuidedValidation(selected);
  const schemaName = `Schema ${sample}`;
  assert.equal(validateNewSchemaName(schemaName, [`Other ${sample}`]).valid, true);
  assert.equal(validateNewSchemaName(schemaName, [schemaName.toUpperCase()]).valid, false);

  const matchingCandidate = {
    id:`schema:${sample}`,
    name:schemaName,
    version:sample + 1,
    target:"payload",
    propertyTypes:{ page_type:"String" },
    assignments:[{ sourceId:"event-history", eventName:"pageview", target:"payload", domainCondition:"shop.example", enabled:true }],
  };
  const destinationOptions = schemaDestinationOptions(destination, [
    matchingCandidate,
    { ...matchingCandidate, id:`number:${sample}`, propertyTypes:{ page_type:"Number" } },
    { ...matchingCandidate, id:`raw:${sample}`, target:"raw input" },
  ]);
  assert.deepEqual(destinationOptions.map(({ available }) => available), [true, false, false]);
  assert.equal(existingSchemaDestination(destination, matchingCandidate).matchingAssignment, true);
  const pathCandidate = {
    ...matchingCandidate,
    id:`path:${sample}`,
    name:`Path schema ${sample}`,
    assignments:[{
      ...matchingCandidate.assignments[0],
      name:`Products assignment ${sample}`,
      pathConditions:[{ matchType:"Exact path", expression:pathname }],
    }],
  };
  const searchInventory = [matchingCandidate, pathCandidate];
  for (const query of [schemaName, `version ${sample + 1}`, "payload", "page_type", "shop.example"]) {
    assert.ok(searchSchemaDestinationOptions(destination, searchInventory, query).some(({ id }) => id === matchingCandidate.id));
  }
  assert.deepEqual(searchSchemaDestinationOptions(destination, searchInventory, pathname).map(({ id }) => id), [pathCandidate.id]);
  assert.equal(searchSchemaDestinationOptions(destination, searchInventory, `missing-${nextToken()}`).length, 0);
  assert.equal(searchSchemaDestinationOptions(destination, searchInventory, " ").length, searchInventory.length);
  assert.match(assignmentScopeSummary(pathCandidate.assignments), /pageview · shop\.example/);
  assert.equal(guidedAssignmentsMatch(
    matchingCandidate.assignments[0],
    { ...matchingCandidate.assignments[0], pathnameCondition:pathname },
  ), false);

  const requirement = advanceGuidedValidation(setGuidedSchemaDestination(destination, { kind:"new", schemaName }));
  const scope = advanceGuidedValidation(requirement);
  const review = advanceGuidedValidation(scope);
  assert.deepEqual(
    [destination.stage, requirement.stage, scope.stage, review.stage, advanceGuidedValidation(review).stage],
    ["destination", "requirement", "scope", "review", "review"],
  );
  assert.equal(backGuidedValidation(review).stage, "scope");
}
