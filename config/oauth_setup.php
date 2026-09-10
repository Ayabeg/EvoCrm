<?php

return [

    'meta' => [
        'name' => 'Meta',
        'tagline' => 'Facebook, Instagram, WhatsApp Cloud, and Ads — one OAuth grant.',
        'steps' => [
            [
                'key' => 'select_app',
                'label' => 'Select app',
                'title' => 'Choose Meta for your channels',
            ],
            [
                'key' => 'connect',
                'label' => 'Connect Facebook',
                'title' => 'Sign in with Facebook',
            ],
            [
                'key' => 'finish',
                'label' => 'Finish setup',
                'title' => 'Verify and go live',
            ],
        ],
        'troubleshooting' => [
            [
                'label' => 'Meta App Dashboard',
                'href' => 'https://developers.facebook.com/apps/',
            ],
            [
                'label' => 'Facebook Login redirect URI docs',
                'href' => 'https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow',
            ],
            [
                'label' => 'WhatsApp Cloud API setup',
                'href' => 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
            ],
        ],
    ],

    'start' => [
        'name' => 'your workspace',
        'tagline' => 'Google Calendar, WhatsApp, then the Algeria SMS key. Same wizard as Meta.',
        'steps' => [
            [
                'key' => 'google',
                'label' => 'Google Calendar',
                'title' => 'Connect Google Calendar',
            ],
            [
                'key' => 'whatsapp',
                'label' => 'WhatsApp',
                'title' => 'Connect WhatsApp',
            ],
            [
                'key' => 'sms',
                'label' => 'SMS',
                'title' => 'Paste the Algeria SMS key',
            ],
            [
                'key' => 'finish',
                'label' => 'Finish',
                'title' => 'You are ready to sell',
            ],
        ],
        'troubleshooting' => [
            [
                'label' => 'Google Calendar scopes',
                'href' => 'https://developers.google.com/calendar/api/guides/overview',
            ],
            [
                'label' => 'WhatsApp Cloud API setup',
                'href' => 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
            ],
        ],
    ],

];
