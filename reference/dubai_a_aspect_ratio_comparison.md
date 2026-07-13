# Dubai NVO A — Aspect Ratio Comparison (9:16 baseline vs 1:1 vs 16:9)

Source files reviewed: `dubai_a_16x9` (1920x1080, 289 frames/14.43s) and `dubai_a_1x1` (1080x1080, 289 frames/14.43s), all 19 contact sheets each, cross-checked frame-by-frame against the 9:16 baseline (`dubai_a_9x16_findings.md`).

**Headline conclusion: the 1:1 and 16:9 versions are not independent edits — they are the exact same 9:16 master (same footage, same cuts, same copy, same timing, same logo/CTA sequence) embedded as a native vertical column in the middle of the wider canvas, with the sides filled by a heavily blurred/zoomed duplicate of the same footage (pillarbox-with-blurred-fill). This confirms the pattern found in the 2 other campaigns.**

---

## 1. Background stock footage

**Identical across all 3 ratios — same 7 shots, same order, same cut timecodes, same color grading.** Verified shot-for-shot against the 9:16 timeline:

| Timecode | Shot (all 3 ratios match) |
|---|---|
| 0.00s | Dubai Marina dhow/UAE flag, teal grade |
| ~1.70s | Grey aerial cityscape / golf course |
| ~3.70s–4.05s | Sheikh Zayed Road dusk, Burj Khalifa silhouette |
| ~6.60s | Brief marina cutaway |
| ~6.90s | Burj Khalifa low-angle tilt |
| ~9.75s | Dubai Frame monument through palms |
| ~13.20s | Aerial daytime JLT/Marina corridor (final CTA plate) |

**Confirmed: pillarbox with blurred-fill treatment**, exactly as seen in the two other campaigns already audited:
- The native footage is the same vertically-oriented (9:16-ish) crop used in the 9:16 master, kept centered in the 16:9 and 1:1 canvases.
- Left and right of that native column, the same footage is duplicated, heavily blurred and scaled up, filling the remaining canvas width so there is no hard black bar — it reads as a soft, out-of-focus continuation of the same scene.
- This holds for every one of the 7 shots in both the 16:9 and 1:1 versions — no shot is reframed/re-cropped differently or swapped for alternate footage; it's a mechanical pillarbox pass over the same source.
- The native column is proportionally wider in 1:1 (squarer canvas, less extreme aspect gap to fill) than in 16:9 (where the blurred side panels are much larger since 16:9 is the widest target).

## 2. Text / copy blocks

- **Content**: word-for-word identical across all 3 ratios — same 3 slides ("Indian Students in Dubai Can / Work Part-Time While Studying", "Earn While / You Learn in Dubai 💰" + 3 bullet pills, "Top Global / University Branches" + 4 logos), same tag pill, same final CTA text.
- **Timing**: identical entrance cues frame-for-frame (word-by-word build ~0.60–1.15s, slide cut ~4.05s, bullets at ~6.20s/6.55s/6.95s, slide cut ~9.75s, logos at ~10.30/11.15/11.55/11.95s, clean plate + CTA ~13.20–13.40s). No re-timing for either alternate ratio.
- **Highlight styling**: identical — white first line / lime-green second line, gold serif "Dubai," blue stadium pills with checkmark/flag/money emoji, same drop shadows.
- **Line-wrapping / line count**: identical — no slide re-wraps differently; "Zero Income Tax on / What You Earn" still wraps to 2 lines in both alternate ratios exactly as in 9:16.
- **What changes — size and margins relative to the FULL frame**: because the text is baked into the native embedded column (not repositioned or rescaled to the new canvas), its size and left margin are fixed relative to that column, not to the overall frame. Practical effect:
  - In **16:9**, the text/pills occupy only the left ~35–40% of total frame width and sit inside a visibly narrow strip on the left-of-center — a large blurred dead zone exists to the right, and an equally large blurred zone on the far left before the text even starts. The text reads much smaller relative to the full 1920-wide canvas than it did relative to the 1080-wide 9:16 frame.
  - In **1:1**, the same effect exists but is less extreme since the canvas is squarer — the text sits in a somewhat wider proportion of the frame than in 16:9, but still clearly indented from the true left edge by a blurred margin, and confined to the upper portion of the (shorter, since it's 1:1 vs 1920-tall) native column.
  - **Vertical position**: unchanged relative to the native column — headlines still sit in the top ~5–35% of that column's height in both ratios, matching the 9:16 baseline's relative placement.

## 3. Logos / university crests

- Same 4 logos (Heriot-Watt, Middlesex, De Montfort Dubai, University of Birmingham Dubai), same 2×2 grid arrangement, same entrance order/timing (10.30/11.15/11.55/11.95s), same white-card-blue-border styling.
- Position/size **do not change relative to the native footage column** — they sit directly beneath the "Top Global / University Branches" headline, upper-left of that column, in all 3 ratios. Because the column itself is pillarboxed rather than the frame being reflowed, the logos end up occupying a small block in the left-center area of the 16:9/1:1 canvas rather than being resized or repositioned to use the extra horizontal space.

## 4. CTA

Two CTA-style elements, same as baseline:

- **Mid-video tag ("And Most Don't Even Know It")**: position unchanged across all 3 ratios — top of the native column, same spot as the headline block, in both 16:9 and 1:1.
- **Final CTA ("TALK TO A STUDY ABROAD EXPERT NOW!") — the one notable positioning difference found:**
  - In the 9:16 baseline, the final CTA appears **upper-left**, the same location as every other headline/pill in the video.
  - In **both** the 16:9 and 1:1 versions, once the video cuts to the clean final daytime plate (~13.20s) and the CTA pill fades/pops in (~13.40s), it appears **vertically re-centered — roughly mid-height of the native column** rather than pinned to the top, while remaining left-aligned within that column. This is consistent across both alternate ratios (not a one-off render artifact), and holds static through end of video.
  - This is the only element in the whole video whose vertical placement differs from the 9:16 master; every other text/pill/logo entrance keeps the same relative position across all 3 ratios.

## 5. Safe-area / margin rule

- There is a consistent rule, but it is defined **relative to the embedded native (9:16-shaped) footage column, not the full delivered frame**. All text, pills, and logos sit at the same left-margin fraction and same top-margin fraction of that native column in all 3 exports.
- Because the wider canvases are not re-flowed/rescaled to fill the frame, this means the *effective* safe margin from the true left/top/right edges of the 16:9 and 1:1 canvases is much larger and inconsistent with a "same % from each edge regardless of ratio" rule — e.g. in 16:9 there is a huge blurred dead zone (~30%+ of frame width) on both sides that no text ever touches, whereas in 9:16 text sits close to the true left edge (~2–3%). So: safe-area is consistent **relative to the native footage crop**, but **not** consistent as a percentage of the final delivered canvas across ratios — a rebuild would need to decide whether to keep this "logo-in-a-window" pillarbox approach or properly reflow text/logos to use the full width in 16:9/1:1.

## 6. Elements appearing/disappearing or cropped across ratios

- No element appears in one ratio and not another, and nothing is cropped out of frame — because the native content column is simply inset within a larger blurred canvas rather than being cropped tighter, all text, pills, logos, and footage subjects that are visible in 9:16 remain fully visible (just proportionally smaller within the total frame) in both 16:9 and 1:1.
- The only structural change identified is the final CTA's vertical re-centering (see Section 4) — everything else is a direct, unmodified reuse of the 9:16 edit with a blurred-fill pillarbox added around it.

---

## Summary for rebuild purposes

This Dubai NVO A campaign was **not independently re-cut or re-composed** for 1:1 and 16:9 — production simply took the finished 9:16 edit and pillarboxed it with a blurred/zoomed duplicate of the same footage filling the sides, without repositioning or rescaling any text, pill, or logo to take advantage of the extra canvas width. The single deliberate adjustment made per-ratio is re-centering the final CTA pill vertically for the two wider formats. When rebuilding this template programmatically, the simplest faithful reproduction is: (1) render the 9:16 composition once, (2) for 1:1/16:9 outputs, composite that same 9:16-cropped footage+overlay stack centered in the wider canvas over a blurred/scaled duplicate background, and (3) apply the one exception — nudge the final CTA pill to vertical-center instead of top-anchored — for both non-9:16 deliverables.
