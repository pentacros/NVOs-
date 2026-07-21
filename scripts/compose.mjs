#!/usr/bin/env node
// Compose a format-driven NVO spec into HyperFrames HTML compositions.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { getFormatByKey } from "./formatCatalog.mjs";

const TEMPLATES_DIR = "nvo-template/templates";
const COMPOSITIONS_ROOT = "nvo-template/compositions";

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

function padShots(shots, totalDuration) {
  const sum = shots.reduce((a, s) => a + s.duration, 0);
  if (sum < totalDuration && shots.length) {
    const last = shots[shots.length - 1];
    last.duration += totalDuration - sum;
  }
  return shots;
}

function renderLogoGrid(logos, idPrefix, fadeStartTime) {
  const cards = logos.map((src, i) => `<div class="logo-card" id="${idPrefix}${i + 1}"><img src="${esc(src)}" /></div>`).join("\n            ");
  const html = `<div class="logo-grid-wrap">\n        <div class="logo-grid">\n            ${cards}\n        </div>\n      </div>`;
  const tweens = logos.map((_, i) => `tl.to("#${idPrefix}${i + 1}", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, ${fadeStartTime + 0.25 * i});`);
  return { html, tweens };
}

function buildHook(beat, mergedProofBeat, start) {
  if (!beat) return { html: "", tweens: [], duration: 0 };
  let logoBlockHtml = "";
  let logoTweens = [];
  let onScreenDuration = beat.duration;
  if (mergedProofBeat) {
    onScreenDuration += mergedProofBeat.duration;
    const grid = renderLogoGrid(mergedProofBeat.logos.slice(0, 4), "hlogo", start + beat.duration);
    logoTweens = grid.tweens;
    logoBlockHtml = `\n      <div id="hook-logos" class="clip" data-start="${start + beat.duration}" data-duration="${mergedProofBeat.duration}" data-track-index="2">\n        ${grid.html}\n      </div>`;
  }
  const html = `\n      <div id="hook" class="safe-col clip" data-start="${start}" data-duration="${onScreenDuration}" data-track-index="1">\n        <div class="line">${esc(beat.lead)}</div>\n        <div class="line hero-word">${esc(beat.hero)}</div>\n        ${beat.subtitle ? `<div class="subtitle-badge" id="hook-subtitle">${esc(beat.subtitle)}</div>` : ""}\n      </div>${logoBlockHtml}`;
  const tweens = [`tl.from("#hook .line", { opacity: 0, duration: 0.4, stagger: 0.25 }, ${start + 0.1});`, ...logoTweens];
  if (beat.subtitle) {
    tweens.push(`tl.fromTo("#hook-subtitle", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, ${start + 1.1});`);
  }
  return { html, tweens, duration: beat.duration };
}

function buildProof(beat, start, { skipMarkup = false, idPrefix = "proof", cap = 5, trackIndex = 1, blockClass = "proof-block" } = {}) {
  if (!beat || beat.mode === "none") return { html: "", tweens: [], duration: 0 };
  if (skipMarkup) return { html: "", tweens: [], duration: beat.duration };

  if (beat.mode === "logos") {
    const grid = renderLogoGrid(beat.logos.slice(0, cap), `${idPrefix}logo`, start);
    const html = `\n      <div id="${idPrefix}-logos" class="${blockClass} clip" data-start="${start}" data-duration="${beat.duration}" data-track-index="${trackIndex}">\n        ${grid.html}\n      </div>`;
    return { html, tweens: grid.tweens, duration: beat.duration };
  }

  if (beat.mode === "bullets") {
    const bullets = beat.bullets.slice(0, cap);
    const rows = bullets.map((text, i) => `<div class="bullet" id="${idPrefix}bullet${i + 1}"><span class="dot"></span>${esc(text)}</div>`).join("\n        ");
    const html = `\n      <div id="${idPrefix}-bullets" class="safe-col ${blockClass} clip" data-start="${start}" data-duration="${beat.duration}" data-track-index="${trackIndex}">\n        ${rows}\n      </div>`;
    const tweens = bullets.map((_, i) => `tl.to("#${idPrefix}bullet${i + 1}", { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, ${start + 0.5 * i});`);
    return { html, tweens, duration: beat.duration };
  }

  if (beat.mode === "numberedBadges") {
    const badges = beat.items.slice(0, cap);
    const rows = badges.map((text, i) => `<div class="numbered-badge" id="${idPrefix}badge${i + 1}"><span class="badge-number">#${i + 1}</span>${esc(text)}</div>`).join("\n        ");
    const html = `\n      <div id="${idPrefix}-badges" class="safe-col ${blockClass} clip" data-start="${start}" data-duration="${beat.duration}" data-track-index="${trackIndex}">\n        ${rows}\n      </div>`;
    const tweens = badges.map((_, i) => `tl.to("#${idPrefix}badge${i + 1}", { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, ${start + 0.5 * i});`);
    return { html, tweens, duration: beat.duration };
  }

  if (beat.mode === "cumulativePills") {
    const items = beat.items.slice(0, cap);
    const rows = items.map((text, i) => `<div class="cumulative-pill${i === 0 ? " cumulative-pill--accent" : ""}" id="${idPrefix}pill${i + 1}">${esc(text)}</div>`).join("\n        ");
    const html = `\n      <div id="${idPrefix}-pills" class="safe-col ${blockClass} clip" data-start="${start}" data-duration="${beat.duration}" data-track-index="${trackIndex}">\n        ${rows}\n      </div>`;
    const tweens = items.map((_, i) => `tl.to("#${idPrefix}pill${i + 1}", { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, ${start + 0.35 * i});`);
    return { html, tweens, duration: beat.duration };
  }

  throw new Error(`Unknown proof beat mode: ${beat.mode} (expected "logos", "bullets", "numberedBadges", or "cumulativePills")`);
}

function buildChecklist(beat, mergedCtaBeat, start, { style = "check" } = {}) {
  if (!beat) return { html: "", tweens: [], duration: 0 };
  const items = beat.items.slice(0, 3);

  const markFor = (i) => {
    if (style === "numbered") return `<span class="check-mark check-mark--numbered">${i + 1}</span>`;
    if (style === "toggle") return `<span class="check-toggle" id="check${i + 1}-toggle"><span class="check-toggle-knob"></span></span>`;
    return `<span class="check-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#0b1a3a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 9 17 20 6"></polyline></svg></span>`;
  };
  const rowClass = style === "toggle" ? "item item--toggle" : "item";
  const rows = items
    .map((text, i) => (style === "toggle"
      ? `<div class="${rowClass}" id="check${i + 1}"><span class="check-label">${esc(text)}</span>${markFor(i)}</div>`
      : `<div class="${rowClass}" id="check${i + 1}">${markFor(i)}${esc(text)}</div>`))
    .join("\n        ");
  const itemTweens = items.map((_, i) => `tl.to("#check${i + 1}", { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, ${start + 0.6 * i});`);
  const toggleTweens = style === "toggle"
    ? items.map((_, i) => `tl.to("#check${i + 1}-toggle", { backgroundColor: "var(--nvo-pill)", duration: 0.2 }, ${start + 0.6 * i + 0.45}); tl.to("#check${i + 1}-toggle .check-toggle-knob", { x: 22, duration: 0.2 }, ${start + 0.6 * i + 0.45});`)
    : [];

  let ctaBlockHtml = "";
  let ctaTweens = [];
  let onScreenDuration = beat.duration;
  if (mergedCtaBeat) {
    onScreenDuration += mergedCtaBeat.duration;
    const ctaStart = start + beat.duration;
    ctaBlockHtml = `\n      <div id="cta-wrap" class="clip" data-start="${ctaStart}" data-duration="${mergedCtaBeat.duration}" data-track-index="3">\n        <div class="cta-pill" id="cta">${esc(mergedCtaBeat.lead)} <span class="accent">${esc(mergedCtaBeat.accent)}</span></div>\n      </div>`;
    ctaTweens = [`tl.fromTo("#cta", { opacity: 0, scale: 0.85, filter: "blur(6px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "back.out(1.7)" }, ${ctaStart});`];
  }

  const html = `\n      <div id="checklist" class="safe-col clip" data-start="${start}" data-duration="${onScreenDuration}" data-track-index="1">\n        <div class="heading">${esc(beat.heading ?? "Get:")}</div>\n        ${rows}\n      </div>${ctaBlockHtml}`;
  return { html, tweens: [...itemTweens, ...toggleTweens, ...ctaTweens], duration: beat.duration };
}

function productShotDuration(beat) {
  return beat ? beat.duration : 0;
}

function buildProductShotVideoTag(beat, start, { id = "productshot", trackIndex = 1 } = {}) {
  if (!beat) return "";
  return `<video id="${id}" class="clip" data-start="${start}" data-duration="${beat.duration}" data-track-index="${trackIndex}" src="${esc(beat.src)}" muted></video>`;
}

function buildCta(beat, start, { skipMarkup = false, style = "pop" } = {}) {
  if (!beat) throw new Error("A CTA beat is required.");
  if (skipMarkup) return { html: "", tweens: [], duration: beat.duration };
  const ctaClass = style === "allCaps" ? "cta-pill cta-pill--allcaps" : "cta-pill";
  const iconHtml = style === "iconPhone" ? `<span class="cta-icon">☎</span>` : "";
  const html = `\n      <div id="cta-wrap" class="clip" data-start="${start}" data-duration="${beat.duration}" data-track-index="1">\n        <div class="${ctaClass}" id="cta">${iconHtml}${esc(beat.lead)} <span class="accent">${esc(beat.accent)}</span></div>\n      </div>`;

  const tweens = [];
  if (style === "slideWipe") {
    tweens.push(`tl.fromTo("#cta", { opacity: 0, x: -60, filter: "blur(10px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.25, ease: "power3.out" }, ${start});`);
  } else {
    tweens.push(`tl.fromTo("#cta", { opacity: 0, scale: 0.85, filter: "blur(6px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "back.out(1.7)" }, ${start});`);
  }
  if (style === "fadeInOut") {
    const fadeOutStart = start + Math.max(beat.duration - 0.35, 0);
    tweens.push(`tl.to("#cta", { opacity: 0, duration: 0.3, ease: "power1.in" }, ${fadeOutStart});`);
  }
  return { html, tweens, duration: beat.duration };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const spec = JSON.parse(readFileSync(args.spec, "utf-8"));
  const slug = path.basename(args.spec, ".json");
  const format = getFormatByKey(spec.format ?? "genericnvo1") ?? getFormatByKey("genericnvo1");
  const formatKey = format?.key ?? "genericnvo1";
  const shape = format?.contentShape ?? {};
  if (shape.productShot === "required" && !spec.beats.productShot) {
    throw new Error(`Format "${formatKey}" requires a productShot beat (its source format always includes a full-screen app/product demo) — add spec.beats.productShot with this campaign's own screen recording.`);
  }
  if (shape.productShot === "unsupported" && spec.beats.productShot) {
    throw new Error(`Format "${formatKey}" does not use a productShot beat — remove spec.beats.productShot or switch formats.`);
  }

  const OUT_DIR = `${COMPOSITIONS_ROOT}/${slug}/${formatKey}`;
  mkdirSync(OUT_DIR, { recursive: true });

  const mergeLogosIntoHook = !!(spec.beats.hook && spec.beats.proof && spec.beats.proof.mode === "logos" && (format?.mergeLogosIntoHook ?? true));
  const mergeCtaIntoChecklist = !!(spec.beats.checklist && spec.beats.cta && !spec.beats.productShot && (format?.mergeCtaIntoChecklist ?? true));
  const checklistStyle = shape.checklist?.style ?? "check";
  const ctaStyle = shape.cta?.style ?? "pop";
  const proofCap = shape.proof?.count ?? 5;
  const secondaryProofCap = shape.secondaryProof?.count ?? 5;

  let t = 0;
  const hook = buildHook(spec.beats.hook, mergeLogosIntoHook ? spec.beats.proof : null, t);
  t += hook.duration;
  const proof = buildProof(spec.beats.proof, t, { skipMarkup: mergeLogosIntoHook, idPrefix: "proof", cap: proofCap, trackIndex: 1, blockClass: "proof-block" });
  t += proof.duration;
  const secondaryProof = buildProof(spec.beats.secondaryProof, t, { idPrefix: "secondary", cap: secondaryProofCap, trackIndex: 4, blockClass: "secondary-block" });
  t += secondaryProof.duration;
  const checklist = buildChecklist(spec.beats.checklist, mergeCtaIntoChecklist ? spec.beats.cta : null, t, { style: checklistStyle });
  t += checklist.duration;
  const productShotStart = t;
  t += productShotDuration(spec.beats.productShot);
  const cta = buildCta(spec.beats.cta, t, { skipMarkup: mergeCtaIntoChecklist, style: ctaStyle });
  t += cta.duration;

  const totalDuration = Number(t.toFixed(2));
  const shots = padShots(spec.shots, totalDuration);
  const sharpProductShotTag = buildProductShotVideoTag(spec.beats.productShot, productShotStart, { id: "productshot", trackIndex: 1 });
  const blurProductShotTag = buildProductShotVideoTag(spec.beats.productShot, productShotStart, { id: "productshot-blur", trackIndex: 3 });
  const allTweens = [...hook.tweens, ...proof.tweens, ...secondaryProof.tweens, ...checklist.tweens, ...cta.tweens];

  const overlayTemplatePath = existsSync(`nvo-template/formats/${formatKey}/inner.template.html`) ? `nvo-template/formats/${formatKey}/inner.template.html` : `${TEMPLATES_DIR}/inner.template.html`;
  const overlayTemplate = readFileSync(overlayTemplatePath, "utf-8");
  const overlayOut = overlayTemplate
    .replace("{{PILL_COLOR|#1E3FE0}}", spec.pillColor ?? format?.pill ?? "#1E3FE0")
    .replace(/{{ACCENT_COLOR}}/g, format?.accent ?? "#ffd54a")
    .replace(/{{SECONDARY_COLOR}}/g, format?.secondary ?? "#c6ff3d")
    .replace(/{{FORMAT_NAME}}/g, format?.name ?? formatKey)
    .replace(/{{TOTAL_DURATION}}/g, totalDuration)
    .replace("{{HOOK_BLOCK}}", hook.html)
    .replace("{{PROOF_BLOCK}}", proof.html)
    .replace("{{SECONDARY_PROOF_BLOCK}}", secondaryProof.html)
    .replace("{{CHECKLIST_BLOCK}}", checklist.html)
    .replace("{{CTA_BLOCK}}", cta.html)
    .replace("{{GSAP_TIMELINE_BODY}}", allTweens.join("\n      "));
  writeFileSync(`${OUT_DIR}/inner.html`, overlayOut);

  const hostSpecs = ["canvas-9x16", "canvas-1x1", "canvas-16x9"];
  for (const name of hostSpecs) {
    const hostTemplate = readFileSync(`${TEMPLATES_DIR}/${name}.template.html`, "utf-8");
    let hostOut = hostTemplate.replace(/{{TOTAL_DURATION}}/g, totalDuration).replace("{{COMPOSITION_DIR}}", `compositions/${slug}/${formatKey}`);
    hostOut = hostOut.replace("{{SHOT_VIDEO_TAGS_SHARP}}", buildShots(shots, { idPrefix: "shot", trackIndex: 0 })).replace("{{PRODUCT_SHOT_TAG_SHARP}}", sharpProductShotTag);
    if (name !== "canvas-9x16") {
      hostOut = hostOut.replace("{{SHOT_VIDEO_TAGS_BLUR}}", buildShots(shots, { idPrefix: "bgblur", trackIndex: 2 })).replace("{{PRODUCT_SHOT_TAG_BLUR}}", blurProductShotTag);
    }
    writeFileSync(`${OUT_DIR}/${name}.html`, hostOut);
  }

  console.log(`Composed ${OUT_DIR}/inner.html — total duration ${totalDuration}s`);
  console.log(`Format: ${formatKey} (${format?.name ?? "default"})`);
  console.log(`Shots: ${shots.length}, summing to ${shots.reduce((a, s) => a + s.duration, 0).toFixed(2)}s`);
  console.log(`Rendered hosts: ${hostSpecs.map((n) => `${OUT_DIR}/${n}.html`).join(", ")}`);
}

main();
