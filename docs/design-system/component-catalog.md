# Component catalog (skeleton)

Fill a row when the component is built in Design Lab and before it is copied to production. Screens live next to the Lab route, not in this file.

| Name | Purpose | Variants | States | Responsive | Keyboard | Source | Examples | Screens |
|---|---|---|---|---|---|---|---|---|
| Tokens (Lab) | Phase 1 foundation page | light / dark | default, reduced-motion | 768 / 1024 / 1440 | Theme toggle, focus ring sample | custom Evo | `/design-lab/tokens` | PR1 1440×900 light + dark |
| EvoShell | One 212px dark cabinet + light workspace + top strip | Menu / Agents / Search modes · expanded / collapsed · light / dark | selected (teal + aria-current), focus, empty conversations | 1280 / 1440 / 1920 no horizontal scroll | Mode tablist (arrows/Home/End), collapse, ⌘K palette | custom Evo | `/design-lab/shell` | PR2 1440×900 |
| CommandPalette | One cmdk command surface (⌘K / Ctrl+K) | open / closed | empty, searching, remote fail, selected row | 560px centered overlay | Dialog + focus trap, Escape, arrow list | cmdk (MIT) + existing command-os | `/design-lab/shell` (Palette ⌘K) | PR2 1440×900 |
| Button | Primary / secondary / ghost | — | — | — | — | shadcn (PR3) | — | — |
| DataGrid | Lists, reports | — | — | — | — | ReUI (PR3) | — | — |
| RecordWorkspace | CRM records | — | — | — | — | custom Evo (PR5) | — | — |

Required columns for every later row: name, purpose, variants, states, responsive, keyboard, source, examples, screens.
