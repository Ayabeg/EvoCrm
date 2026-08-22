<?php

namespace App\Exceptions;

use RuntimeException;

final class UnofficialWhatsAppRefused extends RuntimeException
{
    public static function because(string $reason = 'Baileys / QR / Linked-devices'): self
    {
        return new self(
            'EvoSales refuses unofficial WhatsApp connections ('.$reason.'). '
            .'WhatsApp Cloud API via Evolution (WHATSAPP-BUSINESS) is the only supported path.'
        );
    }
}
