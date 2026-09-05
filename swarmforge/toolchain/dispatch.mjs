import {requestedPin} from "./pins.mjs";

export async function optionalOperation({operation, name, pins, providers, repositoryRoot}) {
  if (!["inspect", "provision"].includes(operation)) {
    throw new Error("request: use inspect or provision with one optional tool name");
  }
  const request = requestedPin(pins, name);
  const provider = Object.hasOwn(providers, request.pin.provider) ? providers[request.pin.provider] : null;
  if (!provider || typeof provider[operation] !== "function") {
    if (operation === "inspect") return {...request, available:false, reason:"provider-unavailable"};
    throw new Error(`provider-unavailable: ${request.pin.provider}`);
  }
  const result = await provider[operation]({...request, repositoryRoot});
  if (!result || typeof result.available !== "boolean") throw new Error("invalid provider result");
  return {...result, ...request, operation};
}
