<?php

namespace App\Services\Crm;

use App\Models\LeadCapture;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Enrichment\WebsiteFetcher;
use App\Support\AlgerianPhone;
use App\Support\LeadCaptureNormalizer;
use Illuminate\Validation\ValidationException;

class PublicUrlCaptureIngestor
{
    public function __construct(
        private LeadCaptureDeduper $deduper,
        private WebsiteFetcher $fetcher,
    ) {}

    public function ingest(Workspace $workspace, User $actor, string $url): LeadCapture
    {
        $url = $this->assertPublicHttpUrl($url);

        try {
            $fetched = $this->fetcher->get($url);

            if (! $fetched['ok']) {
                return $this->errorCapture(
                    $workspace,
                    $actor,
                    $url,
                    $fetched['error'] ?? 'Public URL fetch failed.',
                );
            }

            $html = (string) ($fetched['body'] ?? '');
            $extracted = $this->extractVisible($html);

            return $this->deduper->record(
                $workspace->id,
                LeadCapture::SOURCE_URL,
                LeadCaptureNormalizer::normalize($extracted),
                [
                    'url' => $url,
                    'extracted' => $extracted,
                ],
                $actor->id,
            );
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            return $this->errorCapture($workspace, $actor, $url, $exception->getMessage());
        }
    }

    /**
     * @return array{name: ?string, phone: ?string, email: ?string, company: ?string, wilaya: ?string}
     */
    private function extractVisible(string $html): array
    {
        $document = new \DOMDocument;
        $internal = libxml_use_internal_errors(true);
        $document->loadHTML($html, LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET);
        libxml_clear_errors();
        libxml_use_internal_errors($internal);

        $xpath = new \DOMXPath($document);
        $title = $this->metaContent($xpath, '//meta[@property="og:title"]/@content')
            ?: $this->nodeText($xpath, '//title');
        $company = $this->metaContent($xpath, '//meta[@property="og:site_name"]/@content');

        foreach (['script', 'style', 'noscript'] as $tag) {
            foreach ($document->getElementsByTagName($tag) as $node) {
                $node->parentNode?->removeChild($node);
            }
        }

        $visible = trim(preg_replace('/\s+/', ' ', $document->textContent ?? '') ?? '');

        return [
            'name' => $title !== '' ? $title : null,
            'company' => $company !== '' ? $company : null,
            'email' => $this->firstEmail($visible),
            'phone' => $this->firstPhone($visible),
            'wilaya' => null,
        ];
    }

    private function firstEmail(string $text): ?string
    {
        if (preg_match('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', $text, $matches) !== 1) {
            return null;
        }

        return strtolower($matches[0]);
    }

    private function firstPhone(string $text): ?string
    {
        if (preg_match('/(?:\+?213|0)[\s().-]*[5-7](?:[\s().-]*\d){8}/', $text, $matches) !== 1) {
            return null;
        }

        return AlgerianPhone::normalize($matches[0]);
    }

    private function metaContent(\DOMXPath $xpath, string $query): string
    {
        $node = $xpath->query($query)?->item(0);

        return trim((string) ($node?->nodeValue ?? ''));
    }

    private function nodeText(\DOMXPath $xpath, string $query): string
    {
        $node = $xpath->query($query)?->item(0);

        return trim((string) ($node?->textContent ?? ''));
    }

    private function assertPublicHttpUrl(string $url): string
    {
        $url = trim($url);
        $parts = parse_url($url);

        if (! is_array($parts) || ! in_array($parts['scheme'] ?? null, ['http', 'https'], true) || empty($parts['host'])) {
            throw ValidationException::withMessages([
                'url' => 'Paste a public http or https URL.',
            ]);
        }

        $host = strtolower((string) $parts['host']);

        if (in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0'], true)) {
            throw ValidationException::withMessages([
                'url' => 'That URL is not a public page.',
            ]);
        }

        $ip = filter_var($host, FILTER_VALIDATE_IP) ? $host : gethostbyname($host);

        if (filter_var($ip, FILTER_VALIDATE_IP) && ! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            throw ValidationException::withMessages([
                'url' => 'That URL is not a public page.',
            ]);
        }

        return $url;
    }

    private function errorCapture(Workspace $workspace, User $actor, string $url, string $message): LeadCapture
    {
        $capture = $this->deduper->record(
            $workspace->id,
            LeadCapture::SOURCE_URL,
            LeadCaptureNormalizer::normalize(['name' => $url]),
            ['url' => $url],
            $actor->id,
            LeadCapture::STATUS_ERROR,
        );

        $capture->forceFill([
            'error' => mb_substr($message, 0, 500),
        ])->save();

        return $capture;
    }
}
