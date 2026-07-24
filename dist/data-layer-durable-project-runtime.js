import { createDurableProjectRuntime } from "./durable-project/runtime-core.js";
export { createDurableProjectRuntime } from "./durable-project/runtime-core.js";
import { openIndexedDbProjectRepository } from "./data-layer-durable-project-repository.js";
export async function openDurableProjectRuntime(legacy, factory = globalThis.indexedDB, startup = {}) { return createDurableProjectRuntime(await openIndexedDbProjectRepository(factory), legacy, startup); }
//# sourceMappingURL=data-layer-durable-project-runtime.js.map