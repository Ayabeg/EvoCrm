<?php

namespace App\Support;

class GoogleAuth
{
    /**
     * Google sign-in is available only when the OAuth client is configured;
     * otherwise the button stays hidden and the routes 404.
     */
    public static function enabled(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'));
    }
}
