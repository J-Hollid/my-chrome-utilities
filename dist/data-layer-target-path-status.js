import { pathStatus } from "./data-layer.js";
export function targetPathStatusForObservation(observation, path) {
    return observation.pageAccessStatus === "page access available"
        ? pathStatus(observation.pageObject, path)
        : "page access unavailable";
}
export function createTargetPathStatusController(options) {
    let latestRequest = 0;
    return {
        async configure(path, fieldValue = path) {
            latestRequest += 1;
            const request = latestRequest;
            options.render(path, fieldValue, "Checking target…");
            const observation = await options.read(path);
            if (request !== latestRequest)
                return;
            if (!observation) {
                options.render(path, fieldValue, "Selection required");
                return;
            }
            options.render(path, fieldValue, targetPathStatusForObservation(observation, path));
            options.apply(observation);
        },
    };
}
//# sourceMappingURL=data-layer-target-path-status.js.map