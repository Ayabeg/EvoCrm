<?php

namespace App\Services\Crm;

use App\Mail\WorkspaceHtmlMail;
use App\Models\Mailbox;
use App\Models\Quote;
use App\Models\User;
use App\Services\Operations\AuditLogger;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class QuoteMailer
{
    public function __construct(
        private QuoteDocument $documents,
        private ActivityRecorder $activities,
        private AuditLogger $audit,
    ) {}

    public function send(Quote $quote, User $actor, string $to): Quote
    {
        $quote->loadMissing(['deal.contact', 'workspace']);
        $quote = $this->documents->freeze($quote);
        $mailbox = Mailbox::query()
            ->forWorkspace($quote->workspace_id)
            ->where('enabled', true)
            ->orderByDesc('is_default')
            ->first();

        $html = (string) $quote->snapshot_html;
        $pdf = $this->documents->pdf($quote);

        Mail::to($to)->send(new WorkspaceHtmlMail(
            subjectLine: 'Quote #'.$quote->id.' from EvoSales',
            htmlBody: $html,
            fromAddress: $mailbox?->from_address,
            fromName: $mailbox?->from_name,
            fileAttachments: [[
                'name' => 'quote-'.$quote->id.'.pdf',
                'data' => $pdf,
                'mime' => 'application/pdf',
            ]],
        ));

        if (blank($quote->public_token)) {
            $quote->forceFill([
                'public_token' => Str::random(64),
                'token_expires_at' => now()->addDays(14),
            ]);
        }

        $quote->forceFill([
            'status' => 'sent',
            'sent_at' => now(),
        ])->save();

        $this->activities->record($quote->workspace ?? $actor->workspace, [
            'type' => 'quote_sent',
            'subject' => 'Quote emailed',
            'body' => 'Quote #'.$quote->id.' emailed to '.$to.'.',
            'contact_id' => $quote->deal?->contact_id,
            'deal_id' => $quote->deal_id,
            'meta' => ['quote_id' => $quote->id, 'to' => $to],
        ], $actor);

        if ($quote->workspace) {
            $this->audit->record(
                $quote->workspace,
                'quote.sent',
                'Quote #'.$quote->id.' emailed to '.$to.'.',
                $actor,
                $quote,
                ['to' => $to],
            );
        }

        return $quote->fresh() ?? $quote;
    }
}
