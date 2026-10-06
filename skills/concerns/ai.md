# AI / LLM feature checklist

Load the `claude-api` skill for model ids, SDK usage, prompt caching, tool use and streaming. Never pick models or
prices from memory.

- [ ] The AI call is behind one adapter module (prompt + model + parsing), so the rest of the app never builds prompts.
- [ ] Structured output (tool use / JSON schema) validated with the same schema library as the rest of the app.
      Malformed output is handled, not crashed on.
- [ ] **Prompt injection:** user content and retrieved content are treated as data, never instructions. The model
      can't trigger privileged actions without a server-side permission check. Tool calls are allow-listed.
- [ ] Cost and abuse controls: per-user rate limits and quotas, max tokens set, timeouts, and a spend alert.
      Prompt caching where prompts repeat.
- [ ] Privacy: no secrets in prompts. PII is minimized and disclosed in the privacy policy (the AI provider is a
      processor, see privacy-compliance.md).
- [ ] UX: streaming for long outputs, a clear loading state, a retry option, a "may be inaccurate" note where it
      matters, and a way for the user to correct or undo AI actions.
- [ ] Evaluation: a small golden set of inputs → expected properties, run in CI with a fake model, plus an
      opt-in live eval command (never in the default test run, since it costs money).
- [ ] Logs keep the prompt/response ids and token counts, not full user content, unless that's disclosed and needed.
- [ ] ⚖ Regulated uses (hiring, credit, medical, legal advice, children) or EU AI Act high-risk categories:
      flag them to the user.
