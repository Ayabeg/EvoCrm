<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesApiWorkspace;
use App\Http\Controllers\Api\V1\Support\ApiPayload;
use App\Http\Controllers\Controller;
use App\Models\Quote;
use App\Services\Crm\QuoteMailer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    use AuthorizesApiWorkspace;

    public function show(Request $request, Quote $quote): JsonResponse
    {
        $this->ensureInWorkspace($quote, $this->workspace($request));

        return response()->json([
            'data' => ApiPayload::quote($quote),
        ]);
    }

    public function send(Request $request, Quote $quote, QuoteMailer $mailer): JsonResponse
    {
        $this->ensureInWorkspace($quote, $this->workspace($request));
        $this->authorize('update', $quote);

        $data = $request->validate([
            'to' => ['nullable', 'email'],
        ]);

        $quote->loadMissing(['deal.contact']);
        $to = $data['to'] ?? $quote->deal?->contact?->email;
        abort_unless(filled($to), 422, 'A recipient email is required.');

        $quote = $mailer->send($quote, $request->user(), (string) $to);

        return response()->json([
            'data' => ApiPayload::quote($quote),
        ]);
    }
}
