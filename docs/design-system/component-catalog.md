# Component catalog

Screens live next to the Lab route. Fill a row when the component is built in Design Lab and before it is copied to production.

| Name | Purpose | Variants | States | Responsive | Keyboard | Source | Examples | Screens |
|---|---|---|---|---|---|---|---|---|
| Tokens (Lab) | Phase 1 foundation page | light / dark | default, reduced-motion | 768 / 1024 / 1440 | Theme toggle, focus ring sample | custom Evo | `/design-lab/tokens` | PR1 1440×900 light + dark |
| EvoShell | One 212px dark cabinet + light workspace + top strip | Menu / Agents / Search modes · expanded / collapsed · light / dark | selected (teal + aria-current), focus, empty conversations | 1280 / 1440 / 1920 no horizontal scroll | Mode tablist (arrows/Home/End), collapse, ⌘K palette | custom Evo | `/design-lab/shell` | PR2 1440×900 |
| CommandPalette | One cmdk command surface (⌘K / Ctrl+K) | open / closed | empty, searching, remote fail, selected row | 560px centered overlay | Dialog + focus trap, Escape, arrow list | cmdk (MIT) + `evo/patterns/command-palette` | `/design-lab/shell` (Palette ⌘K) | PR2 1440×900 |
| Button / IconButton / SplitButton / ButtonGroup | Actions | default, outline, ghost, destructive, secondary | default, hover, focus, active, disabled, loading | 32 compact / 36 standard | Tab, Enter/Space | shadcn MIT | `/design-lab/components#buttons` | PR3 |
| Input / Textarea / SearchInput / NumberInput / MoneyInput / PhoneInput | Data entry | sm / default | default, error, disabled | 32 / 36 | Tab, clear | shadcn + ReUI MIT | `/design-lab/components#inputs` | PR3 |
| Select / Combobox / MultiSelect / TagInput / RecordPicker | Choice | — | empty, selected, disabled | trigger 36 | Arrow keys, typeahead | shadcn + cmdk MIT | `/design-lab/components#selects` | PR3 |
| Checkbox / Radio / Switch / SegmentedControl | Toggles | — | checked, indeterminate, disabled | — | Space | shadcn MIT | `/design-lab/components#toggles` | PR3 |
| DatePicker / DateRangePicker / TimePicker | Dates (fr, week starts Saturday, 24h) | — | empty, selected, disabled | popover | Keyboard calendar | shadcn + ReUI + react-day-picker MIT | `/design-lab/components#dates` | PR3 |
| Badge / Status / Avatar / BotAvatar | Identity | tones + fills | — | — | not color-only | ReUI / shadcn MIT | `/design-lab/components#feedback` | PR3 |
| Alert / Callout / Toast | Messaging | default / destructive / info | — | — | role=alert, sonner only | ReUI + sonner MIT | `/design-lab/components#feedback` | PR3 |
| Card / Panel / Tabs / Breadcrumb / Separator / Kbd | Structure | — | — | wrap | Tabs list | shadcn MIT | `/design-lab/components#chrome` | PR3 |
| Dialog / AlertDialog / Sheet / Drawer / Popover / HoverCard / Dropdown / ContextMenu / Tooltip | Overlays | — | open / closed | viewport-capped | focus trap, Esc, French SR | shadcn + Radix MIT, no vaul | `/design-lab/components#overlays` | PR3 |
| EmptyState / ErrorState / Skeleton / Spinner / Progress | Empty / error / loading | page / panel / banner | empty, error, loading | — | aria-busy, role=status | shadcn MIT | `/design-lab/components#states` | PR3 |
| Form | RHF + zod kit | — | error messages FR | — | labelled fields | shadcn form MIT | `/design-lab/components#form` | PR3 |
| SettingsPage family | Settings workspace: section nav, section/row, dirty SaveBar, unsaved guard, danger zone | clean / dirty / saving / error / success / danger | SaveBar announced; first invalid focused | 768 / 1280 / 1440 | labelled fields, aria-describedby, focus trap on danger | custom Evo on `evo/ui` + RHF/zod | `/design-lab/settings` | PR11 |
| DataGrid | ONE grid | compact / standard / embedded CRM lists | loading, empty, error, selected, bulk | 32–36 rows | sort, select, pagination, aria-sort, FR selection | ReUI MIT (TanStack) | `/design-lab/data` + CRM indexes | PR3 lab / PR4 production |
| FilterBar / FilterBuilder / SavedViews | Filters (2-level AND/OR) | groups on when backend executes | chips, builder open | — | labelled controls | ReUI MIT + custom views | `/design-lab/data` + CRM indexes | PR3 lab / PR4 production |
| CrmListTable | Production CRM list (DataGrid + mobile cards) | contact / company / deal / lead / quote / ticket | loading via workspace, empty, selected | 32–36; cards <480 | peek, keyboard, select page | custom wrap of DataGrid | Contacts–Tickets + Segments | PR4 |
| RecordWorkspace | CRM records | deal / contact / company / lead / ticket / quote peek | loading / empty / 3-pane | 768 / 1024 / 1440 | pane tabs, focus, FR | custom Evo (PR5) | `/design-lab/record` | PR5 1440×900 |
| Pipeline | Deal / ticket board | compact / default cards | dragging / over / empty / lost dialog | 1440 overflow-x | dnd-kit keyboard + FR SR | custom Evo + dnd-kit (PR8) | `/design-lab/pipeline` | PR5 1440×900 |
| ForecastBar | Pipeline totals | facts + FunnelChart | empty stages | 1440 | not color-only | custom Evo on `evo/charts` (PR9) | `/design-lab/pipeline` | PR5 |
| QuoteWorkspace | Quote document | draft / sent / accepted | immutable sent | 1440 split | labelled money / lines | custom Evo (PR5) | `/design-lab/quote` | PR5 1440×900 |
| AgentConversation / UserMessage / AgentMessage | Agent thread | user / assistant | streaming, empty, error | 760px column, 32/36 | live region, Enter send, Shift+Enter newline | Prompt Kit MIT | `/design-lab/agents` · `/agents` | PR7 1440×900 |
| AgentComposer / PromptSuggestion | Prompt input | idle / sending | disabled, context chip | 32/36, orange send only | Enter / Shift+Enter, IME-safe | Prompt Kit MIT | `/design-lab/agents` · `/agents` | PR7 |
| StreamingState / ThinkingState / ReasoningDisclosure | Loaders + reasoning | — | running, reduced-motion | — | aria-live | Prompt Kit loader + PastaUI MIT | `/design-lab/agents` | PR7 |
| ToolCall / ToolResult / AgentTask | Tool timeline | running / done / error | — | — | status text, not color-only | PastaUI MIT | `/design-lab/agents` | PR7 |
| ApprovalCard / AgentPlan / AgentProgress | HITL + plan | pending / approved / denied | never auto-executes | 32/36 | Approuver / Refuser | Tool UI MIT | `/design-lab/agents` | PR7 |
| FileDropzone | Uploads | — | — | — | — | deferred | — | — |
| RichTextEditor | Composer | — | — | — | — | deferred | — | — |

Required columns for every later row: name, purpose, variants, states, responsive, keyboard, source, examples, screens.
