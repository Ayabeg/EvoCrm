<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\OutboundMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;

class TrackingController extends Controller
{
    /**
     * 1px open beacon. Public by design (mail clients load it without a
     * session); the ULID token is the only capability.
     */
    public function open(string $token): HttpResponse
    {
        $message = OutboundMessage::query()
            ->where('track_token', $token)
            ->where('direction', 'out')
            ->first();

        if ($message) {
            $message->forceFill([
                'opened_at' => $message->opened_at ?? now(),
                'open_count' => $message->open_count + 1,
            ])->save();
        }

        // 1x1 transparent GIF.
        $gif = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

        return new HttpResponse($gif, 200, [
            'Content-Type' => 'image/gif',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => 'Sat, 01 Jan 2000 00:00:00 GMT',
        ]);
    }

    /**
     * Click tracker: records the click, then redirects to the real URL. The
     * target rides base64url-encoded in `u`; only http(s) targets redirect.
     */
    public function click(string $token, Request $request): RedirectResponse
    {
        $message = OutboundMessage::query()
            ->where('track_token', $token)
            ->where('direction', 'out')
            ->first();

        $decoded = base64_decode(strtr((string) $request->query('u'), '-_', '+/'), true);
        $url = is_string($decoded) ? $decoded : '';

        abort_unless($message, 404);
        abort_unless(preg_match('#^https?://#i', $url) === 1, 400);

        $message->forceFill([
            'clicked_at' => $message->clicked_at ?? now(),
            'click_count' => $message->click_count + 1,
        ])->save();

        return redirect()->away($url);
    }
}
