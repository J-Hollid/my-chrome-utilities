import {inspectInstructions} from './instruction-fixture.mjs';

for (const [role, route] of [['specifier', 'native startup loading'], ['coder', 'explicit safe-boundary reading'],
  ['refactorer', 'native startup loading'], ['architect', 'explicit safe-boundary reading']]) {
  await inspectInstructions(role, route);
}
console.log(JSON.stringify({retrievalInstructions: {fixtureRoles: 4, conditionalRead: true}}));
