# EvoCRM UX Blueprint

## Status and audit basis

This is a research and design blueprint only. No React components, CSS, routes, APIs, backend logic, or production data were changed.

The current-state audit is against the actual repository C:\Users\Moham\EvoCrm, Git HEAD a0b9a8571fed2a1cbe7bd98d58b47d043c4fc7b2. It covers the Laravel/Inertia/React source tree, routes, existing design documents, tests, and the graphified code structure. Graphify completed a code-only pass over 1,044 code files and produced 5,234 nodes and 15,542 edges. Its semantic document/image pass was unavailable because no LLM API key was configured, so claims about source documentation are grounded in direct repository inspection and the cited product sources.

The product has four operating rooms: CRM, Desk/Inbox, Outbound, and Ads. The blueprint preserves that architecture and normalizes behavior through the existing EvoCRM design-system contract.

## 1. EvoCRM UX principles

### REFERENCE

Stripe for clarity and trust, Linear for speed, HubSpot for CRM task continuity, and Intercom/Front for collaborative work.

### WHY

EvoCRM combines customer data, communication, sales, outbound, and advertising. Its core UX problem is not lack of features; it is helping users move from signal to action without losing context.

### ADOPT

1. Make the next useful action obvious.
2. Keep one source of truth for object state and URL state.
3. Prefer progressive disclosure over default complexity.
4. Make ownership, status, channel, and time explicit.
5. Preserve context when moving across rooms.
6. Treat accessibility and keyboard access as core behavior.
7. Use AI only where it reduces a concrete CRM task.
8. Share primitives across objects; customize semantics, not visual language.
9. Make errors recoverable and external actions reviewable.
10. Optimize for daily operating loops, not screenshot novelty.

### DO NOT COPY

Do not copy HubSpot teal, Salesforce blue, Intercom support language, Shopify commerce metaphors, Linear issue terminology, or any competitor's branded iconography and visual hierarchy.

### EVOCRM ADAPTATION

Use the locked EvoCRM foundation: canvas #F7F7F5, white surfaces, dark text, #E8530E accent, Geist, 64/240 sidebar, 56 topbar, 36 controls, 48 table rows, 8px radius, restrained borders, and accessible focus states. Reference behavior is translated into these primitives.

### IMPLEMENTATION IMPACT

Eventually affect docs/design-system.md, resources/js/ds, components/ui, ui/aurora, and the shared shell. No implementation is authorized in this phase.

## 2. Navigation architecture

### REFERENCE

Linear for persistent navigation and keyboard access; Slack for workspace/team orientation; Shopify for room-level admin separation.

### WHY

Linear makes frequent destinations fast to scan, while Slack and Shopify clarify scope. EvoCRM already has four rooms and a persistent sidebar, so the highest-value improvement is predictability and cross-room continuity.

### ADOPT

Keep Home, CRM, Communication, Sales, Automation, More, and Settings as stable groups. Make Inbox and Pipeline first-class daily destinations. Add visible active state, unread/attention counts where meaningful, and a global search/create entry in the topbar.

### DO NOT COPY

Do not expose every capability as a first-level navigation item. Do not create separate navigation trees for every integration or object.

### EVOCRM ADAPTATION

Preserve app-sidebar.tsx and app-sidebar-header.tsx as the active shell. Treat Outbound and Ads as room destinations under More or an explicit room switcher, but keep their deep routes stable. On mobile, transform the sidebar into a sheet and provide a persistent current-room title.

### IMPLEMENTATION IMPACT

Eventually affect resources/js/components/app-sidebar.tsx, app-sidebar-header.tsx, layouts/app/app-sidebar-layout.tsx, sidebar primitives, and route metadata. Review the coexistence of legacy app-header.tsx/app-header-layout.tsx.

## 3. Dashboard architecture

### REFERENCE

Shopify wins the overview hierarchy; Stripe wins concise operational status; HubSpot wins record-linked CRM drill-down. See docs/research/dashboard-benchmark.md.

### WHY

A dashboard should help a user decide what to do next. Shopify's overview makes business health legible, while Stripe and HubSpot make the path from metric to record clear.

### ADOPT

Use context bar, Needs attention, KPI strip, performance, and work queues. Every KPI or alert links to a filtered DataWorkspace, PipelineBoard, Activities, Inbox, or Settings/connector page.

### DO NOT COPY

Do not turn Home into a commerce dashboard or a customizable widget marketplace. Do not show charts without comparison, definition, or an action.

### EVOCRM ADAPTATION

Use current home.tsx primitives: DashboardHeader, HomeKpiStrip, HomeWidget, HomeWidgetEmpty, DashboardSection, pipeline bars, recent activity, quota, and Needs attention. Rank attention by age, impact, owner, and reversibility. Keep Reports for saved dashboards, exploratory filters, and historical analysis.

### IMPLEMENTATION IMPACT

Eventually affect resources/js/pages/home.tsx, dashboard data contracts, reports pages/routes, saved dashboard widgets, and links to DataWorkspace, PipelineBoard, Activities, Inbox, and Workflows.

## 4. DataWorkspace architecture

### REFERENCE

HubSpot for the CRM index and saved views; Attio for speed and relationships; Airtable for explicit view configuration; Pipedrive for sales-specific fields.

### WHY

EvoCRM already has a shared DataWorkspace foundation. The winning model is one shell with object configuration, not four unrelated tables and not a generic spreadsheet with no CRM semantics.

### ADOPT

Standardize header, saved views, query bar, result surface, selection/bulk bar, and pagination. Keep URL state for view, filters, sort, columns, page, and mode. Use common density and object-specific columns.

### DO NOT COPY

Do not copy each competitor's colors, row chrome, or plan-specific control density. Do not force board-only fields into Contacts or Quotes.

### EVOCRM ADAPTATION

Continue DataWorkspace.tsx, SavedViews.tsx, FilterBar.tsx, AdvancedFilterDrawer.tsx, DataTable.tsx, and BulkActionBar.tsx as the contract. Preserve domain ListViewTable and board children where semantics require them, but align selection, loading, empty, pagination, and query behavior. Revisit the current rows={[]} wrapper boundary and the Quotes saved-view limitation.

### IMPLEMENTATION IMPACT

Eventually affect resources/js/ds/workspace/*, components/crm/crm-list-shell.tsx, list-query.ts, list-view-config.ts, list-view-table.tsx, object pages for Contacts, Companies, Leads, Deals, Quotes, and associated controllers.

## 5. RecordDrawer architecture

### REFERENCE

HubSpot for contextual records; Attio for fast relational inspection; Pipedrive for next activity.

### WHY

Users often need to inspect a record while triaging a list, pipeline, inbox, or search result. A drawer reduces context switching, but deep relationship work still needs a durable page.

### ADOPT

Create a Quick Record Drawer with identity, key properties, owner, stage/lifecycle, associations, last activity, next action, and primary actions. Support open full workspace, URL-addressable state, focus return, and mobile full-height sheet behavior.

### DO NOT COPY

Do not duplicate the entire record page inside the drawer. Do not hide complex forms, quote construction, large timelines, or permission-heavy editors behind a tiny panel.

### EVOCRM ADAPTATION

Make the drawer additive to current RecordShell and openable from DataWorkspace, PipelineBoard, Inbox, Activities, Quotes, and command results. Keep one object data contract and one action-permission contract for drawer and full page.

### IMPLEMENTATION IMPACT

Eventually affect record-chrome.tsx, adaptive-workspace-shell.tsx, record-hub.tsx, record-workspace.tsx, record-properties.tsx, record-activity-panel.tsx, record-action-row.tsx, and shared overlay state.

## 6. Full record architecture

### REFERENCE

HubSpot for identity-to-timeline flow, Salesforce for configurable related data, Attio for relational context, and Pipedrive for sales follow-up.

### WHY

The current full-page RecordShell is the right durable surface. Its improvement should be about ordering, relationship clarity, and actionable timeline semantics.

### ADOPT

Use header identity/status/owner, essential properties, activity composer, typed timeline, associations, deals, quotes, conversations, files, and contextual Ask Evo. Keep the next action prominent for open Deals and important Contacts.

### DO NOT COPY

Do not copy Salesforce's default configuration density or HubSpot's product-promotion surfaces. Do not treat WhatsApp/email/outbound as indistinguishable timeline text.

### EVOCRM ADAPTATION

Keep the current left/center/right adaptive arrangement. Label each activity by source and channel; expose contact, company, deal, quote, ticket, and conversation relationships with direct open/drawer actions. Make right-side content collapsible on tablet and optional when empty.

### IMPLEMENTATION IMPACT

Eventually affect record-chrome.tsx, record-workspace.tsx, record-hub.tsx, record-properties.tsx, record-activity-panel.tsx, activity-composer.tsx, ask-evo-panel.tsx, and Contact/Company/Deal/Quote show routes.

## 7. Pipeline architecture

### REFERENCE

Pipedrive for sales Kanban clarity, HubSpot for board/list parity, and Salesforce for weighted forecast concepts.

### WHY

Pipedrive keeps stage, value, owner, and next activity visible. HubSpot provides the model for shared filters and records. Salesforce contributes useful forecast concepts but should not define default complexity.

### ADOPT

Column headers show stage, count, total value, and weighted value. Cards show deal, company/contact, amount/currency, owner, next activity, stale reason, and quote/conversation markers only when relevant. Provide drag, keyboard/menu move, undo, and list parity.

### DO NOT COPY

Do not make drag/drop the only movement method. Do not create a separate lead board or expose every association on every card.

### EVOCRM ADAPTATION

Build on resources/js/pages/crm/deals/board.tsx, the existing stages, board options, and DealController move route. Keep /leads redirect behavior and /crm/leads list/detail semantics. Make stale and no-next-action states actionable, not merely colored.

### IMPLEMENTATION IMPACT

Eventually affect deals/board.tsx, contact-deals-kanban.tsx, board options, deal move endpoint/controller, DataWorkspace query sharing, record drawer, and board tests.

## 8. Inbox architecture

### REFERENCE

Intercom for queue/composer/context, Front for collaboration, HubSpot for CRM context, and Zendesk for explicit resolution state.

### WHY

The native EvoCRM inbox is already close to the desired model: folder rail, conversation list/thread, and contact sidebar. The strategic concern is making the four-pane contract explicit while preserving the embedded EvoDesk boundary.

### ADOPT

Use Inbox navigation, Conversation list, Conversation, and CRM context as the logical four panes. Support assignment, unread/open/waiting/resolved states, internal note/reply mode, macros/templates, shared drafts, channel identity, ticket links, and quick contact/company/deal/quote/task actions.

### DO NOT COPY

Do not turn all conversations into tickets. Do not make AI the main composer. Do not let iframe fallback differences hide identity or lose the user's CRM context.

### EVOCRM ADAPTATION

Keep pages/desk/inbox.tsx as the boundary: embedded EvoDesk when configured, native FrontDesk fallback otherwise. Align InboxFolderRail, conversation list, conversation composer, InboxContactSidebar, and pages/crm/conversations.tsx around the same states and deep-link behavior.

### IMPLEMENTATION IMPACT

Eventually affect pages/desk/inbox.tsx, components/crm/desk-shell.tsx, inbox-chrome.tsx, InboxFolderRail, InboxContactSidebar, conversation history, thread reply/ticket routes, and record/activity integration.

## 9. Activities architecture

### REFERENCE

Linear for speed and keyboard completion, Asana for queue/scheduling, Todoist for date and priority interactions, and HubSpot for CRM relationships.

### WHY

Activities should be a daily execution queue, not a passive log. Users need overdue/upcoming grouping, priority, completion, and direct record context.

### ADOPT

Use Today, Overdue, Upcoming, Completed, and Unscheduled groups. Each item shows type, title, due date/time, priority, owner, related records, channel, and one completion action. Support quick add, reschedule, keyboard complete, and open drawer.

### DO NOT COPY

Do not create a separate task universe disconnected from records. Do not use a calendar as the only navigation model.

### EVOCRM ADAPTATION

Build on resources/js/pages/crm/activities.tsx, ActivityRecorder, activity-composer.tsx, and current complete/attendance routes. Link activities to Contact, Company, Deal, Quote, Conversation, or Ticket and expose next action in record, pipeline, inbox, and dashboard.

### IMPLEMENTATION IMPACT

Eventually affect activities page, activity composer, ActivityRecorder, completion/attendance endpoints, dashboard cards, timeline items, and keyboard shortcuts.

## 10. Quotes architecture

### REFERENCE

Stripe for quote construction and status, PandaDoc for document lifecycle, and HubSpot for CRM associations.

### WHY

Quotes combine structured commercial data with a customer-facing document and a status lifecycle. Stripe provides strong line-item and preview behavior; PandaDoc emphasizes viewed/accepted state.

### ADOPT

Separate quote list, builder, preview, and send/revoke lifecycle. Show quote status, contact/company/deal association, line items, quantity, currency, taxes, discounts, validity, notes, viewed, accepted, expired, and rejected states. After send, show delivery and next action.

### DO NOT COPY

Do not copy payment-specific terminology or make a quote builder a general-purpose document editor. Do not bury status in an activity timeline.

### EVOCRM ADAPTATION

Keep Quotes in the shared DataWorkspace. Upgrade the current create drawer for simple quotes and route complex quotes to a full builder/preview workspace. Use existing quote routes and RecordPageFrame/RecordShell for durable detail.

### IMPLEMENTATION IMPACT

Eventually affect resources/js/pages/crm/quotes/index.tsx, quote show/preview/send/revoke routes, CreateDrawer, quote line-item components, public quote/book views, and deal/contact/company associations.

## 11. Automation architecture

### REFERENCE

Shopify Flow for approachable structured authoring, HubSpot for branches and testing, Zapier for action discovery, and Make/n8n only as advanced references.

### WHY

Ordinary SMB users need a readable recipe. Canvas-first systems add spatial and technical complexity before the user understands trigger, conditions, timing, and actions.

### ADOPT

Use Trigger, Enrollment, Conditions, If/Else, Actions, Timing, Test, Review, and Activation. Show draft/active/paused/failed states and execution history. Require a representative-record preview before activation.

### DO NOT COPY

Do not make a visual canvas the default. Do not activate external sends or destructive updates with no review. Do not add arbitrary code actions to the ordinary builder.

### EVOCRM ADAPTATION

Preserve the structured editor in pages/crm/workflows/index.tsx and the current WorkflowController/WorkflowRunner model. Add readable path summaries, test output, permission/data warnings, retries, and record-linked execution logs.

### IMPLEMENTATION IMPACT

Eventually affect workflow page, templates, WorkflowController, WorkflowRunner, connector action registry, validation, history/log views, and workflow tests.

## 12. Settings architecture

### REFERENCE

Stripe for scope and dangerous actions, Shopify for guided setup, Linear for compact settings IA, Slack for workspace/team separation, and Vercel for destructive confirmation.

### WHY

EvoCRM has many settings capabilities already. A stable scope-aware information architecture lowers admin search cost and prevents accidental changes.

### ADOPT

Group Personal, Workspace, CRM, Communication, Automation, Integrations, and Developer. Every page exposes scope, purpose, save behavior, validation, and related setup. Search settings without replacing visible categories.

### DO NOT COPY

Do not present a single flat list or hide deep configuration entirely behind search. Do not use generic danger zones with unclear consequences.

### EVOCRM ADAPTATION

Normalize settings/apps, People, Permissions, Pipelines, Attributes, Record layouts, Channels, WhatsApp, Meta, connectors, and API/developer pages under a consistent settings shell. Keep shareable routes and explicit scopes.

### IMPLEMENTATION IMPACT

Eventually affect resources/js/pages/settings/*, routes/settings.php, settings navigation/layout, setup wizard, connector forms, People/Permissions/Pipelines/Attributes/Record layouts, and danger-dialog primitives.

## 13. Integration architecture

### REFERENCE

Shopify for directory and connected state, Zapier for app/action discovery, Slack for permission-aware connection, Notion for simple integration setup, and HubSpot for CRM data mapping.

### WHY

Integrations are not only a gallery. Users need to know what a connection enables, what it can read/write, who authorized it, its last sync, and how to recover from failure.

### ADOPT

Use categories, search, app cards, connected/configure/reconnect/paused/error states, permissions, sync status, logs, and disconnect confirmation. Surface failed connections in Needs attention.

### DO NOT COPY

Do not treat all apps as identical OAuth tiles. Do not hide channel-specific data, consent, or sync direction.

### EVOCRM ADAPTATION

Use settings Apps, connector registrars, WhatsApp/WhatsApp Business, Meta, email/SMTP/IMAP, EvoDesk, and future apps behind one connector model. Explain the downstream rooms affected: Inbox, CRM records, Outbound, Ads, or Reports.

### IMPLEMENTATION IMPACT

Eventually affect Settings Apps pages, ConnectorRegistrar, connector controllers, WhatsApp and Meta routes, outbound mailboxes, Desk configuration, sync status components, and setup checklist.

## 14. Command palette architecture

### REFERENCE

Linear for commands and keyboard speed, Slack for scoped cross-object search, Notion for recent/grouped results, and Raycast for multi-step commands.

### WHY

The current palette already opens on Cmd/Ctrl+K and searches records/pages. The next step is to make the interface an intentional cross-object command surface without creating ambiguous destructive actions.

### ADOPT

Provide Search, Navigate, Create, Context actions, and optional Ask Evo groups. Show recent items when empty. Results show type, name, status/stage, owner, and last update. Use two-step selection for mutations.

### DO NOT COPY

Do not turn the palette into an unbounded system launcher. Do not execute sends, deletes, disconnects, or bulk changes from fuzzy text alone.

### EVOCRM ADAPTATION

Extend command-palette.tsx, NAV_ITEMS, and evoSearchIndex while retaining visible route access. A result should open Quick Record Drawer by default when context allows, with an explicit Open full workspace action.

### IMPLEMENTATION IMPACT

Eventually affect command-palette.tsx, app-sidebar-header.tsx, search/index endpoints, record drawer state, object create drawers, permission checks, and shortcut documentation.

## 15. Onboarding architecture

### REFERENCE

Shopify for checklists and setup momentum, Linear for first-loop speed, Stripe for milestones, HubSpot for CRM import/pipeline depth, and Notion for helpful sample context.

### WHY

EvoCRM has many meaningful setup dependencies: people, records, pipeline, WhatsApp/Desk, Meta, Outbound, and Ads. A closed wizard cannot communicate ongoing activation.

### ADOPT

Use a persistent checklist: workspace identity, team, import, pipeline, primary channel, optional Meta/Outbound, first contact, first deal, first activity/message, and first dashboard signal. Each item has clear state and a next action.

### DO NOT COPY

Do not force every workspace through every integration. Do not call setup complete when a wizard closes. Do not seed unlabeled sample data into production.

### EVOCRM ADAPTATION

Keep settings/setup/wizard.tsx and add a durable activation state visible from Home and Settings. Import uses preview/mapping/duplicates/progress/result. Connector cards explain downstream value and permissions.

### IMPLEMENTATION IMPACT

Eventually affect setup wizard, Home checklist, import pages, settings/apps, connectors, WhatsApp/Meta setup, People, Pipelines, dashboard empty states, and activation telemetry.

## 16. AI interaction architecture

### REFERENCE

Intercom for inbox assistance, HubSpot for record summaries, and Linear for contextual agent/command entry. The reference quality is evaluated by task reduction, not by how prominent the AI branding is.

### WHY

AI helps EvoCRM when it removes repetitive reading, drafting, or triage. It harms trust when it makes unsupported claims, changes CRM state silently, or presents a generic chat destination detached from work.

### ADOPT

Use contextual entry points: summarize this record/thread, draft a reply, suggest next action, find related records, explain a dashboard anomaly, and preview a workflow path. Show source records, uncertainty, permissions, and the action that will occur. Require review before sending or mutating data.

### DO NOT COPY

Do not add a persistent floating AI button just for fashion. Do not use competitor names such as Breeze, Copilot, or Einstein. Do not allow silent auto-send, auto-stage-change, or auto-create behavior.

### EVOCRM ADAPTATION

Use Ask Evo in record context, inbox context, dashboard insights, and command palette only when the user invokes a grounded task. Provide evidence links to records, conversations, metrics, or workflow history. Store a reviewable draft rather than an opaque action.

### IMPLEMENTATION IMPACT

Eventually affect ask-evo-panel.tsx, record actions, inbox composer, dashboard insight actions, command-palette.tsx, permissions, audit history, and AI error/grounding states.

## 17. Responsive behavior

### REFERENCE

Intercom and Front for adaptive inbox panes, Linear for responsive work surfaces, Shopify for dashboard stacking, and the existing AdaptiveWorkspaceShell for EvoCRM behavior.

### WHY

CRM users work on wide screens, but urgent activities and inbox triage happen on smaller devices. Responsive behavior must preserve task order and context, not merely shrink desktop.

### ADOPT

Desktop uses multi-pane and two-column layouts. Tablet collapses secondary regions behind explicit switches. Mobile prioritizes one primary task, converts drawers to full-height sheets, stacks dashboards, and replaces drag-only board interaction with stage actions.

### DO NOT COPY

Do not hide essential state behind hover or horizontal overflow with no affordance. Do not force the four-pane inbox or three-pane record view into simultaneous mobile columns.

### EVOCRM ADAPTATION

Use AdaptiveWorkspaceShell's current desktop/tablet contract. Define mobile priority for Home, DataWorkspace, Record, Pipeline, Inbox, Quotes, Workflows, and Settings. Keep sticky headers/actions only when they do not cover content or focus.

### IMPLEMENTATION IMPACT

Eventually affect AdaptiveWorkspaceShell, app sidebar, DataWorkspace tables/boards, RecordShell, Inbox, quote builder, workflow builder, and responsive tests.

## 18. Accessibility requirements

### REFERENCE

WCAG 2.2, WAI-ARIA dialog and combobox patterns, MDN keyboard guidance, and production keyboard behavior from Linear and Slack.

### WHY

EvoCRM is a dense operational application. Accessibility failures in focus, tables, filters, overlays, drag/drop, and async feedback block core work.

### ADOPT

Meet WCAG 2.2 AA targets appropriate to the application. Provide semantic landmarks, visible focus, logical tab order, accessible names, announced status/loading/errors, keyboard alternatives for drag/drop, focus trap/return for modal/drawer/command overlays, and no color-only meaning. Support reduced motion and zoom/reflow.

### DO NOT COPY

Do not accept visual QA as accessibility QA. Do not rely on hover tooltips, placeholder text, or icon-only buttons without names. Do not use a disabled control as the only explanation for permissions.

### EVOCRM ADAPTATION

Audit shared primitives first, then DataWorkspace, RecordShell, Inbox, PipelineBoard, command palette, settings forms, and quote/workflow builders. Keep status text, channel labels, and validation messages visible and screen-reader friendly.

### IMPLEMENTATION IMPACT

Eventually affect resources/js/ds, components/ui, ui/aurora, forms, dialogs, comboboxes, tables, drawers, command menu, board movement, and accessibility tests. No production changes are made now.

## 19. Keyboard interaction model

### REFERENCE

Linear and Slack for shortcut discoverability and speed; Raycast for command navigation; Todoist for quick scheduling.

### WHY

Repeated CRM work rewards low-latency keyboard transitions, but shortcuts must remain discoverable, platform-aware, and safe while typing.

### ADOPT

Cmd/Ctrl+K opens global command. Escape closes/backtracks. Arrow keys navigate menus/results. Enter selects. Tab moves regions. J/K may move inbox selection only if documented and non-conflicting. Completion, assignment, stage movement, due-date entry, and drawer open need accessible alternatives.

### DO NOT COPY

Do not create a large undiscoverable shortcut layer. Do not hijack browser or text-editing shortcuts. Do not require keyboard-only gestures for drag/drop, bulk actions, or record opening.

### EVOCRM ADAPTATION

Publish a small core shortcut set in command palette and help: search, create, navigate room, complete activity, open drawer, move inbox selection, and close overlays. Modifier labels adapt to platform.

### IMPLEMENTATION IMPACT

Eventually affect command-palette.tsx, app-sidebar-header.tsx, activities, inbox, board, tables, drawers, and shortcut/help surfaces.

## 20. Motion principles

### REFERENCE

Linear for restrained transitions, Stripe for state feedback, Intercom for inbox panel transitions, and Apple HIG drag-and-drop guidance.

### WHY

Motion should communicate continuity and result, especially when a drawer opens, a record moves stages, a message sends, or a workflow changes state.

### ADOPT

Use short, purposeful transitions for overlay open/close, list selection, optimistic movement, save acknowledgement, and reorder. Use skeletons matching final geometry. Provide reduced-motion behavior and preserve focus during transitions.

### DO NOT COPY

Do not animate every dashboard update or use decorative spring motion for dense tables and forms. Do not make success depend on a transient animation.

### EVOCRM ADAPTATION

Normalize motion durations/easing in the design system. Pipeline movement gets optimistic state plus undo; drawer transitions preserve originating context; async saves use stable pending/success/error states; reduced motion removes nonessential transforms.

### IMPLEMENTATION IMPACT

Eventually affect design tokens, shared overlay/table/board primitives, toast and loading patterns, Inbox, RecordDrawer, PipelineBoard, and motion tests. No implementation is performed in this phase.

## Top 10 UX decisions

1. Preserve the four-room architecture and normalize the interactions across rooms.
2. Keep DataWorkspace as the shared Contacts/Companies/Deals/Quotes foundation.
3. Add an additive Quick Record Drawer while retaining Full Record Workspace for deep work.
4. Make Home an action-oriented operating dashboard; keep Reports analytical and configurable.
5. Use Pipedrive-style sales clarity for PipelineBoard with weighted value, next action, stale reason, and accessible movement.
6. Make native Inbox a four-pane contract while preserving the embedded EvoDesk boundary.
7. Keep automation structured and approachable; add test, preview, history, and safe activation before a canvas.
8. Make Cmd/Ctrl+K cross-object search plus create/context actions, not only page navigation.
9. Make onboarding a durable activation checklist tied to first real CRM outcomes.
10. Place AI inside grounded CRM work with evidence and human review, never as a generic floating destination.

## Top 10 current EvoCRM problems

1. The shared DataWorkspace shell does not yet own the complete result/selection contract: CrmListShell passes rows={[]} while domain tables render through children.
2. There is no universal contextual record drawer across list, pipeline, inbox, activities, and search.
3. Home and Reports are both substantial surfaces but their operating-versus-analysis boundary needs to be made explicit.
4. Native Inbox is close to four-pane behavior, but the embedded EvoDesk mode and CRM conversations history create a product-boundary handoff risk.
5. Pipeline cards and movement need explicit stale, next-action, keyboard, menu, undo, and failure behavior.
6. Command palette currently has Records and Navigate but lacks create, context actions, recent items, and parameterized safe commands.
7. Current settings capabilities are broad but need a stable scope-aware IA and consistent danger flows.
8. Workflow authoring has structure but needs test-before-activation, path preview, permission/data warnings, and execution history clarity.
9. Shared UI sources are duplicated or inconsistent: active and legacy shell paths, Aurora/DS layers, and mixed Phosphor/Lucide imports.
10. AI entry points exist around records but need a single evidence-grounded policy across record, inbox, dashboard, and command contexts.

## Top 10 highest-impact changes

1. Establish and document a single shared primitive/interaction contract.
2. Complete DataWorkspace query, selection, bulk, loading, empty, and pagination parity across object pages.
3. Introduce the universal Quick Record Drawer with URL history and cross-surface launch.
4. Ship Needs attention as a real cross-room work queue with deep links.
5. Make PipelineBoard next-action/stale state and accessible movement first class.
6. Align native and embedded Inbox handoff, CRM context, and conversation state.
7. Expand global search into cross-object search/create/context commands.
8. Add workflow test/preview/history and safe activation.
9. Restructure settings and integration setup around scope, permission, health, and recovery.
10. Add an activation checklist that drives a user to import, connect, create, and complete a first CRM outcome.

## Implementation priority

### P0: establish trust and continuity

- Shared interaction and component contract.
- DataWorkspace parity for Contacts, Companies, Deals, and Quotes.
- Quick Record Drawer foundation.
- Needs attention links and reliable empty/error/loading states.
- Pipeline movement safety and next-action visibility.
- Inbox boundary and CRM context consistency.
- Accessibility baseline for overlays, tables, menus, forms, and keyboard paths.

### P1: increase daily operating speed

- Cross-object search/command expansion.
- Activity queue and record-aware completion.
- Quote builder/preview/status lifecycle.
- Workflow test/preview/history.
- Settings IA and integration health.
- Activation checklist and import preview.

### P2: differentiate responsibly

- Contextual Ask Evo summaries, drafting, and next-action suggestions with evidence.
- Advanced workflow canvas compiled to the structured model.
- Configurable Reports/dashboard improvements after Home operating hierarchy is reliable.
- Cross-room attribution and deeper Ads/Outbound/CRM intelligence.
- Advanced personalization only after shared primitives and accessibility are stable.

## Review gate

This blueprint is ready for product/design review. The next phase should validate the P0 hypotheses with task-based tests against real EvoCRM workflows before implementation begins.
