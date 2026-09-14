# EvoCRM settings IA benchmark

| | |
|---|---|
| **Status** | Approved research |
| **Audited revision** | `a0b9a8571fed2a1cbe7bd98d58b47d043c4fc7b2` |
| **Companion** | [`ux-benchmark.md`](./ux-benchmark.md) Finding 11 · [`onboarding-benchmark.md`](./onboarding-benchmark.md) |
| **Reference pattern** | Stripe + Vercel + Shopify + Linear — **IA and danger clarity only**. Never import paint. |
| **Authority** | Existing hrefs. Do not invent settings URLs. Permission filters stay. |

---

## 1. Target IA

Max **two** nav levels: **group → leaf**. No third nested settings tree.

| Target group | Scope label | Existing leaves (map, do not invent) |
|---|---|---|
| **Personal** | `ME` | Profile `/settings/profile` · Security `/settings/security` · Appearance `/settings/appearance` |
| **Workspace** | `WORKSPACE` | Workspace `/settings/workspace` (owner) · People `/settings/people` · Meetings `/settings/meetings` |
| **CRM** | `CRM` | Custom attributes `/settings/attributes` · Pipelines `/settings/pipelines` · Qualify `/settings/qualify` · Quotas `/settings/quotas` · Record layouts `/settings/record-layouts` · Playbooks `/settings/playbooks` |
| **Communication** | `CHANNEL` | Channels `/settings/channels` · SMS `/settings/sms` · WhatsApp / Evolution `/settings/evolution` · WhatsApp Business `/settings/whatsapp-business` when routed · WhatsApp settings `/settings/whatsapp` when routed |
| **Automation** | `CRM` *(no settings leaf today)* | Workflows stay `/crm/workflows`. Do **not** invent `/settings/workflows` until a route exists. Group may omit until then. |
| **Integrations** | `INTEGRATION` | Apps `/settings/apps` · Connectors `/settings/connectors` · Meta `/settings/meta` |
| **Developer** | `DEVELOPER` | Permissions `/settings/permissions` · Audit trail `/settings/audit` · System health `/settings/system-health` |

`/settings` continues to redirect to `/settings/profile`.

**Get started** (`/settings/setup`) is onboarding, not a permanent IA peer. After the Home checklist ships, keep a Workspace “Setup” deep-link or drop it — do not treat wizard dismiss as configured.

---

## 2. Scope labels

Use these scope tokens in docs, `data-settings-scope`, and future copy. Do not print raw GIDs or internal slugs to operators.

| Token | Meaning | Who |
|---|---|---|
| `ME` | The signed-in user | Every member |
| `WORKSPACE` | Tenant / team | Owner (workspace page); managers for People |
| `CRM` | Objects, pipelines, layouts, playbooks, qualify, quotas | `settings.attributes` / `settings.pipelines` / admin |
| `CHANNEL` | Inbound/outbound pipes the workspace speaks on | `settings.integrations` + simple-mode SMS hide |
| `INTEGRATION` | Third-party apps and official connectors | `settings.integrations` |
| `DEVELOPER` | Permissions, audit, health | Admin / owner |

A leaf has **one** scope. Channels do not sit under Integrations. Meta the OAuth product sits under `INTEGRATION`; WhatsApp Cloud / Evolution sit under `CHANNEL`.

---

## 3. Live IA (verified)

`navGroups()` in `resources/js/layouts/settings/layout.tsx` today:

| Live group | Leaves | Gap vs target |
|---|---|---|
| **You** | Profile, Security, Appearance | Relabel → **Personal** (`ME`) |
| **Workspace** | Workspace, People, Meetings, **Get started** | Move setup out of the permanent peer list |
| **Integrations** | Apps, Connectors, WhatsApp, Meta, **Channels**, **SMS** | Split `CHANNEL` vs `INTEGRATION` |
| **CRM** | Attributes, Pipelines, Qualify, Quotas, Record layouts, Playbooks | Keep |
| **Admin** | Permissions, Audit, System health | Relabel → **Developer** (`DEVELOPER`) |

Keep: `requiredPermissionByHref`, `adminOnlyHrefs`, owner-only workspace, simple-mode SMS filter, `EvoCrmWave5SettingsChromeTest` contracts.

---

## 4. Stripe danger clarity

Danger is **scoped to the object it destroys**, with a confirm modal. Never a rail-level “Danger zone” that aggregates unrelated destroys.

| Action | Scope | Where it lives |
|---|---|---|
| Destroy own profile | `ME` | Personal / Profile |
| Change password / 2FA | `ME` | Personal / Security |
| Remove a member | `WORKSPACE` | That People row |
| Delete workspace (if it ever exists) | `WORKSPACE` | Workspace page only |
| Delete pipeline / stage | `CRM` | That pipeline row + confirm |
| Delete attribute definition | `CRM` | That attribute row |
| Disconnect channel | `CHANNEL` | That channel / WhatsApp / SMS page |
| Disconnect connector / app | `INTEGRATION` | That card — “No Baileys” copy stays contiguous |
| Revoke quote | — | Quote **show**, not settings |

Stripe pattern to adopt: labeled destructive button, typed confirm when irreversible, recovery copy (what breaks, what does not). Vercel/Linear: danger never styled as the page primary.

---

## 5. ADOPT / REJECT

| Adopt | From | Apply |
|---|---|---|
| Scope groups, two levels | Stripe + Vercel + Shopify + Linear | Target table above |
| Danger on the object | Stripe | Confirm + scoped |
| Forms `max-w-[900px]` | DS lock | Narrow panes; tables stay wide |
| Permission-filtered nav | This repo | Do not show a 403 leaf |

| Reject | Why |
|---|---|
| Flat dump of every settings page | Operators cannot find CHANNEL vs CRM |
| Third nav level | Max 2 |
| Global settings Danger zone | Mis-scoped destroys |
| Invented billing group | No billing route yet (`design-system.md`) |
| Invented `/settings/workflows` | Workflows are `/crm/workflows` |
| HubSpot / Salesforce settings paint | Tokens stay EvoCRM |
| Auto-connect from a settings page without consent | See `onboarding-benchmark.md` |

---

## 6. Behavior that must not change

- `/settings` → `/settings/profile`
- Fortify profile / security / password
- `can-manage-settings` + `EnforceProductPermissions`
- Capability keys: `settings.integrations`, `settings.attributes`, `settings.pipelines`
- Owner-only `/settings/workspace`
- Wave 5 “No Baileys” connectors copy
- No reintroduction of hardcoded `#eaeaea` / `#d9500f`

P21 is **relabel + reorder**. It is not a controller rename.

---

## 7. Out of scope

- Billing
- Dark cabinet
- Renaming PHP settings controllers
- Moving workflow execution into settings
