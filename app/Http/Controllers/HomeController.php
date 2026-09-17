<?php

namespace App\Http\Controllers;

use App\Services\Home\HomeDashboardBuilder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Home — operating composition: attention → work → performance → context.
 */
class HomeController extends Controller
{
    public function __invoke(Request $request, HomeDashboardBuilder $builder): Response
    {
        return Inertia::render('home', $builder->build($request->user()));
    }
}
