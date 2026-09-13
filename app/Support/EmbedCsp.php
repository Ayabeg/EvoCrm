<?php

namespace App\Support;

use App\Models\Workspace;
use Illuminate\Http\Request;

/**
 * CSP / framing policy Laravel can set. frame-ancestors lists the CRM hosts
 * that may embed this app. frame-src lists desk hosts the /inbox iframe may
 * load. The desk vhost itself must send the same ancestors — see
 * docs/desk-iframe-headers.md. Laravel cannot set headers on desk.evotechly.com.
 */
final class EmbedCsp
{
    /**
     * @return list<string>
     */
    public static function defaultAncestors(): array
    {
        return [
            "'self'",
            'https://evocrmapp.com',
            'https://www.evocrmapp.com',
            'https://crm.evotechly.com',
        ];
    }

    /**
     * @return list<string>
     */
    public static function defaultFrameSources(): array
    {
        return [
            "'self'",
            'https://desk.evotechly.com',
        ];
    }

    public static function header(Request $request): string
    {
        $ancestors = self::unique(array_merge(
            self::defaultAncestors(),
            self::configuredList('evosales.embed.frame_ancestors'),
            self::origins([(string) config('app.url')]),
        ));

        $sources = self::unique(array_merge(
            self::defaultFrameSources(),
            self::configuredList('evosales.embed.frame_src'),
            self::origins([
                (string) config('evosales.inbox_url'),
                (string) config('evosales.mail_stack.roundcube_url'),
            ]),
            self::workspaceInboxOrigins($request->user()?->workspace),
        ));

        return 'frame-ancestors '.implode(' ', $ancestors).'; frame-src '.implode(' ', $sources);
    }

    /**
     * @return list<string>
     */
    private static function configuredList(string $key): array
    {
        $value = config($key, []);

        if (is_string($value)) {
            return array_values(array_filter(array_map('trim', explode(',', $value))));
        }

        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (mixed $item): string => trim((string) $item),
            $value,
        )));
    }

    /**
     * @param  list<string>  $urls
     * @return list<string>
     */
    private static function origins(array $urls): array
    {
        $origins = [];

        foreach ($urls as $url) {
            if ($url === '') {
                continue;
            }

            $scheme = parse_url($url, PHP_URL_SCHEME);
            $host = parse_url($url, PHP_URL_HOST);

            if (! is_string($scheme) || $scheme === '' || ! is_string($host) || $host === '') {
                continue;
            }

            $origins[] = $scheme.'://'.$host;
        }

        return $origins;
    }

    /**
     * @return list<string>
     */
    private static function workspaceInboxOrigins(?Workspace $workspace): array
    {
        if (! $workspace instanceof Workspace) {
            return [];
        }

        return self::origins(array_filter([
            $workspace->inbox_url,
            $workspace->inboxEmbedUrl(),
        ]));
    }

    /**
     * @param  list<string>  $tokens
     * @return list<string>
     */
    private static function unique(array $tokens): array
    {
        $seen = [];
        $out = [];

        foreach ($tokens as $token) {
            if ($token === '' || isset($seen[$token])) {
                continue;
            }

            $seen[$token] = true;
            $out[] = $token;
        }

        return $out;
    }
}
