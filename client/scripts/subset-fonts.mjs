import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { brandCharsetPath, clientRoot, fontJobs } from "./font-subset-config.mjs";

const manifestPath = resolve(clientRoot, "scripts/font-subset-manifest.json");

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

const characters = readFileSync(brandCharsetPath, "utf8");

const fonts = fontJobs.map((fontJob) => {
  const result = spawnSync("python3", [
    "-m",
    "fontTools.subset",
    fontJob.source,
    `--text-file=${brandCharsetPath}`,
    `--output-file=${fontJob.output}`,
    "--flavor=woff2",
    "--no-hinting",
  ], { encoding: "utf8" });

  if (result.error || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr.trim();
    throw new Error(`Font subsetting failed for ${fontJob.publicName}: ${detail}`);
  }

  const content = readFileSync(fontJob.output);
  if (content.byteLength > fontJob.maxBytes) {
    throw new Error(
      `${fontJob.publicName} is ${content.byteLength} bytes, exceeds ${fontJob.maxBytes}-byte budget`
    );
  }
  return {
    publicName: fontJob.publicName,
    bytes: content.byteLength,
    sha256: hash(content),
  };
});

const manifest = {
  schemaVersion: 1,
  characterCount: [...characters].length,
  characterSha256: hash(characters),
  fonts,
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${fonts.length} brand font(s) for ${manifest.characterCount} characters.`);
