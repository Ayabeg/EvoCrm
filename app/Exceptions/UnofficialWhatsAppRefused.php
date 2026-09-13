<?php

namespace App\Exceptions;

use RuntimeException;

final class UnofficialWhatsAppRefused extends RuntimeException
{
    public static function because(string $reason = 'Baileys / QR / Linked-devices'): self
    {
        return new self(
            'EvoCrm connects WhatsApp only through Evolution API '
            .'(WHATSAPP-BAILEYS or WHATSAPP-BUSINESS). OpenWA and linked-device '
            .'takeovers are refused ('.$reason.').'
        );
    }
}
