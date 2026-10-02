<?php

namespace Database\Seeders;

use App\Enums\ChannelType;
use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Channel;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Mailbox;
use App\Models\MeetingSchedule;
use App\Models\Message;
use App\Models\OutboundCampaign;
use App\Models\OutboundMessage;
use App\Models\Quote;
use App\Models\Thread;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Crm\QuoteTotals;
use App\Services\Identity\WorkspaceProvisioner;
use Illuminate\Database\Seeder;

/**
 * Visual-acceptance dataset for golden screens.
 * Separate workspace so Evotechly analytics totals stay unchanged.
 * Demo world: Clinique El Djazair, Hôpital Ibn Sina, Cabinet Dr. Amrani, Pharmacie Centrale.
 */
class VisualQaSeeder extends Seeder
{
    public const WORKSPACE_NAME = 'Cabinet El Aurassi';

    public const OWNER_EMAIL = 'visualqa@evosales.local';

    public function run(): void
    {
        $provisioner = app(WorkspaceProvisioner::class);
        $owner = User::query()->where('email', self::OWNER_EMAIL)->first();

        if ($owner) {
            $workspace = $owner->workspace;
            $workspace->forceFill(['name' => self::WORKSPACE_NAME])->save();
            $this->ensureAcceptanceWorld($workspace, $owner);

            return;
        }

        $workspace = $provisioner->provision(self::WORKSPACE_NAME);

        $eo = User::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Elyas Ouadah',
            'email' => self::OWNER_EMAIL,
            'password' => 'password',
            'role' => WorkspaceRole::Owner,
            'email_verified_at' => now(),
        ]);

        User::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Rania Cherif',
            'email' => 'rania@visualqa.local',
            'password' => 'password',
            'role' => WorkspaceRole::Member,
            'email_verified_at' => now(),
        ]);

        User::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Mehdi Taleb',
            'email' => 'mehdi@visualqa.local',
            'password' => 'password',
            'role' => WorkspaceRole::Member,
            'email_verified_at' => now(),
        ]);

        User::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Sara Khelifi',
            'email' => 'sara.qa@visualqa.local',
            'password' => 'password',
            'role' => WorkspaceRole::Member,
            'email_verified_at' => now(),
        ]);

        $this->ensureAcceptanceWorld($workspace, $eo);
    }

    private function ensureAcceptanceWorld(Workspace $workspace, User $owner): void
    {
        $members = User::query()
            ->where('workspace_id', $workspace->id)
            ->get()
            ->keyBy('email');

        $eo = $members->get(self::OWNER_EMAIL) ?? $owner;
        $rc = $members->get('rania@visualqa.local') ?? $eo;
        $mt = $members->get('mehdi@visualqa.local') ?? $eo;
        $sk = $members->get('sara.qa@visualqa.local') ?? $eo;

        $pipeline = $workspace->defaultPipeline();
        $pipeline->stages()->where('slug', 'proposal')->update(['position' => 3]);
        $pipeline->stages()->where('slug', 'demo')->update(['position' => 4]);
        $pipeline->stages()->where('slug', 'won')->update(['position' => 5]);
        $pipeline->stages()->where('slug', 'lost')->update(['position' => 6]);
        $pipeline->unsetRelation('stages');
        $stages = [
            'new' => $pipeline->stageBySlug('new'),
            'qualified' => $pipeline->stageBySlug('qualified'),
            'demo' => $pipeline->stageBySlug('demo'),
            'proposal' => $pipeline->stageBySlug('proposal'),
            'won' => $pipeline->stageBySlug('won'),
            'lost' => $pipeline->stageBySlug('lost'),
        ];

        $world = [
            [
                'company' => ['name' => 'Clinique El Djazair', 'domain' => 'clinique-djazair.dz', 'city' => 'Alger'],
                'contact' => ['Amine', 'Benali'],
                'source' => 'whatsapp',
                'deal' => [
                    'title' => 'Modernisation CRM',
                    'stage' => 'qualified',
                    'amount' => 32_000_000,
                    'close' => '2026-09-25',
                    'owner' => $eo,
                    'next' => 'Relancer pour validation / Jeu. 25 sept. · 11:00',
                    'next_at' => '2026-09-25 11:00:00',
                    'last' => '2026-09-29 16:40:00',
                ],
                'activity' => [
                    'type' => 'call',
                    'subject' => 'Suivi périmètre patients',
                    'due' => '2026-09-15 10:00:00',
                    'at' => '2026-09-15 10:00:00',
                    'done' => true,
                ],
                'extra_activities' => [
                    [
                        'type' => 'note',
                        'subject' => 'Points à valider avant devis',
                        'at' => '2026-09-20 11:00:00',
                    ],
                    [
                        'type' => 'whatsapp',
                        'subject' => 'Créneau de validation',
                        'at' => '2026-09-29 16:40:00',
                    ],
                ],
            ],
            [
                'company' => ['name' => 'Hôpital Ibn Sina', 'domain' => 'ibn-sina.dz', 'city' => 'Alger'],
                'contact' => ['Karim', 'Haddad'],
                'source' => 'website',
                'deal' => [
                    'title' => 'CRM & Support',
                    'stage' => 'demo',
                    'amount' => 54_000_000,
                    'close' => '2026-10-08',
                    'owner' => $rc,
                    'next' => 'Préparer la démo / Mer. 8 oct. · 15:00',
                    'next_at' => '2026-10-08 15:00:00',
                ],
                'activity' => [
                    'type' => 'meeting',
                    'subject' => 'Démo à préparer',
                    'due' => '2026-09-29 15:00:00',
                ],
                'quote' => [
                    'notes' => 'Proposition Hôpital Ibn Sina — licences + accompagnement',
                    'item' => 'Licences + accompagnement',
                    'unit_dzd' => 540000,
                ],
            ],
            [
                'company' => ['name' => 'Cabinet Dr. Amrani', 'domain' => 'cabinet-amrani.dz', 'city' => 'Blida'],
                'contact' => ['Farah', 'Amrani'],
                'source' => 'referral',
                'deal' => [
                    'title' => 'Digitalisation',
                    'stage' => 'proposal',
                    'amount' => 28_000_000,
                    'close' => '2026-10-02',
                    'owner' => $mt,
                    'next' => 'Envoyer la proposition / Ven. 2 oct. · 09:00',
                    'next_at' => '2026-10-02 09:00:00',
                ],
                'activity' => [
                    'type' => 'email',
                    'subject' => 'Proposition à envoyer',
                    'due' => '2026-09-18 18:00:00',
                ],
                'quote' => [
                    'notes' => 'Proposition Cabinet Dr. Amrani',
                    'item' => 'Espace commercial',
                    'unit_dzd' => 280000,
                ],
            ],
            [
                'company' => ['name' => 'Pharmacie Centrale', 'domain' => 'pharmacie-centrale.dz', 'city' => 'Sétif'],
                'contact' => ['Sofiane', 'Belkacem'],
                'source' => 'inbound',
                'deal' => [
                    'title' => 'Solution commerciale',
                    'stage' => 'demo',
                    'amount' => 15_000_000,
                    'close' => '2026-10-12',
                    'owner' => $sk,
                    'next' => 'Confirmer le créneau démo / Lun. 12 oct. · 10:30',
                    'next_at' => '2026-10-12 10:30:00',
                ],
                'activity' => null,
            ],
        ];

        $won = [
            [
                'company' => 'Clinique El Djazair',
                'contact' => ['Amine', 'Benali'],
                'source' => 'whatsapp',
                'title' => 'Plateforme patients 2026',
                'amount' => 129_000_000,
                'closed_at' => '2026-09-12 14:00:00',
                'owner' => $eo,
            ],
            [
                'company' => 'Pharmacie Centrale',
                'contact' => ['Sofiane', 'Belkacem'],
                'source' => 'inbound',
                'title' => 'Caisse et stock',
                'amount' => 32_000_000,
                'closed_at' => '2026-09-20 16:30:00',
                'owner' => $sk,
            ],
        ];

        $lost = [
            'company' => 'Hôpital Ibn Sina',
            'contact' => ['Karim', 'Haddad'],
            'source' => 'website',
            'title' => 'Module RH — non retenu',
            'amount' => 18_000_000,
            'closed_at' => '2026-09-08 11:00:00',
            'owner' => $rc,
        ];

        foreach ($world as $row) {
            $company = $this->company($workspace, $row['deal']['owner']->id, $row['company']);
            $contact = $this->contact(
                $workspace,
                $company,
                $row['deal']['owner']->id,
                $row['contact'],
                $row['source'],
                $this->contactPhone($row['contact'][0], $row['contact'][1]),
            );
            $lead = $this->lead($workspace, $contact, $company, $row['deal']['title'], $row['source']);
            $deal = $this->deal($workspace, $pipeline->id, $stages[$row['deal']['stage']]->id, $contact, $company, $lead, $row);

            $this->seedDealActivities($workspace, $deal, $contact, $company, $row, $eo);

            if (isset($row['quote'])) {
                $this->pendingQuote($workspace, $deal, $row['quote']);
            }
        }

        foreach ($won as $row) {
            $company = Company::query()
                ->where('workspace_id', $workspace->id)
                ->where('name', $row['company'])
                ->first();

            if (! $company) {
                continue;
            }

            $contact = Contact::query()
                ->where('workspace_id', $workspace->id)
                ->where('company_id', $company->id)
                ->first();

            if (! $contact) {
                continue;
            }

            $this->closedDeal($workspace, $pipeline->id, $stages['won']->id, $contact, $company, $row);
        }

        $lostCompany = Company::query()
            ->where('workspace_id', $workspace->id)
            ->where('name', $lost['company'])
            ->first();
        $lostContact = $lostCompany
            ? Contact::query()
                ->where('workspace_id', $workspace->id)
                ->where('company_id', $lostCompany->id)
                ->first()
            : null;

        if ($lostCompany && $lostContact) {
            $this->closedDeal($workspace, $pipeline->id, $stages['lost']->id, $lostContact, $lostCompany, $lost);
        }

        $this->seedTeam($workspace, $eo, $rc, $mt, $sk);
        $this->seedInbox($workspace, $eo);
        $this->seedOutbound($workspace, $eo);
        $this->seedMeetings($eo);
    }

    /**
     * @param  array{name: string, domain: string, city: string}  $row
     */
    private function company(Workspace $workspace, int $ownerId, array $row): Company
    {
        return Company::query()->updateOrCreate(
            ['workspace_id' => $workspace->id, 'name' => $row['name']],
            [
                'owner_id' => $ownerId,
                'domain' => $row['domain'],
                'city' => $row['city'],
                'wilaya' => $row['city'],
                'country' => 'DZ',
            ],
        );
    }

    private function contactPhone(string $first, string $last): string
    {
        return match ($first.' '.$last) {
            'Amine Benali' => '0550123456',
            'Nadia Bensalem' => '0661234567',
            'Youcef Mansouri' => '0772345678',
            'Karim Haddad' => '0551345678',
            'Lina Cherif' => '0662456789',
            'Samir Boudiaf' => '0773567890',
            'Farah Amrani' => '0552678901',
            'Yasmine Kaci' => '0663789012',
            'Nabil Hamidi' => '0774890123',
            'Sofiane Belkacem' => '0553901234',
            'Amina Touati' => '0665012345',
            'Hichem Ziani' => '0776123456',
            default => '0550'.substr((string) abs(crc32($first.$last)), 0, 6),
        };
    }

    /**
     * @param  array{0: string, 1: string}  $names
     */
    private function contact(Workspace $workspace, Company $company, int $ownerId, array $names, string $source, string $phone): Contact
    {
        return Contact::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'company_id' => $company->id,
                'first_name' => $names[0],
                'last_name' => $names[1],
            ],
            [
                'owner_id' => $ownerId,
                'email' => strtolower($names[0]).'.'.strtolower($names[1]).'@'.$company->domain,
                'phone' => $phone,
                'phone_e164' => $phone,
                'city' => $company->city,
                'wilaya' => $company->wilaya,
                'source' => $source,
                'lead_status' => 'qualified',
            ],
        );
    }

    private function seedTeam(Workspace $workspace, User $eo, User $rc, User $mt, User $sk): void
    {
        $extra = [
            ['Clinique El Djazair', 'Nadia', 'Bensalem', $eo, 'whatsapp'],
            ['Clinique El Djazair', 'Youcef', 'Mansouri', $eo, 'referral'],
            ['Hôpital Ibn Sina', 'Lina', 'Cherif', $rc, 'website'],
            ['Hôpital Ibn Sina', 'Samir', 'Boudiaf', $rc, 'inbound'],
            ['Cabinet Dr. Amrani', 'Yasmine', 'Kaci', $mt, 'referral'],
            ['Cabinet Dr. Amrani', 'Nabil', 'Hamidi', $mt, 'website'],
            ['Pharmacie Centrale', 'Amina', 'Touati', $sk, 'inbound'],
            ['Pharmacie Centrale', 'Hichem', 'Ziani', $sk, 'whatsapp'],
        ];

        foreach ($extra as [$companyName, $first, $last, $owner, $source]) {
            $company = Company::query()
                ->where('workspace_id', $workspace->id)
                ->where('name', $companyName)
                ->first();

            if (! $company) {
                continue;
            }

            $this->contact(
                $workspace,
                $company,
                $owner->id,
                [$first, $last],
                $source,
                $this->contactPhone($first, $last),
            );
        }
    }

    private function seedInbox(Workspace $workspace, User $owner): void
    {
        $whatsapp = Channel::query()->updateOrCreate(
            ['workspace_id' => $workspace->id, 'type' => ChannelType::WhatsApp],
            ['name' => 'WhatsApp', 'status' => 'connected'],
        );
        $email = Channel::query()->updateOrCreate(
            ['workspace_id' => $workspace->id, 'type' => ChannelType::Email],
            ['name' => 'Email', 'status' => 'connected'],
        );

        $conversations = [
            [
                'first' => 'Amine',
                'last_name' => 'Benali',
                'channel' => $whatsapp,
                'subject' => 'Modernisation CRM',
                'unread' => 2,
                'last_at' => '2026-09-29 16:40:00',
                'messages' => [
                    ['in', 'Bonjour Elyas, on avance sur le CRM pour la clinique. Pouvez-vous confirmer le périmètre patients ?', '2026-09-29 15:10:00'],
                    ['out', 'Oui — patients, agenda et relances. Je vous envoie le récap demain matin.', '2026-09-29 15:22:00'],
                    ['in', 'Parfait. On a aussi besoin du suivi des devis pour le comité de jeudi.', '2026-09-29 16:40:00'],
                ],
            ],
            [
                'first' => 'Karim',
                'last_name' => 'Haddad',
                'channel' => $whatsapp,
                'subject' => 'Créneau démo',
                'unread' => 1,
                'last_at' => '2026-09-29 11:05:00',
                'messages' => [
                    ['in', 'On peut caler la démo mercredi 8 octobre à 15h ?', '2026-09-29 10:48:00'],
                    ['out', 'Mercredi 15h est libre. Je bloque la salle et j’envoie le lien.', '2026-09-29 10:56:00'],
                    ['in', 'Merci. Prévoir 45 minutes avec l’équipe support.', '2026-09-29 11:05:00'],
                ],
            ],
            [
                'first' => 'Farah',
                'last_name' => 'Amrani',
                'channel' => $email,
                'subject' => 'Proposition Cabinet',
                'unread' => 0,
                'last_at' => '2026-09-28 18:20:00',
                'messages' => [
                    ['out', 'Farah, je vous transmets la proposition pour la digitalisation du cabinet.', '2026-09-28 17:40:00'],
                    ['in', 'Bien reçu. On revient après la revue interne de vendredi.', '2026-09-28 18:20:00'],
                ],
            ],
            [
                'first' => 'Sofiane',
                'last_name' => 'Belkacem',
                'channel' => $whatsapp,
                'subject' => 'Tarif licences',
                'unread' => 0,
                'last_at' => '2026-09-28 09:15:00',
                'messages' => [
                    ['in', 'Le tarif licences + caisse est-il toujours à 150 000 DA ?', '2026-09-28 09:02:00'],
                    ['out', 'Oui, 150 000 DA pour le pack caisse et stock, installation comprise.', '2026-09-28 09:15:00'],
                ],
            ],
            [
                'first' => 'Nadia',
                'last_name' => 'Bensalem',
                'channel' => $email,
                'subject' => 'Module patients',
                'unread' => 1,
                'last_at' => '2026-09-27 14:30:00',
                'messages' => [
                    ['in', 'Pouvez-vous ajouter le module patients à la proposition El Djazair ?', '2026-09-27 14:30:00'],
                ],
            ],
            [
                'first' => 'Lina',
                'last_name' => 'Cherif',
                'channel' => $whatsapp,
                'subject' => 'Horaires support',
                'unread' => 0,
                'last_at' => '2026-09-26 16:05:00',
                'messages' => [
                    ['in', 'Le support est-il ouvert le samedi matin ?', '2026-09-26 15:50:00'],
                    ['out', 'Oui, samedi 9h–13h, heure d’Alger.', '2026-09-26 16:05:00'],
                ],
            ],
        ];

        foreach ($conversations as $row) {
            $contact = Contact::query()
                ->where('workspace_id', $workspace->id)
                ->where('first_name', $row['first'])
                ->where('last_name', $row['last_name'])
                ->first();

            if (! $contact) {
                continue;
            }

            $thread = Thread::query()->updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'contact_id' => $contact->id,
                    'subject' => $row['subject'],
                ],
                [
                    'channel_id' => $row['channel']->id,
                    'status' => 'open',
                    'unread_count' => $row['unread'],
                    'last_message_at' => $row['last_at'],
                ],
            );

            if ($thread->messages()->exists()) {
                continue;
            }

            foreach ($row['messages'] as [$direction, $body, $at]) {
                Message::query()->create([
                    'workspace_id' => $workspace->id,
                    'thread_id' => $thread->id,
                    'contact_id' => $contact->id,
                    'user_id' => $direction === 'out' ? $owner->id : null,
                    'direction' => $direction === 'out' ? 'outbound' : 'inbound',
                    'type' => 'text',
                    'body' => $body,
                    'status' => $direction === 'out' ? 'sent' : 'received',
                    'provider' => 'desk',
                    'created_at' => $at,
                    'updated_at' => $at,
                ]);
            }
        }
    }

    private function lead(Workspace $workspace, Contact $contact, Company $company, string $title, string $source): Lead
    {
        return Lead::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'contact_id' => $contact->id,
                'title' => $title,
            ],
            [
                'company_id' => $company->id,
                'status' => 'qualified',
                'source' => $source,
                'qualified_at' => '2026-09-10 09:00:00',
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function deal(
        Workspace $workspace,
        int $pipelineId,
        int $stageId,
        Contact $contact,
        Company $company,
        Lead $lead,
        array $row,
    ): Deal {
        return Deal::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'title' => $row['deal']['title'],
            ],
            [
                'contact_id' => $contact->id,
                'company_id' => $company->id,
                'lead_id' => $lead->id,
                'pipeline_id' => $pipelineId,
                'stage_id' => $stageId,
                'owner_id' => $row['deal']['owner']->id,
                'amount_cents' => $row['deal']['amount'],
                'currency' => 'DZD',
                'source' => $row['source'],
                'close_date' => $row['deal']['close'],
                'next_step' => $row['deal']['next'],
                'next_activity_at' => $row['deal']['next_at'],
                'last_activity_at' => $row['deal']['last'] ?? '2026-09-20 11:00:00',
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function seedDealActivities(
        Workspace $workspace,
        Deal $deal,
        Contact $contact,
        Company $company,
        array $row,
        User $actor,
    ): void {
        Activity::query()
            ->where('deal_id', $deal->id)
            ->where('subject', 'Appel — Amine Benali')
            ->delete();

        $items = [];

        if (is_array($row['activity'] ?? null)) {
            $items[] = $row['activity'];
        }

        foreach ($row['extra_activities'] ?? [] as $extra) {
            if (is_array($extra)) {
                $items[] = $extra;
            }
        }

        foreach ($items as $activity) {
            $subject = (string) ($activity['subject'] ?? '');

            if ($subject === '') {
                continue;
            }

            $model = Activity::query()->firstOrNew([
                'workspace_id' => $workspace->id,
                'deal_id' => $deal->id,
                'subject' => $subject,
            ]);

            $at = $activity['at'] ?? $activity['due'] ?? null;

            $model->fill([
                'contact_id' => $contact->id,
                'company_id' => $company->id,
                'owner_id' => $row['deal']['owner']->id,
                'actor_id' => $actor->id,
                'type' => $activity['type'] ?? 'note',
                'due_at' => $activity['due'] ?? $at,
                'done' => (bool) ($activity['done'] ?? false),
            ]);
            $model->save();

            if (is_string($at) && $at !== '') {
                $model->forceFill([
                    'created_at' => $at,
                    'updated_at' => $at,
                    'due_at' => $activity['due'] ?? $at,
                ])->save();
            }
        }
    }

    /**
     * @param  array{company?: string, contact?: array<int, string>, source: string, title: string, amount: int, closed_at: string, owner: User}  $row
     */
    private function closedDeal(
        Workspace $workspace,
        int $pipelineId,
        int $stageId,
        Contact $contact,
        Company $company,
        array $row,
    ): Deal {
        $lead = $this->lead($workspace, $contact, $company, $row['title'], $row['source']);

        return Deal::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'title' => $row['title'],
            ],
            [
                'contact_id' => $contact->id,
                'company_id' => $company->id,
                'lead_id' => $lead->id,
                'pipeline_id' => $pipelineId,
                'stage_id' => $stageId,
                'owner_id' => $row['owner']->id,
                'amount_cents' => $row['amount'],
                'currency' => 'DZD',
                'source' => $row['source'],
                'close_date' => substr($row['closed_at'], 0, 10),
                'closed_at' => $row['closed_at'],
                'next_step' => null,
                'last_activity_at' => $row['closed_at'],
            ],
        );
    }

    /**
     * @param  array{notes: string, item: string, unit_dzd: int}  $row
     */
    private function pendingQuote(Workspace $workspace, Deal $deal, array $row): void
    {
        $quote = Quote::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'deal_id' => $deal->id,
                'notes' => $row['notes'],
            ],
            [
                'status' => 'sent',
                'currency' => 'DZD',
                'sent_at' => '2026-09-20 10:00:00',
                'created_at' => '2026-09-15 09:00:00',
            ],
        );

        $quote->forceFill([
            'created_at' => '2026-09-15 09:00:00',
            'sent_at' => '2026-09-20 10:00:00',
        ])->save();

        app(QuoteTotals::class)->sync($quote, [
            ['name' => $row['item'], 'quantity' => 1, 'unit_dzd' => $row['unit_dzd']],
        ]);
    }

    private function seedMeetings(User $owner): void
    {
        $schedule = MeetingSchedule::forUser($owner);
        $schedule->forceFill([
            'intro' => 'Découverte 30 min',
            'slot_minutes' => 30,
            'work_start' => '09:00',
            'work_end' => '17:00',
            'timezone' => MeetingSchedule::TIMEZONE,
        ])->save();
    }

    private function seedOutbound(Workspace $workspace, User $owner): void
    {
        $mailbox = Mailbox::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'from_address' => 'accueil@el-aurassi.dz',
            ],
            [
                'name' => 'Accueil cabinet',
                'from_name' => 'Cabinet El Aurassi',
                'source' => Mailbox::SOURCE_MANUAL,
                'host' => 'smtp.el-aurassi.dz',
                'port' => 587,
                'encryption' => 'tls',
                'username' => 'accueil@el-aurassi.dz',
                'password' => 'visualqa-mailbox',
                'enabled' => true,
                'status' => 'active',
                'is_default' => true,
                'daily_limit' => 40,
            ],
        );

        $campaigns = [
            [
                'name' => 'Rentrée clinique',
                'status' => OutboundCampaign::STATUS_SENT,
                'subject' => 'Rentrée — suivi des dossiers',
                'body' => 'Bonjour, votre dossier est à jour.',
                'sent_at' => '2026-09-18 10:00:00',
                'audience_count' => 4,
            ],
            [
                'name' => 'Suivi devis ouverts',
                'status' => OutboundCampaign::STATUS_SCHEDULED,
                'subject' => 'Votre devis est prêt',
                'body' => 'Bonjour, le devis est disponible.',
                'scheduled_at' => '2026-10-02 09:00:00',
                'audience_count' => 2,
            ],
            [
                'name' => 'Lettre de septembre',
                'status' => OutboundCampaign::STATUS_DRAFT,
                'subject' => 'Actualités du cabinet',
                'body' => 'Bonjour, voici les nouveautés du mois.',
                'audience_count' => 12,
            ],
        ];

        foreach ($campaigns as $row) {
            $campaign = OutboundCampaign::query()->updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'name' => $row['name'],
                ],
                [
                    'status' => $row['status'],
                    'mailbox_id' => $mailbox->id,
                    'subject' => $row['subject'],
                    'body' => $row['body'],
                    'sent_at' => $row['sent_at'] ?? null,
                    'scheduled_at' => $row['scheduled_at'] ?? null,
                    'audience_count' => $row['audience_count'],
                    'created_by' => $owner->id,
                ],
            );

            if ($row['status'] !== OutboundCampaign::STATUS_SENT) {
                continue;
            }

            $contacts = Contact::query()
                ->where('workspace_id', $workspace->id)
                ->orderBy('id')
                ->limit(3)
                ->get();

            foreach ($contacts as $contact) {
                OutboundMessage::query()->updateOrCreate(
                    [
                        'workspace_id' => $workspace->id,
                        'campaign_id' => $campaign->id,
                        'contact_id' => $contact->id,
                    ],
                    [
                        'mailbox_id' => $mailbox->id,
                        'channel' => 'email',
                        'direction' => 'out',
                        'to_address' => $contact->email ?: 'contact@el-aurassi.dz',
                        'subject' => $row['subject'],
                        'body' => $row['body'],
                        'status' => 'sent',
                        'sent_at' => $row['sent_at'],
                    ],
                );
            }
        }
    }
}
