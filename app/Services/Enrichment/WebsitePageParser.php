<?php

namespace App\Services\Enrichment;

use App\Support\AlgerianPhone;

final class WebsitePageParser
{
    /**
     * Pull title, description, and published emails/phones from HTML.
     * Never invent an email: only values that already appear on the page.
     *
     * @return array{
     *     title: ?string,
     *     description: ?string,
     *     emails: list<string>,
     *     phones: list<string>,
     *     crm_detection: array{status: string, name?: string, names?: list<string>, evidence: list<string>, method: string}
     * }
     */
    public function parse(string $html): array
    {
        $stripped = preg_replace('#<(script|style|noscript)\b[^>]*>.*?</\1>#is', ' ', $html) ?? $html;
        $text = html_entity_decode(strip_tags($stripped), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return [
            'title' => $this->title($html),
            'description' => $this->description($html),
            'emails' => $this->emails($stripped, $text),
            'phones' => $this->phones($stripped, $text),
            'crm_detection' => $this->crmDetection($html),
        ];
    }

    /**
     * Detect only public, stable technology signatures. No signature is not
     * proof that a business does not use a CRM.
     *
     * @return array{status: string, name?: string, names?: list<string>, evidence: list<string>, method: string}
     */
    private function crmDetection(string $html): array
    {
        $haystack = strtolower($html);
        $signatures = [
            'HubSpot' => ['hbspt.', 'js.hs-scripts.com', 'js.hsforms.net', 'hubspotutk'],
            'Salesforce' => ['pardot.com', 'salesforce.com/embeddedservice', 'force.com/embeddedservice'],
            'Zoho CRM' => ['zoho.com/crm', 'zohopublic.com', 'zohoforms.com'],
            'Pipedrive' => ['pipedrive.com'],
            'GoHighLevel' => ['leadconnectorhq.com', 'msgsndr.com', 'gohighlevel.com'],
            'Freshsales' => ['freshsales.io'],
        ];
        $matches = [];
        $evidence = [];

        foreach ($signatures as $name => $needles) {
            foreach ($needles as $needle) {
                if (str_contains($haystack, $needle)) {
                    $matches[] = $name;
                    $evidence[] = $needle;
                    break;
                }
            }
        }

        $matches = array_values(array_unique($matches));

        if (count($matches) > 1) {
            return [
                'status' => 'conflicting',
                'names' => $matches,
                'evidence' => $evidence,
                'method' => 'website_signature',
            ];
        }

        if (count($matches) === 1) {
            return [
                'status' => 'detected',
                'name' => $matches[0],
                'evidence' => $evidence,
                'method' => 'website_signature',
            ];
        }

        return [
            'status' => 'not_detected',
            'evidence' => [],
            'method' => 'website_signature',
        ];
    }

    private function title(string $html): ?string
    {
        if (! preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $match)) {
            return null;
        }

        $title = trim(html_entity_decode(strip_tags($match[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));

        return $title !== '' ? $title : null;
    }

    private function description(string $html): ?string
    {
        $patterns = [
            '/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']/i',
            '/<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']/i',
            '/<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']/i',
            '/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:description["\']/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $match)) {
                $value = trim(html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));

                if ($value !== '') {
                    return $value;
                }
            }
        }

        return null;
    }

    /**
     * @return list<string>
     */
    private function emails(string $html, string $text): array
    {
        $found = [];

        if (preg_match_all('/mailto:([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})/i', $html, $matches)) {
            foreach ($matches[1] as $email) {
                $found[] = $email;
            }
        }

        if (preg_match_all('/\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b/i', $text, $matches)) {
            foreach ($matches[0] as $email) {
                $found[] = $email;
            }
        }

        $unique = [];

        foreach ($found as $email) {
            $email = strtolower(trim($email));

            if ($email === '' || ! $this->isPublishedEmail($email)) {
                continue;
            }

            $unique[$email] = $email;
        }

        return array_values($unique);
    }

    /**
     * @return list<string>
     */
    private function phones(string $html, string $text): array
    {
        $found = [];

        if (preg_match_all('/tel:([^"\'\s>]+)/i', $html, $matches)) {
            foreach ($matches[1] as $raw) {
                $found[] = urldecode($raw);
            }
        }

        if (preg_match_all('/(?:\+|00)?213[\s.\-]*\d(?:[\s.\-]*\d){7,8}|\b0[5-79]\d{8}\b/', $text, $matches)) {
            foreach ($matches[0] as $raw) {
                $found[] = $raw;
            }
        }

        $unique = [];

        foreach ($found as $raw) {
            $normalized = AlgerianPhone::normalize($raw);

            if ($normalized === null) {
                continue;
            }

            $unique[$normalized] = $normalized;
        }

        return array_values($unique);
    }

    private function isPublishedEmail(string $email): bool
    {
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $domain = substr((string) strrchr($email, '@'), 1);

        foreach (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'css', 'js'] as $ext) {
            if (str_ends_with($domain, '.'.$ext)) {
                return false;
            }
        }

        return ! in_array($domain, [
            'sentry.io',
            'wixpress.com',
            'schema.org',
            'w3.org',
            'example.com',
            'example.org',
            'localhost',
        ], true);
    }
}
