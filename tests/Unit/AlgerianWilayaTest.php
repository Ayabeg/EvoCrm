<?php

use App\Support\AlgerianWilaya;

it('normalizes Algeria wilaya aliases to the CRM spelling', function () {
    expect(AlgerianWilaya::normalize('Algiers'))->toBe('Alger')
        ->and(AlgerianWilaya::normalize('setif'))->toBe('Sétif')
        ->and(AlgerianWilaya::normalize('Bejaia'))->toBe('Béjaïa')
        ->and(AlgerianWilaya::normalize('16'))->toBe('Alger');
});

it('extracts a wilaya from a Places address without inventing one', function () {
    expect(AlgerianWilaya::extract('Hydra, Alger, Algeria'))->toBe('Alger')
        ->and(AlgerianWilaya::extract('Somewhere, France'))->toBeNull();
});
