# EvoCRM onboarding / activation benchmark

| | |
|---|---|
| **Status** | Approved research |
| **Audited revision** | `a0b9a8571fed2a1cbe7bd98d58b47d043c4fc7b2` |
| **Companion** | [`ux-benchmark.md`](./ux-benchmark.md) Finding 12 · [`settings-benchmark.md`](./settings-benchmark.md) |
| **Reference pattern** | Shopify checklist + Linear first-loop + Stripe milestones — **behavior only** |
| **Job** | Persistent Home checklist to a **first CRM outcome**. Wizard dismiss is not onboarded. |

---

## 1. First CRM outcome

Activation is complete when the workspace has produced **one** real CRM outcome — not when `/settings/setup` is closed.

Count the first true one (do not require all):

- A **contact** exists (created or imported)
- A **deal** sits on the default pipeline
- An **activity** is logged or completed
- Optionally a **quote** is created from that deal

Connecting WhatsApp / mailbox is a channel step. It is **not** the definition of onboarded. Skip is explicit (“do this later”), never silent auto-connect.

---

## 2. Persistent Home checklist — 9 steps

Lives on Home (`/dashboard`, `pages/home.tsx`), above vanity charts, in the Needs attention / Guided actions region. Survives the first session. Completion is **data-driven**.

| # | Step | Done when | Primary action | Scope |
|---|---|---|---|---|
| 1 | Confirm you | Profile has a name the team can see | `/settings/profile` | `ME` |
| 2 | Name the workspace | Workspace name saved (owner) | `/settings/workspace` | `WORKSPACE` |
| 3 | Invite a teammate | A second member exists **or** explicit skip | `/settings/people` | `WORKSPACE` |
| 4 | Add a contact | ≥1 contact (create `?create=1` or import) | `/crm/contacts?create=1` | `CRM` |
| 5 | Create a deal | ≥1 deal on the default pipeline | `/crm/deals?create=1` | `CRM` |
| 6 | Log a next activity | ≥1 activity on that deal or contact | `/crm/activities` or record composer | `CRM` |
| 7 | Open the pipeline | Operator has visited `/crm/deals/board` **or** the deal appears on the board | `/crm/deals/board` | `CRM` |
| 8 | Connect a channel | Mailbox **or** official WhatsApp Cloud connected **or** explicit “do this later” | `/settings/setup` step or `CHANNEL` leaf | `CHANNEL` |
| 9 | First CRM outcome | Activity completed **or** deal moved **or** quote sent | Context link to that record | `CRM` |

Step 8 requires **consent**. OAuth / Evolution / Meta connect only after the operator starts that step. Reject auto-connect without consent.

`/settings/setup` remains the connector wizard for step 8. It does not hide the product and does not replace steps 4–7 or 9.

---

## 3. Step states

Every step has exactly one state:

| State | Meaning | UI |
|---|---|---|
| **Not started** | No data, no skip | Empty control, next CTA |
| **In progress** | Started (e.g. wizard open, import batch) | Progress, not a fake check |
| **Complete** | Data says so (or recorded explicit skip where skip is allowed: 3, 8) | Check + muted |
| **Needs attention** | Started and blocked (OAuth error, import failed, stage-required rejected) | Attention treatment, not color-only |

Dismiss-for-now hides the **panel** temporarily. It does **not** mark steps Complete. `CaughtUpStrip` today fires when `guidedActions` is empty — that is **not** this checklist.

---

## 4. Current implementation (verified)

| Surface | Path | Gap |
|---|---|---|
| OAuth / provider wizard | `pages/settings/setup/wizard.tsx` · `/settings/setup` | Dismissible by leaving; not a 9-step CRM outcome |
| Settings “Get started” | Workspace group | Wizard link, permanent peer |
| Home `GuidedActions` | `components/dashboard/guided-actions.tsx` | Tabbed server list; vanishes when empty |
| Topbar Create | `AppSidebarHeader` | Good entry for steps 4–5 |
| Tests | `FirstRunSetupTest`, `OAuthSetupWizardTest` | Wizard / first-run contracts — keep |

There is **no** durable activation checklist bound to workspace facts.

---

## 5. ADOPT / REJECT

| Adopt | From | Apply |
|---|---|---|
| Persistent Home checklist | **Shopify** | 9 steps, visible until first outcome, empty states point at the next step |
| First-loop, not a tour | **Linear** | Operator does real CRM work (contact → deal → activity) inside the product |
| Named milestones | **Stripe** | States Not started / In progress / Complete / Needs attention; no fake % |

| Reject | Why |
|---|---|
| **Wizard-hides-product** | `/settings/setup` as a blocking curtain before Home / Contacts / Deals |
| **Auto-connect without consent** | Connecting Google / Meta / WhatsApp / SMS without the operator starting that step |
| Wizard dismiss = onboarded | Finding 12 |
| Fake KPI / 100% bars | Empty workspace stays empty |
| Forcing WhatsApp before a contact exists | Channel is step 8, not step 1 |
| A second setup product | One checklist + existing wizard |

**Mobbin (Home density only, not a wizard):** HubSpot guided home — [1f571c85](https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748). Salesforce home widget soup is an anti-pattern — [7dac13de](https://mobbin.com/screens/7dac13de-4760-4219-9f58-dabea6659236).

---

## 6. Placement and ownership

| Owner | Owns |
|---|---|
| Home (`activation` capability) | Checklist UI, state rendering, deep-links |
| `HomeDashboardBuilder` | Additive facts: has contact, has deal, has activity, has second member, channel connected, first outcome |
| `/settings/setup` | OAuth / channel steps only |
| DataWorkspace empty states | Point at the next unfinished checklist item when relevant |

P23 may add additive Home props. It must not add a second wizard or invent completion.

---

## 7. Behavior that must not change

- Wizard step routes and OAuth callbacks (Google, Meta, Instagram, WhatsApp)
- `HomeController` KPI contracts except additive checklist facts
- Simple mode
- Empty Home numbers stay empty
- Official connector / “No Baileys” rules

---

## 8. Out of scope

- Marketing landing onboarding
- Native mobile onboarding
- Auto-enrolling sequences
- Replacing `GuidedActions` deal/prospecting tabs without a Home PR (they may remain **beside** the checklist)
