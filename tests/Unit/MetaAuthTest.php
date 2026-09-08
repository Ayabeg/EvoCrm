<?php

use App\Support\MetaAuth;
use Tests\TestCase;

uses(TestCase::class);

it('builds a Facebook Login popup URL that does not point at the EvoSales app', function () {
    config()->set('meta.app_id', '3402914859867355');
    config()->set('meta.redirect_uri', null);
    config()->set('services.meta.redirect', null);

    $url = MetaAuth::authorizeUrl();

    expect($url)->toStartWith('https://www.facebook.com/')
        ->and($url)->toContain('dialog/oauth')
        ->and($url)->toContain('client_id=3402914859867355')
        ->and($url)->toContain('display=popup')
        ->and($url)->toContain('response_type=code')
        ->and($url)->not->toContain('/settings/apps');
});

it('keeps the OAuth callback on this host so the popup does not bounce to another app URL', function () {
    config()->set('meta.redirect_uri', null);
    config()->set('services.meta.redirect', null);

    expect(MetaAuth::redirectUri())
        ->toEndWith('/auth/meta/callback')
        ->and(MetaAuth::redirectUri())->not->toContain('crm.evotechly.com');
});

it('can start Facebook Login with only the Evotechly app id', function () {
    config()->set('meta.app_id', '3402914859867355');
    config()->set('meta.app_secret', null);

    expect(MetaAuth::canStartLogin())->toBeTrue()
        ->and(MetaAuth::enabled())->toBeFalse();
});
