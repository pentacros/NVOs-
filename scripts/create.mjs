#!/usr/bin/env node
// Interactive entry point for generating one NVO. Each format owns its own
// content shape (logo count, bullet/badge count, checklist, product-shot
// requirement) via nvo-template/formats/<key>/config.json's contentShape —
// this script asks only the questions that shape actually calls for.

import { createInterface } from "node:readline";
import { spawn, execSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { getFormatCatalog, previewTextForFormat } from "./formatCatalog.mjs";

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });

const lineQueue = [];
const waiters = [];
rl.on("line", (line) => {
  if (waiters.length) waiters.shift()(line);
  else lineQueue.push(line);
});
function nextLine() {
  if (lineQueue.length) return Promise.resolve(lineQueue.shift());
  return new Promise((resolve) => waiters.push(resolve));
}

async function ask(question, def) {
  const suffix = def !== undefined && def !== null && def !== "" ? ` [${def}]` : "";
  process.stdout.write(`${question}${suffix}: `);
  const answer = (await nextLine()).trim();
  return answer === "" ? def ?? "" : answer;
}

async function askYesNo(question, def = true) {
  const suffix = def ? "[Y/n]" : "[y/N]";
  process.stdout.write(`${question} ${suffix}: `);
  const answer = (await nextLine()).trim().toLowerCase();
  if (answer === "") return def;
  return answer.startsWith("y");
}

async function askChoice(question, options, def) {
  console.log(question);
  options.forEach((o, i) => console.log(`  ${i + 1}. ${o}`));
  const defIndex = options.indexOf(def);
  process.stdout.write(`Choice${defIndex >= 0 ? ` [${defIndex + 1}]` : ""}: `);
  const answer = (await nextLine()).trim();
  if (answer === "" && defIndex >= 0) return options[defIndex];
  const idx = parseInt(answer, 10) - 1;
  if (idx >= 0 && idx < options.length) return options[idx];
  const byName = options.find((o) => o.toLowerCase() === answer.toLowerCase());
  return byName ?? options[defIndex >= 0 ? defIndex : 0];
}

async function askNumber(question, def) {
  const raw = await ask(question, def !== undefined ? String(def) : undefined);
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : def;
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${cmd} ${args.join(" ")}`);
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`))));
    child.on("error", reject);
  });
}

function probeDuration(file) {
  const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`).toString().trim();
  return Math.round(parseFloat(out) * 100) / 100;
}

function discoverRatioTokens() {
  return readdirSync("nvo-template/templates")
    .map((f) => f.match(/^canvas-(.+)\.template\.html$/))
    .filter(Boolean)
    .map((m) => m[1]);
}

function ratioLabel(token) {
  return token.replace("x", ":");
}

function normalizeSlug(rawName) {
  return rawName.toLowerCase().replace(/\s+/g, "_");
}

async function collectShots(slug, existingSpec) {
  if (existingSpec?.shots?.length) {
    console.log("\nExisting shots:");
    existingSpec.shots.forEach((s, i) => console.log(`  ${i + 1}. ${s.src} (${s.duration}s)`));
    if (await askYesNo("Keep these shots as-is?", true)) return existingSpec.shots;
  }

  const canonicalDir = `nvo-template/assets/${slug}`;
  const rawFootageDir = `footage/${slug}`;
  let defaultFolder = null;
  if (existsSync(canonicalDir) && readdirSync(canonicalDir).some((f) => f.toLowerCase().endsWith(".mp4"))) {
    defaultFolder = canonicalDir;
  } else if (existsSync(rawFootageDir)) {
    defaultFolder = rawFootageDir;
  }

  let folder = await ask("Footage folder for THIS campaign (containing the trimmed clips to use as shots — never a reference/ folder)", defaultFolder ?? undefined);
  while (!folder || !existsSync(folder)) {
    console.log(`Path not found: "${folder}"`);
    folder = await ask("Try again");
  }

  let mp4s = readdirSync(folder).filter((f) => f.toLowerCase().endsWith(".mp4")).sort();
  if (!mp4s.length) {
    console.log(`No .mp4 files found in ${folder}.`);
    process.exit(1);
  }
  console.log(`Found ${mp4s.length} clip(s) in ${folder}: ${mp4s.join(", ")}`);
  if (!(await askYesNo("Use all of these as shots, in this order?", true))) {
    const raw = await ask("Comma-separated filenames to use, in order");
    const chosen = raw.split(",").map((s) => s.trim()).filter(Boolean);
    mp4s = chosen.filter((f) => mp4s.includes(f));
  }

  if (path.resolve(folder) !== path.resolve(canonicalDir)) {
    mkdirSync(canonicalDir, { recursive: true });
    for (const f of mp4s) copyFileSync(path.join(folder, f), path.join(canonicalDir, f));
    console.log(`Copied ${mp4s.length} clip(s) into ${canonicalDir}/`);
  }

  const shots = [];
  for (const f of mp4s) {
    const filePath = path.join(canonicalDir, f);
    let probed;
    try {
      probed = probeDuration(filePath);
    } catch {
      probed = undefined;
    }
    const duration = await askNumber(`Duration for ${f} (seconds)`, probed ?? 3);
    shots.push({ src: `assets/${slug}/${f}`, duration });
  }
  return shots;
}

// Asks for up to `count` image file paths for this campaign's own logos (never
// from reference/) and copies each into the campaign's canonical assets dir.
async function collectLogoPaths(slug, label, count, existingLogos) {
  if (existingLogos?.length) {
    console.log(`\nExisting ${label} logos:`);
    existingLogos.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    if (await askYesNo("Keep these as-is?", true)) return existingLogos;
  }
  const canonicalDir = `nvo-template/assets/${slug}`;
  mkdirSync(canonicalDir, { recursive: true });
  const logos = [];
  for (let i = 0; i < count; i++) {
    let src = await ask(`Path to ${label} logo ${i + 1} of ${count} (blank to stop early)`, "");
    if (!src) break;
    while (!existsSync(src)) {
      console.log(`Not found: "${src}"`);
      src = await ask("Try again (blank to stop)", "");
      if (!src) break;
    }
    if (!src) break;
    const filename = path.basename(src);
    const destRel = `assets/${slug}/${filename}`;
    const destAbs = `nvo-template/${destRel}`;
    if (path.resolve(src) !== path.resolve(destAbs)) copyFileSync(src, destAbs);
    logos.push(destRel);
  }
  return logos;
}

async function collectTextItems(count, prompt) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const text = await ask(`${prompt} ${i + 1} of ${count}`);
    if (text) items.push(text);
  }
  return items;
}

// Builds the beats object for one format from its own contentShape — this is
// the point where each format's clarifying questions genuinely diverge.
async function collectBeatsForFormat(format, existingSpec, slug, rawName) {
  const shape = format.contentShape ?? {};
  const existingBeats = existingSpec?.beats ?? {};

  const hookLead = await ask("Headline lead-in line (e.g. \"Study in\")", existingBeats.hook?.lead ?? format.defaultHeroLine ?? "");
  const hookHero = await ask("Headline hero word (country/degree name)", existingBeats.hook?.hero ?? rawName);
  let hookSubtitle = existingBeats.hook?.subtitle ?? "";
  if (shape.hasIntakeBadge) {
    hookSubtitle = await ask("Intake badge / tag line under the headline", hookSubtitle || format.defaultSupportLine || "");
  } else if (await askYesNo("Add an optional subtitle line under the headline?", !!hookSubtitle)) {
    hookSubtitle = await ask("Subtitle text", hookSubtitle || format.defaultSupportLine || "");
  } else {
    hookSubtitle = "";
  }
  const hookDuration = await askNumber("Headline duration (seconds)", existingBeats.hook?.duration ?? 3.5);
  const hook = { duration: hookDuration, lead: hookLead, hero: hookHero, ...(hookSubtitle ? { subtitle: hookSubtitle } : {}) };

  async function collectProofBeat(proofShape, existingBeat, label) {
    if (!proofShape || proofShape.mode === "none") return null;
    const count = proofShape.count ?? 4;
    const duration = await askNumber(`${label} beat duration (seconds)`, existingBeat?.duration ?? Math.max(2.5, count * 0.6));
    if (proofShape.mode === "logos") {
      console.log(`\n${label}: up to ${count} ${proofShape.logoType ?? ""} logo(s) — fetch/copy this campaign's OWN logos, never a reference/ file.`);
      const logos = await collectLogoPaths(slug, proofShape.logoType ?? "proof", count, existingBeat?.logos);
      return { mode: "logos", duration, logos };
    }
    if (proofShape.mode === "bullets") {
      const bullets = await collectTextItems(count, `${label} bullet`);
      return { mode: "bullets", duration, bullets: bullets.length ? bullets : (existingBeat?.bullets ?? []) };
    }
    if (proofShape.mode === "numberedBadges") {
      const items = await collectTextItems(count, `${label} numbered badge`);
      return { mode: "numberedBadges", duration, items: items.length ? items : (existingBeat?.items ?? []) };
    }
    if (proofShape.mode === "cumulativePills") {
      const items = await collectTextItems(count, `${label} pill`);
      return { mode: "cumulativePills", duration, items: items.length ? items : (existingBeat?.items ?? []) };
    }
    return null;
  }

  const proof = await collectProofBeat(shape.proof, existingBeats.proof, "Proof");
  const secondaryProof = await collectProofBeat(shape.secondaryProof, existingBeats.secondaryProof, "Secondary proof");

  let checklist = null;
  if (shape.checklist?.supported) {
    const wantChecklist = shape.checklist.required || (await askYesNo("Include the eligibility checklist beat?", true));
    if (wantChecklist) {
      const heading = shape.checklist.defaultHeading
        ? await ask("Checklist heading", existingBeats.checklist?.heading ?? shape.checklist.defaultHeading)
        : (existingBeats.checklist?.heading ?? "");
      let items = existingBeats.checklist?.items;
      const hasDefaultWording = Array.isArray(shape.checklist.defaultItems) && shape.checklist.defaultItems.length > 0;
      if (hasDefaultWording && (await askYesNo(`Use the standard checklist wording (${shape.checklist.defaultItems.join(" / ")})?`, true))) {
        items = shape.checklist.defaultItems;
      } else {
        items = await collectTextItems(shape.checklist.count ?? 3, "Checklist item");
      }
      const duration = await askNumber("Checklist duration (seconds)", existingBeats.checklist?.duration ?? 4);
      checklist = { heading, items, duration };
    }
  }

  let productShot = null;
  if (shape.productShot === "required" || shape.productShot === "optional") {
    const isRequired = shape.productShot === "required";
    const wantProductShot = isRequired || (await askYesNo("Include a product-shot / app screen-recording beat?", !!existingBeats.productShot));
    if (isRequired) console.log("\nThis format requires a product-shot beat (its source format always includes one) — provide THIS campaign's own screen recording, never a reference clip.");
    if (wantProductShot) {
      let src = await ask("Product-shot video file path (this campaign's own screen recording)", existingBeats.productShot?.src);
      while (!src || !existsSync(src)) {
        console.log(`Not found: "${src}"`);
        src = await ask("Try again");
      }
      const duration = await askNumber("Product-shot duration (seconds)", existingBeats.productShot?.duration ?? 4);
      productShot = { src, duration };
    }
  }

  const ctaLead = await ask("CTA lead text (e.g. \"Check\")", existingBeats.cta?.lead ?? (format.defaultCtaLine ?? "").split(/\s+/)[0] ?? "Get");
  const ctaAccent = await ask("CTA accent phrase", existingBeats.cta?.accent ?? (format.defaultCtaLine ?? "").replace(/^\S+\s*/, "") ?? "your shortlist now");
  const ctaDuration = await askNumber("CTA duration (seconds)", existingBeats.cta?.duration ?? 3);
  const cta = { duration: ctaDuration, lead: ctaLead, accent: ctaAccent };

  return {
    hook,
    ...(proof ? { proof } : {}),
    ...(secondaryProof ? { secondaryProof } : {}),
    ...(checklist ? { checklist } : {}),
    ...(productShot ? { productShot } : {}),
    cta,
  };
}

async function main() {
  console.log("=== NVO Generator — create a video ===\n");

  const formatCatalog = getFormatCatalog();
  console.log("Pick a format — each has its own visual style AND its own content shape (logo/bullet counts, checklist, product-shot use):\n");
  formatCatalog.forEach((f, i) => console.log(`  ${i + 1}. ${f.name} — ${f.description}`));
  console.log();
  const defaultFormat = formatCatalog.find((format) => format.key === "genericnvo1") ?? formatCatalog[0];
  const chosenFormatName = await askChoice("Which format/style should this campaign use?", formatCatalog.map((f) => f.name), defaultFormat.name);
  const selectedFormat = formatCatalog.find((format) => format.name === chosenFormatName) ?? defaultFormat;

  console.log(`\nGot it — building a "${selectedFormat.name}" style NVO.\n`);
  const projectRoot = process.cwd();
  console.log(previewTextForFormat(selectedFormat.key, projectRoot));
  console.log();

  // Shared questions (every format asks these, in this order)
  const rawName = await ask("Campaign/country name (e.g. germany)");
  const slug = normalizeSlug(rawName);
  if (!slug) {
    console.log("A campaign name is required.");
    process.exit(1);
  }

  const ratioTokens = discoverRatioTokens();
  if (!ratioTokens.length) {
    console.log("No canvas-*.template.html files found under nvo-template/templates — cannot proceed.");
    process.exit(1);
  }
  const ratioLabels = ratioTokens.map(ratioLabel);
  const preferredDefaultToken = ratioTokens.includes("9x16") ? "9x16" : ratioTokens[0];
  const chosenLabel = await askChoice("Which aspect ratio to render first?", ratioLabels, ratioLabel(preferredDefaultToken));
  const firstRatioToken = ratioTokens[ratioLabels.indexOf(chosenLabel)];

  const specPath = `videos/${slug}__${selectedFormat.key}.json`;
  let existingSpec = null;
  if (existsSync(specPath)) {
    const choice = await askChoice(`Spec for "${slug}" in format "${selectedFormat.key}" already exists — edit it or start fresh?`, ["edit", "fresh"], "edit");
    if (choice === "edit") existingSpec = JSON.parse(readFileSync(specPath, "utf-8"));
  }

  const shots = await collectShots(slug, existingSpec);

  // Format-specific questions — genuinely different per format's contentShape
  const beats = await collectBeatsForFormat(selectedFormat, existingSpec, slug, rawName);

  const spec = {
    version: 3,
    format: selectedFormat.key,
    formatName: selectedFormat.name,
    pillColor: selectedFormat.pill ?? "#1E3FE0",
    shots,
    beats,
  };

  console.log(`\n--- Spec to write to ${specPath} ---`);
  console.log(JSON.stringify(spec, null, 2));
  if (!(await askYesNo("\nWrite this spec and proceed to compose + render?", true))) {
    console.log("Aborted — nothing was written.");
    return;
  }
  writeFileSync(specPath, JSON.stringify(spec, null, 2) + "\n");
  console.log(`Wrote ${specPath}`);

  const nvoTemplateDir = path.join(projectRoot, "nvo-template");
  await run("node", ["scripts/compose.mjs", "--spec", specPath], { cwd: projectRoot });

  try {
    await run("npx", ["hyperframes", "lint", "."], { cwd: nvoTemplateDir });
  } catch (err) {
    console.log(`(lint reported issues — expected for this project's canvas-*.html false-positive; continuing) ${err.message}`);
  }

  let ratioToken = firstRatioToken;
  const formatKey = selectedFormat.key;
  const rendered = [];
  while (true) {
    const label = ratioLabel(ratioToken);
    const outRelFromTemplate = `../output/${slug}_${formatKey}_${ratioToken}.mp4`;
    const outAbs = path.join(projectRoot, "output", `${slug}_${formatKey}_${ratioToken}.mp4`);
    console.log(`\n=== Rendering ${label} ===`);
    await run("npx", ["hyperframes", "render", "-c", `compositions/${slug}/${formatKey}/canvas-${ratioToken}.html`, "-o", outRelFromTemplate], { cwd: nvoTemplateDir });
    console.log(`\nOutput: output/${slug}_${formatKey}_${ratioToken}.mp4`);

    try {
      const duration = probeDuration(outAbs);
      const reviewDir = path.join(os.tmpdir(), "nvo-review", `${slug}-${formatKey}-${ratioToken}`);
      mkdirSync(reviewDir, { recursive: true });
      const points = [
        ["start", Math.max(0.1, duration * 0.05)],
        ["mid", duration * 0.5],
        ["end", Math.min(duration - 0.1, duration * 0.92)],
      ];
      console.log("\nReview frames saved for visual confirmation:");
      for (const [label2, t] of points) {
        const fp = path.join(reviewDir, `frame_${label2}.png`);
        execSync(`ffmpeg -y -loglevel error -ss ${t.toFixed(2)} -i "${outAbs}" -frames:v 1 "${fp}"`);
        console.log(`  ${label2}: ${fp}`);
      }
    } catch (err) {
      console.log(`Could not extract review frames: ${err.message}`);
    }

    rendered.push(ratioToken);
    const remaining = ratioTokens.filter((t) => !rendered.includes(t));
    if (!remaining.length) break;
    const again = await askYesNo(`\nRender another ratio from this same spec? (remaining: ${remaining.map(ratioLabel).join(", ")})`, false);
    if (!again) break;
    const nextLabel = await askChoice("Which ratio?", remaining.map(ratioLabel), ratioLabel(remaining[0]));
    ratioToken = remaining[remaining.map(ratioLabel).indexOf(nextLabel)];
  }
}

main()
  .catch((err) => {
    console.error(`\nFailed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close();
    console.log("\nPlease add music after export.");
  });
