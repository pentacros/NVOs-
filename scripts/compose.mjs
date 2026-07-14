#!/usr/bin/env node
// Fill the templates in nvo-template/templates/ with a per-video content spec,
// computing literal numeric data-start/data-duration offsets (HyperFrames requires
// these as real numbers — see hyperframes docs data-attributes: no variable
// templating on timing, only on content/src/color).
//
// Usage:
//   node scripts/compose.mjs --spec videos/germany.json
//
// IMPORTANT architecture note (found via `hyperframes lint`, see NVO_STYLE_BIBLE.md
// build notes): <video>/<audio> elements are only ever driven by the runtime when
// they're a direct descendant of the actually-rendered top-level composition —
// media placed inside a sub-composition (anything pulled in via
// data-composition-src) renders blank. So background footage and the product-shot
// video are duplicated directly into EACH of the 3 canvas-*.html host files by this
// script; only text/logo/CTA overlay content lives in the shared inner.html
// sub-composition.
//
// Writes: nvo-template/compositions/<campaign>/{inner.html, canvas-9x16.html,
// canvas-1x1.html, canvas-16x9.html} (all root-relative asset paths —
// compositions are served with the project root as their base URL, per
// `hyperframes lint`). The output directory is PER CAMPAIGN (derived from the
// spec's filename, e.g. videos/germany.json -> compositions/germany/) — an
// earlier version wrote everything to one shared nvo-template/compositions/
// directory, so composing a second campaign silently overwrote the first
// campaign's rendered output (found in practice: composing a UK spec clobbered
// Germany's already-composed files with no warning). Never share this
// directory across campaigns again.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const TEMPLATES_DIR = "nvo-template/templates";
const COMPOSITIONS_ROOT = "nvo-template/compositions";

// Column geometry for the 1:1/16:9 pillarbox-blur hosts (NVO_STYLE_BIBLE.md §1.5):
// native 1080x1920 scaled to fit a 1080px-tall canvas -> scale 1080/1920 = 0.5625,
// column width 1080*0.5625 = 607.5, centered horizontally in each canvas.
const COLUMN = { scale: 0.5625, width: 607.5, height: 1080 };
const COLUMN_LEFT = { "canvas-1x1": (1080 - COLUMN.width) / 2, "canvas-16x9": (1920 - COLUMN.width) / 2 };

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) if (argv[i] === "--spec") args.spec = argv[++i];
  if (!args.spec) {
    console.error("Usage: node scripts/compose.mjs --spec videos/<name>.json");
    process.exit(1);
  }
  return args;
}

// data-start must be a literal number — confirmed via `hyperframes lint`
// (overlapping_clips_same_track fired when this used an ID-relative string like
// data-start="shot1"; the installed CLI's own docs also only document data-start
// as a plain "seconds" number, with no ID-relative timing). So every shot's start
// is computed here as a running numeric offset, not a runtime-resolved reference.
// track-index is a sequential decode LANE, not a z-order layer (z-order is CSS-only
// — confirmed via `hyperframes lint`: putting the blur-fill shots and the sharp
// shots both on track 0 in the same file triggered overlapping_clips_same_track,
// since they occupy the same time range). Every simultaneously-playing video
// layer in one file needs its own track index.
function buildShots(shots, { idPrefix = "shot", trackIndex = 0 } = {}) {
  let tags = "";
  let t = 0;
  shots.forEach((shot, i) => {
    const id = `${idPrefix}${i + 1}`;
    tags += `        <video id="${id}" class="clip" data-start="${Number(t.toFixed(2))}" data-duration="${shot.duration}" data-track-index="${trackIndex}" src="${esc(shot.src)}" muted></video>\n`;
    t += shot.duration;
  });
  return tags.trim();
}

// Pads/trims the shot list's total duration to match the text-beat total so the
// background track never runs out mid-video (extends the last shot) or dangles
// far past the last beat (harmless if longer — GSAP timeline length wins at render).
function padShots(shots, totalDuration) {
  const sum = shots.reduce((a, s) => a + s.duration, 0);
  if (sum < totalDuration && shots.length) {
    const last = shots[shots.length - 1];
    last.duration += totalDuration - sum;
  }
  return shots;
}

// Shared by the standalone proof-logos beat AND the merged-into-hook case (see
// buildHook) — real campaigns build the employer/university logo grid up under
// the SAME headline card rather than swapping to an unrelated new beat/frame
// (style bible germany_a Act 1, singapore_b Slide 2), so this renders identical
// markup either place. Returns a self-contained, self-centering block (see
// .logo-grid-wrap in inner.template.html) — the caller just gives it a
// data-start/data-duration wrapper div, no positioning of its own needed.
function renderLogoGrid(logos, idPrefix, fadeStartTime) {
  const cards = logos
    .map((src, i) => `<div class="logo-card" id="${idPrefix}${i + 1}"><img src="${esc(src)}" /></div>`)
    .join("\n            ");
  const html = `<div class="logo-grid-wrap">
        <div class="logo-grid">
            ${cards}
        </div>
      </div>`;
  const tweens = logos.map(
    (_, i) => `tl.to("#${idPrefix}${i + 1}", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, ${fadeStartTime + 0.25 * i});`
  );
  return { html, tweens };
}

// mergedProofBeat is the proof beat object when it's a "logos" proof immediately
// following this hook — in that case the grid renders as a TRAILING SIBLING div
// (own data-start/data-duration, starting right as the hook's own duration ends)
// instead of proof rendering a fully separate, later beat — so the logos visibly
// build up right under the same "Study in Germany" card rather than appearing
// over a disconnected new frame. It's a sibling rather than a nested child so it
// can center itself independently of the hook text's left-aligned column (per
// direct user feedback that the grid should be centered, not left-aligned like
// the body copy above it) — #hook itself still needs its own data-duration
// stretched to cover both beats so the headline/subtitle stay visible throughout.
function buildHook(beat, mergedProofBeat, start) {
  if (!beat) return { html: "", tweens: [], duration: 0 };
  let logoBlockHtml = "";
  let logoTweens = [];
  let onScreenDuration = beat.duration;
  if (mergedProofBeat) {
    onScreenDuration += mergedProofBeat.duration;
    const grid = renderLogoGrid(mergedProofBeat.logos.slice(0, 4), "hlogo", start + beat.duration);
    logoTweens = grid.tweens;
    logoBlockHtml = `
      <div id="hook-logos" class="clip" data-start="${start + beat.duration}" data-duration="${mergedProofBeat.duration}" data-track-index="2">
        ${grid.html}
      </div>`;
  }
  const html = `
      <div id="hook" class="safe-col clip" data-start="${start}" data-duration="${onScreenDuration}" data-track-index="1">
        <div class="line">${esc(beat.lead)}</div>
        <div class="line hero-word">${esc(beat.hero)}</div>
        ${beat.subtitle ? `<div class="subtitle-badge" id="hook-subtitle">${esc(beat.subtitle)}</div>` : ""}
      </div>${logoBlockHtml}`;
  const tweens = [
    `tl.from("#hook .line", { opacity: 0, duration: 0.4, stagger: 0.25 }, ${start + 0.1});`,
    ...logoTweens,
  ];
  if (beat.subtitle) {
    tweens.push(
      `tl.fromTo("#hook-subtitle", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, ${start + 1.1});`
    );
  }
  return { html, tweens, duration: beat.duration };
}

// opts.skipMarkup is set when this proof beat's "logos" content was already
// rendered inline by buildHook (see mergeLogosIntoHook in main()) — the beat
// still needs to report its duration so downstream beat start times stay
// correct, it just doesn't render a second, separate div for the same content.
function buildProof(beat, start, { skipMarkup = false } = {}) {
  if (!beat) return { html: "", tweens: [], duration: 0 };
  if (skipMarkup) return { html: "", tweens: [], duration: beat.duration };
  if (beat.mode === "logos") {
    const grid = renderLogoGrid(beat.logos.slice(0, 4), "logo", start);
    const html = `
      <div id="proof-logos" class="clip" data-start="${start}" data-duration="${beat.duration}" data-track-index="1">
        ${grid.html}
      </div>`;
    return { html, tweens: grid.tweens, duration: beat.duration };
  }
  if (beat.mode === "bullets") {
    const bullets = beat.bullets.slice(0, 5);
    const rows = bullets
      .map((text, i) => `<div class="bullet" id="bullet${i + 1}"><span class="dot"></span>${esc(text)}</div>`)
      .join("\n        ");
    const html = `
      <div id="proof-bullets" class="safe-col clip" data-start="${start}" data-duration="${beat.duration}" data-track-index="1">
        ${rows}
      </div>`;
    const tweens = bullets.map(
      (_, i) => `tl.to("#bullet${i + 1}", { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, ${start + 0.5 * i});`
    );
    return { html, tweens, duration: beat.duration };
  }
  throw new Error(`Unknown proof beat mode: ${beat.mode} (expected "logos" or "bullets")`);
}

// mergedCtaBeat is the CTA beat object when it directly follows this checklist
// with no product shot in between — in that case the CTA pill renders as a
// TRAILING SIBLING div (own data-start/data-duration, true-frame-centered via
// #cta-wrap — see inner.template.html) instead of a fully separate later beat,
// extending #checklist's own on-screen data-duration to cover both so the bullet
// items stay visible while the CTA appears/holds underneath. It's a sibling
// rather than a nested child for the same reason as the merged logo grid in
// buildHook: centering true-to-frame only works cleanly outside the checklist's
// left-inset safe-col box.
function buildChecklist(beat, mergedCtaBeat, start) {
  if (!beat) return { html: "", tweens: [], duration: 0 };
  const items = beat.items.slice(0, 3);
  const rows = items
    .map(
      (text, i) =>
        `<div class="item" id="check${i + 1}"><span class="bullet-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#0b1a3a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 9 17 20 6"></polyline></svg></span>${esc(text)}</div>`
    )
    .join("\n        ");
  const itemTweens = items.map(
    (_, i) => `tl.to("#check${i + 1}", { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, ${start + 0.6 * i});`
  );

  let ctaBlockHtml = "";
  let ctaTweens = [];
  let onScreenDuration = beat.duration;
  if (mergedCtaBeat) {
    onScreenDuration += mergedCtaBeat.duration;
    const ctaStart = start + beat.duration;
    ctaBlockHtml = `
      <div id="cta-wrap" class="clip" data-start="${ctaStart}" data-duration="${mergedCtaBeat.duration}" data-track-index="3">
        <div class="cta-pill" id="cta">${esc(mergedCtaBeat.lead)} <span class="accent">${esc(mergedCtaBeat.accent)}</span></div>
      </div>`;
    ctaTweens = [
      `tl.fromTo("#cta", { opacity: 0, scale: 0.85, filter: "blur(6px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "back.out(1.7)" }, ${ctaStart});`,
    ];
  }

  const html = `
      <div id="checklist" class="safe-col clip" data-start="${start}" data-duration="${onScreenDuration}" data-track-index="1">
        <div class="heading">${esc(beat.heading ?? "Get:")}</div>
        ${rows}
      </div>${ctaBlockHtml}`;
  return { html, tweens: [...itemTweens, ...ctaTweens], duration: beat.duration };
}

// Product-shot duration only (no overlay markup — see architecture note at top of
// file). The actual <video> tag is built per-host by buildProductShotVideoTag().
function productShotDuration(beat) {
  return beat ? beat.duration : 0;
}

// Builds the product-shot <video> as a direct child of a host's own bg wrapper —
// never inside the shared overlay sub-composition. Needs its own track-index
// distinct from whichever shots track it time-overlaps with (see buildShots note).
function buildProductShotVideoTag(beat, start, { id = "productshot", trackIndex = 1 } = {}) {
  if (!beat) return "";
  return `<video id="${id}" class="clip" data-start="${start}" data-duration="${beat.duration}" data-track-index="${trackIndex}" src="${esc(beat.src)}" muted></video>`;
}

// opts.skipMarkup is set when this CTA was already rendered inline by
// buildChecklist (see mergeCtaIntoChecklist in main()) — still returns its
// duration so the overall timeline total stays correct.
function buildCta(beat, start, { skipMarkup = false } = {}) {
  if (!beat) throw new Error("A CTA beat is required (every NVO ends with one — see style bible §2/§6).");
  if (skipMarkup) return { html: "", tweens: [], duration: beat.duration };
  const html = `
      <div id="cta-wrap" class="clip" data-start="${start}" data-duration="${beat.duration}" data-track-index="1">
        <div class="cta-pill" id="cta">${esc(beat.lead)} <span class="accent">${esc(beat.accent)}</span></div>
      </div>`;
  const tweens = [
    `tl.fromTo("#cta", { opacity: 0, scale: 0.85, filter: "blur(6px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "back.out(1.7)" }, ${start});`,
  ];
  return { html, tweens, duration: beat.duration };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const spec = JSON.parse(readFileSync(args.spec, "utf-8"));

  // Campaign slug comes from the spec's own filename (videos/germany.json ->
  // "germany") — this is what scopes both the composition output dir below and
  // (by convention, not enforced here) the campaign's asset folder
  // nvo-template/assets/<slug>/ that its shots/logos already live in.
  const slug = path.basename(args.spec, ".json");
  const OUT_DIR = `${COMPOSITIONS_ROOT}/${slug}`;
  mkdirSync(OUT_DIR, { recursive: true });

  // See buildHook/buildChecklist docblocks — these two merges are what make the
  // logo grid feel like part of the hook card, and the CTA feel like part of the
  // checklist card, instead of each popping up as an unrelated new frame.
  const mergeLogosIntoHook = !!(spec.beats.hook && spec.beats.proof && spec.beats.proof.mode === "logos");
  const mergeCtaIntoChecklist = !!(spec.beats.checklist && spec.beats.cta && !spec.beats.productShot);

  let t = 0;
  const hook = buildHook(spec.beats.hook, mergeLogosIntoHook ? spec.beats.proof : null, t);
  t += hook.duration;
  const proof = buildProof(spec.beats.proof, t, { skipMarkup: mergeLogosIntoHook });
  t += proof.duration;
  const checklist = buildChecklist(spec.beats.checklist, mergeCtaIntoChecklist ? spec.beats.cta : null, t);
  t += checklist.duration;
  const productShotStart = t;
  t += productShotDuration(spec.beats.productShot);
  const cta = buildCta(spec.beats.cta, t, { skipMarkup: mergeCtaIntoChecklist });
  t += cta.duration;

  const totalDuration = Number(t.toFixed(2));
  const shots = padShots(spec.shots, totalDuration);
  // Distinct track indices per simultaneously-playing layer within one file (see
  // buildShots note: track-index is a decode lane, not a z-order — two videos
  // overlapping in time need different tracks even if one is only ever meant to
  // render behind the other via CSS z-index).
  const sharpProductShotTag = buildProductShotVideoTag(spec.beats.productShot, productShotStart, {
    id: "productshot",
    trackIndex: 1,
  });
  const blurProductShotTag = buildProductShotVideoTag(spec.beats.productShot, productShotStart, {
    id: "productshot-blur",
    trackIndex: 3,
  });

  const allTweens = [...hook.tweens, ...proof.tweens, ...checklist.tweens, ...cta.tweens];

  // ---- overlay (text/logo/CTA only, no media — see architecture note at top) ----
  const overlayTemplate = readFileSync(`${TEMPLATES_DIR}/inner.template.html`, "utf-8");
  const overlayOut = overlayTemplate
    .replace("{{PILL_COLOR|#1E3FE0}}", spec.pillColor ?? "#1E3FE0")
    .replace(/{{TOTAL_DURATION}}/g, totalDuration)
    .replace("{{HOOK_BLOCK}}", hook.html)
    .replace("{{PROOF_BLOCK}}", proof.html)
    .replace("{{CHECKLIST_BLOCK}}", checklist.html)
    .replace("{{CTA_BLOCK}}", cta.html)
    .replace("{{GSAP_TIMELINE_BODY}}", allTweens.join("\n      "));
  writeFileSync(`${OUT_DIR}/inner.html`, overlayOut);

  // ---- 3 aspect-ratio hosts: each gets its own copy of the background media ----
  const hostSpecs = ["canvas-9x16", "canvas-1x1", "canvas-16x9"];
  for (const name of hostSpecs) {
    const hostTemplate = readFileSync(`${TEMPLATES_DIR}/${name}.template.html`, "utf-8");
    let hostOut = hostTemplate
      .replace(/{{TOTAL_DURATION}}/g, totalDuration)
      // In-HTML reference, NOT a filesystem path: data-composition-src is
      // resolved relative to nvo-template/ itself (HyperFrames' own project
      // root), so this must NOT include the "nvo-template/" prefix that
      // OUT_DIR needs for the actual writeFileSync calls below (compose.mjs
      // runs from the outer repo root, one level above nvo-template/) — found
      // by rendering and getting "the file does not exist" for a path that
      // very much existed, just doubly-prefixed.
      .replace("{{COMPOSITION_DIR}}", `compositions/${slug}`);
    hostOut = hostOut
      .replace("{{SHOT_VIDEO_TAGS_SHARP}}", buildShots(shots, { idPrefix: "shot", trackIndex: 0 }))
      .replace("{{PRODUCT_SHOT_TAG_SHARP}}", sharpProductShotTag);
    if (name !== "canvas-9x16") {
      hostOut = hostOut
        .replace("{{SHOT_VIDEO_TAGS_BLUR}}", buildShots(shots, { idPrefix: "bgblur", trackIndex: 2 }))
        .replace("{{PRODUCT_SHOT_TAG_BLUR}}", blurProductShotTag);
    }
    writeFileSync(`${OUT_DIR}/${name}.html`, hostOut);
  }

  console.log(`Composed ${OUT_DIR}/inner.html — total duration ${totalDuration}s`);
  console.log(
    `Beats: hook=${hook.duration}s proof=${proof.duration}s checklist=${checklist.duration}s productShot=${productShotDuration(spec.beats.productShot)}s cta=${cta.duration}s`
  );
  console.log(`Merged: logosIntoHook=${mergeLogosIntoHook} ctaIntoChecklist=${mergeCtaIntoChecklist}`);
  console.log(`Shots: ${shots.length}, summing to ${shots.reduce((a, s) => a + s.duration, 0).toFixed(2)}s`);
  console.log(`Rendered hosts: ${hostSpecs.map((n) => `${OUT_DIR}/${n}.html`).join(", ")}`);
}

main();
