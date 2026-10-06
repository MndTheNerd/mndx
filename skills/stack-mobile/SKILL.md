---
name: stack-mobile
description: MNDX playbook for mobile apps (Expo + React Native, modelled on the Obytes starter with expo-router, NativeWind, TanStack Query, Zustand, Zod, Jest, Maestro, EAS). Load when choosing a stack for, planning, or building a mobile app.
user-invocable: false
---

# Mobile playbook

The defaults follow the proven Obytes starter (`npx create-obytes-app@latest`). Use it to scaffold, or follow its
conventions in a plain `create-expo-app` project. **Check the current Expo SDK docs** before scaffolding or
upgrading, because APIs move between SDK versions.

## Default stack
| Concern | Default | Alternatives (when) |
|---|---|---|
| Framework | Expo (managed, current SDK) + TypeScript strict | bare RN (only for native modules Expo can't do via config plugins) |
| Navigation | expo-router (file-based) | — |
| Styling | NativeWind (Tailwind for RN) | StyleSheet / Unistyles |
| Server state | TanStack Query + Axios (or fetch) | — |
| Client state | Zustand (small stores) | Context for trivial cases |
| Validation / forms | Zod + React Hook Form | — |
| Storage | react-native-mmkv (prefs), expo-secure-store (tokens) | SQLite (expo-sqlite) for offline data |
| i18n | i18next (if more than one language) | — |
| Tests | Jest + React Native Testing Library; Maestro for e2e flows | — |
| Build / release | EAS Build + EAS Update, with dev / preview / production profiles | — |

## Structure
```
src/
  app/              # expo-router routes; (tabs), (auth) groups; _layout.tsx
  features/<name>/  # screens' components, hooks, api, schemas per feature
  components/ui/    # shared primitives (Button, Input, Text…)
  lib/              # api client, auth, storage, env (validated with Zod), hooks
  translations/
maestro/            # e2e flows (*.yaml)
```

## Rules
- Env is split per profile (dev/preview/prod) and validated at startup. Only public values go into the bundle.
  Real secrets live on a backend.
- Tokens go in secure storage, never in AsyncStorage/MMKV in plain text.
- Every screen handles loading / empty / error / offline. Lists use FlashList/FlatList, never `map` inside a ScrollView.
- Respect safe areas, keep touch targets at least 44pt, support dynamic type, add accessibility labels to icon buttons.
- Test on both iOS and Android (simulator/emulator or Expo Go) before verify passes. Note what was checked
  manually in `verify.md`.
- Native config changes (permissions, plugins) go in `app.config.ts`, with the reason documented.

## Community skills
`expo-overview` first: it's Expo's official router to `expo-project-structure`, `expo-router`, `expo-native-ui`, `expo-ui`,
`expo-design-system`, `expo-data-fetching`, `expo-dev-client` and `expo-upgrade`. Also
`vercel-react-native-skills` (performance, lists, animation), and `apple-appstore-reviewer` before any release.
Payments inside the app follow `${CLAUDE_PLUGIN_ROOT}/skills/concerns/payments.md` (in-app purchase for digital
goods).

## Quality bar commands (pnpm)
`pnpm lint` · `pnpm type-check` · `pnpm test` (jest) · `pnpm e2e` (maestro, when a device/emulator is available) ·
`pnpm expo-doctor` (`npx expo-doctor`). For releases: `eas build --profile preview`, **only when the user asks**,
because EAS builds use their account and quota.
