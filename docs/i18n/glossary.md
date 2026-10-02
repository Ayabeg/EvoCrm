# EvoCRM i18n glossary

Locked terminology for FR / EN / AR. Translate from this table, not from a
literal dictionary. Arabic is Modern Standard Arabic as used in Algerian and
MENA business software (not word-for-word English).

## Policy

| Topic | Rule |
|---|---|
| Locales | `fr` (fr-DZ), `en` (en-DZ with safe fallback), `ar` (ar-DZ) |
| Default | French for new Algerian workspaces. `APP_LOCALE` is the last fallback only. |
| Resolution | user `preferences.locale` → workspace `preferences.locale` → pre-auth `locale` cookie/session → `config('app.locale')` |
| Storage | Compact preference in existing JSON: `{ "locale": "fr" \| "en" \| "ar" }`. No translated CRM rows. |
| Keys | English source keys in `lang/fr.json`, `lang/en.json`, `lang/ar.json`. All three files expose the same keys. |
| Numbers | Latin digits `0–9` for every locale, including `ar-DZ` (`numberingSystem: 'latn'`). Maghreb business convention. |
| Never localise | IDs, phone numbers, quote numbers, emails, campaign codes. Examples: `+213 550 18 80 01`, `DV-2026-0047`, `CAMP-0042`, `email@example.com` |
| Currency | Always DA / DZD. Language does not change currency. |
| Timezone | Always Africa/Algiers. Week starts Saturday. Clock is 24h. |
| User content | Contact names, company names, deal names, campaign names, email bodies, messages, notes, custom field values stay in the author's language. |
| Inbox | Chrome follows UI locale. Message bodies use `dir="auto"`. |
| Charts | Titles/legends/tooltips follow UI locale. Do not reverse time-series chronology in RTL. |
| Fonts | Geist Sans (Latin). IBM Plex Sans Arabic (OFL) for Arabic UI. |

## Product terminology

| KEY | FRENCH | ENGLISH | ARABIC | NOTES |
|---|---|---|---|---|
| Home | Accueil | Home | الرئيسية | Shell first item |
| Contacts | Contacts | Contacts | جهات الاتصال | People you sell to |
| Contact | Contact | Contact | جهة اتصال | Singular record |
| Companies | Entreprises | Companies | الشركات | Legal entities |
| Company | Entreprise | Company | الشركة | Also “Société” in older chrome — lock Entreprises / الشركة |
| Leads | Pistes | Leads | العملاء المحتملون | Nav uses Pistes in FR. Agents chrome may say “Leads” in FR per product brief. |
| Lead | Piste | Lead | عميل محتمل | Qualifying record, not yet a deal |
| Deals | Affaires | Deals | الصفقات | Commercial opportunities |
| Deal | Affaire | Deal | الصفقة | Never “opportunité” as the primary noun |
| Pipeline | Pipeline | Pipeline | مسار المبيعات | Keep “Pipeline” in FR (already locked). AR is the business term, not أنبوب |
| Quotes | Devis | Quotes | عروض الأسعار | Commercial offer document |
| Quote | Devis | Quote | عرض الأسعار | Numbered `DV-…` — do not localise the number |
| Inbox | Boîte de réception | Inbox | صندوق الوارد | Chrome only. Message content stays original |
| Activities | Activités | Activities | الأنشطة | Tasks, calls, meetings, notes |
| Activity | Activité | Activity | النشاط | |
| Tickets | Tickets | Tickets | التذاكر | Support / desk |
| Ticket | Ticket | Ticket | التذكرة | |
| Agents | Agents | Agents | الوكلاء | Product agents, not “AI” as the label |
| Agent | Agent | Agent | الوكيل | |
| Outbound | Outbound | Outbound | الصادر | Keep Outbound in FR/EN |
| Ads | Pubs | Ads | الإعلانات | FR lock is Pubs |
| Campaign | Campagne | Campaign | الحملة | Ads or outbound |
| Campaigns | Campagnes | Campaigns | الحملات | |
| Sequence | Séquence | Sequence | التسلسل | Outbound step series |
| Sequences | Séquences | Sequences | التسلسلات | |
| Workflow | Workflow | Workflow | سير العمل | Keep Workflow in FR/EN |
| Workflows | Workflows | Workflows | سير العمل | |
| Segments | Segments | Segments | الشرائح | |
| Segment | Segment | Segment | الشريحة | |
| Reports | Rapports | Reports | التقارير | |
| Attribution | Attribution | Attribution | الإسناد | Ads |
| Saved view | Vue enregistrée | Saved view | العرض المحفوظ | DataGrid |
| Owner | Propriétaire | Owner | المسؤول | Record owner, not legal owner of the company |
| Stage | Étape | Stage | المرحلة | Pipeline / ticket stage |
| Settings | Paramètres | Settings | الإعدادات | |
| Preferences | Préférences | Preferences | التفضيلات | Appearance + language |
| Language | Langue | Language | اللغة | Selector: Français / English / العربية |
| Profile | Profil | Profile | الملف الشخصي | |
| Appearance | Apparence | Appearance | المظهر | Light / Dark / System cabinet |
| Workspace | Espace | Workspace | مساحة العمل | Tenant |
| Login | Connexion | Log in | تسجيل الدخول | Auth |
| Register | Inscription | Register | إنشاء حساب | Auth |
| Search | Recherche | Search | بحث | Shell mode + command |
| Menu | Menu | Menu | القائمة | Shell mode — keep Menu in FR/EN |
| New conversation | Nouvelle conversation | New conversation | محادثة جديدة | Agents |
| Available | Disponible | Available | متاح | Agents presence |
| Conversations | Conversations | Conversations | المحادثات | Agents / Inbox |
| Context | Contexte | Context | السياق | Agents CRM context |
| Your agents | Vos agents | Your agents | وكلاؤك | Agents directory heading |
| Overview | Vue d'ensemble | Overview | نظرة عامة | Nested nav |
| Mailboxes | Boîtes mail | Mailboxes | صناديق البريد | Outbound |
| Templates | Modèles | Templates | النماذج | |
| Warmup | Warmup | Warmup | الإحماء | Keep Warmup in FR/EN |
| Funnels | Entonnoirs | Funnels | مسارات التحويل | |
| Import | Importer | Import | استيراد | |
| Merge | Fusionner | Merge | دمج | Duplicates |
| Filters | Filtres | Filters | عوامل التصفية | |
| Pagination | Pagination | Pagination | ترقيم الصفحات | |
| Empty | Vide | Empty | فارغ | Empty states use the specific sentence, not this stem alone |
| Save | Enregistrer | Save | حفظ | |
| Cancel | Annuler | Cancel | إلغاء | |
| Delete | Supprimer | Delete | حذف | |
| Create | Créer | Create | إنشاء | |
| Edit | Modifier | Edit | تعديل | |
| Close | Fermer | Close | إغلاق | |
| Open | Ouvrir | Open | فتح | |
| Send | Envoyer | Send | إرسال | |
| Reply | Répondre | Reply | رد | Inbox |
| Note | Note | Note | ملاحظة | Internal note |
| Phone | Téléphone | Phone | الهاتف | Display via `formatPhone`, never localise digits |
| Email | E-mail | Email | البريد الإلكتروني | Never localise the address |
| Amount | Montant | Amount | المبلغ | Format with DA + Latin digits |
| Date | Date | Date | التاريخ | Locale-aware, Africa/Algiers |
| Time | Heure | Time | الوقت | 24h |
| Today | Aujourd'hui | Today | اليوم | |
| Yesterday | Hier | Yesterday | أمس | |
| Previous | Précédentes | Previous | السابقة | Agents chat groups |
| Next | Suivant | Next | التالي | |
| Status | Statut | Status | الحالة | |
| Unassigned | Non assigné | Unassigned | غير معيّن | Inbox |
| Unread | Non lus | Unread | غير مقروء | Inbox |
| Won | Gagné | Won | فازت | Closed-won |
| Lost | Perdue | Lost | خسرت | Closed-lost |
| Open (deal) | Ouvert | Open | مفتوحة | Deal/ticket state — not the verb |
| Qualified | Qualifié | Qualified | مؤهّل | |
| Unqualified | Non qualifié | Unqualified | غير مؤهّل | |
| Tasks | Tâches | Tasks | المهام | |
| Notifications | Notifications | Notifications | الإشعارات | |
| Members | Membres | Members | الأعضاء | Workspace people |
| Permissions | Droits | Permissions | الصلاحيات | |
| Audit trail | Journal | Audit trail | سجل التدقيق | |
| Simple mode | Mode simple | Simple mode | الوضع البسيط | Launch surface |
| Command palette | Palette de commandes | Command palette | لوحة الأوامر | |
| DataGrid | Tableau | DataGrid | شبكة البيانات | Internal name stays DataGrid |
| Filter builder | Créateur de filtres | Filter builder | منشئ عوامل التصفية | |
| Rich text | Texte enrichi | Rich text | نص منسّق | Composer / editor chrome only |
| Quote number | N° de devis | Quote number | رقم عرض الأسعار | Value stays `DV-…` |
| Campaign code | Code campagne | Campaign code | رمز الحملة | Value stays `CAMP-…` |

## Agents chrome (locked by product brief)

| KEY | FRENCH | ENGLISH | ARABIC |
|---|---|---|---|
| New conversation | Nouvelle conversation | New conversation | محادثة جديدة |
| Available | Disponible | Available | متاح |
| Deals | Affaires | Deals | الصفقات |
| Leads | Leads | Leads | العملاء المحتملون |
| Quotes | Devis | Quotes | عروض الأسعار |

Nav “Leads” stays **Pistes** in French. Agents entity chips use **Leads** in French when the brief names that chrome.

## Arabic style

- Use formal MSA (الفصحى المعاصرة), the register of Odoo, SAP, and regional bank/CRM software.
- Prefer short nouns over verbal phrases on buttons: حفظ not قم بالحفظ.
- Do not calque English word order.
- Do not use dialect (دارجة) in product chrome.
- Keep Latin product names where the market already does: EvoCRM, WhatsApp, Meta, Google, SMTP, IMAP, CSV.
- Plurals: use the sound/broken plural that business UIs use (جهات الاتصال, الصفقات, عروض الأسعار).
- Line-height for Arabic may be slightly larger than Latin. Do not force identical metrics.

## Formatting examples (all locales)

| Kind | Display | Notes |
|---|---|---|
| Money | `1 280 000 DA` | Narrow/NBSP grouping + DA. Latin digits in `ar` too |
| Phone | `+213 550 18 80 01` | E.164 storage, Algeria display. Never Arabic-Indic digits |
| Quote | `DV-2026-0047` | Identifier, not a sentence |
| Campaign | `CAMP-0042` | Identifier |
| Email | `amine.benali@clinique-djazair.dz` | Never translated, never reshaped |
| Date (fr-DZ) | `2 oct. 2026` | Africa/Algiers |
| Time | `16:30` | 24h, no AM/PM |

## Do not translate

- User-generated CRM field values
- Outbound sales email bodies written by users
- Message/thread bodies in Inbox
- Existing agent ↔ customer conversation content
- Technical identifiers, tokens, hostnames, API errors meant for operators in logs
