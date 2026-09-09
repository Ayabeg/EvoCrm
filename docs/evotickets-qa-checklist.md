# EvoTickets Mobbin QA checklist

P7 of the approved plan. Screenshot each surface against the linked Mobbin screen. Pest: `tests/Feature/EvoTicketsP7MobbinQaTest.php`.

| # | Surface | Mobbin | Status |
|---|---|---|---|
| 1 | Board columns New / Waiting on contact / Waiting on us / Closed + inactivity | [f9b9fcf1](https://mobbin.com/screens/f9b9fcf1-0767-4ee5-adad-12003a31331e) | DONE |
| 2 | List: views + chips + Create ticket | [d99d4a6b](https://mobbin.com/screens/d99d4a6b-9634-4cd3-8ae1-39e337ebd2ea) | DONE |
| 3 | Record: Path + live Desk thread (no empty conversation) | [8967ff1d](https://mobbin.com/screens/8967ff1d-c744-4825-9f99-7449632e4b6d) layout without the empty state | DONE |
| 4 | Desk Open ticket | [56cf36dd](https://mobbin.com/screens/56cf36dd-2345-49d2-8284-df2965a29945) | DONE |
| 5 | Contact Tickets card (Cases placement) | [a6d82c16](https://mobbin.com/screens/a6d82c16-51a1-4ad7-ba34-f4ebdd3f3aed) · [16a4c1d3](https://mobbin.com/screens/16a4c1d3-33e4-4f0b-9e93-aa2c470abf22) | DONE |
| 6 | No Copilot, no Slack, no Unknown Contact, no second Help Desk inbox | — | DONE |

Anti-patterns from the [Mobbin contract](./evotickets-mobbin-contract.md):

- Ask Evo, not Breeze / Copilot / Einstein
- WhatsApp Cloud + Desk thread, not Slack
- Tickets in the UI, not Cases or Help Desk
- A ticket requires a Contact (no Unknown Contact)
- Desk (`/inbox`) stays the conversation
