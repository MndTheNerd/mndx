# Privacy, compliance & legal checklist

⚖ **Not legal advice.** This list flags what commonly applies so nothing gets silently missed. The specific laws
depend on where the users are, what data is processed, and the business. Anything uncertain goes to the user as an
open question (or under autopilot, the report's "Please check" list). It's never assumed to be fine.

## 1. Data inventory (do this first, in the spec)
- [ ] List every personal data field collected (name, email, phone, location, device ids, payment info, content,
      health, biometrics, children's data) with its **purpose**, **legal basis**, **retention**, and **who it's
      shared with** (processors: hosting, email, analytics, payments, AI APIs). Keep it in `docs/PRIVACY.md`.
- [ ] Minimize: don't collect what the feature doesn't need.

## 2. Which regimes probably apply ⚖
| If users are in… | Commonly relevant |
|---|---|
| EU / EEA / UK | GDPR / UK GDPR, ePrivacy (cookie consent), EU Accessibility Act, DSA for platforms with user content |
| US | CCPA/CPRA (California) and other state privacy laws, COPPA (under-13s), CAN-SPAM (email), TCPA (SMS), ADA (accessibility), HIPAA if handling health data for covered entities |
| Gulf (Kuwait, Saudi Arabia, UAE…) | Kuwait CITRA Data Privacy Protection Regulation, Saudi PDPL, UAE PDPL. Some require data localization or registration for certain sectors |
| Anywhere with payments | PCI DSS (see payments.md), consumer-protection and refund rules, tax/VAT registration |

## 3. User rights & product requirements
- [ ] Privacy policy and terms pages exist, are linked at signup and in the app/site footer, and describe the
      actual data flows from the inventory. ⚖ The final text is reviewed by the user or a lawyer.
- [ ] Consent: non-essential cookies, analytics, ad tracking and marketing email/SMS are **opt-in** where the
      law requires it (EU), with an equally easy reject option. No pre-ticked boxes. Consent is recorded with a
      timestamp.
- [ ] Users can **access/export** their data and **delete their account**, and the deletion actually deletes
      (or anonymizes) it across stores and processors within the stated time.
- [ ] Age: if children could use it, either age-gate or comply with COPPA / GDPR-K (parental consent). Otherwise
      the terms state a minimum age.
- [ ] Special categories (health, biometrics, religion, precise location, children): extra care, explicit
      consent, and a DPIA-style risk note in the spec. ⚖
- [ ] User-generated content: report/flag, block, moderation, and a takedown process. Required by app stores
      for UGC apps (see app-store.md).
- [ ] Data transfers: processors have a DPA, and cross-border transfers are covered. ⚖
- [ ] Logs and analytics don't contain more PII than needed. Retention limits are enforced (scheduled cleanup).
- [ ] Security breach plan: who gets told, and how fast (GDPR: the regulator within 72 hours). Recorded in
      `docs/PRIVACY.md`.

## 4. Other legal items to flag ⚖
- Open-source licenses of dependencies are compatible with how the product is distributed (copyleft in shipped apps).
- Trademarks / names / logos used aren't someone else's.
- Regulated domains (finance, lending, crypto, health, gambling, alcohol, education records) usually need
  licensing. Flag them, never assume.
- Accessibility obligations (see accessibility.md).
- Email/SMS marketing rules (see messaging.md).
