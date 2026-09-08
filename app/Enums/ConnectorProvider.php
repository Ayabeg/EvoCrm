<?php

namespace App\Enums;

enum ConnectorProvider: string
{
    case WhatsApp = 'whatsapp';
    case WhatsAppCloud = 'whatsapp_cloud';
    case Instagram = 'instagram';
    case FacebookMessenger = 'facebook_messenger';
    case Gmail = 'gmail';
    case GoogleCalendar = 'google_calendar';

    /**
     * Official Desk channels. WhatsApp + WhatsApp Business go through
     * Evolution API. Instagram and Messenger stay on Meta.
     *
     * @return list<self>
     */
    public static function desk(): array
    {
        return [
            self::WhatsApp,
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
            self::WhatsApp => 'WhatsApp',
            self::WhatsAppCloud => 'WhatsApp Business',
            self::Instagram => 'Instagram',
            self::FacebookMessenger => 'Messenger',
            self::Gmail => 'Gmail',
            self::GoogleCalendar => 'Google Calendar',
        };
    }

    public function tagline(): string
    {
        return match ($this) {
            self::WhatsApp => 'Continue with Facebook. Evolution connects WhatsApp automatically.',
            self::WhatsAppCloud => 'Continue with Facebook. Evolution creates the WhatsApp Business Cloud instance.',
            self::Instagram => 'Official Instagram messaging. Needs a Meta Business token — no unofficial inbox.',
            self::FacebookMessenger => 'Official Facebook Messenger. Needs a Meta Page token — no unofficial inbox.',
            self::Gmail => 'Continue with Google to read Gmail. Same sign-in client — login is unchanged.',
            self::GoogleCalendar => 'Continue with Google to read Calendar. Same sign-in client — login is unchanged.',
        };
    }

    public function intent(): string
    {
        return match ($this) {
            self::WhatsApp => 'desk_whatsapp',
            self::WhatsAppCloud => 'desk_whatsapp_cloud',
            self::Instagram => 'desk_instagram',
            self::FacebookMessenger => 'desk_messenger',
            self::Gmail => 'gmail',
            self::GoogleCalendar => 'google_calendar',
        };
    }
}
