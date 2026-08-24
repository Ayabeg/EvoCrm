<?php

namespace App\Enums;

enum ConnectorStatus: string
{
    case NotConnected = 'not_connected';
    case NeedsToken = 'needs_token';
    case NeedsReconnect = 'needs_reconnect';
    case Connected = 'connected';
}
