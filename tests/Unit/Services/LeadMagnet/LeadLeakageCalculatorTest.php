<?php

use App\Services\LeadMagnet\LeadLeakageCalculator;

it('calculates sequential leakage without double-counting inquiries', function () {
    $result = (new LeadLeakageCalculator)->calculate([
        'monthly_inquiries' => 100,
        'average_customer_value' => 1000,
        'inquiry_to_customer_rate' => 20,
        'missed_inquiry_rate' => 10,
        'delayed_response_rate' => 20,
        'follow_up_dropoff_rate' => 25,
    ]);

    expect($result['version'])->toBe('lead-leakage-v1')
        ->and($result['stages'][0]['lost_inquiries'])->toBe(10.0)
        ->and($result['stages'][1]['lost_inquiries'])->toBe(18.0)
        ->and($result['stages'][2]['lost_inquiries'])->toBe(18.0)
        ->and($result['total_lost_inquiries'])->toBe(46.0)
        ->and($result['leakage_rate_percent'])->toBe(46.0)
        ->and($result['expected_customers_lost'])->toBe(9.2)
        ->and($result['estimated_revenue_at_risk'])->toBe(9200.0)
        ->and($result['estimated_revenue_retained_after_process_improvement'])->toBe(10800.0);
});

it('accepts numeric form values and handles zero inquiries without division errors', function () {
    $result = (new LeadLeakageCalculator)->calculate([
        'monthly_inquiries' => '0',
        'average_customer_value' => '2500.50',
        'inquiry_to_customer_rate' => '30',
        'missed_inquiry_rate' => '100',
        'delayed_response_rate' => '100',
        'follow_up_dropoff_rate' => '100',
    ]);

    expect($result['monthly_inquiries'])->toBe(0)
        ->and($result['total_lost_inquiries'])->toBe(0.0)
        ->and($result['leakage_rate_percent'])->toBe(0.0)
        ->and($result['estimated_revenue_at_risk'])->toBe(0.0);
});

it('rejects missing, negative, fractional-count, and out-of-range inputs', function (array $input, string $message) {
    expect(fn () => (new LeadLeakageCalculator)->calculate($input))
        ->toThrow(InvalidArgumentException::class, $message);
})->with([
    'missing field' => [[], 'monthly_inquiries must be numeric.'],
    'negative count' => [['monthly_inquiries' => -1], 'monthly_inquiries must be zero or greater.'],
    'fractional count' => [['monthly_inquiries' => 1.5], 'monthly_inquiries must be a whole number.'],
    'rate too high' => [[
        'monthly_inquiries' => 1,
        'average_customer_value' => 1,
        'inquiry_to_customer_rate' => 101,
        'missed_inquiry_rate' => 0,
        'delayed_response_rate' => 0,
        'follow_up_dropoff_rate' => 0,
    ], 'inquiry_to_customer_rate must be between 0 and 100.'],
]);
