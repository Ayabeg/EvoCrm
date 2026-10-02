<?php

namespace App\Services\Crm;

use App\Mail\WorkspaceHtmlMail;
use App\Models\Mailbox;
use App\Models\Quote;
use App\Models\User;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Operations\AuditLogger;
use App\Support\Locale;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class QuoteMailer
{
    public function __construct(
        private QuoteDocument $documents,
        private ActivityRecorder $activities,
        private AuditLogger $audit,
        private ProductAnalytics $analytics,
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

        $locale = Locale::resolve($actor);
        $previous = App::getLocale();
        App::setLocale($locale);

        try {
            Mail::to($to)->send((new WorkspaceHtmlMail(
                subjectLine: __('Quote #:id from EvoSales', ['id' => $quote->id]),
                htmlBody: $html,
                fromAddress: $mailbox?->from_address,
                fromName: $mailbox?->from_name,
                fileAttachments: [[
                    'name' => 'quote-'.$quote->id.'.pdf',
                    'data' => $pdf,
                    'mime' => 'application/pdf',
                ]],
            ))->locale($locale));
        } finally {
            App::setLocale($previous);
        }

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

        $this->analytics->capture(ProductAnalytics::QUOTE_SENT, [
            'quote_id' => $quote->id,
            'deal_id' => $quote->deal_id,
            'amount_cents' => $quote->total_cents,
        ], $actor, $quote->workspace);

        return $quote->fresh() ?? $quote;
    }
}
