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

];
