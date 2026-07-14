---
name: nvo-generator
description: Generate a Leap Finance "NVO" study-abroad ad video (stock footage + animated copy + logos + CTA) in one aspect ratio, then replicate it to the other two. Use when the user asks to make/create/generate an NVO, a study-abroad ad video, or references this project's country/logo/copy workflow.
---

# NVO Generator

Builds Leap Finance's country-specific study-abroad ad videos ("NVOs"), matching the
house style reverse-engineered from 9 real campaigns in `../../NVO_STYLE_BIBLE.md`
(read that file for the full rationale — this skill just operationalizes its decisions).

Rendering backend: [HyperFrames](https://hyperframes.heygen.com) (HTML/CSS/GSAP → MP4).
Stock footage: Pexels Video API. Footage scoring: Gemini API.

**Read `../../NVO_STYLE_BIBLE.md` before your first run of this skill in a session** —
it has the full per-beat styling rationale this skill only summarizes.

## Default flow: ask in chat (this is what firing this skill means)

When a user invokes this skill in a Claude Code session (`/nvo-generator`, or
just asking to make/create an NVO), **the default is to run Phase 0 yourself,
conversationally, right here in the chat** — ask the intake questions one at a
time (per user feedback: they explicitly want the guided flow to happen in the
conversation, not by being sent to a separate terminal tool), then run
`compose.mjs`, lint, and the render yourself via Bash, and show/confirm the
result in chat (extract frames, view them with your image-reading tool, report
what you see) exactly like Phases 0–6 below describe. Don't default to telling
the user to go run something themselves unless they ask for the standalone
option below.

## Standalone alternative: `npm run create`

For a human running this *without* an agent driving it (or a teammate without
Claude Code), `npm run create` is a terminal wizard covering the same Phase
0/3–6 intake in one flow — campaign name, aspect ratio, footage folder, logos,
copy, one question at a time, writes `videos/<campaign>.json`, shows it for
confirmation, then runs `compose.mjs` and the render (streaming progress, not
silent). It detects an existing spec and asks whether to edit or start fresh
rather than silently overwriting it. After each render it extracts start/mid/end
frames to a temp folder and prints their paths, but — being a plain Node script —
it has no way to actually look at them; if an agent happens to be the one
running it, that agent should still open the frames with its image-reading tool
and confirm before declaring the video done, same as the chat-native flow. It
always prints "Please add music after export." as its last line regardless of
outcome — the pipeline doesn't handle audio yet. Prefer the chat-native flow
above when you (the agent) are the one driving this.

## One-time setup (skip if already done)

1. Copy `.env.example` to `.env` in the project root and fill in `PEXELS_API_KEY` and
   `GEMINI_API_KEY`.
2. `cd nvo-automation && npm install` (installs `@google/genai`, `dotenv`).
3. This machine's default `node` may be too old (HyperFrames needs Node 22+). If
   `node --version` is under 22, prefix commands with the newer install instead of
   changing the global version, e.g.:
   `export PATH="/opt/homebrew/opt/node/bin:$PATH"` (adjust if Homebrew installed
   node elsewhere — check `brew list --versions node`).

## Architecture (read this before editing any composition file)

- **Every campaign is fully self-contained in its own folder — nothing about a
  campaign is ever shared or global.** `nvo-template/assets/<campaign>/` holds
  BOTH that campaign's trimmed shot clips AND its logos side by side (e.g.
  `nvo-template/assets/germany/{shot1_reichstag.mp4, bmw.jpg, porsche.png}`),
  and `nvo-template/compositions/<campaign>/` holds that campaign's generated
  output. This was NOT the original design — logos used to live in one shared
  `nvo-template/assets/logos/` pool and every campaign composed into one shared
  `nvo-template/compositions/` directory. In practice this caused two real
  bugs: (1) a second campaign's logos ended up mixed in the same picker
  list/folder as an earlier campaign's, with no way to tell which belonged to
  which; (2) composing a second campaign silently overwrote the first
  campaign's already-rendered composition files with no warning, because they
  shared one output path. Never reintroduce a shared, cross-campaign
  assets/compositions folder — always scope by campaign slug (the spec's own
  filename, e.g. `videos/germany.json` → slug `germany`).
- **Getting a logo (or any asset) from the user does not mean asking them to
  place a file inside this project's folder structure.** A user can paste an
  image directly into the chat — you can *see* it via vision, but there is no
  tool that hands you that exact image's bytes from the conversation itself.
  On macOS there IS a working extraction path around this, confirmed by
  testing: run
  ```bash
  osascript -e 'try
    set png_data to the clipboard as «class PNGf»
    set fp to open for access (POSIX file "/tmp/clip.png") with write permission
    set eof fp to 0
    write png_data to fp
    close access fp
    return "success"
  on error errMsg
    return "failed: " & errMsg
  end try'
  ```
  right after they paste or copy an image — this reads the actual OS clipboard
  (not the chat's own paste handling), which usually still holds the image.
  **Always Read the extracted file yourself afterward to visually confirm it's
  really the intended image before using it** — the first attempt in testing
  came back as a generic file-icon placeholder (stale clipboard state), and
  only a retry a moment later grabbed the real image; don't trust an
  extraction blindly. If it fails or grabs the wrong thing, fall back to
  asking where the file already lives on their machine (Desktop, Downloads,
  anywhere) or having them drop it in the project's `inbox/` folder
  (gitignored scratch space, exactly for this) — either way, **you** copy it
  into `nvo-template/assets/<campaign>/` yourself and use that path in the
  spec. Never tell the user to navigate into `nvo-template/assets/...`
  themselves.
- `nvo-template/templates/*.template.html` — source templates with `{{TOKEN}}` placeholders.
  Never edit `nvo-template/compositions/<campaign>/*.html` directly — those are
  generated output, overwritten every time `scripts/compose.mjs` runs for that campaign.
- `scripts/compose.mjs` fills the templates with a per-video JSON spec (see schema
  below), computing literal numeric `data-start`/`data-duration` offsets — HyperFrames
  does **not** support variable-templated timing, only content/color (confirmed via
  `hyperframes lint` and the installed CLI's own `hyperframes docs data-attributes`).
- **Background video/product-shot `<video>` elements must be direct children of each
  aspect-ratio host file's own root** (`canvas-9x16.html`, `canvas-1x1.html`,
  `canvas-16x9.html`) — HyperFrames never drives media placed inside a sub-composition
  (anything loaded via `data-composition-src`). `inner.html` (the shared overlay with
  hook/proof/checklist/CTA text and logo images) is the *only* sub-composition, and it
  contains **no media** for exactly this reason. `compose.mjs` duplicates the shot list
  directly into all 3 hosts.
- Two simultaneously-playing `<video>` elements in the same file need **different**
  `data-track-index` values — track-index is a decode lane, not a z-order (z-order is
  CSS `z-index` only). This is why the 1:1/16:9 hosts use 4 distinct track indices
  (blur shots, blur product-shot, sharp shots, sharp product-shot).
- Every visible timed element (including `<video>`, contrary to some external docs)
  needs `class="clip"` — confirmed by this project's own generated `CLAUDE.md`.
- `data-composition-src` and asset `src` paths are resolved **relative to the project
  root** (`nvo-template/`), not relative to the referencing file's own folder — always
  write `compositions/<campaign>/inner.html` and `assets/<campaign>/...`, never a
  path relative to the referencing file's own folder.
- The overlay's own `<html>/<body>` background **must stay `transparent`** — it renders
  on top of the host's background video layer; an opaque background paints over the
  footage underneath it (this exact bug was found and fixed once already — don't
  reintroduce it).
- 1:1 and 16:9 are the 9:16 master, centered and pillarboxed with a blurred/zoomed
  duplicate of the same footage on the sides (scale factor 1080/1920 = 0.5625, column
  width ≈607.5px) — never independently re-laid-out. This is a locked decision
  (style bible §7 decision #7), not a per-video choice.
- **No persistent country/brand logo** — this was tried (a corner-anchored flag image)
  and explicitly reversed after user review against real reference frames (style bible
  §7 decision #1). Do not reintroduce a persistent logo without a fresh product
  decision; college/university logos still populate the one proof-beat grid.
- **Safe zone**: all text/logo/CTA sizing and position must respect Meta's published
  Instagram Reels safe area for a 1080×1920 canvas — CSS tokens `--nvo-safe-top` (13%),
  `--nvo-safe-bottom` (18%), `--nvo-safe-right` (15%, the like/comment/share icon
  column), `--nvo-safe-left` (6%) in `inner.template.html`. An earlier pass sized
  everything well under this real box and it read as "small/placeholder" — always size
  new elements to actually fill the safe area, not an arbitrary fraction of the canvas.
- **Hook+logo-proof merge**: when `proof.mode` is `"logos"`, `compose.mjs` renders the
  logo grid as a trailing sibling of the hook block (own `data-start`/`data-duration`,
  starting when the hook's own duration ends) instead of a fully separate later beat —
  the hook headline/subtitle's `data-duration` is stretched to cover both so the text
  stays visible while the logos build up underneath, matching how the real campaigns
  do it (style bible §7 decisions #1/#3). A `bullets`-mode proof is unaffected and
  still renders as its own separate beat.
- **Checklist+CTA merge**: when both exist and there's no `productShot` between them,
  the CTA pill renders centered *inside* the checklist's div (extending its
  `data-duration`) instead of as a separate beat (style bible §7 decision #4).
- **CTA and the logo grid are always centered**, unlike the left-aligned hook/checklist
  body copy — this is a deliberate, user-specified departure from the sampled
  campaigns (style bible §7 decisions #2/#4), not a per-video choice.

## Phase 0 — Intake

**One question per message.** Ask a single question, wait for the user's reply,
then ask the next — do not batch multiple questions into one message (this was
tried and explicitly rejected by the user: batching several fields into one
turn is the wrong UX here, even though it's the "normal" style for other work
in this project). This matches how `npm run create` already prompts, field by
field. Walk through, in order:

1. **Country / destination** (e.g. "Germany").
2. **Aspect ratio wanted first** — default to 9:16 (the master); the other 2 are
   generated automatically in Phase 6 once the user approves the first.
3. **Proof beat choice** — up to 4 college/university logos, a bullet list of up
   to 5 USP/stats, or skip this beat entirely. No persistent country/brand logo
   is ever used (style bible §7 decision #1, reversed after user review — don't
   ask for one). If logos: the easiest path is to have them just paste or copy
   each image and grab it off the clipboard yourself (see Architecture note
   above for the exact command and the "always verify what you grabbed" caveat)
   — fall back to asking where the file already lives (Desktop, Downloads, the
   project's `inbox/` folder, wherever) if that fails. Never ask the user to
   place it inside `nvo-template/assets/...` themselves, copy it there
   yourself. Logos render centered, directly under the still-visible hook card
   (style bible §7 decisions #1–#3), not their own separate frame.
4. **Hook lead line** (e.g. "Study in").
5. **Hook hero word** (the country/degree name, e.g. "Germany").
6. **Hook fast-fact subtitle** (optional — ask if they want one, blank to skip).
7. **Checklist opt-in** — the recurring 3-item "Admit Eligibility / Top Jobs
   After Graduation / Expenses & Earnings" block, rendered as real bullet
   points (style bible §7 decision #10, still open — treat as opt-in, not
   automatic default). If yes, ask separately whether to keep the default
   wording or customize it. When paired with a CTA and no product shot, the
   CTA renders centered directly beneath it in the same frame (style bible §7
   decision #4).
8. **Product shot opt-in** — only if they have an app screen-recording (not a
   static photo — style bible found this is always a screen recording, never a
   device mockup). If yes, ask for the file path as its own follow-up.
9. **CTA lead text** (e.g. "Check").
10. **CTA accent phrase** (e.g. "Eligibility"). Always renders centered.
11. **Pill/accent color**, only if they want something other than the default
    blue (`#1E3FE0`) — otherwise skip this question and just use the default.

## Phase 1 — Source stock footage

```bash
node scripts/pexels_search.mjs --country "Germany" --ratio 9:16
```

This downloads candidates into `footage/<country>/` biased toward **calm,
landmark-led** shots (style bible §7 decision #8 — explicitly NOT hyperlapse/fast
footage, correcting the original brief). Writes `manifest.json` with Pexels metadata.

## Phase 2 — Score and shortlist footage

```bash
node scripts/gemini_score.mjs --dir footage/germany
```

Scores each candidate against the calm/landmark-led house style and proposes trim
windows. Writes `scored.json`, sorted best-first. Pick 2–5 clips totaling roughly the
target video length (12–18s is typical per the analyzed campaigns) — trim each to its
recommended window with `ffmpeg -ss <start> -to <end>` before using it in the spec, or
pass the full clip and let `compose.mjs`'s padding logic handle the exact duration.

## Phase 3 — Compose

Write a JSON spec (see full schema in `videos/germany.json` for a working example,
with real trimmed shots and real logos — `videos/test_germany.json` is a minimal
placeholder-only version) to `videos/<name>.json`, where `<name>` becomes the
campaign slug that scopes everything below:

```json
{
  "pillColor": "#1E3FE0",
  "shots": [ { "src": "assets/germany/shot1.mp4", "duration": 3.8 }, ... ],
  "beats": {
    "hook": { "duration": 2.5, "lead": "Study in", "hero": "Germany", "subtitle": "..." },
    "proof": { "mode": "logos", "duration": 3.5, "logos": ["assets/germany/uni1.png", ...] },
    "checklist": { "duration": 3, "heading": "Get:", "items": ["...", "...", "..."] },
    "productShot": { "duration": 4, "src": "assets/germany/product.mp4" },
    "cta": { "duration": 2, "lead": "Check", "accent": "Eligibility" }
  }
}
```

Every `src`/`logos` path lives under that same `assets/<name>/` folder — shots and
logos side by side, never a shared cross-campaign folder (see Architecture note
above). No `logo` field — there's no persistent country/brand logo (style bible §7
decision #1, reversed). Omit `proof`, `checklist`, or `productShot` entirely for
videos that don't use them — `compose.mjs` only renders beats present in the spec
(dynamic beat model, style bible §7 decision #9). `proof.mode` is `"logos"` or
`"bullets"` (with a `bullets` array instead of `logos`); a `"logos"` proof right
after a hook automatically merges into the hook's on-screen block (see Architecture
section above).

```bash
node scripts/compose.mjs --spec videos/<name>.json
```

This writes `nvo-template/compositions/<name>/inner.html` and all 3
`nvo-template/compositions/<name>/canvas-*.html` hosts — the campaign slug is taken
from the spec's own filename, so this never touches another campaign's already-
composed output. Re-run it any time the spec changes — never hand-edit the
generated composition files.

## Phase 4 — Render the first aspect ratio

```bash
cd nvo-template
npx hyperframes render -c compositions/<name>/canvas-9x16.html -o ../output/<name>_9x16.mp4
```

(Prefix with the Node 22+ PATH export from setup if needed. Drop `-q draft --fps 10`
used during development — render at full quality/fps for anything shown to the user.)

Run `npx hyperframes lint .` first and read the output — real errors (not the
project's own harmless `media_in_subcomposition` false-positives on `canvas-*.html`,
which are meant to be rendered directly via `-c` and are proven to work) should be
fixed before rendering.

## Phase 5 — Review with the user

Show the rendered video. Ask if the copy, timing, footage choice, or styling needs
changes. Loop back to Phase 3 (edit the spec, recompose) as needed — do not hand-edit
the generated HTML.

## Phase 6 — Replicate to the other 2 aspect ratios

Once the user approves the first ratio, the other 2 are already composed (Phase 3
generates all 3 hosts every time) — just render them:

```bash
npx hyperframes render -c compositions/<name>/canvas-1x1.html -o ../output/<name>_1x1.mp4
npx hyperframes render -c compositions/<name>/canvas-16x9.html -o ../output/<name>_16x9.mp4
```

No further per-ratio design work is needed — the pillarbox-blur treatment is
mechanical (style bible §7 decision #7).

## Known limitations / open items

- Music/audio is out of scope for v1 (user decision, see style bible history).
- The "benefits checklist" as an always-offered default (style bible §7 decision #10)
  is still an open product decision — currently opt-in per video, ask the user each
  time until they say otherwise.
- The blur/sharp seam in the pillarbox treatment is a visible hard edge in testing;
  consider a feathered mask (`mask-image: linear-gradient(...)` on the sharp column's
  edges) as a polish pass if the user flags it.
