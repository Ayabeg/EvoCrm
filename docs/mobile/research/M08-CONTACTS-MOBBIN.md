# M08 Contacts — Mobbin research

**Date:** 2026-09-20  
**Platform searched:** iOS (Mobbin MCP `search_flows`)  
**Queries:** “CRM contacts list search mobile”, “contact detail profile email phone CRM”

## Primary references (keep)

| Surface | Pattern observed | Flow / prior map |
|---|---|---|
| Contacts list | Persistent search field above rows; calm row = name + secondary line; New CTA when permitted | Attio “Contacts” / “Searching contacts”; Quo “Contacts”; also pattern map Attio [294bb80d](https://mobbin.com/screens/294bb80d-1bc4-4cf7-b0b0-396cccad7bc7), Quo [5df3aa13](https://mobbin.com/screens/5df3aa13-fd9c-4879-8130-9c9c68469d36) |
| Contact detail | Identity header + field card; email/phone as tappable actions (not a chat wall) | Attio “Contact detail”; pattern map Attio [4229567f](https://mobbin.com/screens/4229567f-581e-4076-a8f9-09e1b4ca3793), OpenPhone [017dce7e](https://mobbin.com/screens/017dce7e-bd8f-4d06-958d-58367b979c31) |
| Search flow | Typeahead feel with clear empty state when nothing matches | Attio flow [c6f23739](https://mobbin.com/flows/c6f23739-ef75-4217-aad4-5fcf8b87ee82) (“Searching contacts”) |

## Adopted in M08

1. **Search-first list** on the CRM tab (debounced `q`), not a separate filter modal.
2. **Row density:** display name + company/email/phone subtitle; deterministic initials avatar.
3. **Detail:** identity + lead_status badge + field card; mailto/tel only when values validate.
4. **One primary write CTA:** “New” / “Save contact” in accent; Edit is header action when `crm.edit`.
5. **Permission honesty:** hide write chrome without `crm.edit`; direct deep-link to form shows denial, not a writable form.

## Explicitly not copied

- Social graph / related-people spiders (Mesh “Adding related people”, Tinder-like contact graphs).
- Consumer chat stickers or a second messaging inbox on the contact record (WhatsApp UI is **out of M08**).
- Desktop multi-column contact browsers squeezed onto phone.
- Fake lead-status enums or pipeline boards on the contact form.

## Relationship to existing research

Builds on `docs/mobile/research/MOBILE-PATTERN-MAP.md` Contacts list / Contact detail rows. M08 does not reopen Home, Pipeline, or Inbox patterns.
