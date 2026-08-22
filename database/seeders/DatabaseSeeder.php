<?php

namespace Database\Seeders;

use App\Enums\ChannelType;
use App\Enums\WorkspaceRole;
use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdLead;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Lead;
use App\Models\Mailbox;
use App\Models\Message;
use App\Models\Sequence;
use App\Models\Thread;
use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $provisioner = app(WorkspaceProvisioner::class);
        $workspace = $provisioner->provision('Evotechly');

        User::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Evotechly Owner',
            'email' => 'owner@evosales.local',
            'password' => 'password',
            'role' => WorkspaceRole::Owner,
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
        ])->map(fn (array $row) => Company::query()->create([
            ...$row,
            'workspace_id' => $workspace->id,
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

        $contacts = collect($people)->values()->map(function (array $person, int $index) use ($workspace, $companies) {
            [$first, $last, $domain, $companyIndex] = $person;
            $n = str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);

            return Contact::query()->create([
                'workspace_id' => $workspace->id,
                'company_id' => $companies[$companyIndex]->id,
                'first_name' => $first,
                'last_name' => $last,
                'email' => strtolower($first).'.'.$last.'@'.$domain,
                'phone' => '0550100'.$n,
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
                'title' => $title,
                'amount_cents' => $amount,
                'currency' => 'DZD',
                'closed_at' => in_array($stageSlug, ['won', 'lost'], true) ? now()->subDay() : null,
                'next_activity_at' => $next,
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

        Mailbox::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Evotechly SMTP (demo)',
            'from_name' => 'Evotechly',
            'from_address' => 'hello@evotechly.com',
            'host' => 'smtp.evotechly.example',
            'port' => 587,
            'encryption' => 'tls',
            'username' => 'demo',
            'password' => 'not-a-real-password',
            'is_default' => true,
            'enabled' => false,
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
            'status' => 'demo',
            'click_to_whatsapp' => true,
            'lead_form' => false,
        ]);

        $form = AdCampaign::query()->create([
            'workspace_id' => $workspace->id,
            'ad_account_id' => $account->id,
            'external_id' => 'camp_leadform_demo',
            'name' => 'Lead form Oran labs',
            'objective' => 'LEAD_GENERATION',
            'status' => 'demo',
            'click_to_whatsapp' => false,
            'lead_form' => true,
        ]);

        $formContact = $contacts[2];
        $formLead = Lead::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $formContact->id,
            'company_id' => $formContact->company_id,
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

        unset($ctwa);
    }
}
