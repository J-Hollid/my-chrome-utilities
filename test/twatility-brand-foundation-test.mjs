import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

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
  assert.match(html, /aria-label="TWAtility Belt"/u);

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

const assets = [
  ["twatility-belt.png", 1774, 887],
  ["technical-analyst.png", 1023, 1537],
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
  ["ARTWORK.md", "technical-analyst.png", "twatility-belt.png"],
);

const buildScript = await readFile("scripts/build.mjs", "utf8");
assert.match(buildScript, /process\.execPath/u);
assert.match(buildScript, /require\.resolve\("typescript\/bin\/tsc"\)/u);
assert.doesNotMatch(buildScript, /execFileSync\(["']tsc["']/u);
assert.match(buildScript, /specification-builder-guidance\.css/u);
assert.match(buildScript, /cp\("assets\/brand"/u);

console.log("TWAtility Belt brand foundation tests passed");
