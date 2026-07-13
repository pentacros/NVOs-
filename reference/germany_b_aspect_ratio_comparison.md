# Aspect Ratio Comparison — "Germany NVO version B"

Baseline: 9:16 findings at `germany_b_9x16_findings.md` (1080x1920, 225 frames, 11.26s).
Compared against: 16:9 (1920x1080, 225 frames, 11.26s, sheets 1–15) and 1:1 (1080x1080, 224 frames, 11.22s, sheets 1–14). All sheets for both ratios reviewed frame-by-frame at 20fps.

Timeline (shots, cuts, copy beats) is identical across all three ratios — same 3 stock-footage shots (Reichstag → Heidelberg Karlstor → tram square), same 2 hard cuts at the same relative timecodes, same 4 text blocks (Germany Masters/At ₹0 Tuition → Get into Top Public Universities with ₹0 tuition-fees + 4 logos → Only €300/semester / For Indian students / No exceptions → Get your Personalised Germany University Shortlist CTA), same word-by-word progressive-build animation. Only the framing/composition changes.

## 1. Background stock footage: pillarbox with blurred-fill — CONFIRMED

Yes — this is the same pillarbox-with-blurred-fill pattern seen in the two other campaigns. The underlying footage is the **native 9:16 vertical clip**, unchanged and uncropped in content, reframed identically in both non-vertical ratios:

- **16:9 (1920x1080)**: The vertical 9:16 footage is placed as a centered vertical strip (roughly 630px wide on a 1920px-wide canvas, i.e. the strip itself is still ~9:16 proportioned), and the left/right remainder is filled with a heavily blurred, upscaled/zoomed duplicate of the same footage (same shot, same frame content, just Gaussian-blurred and stretched to cover the full 1920x1080 canvas behind the sharp center strip). The blur-fill visibly shows the same building/colors as the sharp strip (e.g. blue sky, Reichstag stonework, Heidelberg gate's red/white/yellow palette, tram square's cream tones) — it is a duplicate/zoomed copy of the same footage, not a different clip or a solid color/gradient.
- **1:1 (1080x1080)**: Same treatment — the sharp vertical strip is centered (roughly 700px wide on the 1080px square canvas) with blurred/zoomed duplicate footage filling the left and right bands.
- No new camera angles, no re-shot footage, no alternate B-roll — all three ratios use exactly the same 3 shots, same in/out points, same cut timing. The only difference is how much of the canvas is "real" sharp footage vs. blurred fill.

This confirms the pattern already found in 2 other campaigns: one native vertical (9:16) capture is the master asset, and the 1:1/16:9 deliverables are produced by pillarboxing it centrally with a blurred-zoom duplicate as side/edge filler, rather than re-cropping or re-shooting content.

## 2. Text/copy blocks

**Content, timing, highlight styling: identical.** Verbatim copy, phrase-by-phrase build order, hold durations, and all three highlight treatments (paint-swipe red-on-white for Slide 1 headline, solid indigo pill for sub-line/Slide 2/Slide 3, bold-vs-italic weight contrast for "Universities", yellow-vs-white color swap for the CTA) are unchanged across all three ratios.

What changes is purely **layout, and only insofar as the text sits inside the vertical sharp-footage strip, not spread across the full frame width**:

- **Position (vertical)**: Same relative vertical position within the strip as in 9:16 — headline near top, pills stacking below in the same order, CTA lower-left within the strip. Because the strip itself is a vertical 9:16-proportioned rectangle sitting in the middle of the wider/taller canvas, the text's position *relative to the sharp footage* is essentially unchanged; its position *relative to the full 16:9/1:1 canvas* is compressed toward the horizontal center.
- **Horizontal margins**: Text/pill blocks are confined to the width of the sharp center strip — they do NOT expand to use the extra width available in 16:9 or 1:1. Left margin inside the strip looks consistent with the 9:16 version's ~5% rule (mapped to the strip's own width, not the full canvas width). This means in 16:9 there is a large amount of unused blurred-background space to the left/right of the text block — no text ever bleeds into or repositions within the blurred zone.
- **Font size relative to full frame**: Because the sharp strip is narrower than the full 16:9/1:1 canvas, the same absolute pill/text sizing (which was sized relative to the 9:16 strip) now reads as a *smaller* proportion of the overall frame in 16:9 and 1:1 — e.g. "Germany Masters" occupies visually less of the total canvas width in the 16:9 version than in the 9:16 version.
- **Line-wrapping/line-count**: Unchanged — same line breaks (e.g. CTA still wraps "Get your Personalised" / "Germany University Shortlist" / "Shortlist" across the same number of lines) since the text box width matches the strip width in every ratio, not the ratio's full width.

In short: the text graphics appear to have been composited once (matching the 9:16 comp) and then that whole composite (footage + text) was pillarboxed/padded outward — text was not independently re-laid-out or re-scaled to take advantage of the wider canvas.

## 3. Logos / university crests

No change in relative position or size versus the sharp footage strip. The 2x2 grid (TUM top-left, Universität Heidelberg top-right, Goethe Universität bottom-left, LMU München bottom-right) appears at the same point in the timeline, same stacking/reveal order, same size relative to the text block above it, in all three ratios. Like the text, the logo grid is confined to the width of the sharp vertical strip and does not expand into the blurred side bands in 16:9. No additional or different logos appear; no logo is cropped or repositioned to avoid frame edges — because it never approaches the true frame edges in the wider ratios (blurred fill absorbs that space).

## 4. CTA

Same story: "Get your Personalised Germany University Shortlist," same position (lower-left within the strip), same white/yellow color split, same fade timing, same line wrapping — unchanged in position/sizing relative to the footage strip across 9:16, 1:1, and 16:9. In 16:9/1:1 it simply sits inside the narrower central band with blurred fill on either side rather than spanning wider.

## 5. Safe-area / margin rule

The consistent rule is: **all text/pill/logo graphics are confined to the boundaries of the native vertical (9:16-shaped) footage strip, regardless of final export ratio.** Within that strip, the same ~5% left margin / ~3–5% top margin rule from the 9:16 baseline holds in all three ratios (since the strip's internal composition is identical). There is no separate safe-area logic that widens margins or repositions elements for 1:1/16:9 specifically — the "safe area" is effectively the sharp-footage strip itself, and everything outside it (the blurred pillarbox fill) is treated as pure background, never used for text.

## 6. Elements appearing/missing/repositioned between ratios

None. Every element present in the 9:16 version (3 footage shots, Slide 1 paint-swipe headline + pill, Slide 2 italic/bold headline + pill + 4 logos, Slide 3 three stacked pills, CTA box) appears in identical form, order, and timing in both the 1:1 and 16:9 versions — nothing is added, dropped, or cropped out. The sole structural difference across ratios is the addition of blurred-fill pillarboxing on the sides (16:9) or left/right bands (1:1) to pad the native vertical footage+text composite out to the target aspect ratio, with no independent re-layout of text, logos, or CTA for the wider canvases.

## Summary for rebuild

To reproduce this campaign programmatically in all 3 ratios:
1. Render the full 9:16 composite (footage + text/logo/CTA overlays) once, exactly as documented in the 9:16 findings.
2. For 1:1 and 16:9 exports, do NOT re-lay-out text/logos/CTA for the new canvas. Instead: place the 9:16 composite as a centered vertical strip, and fill the remaining canvas area on the left/right with a heavily blurred, upscaled duplicate of the same underlying footage (same shot/timecode as the sharp strip, just blurred and zoomed to cover the full canvas).
3. No alternate camera framings, no additional/removed elements, no independent scaling of text relative to the new canvas width — the strip's internal proportions and all overlay positioning stay pinned to the original 9:16 layout logic.
