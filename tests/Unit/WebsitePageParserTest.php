<?php

use App\Services\Enrichment\WebsitePageParser;

it('extracts only emails and phones already published on the page', function () {
    $parsed = (new WebsitePageParser)->parse(<<<'HTML'
        <html>
            <head>
                <title>Clinique Atlas</title>
                <meta name="description" content="Soins à Alger">
                <script>const ignore = "noreply@wixpress.com";</script>
            </head>
            <body>
                Ecrivez-nous <a href="mailto:hello@clinique-atlas.dz">ici</a>
                ou appelez +213 21 00 00 00
            </body>
        </html>
    HTML);

    expect($parsed['title'])->toBe('Clinique Atlas')
        ->and($parsed['description'])->toBe('Soins à Alger')
        ->and($parsed['emails'])->toBe(['hello@clinique-atlas.dz'])
        ->and($parsed['phones'])->toBe(['+21321000000']);
});

it('does not invent an email when the page has none', function () {
    $parsed = (new WebsitePageParser)->parse(<<<'HTML'
        <html>
            <head><title>Clinique Atlas</title></head>
            <body>Appelez la clinique à Alger. Aucun email ici.</body>
        </html>
    HTML);

    expect($parsed['emails'])->toBe([]);
});
