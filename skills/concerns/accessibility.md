# Accessibility checklist (anything with a UI)

Target **WCAG 2.2 level AA**. It's also the practical bar for laws such as the US ADA (web cases), the
**European Accessibility Act** (applies to many consumer e-commerce, banking, transport and e-book services in the
EU since June 2025), and public-sector rules. ⚖ Confirm which apply to the product. Load `accessibility`.

- [ ] Semantic structure: one `h1`, ordered headings, landmarks, lists, buttons for actions and links for navigation.
- [ ] Every input has a programmatic label. Errors are announced (`aria-live` / `aria-describedby`).
- [ ] Fully keyboard operable: logical tab order, visible focus, no traps, dialogs trap and return focus, `Esc` closes.
- [ ] Contrast at least 4.5:1 for text (3:1 for large text and UI parts). Color is never the only signal.
- [ ] Images have meaningful `alt` (or empty for decorative ones). Icon-only buttons have accessible names.
- [ ] Touch / click targets at least 24×24 CSS px (44pt on mobile).
- [ ] Respects `prefers-reduced-motion`, text zoom to 200%, dynamic type (mobile), and orientation.
- [ ] Media: captions for video, transcripts for audio. No autoplay with sound.
- [ ] Mobile: `accessibilityLabel` / `accessibilityRole` set, VoiceOver and TalkBack reading order checked.
- [ ] Verify: automated axe check in e2e (`@axe-core/playwright`) with zero violations, plus a manual keyboard-only
      pass of the main flow.
