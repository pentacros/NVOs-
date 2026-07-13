# NVO Style Bible
Synthesized from frame-by-frame (20fps, no frames skipped) analysis of 9 campaigns × up to 3 aspect ratios (14 videos total: 9 in 9:16, plus 16:9 + 1:1 for the 7 campaigns that have them).

Campaigns analyzed: Germany (v.A, v.B), Dubai (v.A, Masters), Ireland (+1 duplicate/unlabeled Ireland file), New Zealand, Singapore (v.A, Masters).

---

## 1. Where our starting assumptions were WRONG

These are the things worth flagging before we lock a build spec, because the brief assumed a rigid template and the footage shows a looser, more varied reality:

1. **It is not "4 copy slides + a CTA."** Every campaign has a different number of *content beats* (2 to 4), and the beats are not uniform slide swaps — some persist across multiple background cuts, some build progressively (word-by-word / bullet-by-bullet) within a single beat, and beat count/order varies by campaign. The one thing that IS universal: **a hook/headline beat first, a CTA beat last.** What sits in between varies.
2. **The background footage is not "extremely fast and crisp with a lot of movement."** Every campaign uses hard cuts (never crossfades) but the shots themselves are mostly static/locked-off with ambient motion (traffic, pedestrians, water) doing the work — not whip-pans, hyperlapse, or handheld energy. Average shot length is ~2–4 seconds. The house style reads as calm/aspirational-documentary, not hype-reel. If we source Pexels footage biased toward "fast, high-motion, hyperlapse," it will look off-brand — we should match the calmer pace actually used.
3. **There is no persistent brand/company logo in any of the 9 videos.** Not once did a Leap/company logo appear. The only logos present are **third-party credibility logos** — either partner *employer* logos (Germany: BMW/Bosch/Siemens) or partner *university* logos (Dubai, Ireland, Singapore Masters) — and they only appear during one specific "proof" beat, in a building 2×2 grid, then disappear for good. This directly contradicts the plan to always ask for and place a persistent "country/company logo." We need your call on this (see §7 open decisions).
4. **A "product shot" is not a static product photo/device mockup.** In the 2 campaigns that have one (Ireland, New Zealand), it's a **full-bleed screen-recording of the LeapScholar app** (onboarding form → loading → scrollable shortlist cards with university crests → CTA banner), playing edge-to-edge with no phone-bezel mockup, fully replacing the stock footage for that window (not picture-in-picture). 7 of 9 campaigns have no product shot at all.
5. **The 3 aspect ratios are not 3 independent designs.** With one exception, they're the *same* master 9:16 composite reframed:
   - **16:9** is done identically everywhere via **pillarbox + blurred fill**: the untouched vertical footage sits centered (~30–44% of the wide canvas), sides filled with a heavily blurred/zoomed duplicate of the same clip. Text/logo/CTA never leave the sharp center column.
   - **1:1** is *usually* the same blur-pillarbox treatment, but **Singapore Masters instead used a plain top/bottom center-crop with no blur at all** — so square-export technique is not fully standardized across the existing campaigns. We should pick one and standardize (recommend: blur-pillarbox everywhere, since it's the dominant pattern and never clips content).
   - Copy/logo/CTA content and timing are frame-identical across ratios in most campaigns — same rendered layer, just reframed. Two exceptions found: Dubai A re-centers its closing CTA vertically in the wider ratios; Singapore A has independently-retimed (not just reframed) pill/CTA timing between ratios — likely just editor inconsistency, not a deliberate rule.
   - When a product-shot/app-recording segment exists (Ireland), it does **not** get blurred in the wide ratios — since blurring legible UI would look broken, it's instead placed on a flat neutral card background.

---

## 2. Canonical structure (flexible beat model, not a fixed slide count)

Every campaign follows this skeleton, but **not every beat is present in every campaign** — treat it as an ordered menu the automation assembles from based on what inputs are provided:

| Beat | Purpose | Present in | Typical content |
|---|---|---|---|
| **1. Hook** | Country/degree headline, always first | All 9 | "[Study in / Get Your] **[Country]** [Masters]" — country/degree name in the campaign's hero highlight treatment. Often paired with a fast-fact subtitle line ("Admit in 14 Days ⚡", "where BMW, Bosch & Siemens hire from") |
| **2. Proof** | Credibility — logos OR bullet stats | 7 of 9 | Either (a) 4 partner logos building into a 2×2 grid, or (b) a stacked bullet/pill list of USPs/stats (2–5 lines) |
| **3. Benefits checklist** | A near-identical reusable "Get: / Check:" 3-item checklist (Admit Eligibility / Top Jobs After Graduation / Expenses & Earnings) | Dubai A, Dubai Masters, Singapore Masters (near-verbatim across all three — this looks like a shared reusable template block) | Sequential bullet build, sometimes with animated toggle-switch UI (Singapore Masters) |
| **4. Product shot** | Full-bleed app screen-recording | Ireland, New Zealand only | Replaces background footage entirely for ~3–5s |
| **5. CTA** | Closing card, always last | All 9 | Solid color pill/button, bold text, fades or blur-pops in, holds static to the end |

Beats 2–4 are mutually exclusive-ish in practice (no campaign combines logos + checklist + product shot all three) — the automation should let the user's inputs determine which of these appear (e.g., logos supplied → beat 2a; no logos but a bullet list of facts → beat 2b; product shot supplied → beat 4 replaces 2/3).

---

## 3. Typography & highlight system

- **Body copy**: bold sans-serif (Montserrat-like), white, sentence case, left-aligned, upper-third of frame, consistent ~2–8% left margin.
- **Hero word (country/degree name)**: rendered in a *separate* decorative cursive/script typeface, with an animated gold/orange/red gradient shimmer sweep — the single strongest, most consistent highlight device across campaigns (Germany, Dubai, Ireland, Singapore Masters all use some variant).
- **Highlight techniques observed (catalog — not one single universal style, varies by campaign/moment)**:
  - Gradient-shimmer script font on the hero word (most common)
  - Solid color pill/badge behind a whole phrase (e.g. "2026 Intake — Now Open", "where BMW... hire from")
  - Flat color swap only, no container (e.g. green "Ireland", yellow "Across Universities")
  - Individual bullet/chip pills, one per benefit line (Germany's 4 USP cards, Singapore's 5 benefit pills, the "Get:/Check:" checklist)
  - Underline + emoji accent (Ireland's "Admit in 21 Days" + ⚡)
- **Entrance animation**: predominantly opacity fade, word-by-word or line-by-line sequential build. Occasional typewriter reveal (Ireland, Singapore) and blur-to-sharp "focus pop" (Ireland/Dubai CTAs). No slide-ins observed as a house style. One bar-wipe transition style seen once (Germany beat 1→2).
- **Exit**: text is rarely explicitly faded out — mostly just replaced/covered by the next beat, or persists until a hard cut removes it.
- **Consistent scrim**: a dark gradient overlay across the top ~40% of frame on every shot, for legibility — present in every campaign, every shot.

---

## 4. Footage rules

- Hard cuts only — no crossfades, no whip-pans, no zoom-transitions, ever observed.
- Average shot length: ~2–4 seconds. Camera is mostly locked-off; motion energy comes from traffic/pedestrians/water in-shot, not camera movement.
- Shot selection is always country-landmark-led: Reichstag/Berliner Dom (Germany), Burj Khalifa/Marina/Museum-of-the-Future-style monument (Dubai), castle/tram/cathedral (Ireland), Marina Bay Sands/Merlion/Gardens by the Bay (Singapore), coastal/city (NZ).
- Dark top-gradient scrim on every shot for text legibility.
- **This directly affects our Pexels sourcing strategy**: bias search queries toward recognizable landmarks and calm establishing/architectural shots, not toward "fast/hyperlapse/high-energy" — that was our original assumption and the footage doesn't support it.

---

## 5. Logos

- **No persistent brand/company logo in any sample.** Only third-party partner logos (employers or universities), confined to one "proof" beat, appearing sequentially into a static 2×2 grid, then gone for the rest of the video.
- If the user supplies university/college logos, they should populate this one proof-beat grid (max 4 observed in any sample), not appear throughout the video.
- **Open question for you**: should our automated pipeline still place a persistent Leap/company logo somewhere (e.g. because it exists in these ads outside our sample, or because you want it going forward even though the samples don't show it), or should we match the samples exactly and only show partner logos when supplied?

---

## 6. CTA system

- Always a solid-color rounded pill/button, bold (often italic) white or gold text, two-tone color split common (white + yellow/gold).
- Entrance: fade-in or blur-to-sharp pop.
- Holds static, unchanged, to the final frame — never pulses/loops once settled.
- Position: left-aligned; usually upper-third/top-left like the rest of the copy, but 2 campaigns (Dubai Masters, Dubai A in wide ratios) shift it to vertical-middle instead.

---

## 7. Decisions (resolved with user, 2026-07-10; #1 reversed 2026-07-13)

1. **Company/country logo**: ~~Persistent placement~~ **Reversed 2026-07-13: no persistent country/brand logo.** Originally decided to place a persistent corner-anchored country logo per the brief, overriding the observed absence in all 9 samples. After seeing it rendered (as a flag image) against real reference frames, the user asked to remove it entirely rather than just restyle it — bringing this in line with what every sampled campaign actually does (no persistent brand/company mark anywhere). College/university logos still populate the one proof-beat grid as observed, and now render as their own centered block rather than left-aligned with body copy (see decision below and SKILL.md).
2. **Proof-beat logo grid alignment**: **Centered on the true frame center (50%)**, not left-aligned with the rest of the body copy — a deliberate departure from the sampled campaigns (which show it left/bottom-anchored) per direct user feedback. Sized narrow enough (68% width) that its right edge still clears the reel-icon safe zone while staying genuinely centered — an earlier pass centered it within a safe-box carve-out instead of the real frame, which visibly drifted it left; the user corrected this to "center to frame, not to the pill/text above."
3. **Hook + logo-proof beat**: render as one continuous on-screen block — the logo grid builds up directly under the still-visible hook headline/subtitle (matching germany_a's Act 1 and singapore_b's Slide 2) rather than swapping to a disconnected new frame. Only applies when proof.mode is "logos"; a bullets-mode proof still renders as its own separate beat.
4. **Checklist + CTA beat**: also merged into one on-screen block when there's no product shot between them — the CTA pill appears centered directly beneath the checklist bullets in the same frame, rather than popping up over an unrelated new background shot.
5. **Checklist items**: rendered as real bullet points (✓ marker), not plain stacked lines.
6. **Instagram Reels safe zone**: content must respect Meta's published safe area for a 1080×1920 canvas — top ~13%, bottom ~18%, right ~15% (like/comment/share icon column), left ~6%. All text/logo/CTA sizing and positioning should fill this real box, not an arbitrary guess.
7. **Square (1:1) export technique**: **Blur-pillarbox everywhere** (standardize on the dominant pattern, not Singapore Masters' one-off center-crop).
8. **Footage pace**: **Match the samples** — calm, landmark-led, hard cuts every 2–4s, mostly static/locked-off shots. Do not source "fast/hyperlapse" footage as originally briefed; that would be off-brand vs. what these ads actually do.
9. **Beat selection logic**: **Dynamic.** The skill assembles beats (hook → proof [logos or bullets] → checklist → product shot → CTA) based on what inputs the user actually provides for that video, not a rigid fixed sequence.
10. **"Benefits checklist" beat**: still open — not yet decided whether to make this a reusable template block with default wording. Revisit when building the copy-input phase of the skill.

---

## 8. Technical stack (researched, ready to use when we build)

- **Rendering/compositing**: [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML/CSS/JS → MP4, agent-native, ships Claude Code skills). Confirmed exact setup commands, composition/timing model, GSAP-based seek-safe animation pattern, the exact catalog component (`caption-highlight`) that matches our "highlighted word" style, and the recommended pattern for one shared style template rendered at 3 fixed canvas sizes (1080×1920 / 1080×1080 / 1920×1080) via thin per-ratio host files + shared variable-driven sub-composition.
- **Stock footage**: Pexels Video API (`/v1/videos/search`, `orientation` param maps directly to our 3 ratios). No motion/pace metadata exists in the API — dynamic footage has to come from compound search queries ("Germany aerial drone city") plus post-download frame-diff/optical-flow scoring, not from a filter. Commercial use requires no attribution.
- **Footage scoring/selection**: Gemini API, `gemini-2.5-flash-lite` (cheapest current vision+video model, ~$0.10/$0.40 per M tokens) via `generateContent` (not the newer Interactions API, which lacks the custom-fps/clip-offset controls we need). Cost is negligible (~cents per country).

Full technical detail for all three is preserved in the research agent outputs from this session and will be pulled into the skill's reference docs when we build.

---

*Per-campaign frame-accurate timelines (exact timecodes, verbatim copy, positions) live in the individual `*_findings.md` and `*_aspect_ratio_comparison.md` files alongside this document.*
