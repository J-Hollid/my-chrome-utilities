import {pathToFileURL} from "node:url";

import {runBrowserTargetSession} from "../support/browser-target-session.mjs";

export function globalStyleContainmentEvidence({
  stackedNarrow,
  width,
  horizontalContained,
  verticalOrdered,
  viewportContained,
}) {
  const narrowStacked = stackedNarrow && width <= 600;
  const contained = narrowStacked
    ? horizontalContained && verticalOrdered
    : viewportContained;
  return {contained,fullViewportContained:contained};
}

const surfaces = {
  studio: {
    pagePath:"specification-builder.html", expectedClass:"twatility-studio",
    sheets:["twatility-brand.css", "specification-builder-brand.css", "specification-builder.css"],
    regions:{
      header:"body > header", navigation:"#project-workspace > nav",
      workspace:"#workspace-pane", inspector:"#project-inspector",
    },
  },
  sidePanel: {
    pagePath:"side-panel.html", expectedClass:"twatility-side-panel",
    sheets:["twatility-brand.css", "side-panel-brand.css", "side-panel.css"],
    regions:{
      shell:"#side-panel-root", header:"#application-header", navigation:"#workspace-tabs",
      activeWorkspace:"#workspace-panel-data-layer",
    },
  },
};

const surface = (surfaceName, observationKey) => {
  const definition = surfaces[surfaceName];
  return {
    pagePath:definition.pagePath,
    readiness:{
      expression:surfaceName === "studio"
        ? "document.documentElement.dataset.specificationStudioInitialization === 'complete' && Boolean(document.querySelector('#create-project-form'))"
        : "document.querySelector('#side-panel-root')?.dataset.utilityShellReady === 'true'",
      description:`initialized ${surfaceName} style surface`,
    },
    run:async({ socket, evaluate }) => {
      const probeSource = function(expected, expectedClass, regions, forced, stackedNarrow, containmentEvidence) {
        const sheets = [...document.styleSheets].map((sheet) =>
          sheet.href ? new URL(sheet.href).pathname.split("/").pop() : "(inline)");
        const body = document.body, root = document.documentElement;
        const ink = getComputedStyle(body).getPropertyValue("--twa-ink").trim();
        const regionMeasurements = Object.fromEntries(Object.entries(regions).map(([name, selector]) => {
          const node = document.querySelector(selector);
          const rect = node?.getBoundingClientRect();
          return [name, { selector, exists:Boolean(node), nonzero:Boolean(rect?.width && rect?.height),
            rect:rect ? { left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom,
              width:rect.width, height:rect.height } : null }];
        }));
        const regionValues = Object.values(regionMeasurements);
        const horizontalContained = regionValues.every(({ rect }) => rect && rect.left >= -2 &&
          rect.right <= innerWidth + 2);
        const verticalOrdered = [...regionValues]
          .filter(({ rect }) => rect)
          .sort((left, right) => left.rect.top - right.rect.top)
          .every((left, index, ordered) => index === 0 ||
            ordered[index - 1].rect.bottom <= left.rect.top + 2);
        const viewportContained = regionValues.every(({ rect }) => rect && rect.left >= -2 &&
          rect.top >= -2 && rect.right <= innerWidth + 2 && rect.bottom <= innerHeight + 2);
        // Studio's narrow layout is intentionally a vertically stacked document. Its
        // regions may extend below the 900px viewport, so narrow containment is
        // horizontal containment plus ordered, non-overlapping vertical regions.
        const {contained,fullViewportContained} = containmentEvidence({
          stackedNarrow,width:innerWidth,horizontalContained,verticalOrdered,viewportContained,
        });
        const nonOverlapping = regionValues.every((left, index) => regionValues.slice(index + 1).every((right) => {
          const a = left.rect, b = right.rect;
          if (!a || !b) return true;
          const aContainsB = a.left <= b.left + 1 && a.top <= b.top + 1 &&
            a.right >= b.right - 1 && a.bottom >= b.bottom - 1;
          const bContainsA = b.left <= a.left + 1 && b.top <= a.top + 1 &&
            b.right >= a.right - 1 && b.bottom >= a.bottom - 1;
          return aContainsB || bContainsA || a.right <= b.left + 1 || b.right <= a.left + 1 ||
            a.bottom <= b.top + 1 || b.bottom <= a.top + 1;
        }));
        const focus = document.activeElement;
        const focusStyle = focus ? getComputedStyle(focus) : null;
        const focusVisible = Boolean(focus && focus.matches(":focus-visible"));
        const affordance = Boolean(focusStyle && (focusStyle.outlineStyle !== "none" ||
          focusStyle.borderStyle !== "none" || focusStyle.boxShadow !== "none") &&
          (focusStyle.outlineWidth !== "0px" || focusStyle.borderWidth !== "0px" || focusStyle.boxShadow !== "none"));
        const forcedActive = matchMedia("(forced-colors: active)").matches;
        const forcedAffordance = !forced || (forcedActive && Boolean(focusStyle) &&
          (focusStyle.outlineStyle !== "none" || focusStyle.borderStyle !== "none") &&
          (focusStyle.outlineWidth !== "0px" || focusStyle.borderWidth !== "0px"));
        const overflow = root.scrollWidth > innerWidth + 2;
        const result = { width:innerWidth, height:innerHeight, forcedRequested:forced,
          forcedActive, sheets, ink, overflow, contained, horizontalContained,
          verticalOrdered, fullViewportContained, nonOverlapping,
          regions:regionMeasurements, focus:{ tag:focus?.tagName ?? null,
            id:focus?.id ?? null, focusVisible, affordance, forcedAffordance } };
        if (!expected.every((name) => sheets.includes(name)) || !body.classList.contains(expectedClass) ||
            ink !== "#17130e" || overflow || !regionValues.every(({ exists, nonzero }) => exists && nonzero) ||
            !contained || !nonOverlapping || !focusVisible || !affordance || !forcedAffordance ||
            (forced && !forcedActive)) throw new Error(JSON.stringify(result));
        return result;
      };
      const probe = async(width, forcedColors) => {
        await socket().call("Emulation.setDeviceMetricsOverride", {
          width, height:900, deviceScaleFactor:1, mobile:false,
        });
        await socket().call("Emulation.setEmulatedMedia", {
          features:[{name:"forced-colors", value:forcedColors ? "active" : "none"}],
        });
        await socket().call("Page.bringToFront");
        await socket().call("Input.dispatchKeyEvent", {
          type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9,
        });
        await socket().call("Input.dispatchKeyEvent", {
          type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9,
        });
        const result = await evaluate(socket(), `return (${probeSource.toString()})(${JSON.stringify(definition.sheets)},${JSON.stringify(definition.expectedClass)},${JSON.stringify(definition.regions)},${JSON.stringify(forcedColors)},${JSON.stringify(surfaceName === "studio")},(${globalStyleContainmentEvidence.toString()}))`);
        if (result === undefined) throw new Error("Global style smoke probe returned no observation");
        return result;
      };
      if (surfaceName === "studio") {
        await evaluate(socket(), `(() => {
          const form = document.querySelector("#create-project-form");
          if (!form) throw new Error("Studio create-project form is missing");
          const name = document.querySelector("#project-name");
          const site = document.querySelector("#project-site");
          if (!name || !site) throw new Error("Studio create-project fields are missing");
          name.value = "Global style smoke project";
          site.value = "global-style-smoke.example";
          form.requestSubmit();
          return true;
        })()`);
        for (let attempt = 0; attempt < 160; attempt += 1) {
          if (await evaluate(socket(), "return Boolean(document.querySelector('#project-workspace') && !document.querySelector('#project-workspace').hidden)")) break;
          await new Promise((resolve) => setTimeout(resolve, 25));
          if (attempt === 159) {
            const diagnostic = await evaluate(socket(), `return (() => ({
              title:document.title, formValid:document.querySelector('#create-project-form')?.checkValidity(),
              name:document.querySelector('#project-name')?.value, site:document.querySelector('#project-site')?.value,
              status:document.querySelector('#start-path-status')?.textContent,
              workspaceHidden:document.querySelector('#project-workspace')?.hidden,
            }))()`);
            throw new Error(`Studio project workspace did not become visible after create-project submission: ${JSON.stringify(diagnostic)}`);
          }
        }
        await evaluate(socket(), `return (() => {
          const inspector = document.querySelector('#project-inspector');
          const toggle = document.querySelector('#toggle-project-inspector');
          if (inspector?.hidden && toggle) toggle.click();
          return true;
        })()`);
        for (let attempt = 0; attempt < 40; attempt += 1) {
          if (await evaluate(socket(), "return Boolean(document.querySelector('#project-inspector') && !document.querySelector('#project-inspector').hidden)")) break;
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
      }
      const wide = await probe(1280, false);
      const narrow = await probe(360, false);
      const forced = await probe(360, true);
      await socket().call("Emulation.setEmulatedMedia", { features:[] });
      return { [observationKey]:{ loaded:true, regions:definition.regions, wide, narrow, forced } };
    },
  };
};

const definitions = {
  STUDIO_GLOBAL_STYLE_SMOKE_TARGET:surface("studio", "studioGlobalStyle"),
  SIDE_PANEL_GLOBAL_STYLE_SMOKE_TARGET:surface("sidePanel", "sidePanelGlobalStyle"),
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runBrowserTargetSession({definitions});
}
