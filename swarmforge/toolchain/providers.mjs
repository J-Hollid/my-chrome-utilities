// Providers are trusted local modules, never commands or module paths from pin data.
import {inspectSerena,provisionSerena} from "../scripts/serena/provider.mjs";
export const providers = Object.freeze({serena:{inspect:inspectSerena,provision:provisionSerena}});
