import { readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const source = await readFile(new URL("src/index.ts", root), "utf8");

if (manifest.name !== "@haneoka/altair-preset-full") {
  throw new Error("unexpected package name");
}
if (!manifest.repository?.url?.endsWith("/altair-preset-full.git")) {
  throw new Error("repository must point to the independent preset repository");
}
if (manifest.license !== "MIT") {
  throw new Error("the preset must use the MIT license");
}
if (
  manifest.publishConfig?.access !== "public" ||
  manifest.publishConfig?.provenance !== true
) {
  throw new Error("public provenance publishing is required");
}
if (
  manifest.altair?.pluginApi !== 2 ||
  manifest.altair?.kind !== "preset" ||
  manifest.altair?.capabilities?.length !== 0
) {
  throw new Error("the package must remain a capability-free Altair API 2 preset");
}
if (Object.keys(manifest.dependencies ?? {}).length !== 0) {
  throw new Error("the preset cannot own runtime implementation dependencies");
}

const optionalPeers = [
  "@haneoka/altair-plugin-adv",
  "@haneoka/altair-plugin-drafts",
  "@haneoka/altair-plugin-flow",
  "@haneoka/altair-plugin-history",
  "@haneoka/altair-plugin-marketplace",
  "@haneoka/altair-plugin-prose",
  "@haneoka/altair-plugin-vega-preview",
  "@haneoka/altair-plugin-webgal",
  "@haneoka/altair-plugin-workspace-browser",
];
if (manifest.peerDependencies?.["@haneoka/altair"] !== "^0.1.0") {
  throw new Error("Altair peer range must be ^0.1.0");
}
for (const name of optionalPeers) {
  if (manifest.peerDependencies?.[name] !== "^0.1.0") {
    throw new Error(`${name} peer range must be ^0.1.0`);
  }
  if (manifest.peerDependenciesMeta?.[name]?.optional !== true) {
    throw new Error(`${name} must remain an optional peer`);
  }
}

for (const prohibited of [
  /import\s*\(/,
  /\bfetch\s*\(/,
  /\beval\s*\(/,
  /\bnew\s+Function\s*\(/,
]) {
  if (prohibited.test(source)) {
    throw new Error(`preset source contains prohibited loader: ${prohibited}`);
  }
}
for (const name of optionalPeers) {
  if (
    source.includes(`from "${name}"`) ||
    source.includes(`from '${name}'`)
  ) {
    throw new Error(`preset cannot statically import implementation ${name}`);
  }
}

for (const file of [
  "dist/index.js",
  "dist/index.d.ts",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "NOTICE.md",
  "README.md",
  "SECURITY.md",
]) {
  await stat(new URL(file, root));
}

process.stdout.write("Altair preset package boundary verified\n");
