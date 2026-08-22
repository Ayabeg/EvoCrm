<?php

namespace Database\Seeders;

use App\Enums\ChannelType;
use App\Enums\WorkspaceRole;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Message;
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

        $company = Company::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Clinique El Djazair',
            'domain' => 'clinique-djazair.dz',
            'city' => 'Alger',
            'country' => 'DZ',
            'phone' => '+213 21 00 00 00',
        ]);

        $contact = Contact::query()->create([
            'workspace_id' => $workspace->id,
            'company_id' => $company->id,
            'first_name' => 'Amine',
            'last_name' => 'Benali',
            'email' => 'amine@clinique-djazair.dz',
            'phone' => '0550123456',
            'source' => 'seed',
        ]);

        $lead = Lead::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'company_id' => $company->id,
            'title' => 'WhatsApp intake — clinic website',
            'status' => 'new',
            'source' => 'seed',
        ]);

        $pipeline = $workspace->defaultPipeline();

        Deal::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'company_id' => $company->id,
            'lead_id' => $lead->id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $pipeline->stageBySlug('qualified')->id,
            'title' => 'EvoSales workspace for Clinique El Djazair',
            'amount_cents' => 45000000,
            'currency' => 'DZD',
        ]);

        $channel = $workspace->channels()->where('type', ChannelType::WhatsAppCloud)->first()
            ?? $workspace->channels()->first();

        $thread = Thread::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'channel_id' => $channel->id,
            'status' => 'open',
            'subject' => 'WhatsApp Cloud',
            'last_message_at' => now(),
        ]);

        Message::query()->create([
            'workspace_id' => $workspace->id,
            'thread_id' => $thread->id,
            'contact_id' => $contact->id,
            'direction' => 'inbound',
            'type' => 'text',
            'body' => 'Salam, je veux un devis pour un logiciel commercial.',
            'status' => 'received',
            'provider' => 'evolution_cloud',
        ]);
    }
}
