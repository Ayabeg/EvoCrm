# Mobile Pattern Map

**Preserved in M06R** for the Expo client.  
Maps Mobbin iOS patterns → EvoCRM mobile surfaces. Tokens stay Evotechly (`#E8530E`).

| EvoCRM surface | Pattern to copy | Primary refs | Do not copy |
|---|---|---|---|
| Bottom nav | 5 tabs, More overflow | Attio [ed61cbb0](https://mobbin.com/screens/ed61cbb0-34ab-4815-a699-faf9f3569a0a), Jobber [7c66f8f1](https://mobbin.com/screens/7c66f8f1-8ea8-4582-98bf-a0f88dcccf56), Deel [42286bcc](https://mobbin.com/screens/42286bcc-c7f6-411a-83f6-78adb920dfcb) | 7+ tabs; hamburger-only IA |
| Home | Attention cards + next tasks | Attio [a84efb46](https://mobbin.com/screens/a84efb46-b3c6-45c2-a707-edfdf6654ab7), Jobber [6b7ee6db](https://mobbin.com/screens/6b7ee6db-6399-4183-9696-c06bb51ca166) | Widget soup / AI promo walls |
| Contacts list | Search + alphabet/rows | Attio [294bb80d](https://mobbin.com/screens/294bb80d-1bc4-4cf7-b0b0-396cccad7bc7), Quo [5df3aa13](https://mobbin.com/screens/5df3aa13-fd9c-4879-8130-9c9c68469d36) | Social graphs as CRM |
| Contact detail | Identity + quick actions (call/mail/note) | Attio [4229567f](https://mobbin.com/screens/4229567f-581e-4076-a8f9-09e1b4ca3793), OpenPhone [017dce7e](https://mobbin.com/screens/017dce7e-bd8f-4d06-958d-58367b979c31) | Slack channel on record |
| Pipeline board | Horizontal stages / cards | monday [991ca978](https://mobbin.com/screens/991ca978-afc2-4835-9792-144369e6e502), Jobber [f50ec472](https://mobbin.com/screens/f50ec472-c3f8-4bdc-8bd5-dbd856936025) | Desktop 6-column squeeze |
| Lead qualify | Sheet confirm create/link deal | (web SF path still inspirational via web contract) | Multi-page wizard |
| Deal move | Stage picker sheet + lost reason | Jobber/monday board patterns | Silent offline move |
| Activities | Today/Overdue sections | Todoist [e3664e12](https://mobbin.com/screens/e3664e12-9fd4-4240-aca2-522f44003b9e), Attio [a8a1f5a8](https://mobbin.com/screens/a8a1f5a8-3f07-4dd8-9f52-cd5b36cef4ef) | Generic todo without CRM links |
| Inbox list | Unread emphasis | OpenPhone [7473c8b0](https://mobbin.com/screens/7473c8b0-e3f2-4db7-aeec-dc7a1347d901), Outlook [490156e4](https://mobbin.com/screens/490156e4-5cd1-4cc9-b977-022332dd816d) | Consumer chat stickers |
| Thread reply | Composer + note/resolve | OpenPhone / WhatsApp action clarity [a6b9faac](https://mobbin.com/screens/a6b9faac-3e67-42f6-b2ec-aab2ba9cfc0e) | Second chat engine UI |
| Quotes | Document detail + send CTA | Keep minimal; web builder remains source | Full PDF editor on phone V1 |
| Login | Email/password calm form | Standard iOS form patterns from CRM apps | Social-only login V1 |
| More | Settings list | Deel/Attio menu tabs | Full admin console |

## Pattern principles

1. **One primary CTA per screen** (accent discipline).  
2. **Sheets over full-screen forms** for qualify/move/log activity.  
3. **Records always link Contact ↔ Deal ↔ Thread**.  
4. **Failed WhatsApp send** must be visible (product honesty).
