# Settings IA benchmark (reconstructed)

**Status:** Reconstructed 2026-09-14. Original file never existed on `main` or any searched branch.  
**Provenance:** Approved research summary + live `resources/js/layouts/settings/layout.tsx` + `routes/settings.php` + `routes/web.php` settings block.  
**Honesty:** IA only. No invented scores. Do not invent URLs.

---

## Reference pattern (behavior only)

Stripe + Vercel + Shopify + Linear:

- Group by **scope**, not by historical page add-order.
- **Max two nav levels.**
- Danger actions are scoped (delete workspace, revoke connector, destroy profile) — never a global red button in the rail.
- Forms `max-w-[900px]` on narrow panes; tables stay wide.

---

## Live IA (verified)

`navGroups()` in `layouts/settings/layout.tsx` today:

| Live group | Leaves (hrefs) |
|---|---|
| **You** | Profile, Security, Appearance |
| **Workspace** | Workspace (owner), People, Meetings, Get started (`/settings/setup`) |
| **Integrations** | Apps, Connectors, WhatsApp (`/settings/evolution`), Meta, Channels, SMS |
| **CRM** | Custom attributes, Pipelines, Qualify, Quotas, Record layouts, Playbooks |
| **Admin** | Permissions, Audit trail, System health |

Permission filters already exist (`requiredPermissionByHref`, `adminOnlyHrefs`, simple-mode SMS hide). **Keep them.**

---

## Approved target IA

Max two levels. Map **existing** leaves — do not invent routes.

| Target group | Existing leaves to place here |
|---|---|
| **Personal** | Profile, Security, Appearance |
| **Workspace** | Workspace, People, Meetings |
| **CRM** | Attributes, Pipelines, Qualify, Quotas, Record layouts, Playbooks |
| **Communication** | Channels, SMS, WhatsApp / Evolution, WhatsApp Business (if routed) |
| **Automation** | *(none today)* — do not invent a settings leaf until a workflow-settings route exists. Workflows stay `/crm/workflows`. |
| **Integrations** | Apps, Connectors, Meta |
| **Developer** | Audit trail, System health, Permissions (or keep Permissions under Workspace if the team rejects a Developer group — decide in P21, do not fork both) |

**Get started** (`/settings/setup`) is onboarding, not a permanent settings peer. After P23 it should be reachable from the Home activation checklist; the settings leaf can remain as “Setup” under Workspace or drop once the checklist is durable.

**Admin** as a top-level group is the live compromise. Approved brief prefers scope names above. P21 migrates labels/order only.

---

## Danger scoping

| Action | Where it lives today | Rule |
|---|---|---|
| Destroy profile | Settings profile | Stay on Personal / Profile |
| Delete workspace member | People | Stay on that row |
| Delete pipeline / stage | Pipelines | Stay on that row + confirm modal |
| Disconnect connector | Connectors | Stay on that card |
| Revoke quote | Quote show — **not settings** | Do not move |

Do not add a settings-rail “Danger zone” that aggregates unrelated destroys.

---

## Behavior that must not change

- `/settings` → `/settings/profile` redirect
- Fortify profile / security / password routes
- `can-manage-settings` + `EnforceProductPermissions`
- Capability keys: `settings.integrations`, `settings.attributes`, `settings.pipelines`
- Owner-only workspace page
- Wave 5 “No Baileys” connectors copy (`EvoCrmWave5SettingsChromeTest`)
- No hardcoded `#eaeaea` / `#d9500f` reintroduction

---

## Out of scope

- Billing group until a billing route exists (`design-system.md` already says omit)
- Dark-mode redesign
- Renaming PHP settings controllers
