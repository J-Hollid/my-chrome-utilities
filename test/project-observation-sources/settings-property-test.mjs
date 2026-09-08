import assert from 'node:assert/strict';
import {createSpecificationProject, exportSpecificationProjectState, stageProjectImport} from '../../dist/data-layer-specification-project.js';
import {projectObservationSources, saveObservationSource, removeObservationSource, normalizeObservationPath} from '../../dist/data-layer-project-observation-sources/settings.js';

for (let trial = 0; trial < 50; trial++) {
  const initial = createSpecificationProject({name: `Project ${trial}`, site: 'retail.test', id: kind => `${kind}:${trial}`});
  const pushPath = initial.project.eventTransport.defaultPushPath;
  let state = initial;
  const count = 1 + trial % 7;
  for (let index = 0; index < count; index++) {
    const path = `queue${trial}.events${index}`, id = `source-${index}`;
    const text = index % 2 ? ` window.${path} ` : path;
    assert.equal(normalizeObservationPath(normalizeObservationPath(text)), path);
    state = saveObservationSource(state, {id, name: `Source ${index}`, path: text, enabled: index % 2 === 0});
    const before = structuredClone(state);
    assert.throws(() => saveObservationSource(state, {id: `duplicate-${index}`, name: 'Duplicate', path: `window.${path}`, enabled: true}));
    assert.deepEqual(state, before, 'invalid updates are transactional');
    state = saveObservationSource(state, {id, name: `Renamed ${index}`, path, enabled: index % 2 !== 0});
    assert.equal(projectObservationSources(state.project).find(source => source.id === id).name, `Renamed ${index}`);
    assert.equal(state.project.eventTransport.defaultPushPath, pushPath);
  }
  const expected = projectObservationSources(state.project);
  assert.equal(new Set(expected.map(source => source.id)).size, expected.length);
  assert.equal(new Set(expected.map(source => source.path)).size, expected.length);
  const imported = stageProjectImport(exportSpecificationProjectState(state), initial, {projectId: `copy-${trial}`}).state;
  assert.deepEqual(projectObservationSources(imported.project), expected);
  for (const source of expected) state = removeObservationSource(state, source.id);
  assert.deepEqual(projectObservationSources(JSON.parse(JSON.stringify(state.project))), []);
  assert.equal(projectObservationSources(initial.project).length, 1, 'updates do not mutate the original project');
}
console.log(JSON.stringify({sourceSettingsProperties: {projects: 50, identity: true, transaction: true, roundTrip: true, empty: true}}));
