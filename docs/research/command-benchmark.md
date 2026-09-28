# EvoCRM Global Search and Command Benchmark

## Scope

This benchmark covers Cmd/Ctrl+K, global search, recent items, navigation, create actions, keyboard navigation, grouped results, and contextual commands.

## Current EvoCRM baseline

resources/js/components/crm/command-palette.tsx is wired from app-sidebar-header.tsx and opens on Cmd/Ctrl+K. It has navigation items and an evoSearchIndex, filters by string inclusion, and renders Records and Navigate groups. The placeholder is Find a record or page. Results navigate through Inertia.

This is a useful shell foundation but not yet a complete global command interface: there is no explicit Create group, contextual record actions, recent history, command parameter flow, or AI context mode.

## Benchmark evidence

| Product | Evidence | Strong behavior | Limitation for EvoCRM |
|---|---|---|---|
| Linear | [command menu](https://linear.app/changelog/2019-12-18-new-command-menu), [search docs](https://linear.app/docs/search), [shell screen](https://mobbin.com/screens/dba91946-d147-4b2f-ad92-4195eae017fc) | Fast command discovery, keyboard-first navigation, natural-language shortcuts, and scoped search. | Issue/project grammar does not map directly to CRM objects. |
| Slack | [search guidance](https://slack.com/help/articles/202528808-Search-in-Slack), [keyboard shortcuts](https://slack.com/help/articles/201374536-Slack-keyboard-shortcuts), [search screen](https://mobbin.com/screens/1b8c4c36-48af-491f-b556-0cc5cf5e34ea) | Search across conversations with filters, recent searches, and strong keyboard access. | Search-first behavior can make commands less visible. |
| Notion | [search screen](https://mobbin.com/screens/6573e834-dc7c-42e4-812f-be159ac1f887) | Recent items, grouped results, and context-aware navigation across a flexible information space. | Flexible pages do not provide CRM-specific action semantics. |
| Raycast | Production command launcher patterns. | Excellent command vocabulary, aliases, keyboard navigation, and multi-step commands. | System launcher conventions are too broad and technical for every CRM user. |
| Vercel | Production dashboard search and navigation patterns. | Strong project/workspace scope and direct navigation. | Developer-object vocabulary is narrower than EvoCRM. |

## Score comparison

| Candidate | Hierarchy | Ease | Speed | Discoverability | Density | Scale | A11y | Keyboard | Responsive | EvoCRM fit | Complexity |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Linear | 9 | 9 | 10 | 9 | 8 | 8 | 8 | 10 | 8 | 9 | 6 |
| Slack | 9 | 8 | 8 | 8 | 8 | 9 | 8 | 9 | 8 | 9 | 7 |
| Notion | 8 | 9 | 8 | 8 | 7 | 8 | 8 | 8 | 8 | 8 | 6 |
| Raycast | 9 | 8 | 10 | 8 | 9 | 9 | 7 | 10 | 5 | 8 | 8 |
| Vercel | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 7 | 6 |

## Target command model

One interface has five grouped modes:

1. Search: contacts, companies, leads, deals, quotes, tickets, conversations, activities, workflows, and settings.
2. Navigate: rooms, pages, saved views, reports, and settings destinations.
3. Create: contact, company, lead, deal, quote, task, note, conversation action, and workflow.
4. Act on current context: assign, change stage, add activity, send message, create quote, open full record.
5. Ask Evo: only when the prompt is clearly a grounded CRM question or transformation request.

Search results show object type, name, secondary identifier, status/stage, owner, and last updated. Groups are keyboard navigable. Recent records and recent commands appear when the query is empty. A selected result may open a record drawer while an explicit Open full workspace action navigates.

Use a two-step command for risky or parameterized actions: select action, then select object/value. Never execute deletion, disconnect, bulk mutation, or send actions from a single ambiguous string.

## Keyboard and accessibility model

Cmd/Ctrl+K opens, Escape closes or backs out one step, Arrow keys navigate, Enter chooses, Tab moves between regions, and the visible shortcut hint is always consistent with the platform. Focus is trapped while open, names are announced, and no result depends on color alone. Search latency should preserve typed input and show loading rather than flicker.

## ADOPT / ADAPT / REJECT

| Decision | Rationale |
|---|---|
| ADOPT Linear's command vocabulary and speed | Users can act without leaving the keyboard. |
| ADOPT Slack's scoped cross-object search | CRM conversations and records must be found together but remain typed. |
| ADOPT Notion's recent/grouped results | It improves orientation for empty and ambiguous queries. |
| ADAPT Raycast's multi-step commands | Apply only to explicit CRM actions and respect permissions. |
| ADAPT Vercel's workspace scope | Always show the active workspace and room in results. |
| REJECT a fuzzy search box that only navigates | Search and command are complementary, not interchangeable. |
| REJECT AI as the default empty-state prompt | The primary value is fast deterministic CRM navigation and action. |
| REJECT hidden keyboard-only behavior | Every command remains visible and mouse/touch usable. |

## Implementation impact

Eventually affect command-palette.tsx, app-sidebar-header.tsx, evoSearchIndex, shared record drawer state, object create drawers, permission checks, route definitions, and a search endpoint/index if client indexing is insufficient. No implementation is made in this phase.

## Sources

See the [overall benchmark](ux-benchmark.md), [design system](../design-system.md), and [Mobbin contract](../evocrm-mobbin-contract.md).
