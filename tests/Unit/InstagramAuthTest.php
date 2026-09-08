<?php

use App\Support\InstagramAuth;
use Tests\TestCase;

uses(TestCase::class);

it('builds the official Instagram Authorization Window URL', function () {
    config()->set('meta.instagram_app_id', '990602627938098');
    config()->set('meta.instagram_app_secret', 'secret');
    config()->set('meta.instagram_redirect_uri', 'https://crm.evotechly.com/auth/instagram/callback');

    $url = InstagramAuth::authorizeUrl('csrf-state-1');

    expect($url)->toStartWith('https://www.instagram.com/oauth/authorize?')
        ->and($url)->toContain('client_id=990602627938098')
        ->and($url)->toContain('response_type=code')
        ->and($url)->toContain(rawurlencode('https://crm.evotechly.com/auth/instagram/callback'))
        ->and($url)->toContain('instagram_business_basic')
        ->and($url)->toContain('state=csrf-state-1');
});

it('strips the hash fragment Meta appends to the authorization code', function () {
    expect(InstagramAuth::normalizeCode('AQBx-hBsH3...#_'))->toBe('AQBx-hBsH3...')
        ->and(InstagramAuth::normalizeCode('AQBx-hBsH3...'))->toBe('AQBx-hBsH3...');
});

it('is disabled when Instagram app credentials are empty', function () {
    config()->set('meta.instagram_app_id', null);
    config()->set('meta.instagram_app_secret', null);
    config()->set('meta.app_id', null);
    config()->set('meta.app_secret', null);

    expect(InstagramAuth::enabled())->toBeFalse();
});
