import { runBrowserTargetSession } from "../support/browser-target-session.mjs";

const surface = (expectedClass, expectedSheets, observationKey) => ({
  pagePath: expectedClass === "twatility-studio"
    ? "specification-builder.html" : "side-panel.html",
  readiness:{
    expression:"document.readyState === 'complete'",
    description:"the installed global-style smoke surface",
  },
  expression:() => `
    const sheets = [...document.styleSheets].map((sheet) =>
      sheet.href ? new URL(sheet.href).pathname.split("/").pop() : "(inline)");
    const expected = ${JSON.stringify(expectedSheets)};
    const loaded = expected.every((name) => sheets.includes(name));
    const body = document.body;
    const ink = getComputedStyle(body).getPropertyValue("--twa-ink").trim();
    const visible = body.getClientRects().length > 0 &&
      getComputedStyle(body).display !== "none";
    if (!loaded || !body.classList.contains(${JSON.stringify(expectedClass)}) ||
        ink !== "#17130e" || !visible) {
      throw new Error(JSON.stringify({loaded, sheets, classes:[...body.classList], ink, visible}));
    }
    return {${observationKey}:{loaded:true, expectedSheets:expected, ink, visible}};`
});

const definitions = {
  STUDIO_GLOBAL_STYLE_SMOKE_TARGET:surface(
    "twatility-studio",
    ["twatility-brand.css", "specification-builder-brand.css", "specification-builder.css"],
    "studioGlobalStyle",
  ),
  SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET:surface(
    "twatility-side-panel",
    ["twatility-brand.css", "side-panel-brand.css", "side-panel.css"],
    "sidePanelGlobalStyle",
  ),
};

await runBrowserTargetSession({definitions});
