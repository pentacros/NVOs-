---
name: nvo-generator
description: Generate a Leap Finance "NVO" study-abroad ad video (stock footage + animated copy + logos + CTA), choose one of nine format/style options, and render it across the three aspect ratios. Use when the user asks to make/create/generate an NVO, a study-abroad ad video, or references this project's country/logo/copy workflow.
---

# NVO Generator

Builds Leap Finance's country-specific study-abroad ad videos ("NVOs"), matching the
house style reverse-engineered from 9 real campaigns in `../../NVO_STYLE_BIBLE.md`
(read that file for the full rationale — this skill just operationalizes its decisions).
This workflow supports nine distinct format/style variants (catalogued in
`../../scripts/formatCatalog.mjs`, each fully self-contained under
`../../nvo-template/formats/<key>/`) rather than a single hardcoded template.
Formats and campaigns are independent axes — any campaign can render through
any format, and each format/campaign combination gets its own isolated spec,
assets, and composition output (never shared, see Architecture below).

Each format's `config.json` declares a `contentShape` — its real logo count/type,
proof-beat mode (`logos` / `bullets` / `numberedBadges` / `cumulativePills`),
whether it needs the recurring 3-item eligibility checklist, whether a
product-shot beat is `required` / `optional` / `unsupported`, and its CTA
entrance style. This is what makes each format's clarifying questions genuinely
different, not just its color palette — e.g. `dubai_a` asks for 3 checkmark
bullets *and* 4 university logos (two proof beats), `germany_a` asks for 3
*employer* logos (not university) plus 4 USP bullets, `singapore_a` asks for
5 cumulative benefit pills and never asks about logos at all, and `ireland`/
`newzealand` require a product-shot file path (no logo questions at all —
their reference cuts only show university/college crests inside the in-app
demo itself, never a standalone logo grid). Read a format's `config.json`
before assuming what it should ask for.

The `reference/<format>_9x16_findings.md` files (plus `previewVideoPath` in
each format's `config.json`, pointing at the real original clip in
`reference/`) are the **only** source for a format's structure — beat timing,
shot count, logo count/placement, badge presence, bullet count. **Never** pull
footage, logos, or copy/CTA wording from `reference/` into a generated spec —
see the isolation rule below. `genericnvo1`, `ireland`, and `newzealand` have
no `*_aspect_ratio_comparison.md` file (only 6 of 9 formats do — dubai_a/b,
germany_a/b, singapore_a/b); for those 3, the 9:16 findings.md plus this
project's own locked pillarbox-blur rule (§7 decision #7 in the style bible —
mechanical, identical treatment for every format) is enough to build all 3
ratios. This has not been re-verified against an actual rendered 1:1/16:9 output
for those 3 formats specifically — flag to the user if a 1:1/16:9 render of one
of them looks off, since that gap is real, just judged low-risk.

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
0/3–6 intake in one flow — campaign name, aspect ratio, format/style choice,
footage folder, logos, copy, one question at a time, writes
`videos/<campaign>.json`, shows it for confirmation, then runs `compose.mjs`
and the render (streaming progress, not silent). It detects an existing spec
and asks whether to edit or start fresh rather than silently overwriting it.
After each render it extracts start/mid/end frames to a temp folder and prints
their paths, but — being a plain Node script — it has no way to actually look
at them; if an agent happens to be the one running it, that agent should still
open the frames with its image-reading tool and confirm before declaring the
video done, same as the chat-native flow. It always prints "Please add music
after export." as its last line regardless of outcome — the pipeline doesn't
handle audio yet. Prefer the chat-native flow above when you (the agent) are
the one driving this.

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
  place a file inside this project's folder structure.** Never tell the user
  to navigate into `nvo-template/assets/...` themselves — you always fetch or
  copy the file in yourself. Three methods, in order of preference:

  1. **Named institution/company → fetch the real logo yourself, no user
     action needed at all.** Confirmed working end to end (4 UK university
     logos, byte-for-byte matching what the user showed): `WebSearch`/
     `WebFetch` the institution's Wikipedia page, read the infobox logo image
     URL (pattern: `upload.wikimedia.org/wikipedia/en/thumb/.../<Name>_logo.svg/`
     — bump the `250px-` prefix to `500px-` or higher for a sharper download),
     then `curl -sL "<url>" -o nvo-template/assets/<campaign>/<name>.png`. This
     is almost always the RIGHT default for well-known universities/companies
     — try it before asking the user for anything. **Always `Read` the
     downloaded file yourself to visually confirm it's the right logo before
     using it in a spec** — don't assume a URL guess was correct.
  2. **Clipboard extraction (macOS), for a logo that isn't a clean web match**
     (a custom/internal logo, or nothing good turns up online). Confirmed
     working by testing:
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
     right after the user pastes or copies an image — this reads the actual OS
     clipboard (not the chat's own paste handling), which usually still holds
     it. **Always Read the extracted file afterward to visually confirm it's
     really the intended image** — the first attempt in testing came back as a
     generic file-icon placeholder (stale clipboard state), and only a retry a
     moment later grabbed the real image; don't trust an extraction blindly.
     **This only ever works for ONE image at a time** — the OS clipboard is a
     single slot, not a queue, so if the user selects/pastes several logos
     together (found in practice: 4 university logos pasted at once), this can
     only ever retrieve the single most recent one. For more than one logo via
     this method, have them copy each one individually and confirm one at a
     time ("copied Warwick" → grab → "copied Aberdeen" → grab → ...) — or
     prefer method 1 above for named entities, which has no such limit.
  3. **Ask where the file already lives** (Desktop, Downloads, anywhere) or
     have them drop it in the project's `inbox/` folder (gitignored scratch
     space, exactly for this) — the fallback when neither of the above works,
     e.g. a one-off custom logo with no web presence and no longer on the
     clipboard.

  Whichever method works, **you** copy/save the result into
  `nvo-template/assets/<campaign>/` and use that path in the spec.
- `nvo-template/templates/*.template.html` — base host templates with `{{TOKEN}}`
  placeholders for the three aspect-ratio canvases. `nvo-template/formats/<format>/inner.template.html`
  supplies the per-format overlay shell for the shared inner composition. Never edit
  `nvo-template/compositions/<campaign>/<format>/*.html` directly — those are
  generated output, overwritten every time `scripts/compose.mjs` runs for that campaign.
- `scripts/compose.mjs` fills the selected template(s) with a per-video JSON spec
  (see schema below), computing literal numeric `data-start`/`data-duration`
  offsets — HyperFrames does **not** support variable-templated timing, only
  content/color (confirmed via `hyperframes lint` and the installed CLI's own
  `hyperframes docs data-attributes`). The chosen format is read from
  `spec.format` and resolved through `scripts/formatCatalog.mjs`.
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
tried and explicitly rejected by the user). This matches how `npm run create`
already prompts, field by field.

**Format is chosen first, before any content question, and its own schema
governs everything after that — never fall back to a shared generic question
set once a format is picked.** Walk through, in order:

1. **Present all 9 formats as a real menu**: for each, show its one-line
   `description` from `config.json` (not just its key/name). Let the user open
   the real original reference video for any format they're curious about
   (`config.json`'s `previewVideoPath`, e.g.
   `reference/dubai nvo 20th may - DUBAI NVO VISUALS CORRECTED 9 BY 16.mp4`)
   and read its `reference/<format>_9x16_findings.md` breakdown as text
   context — this is the genuine original example of that format, not a
   placeholder. `scripts/formatCatalog.mjs`'s `previewTextForFormat()` prints
   the findings.md excerpt plus a pointer to the video path; open the video
   file yourself if the user wants to actually watch it.
2. **Format/style choice** — once picked, say something like *"Got it —
   building a [format display name] style NVO"*, then load ONLY that format's
   `contentShape` + `questions` from its `config.json` for everything below.
   Two formats with the same accent color can still ask completely different
   questions (e.g. `germany_a` asks for employer logos, `germany_b` asks for
   university logos — same country, different format, different content shape).
3. **Shared questions next** (same for every format): campaign/country name,
   aspect ratio (default 9:16 — the master; the other 2 are generated
   automatically in Phase 6), footage folder **for this new campaign**
   (`nvo-template/assets/<campaign>/` or wherever the fresh clips live — never
   `reference/`).
4. **Then that format's own questions, from its `contentShape`** — ask only
   what that shape actually needs, always for fresh content, never suggesting
   or defaulting to anything drawn from `reference/`:
   - **Hook**: lead line, hero word (country/degree name), and — only if
     `contentShape.hasIntakeBadge` is true — an intake-badge/tag line; otherwise
     an optional subtitle.
   - **Proof beat** (`contentShape.proof.mode`): exactly `count` items in
     whichever shape that format uses — `logos` (ask for `logoType`-labeled
     logos, e.g. "employer" vs "university" — fetch/copy per the Architecture
     section, never substitute a logo seen in that format's reference video),
     `bullets` (checkmark-style benefit lines), `numberedBadges` (#1/#2/#3
     process steps), or `cumulativePills` (a stacking benefit list that all
     stays on screen together, first item in the accent color). Some formats
     have no proof beat at all (`ireland`, `newzealand`, `singapore_a` has one
     but no logos).
   - **Secondary proof beat** (`contentShape.secondaryProof`), only for formats
     that show two distinct proof beats back to back (e.g. `dubai_a`: 3 bullets
     then 4 university logos; `germany_a`/`germany_b`: logos then bullets) —
     same per-mode question shapes as above.
   - **Checklist** (`contentShape.checklist.supported`) — only asked for
     `dubai_b`, `genericnvo1`, and `singapore_b`. If the format's
     `defaultItems` recurring wording ("Admit Eligibility / Top Jobs After
     Graduation / Expenses & Earnings") applies, ask whether to keep it or
     customize.
   - **Product shot** (`contentShape.productShot`) — `required` for `ireland`
     and `newzealand` (always ask for the file path, no opt-out — `compose.mjs`
     will hard-error if it's missing for these two); `unsupported` for every
     other format (don't ask at all); no format currently marks it merely
     `optional`. Always this campaign's own screen recording, never a device
     mockup, never pulled from a reference clip.
   - **CTA**: lead text + accent phrase, always centered. `contentShape.cta.style`
     picks the entrance animation (`compose.mjs` handles this automatically from
     the format — no extra question needed unless the user wants a non-default
     pill color).
5. **Pill/accent color**, only if they want something other than the format's
   own default — otherwise skip this question and just use the format's
   `pill`/`accent` from `config.json`.

Re-running for a campaign+format combination that already has a spec at
`videos/<campaign>__<format>.json` asks whether to edit or start fresh (both
`npm run create` and the chat-native flow should do this — see Phase 3).

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

Write a JSON spec (see `videos/germany.json` for a working pre-rebuild example;
`scripts/create.mjs` writes the current per-format schema described here when
run interactively) to `videos/<name>__<format>.json`, where `<name>` is the
campaign slug and `<format>` is the format key — this filename pairing is what
scopes everything below and what "edit or start fresh" checks against:

```json
{
  "version": 3,
  "format": "germany_b",
  "formatName": "Progressive Build & Fact Pills",
  "pillColor": "#2a0fe0",
  "shots": [ { "src": "assets/germany/shot1.mp4", "duration": 3.8 }, ... ],
  "beats": {
    "hook": { "duration": 2.5, "lead": "Study in", "hero": "Germany", "subtitle": "..." },
    "proof": { "mode": "logos", "duration": 3.5, "logos": ["assets/germany/uni1.png", ...] },
    "secondaryProof": { "mode": "bullets", "duration": 3, "bullets": ["fact 1", "fact 2", "fact 3"] },
    "checklist": { "duration": 3, "heading": "Get:", "items": ["...", "...", "..."] },
    "productShot": { "duration": 4, "src": "assets/germany/product.mp4" },
    "cta": { "duration": 2, "lead": "Check", "accent": "Eligibility" }
  }
}
```

Every `src`/`logos` path lives under that same `assets/<name>/` folder — shots and
logos side by side, never a shared cross-campaign folder (see Architecture note
above). No `logo` field — there's no persistent country/brand logo (style bible §7
decision #1, reversed). Omit `proof`, `secondaryProof`, `checklist`, or
`productShot` entirely for videos that don't use them — `compose.mjs` only
renders beats present in the spec (dynamic beat model, style bible §7 decision
#9), **except** `productShot` for `ireland`/`newzealand`, which `compose.mjs`
hard-errors on if missing (their `contentShape.productShot` is `"required"`) and
also hard-errors if present for a format whose `contentShape.productShot` is
`"unsupported"`. `proof`/`secondaryProof` beat `mode` is one of `"logos"`
(`logos` array), `"bullets"` (`bullets` array), `"numberedBadges"` (`items`
array, renders with a "#1/#2/#3" prefix), or `"cumulativePills"` (`items` array,
first item renders in the format's accent color, rest in its pill color — used
by `singapore_a`). A `"logos"` `proof` right after a hook automatically merges
into the hook's on-screen block when the format's `mergeLogosIntoHook` is true
(see Architecture section above); `secondaryProof` never merges into the hook.

```bash
node scripts/compose.mjs --spec videos/<name>__<format>.json
```

This writes `nvo-template/compositions/<name>/<format>/inner.html` and all 3
`nvo-template/compositions/<name>/<format>/canvas-*.html` hosts — the campaign
slug is taken from the spec's own filename, and the format is taken from
`spec.format`, so this never touches another campaign's already-composed output
or another format variant of the same campaign. Re-run it any time the spec
changes — never hand-edit the generated composition files.

## Phase 4 — Render the first aspect ratio

```bash
cd nvo-template
npx hyperframes render -c compositions/<name>/<format>/canvas-9x16.html -o ../output/<name>_<format>_9x16.mp4
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
npx hyperframes render -c compositions/<name>/<format>/canvas-1x1.html -o ../output/<name>_<format>_1x1.mp4
npx hyperframes render -c compositions/<name>/<format>/canvas-16x9.html -o ../output/<name>_<format>_16x9.mp4
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
