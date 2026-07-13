# Aspect Ratio Comparison — "Singapore NVO Masters - 27 may"

Baseline: `singapore_b_9x16_findings.md` (1080×1920, native/master edit).
Compared against: 16:9 (1920×1080, 368 frames / 18.39s) and 1:1 (1080×1080, 368 frames / 18.39s), both reviewed frame-by-frame across all 23 contact sheets each.

**Headline finding: all three ratios are the same single master edit (identical footage, identical copy, identical timecodes, identical UI animation) reframed three different ways. Nothing was re-shot, re-timed, or re-worded. The only differences are how the native 9:16 canvas is fit into the wider/squarer canvases.**

---

## 1. Background stock footage — identical across all 3 ratios, different fit treatment per ratio

Confirmed: **same 5 shots, same order, same hard-cut timecodes (5.60s / 11.55s / 13.20s / 14.80s)** in both 16:9 and 1:1 as documented for 9:16 (night CBD skyline → skyscraper+palm tilt → Merlion → park/bougainvillea walkway → glass-dome waterfall). No re-shot or alternate-take footage in either alternate ratio.

The **pillarbox-with-blurred-fill pattern is confirmed for 16:9**, matching the 2 other campaigns where this was found:
- The 9:16 source video is placed unscaled/uncropped in the horizontal center of the 1920×1080 canvas (occupying roughly the middle ~31% of the frame width).
- The left and right padding bars are filled with a **heavily blurred, zoomed/scaled duplicate of the same source footage** (not a solid color, not black bars) — visible in every 16:9 sheet as a soft, warm-toned, mirrored/tiled blur texture that shifts with the underlying scene (night skyline colors in the blur during shot 1, greenery/blue-glass tones during the dome shot, etc.). The blur fill updates per-shot along with the sharp center content, confirming it's a live blurred copy of the same footage, not a static background plate.

**1:1 uses a different technique: center-crop (cover-fit), not pillarbox/blur.** The 9:16 source is cropped top-and-bottom (no left/right cropping, since source width already matches or nearly matches the square width) to fill the 1080×1080 frame edge-to-edge. No blurred padding appears anywhere in the 1:1 version — it's a straightforward vertical crop of the same footage, always showing the same horizontal framing as the 9:16 master but with less vertical extent visible (e.g., less sky/water visible above/below the Merlion, tighter view on the skyscraper-tilt shot).

Why the two techniques differ: 9:16 (0.56 aspect) is much narrower than 1:1 (1.0), so simply cropping top/bottom to fill a square works without needing to invent new picture content. But 9:16 is far narrower than 16:9 (1.78), so filling 16:9 by scaling the source to full height leaves huge empty side gaps that must be padded — hence the blur-fill treatment only shows up in 16:9, not 1:1.

## 2. Text/copy blocks and university logo grid

**Content, wording, and timing are 100% identical** across all three ratios — every line ("Get Your" / "Singapore" / "Masters" / "Admit in 21 Days ⚡" / "2026 Intake" / "Now Open 🇸🇬" / "Get Shortlist Across Universities Like" / logo reveal order JCU→NUS→SMU→Curtin / "Check:" / checklist items) appears at the exact same frame-indices in all three exports. No re-wrapping, re-wording, retiming, or restyling of any copy line.

What changes is purely a function of the crop/fit technique above, since text is baked into the same master composite that gets reframed:

- **9:16 (baseline)**: text sits at its "native" scale — left margin ~5% of frame width, "Get Your"/"Singapore"/"Masters" block occupies roughly the left half of frame width.
- **16:9 (pillarboxed)**: because the whole 9:16 composite (text included) is placed unscaled in the center ~31%-width column, all text is **visually much smaller relative to the full 16:9 frame** — it reads as a narrow strip of text-plus-footage in the middle of a wide letterboxed canvas, with the blurred pillars carrying no text at all. Font size in absolute pixels is unchanged from 9:16; only its proportion of the total canvas shrinks.
- **1:1 (center-cropped)**: because cropping is vertical-only and the frame width equals the source width, text keeps the **same absolute pixel size and same horizontal margins** as 9:16, so relative to the (smaller, square) frame it actually reads **larger/bolder** than in 16:9, and roughly the same relative size as it did in 9:16. No horizontal re-wrapping was needed anywhere.
- **Vertical position**: because 1:1 crops top and bottom, text that sat safely within the upper third of the 9:16 frame is pushed proportionally closer to the top edge of the 1:1 square (less headroom above it), and the CTA / checklist rows sit proportionally closer to the bottom edge (less footroom below).

**University logo grid**: identical 2×2 arrangement (top row JCU | NUS, bottom row SMU | Curtin) and identical reveal order/timing in all three ratios. Because the logos are baked-in graphics at fixed absolute pixel size:
- In 16:9 they appear small, tucked into the narrow center pillarboxed column.
- In 1:1 they appear noticeably larger relative to the frame — the 2×2 card grid occupies roughly 40–45% of the square's width, versus a much smaller fraction of the 9:16/16:9 frame width, simply because the square canvas is smaller in absolute terms than the pillarboxed 16:9 canvas while the logo cards keep the same pixel dimensions.
- No re-arrangement (still 2×2, same bottom-left-ish safe zone position relative to the visible footage column) in any ratio.

## 3. Animated eligibility-checklist UI (toggle switches)

**Layout, size, and position do not adapt — it is the same fixed-pixel graphic composited at the same absolute location/size in all three ratios**, just subject to the same crop/pillarbox treatment as everything else:
- Same "Check:" label, same 3 rows (Admit Eligibility / Top Jobs After Graduation / Expenses & Earnings), same numbered purple badges, same empty-circle → sequential toggle-ON animation (~13.6s, 13.8s, 14.0s), same lavender pill rows, same background cuts underneath it (Merlion → park walkway → dome).
- In 16:9 it sits inside the narrow center column, so relative to the whole wide frame it looks small and centered rather than "upper-left" the way it visually reads in 9:16.
- In 1:1 it keeps the same left-margin position and absolute size as 9:16, so relative to the smaller square canvas it appears proportionally larger and sits closer to the vertical center of the frame (since some headroom above it was cropped away).
- No stretching, restacking, or re-scaling of the pill rows themselves was observed in either alternate ratio — the checklist graphic is treated as a single rigid overlay, not a responsive component.

## 4. CTA

Identical text ("Check Your" / "Admit Eligibility Now"), identical solid-blue-pill styling, identical white/yellow two-line color split, identical timing (~17.40–18.39s, holds to end) in all three ratios. Positioning is, again, just the same fixed absolute-pixel placement (lower-left of the source composite) carried through whatever crop/pillarbox is applied — no ratio-specific repositioning, resizing, or restyling of the CTA button.

## 5. Safe-area / margin rule

There is **one true safe-area rule, and it's defined relative to the 9:16 master canvas, not the delivered aspect ratio**:
- All text, logos, checklist UI, and CTA are composited once at fixed pixel positions/sizes on the 1080×1920 master.
- For 16:9 delivery, that master is centered horizontally in the wider canvas and the gaps are filled with blurred footage — content margins from the *master's own edges* stay constant (~5% left safe margin, as in the baseline notes) but become a much smaller (~1.6%) fraction of the full 16:9 canvas width.
- For 1:1 delivery, the master is cropped vertically (top/bottom), so horizontal margins are pixel-for-pixel identical to the 9:16 baseline (~5% left) but vertical margins shrink because the total frame height available is smaller.
- There is **no independent "X% safe margin per aspect ratio" design** — it's a single 9:16-authored composite reframed two different ways (pillarbox+blur for wider, crop for narrower/equal), which is the standard low-effort ad-ops approach when a template wasn't built mobile/square/landscape-natively from the start.

## 6. Elements appearing/disappearing/repositioned to avoid cropping

- **No element is fully cropped out or newly added in either alternate ratio.** Every text block, the full logo grid, the full 3-row checklist, and the full CTA are all visible in both 16:9 and 1:1 — nothing falls outside the visible/sharp content column.
- **Vertical crop in 1:1 tightens headroom/footroom** around the topmost line of each slide ("Get Your"/"Get"/"Check :") and the bottommost element (checklist row 3 / CTA bottom edge), but no line of text or UI row is actually clipped in the frames sampled — the design's existing ~15–20% top/bottom buffer in the 9:16 master absorbed the crop without cutting content.
- **Background subjects are cropped more aggressively in 1:1** than in either 9:16 or the pillarboxed 16:9 (e.g., in the park-walkway shot, the passer-by and the child on the kick-scooter are framed tighter / partially cut off in 1:1 versus fully visible in 9:16/16:9) — this is a footage-framing side-effect of the vertical crop, not a graphic/UI repositioning.
- In 16:9, nothing is cropped at all (the full master frame is visible, just shrunk into the center column) — the tradeoff there is wasted/blurred canvas space on the sides rather than any content loss.
