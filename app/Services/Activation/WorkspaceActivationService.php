<?php

namespace App\Services\Activation;

use App\Enums\ActivationStepId;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceActivationPreference;
use App\Support\Integrations;

/**
 * Authoritative workspace activation. React must not infer completion.
 *
 * @see docs/onboarding/P23-ACTIVATION-CONTRACT.md
 */
class WorkspaceActivationService
{
    /**
     * @param  array<string, mixed>|null  $integrationFacts  P22 `Integrations::forWorkspace` payload when already loaded.
     * @return array<string, mixed>
     */
    public function getState(User $user, ?Pipeline $pipeline = null, ?array $integrationFacts = null): array
    {
        $workspace = $user->workspace;

        if (! $workspace) {
            return $this->emptyState();
        }

        $pipeline ??= $workspace->defaultPipeline();
        $facts = $this->facts($workspace, $pipeline, $integrationFacts);
        $dismissed = $this->isDismissed($workspace, $user);
        $steps = $this->steps($user, $facts);
        $progress = $this->progress($steps);
        $activated = $progress['core_completed'] === $progress['core_total'];

        return [
            'activated' => $activated,
            'dismissed' => $dismissed,
            'visible' => ! $dismissed,
            'collapsed' => $activated,
            'progress' => $progress,
            'steps' => $steps,
            'dismiss_href' => '/dashboard/activation/dismiss',
        ];
    }

    public function dismiss(User $user): void
    {
        $workspace = $user->workspace;

        if (! $workspace) {
            return;
        }

        WorkspaceActivationPreference::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
            ],
            ['dismissed_at' => now()],
        );
    }

    /**
     * @param  array<string, mixed>|null  $integrationFacts
     * @return array{
     *     has_contact: bool,
     *     has_company: bool,
     *     has_crm_data: bool,
     *     has_deal: bool,
     *     has_activity: bool,
     *     pipeline_customized: bool,
     *     has_configured_integration: bool,
     *     workspace_named: bool
     * }
     */
    public function facts(Workspace $workspace, Pipeline $pipeline, ?array $integrationFacts = null): array
    {
        $hasContact = Contact::query()->forWorkspace($workspace)->exists();
        $hasCompany = Company::query()->forWorkspace($workspace)->exists();
        $integrations = $integrationFacts ?? Integrations::forWorkspace($workspace);
        $activation = is_array($integrations['activation'] ?? null) ? $integrations['activation'] : [];

        return [
            'has_contact' => $hasContact,
            'has_company' => $hasCompany,
            'has_crm_data' => $hasContact || $hasCompany,
            'has_deal' => Deal::query()->forWorkspace($workspace)->exists(),
            'has_activity' => Activity::query()->forWorkspace($workspace)->exists(),
            'pipeline_customized' => $this->pipelineIsCustomized($workspace, $pipeline),
            'has_configured_integration' => (bool) ($activation['has_configured_integration'] ?? false),
            'workspace_named' => filled($workspace->name),
        ];
    }

    /**
     * @param  array<string, mixed>  $facts
     * @return list<array<string, mixed>>
     */
    private function steps(User $user, array $facts): array
    {
        $canEdit = $user->canPermission('crm.edit');
        $canImport = $user->canPermission('crm.import');
        $canViewCrm = $user->canPermission('crm.view');
        $canManagePipelines = $user->role->canManageSettings();
        $canConnect = $user->canPermission('settings.integrations');

        return [
            $this->step(
                ActivationStepId::AddCrmData,
                $this->copy('Add CRM data'),
                $this->copy('Create or import a contact or company.'),
                (bool) $facts['has_crm_data'],
                $canViewCrm,
                $canEdit,
                $canEdit ? '/crm/contacts?create=1' : null,
                $canEdit ? $this->copy('Add contact') : null,
                $canImport ? '/crm/contacts/import' : null,
                $canImport ? $this->copy('Import') : null,
            ),
            $this->step(
                ActivationStepId::ConfigurePipeline,
                $this->copy('Configure pipeline'),
                $this->copy('Adapt stages from the default Sales pipeline.'),
                (bool) $facts['pipeline_customized'],
                (bool) $user->workspace_id,
                $canManagePipelines,
                $canManagePipelines ? '/settings/pipelines' : null,
                $canManagePipelines ? $this->copy('Open pipelines') : null,
            ),
            $this->step(
                ActivationStepId::FirstDeal,
                $this->copy('Create a deal'),
                $this->copy('Put the first opportunity on the pipeline.'),
                (bool) $facts['has_deal'],
                $canViewCrm,
                $canEdit,
                $canEdit ? '/crm/deals?create=1' : null,
                $canEdit ? $this->copy('Create deal') : null,
            ),
            $this->step(
                ActivationStepId::FirstActivity,
                $this->copy('Log an activity'),
                $this->copy('Record a task, call, or note.'),
                (bool) $facts['has_activity'],
                $canViewCrm,
                $canEdit,
                $canEdit ? '/crm/activities?create=1' : null,
                $canEdit ? $this->copy('Log activity') : null,
            ),
            $this->step(
                ActivationStepId::ConnectIntegration,
                $this->copy('Connect a channel'),
                $this->copy('Connect mailbox, WhatsApp, SMS, or Meta from Apps.'),
                (bool) $facts['has_configured_integration'],
                (bool) $user->workspace_id,
                $canConnect,
                $canConnect ? '/settings/apps' : null,
                $canConnect ? $this->copy('Open Apps') : null,
            ),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $steps
     * @return array{completed: int, total: int, core_completed: int, core_total: int}
     */
    private function progress(array $steps): array
    {
        $completed = 0;
        $coreCompleted = 0;
        $coreTotal = 0;

        foreach ($steps as $step) {
            if ($step['complete']) {
                $completed++;
            }

            if ($step['kind'] === 'core') {
                $coreTotal++;
                if ($step['complete']) {
                    $coreCompleted++;
                }
            }
        }

        return [
            'completed' => $completed,
            'total' => count($steps),
            'core_completed' => $coreCompleted,
            'core_total' => $coreTotal,
        ];
    }

    private function pipelineIsCustomized(Workspace $workspace, Pipeline $pipeline): bool
    {
        $pipelineCount = Pipeline::query()->forWorkspace($workspace)->count();

        if ($pipelineCount !== 1) {
            return true;
        }

        if ((string) $pipeline->name !== 'Sales') {
            return true;
        }

        $defaults = config('evosales.pipeline', []);

        if (! is_array($defaults)) {
            return true;
        }

        $defaults = array_values($defaults);
        $stages = Stage::query()
            ->where('workspace_id', $workspace->id)
            ->where('pipeline_id', $pipeline->id)
            ->orderBy('position')
            ->get(['name', 'slug', 'position', 'is_won', 'is_lost']);

        if ($stages->count() !== count($defaults)) {
            return true;
        }

        foreach ($stages as $index => $stage) {
            $default = $defaults[$index] ?? null;

            if (! is_array($default)) {
                return true;
            }

            if (
                (string) $stage->slug !== (string) ($default['slug'] ?? '')
                || (string) $stage->name !== (string) ($default['name'] ?? '')
                || (int) $stage->position !== (int) ($default['position'] ?? 0)
                || (bool) $stage->is_won !== (bool) ($default['is_won'] ?? false)
                || (bool) $stage->is_lost !== (bool) ($default['is_lost'] ?? false)
            ) {
                return true;
            }
        }

        return false;
    }

    private function isDismissed(Workspace $workspace, User $user): bool
    {
        return WorkspaceActivationPreference::query()
            ->where('workspace_id', $workspace->id)
            ->where('user_id', $user->id)
            ->whereNotNull('dismissed_at')
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    private function step(
        ActivationStepId $id,
        string $label,
        string $description,
        bool $complete,
        bool $canView,
        bool $canPerform,
        ?string $href,
        ?string $ctaLabel,
        ?string $secondaryHref = null,
        ?string $secondaryCtaLabel = null,
    ): array {
        return [
            'id' => $id->value,
            'label' => $label,
            'description' => $description,
            'kind' => $id->isCore() ? 'core' : 'optional',
            'complete' => $complete,
            'can_view' => $canView,
            'can_perform' => $canPerform,
            'href' => $canPerform ? $href : null,
            'cta_label' => $canPerform ? $ctaLabel : null,
            'secondary_href' => $secondaryHref,
            'secondary_cta_label' => $secondaryCtaLabel,
        ];
    }

    private function copy(string $key): string
    {
        return (string) __($key);
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyState(): array
    {
        return [
            'activated' => false,
            'dismissed' => false,
            'visible' => false,
            'collapsed' => false,
            'progress' => [
                'completed' => 0,
                'total' => 0,
                'core_completed' => 0,
                'core_total' => 0,
            ],
            'steps' => [],
            'dismiss_href' => '/dashboard/activation/dismiss',
        ];
    }
}
