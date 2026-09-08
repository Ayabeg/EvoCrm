# EvoCRM Mobbin QA checklist

P10 of the approved plan. Screenshot each surface against the linked Mobbin screen. Pest: `tests/Feature/EvoCrmP10MobbinQaTest.php`.

| # | Surface | Mobbin | Status |
|---|---|---|---|
| 1 | Home: guided left + feed right | [1f571c85](https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748) | DONE |
| 2 | Deals list: views + chips + create | [9e67fda1](https://mobbin.com/screens/9e67fda1-7a17-4149-91cf-6097a5c22e2d) | DONE |
| 3 | Deals board: inactivity + weighted footer | [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1) | DONE |
| 4 | Contact show: 3-pane + Ask Evo | [f215a882](https://mobbin.com/screens/f215a882-8c79-4bf8-8483-4d8ae465c3c1) | DONE |
| 5 | Lead show: Path + Convert | [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6) | DONE |
| 6 | Sequence editor: vertical steps | [0a34649c](https://mobbin.com/screens/0a34649c-a49d-475b-9a2a-9da4128bc112) | DONE |
| 7 | No Salesforce blue, no Breeze, no Slack rail, no second `/leads` product | — | DONE |

Anti-patterns from the [Mobbin contract](./evocrm-mobbin-contract.md):

- Ask Evo, not Breeze / Copilot / Einstein
- WhatsApp Cloud + Desk thread, not Slack
- Official WhatsApp template step, not LinkedIn Connect
- `GET /leads` redirects to `/crm/deals/board`
