<?php

namespace App\Http\Controllers;

use App\Services\Home\HomeDashboardBuilder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Home — command center: context → KPIs → attention → pipeline → performance.
 */
class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $ownerId = $request->integer('owner_id') ?: null;

        [$from, $to] = HomeDashboardBuilder::parseWindow(
            $request->string('from')->toString() ?: null,
            $request->string('to')->toString() ?: null,
        );

        $builder = new HomeDashboardBuilder($ownerId);
        $dashboard = $builder->build($workspace, $from, $to);

        return Inertia::render('home', [
            ...$dashboard,
            'owners' => $workspace->users()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'owner_id' => $ownerId,
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'dataAsOf' => now('Africa/Algiers')->format('Y-m-d H:i'),
        ]);
    }
}
