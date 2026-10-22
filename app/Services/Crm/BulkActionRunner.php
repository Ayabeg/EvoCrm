<?php

namespace App\Services\Crm;

use App\Jobs\ProcessBulkAction;
use App\Models\BulkActionRow;
use App\Models\BulkActionRun;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Sequence;
use App\Models\Stage;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Outbound\SequenceEnrollment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class BulkActionRunner
{
    public const MAX_IDS = 1000;

    public const ACTIONS = ['assign_owner', 'enroll_sequence', 'move_stage', 'delete'];

    public function __construct(private SequenceEnrollment $enrollment) {}

    /**
     * @param  list<int>  $ids
     * @param  array<string, mixed>  $payload
     */
    public function queue(Workspace $workspace, User $actor, string $entity, string $action, array $ids, array $payload): BulkActionRun
    {
        if (! in_array($action, self::ACTIONS, true)) {
            throw ValidationException::withMessages([
                'action' => 'That bulk action is not supported.',
            ]);
        }

        if ($entity === 'contact' && $action === 'move_stage') {
            throw ValidationException::withMessages([
                'action' => 'Contacts cannot be moved between deal stages.',
            ]);
        }

        if ($entity === 'deal' && $action === 'enroll_sequence') {
            throw ValidationException::withMessages([
                'action' => 'Deals cannot be enrolled in sequences.',
            ]);
        }

        $ids = array_values(array_unique(array_map('intval', $ids)));
        if ($ids === []) {
            throw ValidationException::withMessages([
                'ids' => 'Select at least one record.',
            ]);
        }

        if (count($ids) > self::MAX_IDS) {
            throw ValidationException::withMessages([
                'ids' => 'Select no more than '.self::MAX_IDS.' records at a time.',
            ]);
        }

        $this->assertPayload($workspace, $action, $payload);

        $run = BulkActionRun::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $actor->id,
            'entity' => $entity,
            'action' => $action,
            'status' => BulkActionRun::STATUS_QUEUED,
            'total' => count($ids),
            'payload' => [...$payload, 'ids' => $ids],
        ]);

        ProcessBulkAction::dispatch($run->id);

        return $run->fresh() ?? $run;
    }

    public function process(BulkActionRun $run): void
    {
        $run->forceFill(['status' => BulkActionRun::STATUS_PROCESSING])->save();

        try {
            $ids = $run->payload['ids'] ?? [];
            foreach (array_chunk($ids, 100) as $chunk) {
                foreach ($chunk as $id) {
                    $this->processOne($run, (int) $id);
                }
            }

            $run->refresh();
            $run->forceFill([
                'status' => BulkActionRun::STATUS_COMPLETED,
                'processed' => $run->total,
            ])->save();
        } catch (Throwable $exception) {
            $run->forceFill([
                'status' => BulkActionRun::STATUS_FAILED,
                'error_summary' => mb_substr($exception->getMessage(), 0, 500),
            ])->save();

            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function assertPayload(Workspace $workspace, string $action, array $payload): void
    {
        if ($action === 'assign_owner') {
            $owner = User::query()
                ->where('workspace_id', $workspace->id)
                ->find($payload['owner_id'] ?? null);

            if (! $owner) {
                throw ValidationException::withMessages([
                    'owner_id' => 'Owner must belong to this workspace.',
                ]);
            }
        }

        if ($action === 'enroll_sequence') {
            $sequence = Sequence::query()
                ->forWorkspace($workspace)
                ->find($payload['sequence_id'] ?? null);

            if (! $sequence) {
                throw ValidationException::withMessages([
                    'sequence_id' => 'Sequence must belong to this workspace.',
                ]);
            }
        }

        if ($action === 'move_stage') {
            $stage = Stage::query()
                ->forWorkspace($workspace)
                ->find($payload['stage_id'] ?? null);

            if (! $stage) {
                throw ValidationException::withMessages([
                    'stage_id' => 'Stage must belong to this workspace.',
                ]);
            }
        }
    }

    private function processOne(BulkActionRun $run, int $id): void
    {
        try {
            DB::transaction(function () use ($run, $id): void {
                match ($run->action) {
                    'assign_owner' => $this->assignOwner($run, $id),
                    'enroll_sequence' => $this->enroll($run, $id),
                    'move_stage' => $this->moveStage($run, $id),
                    'delete' => $this->delete($run, $id),
                    default => throw new \InvalidArgumentException('Unsupported action.'),
                };
            });

            BulkActionRow::query()->create([
                'bulk_action_run_id' => $run->id,
                'record_id' => $id,
                'status' => BulkActionRow::STATUS_SUCCESS,
            ]);
            $run->increment('succeeded');
            $run->increment('processed');
        } catch (Throwable $exception) {
            $message = $exception instanceof ValidationException
                ? (string) collect($exception->errors())->flatten()->first()
                : $exception->getMessage();

            BulkActionRow::query()->create([
                'bulk_action_run_id' => $run->id,
                'record_id' => $id,
                'status' => BulkActionRow::STATUS_FAILED,
                'error_message' => mb_substr($message !== '' ? $message : $exception->getMessage(), 0, 500),
            ]);
            $run->increment('failed');
            $run->increment('processed');
        }
    }

    private function assignOwner(BulkActionRun $run, int $id): void
    {
        $record = $this->findRecord($run, $id);
        $record->forceFill(['owner_id' => $run->payload['owner_id'] ?? null])->save();
    }

    private function enroll(BulkActionRun $run, int $id): void
    {
        $contact = $this->findContact($run->workspace, $id);
        $sequence = Sequence::query()
            ->forWorkspace($run->workspace)
            ->findOrFail($run->payload['sequence_id'] ?? null);

        $this->enrollment->enroll($run->workspace, $sequence, $contact);
    }

    private function moveStage(BulkActionRun $run, int $id): void
    {
        $deal = $this->findDeal($run->workspace, $id);
        $stage = Stage::query()
            ->forWorkspace($run->workspace)
            ->findOrFail($run->payload['stage_id'] ?? null);

        $deal->loadMissing('stage');
        $deal->moveTo($stage, $run->user);
    }

    private function delete(BulkActionRun $run, int $id): void
    {
        $this->findRecord($run, $id)->delete();
    }

    private function findRecord(BulkActionRun $run, int $id): Contact|Deal
    {
        return $run->entity === 'deal'
            ? $this->findDeal($run->workspace, $id)
            : $this->findContact($run->workspace, $id);
    }

    private function findContact(Workspace $workspace, int $id): Contact
    {
        $contact = Contact::query()->forWorkspace($workspace)->find($id);
        if (! $contact) {
            throw new \RuntimeException('Contact is outside this workspace.');
        }

        return $contact;
    }

    private function findDeal(Workspace $workspace, int $id): Deal
    {
        $deal = Deal::query()->forWorkspace($workspace)->find($id);
        if (! $deal) {
            throw new \RuntimeException('Deal is outside this workspace.');
        }

        return $deal;
    }
}
