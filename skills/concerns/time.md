# Dates, times & scheduling checklist

Date logic is where "it worked yesterday" bugs live: midnight, DST, time zones, clocks that move. Load
`property-based-testing` for anything that counts or compares days.

- [ ] **Decide what each value is**: an *instant* (a moment, stored as UTC/ISO with an offset) or a *calendar
      date* (`YYYY-MM-DD`, no time). "Did it today", birthdays and due dates are calendar dates. Don't store them as
      midnight timestamps.
- [ ] **Whose "today"?** Define the time zone for every day boundary (the user's local zone, a fixed business zone, or
      UTC) and compute it in one place from an injected clock.
- [ ] Day arithmetic is done on calendar fields (Y/M/D via `Date.UTC`, Temporal, or a date library), **never** as
      `± 86_400_000 ms`. DST days are 23 or 25 hours long.
- [ ] Long-lived screens refresh "today": recompute on focus/visibility, at a timer at the next midnight, and read the
      clock at the moment of each action (not when the screen was rendered).
- [ ] Clock going backwards (travel, NTP correction) and dates in the future in stored data are handled explicitly.
- [ ] Recurring rules (every Monday, monthly on the 31st, last day of month) have defined behavior for short months,
      leap days and DST gaps.
- [ ] Servers store instants in UTC. Times are shown to users in their zone, with `Intl.DateTimeFormat` (see i18n.md).
- [ ] Tests pin both the clock and the time zone (`TZ=America/New_York` or another DST zone), with a guard assertion
      that the zone is really active. Cover: a midnight crossing, both DST transitions, month/year ends, Feb 29.
- [ ] Scheduled jobs (cron, reminders): idempotent, resilient to missed runs, and clear about which zone
      "9 am" means.
