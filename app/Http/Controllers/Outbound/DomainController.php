<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\OutboundDomain;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sending domains. EvoSales stores the SPF/DKIM/DMARC records the operator
 * must publish at their DNS provider and tracks a manual verified state —
 * no DNS lookups, no DNS API.
 */
class DomainController extends Controller
{
    public function index(Request $request): Response
    {
        $domains = OutboundDomain::query()
            ->forWorkspace($request->user()->workspace)
            ->orderBy('domain')
            ->get()
            ->map(fn (OutboundDomain $domain) => [
                ...$domain->toArray(),
                'checklist' => $domain->checklist(),
            ]);

        return Inertia::render('outbound/domains/index', [
            'domains' => $domains,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $workspace = $request->user()->workspace;

        $data = $request->validate([
            'domain' => [
                'required',
                'string',
                'max:190',
                'regex:/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i',
                Rule::unique('outbound_domains', 'domain')->where('workspace_id', $workspace->id),
            ],
            'spf_record' => ['nullable', 'string', 'max:500'],
            'dkim_selector' => ['nullable', 'string', 'max:60'],
            'dkim_record' => ['nullable', 'string', 'max:1000'],
            'dmarc_record' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $domain = strtolower(trim($data['domain']));

        OutboundDomain::query()->create([
            'workspace_id' => $workspace->id,
            'domain' => $domain,
            'status' => OutboundDomain::STATUS_UNVERIFIED,
            'spf_record' => $data['spf_record'] ?? null,
            'dkim_selector' => $data['dkim_selector'] ?? null,
            'dkim_record' => $data['dkim_record'] ?? null,
            'dmarc_record' => $data['dmarc_record'] ?? OutboundDomain::defaultDmarc($domain),
            'notes' => $data['notes'] ?? null,
        ]);

        return back();
    }

    public function update(Request $request, OutboundDomain $domain): RedirectResponse
    {
        abort_unless((int) $domain->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'spf_record' => ['nullable', 'string', 'max:500'],
            'dkim_selector' => ['nullable', 'string', 'max:60'],
            'dkim_record' => ['nullable', 'string', 'max:1000'],
            'dmarc_record' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $domain->forceFill($data)->save();

        return back();
    }

    /**
     * Manual verification mark. The operator confirms they published the
     * records; EvoSales does not probe DNS.
     */
    public function toggleVerified(Request $request, OutboundDomain $domain): RedirectResponse
    {
        abort_unless((int) $domain->workspace_id === (int) $request->user()->workspace_id, 404);

        $verified = ! $domain->verified();

        $domain->forceFill([
            'status' => $verified ? OutboundDomain::STATUS_VERIFIED : OutboundDomain::STATUS_UNVERIFIED,
            'verified_at' => $verified ? now() : null,
        ])->save();

        return back();
    }

    public function destroy(Request $request, OutboundDomain $domain): RedirectResponse
    {
        abort_unless((int) $domain->workspace_id === (int) $request->user()->workspace_id, 404);

        $domain->delete();

        return back();
    }
}
