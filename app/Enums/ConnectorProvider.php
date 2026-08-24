<?php

namespace App\Enums;

enum ConnectorProvider: string
{
    case WhatsAppCloud = 'whatsapp_cloud';
    case Instagram = 'instagram';
    case FacebookMessenger = 'facebook_messenger';
    case Gmail = 'gmail';
    case GoogleCalendar = 'google_calendar';

    /**
     * Official Desk channels only. Never Baileys, QR, or Telegram.
     *
     * @return list<self>
     */
    public static function desk(): array
    {
        return [
            self::WhatsAppCloud,
            self::Instagram,
            self::FacebookMessenger,
        ];
    }

    /**
     * @return list<string>
     */
    public static function deskValues(): array
    {
        return array_map(fn (self $provider) => $provider->value, self::desk());
    }

    /**
     * @return list<self>
     */
    public static function google(): array
    {
        return [
            self::Gmail,
            self::GoogleCalendar,
        ];
    }

    /**
     * @return list<string>
     */
    public static function googleValues(): array
    {
        return array_map(fn (self $provider) => $provider->value, self::google());
    }

    public function isDesk(): bool
    {
        return in_array($this, self::desk(), true);
    }

    public function isGoogle(): bool
    {
        return in_array($this, self::google(), true);
    }

    public function label(): string
    {
        return match ($this) {
            self::WhatsAppCloud => 'WhatsApp Cloud',
            self::Instagram => 'Instagram',
            self::FacebookMessenger => 'Messenger',
            self::Gmail => 'Gmail',
            self::GoogleCalendar => 'Google Calendar',
        };
    }

    public function tagline(): string
    {
        return match ($this) {
            self::WhatsAppCloud => 'Official WhatsApp Cloud API through Evolution Cloud. Never QR, Baileys, or linked devices.',
            self::Instagram => 'Official Instagram messaging. Needs a Meta Business token — no unofficial inbox.',
            self::FacebookMessenger => 'Official Facebook Messenger. Needs a Meta Page token — no unofficial inbox.',
            self::Gmail => 'Read Gmail on the existing Google OAuth client. EvoSales does not send mail from this connector.',
            self::GoogleCalendar => 'Calendar on the existing Google OAuth client. Sign-in with Google stays unchanged.',
        };
    }

    public function intent(): string
    {
        return match ($this) {
            self::WhatsAppCloud => 'desk_whatsapp_cloud',
            self::Instagram => 'desk_instagram',
            self::FacebookMessenger => 'desk_messenger',
            self::Gmail => 'gmail',
            self::GoogleCalendar => 'google_calendar',
        };
    }
}
