<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Integration;
use App\Models\QuietHours;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

function slaTicket(User $user): Ticket
{
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amel',
        'phone' => '0550123456',
    ]);

    return Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'subject' => 'Parts delayed',
        'owner_id' => $user->id,
        'priority' => Ticket::PRIORITY_HIGH,
    ]);
}

function connectSlaWhatsApp(User $user, string $provider = Integration::PROVIDER_WHATSAPP): Integration
{
    return Integration::query()->create([
        'workspace_id' => $user->workspace_id,
        'provider' => $provider,
        'status' => 'connected',
        'access_token' => 'wa-token',
        'connected_at' => now(),
        'meta' => [
            'instance' => $provider === Integration::PROVIDER_WHATSAPP_BUSINESS
                ? 'evo-ws'.$user->workspace_id.'-waba'
                : 'evo-ws'.$user->workspace_id.'-wa',
            'state' => 'open',
        ],
    ]);
}

function fakeSlaEvolution(): void
{
    config()->set('evolution.base_url', 'https://evolution.example.test');
    config()->set('evolution.api_key', 'evo-key');
    Http::fake([
        'https://evolution.example.test/message/sendText/*' => Http::response(['key' => ['id' => 'wamid-1']], 200),
        'https://evolution.example.test/message/sendTemplate/*' => Http::response(['key' => ['id' => 'wamid-tpl']], 200),
    ]);
}

it('sends a WhatsApp ping when first-response SLA breaches', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));
    fakeSlaEvolution();

    $user = User::factory()->create();
    connectSlaWhatsApp($user);
    $ticket = slaTicket($user);

    $this->travelTo(Carbon::parse('2026-09-08 19:00:00', 'Africa/Algiers'));
    $this->artisan('tickets:check-sla')->assertSuccessful();

    expect($ticket->fresh()->sla_breached_at)->not->toBeNull();

    $row = Activity::query()
        ->where('type', 'notification')
        ->where('contact_id', $ticket->contact_id)
        ->latest('id')
        ->first();

    expect($row)->not->toBeNull()
        ->and($row->meta['whatsapp_sla'] ?? null)->toBe('sent')
        ->and($row->meta['ticket_id'] ?? null)->toBe($ticket->id);

    Http::assertSent(fn ($request) => str_contains($request->url(), '/message/sendText/')
        && $request['number'] === '213550123456'
        && str_contains((string) $request['text'], 'Amel')
        && str_contains((string) $request['text'], (string) $ticket->number));

    Http::fake();
    $this->artisan('tickets:check-sla')->assertSuccessful();
    Http::assertNothingSent();
});

it('sends the Cloud ticket_sla template when WhatsApp Business is connected', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));
    fakeSlaEvolution();

    $user = User::factory()->create();
    connectSlaWhatsApp($user, Integration::PROVIDER_WHATSAPP_BUSINESS);
    $ticket = slaTicket($user);

    $this->travelTo(Carbon::parse('2026-09-08 19:00:00', 'Africa/Algiers'));
    $this->artisan('tickets:check-sla')->assertSuccessful();

    $row = Activity::query()->where('type', 'notification')->latest('id')->first();

    expect($row->meta['whatsapp_sla'] ?? null)->toBe('sent');

    Http::assertSent(fn ($request) => str_contains($request->url(), '/message/sendTemplate/')
        && $request['name'] === 'ticket_sla'
        && $request['language'] === 'fr'
        && $request['number'] === '213550123456');
    Http::assertNotSent(fn ($request) => str_contains($request->url(), '/message/sendText/'));
});

it('defers the SLA WhatsApp ping during Africa/Algiers quiet hours', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));
    fakeSlaEvolution();

    $user = User::factory()->create();
    connectSlaWhatsApp($user);
    $ticket = slaTicket($user);

    QuietHours::query()->where('workspace_id', $user->workspace_id)->update([
        'enabled' => true,
        'timezone' => 'Africa/Algiers',
        'starts_at' => '21:00',
        'ends_at' => '08:00',
    ]);

    $this->travelTo(Carbon::parse('2026-09-08 22:00:00', 'Africa/Algiers'));
    $this->artisan('tickets:check-sla')->assertSuccessful();

    $row = Activity::query()->where('type', 'notification')->latest('id')->first();

    expect($ticket->fresh()->sla_breached_at)->not->toBeNull()
        ->and($row->meta['whatsapp_sla'] ?? null)->toBe('deferred');

    Http::assertNothingSent();
});

it('flushes a deferred SLA WhatsApp ping after quiet hours', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));
    fakeSlaEvolution();

    $user = User::factory()->create();
    connectSlaWhatsApp($user);
    $ticket = slaTicket($user);

    QuietHours::query()->where('workspace_id', $user->workspace_id)->update([
        'enabled' => true,
        'timezone' => 'Africa/Algiers',
        'starts_at' => '21:00',
        'ends_at' => '08:00',
    ]);

    $this->travelTo(Carbon::parse('2026-09-08 22:00:00', 'Africa/Algiers'));
    $this->artisan('tickets:check-sla')->assertSuccessful();

    $row = Activity::query()->where('type', 'notification')->latest('id')->first();

    expect($row->meta['whatsapp_sla'] ?? null)->toBe('deferred');
    Http::assertNothingSent();

    $this->travelTo(Carbon::parse('2026-09-09 08:05:00', 'Africa/Algiers'));
    $this->artisan('tickets:check-sla')->assertSuccessful();

    expect($row->fresh()->meta['whatsapp_sla'] ?? null)->toBe('sent')
        ->and(Activity::query()->where('type', 'notification')->where('contact_id', $ticket->contact_id)->count())->toBe(1);

    Http::assertSent(fn ($request) => str_contains($request->url(), '/message/sendText/')
        && $request['number'] === '213550123456'
        && str_contains((string) $request['text'], (string) $ticket->number));
});

it('does not flush a deferred SLA ping while quiet hours still apply', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));
    fakeSlaEvolution();

    $user = User::factory()->create();
    connectSlaWhatsApp($user);
    slaTicket($user);

    QuietHours::query()->where('workspace_id', $user->workspace_id)->update([
        'enabled' => true,
        'timezone' => 'Africa/Algiers',
        'starts_at' => '21:00',
        'ends_at' => '08:00',
    ]);

    $this->travelTo(Carbon::parse('2026-09-08 22:00:00', 'Africa/Algiers'));
    $this->artisan('tickets:check-sla')->assertSuccessful();
    $this->travelTo(Carbon::parse('2026-09-08 22:30:00', 'Africa/Algiers'));
    $this->artisan('tickets:check-sla')->assertSuccessful();

    $row = Activity::query()->where('type', 'notification')->latest('id')->first();

    expect($row->meta['whatsapp_sla'] ?? null)->toBe('deferred');
    Http::assertNothingSent();
});

it('skips a deferred SLA ping once the ticket has a first response', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));
    fakeSlaEvolution();

    $user = User::factory()->create();
    connectSlaWhatsApp($user);
    $ticket = slaTicket($user);

    QuietHours::query()->where('workspace_id', $user->workspace_id)->update([
        'enabled' => true,
        'timezone' => 'Africa/Algiers',
        'starts_at' => '21:00',
        'ends_at' => '08:00',
    ]);

    $this->travelTo(Carbon::parse('2026-09-08 22:00:00', 'Africa/Algiers'));
    $this->artisan('tickets:check-sla')->assertSuccessful();

    $ticket->forceFill(['first_response_at' => now()])->save();

    $this->travelTo(Carbon::parse('2026-09-09 08:05:00', 'Africa/Algiers'));
    $this->artisan('tickets:check-sla')->assertSuccessful();

    $row = Activity::query()->where('type', 'notification')->latest('id')->first();

    expect($row->meta['whatsapp_sla'] ?? null)->toBe('skipped');
    Http::assertNothingSent();
});
