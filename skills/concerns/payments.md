# Payments & billing checklist

Default to **Stripe** (load `stripe-best-practices`) unless the market needs a local gateway (for example KNET via
Tap / MyFatoorah in Kuwait, or Mada in Saudi Arabia). Record the gateway choice in an ADR. ⚖ Gateway contracts,
tax registration and refund law are user decisions.

## Never
- Never touch raw card numbers. Use hosted Checkout / Payment Element / the gateway's hosted page or SDK, which
  keeps PCI scope at **SAQ A**. Card data never reaches your server, logs or database.
- Never trust client-side amounts, prices or "paid" flags. The server computes the amount from its own catalog.
- Never use live keys outside production, or put any secret key in a client app.
- **Autopilot never** switches to live mode, creates real products/prices, or moves real money.

## Must
- [ ] **Webhooks are the source of truth** for payment state: signature verified, idempotent (store processed
      event ids), handles out-of-order and retried events, returns 2xx fast and processes async.
- [ ] Idempotency keys on create-payment / create-subscription calls.
- [ ] Money is stored as integer minor units + a currency code. Rounding rules are explicit. Covered by
      property-based tests (`property-based-testing`).
- [ ] Order and payment state machine documented (pending → paid → fulfilled / refunded / failed / disputed)
      and enforced, with tests for each transition.
- [ ] Strong Customer Authentication / 3-D Secure handled (required for many EU cards; use the gateway's
      built-in flow).
- [ ] Subscriptions: trial, upgrade/downgrade proration, failed-payment retries and dunning, cancellation (as
      easy as signup in many jurisdictions ⚖), and access revoked when it lapses.
- [ ] Receipts/invoices emailed. Tax/VAT calculated (Stripe Tax or equivalent) where the business is registered ⚖.
- [ ] Refunds and disputes: an admin path exists, and the webhooks update state.
- [ ] Mobile: digital goods and subscriptions inside iOS/Android apps generally must use **in-app purchase**
      (StoreKit / Play Billing, e.g. via RevenueCat). Physical goods and services can use Stripe. ⚖ Check the
      current store rules (they vary by region). See app-store.md.
- [ ] Tests run against the gateway's **test mode** with test cards (success, decline, 3DS required, dispute),
      and webhook handling is tested with fixture events (`stripe trigger` / a local CLI listener).
