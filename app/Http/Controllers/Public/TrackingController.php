<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\OutboundMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;

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
            DB::table('outbound_messages')
                ->where('id', $message->id)
                ->update([
                    'opened_at' => DB::raw('COALESCE(opened_at, CURRENT_TIMESTAMP)'),
                    'open_count' => DB::raw('COALESCE(open_count, 0) + 1'),
                ]);
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
        $signature = (string) $request->query('s');

        abort_unless($message, 404);
        abort_unless(preg_match('#^https?://#i', $url) === 1, 400);
        abort_unless(hash_equals(self::destinationSignature($token, $url), $signature), 403);

        DB::table('outbound_messages')
            ->where('id', $message->id)
            ->update([
                'clicked_at' => DB::raw('COALESCE(clicked_at, CURRENT_TIMESTAMP)'),
                'click_count' => DB::raw('COALESCE(click_count, 0) + 1'),
            ]);

        return redirect()->away($url);
    }

    public static function destinationSignature(string $token, string $url): string
    {
        return hash_hmac('sha256', $token.'|'.$url, (string) config('app.key'));
    }
}
