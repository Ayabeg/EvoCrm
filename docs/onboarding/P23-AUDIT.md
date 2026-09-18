# P23 — Onboarding + Activation audit

**BASE / starting_ref:** `4d2976befc7a94c267528e4a1fa7a810fe45e4a8` (P22 #231 tip)  
**Date:** 2026-09-18  
**Scope:** Read-only inventory before P23 product code. P00–P22 frozen.

---

## EXISTING

| Surface | Path | What it does today |
|---|---|---|
| First-run / OAuth wizard | `GET /settings/setup` → `OAuthSetupController` · `pages/settings/setup/wizard.tsx` | Connector stepper (start / meta / providers). Session remembers `oauth_setup.{provider}.step`. Leaving the page is dismiss. Finish is not CRM activation. |
| Settings “Setup” | P21 IA leaf `/settings/setup` | Relabel of Get started. Permanent Workspace peer. Not proof of onboarded. |
| Home create chips | `HomeDashboardBuilder::activation()` · `pages/home.tsx` | If `crm.edit` and **no deals and no activities**, emit 3 links: Create deal / contact / activity. Vanishes after the first deal **or** activity. Ignores contacts, pipeline, integrations, members. |
| P17 Home | `GET /dashboard` · `HomeController` · `HomeDashboardBuilder` | Attention / Today / KPI / Pipeline / Recent. Additive `activation` array only. |
| GuidedActionBuilder | `app/Services/Home/GuidedActionBuilder.php` | Legacy HubSpot-shaped connect mailbox/Meta/WhatsApp/Calendar. **Not wired** to current Home payload (`guidedActions` missing from P17). |
| Workspace create | `WorkspaceProvisioner` · Fortify `CreateNewUser` | Always names workspace `config('evosales.company', 'Evotechly')`. Seeds default Sales pipeline, channel rows (`not_connected`), catalog, quiet hours. |
| Workspace General | `/settings/workspace` · owner only | **simple_mode only**. No name / timezone form. |
| CRM create / import | Contacts `?create=1` + `/crm/contacts/import`; Deals same; Activities `?create=1` / composer | Authoritative create paths. Command OS Create uses the same. |
| Pipeline settings | `/settings/pipelines` | GET: any workspace member (`PipelinePolicy::viewAny`). Mutate: `canManageSettings()` (owner/admin). Seeded defaults always exist. |
| P22 integration facts | `App\Support\Integrations::forWorkspace` · shared Inertia `integrations.activation` | Booleans only: `has_configured_integration`, `has_connected_communication_channel`, `has_mailbox`, `has_meta_configured`. No tokens / webhook secrets. |
| Inbox / channels | Channels seeded `not_connected`; mailbox / WhatsApp / Meta / SMS via Settings | Real connect state exists. Wizard is one entry, not the only one. |
| Membership / roles | `WorkspaceRole` + `config/permissions.php` | Members default `crm.view` only. `crm.edit` / `crm.import` / `settings.integrations` / `settings.pipelines` are owner/admin (or granted). |
| Empty states | Contacts / Companies / Deals DataWorkspace; Activities work-queue `openEmpty` | First-run copy + create CTA. Titles locked by P04/P05/P07 contracts. |
| First-login redirect | `/` → dashboard if auth; Fortify home is `/dashboard` | **No** force-wizard. Invite first-login is password reset, then dashboard. |
| Tours / checklists | — | None durable. Research 9-step checklist is spec only (`docs/research/onboarding-benchmark.md`). |
| Dismissal / prefs | — | No user preference table. Dismiss exists only for Lead OS suggestions / enrichment. |

---

## PARTIAL

| Item | Gap |
|---|---|
| Home `activation` | Real create hrefs, but completion is “any deal or activity exists”, not a checklist, not core vs optional, not integration-aware, hidden from view-only members. |
| Wizard | Useful connector flow. Session step ≠ durable activation. No workspace-level “wizard completed” column (correct). |
| P22 activation facts | Ready for P23 to **consume**. Not rendered as a Home checklist. Google Calendar connect is **not** in `has_configured_integration`. |
| Empty states | First-run exists; they do not point at a workspace activation contract. |
| Pipeline “configured” | Pipeline **always** exists after provision. Existence is not a meaningful done-state. Customization vs `config('evosales.pipeline')` + name `Sales` **is** measurable. |
| Workspace profile | Name always filled at provision. No rename UI. Treating “name exists” as a checklist step is filler. |

---

## MISSING

- Authoritative activation domain/service (`getState` / steps / progress).
- Persistent Home checklist bound to **product facts**.
- CORE vs OPTIONAL + overall activated rule (not 100% of rows).
- Per-user dismissal that is **not** completion.
- Permission-safe CTAs (`can_view` vs `can_perform`).
- Live re-derivation after delete (old Home hid the chips forever after first deal).
- Workspace isolation tests for activation facts.
- `docs/onboarding/` contract / handoff (this audit is the first file).

---

## DUPLICATED

| Duplicate | Keep | Do not grow |
|---|---|---|
| Home chips vs wizard vs Apps “Get started” | One checklist on Home; wizard + Apps stay connector surfaces | Second wizard / SetupV2 |
| `GuidedActionBuilder` vs P22 facts vs Home chips | P22 booleans + CRM EXISTS | Re-wire GuidedActionBuilder onto Home |
| Research 9-step vs P17 3-links | P23 contract (fact-based, no page-visit steps) | Invite / “open board” / click-complete |

---

## LEGACY

- `GuidedActionBuilder` + `guided-actions.tsx` — leftover from pre-P17 command center. Not on the live Home payload. Do not resurrect as activation SoT.
- Session `oauth_setup.*.step` — wizard UX only.
- Home `activation` as `list<{label,href}>` — replaced by the P23 payload (same prop name, new shape). Attention / Today / KPI / Pipeline / Recent stay.

---

## SAFE TO REUSE

- `HomeDashboardBuilder` + `home.tsx` (additive region).
- Create/import/activity hrefs already used by P17 / Command OS.
- `Integrations::forWorkspace()['activation']` (P22).
- `Contact` / `Company` / `Deal` / `Activity` `forWorkspace()` + `exists()`.
- Default pipeline + `config('evosales.pipeline')` for customization compare.
- P01 `Button`, Home widget density, Phosphor icons, `t()`.
- Existing wizard, FirstRun / OAuth tests.
- Permissions via `User::canPermission` + `WorkspaceRole::canManageSettings()`.

---

## DO NOT TOUCH

Auth, CRM models, Contacts/Companies/Leads/Deals/Pipeline/Quotes/Activities/Inbox/Command OS internals, P17 Attention/Today/KPI/Pipeline/Recent semantics, P19/P20 automation, P21 Settings IA catalog, P22 integration architecture / token handling, workspace isolation rules, routes except additive activation dismiss. No P24 Ask Evo. No visual redesign of Home widgets.

---

## PERMISSION CONSTRAINTS

| Action | Who | 403 if |
|---|---|---|
| View Home / activation payload | Any verified workspace member | — |
| Create contact / deal / activity | `crm.edit` | Member default |
| Import contacts / deals | `crm.import` | Member default |
| Open `/settings/workspace` | **Owner** (controller abort) | Admin/member |
| View `/settings/pipelines` | Any workspace member (`viewAny`) | — |
| Mutate pipelines | `PipelinePolicy` = `canManageSettings()` (owner/admin) | Member, even if IA shows the leaf via `settings.pipelines` |
| View `/settings/apps` / `/settings/setup` | GET open | — |
| Connect / disconnect integrations | `settings.integrations` | Member default |
| Dismiss checklist | The signed-in user (own row) | Other users' rows |

CTAs must omit hrefs the actor cannot perform. View-only members still **see** derived progress (no secret leak, no elevation).

---

## REAL ACTIVATION FACTS AVAILABLE

| Fact | Query | Notes |
|---|---|---|
| Workspace has a name | `filled(workspaces.name)` | Always true after provision. Not a meaningful step. |
| ≥1 contact | `Contact::forWorkspace()->exists()` | Create or import. |
| ≥1 company | `Company::forWorkspace()->exists()` | Counts as CRM data. |
| ≥1 deal | `Deal::forWorkspace()->exists()` | Any pipeline. Soft-live: delete last deal → incomplete. |
| ≥1 activity | `Activity::forWorkspace()->exists()` | Task / note / call / etc. |
| Pipeline customized vs seed | Pipeline count ≠ 1 **or** default name ≠ `Sales` **or** stages ≠ `config('evosales.pipeline')` | Existence of the seed pipeline is **not** done. |
| Integration / channel connected | P22 `activation.has_configured_integration` | Mailbox row **or** connected Meta / WhatsApp / WhatsApp Business / SMS. No tokens in payload. |
| P22 extras | `has_mailbox`, `has_meta_configured`, `has_connected_communication_channel` | Available; checklist uses the configured-integration rollup. |
| Actor permissions | `canPermission` / role | For CTA gating only. |

---

## ACTIVATION FACTS NOT AVAILABLE

| Desired fact | Why unavailable | P23 decision |
|---|---|---|
| Operator named the workspace in Settings | No name field on General | **Defer** workspace-profile step (filler if “name exists”). |
| Wizard finished | Session only; click-next | Must **not** complete activation. |
| Visited `/crm/deals/board` | Page visit ≠ value | **Reject** (research step 7). |
| Invited a teammate / explicit skip | Would need skip-as-complete | Out of P23 target steps. |
| Google Calendar only | Not in P22 `has_configured_integration` | Do not invent a second integration truth. |
| User dismissed checklist | No preference row | **Persist** smallest table (justified). |
| Quote sent / deal moved as “first outcome” | Extra CRM semantics; not required once deal+activity exist | Optional later; not CORE. |

---

## AUDIT DECISIONS (implementation input)

1. Replace Home `activation` **shape** (P17 chips → contract object). Do not remove Attention / Today / KPI / Pipeline / Recent.
2. Derive all step completion. Persist **only** per-user dismissal.
3. CORE = CRM data + first deal + first activity. OPTIONAL = pipeline customized + connected integration. Activated = all CORE. Not 100% of rows.
4. Existing workspaces inherit progress from current rows. No reset / backfill-to-0%.
5. Wizard stays. Wizard complete ≠ activated.
6. Empty-state copy may mention first CRM action; P04/P05/P07 **titles** stay locked.
