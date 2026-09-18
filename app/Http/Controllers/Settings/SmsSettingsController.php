<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ChannelType;
use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Integration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SmsSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $integration = $workspace->integration(Integration::PROVIDER_SMS);
        $meta = $integration?->meta ?? [];
        $fields = is_array($meta['fields'] ?? null) ? $meta['fields'] : [];

        return Inertia::render('settings/sms', [
            'connected' => $integration?->isConnected() ?? false,
            'status' => ($integration?->isConnected() ?? false) ? 'connected' : 'not_connected',
            'key_set' => filled($integration?->access_token),
            'driver' => $meta['driver'] ?? config('sms.driver', 'http'),
            'url' => $meta['url'] ?? config('sms.http.url'),
            'method' => $meta['method'] ?? config('sms.http.method', 'POST'),
            'http_auth' => $meta['auth'] ?? config('sms.http.auth', 'form'),
            'sender' => $meta['sender'] ?? config('sms.sender', 'EVOTECHLY'),
            'field_to' => $fields['to'] ?? config('sms.http.fields.to', 'to'),
            'field_message' => $fields['message'] ?? config('sms.http.fields.message', 'message'),
            'field_sender' => $fields['sender'] ?? config('sms.http.fields.sender', 'sender'),
            'field_api_key' => $fields['api_key'] ?? config('sms.http.fields.api_key', 'api_key'),
            'env_http_configured' => filled(config('sms.http.url')) && filled(config('sms.http.key')),
            'env_twilio_configured' => filled(config('services.twilio.sid'))
                && filled(config('services.twilio.token'))
                && filled(config('services.twilio.from')),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $workspace = $request->user()->workspace;
        $existing = $workspace->integration(Integration::PROVIDER_SMS);

        $data = $request->validate([
            'driver' => ['required', Rule::in(['http', 'twilio'])],
            'url' => ['nullable', 'url', 'max:500', Rule::requiredIf($request->input('driver') === 'http' && blank($existing?->meta['url'] ?? null) && blank(config('sms.http.url')))],
            'method' => ['nullable', Rule::in(['GET', 'POST'])],
            'auth' => ['nullable', Rule::in(['form', 'bearer'])],
            'sender' => ['required', 'string', 'max:11', 'regex:/^[A-Za-z0-9]+$/'],
            'api_key' => ['nullable', 'string', 'max:255', Rule::requiredIf($request->input('driver') === 'http' && blank($existing?->access_token))],
            'field_to' => ['nullable', 'string', 'max:40'],
            'field_message' => ['nullable', 'string', 'max:40'],
            'field_sender' => ['nullable', 'string', 'max:40'],
            'field_api_key' => ['nullable', 'string', 'max:40'],
        ]);

        $integration = Integration::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'provider' => Integration::PROVIDER_SMS,
            ],
            [
                'status' => 'connected',
                'access_token' => filled($data['api_key'] ?? null)
                    ? $data['api_key']
                    : $existing?->access_token,
                'connected_at' => $existing?->connected_at ?? now(),
                'meta' => [
                    'driver' => $data['driver'],
                    'url' => $data['url'] ?? $existing?->meta['url'] ?? config('sms.http.url'),
                    'method' => $data['method'] ?? 'POST',
                    'auth' => $data['auth'] ?? 'form',
                    'sender' => $data['sender'],
                    'fields' => [
                        'to' => ($data['field_to'] ?? '') ?: 'to',
                        'message' => ($data['field_message'] ?? '') ?: 'message',
                        'sender' => ($data['field_sender'] ?? '') ?: 'sender',
                        'api_key' => ($data['field_api_key'] ?? '') ?: 'api_key',
                    ],
                ],
            ],
        );

        Channel::query()->updateOrCreate(
            ['workspace_id' => $workspace->id, 'type' => ChannelType::Sms],
            ['name' => 'SMS', 'status' => $integration->isConnected() ? 'connected' : 'not_connected'],
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'SMS gateway saved. The API key is stored encrypted and is never shown again.',
        ]);

        if ($request->input('return') === 'start') {
            return redirect()->route('settings.setup.show', [
                'provider' => 'start',
                'step' => 'finish',
            ]);
        }

        return redirect()->route('settings.sms');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $workspace = $request->user()->workspace;
        $workspace->integration(Integration::PROVIDER_SMS)?->delete();

        Channel::query()
            ->where('workspace_id', $workspace->id)
            ->where('type', ChannelType::Sms)
            ->update(['status' => 'not_connected']);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'SMS gateway disconnected. Stored credentials were deleted.',
        ]);

        return redirect()->route('settings.sms');
    }
}
