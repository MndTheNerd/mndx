# Product & UX checklist (anything with a UI)

Load `frontend-design` (web) or `expo-design-system` (mobile) before building UI, and `web-design-guidelines` at verify.

- [ ] **Design direction recorded once per project** in `docs/DESIGN-SYSTEM.md`: palette (named tokens, light and
      dark), type scale, spacing, radius, motion rules, voice and tone. Every screen uses the tokens, with no
      one-off hex values.
- [ ] Each screen in the spec states its **primary job** and its **primary action**. One primary button per view.
- [ ] All states designed and built: loading (skeletons for content), empty (explains + next action), error
      (human message + retry), success, partial / offline.
- [ ] Forms: labels (not placeholder-only), inline validation on blur, errors next to the field, disabled +
      pending submit, nothing lost on error.
- [ ] Destructive actions confirm, or offer undo.
- [ ] Copy is plain, specific and consistent (same word for the same thing as GLOSSARY.md). No lorem ipsum in
      shipped UI.
- [ ] Responsive: 360 px phone to wide desktop (web); small phone to tablet, plus safe areas (mobile).
- [ ] Feedback within 100 ms for every interaction. Optimistic UI where it's safe.
- [ ] Navigation: the user always knows where they are and how to go back. Deep links work.
- [ ] Verify with real screenshots (`playwright-cli` / simulator) at phone and desktop sizes, in light and dark.
