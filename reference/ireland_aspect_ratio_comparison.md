# Ireland NVO — "18th May Shortlist" — Aspect Ratio Comparison (9:16 baseline vs 1:1 vs 16:9)

Source clips: `ireland nvo 18th may - Ireland shortlist 9 by 16.mp4` (baseline, previously analyzed), plus 16:9 (1920x1080) and 1:1 (1080x1080) versions of the same campaign. All three run ~11.22s / 224 frames @ 20fps and share identical timecodes/cut points (castle 0.00–1.55s → tram street 1.60–3.40s → Shanghai skyline 3.45–5.60s → app screen-recording insert 5.65–8.70s → coastal road 8.75–11.22s).

Baseline reference: `/private/tmp/claude-502/-Users-aniketrajput/f34ace9c-1c93-4b8e-add0-ea0c0b7344ab/scratchpad/nvo_analysis/ireland_9x16_findings.md`

---

## Master finding: this is a single 9:16 "master" composition re-hosted inside wider canvases

Every non-app-UI segment in both the 1:1 and 16:9 versions is built by taking the *exact same native-vertical footage and text layer* used in the 9:16 master, scaling it down only enough to fit the target canvas's height, and padding the empty left/right space with a **blurred, zoomed-in duplicate of that same clip** ("pillarbox with blurred fill"). The sharp, in-focus vertical strip sits centered in the frame; the blurred side-fill is clearly the same footage (same castle stonework/greens, same tram-street grays, same Shanghai neon colors, same coastal green/red-road tones bleeding into the pillar), just heavily gaussian-blurred and scaled up. This is the identical pattern seen in the two other campaigns already audited — **confirmed, not denied**, for this campaign too.

- 16:9: pillars are wide (canvas is much wider than tall relative to the 9:16 content, so the inner sharp column occupies roughly the middle third of the frame width).
- 1:1: pillars are narrower (canvas is closer to square), inner sharp column occupies roughly the middle 65-70% of frame width.
- The **app screen-recording product-shot segment is the one exception** — see §3.

---

## 1. Background stock footage — identical across all 3 ratios, confirmed pillarbox-with-blur

- Same four background plates, same order, same hard-cut timing: castle/fortress hillside → European tram street → Shanghai skyline push-in → (app UI takeover) → coastal hillside road.
- No new/different clips introduced in either alternate ratio; no re-shot or re-framed-from-source footage — it's a direct scale + blur-pad of the 9:16 master plate.
- The small dark aircraft/blimp silhouette fixed in the Shot 4 sky is present and in the same fixed position in both 1:1 and 16:9, confirming it's baked into the source clip and simply carried through the pillarbox treatment.
- Top vignette/gradient over Shots 1–3 (for headline legibility) is preserved inside the sharp inner column in both ratios; it is not extended into the blurred pillars.

## 2. Text/copy blocks — content, timing, and highlight styling identical; only relative screen real-estate changes

- Verbatim copy, build order, and timing are frame-identical to the 9:16 baseline: `Planning Masters in` / `Ireland` (script highlight) / `for 2026? 🇮🇪` (yellow) typewriter-builds 0.05–1.55s; `GET YOUR` `[SHORTLIST]`(green pill) `in` `[60]`(red pill) `secs` builds 1.50–3.60s and holds to 5.60s.
- Highlight styling is pixel-for-pixel the same system: script-font swap for "Ireland," yellow color + flag emoji for "for 2026?," green rounded pill for "SHORTLIST," red rounded pill for "60."
- Line-wrapping/line count is unchanged (3-line headline stack, then the GET YOUR/SHORTLIST/in 60 secs stack) — because the text is literally the same rendered layer from the master, not re-flowed for the new canvas.
- What changes is only the text's **share of total frame width/area**: since the sharp vertical column is narrower relative to the full canvas in 16:9 than in 1:1, the same headline occupies a noticeably smaller percentage of total frame width in 16:9 (~30-33% of full width) than in 1:1 (~65-70%) or 9:16 (~100%, edge-to-edge). Absolute left-inset margin and vertical position within the vertical column are unchanged in all three — the "safe column" itself just gets reframed inside a wider or narrower matte.
- No re-centering, no repositioning to top/middle-third differently — the whole headline/CTA block stays upper-left inside the sharp column in all three ratios.

## 3. Product-shot segment (app screen-recording, 5.65s–8.70s) — the one segment that does NOT get the blur-pillarbox treatment

This is the key divergence in the whole comparison, and it makes sense given the source content is a phone-shaped app recording, not stock b-roll:

- **9:16 (baseline):** full-bleed, edge-to-edge, replaces the entire frame — no padding at all.
- **16:9:** the portrait UI recording is scaled down (fit-to-height) and presented as a **small, centered card floating on a plain light/white flat background** — not a blurred-video pillarbox. The left/right "pillars" here are flat neutral fill (looks like white/very light gray), not a blurred zoom of the app screen. This reads as a deliberate choice: blurring a screen-recording (with legible small text/buttons) would look broken/illegible, so the treatment swaps from "blurred b-roll fill" to "plain card-on-white" specifically for this segment. The card occupies maybe the middle 35–40% of the 16:9 frame's width.
- **1:1:** the same portrait UI recording is scaled up much closer to fill height, leaving only thin margins left/right (plain, not blurred) — because a 1:1 canvas is much closer to the app's native portrait proportions than 16:9 is, so far less side padding is needed. The UI content (onboarding form → "2x more offers" loading stat → scrolling Ireland-shortlist card list with the blue "Get Shortlist Across Top Irish Universities" banner and Trinity/UCD/UCC cards) is unchanged frame-for-frame across all three ratios — same screens, same order, same on-screen copy, same LeapScholar top bar.
- Net effect: the app-UI segment "letterboxes to a neutral card" rather than "pillarboxes with blur," and how much padding it needs scales inversely with how close the target ratio is to portrait (9:16 = none, 1:1 = minimal, 16:9 = substantial).

## 4. CTA — positioning/sizing

- Mid-video CTA copy ("GET YOUR SHORTLIST in 60 secs" with green/red pills): same relative position (top area, left-aligned) inside the sharp vertical column in all three ratios; only its share of total canvas width changes as described in §2.
- Final CTA ("GET YOUR SHORTLIST NOW!," ~9.00s–end): same blur-to-sharp "focus pop" entrance timing and same left-of-center / vertically-mid position *within the sharp vertical column* in all three ratios. Because that column is narrower in absolute frame-% terms in 16:9, the pill reads as a smaller, more centrally-placed object in the wide frame; in 1:1 it reads as a larger, more clearly left-anchored object. No new CTA treatment, no resizing of the pill relative to the column, no repositioning logic beyond "same column, different matte width."

## 5. Safe-area / margin rule

Yes — a consistent rule is evident, but it's defined relative to the **inner 9:16 content column**, not the outer canvas:
- The whole 9:16 composition (footage + text layers) is treated as a fixed master asset.
- For each target ratio, that master is scaled uniformly to match the target canvas's height, then horizontally centered.
- Left-aligned text/CTA margins are therefore identical in absolute proportion *to the inner column's own width* across all three ratios — i.e., "safe area" is authored once, in 9:16 units, and inherited rather than being independently recalculated as a percentage of each final canvas.
- The only per-ratio adaptation is the fill treatment on the sides: blurred/zoomed video duplicate for b-roll segments, flat neutral card background for the app-UI segment.

## 6. Elements appearing/disappearing/repositioned per ratio

- No element is dropped, added, or newly cropped-out in either alternate ratio — every text block, pill, icon (Irish flag emoji, university crest icons, LeapScholar wordmark), and background plate present in the 9:16 master appears in both 1:1 and 16:9, unclipped, because the whole master column is preserved intact and only the matte around it changes.
- The one thing that changes shape/treatment (not existence) is the app-UI segment's surrounding fill, per §3: neutral/plain in 16:9 and 1:1 vs. true full-bleed in 9:16.
- The "Ireland" script-text and "for 2026?" line, which in the 9:16 baseline already "pushes close to the right edge" of frame, does not get cut off in either wider ratio — if anything it has more breathing room to its right since the pillared canvases are wider than the content column.

---

## Summary for programmatic rebuild

1. Author the composition once, natively, in 9:16 (1080x1920) — background footage + text/CTA layers with fixed left-inset margins.
2. For 1:1 and 16:9 exports: scale the master composition to match the target canvas height, center it horizontally.
3. For background/b-roll segments, fill the side gutters with a heavily blurred, upscaled duplicate of the same background plate (not a different clip, not a solid color).
4. For the app screen-recording segment specifically, override the fill rule: use a flat neutral (white/light gray) background instead of blurred video, since the source is UI/text content that would become illegible or look glitchy if blurred.
5. Do not re-flow, re-wrap, resize, or reposition any text/CTA/pill elements per ratio — they inherit their position and size directly from the 9:16 master column.
