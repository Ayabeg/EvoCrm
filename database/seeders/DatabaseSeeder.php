<?php

namespace Database\Seeders;

use App\Enums\ChannelType;
use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Ad;
use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdCampaignStat;
use App\Models\AdLead;
use App\Models\AdSet;
use App\Models\Company;
use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Lead;
use App\Models\Mailbox;
use App\Models\Message;
use App\Models\OutboundCampaign;
use App\Models\OutboundDomain;
use App\Models\OutboundMessage;
use App\Models\OutboundTemplate;
use App\Models\Product;
use App\Models\Quote;
use App\Models\SavedFilter;
use App\Models\Sequence;
use App\Models\Thread;
use App\Models\User;
use App\Services\Crm\DealLineTotals;
use App\Services\Crm\QuoteTotals;
use App\Services\Identity\WorkspaceProvisioner;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $provisioner = app(WorkspaceProvisioner::class);
        $workspace = $provisioner->provision('Evotechly');

        $owner = User::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Evotechly Owner',
            'email' => 'owner@evosales.local',
            'password' => 'password',
            'role' => WorkspaceRole::Owner,
            'email_verified_at' => now(),
        ]);

        $rep = User::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Sara Khelifi',
            'email' => 'sara@evosales.local',
            'password' => 'password',
            'role' => WorkspaceRole::Member,
            'email_verified_at' => now(),
        ]);

        $companies = collect([
            ['name' => 'Clinique El Djazair', 'domain' => 'clinique-djazair.dz', 'city' => 'Alger', 'phone' => '+213 21 00 00 00'],
            ['name' => 'Laboratoire Oran Santé', 'domain' => 'labo-oran.dz', 'city' => 'Oran', 'phone' => '+213 41 11 22 33'],
            ['name' => 'Institut Constantine Digital', 'domain' => 'icd.dz', 'city' => 'Constantine', 'phone' => '+213 31 44 55 66'],
            ['name' => 'Hôpital Annaba Est', 'domain' => 'annaba-est.dz', 'city' => 'Annaba', 'phone' => '+213 38 22 10 10'],
            ['name' => 'Pharmacie Sétif Centrale', 'domain' => 'setif-pharma.dz', 'city' => 'Sétif', 'phone' => '+213 36 70 80 90'],
            ['name' => 'École Tlemcen Langues', 'domain' => 'tlemcen-langues.dz', 'city' => 'Tlemcen', 'phone' => '+213 43 12 34 56'],
            ['name' => 'Agri Blida', 'domain' => 'agri-blida.dz', 'city' => 'Blida', 'phone' => '+213 25 98 76 54'],
            ['name' => 'Port Béjaïa Logistics', 'domain' => 'bejaia-log.dz', 'city' => 'Béjaïa', 'phone' => '+213 34 20 30 40'],
            ['name' => 'Batna Textile', 'domain' => 'batna-textile.dz', 'city' => 'Batna', 'phone' => '+213 33 55 66 77'],
            ['name' => 'Tizi Ouzou Retail', 'domain' => 'tizi-retail.dz', 'city' => 'Tizi Ouzou', 'phone' => '+213 26 11 22 33'],
        ])->map(fn (array $row, int $index) => Company::query()->create([
            ...$row,
            'workspace_id' => $workspace->id,
            'wilaya' => $row['city'],
            'owner_id' => $index % 3 === 0 ? $owner->id : ($index % 3 === 1 ? $rep->id : null),
            'country' => 'DZ',
        ]));

        $people = [
            ['Amine', 'Benali', 'clinique-djazair.dz', 0],
            ['Sara', 'Khelifi', 'clinique-djazair.dz', 0],
            ['Yacine', 'Messaoudi', 'labo-oran.dz', 1],
            ['Nadia', 'Boudiaf', 'labo-oran.dz', 1],
            ['Karim', 'Ziani', 'icd.dz', 2],
            ['Lina', 'Haddad', 'icd.dz', 2],
            ['Riad', 'Cherif', 'annaba-est.dz', 3],
            ['Ines', 'Touati', 'annaba-est.dz', 3],
            ['Sofiane', 'Belkacem', 'setif-pharma.dz', 4],
            ['Amina', 'Saadi', 'setif-pharma.dz', 4],
            ['Omar', 'Tabet', 'tlemcen-langues.dz', 5],
            ['Yasmine', 'Benyahia', 'tlemcen-langues.dz', 5],
            ['Mehdi', 'Lounis', 'agri-blida.dz', 6],
            ['Farah', 'Amrani', 'agri-blida.dz', 6],
            ['Bilal', 'Kaci', 'bejaia-log.dz', 7],
            ['Hana', 'Dahmani', 'bejaia-log.dz', 7],
            ['Nabil', 'Bensalem', 'batna-textile.dz', 8],
            ['Samira', 'Ghoul', 'batna-textile.dz', 8],
            ['Walid', 'Ait', 'tizi-retail.dz', 9],
            ['Celia', 'Mokrani', 'tizi-retail.dz', 9],
            ['Hakim', 'Rahal', 'clinique-djazair.dz', 0],
            ['Dounia', 'Ferhat', 'labo-oran.dz', 1],
        ];

        $contacts = collect($people)->values()->map(function (array $person, int $index) use ($workspace, $companies, $owner, $rep) {
            [$first, $last, $domain, $companyIndex] = $person;
            $n = str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);

            $company = $companies[$companyIndex];

            return Contact::query()->create([
                'workspace_id' => $workspace->id,
                'company_id' => $company->id,
                'owner_id' => $index % 5 === 0 ? null : ($index % 2 === 0 ? $owner->id : $rep->id),
                'first_name' => $first,
                'last_name' => $last,
                'email' => strtolower($first).'.'.$last.'@'.$domain,
                'phone' => '0550100'.$n,
                'city' => $company->city,
                'wilaya' => $company->wilaya,
                'source' => $index % 3 === 0 ? 'whatsapp_cloud' : 'seed',
            ]);
        });

        $pipeline = $workspace->defaultPipeline();
        $stages = [
            'new' => $pipeline->stageBySlug('new'),
            'qualified' => $pipeline->stageBySlug('qualified'),
            'demo' => $pipeline->stageBySlug('demo'),
            'proposal' => $pipeline->stageBySlug('proposal'),
            'won' => $pipeline->stageBySlug('won'),
            'lost' => $pipeline->stageBySlug('lost'),
        ];

        $dealPlan = [
            [0, 'new', 'Clinic website intake', 12_000_000, null],
            [1, 'qualified', 'Clinic WhatsApp desk', 18_000_000, now()->addDay()],
            [2, 'demo', 'Oran lab CRM demo', 22_000_000, null],
            [3, 'proposal', 'Oran lab proposal', 28_000_000, now()->addDays(3)],
            [4, 'won', 'Constantine digital workspace', 45_000_000, now()->subDay()],
            [5, 'lost', 'Constantine extra seats', 9_000_000, now()->subDays(2)],
            [6, 'new', 'Annaba hospital intake', 15_000_000, null],
            [7, 'qualified', 'Annaba CTWA follow-up', 16_500_000, now()->addDays(2)],
            [8, 'demo', 'Sétif pharmacy demo', 11_000_000, null],
            [9, 'proposal', 'Sétif sequence rollout', 19_000_000, now()->addWeek()],
            [10, 'new', 'Tlemcen school inbox', 8_000_000, null],
            [12, 'qualified', 'Blida agri outbound', 14_000_000, null],
            [14, 'demo', 'Béjaïa port logistics', 31_000_000, now()->addDays(4)],
            [16, 'proposal', 'Batna textile CRM', 24_000_000, null],
            [18, 'won', 'Tizi retail won', 17_000_000, now()->subDays(5)],
        ];

        foreach ($dealPlan as [$contactIndex, $stageSlug, $title, $amount, $next]) {
            $contact = $contacts[$contactIndex];
            $lead = Lead::query()->create([
                'workspace_id' => $workspace->id,
                'contact_id' => $contact->id,
                'company_id' => $contact->company_id,
                'title' => $title,
                'status' => in_array($stageSlug, ['qualified', 'demo', 'proposal', 'won'], true) ? 'qualified' : 'new',
                'source' => 'seed',
                'qualified_at' => in_array($stageSlug, ['qualified', 'demo', 'proposal', 'won'], true) ? now()->subDays(2) : null,
            ]);

            Deal::query()->create([
                'workspace_id' => $workspace->id,
                'contact_id' => $contact->id,
                'company_id' => $contact->company_id,
                'lead_id' => $lead->id,
                'pipeline_id' => $pipeline->id,
                'stage_id' => $stages[$stageSlug]->id,
                'owner_id' => $contact->owner_id,
                'title' => $title,
                'amount_cents' => $amount,
                'currency' => 'DZD',
                'source' => $contact->source,
                'lost_reason' => $stageSlug === 'lost' ? 'Budget / timing' : null,
                'close_date' => $next?->toDateString(),
                'next_step' => $stageSlug === 'won' || $stageSlug === 'lost' ? null : 'Relancer le décideur',
                'closed_at' => in_array($stageSlug, ['won', 'lost'], true) ? now()->subDay() : null,
                'next_activity_at' => $next,
                'last_activity_at' => now()->subHours($contactIndex + 1),
            ]);
        }

        $channel = $workspace->channels()->where('type', ChannelType::WhatsAppCloud)->firstOrFail();

        $threadScripts = [
            [0, 2, 'Salam, je veux un devis pour un logiciel commercial.', 'Bien reçu, on prépare le devis Evotechly.', true],
            [2, 1, 'On peut voir une démo demain ?', 'Oui, créneau 10h Africa/Algiers.', false],
            [4, 3, 'Le formulaire Meta est passé.', 'On a créé le contact et le lead.', true],
            [6, 0, 'Click-to-WA depuis la pub clinique.', null, true],
            [8, 2, 'La séquence email est trop tard le soir.', 'Quiet hours 21:00–08:00 Algiers.', false],
            [12, 1, 'Besoin WhatsApp Cloud officiel seulement.', 'Pas de Baileys, Cloud API only.', false],
            [14, 2, 'Port Béjaïa — on signe si le desk est Chatwoot.', 'Le desk vendu est EvoDesk.', true],
            [18, 1, 'Merci, on est live.', 'Parfait, on reste sur desk.evotechly.com.', false],
        ];

        foreach ($threadScripts as [$contactIndex, $unread, $inbound, $outbound, $open]) {
            $contact = $contacts[$contactIndex];
            $thread = Thread::query()->create([
                'workspace_id' => $workspace->id,
                'contact_id' => $contact->id,
                'channel_id' => $channel->id,
                'status' => $open ? 'open' : 'closed',
                'subject' => 'WhatsApp Cloud',
                'last_message_at' => now()->subHours($contactIndex + 1),
                'unread_count' => $unread,
            ]);

            Message::query()->create([
                'workspace_id' => $workspace->id,
                'thread_id' => $thread->id,
                'contact_id' => $contact->id,
                'direction' => 'inbound',
                'type' => 'text',
                'body' => $inbound,
                'status' => 'received',
                'provider' => 'evolution_cloud',
                'created_at' => now()->subHours($contactIndex + 2),
            ]);

            if ($outbound) {
                Message::query()->create([
                    'workspace_id' => $workspace->id,
                    'thread_id' => $thread->id,
                    'contact_id' => $contact->id,
                    'direction' => 'outbound',
                    'type' => 'text',
                    'body' => $outbound,
                    'status' => 'sent',
                    'provider' => 'evolution_cloud',
                    'created_at' => now()->subHours($contactIndex + 1),
                ]);
            }

            $contact->forceFill([
                'unanswered' => $unread > 0,
                'last_activity_at' => now()->subHours($contactIndex + 1),
            ])->save();
        }

        $nurture = Sequence::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Clinic email nurture',
            'channel' => 'email',
            'active' => true,
            'description' => 'Algeria-first clinic follow-up. Not sent live in seed.',
        ]);
        $nurture->steps()->createMany([
            ['position' => 1, 'delay_hours' => 0, 'channel' => 'email', 'subject' => 'Bienvenue Evotechly', 'body' => 'Merci pour votre intérêt.'],
            ['position' => 2, 'delay_hours' => 48, 'channel' => 'email', 'subject' => 'Démo desk + CRM', 'body' => 'Le desk est EvoDesk. CRM reste ici.'],
        ]);

        $followUp = Sequence::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Demo follow-up',
            'channel' => 'email',
            'active' => true,
            'description' => 'After a qualified demo.',
        ]);
        $followUp->steps()->createMany([
            ['position' => 1, 'delay_hours' => 2, 'channel' => 'email', 'subject' => 'Recap démo', 'body' => 'Voici le recap.'],
            ['position' => 2, 'delay_hours' => 72, 'channel' => 'email', 'subject' => 'Proposition', 'body' => 'Proposition jointe.'],
        ]);

        $wa = Sequence::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'WhatsApp Cloud hello',
            'channel' => 'whatsapp_cloud',
            'active' => false,
            'description' => 'Named official templates only. Not sent live.',
        ]);
        $wa->steps()->create([
            'position' => 1,
            'delay_hours' => 0,
            'channel' => 'whatsapp_cloud',
            'wa_template_name' => 'hello_world',
            'wa_template_language' => 'fr',
        ]);

        foreach ([$contacts[1], $contacts[3], $contacts[7]] as $enrolled) {
            Enrollment::query()->create([
                'workspace_id' => $workspace->id,
                'sequence_id' => $nurture->id,
                'contact_id' => $enrolled->id,
                'status' => 'active',
                'next_step' => 1,
                'next_run_at' => now()->addHours(2),
            ]);
        }

        // Mixed enrollment states so the UI shows the full lifecycle.
        Enrollment::query()->create([
            'workspace_id' => $workspace->id,
            'sequence_id' => $followUp->id,
            'contact_id' => $contacts[5]->id,
            'status' => 'paused',
            'next_step' => 2,
            'next_run_at' => now()->addDay(),
        ]);
        Enrollment::query()->create([
            'workspace_id' => $workspace->id,
            'sequence_id' => $followUp->id,
            'contact_id' => $contacts[9]->id,
            'status' => 'finished',
            'next_step' => 3,
            'next_run_at' => null,
        ]);

        // The main box is mid-warmup: day 3 of the ramp (cap 18 of a 40
        // ceiling), peer pings on with Sara's active box as its only peer.
        $demoMailbox = Mailbox::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Evotechly SMTP (demo)',
            'from_name' => 'Evotechly',
            'from_address' => 'hello@evotechly.com',
            'host' => 'smtp.evotechly.example',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'demo',
            'password' => 'not-a-real-password',
            'imap_host' => 'imap.evotechly.example',
            'imap_port' => 993,
            'imap_encryption' => 'ssl',
            'imap_username' => 'hello@evotechly.com',
            'imap_password' => 'not-a-real-password',
            'is_default' => true,
            'enabled' => true,
            'status' => 'warming',
            'daily_limit' => 18,
            'warmup_day' => 3,
            'warmup_ceiling' => 40,
            'warmup_previous_limit' => 50,
            'warmup_started_at' => now()->subDays(2)->startOfDay()->addHours(9),
            'warmup_last_advanced_on' => now('Africa/Algiers')->toDateString(),
            'warmup_peers' => true,
        ]);

        Mailbox::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Sales — Sara (demo)',
            'from_name' => 'Sara Khelifi',
            'from_address' => 'sara@evotechly.com',
            'host' => 'smtp.evotechly.example',
            'port' => 465,
            'encryption' => 'ssl',
            'username' => 'sara@evotechly.com',
            'password' => 'not-a-real-password',
            'is_default' => false,
            'enabled' => true,
            'status' => 'active',
            'daily_limit' => 30,
            'warmup_ceiling' => 30,
            'warmup_peers' => true,
        ]);

        // System roles stay out of warmup unless the operator opts them in.
        Mailbox::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Postmaster (demo)',
            'from_name' => 'Evotechly Postmaster',
            'from_address' => 'postmaster@evotechly.com',
            'host' => 'smtp.evotechly.example',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'postmaster@evotechly.com',
            'password' => 'not-a-real-password',
            'is_default' => false,
            'enabled' => false,
            'status' => 'disabled',
            'daily_limit' => 20,
        ]);

        $templates = collect([
            [
                'name' => 'Clinic intro — FR',
                'subject' => 'EvoSales pour {{company}}',
                'body' => "Bonjour {{first_name}},\n\nJe suis Amine d'Evotechly. Les cliniques à {{city}} utilisent EvoSales pour répondre sur WhatsApp et suivre leurs devis.\n\n15 minutes cette semaine ?",
            ],
            [
                'name' => 'Demo recap',
                'subject' => 'Récap démo EvoSales',
                'body' => "Bonjour {{first_name}},\n\nMerci pour la démo. Récap : desk EvoDesk intégré, CRM, Ads Hub, séquences email.\n\nProchaine étape : devis.",
            ],
            [
                'name' => 'Relance douce',
                'subject' => 'Toujours d’actualité, {{first_name}} ?',
                'body' => "Bonjour {{first_name}},\n\nJe me permets de revenir vers vous. EvoSales reste disponible pour {{company}}.\n\nRépondez STOP pour ne plus être contacté.",
            ],
        ])->map(fn (array $row) => OutboundTemplate::query()->create([
            ...$row,
            'workspace_id' => $workspace->id,
        ]));

        // Outbox demo rows: sent (one opened, one replied), one failed, one queued.
        $sentOne = OutboundMessage::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contacts[1]->id,
            'mailbox_id' => $demoMailbox->id,
            'sequence_id' => $nurture->id,
            'channel' => 'email',
            'direction' => 'out',
            'to_address' => $contacts[1]->email,
            'subject' => 'Bienvenue Evotechly',
            'body' => 'Merci pour votre intérêt.',
            'status' => 'sent',
            'sent_at' => now()->subDays(2),
            'opened_at' => now()->subDays(2)->addHours(3),
            'open_count' => 2,
        ]);

        $sentTwo = OutboundMessage::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contacts[3]->id,
            'mailbox_id' => $demoMailbox->id,
            'sequence_id' => $nurture->id,
            'channel' => 'email',
            'direction' => 'out',
            'to_address' => $contacts[3]->email,
            'subject' => 'Démo desk + CRM',
            'body' => 'Le desk est EvoDesk. CRM reste ici.',
            'status' => 'sent',
            'sent_at' => now()->subDay(),
            'opened_at' => now()->subDay()->addHours(1),
            'open_count' => 1,
            'replied_at' => now()->subDay()->addHours(2),
        ]);

        OutboundMessage::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contacts[3]->id,
            'mailbox_id' => $demoMailbox->id,
            'sequence_id' => $nurture->id,
            'channel' => 'email',
            'direction' => 'in',
            'to_address' => 'hello@evotechly.com',
            'in_reply_to' => $sentTwo->id,
            'subject' => 'Re: Démo desk + CRM',
            'body' => 'Merci — on veut une démo mardi 10h.',
            'status' => 'received',
            'created_at' => now()->subDay()->addHours(2),
        ]);

        OutboundMessage::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contacts[7]->id,
            'mailbox_id' => $demoMailbox->id,
            'sequence_id' => $nurture->id,
            'channel' => 'email',
            'direction' => 'out',
            'to_address' => $contacts[7]->email,
            'subject' => 'Bienvenue Evotechly',
            'body' => 'Merci pour votre intérêt.',
            'status' => 'failed',
            'failure_reason' => 'SMTP timeout talking to smtp.evotechly.example:587.',
            'created_at' => now()->subHours(6),
        ]);

        OutboundMessage::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contacts[5]->id,
            'mailbox_id' => $demoMailbox->id,
            'sequence_id' => $followUp->id,
            'channel' => 'email',
            'direction' => 'out',
            'to_address' => $contacts[5]->email,
            'subject' => 'Recap démo',
            'body' => 'Voici le recap.',
            'status' => 'queued',
            'created_at' => now()->subHour(),
        ]);

        // Warmup history for the demo box: the ramp climbed 8 → 12 → 18 over
        // the last three Algiers days, and sends stayed under each day's cap.
        $warmupSends = [
            [2, 5],   // day 1 of the ramp: 6 sent incl. $sentOne, cap 8
            [1, 9],   // day 2: 10 sent incl. $sentTwo, cap 12
            [0, 4],   // today so far, cap 18
        ];

        foreach ($warmupSends as [$daysAgo, $count]) {
            foreach (range(1, $count) as $n) {
                $contact = $contacts[($daysAgo * 5 + $n) % $contacts->count()];

                OutboundMessage::query()->create([
                    'workspace_id' => $workspace->id,
                    'contact_id' => $contact->id,
                    'mailbox_id' => $demoMailbox->id,
                    'channel' => 'email',
                    'direction' => 'out',
                    'to_address' => $contact->email,
                    'subject' => 'Warmup touch — '.$contact->company?->name,
                    'body' => 'Bonjour '.$contact->first_name.', …',
                    'status' => 'sent',
                    'sent_at' => now()->subDays($daysAgo)->subHours(3 + $n),
                ]);
            }
        }

        // One honest failure inside the warmup window (fail rate > 0).
        OutboundMessage::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contacts[8]->id,
            'mailbox_id' => $demoMailbox->id,
            'channel' => 'email',
            'direction' => 'out',
            'to_address' => $contacts[8]->email,
            'subject' => 'Warmup touch — '.$contacts[8]->company?->name,
            'body' => 'Bonjour '.$contacts[8]->first_name.', …',
            'status' => 'failed',
            'failure_reason' => 'SMTP timeout talking to smtp.evotechly.example:587.',
            'created_at' => now()->subDay(),
        ]);

        unset($sentOne);

        // Sending domains: one verified, one still collecting DNS records.
        OutboundDomain::query()->create([
            'workspace_id' => $workspace->id,
            'domain' => 'evotechly.com',
            'status' => 'verified',
            'spf_record' => 'v=spf1 include:smtp-provider.example ~all',
            'dkim_selector' => 'default',
            'dkim_record' => 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCdemo',
            'dmarc_record' => 'v=DMARC1; p=quarantine; rua=mailto:postmaster@evotechly.com',
            'notes' => 'Main sales domain. Records published at the registrar.',
            'verified_at' => now()->subDays(10),
        ]);
        OutboundDomain::query()->create([
            'workspace_id' => $workspace->id,
            'domain' => 'mail.evotechly.dz',
            'status' => 'unverified',
            'spf_record' => 'v=spf1 mx ~all',
            'dkim_selector' => 'default',
            'dmarc_record' => 'v=DMARC1; p=quarantine; rua=mailto:postmaster@mail.evotechly.dz',
            'notes' => 'Warmup domain — DKIM key still missing from the SMTP provider.',
        ]);

        // Broadcast campaigns: one sent newsletter, one draft.
        $newsletter = OutboundCampaign::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'August clinic newsletter',
            'status' => 'sent',
            'template_id' => $templates->first()->id,
            'mailbox_id' => $demoMailbox->id,
            'subject' => 'EvoSales pour {{company}}',
            'body' => "Bonjour {{first_name}},\n\nLes cliniques à {{city}} utilisent EvoSales. Détails : https://evotechly.com/evosales\n\nSe désabonner : {{unsub}}",
            'scheduled_at' => now()->subDays(3),
            'started_at' => now()->subDays(3),
            'sent_at' => now()->subDays(3)->addMinutes(4),
            'audience_count' => 4,
            'suppressed_count' => 0,
            'created_by' => $owner->id,
        ]);

        $newsletterMessages = [
            [$contacts[0], ['sent_at' => now()->subDays(3), 'opened_at' => now()->subDays(3)->addHours(2), 'open_count' => 1]],
            [$contacts[2], ['sent_at' => now()->subDays(3), 'opened_at' => now()->subDays(3)->addHours(3), 'open_count' => 2, 'clicked_at' => now()->subDays(3)->addHours(3)->addMinutes(5), 'click_count' => 1]],
            [$contacts[4], ['sent_at' => now()->subDays(3), 'opened_at' => now()->subDays(3)->addHours(4), 'open_count' => 1, 'replied_at' => now()->subDays(3)->addHours(5)]],
            [$contacts[6], ['sent_at' => now()->subDays(3)]],
        ];

        foreach ($newsletterMessages as [$contact, $state]) {
            OutboundMessage::query()->create([
                'workspace_id' => $workspace->id,
                'contact_id' => $contact->id,
                'mailbox_id' => $demoMailbox->id,
                'campaign_id' => $newsletter->id,
                'channel' => 'email',
                'direction' => 'out',
                'to_address' => $contact->email,
                'subject' => 'EvoSales pour '.$contact->company?->name,
                'body' => 'Bonjour '.$contact->first_name.', …',
                'status' => 'sent',
                ...$state,
            ]);
        }

        OutboundCampaign::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'September re-engagement',
            'status' => 'draft',
            'template_id' => $templates->last()->id,
            'mailbox_id' => $demoMailbox->id,
            'subject' => 'Toujours d’actualité, {{first_name}} ?',
            'body' => "Bonjour {{first_name}},\n\nJe me permets de revenir vers vous.\n\nSe désabonner : {{unsub}}",
            'created_by' => $rep->id,
        ]);

        $account = AdAccount::query()->create([
            'workspace_id' => $workspace->id,
            'external_id' => 'act_demo_evotechly',
            'name' => 'Evotechly Algeria (demo)',
            'status' => 'demo',
            'currency' => 'DZD',
        ]);

        $ctwa = AdCampaign::query()->create([
            'workspace_id' => $workspace->id,
            'ad_account_id' => $account->id,
            'external_id' => 'camp_ctwa_demo',
            'name' => 'CTWA clinics Alger',
            'objective' => 'MESSAGES',
            'status' => 'active',
            'daily_budget_cents' => 450_000,
            'click_to_whatsapp' => true,
            'lead_form' => false,
        ]);

        $form = AdCampaign::query()->create([
            'workspace_id' => $workspace->id,
            'ad_account_id' => $account->id,
            'external_id' => 'camp_leadform_demo',
            'name' => 'Lead form Oran labs',
            'objective' => 'LEAD_GENERATION',
            'status' => 'active',
            'daily_budget_cents' => 300_000,
            'click_to_whatsapp' => false,
            'lead_form' => true,
        ]);

        $ctwaSouth = AdCampaign::query()->create([
            'workspace_id' => $workspace->id,
            'ad_account_id' => $account->id,
            'external_id' => 'camp_ctwa_constantine_demo',
            'name' => 'CTWA Constantine digital',
            'objective' => 'MESSAGES',
            'status' => 'paused',
            'daily_budget_cents' => 200_000,
            'click_to_whatsapp' => true,
            'lead_form' => false,
        ]);

        // Ad sets + ads under each campaign.
        $setPlan = [
            [$ctwa, [['Alger — santé', 250_000, ['CTWA image — clinique', 'CTWA vidéo — desk']], ['Alger — lookalike', 200_000, ['CTWA carousel — CRM']]]],
            [$form, [['Oran — laboratoires', 300_000, ['Form — analyse labo', 'Form — devis rapide']]]],
            [$ctwaSouth, [['Constantine — écoles', 200_000, ['CTWA image — inscription']]]],
        ];

        foreach ($setPlan as [$campaign, $sets]) {
            foreach ($sets as [$setName, $budget, $adNames]) {
                $set = AdSet::query()->create([
                    'workspace_id' => $workspace->id,
                    'ad_campaign_id' => $campaign->id,
                    'name' => $setName,
                    'status' => $campaign->status === 'active' ? 'active' : 'paused',
                    'daily_budget_cents' => $budget,
                ]);

                foreach ($adNames as $adName) {
                    Ad::query()->create([
                        'workspace_id' => $workspace->id,
                        'ad_set_id' => $set->id,
                        'name' => $adName,
                        'status' => $set->status,
                        'kind' => str_contains($adName, 'vidéo') ? 'video' : (str_contains($adName, 'Form') ? 'lead_form' : 'image'),
                    ]);
                }
            }
        }

        // 21 days of insights per campaign so the funnel board is full.
        $statsPlan = [
            [$ctwa, 12_000, 0.041, 34],
            [$form, 8_500, 0.052, 29],
            [$ctwaSouth, 5_200, 0.038, 31],
        ];

        foreach ($statsPlan as [$campaign, $baseImpressions, $ctr, $cpcDzd]) {
            for ($day = 20; $day >= 0; $day--) {
                $wave = 1 + (sin($day / 3) * 0.18);
                $impressions = (int) round($baseImpressions * $wave);
                $clicks = (int) round($impressions * $ctr);

                AdCampaignStat::query()->create([
                    'workspace_id' => $workspace->id,
                    'ad_campaign_id' => $campaign->id,
                    'date' => now()->subDays($day)->toDateString(),
                    'impressions' => $impressions,
                    'clicks' => $clicks,
                    'spend_cents' => $clicks * $cpcDzd,
                ]);
            }
        }

        // CRM-side attribution: CTWA conversations and form leads → campaigns,
        // so Impressions → … → Won has real counts on first login.
        Thread::query()
            ->where('workspace_id', $workspace->id)
            ->whereIn('contact_id', [$contacts[0]->id, $contacts[6]->id])
            ->update(['ad_campaign_id' => $ctwa->id]);

        Thread::query()
            ->where('workspace_id', $workspace->id)
            ->where('contact_id', $contacts[4]->id)
            ->update(['ad_campaign_id' => $ctwaSouth->id]);

        $formContact = $contacts[2];
        $formLead = Lead::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $formContact->id,
            'company_id' => $formContact->company_id,
            'ad_campaign_id' => $form->id,
            'title' => 'Meta lead form — Oran lab',
            'status' => 'new',
            'source' => 'meta_lead_form',
        ]);

        AdLead::query()->create([
            'workspace_id' => $workspace->id,
            'ad_account_id' => $account->id,
            'ad_campaign_id' => $form->id,
            'contact_id' => $formContact->id,
            'lead_id' => $formLead->id,
            'external_id' => 'lead_demo_1',
            'form_id' => 'form_oran_labs',
            'fields' => ['city' => 'Oran', 'interest' => 'EvoSales'],
        ]);

        // More form leads down-funnel: qualified → deal → won.
        $formLeadPlan = [
            [3, $form, 'qualified', now()->subDays(6)],
            [7, $ctwa, 'qualified', now()->subDays(4)],
            [18, $ctwa, 'qualified', now()->subDays(9)],
        ];

        foreach ($formLeadPlan as [$contactIndex, $campaign, $status, $qualifiedAt]) {
            $contact = $contacts[$contactIndex];
            $existingDeal = Deal::query()
                ->where('workspace_id', $workspace->id)
                ->where('contact_id', $contact->id)
                ->first();

            $lead = $existingDeal?->lead_id
                ? Lead::query()->find($existingDeal->lead_id)
                : null;

            if (! $lead) {
                $lead = Lead::query()->create([
                    'workspace_id' => $workspace->id,
                    'contact_id' => $contact->id,
                    'company_id' => $contact->company_id,
                    'title' => 'Meta — '.$contact->displayName(),
                    'status' => $status,
                    'source' => $campaign->lead_form ? 'meta_lead_form' : 'ctwa',
                    'qualified_at' => $qualifiedAt,
                ]);
            }

            $lead->forceFill([
                'ad_campaign_id' => $campaign->id,
                'status' => $status,
                'qualified_at' => $qualifiedAt,
            ])->save();

            AdLead::query()->create([
                'workspace_id' => $workspace->id,
                'ad_account_id' => $account->id,
                'ad_campaign_id' => $campaign->id,
                'contact_id' => $contact->id,
                'lead_id' => $lead->id,
                'external_id' => 'lead_demo_'.$contactIndex,
                'form_id' => $campaign->lead_form ? 'form_oran_labs' : null,
                'fields' => ['city' => $contact->city, 'interest' => 'EvoSales'],
            ]);
        }

        $sector = CustomAttributeDefinition::query()->create([
            'workspace_id' => $workspace->id,
            'entity' => 'company',
            'key' => 'sector',
            'label' => 'Sector',
            'type' => 'list',
            'group_name' => 'About',
            'options' => ['santé', 'éducation', 'logistique', 'retail', 'agri'],
        ]);
        $beds = CustomAttributeDefinition::query()->create([
            'workspace_id' => $workspace->id,
            'entity' => 'contact',
            'key' => 'beds',
            'label' => 'Beds / size',
            'type' => 'number',
            'group_name' => 'About',
        ]);
        $competitor = CustomAttributeDefinition::query()->create([
            'workspace_id' => $workspace->id,
            'entity' => 'deal',
            'key' => 'competitor',
            'label' => 'Competitor',
            'type' => 'text',
            'group_name' => 'Deal details',
        ]);

        CustomAttributeValue::query()->create([
            'workspace_id' => $workspace->id,
            'definition_id' => $sector->id,
            'entity_type' => 'company',
            'entity_id' => $companies[0]->id,
            'value' => 'santé',
        ]);
        CustomAttributeValue::query()->create([
            'workspace_id' => $workspace->id,
            'definition_id' => $beds->id,
            'entity_type' => 'contact',
            'entity_id' => $contacts[0]->id,
            'value' => '80',
        ]);
        $firstDeal = Deal::query()->where('workspace_id', $workspace->id)->first();
        if ($firstDeal) {
            CustomAttributeValue::query()->create([
                'workspace_id' => $workspace->id,
                'definition_id' => $competitor->id,
                'entity_type' => 'deal',
                'entity_id' => $firstDeal->id,
                'value' => 'Kommo',
            ]);

            $quote = Quote::query()->create([
                'workspace_id' => $workspace->id,
                'deal_id' => $firstDeal->id,
                'status' => 'sent',
                'currency' => 'DZD',
                'notes' => 'Clinic workspace + desk handoff',
            ]);
            $workspaceProduct = Product::query()
                ->forWorkspace($workspace)
                ->where('sku', 'EVO-SALES-WS')
                ->first();
            $onboardProduct = Product::query()
                ->forWorkspace($workspace)
                ->where('sku', 'EVO-ONBOARD')
                ->first();

            app(QuoteTotals::class)->sync($quote, [
                ['product_id' => $workspaceProduct?->id, 'name' => 'EvoSales workspace', 'quantity' => 1, 'unit_dzd' => 180000],
                ['product_id' => $onboardProduct?->id, 'name' => 'Onboarding', 'quantity' => 1, 'unit_dzd' => 40000],
            ]);

            $lineTotals = app(DealLineTotals::class);
            if ($workspaceProduct) {
                $lineTotals->add($firstDeal, ['quantity' => 1], $workspaceProduct);
            }
            if ($onboardProduct) {
                $lineTotals->add($firstDeal, ['quantity' => 1], $onboardProduct);
            }
        }

        $clinicDeal = Deal::query()->where('title', 'Clinic website intake')->first();
        Activity::query()->create([
            'workspace_id' => $workspace->id,
            'type' => 'note',
            'subject' => 'Décideur = directeur médical',
            'body' => 'Amine veut un devis avant fin du mois.',
            'actor_id' => $owner->id,
            'owner_id' => $owner->id,
            'contact_id' => $contacts[0]->id,
            'deal_id' => $clinicDeal?->id,
            'company_id' => $companies[0]->id,
        ]);
        Activity::query()->create([
            'workspace_id' => $workspace->id,
            'type' => 'task',
            'subject' => 'Relancer Amine pour démo',
            'body' => 'Appeler avant 17h Africa/Algiers.',
            'due_at' => now()->addHours(6),
            'done' => false,
            'actor_id' => $owner->id,
            'owner_id' => $rep->id,
            'contact_id' => $contacts[0]->id,
            'deal_id' => $clinicDeal?->id,
            'company_id' => $companies[0]->id,
        ]);
        Activity::query()->create([
            'workspace_id' => $workspace->id,
            'type' => 'call',
            'subject' => 'Call Oran lab',
            'body' => '15 min — intéressés par le desk EvoDesk.',
            'done' => true,
            'completed_at' => now()->subDay(),
            'actor_id' => $rep->id,
            'owner_id' => $rep->id,
            'contact_id' => $contacts[2]->id,
            'company_id' => $companies[1]->id,
        ]);
        Activity::query()->create([
            'workspace_id' => $workspace->id,
            'type' => 'meeting',
            'subject' => 'Démo Constantine',
            'body' => 'Présenter CRM Sales Hub + Open in Desk.',
            'due_at' => now()->addDays(2),
            'done' => false,
            'actor_id' => $owner->id,
            'owner_id' => $owner->id,
            'contact_id' => $contacts[4]->id,
        ]);
        Activity::query()->create([
            'workspace_id' => $workspace->id,
            'type' => 'sequence',
            'subject' => 'Enrolled in Clinic email nurture',
            'body' => 'Sequence clinic nurture (email).',
            'contact_id' => $contacts[1]->id,
            'company_id' => $contacts[1]->company_id,
        ]);

        SavedFilter::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
            'name' => 'Unassigned Alger',
            'entity' => 'contact',
            'filters' => ['city' => 'Alger', 'unassigned' => true],
        ]);
        SavedFilter::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
            'name' => 'Open pipeline',
            'entity' => 'deal',
            'filters' => ['stage' => 'proposal'],
        ]);
        SavedFilter::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $rep->id,
            'name' => 'Unanswered desk',
            'entity' => 'contact',
            'filters' => ['unanswered' => true],
        ]);

        // Point the draft campaign at a CRM list now that filters exist.
        OutboundCampaign::query()
            ->where('workspace_id', $workspace->id)
            ->where('name', 'September re-engagement')
            ->update([
                'saved_filter_id' => SavedFilter::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('name', 'Unanswered desk')
                    ->first()?->id,
            ]);

        $this->call(VisualQaSeeder::class);
    }
}
