<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Mailbox;
use App\Models\OutboundCampaign;
use App\Models\OutboundMessage;
use App\Models\OutboundTemplate;
use App\Models\SavedFilter;
use App\Services\Outbound\CampaignService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Broadcast campaigns: one-shot sends to a CRM audience from a template and
 * a mailbox, scheduled or send-now. This is how newsletters land without a
 * second app — every recipient is logged as an OutboundMessage.
 */
class CampaignController extends Controller
{
    public function index(Request $request, CampaignService $campaigns): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('outbound/campaigns/index', [
            'campaigns' => OutboundCampaign::query()
                ->forWorkspace($workspace)
                ->with(['savedFilter:id,name', 'template:id,name', 'mailbox:id,name,from_address'])
                ->latest()
                ->get()
                ->map(fn (OutboundCampaign $campaign) => [
                    ...$campaign->toArray(),
                    'counts' => $campaign->messageCounts(),
                ]),
            'filters' => SavedFilter::query()
                ->forWorkspace($workspace)
                ->where('entity', 'contact')
                ->orderBy('name')
                ->get(['id', 'name', 'filters']),
            'templates' => OutboundTemplate::query()
                ->forWorkspace($workspace)
                ->orderBy('name')
                ->get(['id', 'name', 'subject', 'body', 'body_html']),
            'mailboxes' => Mailbox::query()
                ->forWorkspace($workspace)
                ->where('enabled', true)
                ->orderByDesc('is_default')
                ->get(['id', 'name', 'from_address', 'daily_limit']),
            'audience_size' => $campaigns->audience($workspace, null)->count(),
        ]);
    }

    public function store(Request $request, CampaignService $campaigns): RedirectResponse
    {
        $workspace = $request->user()->workspace;

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'saved_filter_id' => ['nullable', 'integer'],
            'template_id' => ['nullable', 'integer'],
            'mailbox_id' => ['nullable', 'integer'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['nullable', 'string'],
            'body_html' => ['nullable', 'string'],
            'mode' => ['required', 'in:draft,scheduled,send_now'],
            'scheduled_at' => ['nullable', 'date', 'required_if:mode,scheduled'],
        ]);

        $template = ! empty($data['template_id'])
            ? OutboundTemplate::query()->forWorkspace($workspace)->find($data['template_id'])
            : null;

        $filter = ! empty($data['saved_filter_id'])
            ? SavedFilter::query()->forWorkspace($workspace)->where('entity', 'contact')->find($data['saved_filter_id'])
            : null;

        $mailbox = ! empty($data['mailbox_id'])
            ? Mailbox::query()->forWorkspace($workspace)->find($data['mailbox_id'])
            : null;

        $body = $data['body'] ?? null;
        if (blank($body) && $template) {
            $body = $template->body;
        }

        if (blank($body)) {
            return back()->withErrors(['body' => 'Write a body or pick a template.']);
        }

        $campaign = OutboundCampaign::query()->create([
            'workspace_id' => $workspace->id,
            'name' => $data['name'],
            'status' => OutboundCampaign::STATUS_DRAFT,
            'saved_filter_id' => $filter?->id,
            'template_id' => $template?->id,
            'mailbox_id' => $mailbox?->id,
            'subject' => $data['subject'] ?? $template?->subject,
            'body' => $body,
            'body_html' => $data['body_html'] ?? $template?->body_html,
            'scheduled_at' => $data['mode'] === 'scheduled' ? $data['scheduled_at'] : null,
            'created_by' => $request->user()->id,
        ]);

        if ($data['mode'] === 'scheduled') {
            $campaign->forceFill(['status' => OutboundCampaign::STATUS_SCHEDULED])->save();
        }

        if ($data['mode'] === 'send_now') {
            $campaigns->expand($campaign);
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => "Campaign queued for {$campaign->refresh()->audience_count} contact(s). The runner sends within a minute, honoring quiet hours and daily caps.",
            ]);
        }

        return redirect()->route('outbound.campaigns.show', $campaign);
    }

    public function show(Request $request, OutboundCampaign $campaign): Response
    {
        abort_unless((int) $campaign->workspace_id === (int) $request->user()->workspace_id, 404);

        return Inertia::render('outbound/campaigns/show', [
            'campaign' => [
                ...$campaign->load(['savedFilter:id,name', 'template:id,name', 'mailbox:id,name,from_address'])->toArray(),
                'counts' => $campaign->messageCounts(),
            ],
            'messages' => OutboundMessage::query()
                ->where('campaign_id', $campaign->id)
                ->where('direction', 'out')
                ->with(['contact:id,first_name,last_name,email'])
                ->latest()
                ->limit(100)
                ->get(),
        ]);
    }

    public function sendNow(Request $request, OutboundCampaign $campaign, CampaignService $campaigns): RedirectResponse
    {
        abort_unless((int) $campaign->workspace_id === (int) $request->user()->workspace_id, 404);

        if ($campaign->editable()) {
            $campaigns->expand($campaign);
        }

        return back();
    }

    public function schedule(Request $request, OutboundCampaign $campaign): RedirectResponse
    {
        abort_unless((int) $campaign->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
        ]);

        if ($campaign->editable()) {
            $campaign->forceFill([
                'status' => OutboundCampaign::STATUS_SCHEDULED,
                'scheduled_at' => $data['scheduled_at'],
            ])->save();
        }

        return back();
    }

    /**
     * Cancel stops the campaign and drops messages that never went out;
     * anything already sent stays in the outbox.
     */
    public function cancel(Request $request, OutboundCampaign $campaign): RedirectResponse
    {
        abort_unless((int) $campaign->workspace_id === (int) $request->user()->workspace_id, 404);

        if ($campaign->cancellable()) {
            $campaign->messages()->where('direction', 'out')->where('status', 'queued')->delete();
            $campaign->forceFill(['status' => OutboundCampaign::STATUS_CANCELLED])->save();
        }

        return back();
    }

    public function destroy(Request $request, OutboundCampaign $campaign): RedirectResponse
    {
        abort_unless((int) $campaign->workspace_id === (int) $request->user()->workspace_id, 404);

        if ($campaign->editable()) {
            $campaign->messages()->where('direction', 'out')->where('status', 'queued')->delete();
            $campaign->delete();

            return redirect()->route('outbound.campaigns.index');
        }

        return back();
    }
}
