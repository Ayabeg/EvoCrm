<?php

namespace App\Enums;

enum ChannelType: string
{
    case WhatsAppCloud = 'whatsapp_cloud';
    case Email = 'email';
    case Telegram = 'telegram';
    case Sms = 'sms';
}
