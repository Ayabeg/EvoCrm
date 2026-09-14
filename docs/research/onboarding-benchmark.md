# Onboarding / activation benchmark (reconstructed)

**Status:** Reconstructed 2026-09-14. Original file never existed on `main` or any searched branch.  
**Provenance:** Approved research summary + `/settings/setup` wizard + Home `GuidedActions` + `FirstRunSetupTest` / `OAuthSetupWizardTest`.  
**Honesty:** No invented completion-rate scores.

---

## Reference pattern (behavior only)

Shopify + Linear + Stripe:

- Onboarding is **activation to a first CRM outcome**, not a wizard you dismiss.
- A persistent checklist survives the first session.
- Connectors are steps, not the whole product.
- Empty states point at the next checklist item.

First CRM outcomes (pick the first true one, do not require all):

1. Create a contact (or import)
2. Create a deal on the default pipeline
3. Log or complete an activity
4. Connect a real channel (mailbox / WhatsApp Cloud) **or** skip with an explicit “do this later”

---

## Current implementation (verified)

| Surface | Path | What it is |
|---|---|---|
| OAuth / provider wizard | `pages/settings/setup/wizard.tsx` · `/settings/setup` | Stepper for Meta, Google, WhatsApp, SMS. **Dismissible by leaving the page.** |
| Settings leaf | “Get started” in Workspace group | Link to the wizard |
| Home guided actions | `components/dashboard/guided-actions.tsx` · `pages/home.tsx` | Server-driven `guidedActions[]` with categories setup / deal / prospecting. **Not a durable progress checklist** — it is a tabbed action list that vanishes when the payload is empty (`CaughtUpStrip`). |
| Create from topbar | `AppSidebarHeader` Create menu | Contact / Company / Deal / Quote via `?create=1` |
| First-run tests | `FirstRunSetupTest`, `OAuthSetupWizardTest` | Backend / wizard contracts |

There is **no** persisted “activation checklist” model or Home widget that tracks first-outcome completion independently of whether `guidedActions` happens to be empty.

---

## Approved target

```
KEEP   /settings/setup wizard (connectors / OAuth)
ADD    durable Home activation checklist → first CRM outcome
DO NOT treat wizard dismiss as “onboarded”
```

Checklist is a **signature capability** (`ACTIVATION`). It can read existing backend signals (has contact, has deal, has activity, has connected mailbox / WhatsApp) without a new product object if `HomeDashboardBuilder` already has the facts. If it does not, P23 may add a thin read model — it must not add a second setup wizard.

Placement:

- Home, above vanity charts (same region as today’s Needs attention / Guided actions)
- Dismiss-for-now is allowed; **completion is data-driven**, not “I clicked skip”
- Settings “Get started” deep-links to the unfinished item or the wizard step

---

## Behavior that must not change

- Wizard step routes and OAuth callbacks (Google, Meta, Instagram, WhatsApp)
- `HomeController` / `HomeDashboardBuilder` KPI contracts unless P23 adds additive props
- Simple mode
- Empty Home copy when the workspace is truly empty (do not fake percentages)

---

## Out of scope

- Marketing onboarding site
- Forcing every workspace through WhatsApp before CRM use
- Replacing `GuidedActions` categories without a Home PR
