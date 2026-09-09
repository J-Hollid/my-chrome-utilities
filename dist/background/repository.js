import { openIndexedDbProjectRepository } from "../utilities/data-layer/schemas.js";
export function startDurableRepository() {
    void openIndexedDbProjectRepository().catch((error) => console.error("Durable project repository unavailable", error));
}
//# sourceMappingURL=repository.js.map