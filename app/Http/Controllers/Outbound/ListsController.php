<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\OutboundCampaign;
use App\Models\SavedFilter;
use App\Services\Crm\CrmFilter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ListsController extends Controller
{
    public function index(Request $request, CrmFilter $filter): Response
    {
        $workspace = $request->user()->workspace;
        $campaignsByFilter = OutboundCampaign::query()->forWorkspace($workspace)->whereNotNull('saved_filter_id')
            ->get(['id', 'name', 'status', 'saved_filter_id'])->groupBy('saved_filter_id');
        $lists = SavedFilter::query()->forWorkspace($workspace)->where('entity', 'contact')->orderBy('name')->get()
            ->map(fn (SavedFilter $saved) => [
                'id' => $saved->id,
                'name' => $saved->name,
                'count' => $filter->count($workspace, $saved->entity, $filter->fromSaved($saved)),
                'campaigns' => ($campaignsByFilter[$saved->id] ?? collect())
                    ->map(fn (OutboundCampaign $c) => ['id' => $c->id, 'name' => $c->name, 'status' => $c->status])->values()->all(),
            ]);
        return Inertia::render('outbound/lists/index', ['lists' => $lists]);
    }
}
