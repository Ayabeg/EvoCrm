<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Support\QuickRecordPeek;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuickRecordController extends Controller
{
    public function peek(Request $request, string $type, int $id, QuickRecordPeek $peek): JsonResponse
    {
        return response()->json($peek->present($request->user(), $type, $id));
    }
}
