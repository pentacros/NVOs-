#!/usr/bin/env node
// Interactive entry point for generating one NVO — the only thing a user should
// need to run. Wraps scripts/compose.mjs and `hyperframes render` so nobody has
// to touch either directly. Scope is deliberately just "spec intake -> compose ->
// render -> visual sanity check" — footage sourcing/scoring (pexels_search.mjs /
// gemini_score.mjs) and environment setup (.env, node version) are out of scope;
// this assumes those are already done, per the project's own SKILL.md phases.
//
// Usage:
//   npm run create
//
// Every field asked below maps 1:1 to what scripts/compose.mjs actually reads
// (spec.pillColor, spec.shots[], spec.beats.{hook,proof,checklist,productShot,cta})
// — checked against videos/germany.json and compose.mjs before writing this, not
// guessed. There is no persistent country-logo field (style bible §7 decision #1,
// reversed) and no Gemini step for copy/script text — gemini_score.mjs only ever
// scores footage clips, never copy, so that conditional step from the original
// ask doesn't apply to this pipeline as it stands.

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

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });

// NOT built on rl.question() — its internal callback races against input that
// arrives faster than each question is asked (e.g. a fully-buffered piped file,
// or a human pasting several lines at once): any 'line' event that fires before
// the NEXT question() call has registered its one-shot listener is silently
// dropped, and the process then exits with an unresolved dangling promise and
// no error (found by testing this end to end with piped answers — the wizard
// stopped after exactly one question with no error message). A manual queue
// captures every line the moment it arrives regardless of timing, so nothing
// asked later than it's produced ever gets lost.
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
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
  )
    .toString()
    .trim();
  return Math.round(parseFloat(out) * 100) / 100;
}

// Source of truth for supported ratios is the templates dir (always present in
// git), not compositions/ (regenerated output that may not exist yet on a fresh
// checkout that's never run compose) — per the ask to check what actually exists
// rather than guessing a hardcoded list.
function discoverRatioTokens() {
  return readdirSync("nvo-template/templates")
    .map((f) => f.match(/^canvas-(.+)\.template\.html$/))
    .filter(Boolean)
    .map((m) => m[1]); // e.g. "9x16", "1x1", "16x9"
}

function ratioLabel(token) {
  return token.replace("x", ":");
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

  let folder = await ask(
    "Footage folder (containing the trimmed clips to use as shots)",
    defaultFolder ?? undefined
  );
  while (!folder || !existsSync(folder)) {
    console.log(`Path not found: "${folder}"`);
    folder = await ask("Try again");
  }

  let mp4s = readdirSync(folder)
    .filter((f) => f.toLowerCase().endsWith(".mp4"))
    .sort();
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

  // Spec shot paths must resolve relative to nvo-template/ (compose.mjs
  // architecture note) — normalize everything into nvo-template/assets/<slug>/
  // first so the written src paths are always valid, whether the clips came
  // from there already or from a sibling footage/<slug>/ raw-candidates folder.
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

async function collectProof(slug, existingSpec) {
  if (existingSpec?.beats?.proof) {
    console.log("\nExisting proof beat:", JSON.stringify(existingSpec.beats.proof, null, 2));
    if (await askYesNo("Keep this proof beat as-is?", true)) return existingSpec.beats.proof;
  }

  const mode = await askChoice(
    "\nProof beat — partner logos, USP bullets, or skip this beat?",
    ["logos", "bullets", "skip"],
    "logos"
  );
  if (mode === "skip") return null;

  const duration = await askNumber("Proof beat duration (seconds)", 4.5);

  if (mode === "bullets") {
    console.log("Enter up to 5 USP/stat bullets, one per line. Blank line to finish.");
    const bullets = [];
    while (bullets.length < 5) {
      const line = await ask(`Bullet ${bullets.length + 1} (blank to finish)`);
      if (!line) break;
      bullets.push(line);
    }
    return { mode: "bullets", duration, bullets };
  }

  // Scoped to THIS campaign's own asset folder (nvo-template/assets/<slug>/,
  // same place its shots live) — never a shared cross-campaign logos/ pool.
  // An earlier version scanned one global nvo-template/assets/logos/ folder,
  // which mixed every campaign's logos together (found in practice: a second
  // campaign's university logos ended up alongside an earlier campaign's
  // employer logos in the same picker list).
  const campaignDir = `nvo-template/assets/${slug}`;
  mkdirSync(campaignDir, { recursive: true });
  const available = readdirSync(campaignDir).filter((f) => /\.(png|jpe?g|svg)$/i.test(f));
  let logos = [];
  if (available.length) {
    console.log(`Logos already in ${campaignDir}/:`);
    available.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    const raw = await ask("Comma-separated numbers to use (up to 4, blank to add new ones instead)");
    const idxs = raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10) - 1)
      .filter((i) => i >= 0 && i < available.length);
    logos = idxs.slice(0, 4).map((i) => `assets/${slug}/${available[i]}`);
  }
  if (logos.length < 4) {
    console.log(
      "Add logo file(s) — give the path to wherever the file already is on disk (Desktop, Downloads, anywhere); it'll be copied into this campaign's own asset folder automatically. Blank to stop."
    );
    while (logos.length < 4) {
      const p = await ask(`Logo source path ${logos.length + 1}`);
      if (!p) break;
      if (!existsSync(p)) {
        console.log(`Not found: ${p}`);
        continue;
      }
      const filename = path.basename(p);
      const dest = path.join(campaignDir, filename);
      if (path.resolve(p) !== path.resolve(dest)) copyFileSync(p, dest);
      logos.push(`assets/${slug}/${filename}`);
    }
  }
  return { mode: "logos", duration, logos };
}

async function main() {
  console.log("=== NVO Generator — create a video ===\n");

  const rawName = await ask("Campaign/market name (e.g. germany)");
  const slug = rawName.toLowerCase().replace(/\s+/g, "_");
  if (!slug) {
    console.log("A campaign name is required.");
    process.exit(1);
  }
  const specPath = `videos/${slug}.json`;

  let existingSpec = null;
  if (existsSync(specPath)) {
    const choice = await askChoice(`Spec for "${slug}" already exists — edit it or start fresh?`, ["edit", "fresh"], "edit");
    if (choice === "edit") existingSpec = JSON.parse(readFileSync(specPath, "utf-8"));
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

  const shots = await collectShots(slug, existingSpec);
  const proof = await collectProof(slug, existingSpec);

  console.log("\n--- Hook (required) ---");
  const hookLead = await ask("Hook lead line (e.g. 'Study in')", existingSpec?.beats?.hook?.lead ?? "Study in");
  const hookHero = await ask("Hero word — the country/degree name", existingSpec?.beats?.hook?.hero ?? rawName);
  const hookSubtitle = await ask(
    "Fast-fact subtitle (optional, blank to skip)",
    existingSpec?.beats?.hook?.subtitle ?? ""
  );
  const hookDuration = await askNumber("Hook duration (seconds)", existingSpec?.beats?.hook?.duration ?? 3.5);

  console.log("\n--- Benefits checklist (optional) ---");
  const wantChecklist = await askYesNo(
    "Include the 'Admit Eligibility / Top Jobs After Graduation / Expenses & Earnings' checklist?",
    !!existingSpec?.beats?.checklist
  );
  let checklist = null;
  if (wantChecklist) {
    const heading = await ask("Checklist heading", existingSpec?.beats?.checklist?.heading ?? "Get:");
    const useDefaultItems = await askYesNo(
      "Use the default 3 items (Admit Eligibility / Top Jobs After Graduation / Expenses & Earnings)?",
      true
    );
    let items;
    if (useDefaultItems) {
      items = existingSpec?.beats?.checklist?.items ?? [
        "Admit Eligibility",
        "Top Jobs After Graduation",
        "Expenses & Earnings",
      ];
    } else {
      items = [];
      for (let i = 0; i < 3; i++) items.push(await ask(`Checklist item ${i + 1}`));
    }
    const duration = await askNumber("Checklist duration (seconds)", existingSpec?.beats?.checklist?.duration ?? 4);
    checklist = { heading, items, duration };
  }

  console.log("\n--- Product shot (optional) ---");
  const wantProductShot = await askYesNo(
    "Include an app screen-recording product shot?",
    !!existingSpec?.beats?.productShot
  );
  let productShot = null;
  if (wantProductShot) {
    let src = await ask("Product shot video file path", existingSpec?.beats?.productShot?.src);
    while (!src || !existsSync(src)) {
      console.log(`Not found: "${src}"`);
      src = await ask("Try again");
    }
    const duration = await askNumber("Product shot duration (seconds)", existingSpec?.beats?.productShot?.duration ?? 4);
    productShot = { src, duration };
  }

  console.log("\n--- CTA (required) ---");
  const ctaLead = await ask("CTA lead text (e.g. 'Check')", existingSpec?.beats?.cta?.lead ?? "Check");
  const ctaAccent = await ask("CTA accent phrase (e.g. 'Eligibility')", existingSpec?.beats?.cta?.accent ?? "Eligibility");
  const ctaDuration = await askNumber("CTA duration (seconds)", existingSpec?.beats?.cta?.duration ?? 3);

  const pillColor = await ask("Pill/accent color (hex)", existingSpec?.pillColor ?? "#1E3FE0");

  const spec = {
    pillColor,
    shots,
    beats: {
      hook: { duration: hookDuration, lead: hookLead, hero: hookHero, ...(hookSubtitle ? { subtitle: hookSubtitle } : {}) },
      ...(proof ? { proof } : {}),
      ...(checklist ? { checklist } : {}),
      ...(productShot ? { productShot } : {}),
      cta: { duration: ctaDuration, lead: ctaLead, accent: ctaAccent },
    },
  };

  console.log(`\n--- Spec to write to ${specPath} ---`);
  console.log(JSON.stringify(spec, null, 2));
  if (!(await askYesNo("\nWrite this spec and proceed to compose + render?", true))) {
    console.log("Aborted — nothing was written.");
    return;
  }
  writeFileSync(specPath, JSON.stringify(spec, null, 2) + "\n");
  console.log(`Wrote ${specPath}`);

  const projectRoot = process.cwd();
  const nvoTemplateDir = path.join(projectRoot, "nvo-template");

  await run("node", ["scripts/compose.mjs", "--spec", specPath], { cwd: projectRoot });

  // Lint is informational here, not a gate — this project's own canvas-*.html
  // hosts trigger a known, documented false-positive (media_in_subcomposition)
  // every time (see SKILL.md), so a non-zero lint exit code does not mean the
  // render will actually fail.
  try {
    await run("npx", ["hyperframes", "lint", "."], { cwd: nvoTemplateDir });
  } catch (err) {
    console.log(`(lint reported issues — expected for this project's canvas-*.html false-positive; continuing) ${err.message}`);
  }

  let ratioToken = firstRatioToken;
  const rendered = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const label = ratioLabel(ratioToken);
    const outRelFromTemplate = `../output/${slug}_${ratioToken}.mp4`;
    const outAbs = path.join(projectRoot, "output", `${slug}_${ratioToken}.mp4`);
    console.log(`\n=== Rendering ${label} ===`);
    await run(
      "npx",
      ["hyperframes", "render", "-c", `compositions/${slug}/canvas-${ratioToken}.html`, "-o", outRelFromTemplate],
      { cwd: nvoTemplateDir }
    );
    console.log(`\nOutput: output/${slug}_${ratioToken}.mp4`);

    // Mechanical half of the visual check: extract start/mid/end frames and
    // print exactly where they are. Actually LOOKING at them requires a vision-
    // capable agent (e.g. Claude Code driving this script) using its Read tool
    // on the printed paths — a plain Node script cannot judge its own frames.
    try {
      const duration = probeDuration(outAbs);
      const reviewDir = path.join(os.tmpdir(), "nvo-review", `${slug}-${ratioToken}`);
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
      console.log(
        "(If an agent session is driving this, it should open each frame above with its image-reading tool now and confirm logo/text placement, aspect ratio, and no rendering glitches before calling this done.)"
      );
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
    // Standing reminder — the pipeline doesn't handle music yet, so this prints
    // every time this script runs, success or failure, per explicit instruction.
    console.log("\nPlease add music after export.");
  });
