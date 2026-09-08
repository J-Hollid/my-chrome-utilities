import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export function emitObservationSourceStyleRegression(source,context) {
  const expectedPreRepairFailure={unscopedRules:6},expectedRepairResult={unscopedRules:0};
  const rules=source.split('\n').filter(line=>/^[.#].*\{/.test(line)&&/observation-source-(?:settings|row)/.test(line));
  assert.equal(rules.length,6);
  const unscoped=lines=>lines.filter(line=>line.split('{')[0].split(',').some(selector=>!selector.trim().startsWith('.twatility-side-panel '))).length;
  // Recreate the exact missing-prefix defect while retaining every current selector and declaration.
  const before={unscopedRules:unscoped(rules.map(line=>line.replaceAll('.twatility-side-panel ','')))};
  const after={unscopedRules:unscoped(rules)};
  assert.deepEqual(before,expectedPreRepairFailure);assert.deepEqual(after,expectedRepairResult);
  const normalized=value=>Array.isArray(value)?value.map(normalized):value&&typeof value==='object'
    ?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,normalized(item)])):value;
  const digest=value=>createHash('sha256').update(JSON.stringify(normalized(value))).digest('hex');
  const fixture={id:'observation-source-side-panel-scope-v1',causalCategory:context.causalCategory,
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input:{rules:rules.map(line=>line.split('{')[0].trim())},
    expectedPreRepairFailure,expectedRepairResult},fixtureDigest=digest(fixture);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,incidentId:context.incidentId,
    failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:'failed',fixtureDigest,observed:before},repairResult:{status:'passed',fixtureDigest,observed:after}}}));
}
