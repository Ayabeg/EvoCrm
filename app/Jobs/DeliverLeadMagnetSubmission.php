<?php

namespace App\Jobs;

use App\Mail\LeadLeakageResultMail;
use App\Models\LeadMagnetSubmission;
use App\Services\Crm\WorkflowExecutionRedactor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Throwable;

class DeliverLeadMagnetSubmission implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [60, 300];

    public int $uniqueFor = 3600;

    public function __construct(public int $submissionId)
    {
        $this->afterCommit();
    }

    public function uniqueId(): string
    {
        return self::class.':'.$this->submissionId;
    }

    public function handle(): void
    {
        $submission = LeadMagnetSubmission::query()
            ->with(['offer.workspace'])
            ->find($this->submissionId);

        if (! $submission || ! filled($submission->email) || $submission->accepted_at) {
            return;
        }

        $submission->forceFill([
            'delivery_status' => 'sending',
            'delivery_error' => null,
        ])->save();

        try {
            Mail::to($submission->email)->send(new LeadLeakageResultMail(
                recipientName: filled($submission->name) ? (string) $submission->name : (string) $submission->email,
                workspaceName: (string) ($submission->offer?->workspace?->name ?? config('evosales.company', 'Evotechly')),
                result: is_array($submission->result) ? $submission->result : [],
            ));
        } catch (Throwable $exception) {
            $submission->forceFill([
                'delivery_status' => 'queued',
                'delivery_error' => app(WorkflowExecutionRedactor::class)->redactError($exception->getMessage()),
            ])->save();

            throw $exception;
        }

        $submission->forceFill([
            'delivery_status' => 'accepted',
            'delivery_error' => null,
            'accepted_at' => now(),
        ])->save();
    }

    public function failed(Throwable $exception): void
    {
        LeadMagnetSubmission::query()
            ->whereKey($this->submissionId)
            ->update([
                'delivery_status' => 'failed',
                'delivery_error' => app(WorkflowExecutionRedactor::class)->redactError($exception->getMessage()),
                'updated_at' => now(),
            ]);
    }
}
