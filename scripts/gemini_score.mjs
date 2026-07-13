#!/usr/bin/env node
// Score downloaded Pexels candidate clips with Gemini so we can pick the best few
// and the best in/out trim points for a ~13-15s ad, matching the CALM/LANDMARK-LED
// house style found in NVO_STYLE_BIBLE.md (not "fast/hyperlapse" — that assumption
// was corrected after the frame-by-frame analysis).
//
// Usage:
//   node scripts/gemini_score.mjs --dir footage/germany
//
// Uses gemini-2.5-flash-lite via the legacy generateContent API (not the newer
// Interactions API) specifically because we need video_metadata.fps control —
// see reference/gemini_api_research notes in the style bible §8.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY — copy .env.example to .env and fill it in.");
  process.exit(1);
}

const MODEL = "gemini-2.5-flash-lite";

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING },
    matchesHouseStyle: {
      type: Type.BOOLEAN,
      description:
        "True if the shot is a calm, mostly static/locked-off establishing or lifestyle shot (matches the house style), false if it's fast/handheld/hyperlapse/whip-pan (off-brand for this campaign).",
    },
    visualAppealScore: { type: Type.INTEGER, description: "1-10, how striking/aspirational the shot looks" },
    landmarkRecognizability: {
      type: Type.INTEGER,
      description: "1-10, how recognizable/iconic the location is for the target country",
    },
    bestTrimStartSec: { type: Type.NUMBER },
    bestTrimEndSec: { type: Type.NUMBER },
    recommended: { type: Type.BOOLEAN },
  },
  required: [
    "description",
    "matchesHouseStyle",
    "visualAppealScore",
    "landmarkRecognizability",
    "bestTrimStartSec",
    "bestTrimEndSec",
    "recommended",
  ],
};

const PROMPT = `You are screening stock footage candidates for a study-abroad ad. The house style
(confirmed from analyzing 9 real campaigns frame-by-frame) is CALM and LANDMARK-LED: hard cuts every
2-4 seconds, mostly static/locked-off camera, with ambient motion (traffic, pedestrians, water) providing
energy rather than camera movement, panning, or hyperlapse effects. Recognizable architecture/landmarks
are strongly preferred over generic b-roll.

Watch this clip and:
1. Describe what's in it.
2. Judge whether it matches that calm/landmark-led house style (not fast/handheld/hyperlapse).
3. Score visual appeal and landmark recognizability (1-10 each).
4. Recommend the single best 2-4 second trim window (start/end seconds) within the clip to use in the ad.
5. Give a final recommended true/false for whether this clip should be shortlisted at all.`;

function parseArgs(argv) {
  const args = { fps: 6 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir") args.dir = argv[++i];
    else if (argv[i] === "--fps") args.fps = Number(argv[++i]);
  }
  if (!args.dir) {
    console.error("Missing --dir footage/<country>");
    process.exit(1);
  }
  return args;
}

async function scoreClip(ai, filePath, fps) {
  const uploaded = await ai.files.upload({ file: filePath, config: { mimeType: "video/mp4" } });
  let file = uploaded;
  while (file.state === "PROCESSING") {
    await new Promise((r) => setTimeout(r, 3000));
    file = await ai.files.get({ name: file.name });
  }
  if (file.state !== "ACTIVE") throw new Error(`Gemini file upload failed: state=${file.state}`);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { fileData: { fileUri: file.uri, mimeType: file.mimeType }, videoMetadata: { fps } },
          { text: PROMPT },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
  });

  return JSON.parse(response.text);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = `${args.dir}/manifest.json`;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const scored = [];
  for (const entry of manifest) {
    const filePath = `${args.dir}/${entry.file}`;
    console.log(`Scoring ${entry.file}...`);
    try {
      const score = await scoreClip(ai, filePath, args.fps);
      scored.push({ ...entry, score });
      console.log(
        `  appeal=${score.visualAppealScore} landmark=${score.landmarkRecognizability} houseStyle=${score.matchesHouseStyle} recommended=${score.recommended}`
      );
    } catch (err) {
      console.error(`  failed: ${err.message}`);
      scored.push({ ...entry, score: null, error: err.message });
    }
  }

  scored.sort((a, b) => {
    const rb = b.score?.recommended ? 1 : 0;
    const ra = a.score?.recommended ? 1 : 0;
    if (rb !== ra) return rb - ra;
    return (b.score?.visualAppealScore ?? 0) - (a.score?.visualAppealScore ?? 0);
  });

  writeFileSync(`${args.dir}/scored.json`, JSON.stringify(scored, null, 2));
  const shortlisted = scored.filter((s) => s.score?.recommended);
  console.log(`\nDone. ${shortlisted.length}/${scored.length} clips recommended. See ${args.dir}/scored.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
