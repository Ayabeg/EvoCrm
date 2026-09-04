# PostHog data hub

EvoSales sends product and business events to the Evotechly PostHog project (`Default project`, US Cloud). Scale unlocks group analytics, extra projects, and warehouse volume. It does not ingest data by itself.

## What ships in the app

Set `POSTHOG_API_KEY` and `POSTHOG_HOST` on the web, queue, and scheduler processes. The frontend reads the same key from Inertia shared props, so a rebuild is not required after the env change.

| System | Events |
|---|---|
| Auth | `user signed up`, `user logged in`, `$identify` |
| Workspace | `workspace created`, `$groupidentify` (`workspace`) |
| CRM | `contact created`, `company created`, `deal created`, `deal stage changed`, `deal won`, `deal lost`, `quote sent` |
| Leads | `lead created`, `lead qualified`, `lead converted` |
| People | `user invited` |
| Automation | `segment entered`, `segment exited`, `workflow executed`, `sequence enrolled`, `campaign launched` |
| Outbound | `email sent`, `email replied`, `email bounced`, `whatsapp message sent` |
| WhatsApp Cloud | `whatsapp message received` |
| Meta | `meta lead received`, `integration connected` |
| Google / desk connectors | `integration connected` |

Distinct ID is the EvoSales user id. Webhook-only events use `workspace:{id}`. Every event carries `groups.workspace`.

## Warehouse sources (credentials stay in PostHog)

Connect these in [Sources](https://us.posthog.com/project/564929/data-management/sources) so product events can join CRM and ads tables. Production EvoSales is **MySQL**, not Postgres.

1. MySQL — `contacts`, `deals`, `leads`, `companies`, `users`, `workspaces`, `enrollments`, `outbound_messages`
2. Meta Ads — spend vs `meta lead received`
3. Stripe — if billing lives there (use webhook sync)
4. Google Ads — if paid search is on

Do not paste database passwords into chat. Use PostHog’s source connect link, then tell the agent the source is stored.

## After deploy

1. Confirm [Live events](https://us.posthog.com/project/564929/activity/live) shows `user logged in` after one CRM sign-in.
2. Rename the project from “Default project” to `EvoSales production`.
3. Add a staging project so test traffic stays out of company metrics.
4. Pin the Evotechly hub dashboard and replace the starter board.
