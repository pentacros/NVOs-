# NVO Automation

Generates Leap Finance's country-specific study-abroad ad videos ("NVOs") — stock
footage + animated copy + logos + CTA, rendered via
[HyperFrames](https://hyperframes.heygen.com) (HTML/CSS/GSAP → MP4) in 3 aspect
ratios (9:16, 1:1, 16:9).

The house style is reverse-engineered from 9 real campaigns — see
[`NVO_STYLE_BIBLE.md`](./NVO_STYLE_BIBLE.md) for the full rationale behind every
design decision.

## Setup (one time, after cloning)

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `PEXELS_API_KEY` and `GEMINI_API_KEY`.
3. This machine's default `node` may be too old — HyperFrames needs **Node 22+**.
   If `node --version` is under 22, prefix commands with the newer install instead
   of changing your global version, e.g.:
   `export PATH="/opt/homebrew/opt/node/bin:$PATH"` (adjust if Homebrew installed
   node elsewhere — check `brew list --versions node`).

## Using it in Claude Code

Open this folder in Claude Code — the `nvo-generator` skill
(`.claude/skills/nvo-generator/SKILL.md`) is auto-discovered, no install step
needed. Trigger it any time with `/nvo-generator`, or just ask naturally
("make an NVO for Ireland"). It'll walk you through country, footage, logos, and
copy conversationally, one question at a time, then compose, render, and
visually confirm the result.

Every campaign is fully self-contained under `nvo-template/assets/<campaign>/`
(shots and logos together) and `nvo-template/compositions/<campaign>/`
(generated output) — nothing is ever shared across campaigns, so a second
campaign can never mix up or overwrite an earlier one's assets or render.
Got a logo file to add? Drop it in `inbox/` (gitignored scratch space) or just
tell the agent where it already is on your machine (Desktop, Downloads,
wherever) — you never need to place it inside `nvo-template/` yourself.

## Using it without an agent

`npm run create` is a standalone terminal wizard covering the same intake —
useful for a teammate without Claude Code. See the skill file above for full
phase-by-phase detail (footage sourcing, scoring, spec schema, etc.).
