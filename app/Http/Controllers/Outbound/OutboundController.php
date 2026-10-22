<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\OutboundCampaign;
use App\Models\OutboundDomain;
use App\Models\OutboundMessage;
use App\Models\Sequence;
use App\Models\Suppression;
use App\Services\Outbound\MailboxSync;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OutboundController extends Controller
{
    public function index(Request $request, MailboxSync $sync): Response
    {
        $workspace = $request->user()->workspace;

        $outbound = OutboundMessage::query()->forWorkspace($workspace)->where('direction', 'out');

        return Inertia::render('outbound/index', [
            'mail_stack' => [
                'configured' => $sync->configured(),
                'smtp_host' => config('evosales.mail_stack.smtp.host'),
                'smtp_port' => config('evosales.mail_stack.smtp.port'),
                'imap_host' => config('evosales.mail_stack.imap.host'),
                'imap_port' => config('evosales.mail_stack.imap.port'),
                'roundcube_url' => config('evosales.mail_stack.roundcube_url'),
            ],
            'stats' => [
                'mailboxes' => Mailbox::query()->forWorkspace($workspace)->count(),
                'mailboxes_enabled' => Mailbox::query()->forWorkspace($workspace)->where('enabled', true)->count(),
                'sequences_active' => Sequence::query()->forWorkspace($workspace)->where('active', true)->count(),
                'enrolled_active' => Enrollment::query()->forWorkspace($workspace)->where('status', 'active')->count(),
                'sent_30d' => (clone $outbound)->where('status', 'sent')->where('sent_at', '>=', now()->subDays(30))->count(),
                'deferred' => (clone $outbound)->where('status', 'queued')->whereNotNull('deferred_until')->where('deferred_until', '>', now())->count(),
                'replies_30d' => OutboundMessage::query()
                    ->forWorkspace($workspace)
                    ->where('direction', 'in')
                    ->where('created_at', '>=', now()->subDays(30))
                    ->count(),
                'suppressed' => Suppression::query()->forWorkspace($workspace)->count(),
                'failed_30d' => (clone $outbound)->where('status', 'failed')->where('created_at', '>=', now()->subDays(30))->count(),
                'delivered_30d' => (clone $outbound)->whereNotNull('delivered_at')->where('delivered_at', '>=', now()->subDays(30))->count(),
                'complaints_30d' => (clone $outbound)->whereNotNull('complained_at')->where('complained_at', '>=', now()->subDays(30))->count(),
                'campaigns_sending' => OutboundCampaign::query()->forWorkspace($workspace)->whereIn('status', [OutboundCampaign::STATUS_SCHEDULED, OutboundCampaign::STATUS_SENDING])->count(),
                'campaigns_sent' => OutboundCampaign::query()->forWorkspace($workspace)->where('status', OutboundCampaign::STATUS_SENT)->count(),
                'domains' => OutboundDomain::query()->forWorkspace($workspace)->count(),
                'domains_verified' => OutboundDomain::query()->forWorkspace($workspace)->where('status', OutboundDomain::STATUS_VERIFIED)->count(),
            ],
            'mailboxHealth' => Mailbox::query()
                ->forWorkspace($workspace)
                ->orderByDesc('is_default')
                ->get()
                ->map(fn (Mailbox $box) => [
                    'id' => $box->id,
                    'name' => $box->name,
                    'from_address' => $box->from_address,
                    'effective_status' => $box->effectiveStatus(),
                    'imap_configured' => $box->imapConfigured(),
                    'sent_today' => $box->sentToday(),
                    'daily_limit' => $box->daily_limit,
                    'last_tested_at' => $box->last_tested_at,
                ]),
            'recent' => OutboundMessage::query()
                ->forWorkspace($workspace)
                ->with(['contact:id,first_name,last_name,email', 'sequence:id,name', 'campaign:id,name'])
                ->latest()
                ->limit(12)
                ->get(),
        ]);
    }
}
