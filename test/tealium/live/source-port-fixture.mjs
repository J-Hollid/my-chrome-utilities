import {installTealiumBridge} from '../../../dist/tealium/devtools/broker.js';

export function sourcePortFixture() {
  let connect;
  const channels = [];
  const event = () => ({listeners: [], addListener(fn) { this.listeners.push(fn); }});
  const runtime = {id: 'extension', getURL: path => 'chrome-extension://extension/' + path,
    onConnect: {addListener(fn) { connect = fn; }},
    connect({name}) {
      const client = {messages: [], onMessage: event(), onDisconnect: event()};
      const server = {name, sender: {id: runtime.id, url: runtime.getURL(
        name === 'tealium-live' ? 'tealium/live/index.html' : 'tealium/devtools/index.html')},
        onMessage: event(), onDisconnect: event()};
      client.postMessage = message => queueMicrotask(() => {
        for (const listener of server.onMessage.listeners) void listener(message);
      });
      server.postMessage = message => queueMicrotask(() => {
        client.messages.push(message);
        for (const listener of client.onMessage.listeners) listener(message);
      });
      client.disconnect = server.disconnect = () => {
        for (const listener of server.onDisconnect.listeners) listener();
      };
      channels.push(client); connect(server); return client;
    }};
  installTealiumBridge(runtime, async () => {});
  return {runtime, close: () => channels.forEach(channel => channel.disconnect())};
}
