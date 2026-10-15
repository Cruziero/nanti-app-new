# NANTI Product Benchmark

Updated: 2026-10-15

The reference benchmark is a competitor feature sheet covering ease of use, AI
features, WhatsApp, planning, and platform. This file records where NANTI
actually stands against it, with a code reference for every verdict.

Nothing here is a claim for the marketing site. Rows marked `NOT BUILT` must
not be shown as capabilities anywhere (R-17, R-36). Rows marked `CANNOT CLAIM`
are unverifiable and are excluded from all copy.

## Verdict legend

| Verdict | Meaning |
|---|---|
| `SHIPPED` | Implemented and reachable in the running app |
| `PARTIAL` | Some of it works, some of it does not |
| `DISABLED` | Code exists but sits behind a launch flag that is off |
| `NOT BUILT` | No implementation |
| `CANNOT CLAIM` | Would need real data or a listing we do not have |

## 1. Ease of use

| Benchmark row | Verdict | Evidence |
|---|---|---|
| Setup time under 2 minutes | `CANNOT CLAIM` | Email signup works (`POST /auth/v1/signup` returns 200 with `confirmation_sent_at`), but no timed measurement exists |
| Learning curve very easy | `CANNOT CLAIM` | Subjective, no usability study |
| Natural language input, type | `SHIPPED` | Ask NANTI composer, `src/components/nanti/dashboard-assistant.tsx` |
| Natural language input, speak | `NOT BUILT` | Zero hits for `SpeechRecognition`, `MediaRecorder`, `getUserMedia` under `src/` |
| Ease of use rating | `CANNOT CLAIM` | No reviews, no listing |

## 2. AI-first features

| Benchmark row | Verdict | Evidence |
|---|---|---|
| AI scheduling agent | `SHIPPED` | Assistant creates, clarifies and reschedules items (`src/lib/nanti-ai.server.ts`), and a deterministic planner lays the day out (`src/lib/nanti-planner.ts`) |
| AI auto-schedules your day | `SHIPPED` | `src/lib/nanti-planner.ts` packs open tasks across 09:00 to 18:00, keeps times the user already set, and shows the plan for approval on the Today page before anything is written (`src/routes/app.today.tsx`) |
| Voice input | `NOT BUILT` | Same as above, no speech API usage |
| Image-to-schedule input | `SHIPPED` | `src/routes/app.import.tsx:130` accepts `image/*`, max 5 MB, calls `analyzeScreenshot` so NANTI reads a photo of a timetable |
| Conflict detection | `NOT BUILT` | Every `conflict` hit is a Postgres `onConflict` upsert key or an AI prompt sentence. No overlap check when tasks are created or rescheduled |

## 3. WhatsApp integration

| Benchmark row | Verdict | Evidence |
|---|---|---|
| WhatsApp reminders | `DISABLED` | `WHATSAPP_LAUNCH_ENABLED = false` at `src/routes/app.settings.tsx:87`, surfaced as `hidden` at line 1053 |
| Reminder open rate near 98% | `CANNOT CLAIM` | No delivery or open telemetry exists (R-17) |
| 24h + 10 minute auto alerts | `PARTIAL` | Reminder dispatch runs from Supabase every 5 minutes and `/api/cron/check-reminders` is scheduled; delivery is in-app and web push (`PUSH_LAUNCH_ENABLED` is on, `GET /api/push/config` returns `configured: true`). WhatsApp delivery still needs Meta approval |

## 4. Planning and productivity

| Benchmark row | Verdict | Evidence |
|---|---|---|
| Calendar view, unified timeline | `NOT BUILT` | `src/components/ui/calendar.tsx` is a date-picker primitive, not a month, week or agenda view. No timeline route exists |
| Google Calendar two-way sync | `DISABLED` | `CALENDAR_LAUNCH_ENABLED = false` at `app.settings.tsx:86`. Both OAuth handlers build the redirect URI from the request origin, and Google returns `redirect_uri_mismatch` for `https://nanti.site/api/auth/google` (verified 2026-10-15 against the deployed `GOOGLE_CLIENT_ID`), so the URI is not registered in the Google Cloud client |
| Habit tracking with streaks | `NOT BUILT` | Only hit is marketing prose at `app.settings.tsx:794`. No habit or streak table, no counter |
| Focus / deep work mode | `NOT BUILT` | Zero hits for focus mode, time blocks, deep work, pomodoro |
| Task management | `SHIPPED` | `src/routes/app.today.tsx`, task rows present in production |
| Family / shared calendar | `NOT BUILT` | No multi-user sharing. Export and delete are per-account only |

## 5. Platform

| Benchmark row | Verdict | Evidence |
|---|---|---|
| iOS | `PARTIAL` | Installable to the home screen as a web app: `public/manifest.webmanifest`, `apple-touch-icon.png`, and the service worker already registered in `src/routes/__root.tsx:148`. Still no native app, so nothing about the App Store can be claimed |
| Android | `PARTIAL` | Same install path, plus `maskable-192.png` / `maskable-512.png` so the adaptive icon is not letterboxed |
| Apple Watch | `NOT BUILT` | Out of reach for a web app |
| App store rating 5.0 | `CANNOT CLAIM` | No listing exists (R-17, R-36) |

## What already clears the bar

Five benchmark rows are `SHIPPED` and can be stated in copy today:

1. Natural language input by typing
2. AI scheduling agent, create, clarify and reschedule
3. Auto-scheduling your day
4. Image-to-schedule, photo of a timetable
5. Task management

Two more capabilities exist in the app but have no benchmark row of their own:
people and work-context memory (`resolvePersonMemory`, `resolveProjectMemory`
in `src/lib/nanti-store.tsx`), export with account deletion
(`tests/account-export.cjs`, 7/7), and web push reminders
(`sendPushNotification` in `src/routes/api/cron/check-reminders.tsx:434`,
channel selectable in settings since `PUSH_LAUNCH_ENABLED` is on). Real-device
push delivery is still unvalidated.

## Build plan

Ordered by value against effort, and by whether anything outside the repo is
needed.

### Tranche 1, no external dependency

1. **PWA manifest, icons, service worker wiring.** Done: `public/manifest.webmanifest`
   with `icon.svg`, `icon-192.png`, `icon-512.png`, `maskable-192.png`,
   `maskable-512.png` and `apple-touch-icon.png`, all derived from the Logo mark
   in `src/components/nanti/logo.tsx` and wired through `src/routes/__root.tsx`.
   The service worker was already registered. It does not make a native app, so
   the rows stay honest as "installable", never "available on the App Store".
2. **Voice input.** Web Speech API, no paid service, works in Chromium and
   Android. Excluded on unsupported browsers rather than hidden.
3. **Conflict detection.** Overlap check on create and reschedule, surfaced in
   the composer before the item is saved.
4. **Focus and deep work mode.** Time blocks over existing tasks.
5. **Habit tracking with streaks.** New table plus Today surface.

### Tranche 2, needs design decisions first

6. **Unified calendar timeline view.** The largest missing planning surface.
7. **Auto-scheduling agent.** Done. `src/lib/nanti-planner.ts` lays the day out
   from tasks and deadlines, and the Today page confirms with the user before
   writing any time back.

### Tranche 3, blocked on external setup

8. **Google Calendar two-way sync.** Blocked until the redirect URI is added at
   https://console.cloud.google.com/apis/credentials, then `CALENDAR_LAUNCH_ENABLED`.
9. **WhatsApp reminders.** Blocked on WhatsApp Cloud API credentials, then
   `WHATSAPP_LAUNCH_ENABLED`. The 98 percent open-rate row stays `CANNOT CLAIM`
   regardless.

### Not achievable in this codebase

10. **iOS, Android, Apple Watch native apps.** Separate projects. Do not put
    these rows on any page.
11. **App store rating.** No listing. Never shown.
