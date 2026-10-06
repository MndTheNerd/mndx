# App store release & policies checklist

⚖ Store rules change often. Check the current Apple App Review Guidelines and Google Play Developer Policy before
release. Load `apple-appstore-reviewer` for an iOS rejection-risk audit and `expo-overview` → `eas-*` skills for
build/submit mechanics. Submitting to a store is always a user action.

## Both stores
- [ ] **Account deletion** inside the app (and via the web for Google Play) if the app lets users create accounts.
- [ ] Privacy disclosures match reality: Apple **privacy nutrition labels** + privacy manifest
      (`PrivacyInfo.xcprivacy`, including third-party SDKs' required-reason APIs); Google Play **Data safety** form.
- [ ] A privacy policy URL inside the app and in the store listing.
- [ ] Permissions requested only when needed, each with a clear purpose string (`NS…UsageDescription`) that
      matches the actual use.
- [ ] **Digital goods / subscriptions** sold in the app use in-app purchase (StoreKit / Play Billing), with
      restore purchases and clear subscription terms on the paywall. ⚖ Region-specific exceptions exist; confirm before relying on one.
- [ ] User-generated content: report, block, filter, and a moderation contact (Apple 1.2).
- [ ] No placeholder content, broken links or "beta" labels. The app works offline gracefully or explains why it can't.
- [ ] Demo account credentials + review notes prepared for the reviewer if login is required.
- [ ] Age rating questionnaire answered honestly. Kids-category rules apply if targeting children.

## Apple specific
- [ ] Sign in with Apple, or an equivalent privacy-preserving option, when offering third-party login (guideline 4.8).
- [ ] App Tracking Transparency prompt before any cross-app tracking (IDFA).
- [ ] Builds with a current Xcode/SDK as Apple requires. Icons and launch screen at all required sizes.

## Google specific
- [ ] Target API level meets Play's current minimum.
- [ ] Closed testing requirement met for new personal developer accounts before production access (⚖ check current rule).
- [ ] App signing by Google Play. An AAB build (EAS produces one).

## Release mechanics
- [ ] Version and build numbers incremented (EAS `autoIncrement`). Store metadata, screenshots for required device sizes.
- [ ] OTA updates (EAS Update) only ship JS/asset changes that are compatible with the installed native runtime
      version. Store review is needed for native changes.
