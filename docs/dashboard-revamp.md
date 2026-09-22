# NANTI dashboard revamp

Approved direction: green-and-white workspace with serif editorial headings and readable sans-serif task rows. The user's correction puts a conversational Ask NANTI composer above priorities, with chat and paste modes. ENERGY 2 / RHYTHM 2 / MOTION 1.

Forest green marks primary actions and current navigation. Sage separates the workspace navigation and assistant from the task list. Open lists support scanning; there are no fabricated analytics. Source Serif 4 supplies the approved heading character; existing Inter remains for small controls. Icons identify concrete destinations. Motion is limited to state feedback and respects reduced-motion preferences.

## Behaviors
- Chat uses saved open/inbox items and the last six messages as context. Chat is held in memory, not persisted across page navigation or reload.
- Paste mode calls the existing authenticated extraction endpoint. Users select and edit titles before saving. Failed drafts remain available. Unclear items go to Inbox.
- Task filters show overdue/today, upcoming, undated, or all open tasks. Counts come from the store. Completion/postponement wait for the server and block repeated dashboard submissions while pending.
- Follow-up drafts are editable and copied on request. Nothing is automatically sent.
- Integration delivery and sync are labelled Coming soon. No unverified connected states or fake connect buttons.
- Account changes remount the workspace to clear conversational state.
- Narrow screens stack assistant, priorities and waiting; mobile navigation preserves import, inbox, AI and settings access. Desktop uses a 224px sidebar and a wider two-column workspace.

## Validation
Production build passed. `node tests/dashboard-render.cjs` passed for empty states, filters, counts, inbox/waiting rows, composer and all-task navigation. TypeScript reports existing repository errors, with none in the changed dashboard components after corrections. `git diff --check` passed.

Cloud Browser rejected the local preview address. Signed-in visual verification, mobile browser interaction and live AI/database end-to-end testing remain unverified. No claim of full public-launch readiness. Existing inbox promotion, general editing, reminder delivery, integrations and invoices are separate unfinished work.
