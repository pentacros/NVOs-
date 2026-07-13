#!/usr/bin/env node
// Pull candidate stock-footage clips from Pexels for a given country/destination.
//
// Usage:
//   node scripts/pexels_search.mjs --country "Germany" --ratio 9:16 [--out footage/germany]
//
// What it does:
//   1. Runs several compound queries (landmark + shot-type keywords) per the style
//      bible's finding that the house style is CALM and LANDMARK-LED, not hyperlapse —
//      so queries are biased toward recognizable architecture/establishing shots,
//      not "fast/energetic/hyperlapse" (that was our original, now-corrected assumption).
//   2. Filters results to the requested orientation and a 4-20s duration window.
//   3. Downloads the highest-quality mp4 file that is >= the target render resolution
//      (never upscales; picks the smallest file that's big enough).
//   4. Writes a manifest.json alongside the downloads with full Pexels metadata
//      (id, url, photographer) for the brand-safety audit trail — attribution is not
//      legally required for commercial use, but we keep the trail anyway.
//
// No Gemini scoring happens here — that's a separate pass (gemini_score.mjs) since
// motion/pace has no API-level filter on Pexels; it has to be judged after download.

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import "dotenv/config";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_API_KEY) {
  console.error("Missing PEXELS_API_KEY — copy .env.example to .env and fill it in.");
  process.exit(1);
}

function parseArgs(argv) {
  const args = { ratio: "9:16", perQueryCount: 5, minDuration: 4, maxDuration: 20 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--country") args.country = argv[++i];
    else if (a === "--ratio") args.ratio = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--extra-query") (args.extraQueries ??= []).push(argv[++i]);
  }
  if (!args.country) {
    console.error('Missing --country "Name"');
    process.exit(1);
  }
  args.out ??= `footage/${args.country.toLowerCase().replace(/\s+/g, "_")}`;
  return args;
}

const RATIO_TO_ORIENTATION = { "9:16": "portrait", "1:1": "square", "16:9": "landscape" };
const RATIO_TO_TARGET = {
  "9:16": { w: 1080, h: 1920 },
  "1:1": { w: 1080, h: 1080 },
  "16:9": { w: 1920, h: 1080 },
};

// Compound shot-type keywords, calibrated to the observed house style: static/slow
// establishing shots of recognizable landmarks and city/campus life, cut every 2-4s —
// NOT hyperlapse/whip-pan/handheld. See NVO_STYLE_BIBLE.md §4 "Footage rules".
const SHOT_TYPES = [
  "aerial city skyline",
  "landmark establishing shot",
  "street daily life pedestrians",
  "university campus students",
  "iconic architecture",
];

async function searchPexels(query, orientation, perPage) {
  const url = new URL("https://api.pexels.com/v1/videos/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", orientation);
  url.searchParams.set("per_page", String(perPage));
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) {
    console.error(`Pexels search failed for "${query}": ${res.status} ${await res.text()}`);
    return [];
  }
  const data = await res.json();
  return data.videos ?? [];
}

function pickBestFile(video, target) {
  const mp4s = (video.video_files ?? []).filter((f) => f.file_type === "video/mp4");
  const big = mp4s
    .filter((f) => f.width >= target.w && f.height >= target.h)
    .sort((a, b) => a.width * a.height - b.width * b.height);
  if (big.length) return big[0];
  // nothing big enough — fall back to the largest available rather than upscale blindly
  return mp4s.sort((a, b) => b.width * b.height - a.width * a.height)[0] ?? null;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed: ${url} (${res.status})`);
  await pipeline(Readable.fromWeb(res.body), (await import("node:fs")).createWriteStream(destPath));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const orientation = RATIO_TO_ORIENTATION[args.ratio];
  const target = RATIO_TO_TARGET[args.ratio];
  if (!orientation) {
    console.error(`Unknown --ratio "${args.ratio}" — use one of 9:16, 1:1, 16:9`);
    process.exit(1);
  }
  mkdirSync(args.out, { recursive: true });

  const queries = [...SHOT_TYPES, ...(args.extraQueries ?? [])].map(
    (shot) => `${args.country} ${shot}`
  );

  const manifest = [];
  const seenIds = new Set();
  let downloadIndex = 0;

  for (const query of queries) {
    const videos = await searchPexels(query, orientation, args.perQueryCount);
    for (const video of videos) {
      if (seenIds.has(video.id)) continue;
      if (video.duration < args.minDuration || video.duration > args.maxDuration) continue;
      const file = pickBestFile(video, target);
      if (!file) continue;
      seenIds.add(video.id);
      downloadIndex++;
      const destName = `clip_${String(downloadIndex).padStart(3, "0")}_${video.id}.mp4`;
      const destPath = `${args.out}/${destName}`;
      console.log(`Downloading [${query}] -> ${destName} (${file.width}x${file.height}, ${video.duration}s)`);
      try {
        await downloadFile(file.link, destPath);
      } catch (err) {
        console.error(`  failed: ${err.message}`);
        continue;
      }
      manifest.push({
        file: destName,
        pexelsId: video.id,
        pexelsUrl: video.url,
        query,
        duration: video.duration,
        sourceWidth: file.width,
        sourceHeight: file.height,
        photographer: video.user?.name,
        photographerUrl: video.user?.url,
      });
    }
  }

  writeFileSync(`${args.out}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${manifest.length} clips saved to ${args.out}/ (manifest.json has full metadata).`);
  console.log(`Next: node scripts/gemini_score.mjs --dir ${args.out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
