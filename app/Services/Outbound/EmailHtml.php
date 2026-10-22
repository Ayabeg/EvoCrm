<?php

namespace App\Services\Outbound;

use App\Models\OutboundMessage;

/**
 * Builds the HTML part of an outbound email: the operator's HTML (or an
 * nl2br'd twin of the text body), click-tracked links, an unsubscribe
 * footer on the CRM hostname, and the 1px open beacon.
 *
 * Preview mode skips the pixel and link rewriting so template previews
 * never record tracking events.
 */
class EmailHtml
{
    public function __construct(private EmailHtmlSanitizer $sanitizer) {}

    public function build(OutboundMessage $message, bool $preview = false): string
    {
        $html = filled($message->body_html)
            ? (string) $message->body_html
            : nl2br(e((string) $message->body));
        $html = $this->sanitizer->clean($html);

        if (! $preview) {
            $html = $this->rewriteLinks($message, $html);
        }

        $unsubscribe = $this->unsubscribeUrl($message);

        if ($unsubscribe && ! str_contains($html, $unsubscribe)) {
            $host = parse_url((string) config('app.url'), PHP_URL_HOST) ?: 'crm.evotechly.com';
            $html .= '<p style="margin-top:24px;font-size:12px;color:#8a8a8a;">'
                .'<a href="'.$unsubscribe.'" style="color:#8a8a8a;">Unsubscribe</a>'
                .' — Evotechly outbound, sent from '.$host
                .'</p>';
        }

        if (! $preview && $message->track_token) {
            $pixel = route('outbound.track.open', $message->track_token);
            $html .= '<img src="'.$pixel.'" width="1" height="1" alt="" style="display:none" />';
        }

        return $html;
    }

    /**
     * Unsubscribe URL for the message's contact, on the CRM host. Null when
     * the message has no contact/email (e.g. raw test sends still get one
     * via the dispatcher's contact, so this is almost always set).
     */
    public function unsubscribeUrl(OutboundMessage $message): ?string
    {
        $contact = $message->contact;
        $workspace = $message->workspace;

        if (! $contact || ! $workspace || ! $contact->email) {
            return null;
        }

        return app(TemplateRenderer::class)->unsubscribeUrl($workspace, $contact);
    }

    /**
     * Route every http(s) link through the click tracker — except the
     * unsubscribe URL, which stays one click away on purpose.
     */
    protected function rewriteLinks(OutboundMessage $message, string $html): string
    {
        if (! $message->track_token) {
            return $html;
        }

        $unsubscribe = $this->unsubscribeUrl($message);

        return (string) preg_replace_callback(
            '/href="(https?:\/\/[^"]+)"/i',
            function (array $m) use ($message, $unsubscribe) {
                $url = $m[1];

                if ($unsubscribe && str_starts_with($url, $unsubscribe)) {
                    return $m[0];
                }

                $tracked = route('outbound.track.click', $message->track_token)
                    .'?u='.rtrim(strtr(base64_encode($url), '+/', '-_'), '=');

                return 'href="'.$tracked.'"';
            },
            $html,
        );
    }
}
