<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceProductPermissions
{
    public function handle(Request $request, Closure $next): Response
    {
        $permission = $this->permissionFor($request);

        if ($permission !== null) {
            abort_unless($request->user()?->canPermission($permission), 403);
        }

        return $next($request);
    }

    private function permissionFor(Request $request): ?string
    {
        $name = (string) $request->route()?->getName();

        if (in_array($name, ['crm.contacts.export', 'crm.deals.export'], true)) {
            return 'crm.export';
        }

        if (str_starts_with($name, 'auth.meta')) {
            return 'settings.integrations';
        }

        if ($request->isMethodSafe()) {
            return null;
        }

        if (str_contains($name, '.import')) {
            return 'crm.import';
        }

        if (str_contains($name, '.merge')) {
            return 'crm.merge';
        }

        if (str_contains($name, '.bulk')) {
            return 'crm.bulk';
        }

        if (str_starts_with($name, 'crm.workflows') || $name === 'automation') {
            return 'automation.manage';
        }

        if (str_starts_with($name, 'crm.report-builder') || str_starts_with($name, 'reports.dashboards')) {
            return 'reports.manage';
        }

        if ($name === 'crm.segments.sync-meta' || str_starts_with($name, 'ads.')) {
            return 'ads.manage';
        }

        if (str_starts_with($name, 'crm.record-layouts')) {
            return 'settings.attributes';
        }

        if (str_starts_with($name, 'crm.')) {
            return 'crm.edit';
        }

        if (str_starts_with($name, 'desk.')) {
            return 'desk.manage';
        }

        if (str_starts_with($name, 'outbound.')) {
            return 'outbound.manage';
        }

        if (str_starts_with($name, 'settings.people')) {
            return 'settings.people';
        }

        if (str_starts_with($name, 'settings.permissions')) {
            return 'settings.permissions';
        }

        if (str_starts_with($name, 'settings.pipelines')) {
            return 'settings.pipelines';
        }

        if (str_starts_with($name, 'settings.attributes')) {
            return 'settings.attributes';
        }

        if (str_starts_with($name, 'settings.')) {
            return 'settings.integrations';
        }

        return null;
    }
}
