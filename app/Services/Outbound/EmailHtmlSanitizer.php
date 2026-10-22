<?php

namespace App\Services\Outbound;

use DOMDocument;
use DOMElement;
use DOMNode;

final class EmailHtmlSanitizer
{
    /** @var list<string> */
    private const ALLOWED_TAGS = [
        'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 'small', 'span', 'strong', 'table', 'tbody',
        'td', 'th', 'thead', 'tr', 'u', 'ul',
    ];

    /** @var list<string> */
    private const REMOVE_TAGS = ['embed', 'form', 'iframe', 'input', 'link', 'meta', 'object', 'script', 'style'];

    /**
     * Keep email-oriented markup while removing executable elements, event
     * handlers, unsafe URLs, and CSS that can load or execute content.
     */
    public function clean(string $html): string
    {
        $document = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);

        try {
            $loaded = $document->loadHTML(
                '<!doctype html><html><body><div id="email-html-root">'.$html.'</div></body></html>',
                LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET,
            );

            if (! $loaded) {
                return nl2br(e(strip_tags($html)));
            }

            $root = $document->getElementById('email-html-root');

            if (! $root instanceof DOMElement) {
                return nl2br(e(strip_tags($html)));
            }

            $this->sanitizeChildren($root);

            $clean = '';
            foreach ($root->childNodes as $child) {
                $clean .= $document->saveHTML($child);
            }

            return $clean;
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }

    private function sanitizeChildren(DOMNode $parent): void
    {
        for ($child = $parent->firstChild; $child;) {
            $next = $child->nextSibling;

            if ($child instanceof DOMElement) {
                $tag = strtolower($child->tagName);

                if (in_array($tag, self::REMOVE_TAGS, true)) {
                    $parent->removeChild($child);
                    $child = $next;

                    continue;
                }

                if (! in_array($tag, self::ALLOWED_TAGS, true)) {
                    while ($child->firstChild) {
                        $parent->insertBefore($child->firstChild, $child);
                    }
                    $parent->removeChild($child);
                    $child = $next;

                    continue;
                }

                $this->sanitizeAttributes($child, $tag);
                $this->sanitizeChildren($child);
            }

            $child = $next;
        }
    }

    private function sanitizeAttributes(DOMElement $element, string $tag): void
    {
        $allowed = ['style', 'title'];

        if ($tag === 'a') {
            $allowed = ['href', 'rel', 'target', ...$allowed];
        } elseif ($tag === 'img') {
            $allowed = ['alt', 'height', 'src', 'width', ...$allowed];
        } elseif (in_array($tag, ['td', 'th'], true)) {
            $allowed = ['colspan', 'rowspan', 'align', ...$allowed];
        } elseif ($tag === 'table') {
            $allowed = ['align', 'border', 'cellpadding', 'cellspacing', 'width', ...$allowed];
        }

        for ($index = $element->attributes->length - 1; $index >= 0; $index--) {
            $attribute = $element->attributes->item($index);
            $name = strtolower((string) $attribute?->name);
            $value = (string) $attribute?->value;

            if ($attribute === null || str_starts_with($name, 'on') || ! in_array($name, $allowed, true)) {
                if ($attribute !== null) {
                    $element->removeAttributeNode($attribute);
                }

                continue;
            }

            if ($name === 'style' && preg_match('/expression|javascript:|url\s*\(|behavior|binding/i', $value)) {
                $element->removeAttributeNode($attribute);

                continue;
            }

            if (in_array($name, ['href', 'src'], true) && ! $this->safeUrl($value, $name === 'src')) {
                $element->removeAttributeNode($attribute);
            }
        }
    }

    private function safeUrl(string $value, bool $image): bool
    {
        $scheme = strtolower((string) parse_url(trim($value), PHP_URL_SCHEME));

        return $image
            ? in_array($scheme, ['http', 'https'], true)
            : in_array($scheme, ['http', 'https', 'mailto'], true);
    }
}
