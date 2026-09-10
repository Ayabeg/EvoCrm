<?php

use App\Support\AlgerianPhone;

it('normalizes local Algerian mobiles to E.164', function () {
    expect(AlgerianPhone::normalize('055 01 88 001'))->toBe('+213550188001')
        ->and(AlgerianPhone::normalize('0660188001'))->toBe('+213660188001')
        ->and(AlgerianPhone::normalize('0770188001'))->toBe('+213770188001');
});

it('recognizes Ooredoo, Mobilis, and Djezzy mobiles', function () {
    expect(AlgerianPhone::isMobile('0550188001'))->toBeTrue()
        ->and(AlgerianPhone::operator('0550188001'))->toBe('ooredoo')
        ->and(AlgerianPhone::isMobile('0660188001'))->toBeTrue()
        ->and(AlgerianPhone::operator('0660188001'))->toBe('mobilis')
        ->and(AlgerianPhone::isMobile('0770188001'))->toBeTrue()
        ->and(AlgerianPhone::operator('0770188001'))->toBe('djezzy');
});

it('rejects Algerian landlines and foreign numbers', function () {
    expect(AlgerianPhone::isMobile('021234567'))->toBeFalse()
        ->and(AlgerianPhone::operator('021234567'))->toBeNull()
        ->and(AlgerianPhone::isMobile('+33123456789'))->toBeFalse()
        ->and(AlgerianPhone::isMobile(null))->toBeFalse()
        ->and(AlgerianPhone::isMobile(''))->toBeFalse();
});
