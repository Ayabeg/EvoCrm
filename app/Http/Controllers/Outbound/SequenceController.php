<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Models\OutboundTemplate;
use App\Models\SavedFilter;
use App\Models\Sequence;
use App\Models\SequenceStep;
use App\Services\Crm\CrmFilter;
use App\Services\Outbound\SequenceEnrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SequenceController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('outbound/sequences/index', [
            'sequences' => Sequence::query()
                ->forWorkspace($request->user()->workspace)
                ->with('steps')
                ->withCount([
                    'enrollments',
                    'enrollments as enrollments_active' => fn ($q) => $q->where('status', 'active'),
                    'enrollments as enrollments_paused' => fn ($q) => $q->where('status', 'paused'),
                    'enrollments as enrollments_finished' => fn ($q) => $q->where('status', 'finished'),
                ])
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'channel' => ['required', 'in:email,whatsapp_cloud,sms'],
            'description' => ['nullable', 'string'],
            'origin' => ['nullable', 'in:scratch,template'],
        ]);

        $sequence = Sequence::query()->create([
            'name' => $data['name'],
            'channel' => $data['channel'],
            'description' => $data['description'] ?? null,
            'workspace_id' => $request->user()->workspace_id,
            'active' => false,
        ]);

        $template = null;
        if (($data['origin'] ?? 'scratch') === 'template' && $data['channel'] === 'email') {
            $template = OutboundTemplate::query()
                ->forWorkspace($request->user()->workspace)
                ->orderBy('name')
                ->first();
        }

        $sequence->steps()->create([
            'position' => 1,
            'delay_hours' => 0,
            'channel' => $data['channel'],
            'step_type' => $data['channel'] === 'whatsapp_cloud' ? 'whatsapp_cloud' : ($data['channel'] === 'sms' ? 'sms' : 'email'),
            'subject' => $template?->subject ?? ($data['channel'] === 'email' ? 'Hello {{first_name}}' : null),
            'body' => $template?->body ?? match ($data['channel']) {
                'email' => 'Thanks for your interest, {{first_name}}.',
                'sms' => 'Salaam {{first_name}}, on vous contacte au sujet de votre demande. Répondez STOP pour vous désinscrire.',
                default => null,
            },
            'template_id' => $template?->id,
            'wa_template_name' => $data['channel'] === 'whatsapp_cloud' ? 'hello_world' : null,
            'wa_template_language' => $data['channel'] === 'whatsapp_cloud' ? 'fr' : null,
        ]);

        return back();
    }

    public function show(Request $request, Sequence $sequence): Response
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;

        $stepAnalytics = $sequence->steps()
            ->orderBy('position')
            ->get()
            ->map(function ($step) use ($sequence) {
                $enrolledAtStep = Enrollment::query()
                    ->where('sequence_id', $sequence->id)
                    ->where('next_step', '>=', $step->position)
                    ->count();

                $sent = OutboundMessage::query()
                    ->where('sequence_id', $sequence->id)
                    ->where('direction', 'out')
                    ->where('status', 'sent')
                    ->count();

                return [
                    'position' => $step->position,
                    'name' => $step->subject ?: 'Step '.$step->position,
                    'enrolled' => $enrolledAtStep,
                    'sent' => $sent,
                    'step_type' => $step->step_type ?? 'email',
                ];
            })
            ->values()
            ->all();

        $hours = $workspace->activeQuietHours() ?? $workspace->quietHours()->first();
        $boxes = Mailbox::query()->forWorkspace($workspace)->get();

        return Inertia::render('outbound/sequences/show', [
            'sequence' => $sequence->load(['steps.mailbox:id,name', 'enrollments.contact']),
            'stepAnalytics' => $stepAnalytics,
            'contacts' => Contact::query()
                ->forWorkspace($workspace)
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'email', 'phone_e164']),
            'templates' => OutboundTemplate::query()
                ->forWorkspace($workspace)
                ->orderBy('name')
                ->get(['id', 'name', 'subject', 'body']),
            'mailboxes' => Mailbox::query()
                ->forWorkspace($workspace)
                ->where('enabled', true)
                ->orderByDesc('is_default')
                ->get(['id', 'name', 'from_address']),
            'filters' => SavedFilter::query()
                ->forWorkspace($workspace)
                ->where('entity', 'contact')
                ->orderBy('name')
                ->get(['id', 'name']),
            'quietHours' => [
                'starts_at' => substr((string) ($hours?->starts_at ?? config('evosales.quiet_hours.starts_at')), 0, 5),
                'ends_at' => substr((string) ($hours?->ends_at ?? config('evosales.quiet_hours.ends_at')), 0, 5),
                'timezone' => $hours?->timezone ?? 'Africa/Algiers',
                'enabled' => (bool) ($hours?->enabled ?? true),
            ],
            'warmup' => [
                'warming' => $boxes->filter(fn ($box) => $box->warming())->count(),
                'total' => $boxes->count(),
            ],
        ]);
    }

    public function update(Request $request, Sequence $sequence): RedirectResponse
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
        ]);

        $sequence->forceFill($data)->save();

        return back();
    }

    public function toggle(Request $request, Sequence $sequence): RedirectResponse
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);

        $sequence->forceFill(['active' => ! $sequence->active])->save();

        return back();
    }

    public function addStep(Request $request, Sequence $sequence): RedirectResponse
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'delay_hours' => ['required', 'integer', 'min:0'],
            'step_type' => ['nullable', 'in:email,call,meeting,whatsapp_cloud,sms'],
            'channel' => ['required', 'in:email,whatsapp_cloud,sms'],
            'mailbox_id' => ['nullable', 'integer'],
            'subject' => ['nullable', 'string', 'max:180'],
            'subject_b' => ['nullable', 'string', 'max:180'],
            'body' => ['nullable', 'string'],
            'meeting_url' => ['nullable', 'url', 'max:500'],
            'on_reply_step' => ['nullable', 'integer', 'min:1'],
            'on_no_reply_step' => ['nullable', 'integer', 'min:1'],
            'variant_key' => ['nullable', 'string', 'max:10'],
            'template_id' => ['nullable', 'integer'],
            'wa_template_name' => ['nullable', 'string', 'max:120'],
            'wa_template_language' => ['nullable', 'string', 'max:12'],
        ]);

        // Picking a saved template prefills subject/body (still editable next time).
        $template = null;
        if (! empty($data['template_id'])) {
            $template = OutboundTemplate::query()
                ->forWorkspace($request->user()->workspace)
                ->find($data['template_id']);

            if ($template && blank($data['body'] ?? null)) {
                $data['subject'] = $data['subject'] ?: $template->subject;
                $data['body'] = $template->body;
            }
        }

        if (! empty($data['mailbox_id'])) {
            Mailbox::query()->forWorkspace($request->user()->workspace)->findOrFail($data['mailbox_id']);
        }

        $sequence->steps()->create([
            ...$data,
            'step_type' => $data['step_type'] ?? match ($data['channel']) {
                'whatsapp_cloud' => 'whatsapp_cloud',
                'sms' => 'sms',
                default => 'email',
            },
            'template_id' => $template?->id,
            'position' => ($sequence->steps()->max('position') ?? 0) + 1,
        ]);

        return back();
    }

    public function updateStep(Request $request, Sequence $sequence, SequenceStep $step): RedirectResponse
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless((int) $step->sequence_id === (int) $sequence->id, 404);

        $data = $request->validate([
            'delay_hours' => ['required', 'integer', 'min:0'],
            'step_type' => ['nullable', 'in:email,call,meeting,whatsapp_cloud,sms'],
            'channel' => ['required', 'in:email,whatsapp_cloud,sms'],
            'mailbox_id' => ['nullable', 'integer'],
            'subject' => ['nullable', 'string', 'max:180'],
            'subject_b' => ['nullable', 'string', 'max:180'],
            'body' => ['nullable', 'string'],
            'meeting_url' => ['nullable', 'url', 'max:500'],
            'wa_template_name' => ['nullable', 'string', 'max:120'],
            'wa_template_language' => ['nullable', 'string', 'max:12'],
        ]);

        if (! empty($data['mailbox_id'])) {
            Mailbox::query()->forWorkspace($request->user()->workspace)->findOrFail($data['mailbox_id']);
        }

        $step->forceFill($data)->save();

        return back();
    }

    public function removeStep(Request $request, Sequence $sequence, SequenceStep $step): RedirectResponse
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless((int) $step->sequence_id === (int) $sequence->id, 404);

        $step->delete();

        return back();
    }

    public function reorderSteps(Request $request, Sequence $sequence): RedirectResponse
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['required'],
        ]);

        $ids = collect($data['order'])->map(fn ($id) => (int) $id)->unique()->values();
        $owned = $sequence->steps()->whereIn('id', $ids)->pluck('id')->map(fn ($id) => (int) $id);

        abort_unless($owned->count() === $ids->count(), 404);

        foreach ($ids as $index => $id) {
            SequenceStep::query()
                ->where('sequence_id', $sequence->id)
                ->where('id', $id)
                ->update(['position' => $index + 1]);
        }

        return back();
    }

    public function enroll(Request $request, Sequence $sequence, SequenceEnrollment $enrollment, CrmFilter $crmFilter): RedirectResponse
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'contact_id' => ['nullable', 'integer'],
            'contact_ids' => ['nullable', 'array'],
            'contact_ids.*' => ['integer'],
            'saved_filter_id' => ['nullable', 'integer'],
        ]);

        $workspace = $request->user()->workspace;

        $ids = collect($data['contact_ids'] ?? [])
            ->when(! empty($data['contact_id']), fn ($c) => $c->push($data['contact_id']));

        // Enroll from a CRM list: the saved contact filter resolves to ids.
        if (! empty($data['saved_filter_id'])) {
            $filter = SavedFilter::query()
                ->forWorkspace($workspace)
                ->where('entity', 'contact')
                ->find($data['saved_filter_id']);

            if ($filter) {
                $query = Contact::query()->forWorkspace($workspace);
                $crmFilter->apply('contact', $query, $crmFilter->fromSaved($filter));
                $ids = $ids->merge($query->pluck('id'));
            }
        }

        $ids = $ids->unique()->values();

        if ($ids->isEmpty()) {
            return back()->withErrors(['contact_id' => 'Pick at least one contact.']);
        }

        // Single-contact enroll (the show-page form) keeps inline validation
        // errors; bulk enroll skips suppressed contacts and reports via toast.
        $single = $ids->count() === 1 && ! empty($data['contact_id']);

        $enrolled = 0;
        $skipped = 0;

        foreach ($ids as $contactId) {
            $contact = Contact::query()->forWorkspace($workspace)->find($contactId);

            if (! $contact) {
                continue;
            }

            try {
                $enrollment->enroll($workspace, $sequence, $contact);
                $enrolled++;
            } catch (ValidationException $e) {
                if ($single) {
                    throw $e;
                }

                $skipped++;
            }
        }

        Inertia::flash('toast', [
            'type' => $skipped > 0 ? 'error' : 'success',
            'message' => $skipped > 0
                ? "Enrolled {$enrolled}; skipped {$skipped} (suppressed or invalid)."
                : "Enrolled {$enrolled} contact(s).",
        ]);

        return back();
    }
}
