<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Meta Marketing API (env-driven, never invent IDs)
    |--------------------------------------------------------------------------
    |
    | Empty credentials render a clear "not connected" state. Live OAuth /
    | Embedded Signup (Tech Provider) is later work.
    |
    */

    'app_id' => env('META_APP_ID'),

    'app_secret' => env('META_APP_SECRET'),

    'access_token' => env('META_ACCESS_TOKEN'),

    'ad_account_id' => env('META_AD_ACCOUNT_ID'),

    'graph_version' => env('META_GRAPH_VERSION', 'v21.0'),

    'lead_ingest_token' => env('META_LEAD_INGEST_TOKEN'),

];
