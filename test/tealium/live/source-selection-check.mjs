import assert from 'node:assert/strict';
import {sourceActions} from '../../../dist/tealium/live/source-actions.js';
import {sourcePortFixture} from './source-port-fixture.mjs';

const flush = () => new Promise(resolve => setImmediate(resolve));
export async function checkSourceSelection() {
  const prior = globalThis.chrome;
  for (const change of ['another tag', 'clear selection', 'changed sender', 'changed extensions']) {
    const fixture = sourcePortFixture();
    globalThis.chrome = {runtime: fixture.runtime};
    const row = {key: 'first', tabId: 42, uid: '21', senderSource: 'first()', requestUrls: []};
    const live = {status: 'Observing', sessionId: 'session', selected: row.key,
      rows: [row, {...row, key: 'second', uid: '22'}]};
    const actions = sourceActions(42, () => live, () => {});
    const bridge = fixture.runtime.connect({name: 'tealium-devtools'});
    try {
      actions.update(); bridge.postMessage({type: 'hello', tabId: 42}); await flush();
      actions.show(); await flush();
      const held = bridge.messages.find(message => message.type === 'source' && message.open);
      assert.ok(held, 'The original source action reached the production broker');
      if (change === 'another tag') live.selected = 'second';
      if (change === 'clear selection') live.selected = null;
      if (change === 'changed extensions') row.extensionSources = ['replacement extension'];
      if (change === 'changed sender') row.senderSource = 'replacement()';
      actions.update(); await flush();
      bridge.postMessage({type: 'authorize', id: held.id}); await flush();
      const authorization = bridge.messages.find(message => message.type === 'authorized' && message.id === held.id);
      assert.equal(authorization?.allowed, false, `${change} must reject the held source action`);
      if (live.selected) {
        actions.show(); await flush();
        const current = bridge.messages.filter(message => message.type === 'source' && message.open).at(-1);
        assert.notEqual(current.id, held.id);
        bridge.postMessage({type: 'authorize', id: current.id}); await flush();
        assert.equal(bridge.messages.find(message => message.type === 'authorized' && message.id === current.id)?.allowed, true);
      }
    } finally { actions.dispose(); fixture.close(); globalThis.chrome = prior; }
  }
  console.log('Source selection changes cancel held actions and permit the current selection');
}
