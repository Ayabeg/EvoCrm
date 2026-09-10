<?php

return [

    /*
    | Algeria-first SMS. Default is a local HTTP aggregator (SMSMode-style or
    | generic POST). Twilio stays opt-in via SMS_DRIVER=twilio.
    */
    'driver' => env('SMS_DRIVER', 'http'),

    'sender' => env('SMS_SENDER', 'EVOTECHLY'),

    'http' => [
        'url' => env('SMS_HTTP_URL'),
        'method' => strtoupper((string) env('SMS_HTTP_METHOD', 'POST')),
        'key' => env('SMS_HTTP_KEY'),
        'auth' => env('SMS_HTTP_AUTH', 'form'),
        'fields' => [
            'to' => env('SMS_HTTP_FIELD_TO', 'to'),
            'message' => env('SMS_HTTP_FIELD_MESSAGE', 'message'),
            'sender' => env('SMS_HTTP_FIELD_SENDER', 'sender'),
            'api_key' => env('SMS_HTTP_FIELD_KEY', 'api_key'),
        ],
    ],

];
