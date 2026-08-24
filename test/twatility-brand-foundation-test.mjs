import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {globalStyleContainmentEvidence,globalStyleTabKeyEvent} from
  "./browser-packs/global-style-smoke.mjs";

assert.deepEqual(globalStyleTabKeyEvent("keyDown"),{
  type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9,
},"the global style keyboard probe supplies Chrome's native Tab identity");

assert.deepEqual(globalStyleContainmentEvidence({
  stackedNarrow:true,
  width:360,
  horizontalContained:true,
  verticalOrdered:true,
  viewportContained:false,
}),{contained:true,fullViewportContained:true},
"a deliberately stacked narrow Studio document satisfies its horizontal and ordering containment policy");

assert.deepEqual(globalStyleContainmentEvidence({
  stackedNarrow:false,
  width:1280,
  horizontalContained:true,
  verticalOrdered:false,
  viewportContained:true,
}),{contained:true,fullViewportContained:true},
"a bounded desktop shell retains literal full-viewport containment");

assert.deepEqual(globalStyleContainmentEvidence({
  stackedNarrow:true,
  width:360,
  horizontalContained:false,
  verticalOrdered:true,
  viewportContained:false,
}),{contained:false,fullViewportContained:false},
"a narrow stacked document still fails when it escapes horizontally");

if (process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION) {
  const context=JSON.parse(process.env.SWARMFORGE_TIMEOUT_REPAIR_REGRESSION);
  const normalized=(value)=>Array.isArray(value)?value.map(normalized):value&&typeof value==="object"
    ?Object.fromEntries(Object.entries(value).filter(([,nested])=>nested!==undefined)
      .sort(([left],[right])=>left.localeCompare(right)).map(([key,nested])=>[key,normalized(nested)]))
    :value;
  const digest=(value)=>createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
  const input={stackedNarrow:true,width:360,horizontalContained:true,
    verticalOrdered:true,viewportContained:false};
  const fixture={id:"studio-stacked-narrow-containment-policy-v1",
    causalCategory:"viewport/visibility/hit testing",
    diagnosedBoundaryDigest:digest(context.diagnosedBoundary),input,
    expectedPreRepairFailure:{contained:true,fullViewportContained:false},
    expectedRepairResult:{contained:true,fullViewportContained:true}};
  const preRepairResult={contained:input.horizontalContained&&input.verticalOrdered,
    fullViewportContained:input.viewportContained};
  const repairResult=globalStyleContainmentEvidence(input);
  const fixtureDigest=digest(fixture);
  assert.deepEqual(preRepairResult,fixture.expectedPreRepairFailure);
  assert.deepEqual(repairResult,fixture.expectedRepairResult);
  console.log(JSON.stringify({swarmforgeTimeoutRepairRegression:{version:2,
    incidentId:context.incidentId,failureDigest:context.failureDigest,fixture,
    preRepairResult:{status:"failed",fixtureDigest,observed:preRepairResult},
    repairResult:{status:"passed",fixtureDigest,observed:repairResult}}}));
}

const staticFiles = [
  "manifest.json",
  "side-panel.html",
  "side-panel.css",
  "specification-builder.html",
  "specification-builder.css",
  "specification-builder-guidance.css",
  "layered-schema.css",
  "twatility-brand.css",
  "schema-authoring-brand.css",
  "side-panel-brand.css",
  "specification-builder-brand.css",
];

for (const file of staticFiles) {
  assert.deepEqual(
    await readFile(path.join("dist", file)),
    await readFile(file),
    `${file} must be copied byte-for-byte into dist`,
  );
}

const layeredCss = await readFile("layered-schema.css", "utf8");
assert.match(layeredCss, /#layered-schema-editor-host:not\(\[hidden\]\)\s*\{[^}]*grid-row:\s*2[^}]*max-block-size:\s*100%[^}]*min-block-size:\s*0[^}]*overflow-y:\s*auto[^}]*overscroll-behavior:\s*contain/su,
  "the visible layered-schema host is the single contained vertical route scroll owner");

const expectedStylesheets = {
  "side-panel.html": [
    "side-panel.css",
    "layered-schema.css",
    "twatility-brand.css",
    "schema-authoring-brand.css",
    "side-panel-brand.css",
  ],
  "specification-builder.html": [
    "specification-builder.css",
    "specification-builder-guidance.css",
    "layered-schema.css",
    "twatility-brand.css",
    "schema-authoring-brand.css",
    "flow-graph/flow-workspace.css",
    "flow-graph/flow-workspace-shell.css",
    "specification-builder-brand.css",
  ],
};
const localReferencePattern = /\b(?:href|src)=["']([^"']+)["']/giu;

for (const [htmlName, expected] of Object.entries(expectedStylesheets)) {
  const html = await readFile(path.join("dist", htmlName), "utf8");
  const stylesheets = [...html.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/giu)]
    .map((match) => match[1]);
  assert.deepEqual(stylesheets, expected, `${htmlName} stylesheet order`);
  assert.match(html, /<body class="twatility-theme twatility-(?:side-panel|studio)">/u);
  if (htmlName === "side-panel.html") {
    assert.match(html, /aria-label="TWAtility Belt"/u);
    assert.match(
      html,
      /<img\b[^>]*class="twatility-wordmark__image"[^>]*src="assets\/brand\/side-panel-title\.png"[^>]*width="800"[^>]*height="180"[^>]*alt=""[^>]*aria-hidden="true"[^>]*>/u,
    );
    assert.doesNotMatch(html, /twatility-wordmark__twa/u);
  } else {
    assert.match(
      html,
      /<img\b[^>]*src="assets\/brand\/specification-studio-title\.png"[^>]*alt="TWAtility Belt"[^>]*>/u,
    );
    assert.match(
      html,
      /class="twatility-studio-surface-title">Specification Studio<\/span>/u,
    );
    assert.equal(
      [...html.matchAll(/class="twatility-studio-star" aria-hidden="true"/gu)].length,
      2,
      "Studio title stars remain decorative",
    );
    assert.doesNotMatch(html, /studio-title-accessible/u);
  }

  for (const [, reference] of html.matchAll(localReferencePattern)) {
    if (
      reference.startsWith("#") ||
      /^[a-z][a-z\d+.-]*:/iu.test(reference) ||
      reference.startsWith("//")
    ) {
      continue;
    }
    const cleanReference = reference.split(/[?#]/u, 1)[0];
    const target = path.resolve(
      "dist",
      cleanReference.startsWith("/") ? cleanReference.slice(1) : cleanReference,
    );
    assert.ok(target.startsWith(`${path.resolve("dist")}${path.sep}`));
    await access(target);
  }
}

const manifest = JSON.parse(await readFile("dist/manifest.json", "utf8"));
assert.equal(manifest.name, "TWAtility Belt");
assert.equal(manifest.action.default_title, "Open TWAtility Belt");
const expectedIconMap = {
  "16": "assets/brand/icons/icon-16.png",
  "32": "assets/brand/icons/icon-32.png",
  "48": "assets/brand/icons/icon-48.png",
  "128": "assets/brand/icons/icon-128.png",
};
assert.deepEqual(manifest.icons, expectedIconMap);
assert.deepEqual(manifest.action.default_icon, expectedIconMap);
assert.ok(manifest.permissions.includes("storage"));
assert.ok(manifest.permissions.includes("unlimitedStorage"));

const brandCssNames = [
  "twatility-brand.css",
  "schema-authoring-brand.css",
  "side-panel-brand.css",
  "specification-builder-brand.css",
];
let combinedCss = "";
for (const name of brandCssNames) {
  const css = await readFile(path.join("dist", name), "utf8");
  combinedCss += css;
  assert.doesNotMatch(css, /@import|https?:|data:/iu, `${name} must remain packaged-local`);
  for (const [, rawReference] of css.matchAll(/url\(["']?([^"')]+)["']?\)/giu)) {
    const reference = rawReference.trim();
    if (reference.startsWith("#")) continue;
    await access(path.resolve("dist", reference));
  }
}
for (const token of [
  "--twa-ink",
  "--twa-paper",
  "--twa-navy",
  "--twa-mustard",
  "--twa-focus",
  "--twa-font-display",
  "--twa-font-body",
  "--twa-font-mono",
]) {
  assert.ok(combinedCss.includes(token), `missing shared token ${token}`);
}
assert.match(combinedCss, /prefers-reduced-motion:\s*reduce/u);
assert.match(combinedCss, /forced-colors:\s*active/u);
assert.match(combinedCss, /:focus-visible/u);
assert.doesNotMatch(
  combinedCss,
  /\.twatility-studio-(?:wordmark|surface-title)[^{]*\{[^}]*scaleX\s*\(/isu,
  "Studio masthead artwork and live title must not be horizontally scaled",
);

const assets = [
  ["twatility-belt.png", 1774, 887],
  ["specification-studio-title.png", 1600, 360],
  ["side-panel-title.png", 800, 180],
  ["technical-analyst.png", 587, 822],
  ["technical-analyst-speaking-a.png", 587, 822],
  ["technical-analyst-speaking-b.png", 587, 822],
  ["icons/icon-16.png", 16, 16],
  ["icons/icon-32.png", 32, 32],
  ["icons/icon-48.png", 48, 48],
  ["icons/icon-128.png", 128, 128],
];
for (const [name, width, height] of assets) {
  const source = await readFile(path.join("assets", "brand", name));
  const built = await readFile(path.join("dist", "assets", "brand", name));
  assert.deepEqual(built, source, `${name} must be copied without image processing`);
  assert.equal(source.toString("ascii", 1, 4), "PNG");
  assert.equal(source.readUInt32BE(16), width);
  assert.equal(source.readUInt32BE(20), height);
  assert.equal(source[24], 8, `${name} must remain 8-bit`);
  assert.equal(source[25], 6, `${name} must remain RGBA`);
}

assert.deepEqual(
  (await readdir(path.join("dist", "assets", "brand"))).sort(),
  [
    "ARTWORK.md",
    "icons",
    "side-panel-title.png",
    "specification-studio-title.png",
    "technical-analyst-speaking-a.png",
    "technical-analyst-speaking-b.png",
    "technical-analyst.png",
    "twatility-belt.png",
  ],
);
assert.deepEqual(
  (await readdir(path.join("dist", "assets", "brand", "icons"))).sort(),
  ["icon-128.png", "icon-16.png", "icon-32.png", "icon-48.png"],
);

const buildScript = await readFile("scripts/build.mjs", "utf8");
assert.match(buildScript, /process\.execPath/u);
assert.match(buildScript, /require\.resolve\("typescript\/bin\/tsc"\)/u);
assert.doesNotMatch(buildScript, /execFileSync\(["']tsc["']/u);
assert.match(buildScript, /stylesheetDeclarations/u,
  "the build consumes the canonical stylesheet declarations");
assert.match(buildScript, /verification\/packs\.json/u,
  "the build reads the canonical verification registry");
assert.match(buildScript, /cp\("assets\/brand"/u);

console.log("TWAtility Belt brand foundation tests passed");
