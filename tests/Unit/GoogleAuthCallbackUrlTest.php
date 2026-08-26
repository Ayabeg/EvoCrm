<?php

namespace Tests\Unit;

use App\Support\GoogleAuth;
use Tests\TestCase;

class GoogleAuthCallbackUrlTest extends TestCase
{
    public function test_empty_redirect_env_resolves_against_app_url_not_the_request(): void
    {
        config()->set('app.url', 'https://crm.evotechly.com');
        config()->set('services.google.redirect', '');

        $this->assertSame(
            'https://crm.evotechly.com/auth/google/callback',
            GoogleAuth::callbackUrl(),
        );
        $this->assertSame(
            'https://crm.evotechly.com',
            GoogleAuth::javascriptOrigin(),
        );
    }

    public function test_relative_redirect_is_resolved_against_app_url(): void
    {
        config()->set('app.url', 'https://crm.evotechly.com');
        config()->set('services.google.redirect', '/auth/google/callback');

        $this->assertSame(
            'https://crm.evotechly.com/auth/google/callback',
            GoogleAuth::callbackUrl(),
        );
    }

    public function test_absolute_redirect_is_used_as_configured(): void
    {
        config()->set('app.url', 'http://localhost:8000');
        config()->set(
            'services.google.redirect',
            'https://crm.evotechly.com/auth/google/callback',
        );

        $this->assertSame(
            'https://crm.evotechly.com/auth/google/callback',
            GoogleAuth::callbackUrl(),
        );
        $this->assertSame(
            'https://crm.evotechly.com',
            GoogleAuth::javascriptOrigin(),
        );
    }

    public function test_local_app_url_keeps_the_dev_port_on_the_javascript_origin(): void
    {
        config()->set('app.url', 'http://localhost:8000');
        config()->set('services.google.redirect', '');

        $this->assertSame(
            'http://localhost:8000/auth/google/callback',
            GoogleAuth::callbackUrl(),
        );
        $this->assertSame(
            'http://localhost:8000',
            GoogleAuth::javascriptOrigin(),
        );
    }
}
