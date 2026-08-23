<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\OutboundMessage;
use App\Models\Sequence;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OutboundReportController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        $out = OutboundMessage::query()->forWorkspace($workspace)->where('direction', 'out');

        $totals = [
            'queued' => (clone $out)->where('status', 'queued')->count(),
            'sent' => (clone $out)->where('status', 'sent')->count(),
            'failed' => (clone $out)->where('status', 'failed')->count(),
            'opened' => (clone $out)->whereNotNull('opened_at')->count(),
            'replied' => (clone $out)->whereNotNull('replied_at')->count(),
            'bounced' => (clone $out)->where('failure_reason', 'like', '%bounce%')->count(),
        ];

        $perSequence = Sequence::query()
            ->forWorkspace($workspace)
            ->withCount([
                'enrollments',
                'enrollments as enrollments_active' => fn ($q) => $q->where('status', 'active'),
                'enrollments as enrollments_finished' => fn ($q) => $q->where('status', 'finished'),
            ])
            ->get()
            ->map(fn (Sequence $sequence) => [
                'id' => $sequence->id,
                'name' => $sequence->name,
                'channel' => $sequence->channel,
                'active' => $sequence->active,
                'enrollments' => $sequence->enrollments_count,
                'enrollments_active' => $sequence->enrollments_active,
                'enrollments_finished' => $sequence->enrollments_finished,
                'sent' => OutboundMessage::query()
                    ->forWorkspace($workspace)
                    ->where('direction', 'out')
                    ->where('sequence_id', $sequence->id)
                    ->where('status', 'sent')
                    ->count(),
                'opened' => OutboundMessage::query()
                    ->forWorkspace($workspace)
                    ->where('direction', 'out')
                    ->where('sequence_id', $sequence->id)
                    ->whereNotNull('opened_at')
                    ->count(),
                'replied' => OutboundMessage::query()
                    ->forWorkspace($workspace)
                    ->where('direction', 'out')
                    ->where('sequence_id', $sequence->id)
                    ->whereNotNull('replied_at')
                    ->count(),
            ]);

        $daily = OutboundMessage::query()
            ->forWorkspace($workspace)
            ->where('direction', 'out')
            ->where('status', 'sent')
            ->where('sent_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(sent_at) as day, COUNT(*) as sent')
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return Inertia::render('outbound/reports', [
            'totals' => $totals,
            'perSequence' => $perSequence,
            'daily' => $daily,
            'tracking' => [
                'sent' => 'Logged for every dispatch attempt.',
                'opened' => 'Tracked with a 1px image — only counts recipients whose mail client loads remote images.',
                'replied' => 'Tracked when the IMAP poller matches an inbound mail to a contact. Requires mailbox IMAP settings + ext-imap.',
                'bounced' => 'Not tracked yet — needs ESP webhooks or bounce-box parsing. Counts shown are failures mentioning a bounce.',
            ],
        ]);
    }
}
